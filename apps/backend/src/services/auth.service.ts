/**
 * Cloud-Native Library Management System (LMS)
 * Authentication Service Implementation
 *
 * Governed by Phase 1 (FR-AUTH-001 to FR-AUTH-004), Phase 4 Section 12.1,
 * Phase 6 Section 8 & Section 9 (Token Family Rotation & Replay Detection).
 */

import crypto from 'crypto';
import { IAuthService, LoginResult, RefreshResult } from './auth.service.interface';
import { RegisterUserDto, LoginUserDto } from '../schemas/auth.schema';
import { IUser, IUserPublic, UserRole, UserStatus } from '../types/user.types';
import { IUserRepository } from '../repositories/user.repository.interface';
import { ISessionRepository } from '../repositories/session.repository.interface';
import { userRepository, sessionRepository } from '../repositories';
import { IPasswordService, passwordService } from '../utils/password.service';
import { IJwtService, jwtService } from '../utils/jwt.service';
import { IAuditService } from './audit.service.interface';
import { auditService } from './audit.service';
import { AuditAction, AuditActorRole, AuditEntityType } from '../types/audit.types';
import { AuthenticationError, ConflictError, ForbiddenError } from '../utils/error';

export class AuthService implements IAuthService {
  private readonly userRepo: IUserRepository;
  private readonly sessionRepo: ISessionRepository;
  private readonly passService: IPasswordService;
  private readonly jwt: IJwtService;
  private readonly audit: IAuditService;

  constructor(
    userRepo: IUserRepository = userRepository,
    sessionRepo: ISessionRepository = sessionRepository,
    passService: IPasswordService = passwordService,
    jwt: IJwtService = jwtService,
    audit: IAuditService = auditService,
  ) {
    this.userRepo = userRepo;
    this.sessionRepo = sessionRepo;
    this.passService = passService;
    this.jwt = jwt;
    this.audit = audit;
  }

  private toPublic(user: IUser): IUserPublic {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      status: user.status,
      activeBorrowCount: user.activeBorrowCount,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt,
    };
  }

  /**
   * Registers a new patron account with default ROLE_PATRON and ACTIVE status.
   * Enforces email uniqueness and secure bcrypt hashing.
   */
  public async register(dto: RegisterUserDto): Promise<IUserPublic> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const existingUser = await this.userRepo.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictError(
        'An account with this email address already exists in the system',
        'ERR-AUTH-DUPLICATE-EMAIL',
      );
    }

    const passwordHash = await this.passService.hash(dto.password);

    const createdUser = await this.userRepo.create({
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email: normalizedEmail,
      passwordHash,
      role: UserRole.PATRON,
      status: UserStatus.ACTIVE,
      activeBorrowCount: 0,
      phoneNumber: dto.phoneNumber?.trim() || null,
    });

    await this.audit.logEvent({
      action: 'USER_REGISTERED',
      actorId: createdUser.id,
      actorRole: AuditActorRole.PATRON,
      entityType: AuditEntityType.USER,
      entityId: createdUser.id,
      ipAddress: '127.0.0.1',
      metadata: { email: createdUser.email, role: createdUser.role },
    });

    return this.toPublic(createdUser);
  }

  /**
   * Authenticates user credentials, equalizing execution timing via dummy bcrypt comparisons
   * on non-existent emails to resist timing-based user enumeration.
   */
  public async login(dto: LoginUserDto): Promise<LoginResult> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const user = await this.userRepo.findByEmail(normalizedEmail);

    if (!user) {
      // Execute constant-time dummy comparison to defeat email enumeration timing attacks
      await this.passService.dummyCompare();
      throw new AuthenticationError('Invalid email or password', 'ERR-AUTH-INVALID-CREDENTIALS');
    }

    const isMatch = await this.passService.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new AuthenticationError('Invalid email or password', 'ERR-AUTH-INVALID-CREDENTIALS');
    }

    // Generate initial session family ID
    const familyId = crypto.randomUUID();
    const { rawToken, tokenHash } = this.jwt.generateRefreshToken();

    // 7-day refresh session expiration
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const session = await this.sessionRepo.create({
      userId: user.id,
      tokenHash,
      familyId,
      expiresAt,
    });

    // 15-minute JWT access token
    const accessToken = this.jwt.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      sessionId: session.id,
    });

    await this.audit.logEvent({
      action: 'AUTH_LOGIN_SUCCESS',
      actorId: user.id,
      actorRole: user.role === UserRole.ADMIN ? AuditActorRole.ADMIN : AuditActorRole.PATRON,
      entityType: AuditEntityType.SESSION,
      entityId: session.id,
      ipAddress: '127.0.0.1',
      metadata: { email: user.email, status: user.status },
    });

    return {
      tokens: {
        accessToken,
        tokenType: 'Bearer',
        expiresIn: 900,
        user: this.toPublic(user),
      },
      rawRefreshToken: rawToken,
    };
  }

  /**
   * Revokes the active refresh token session.
   */
  public async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    const tokenHash = this.jwt.hashToken(refreshToken);
    const session = await this.sessionRepo.findByTokenHash(tokenHash);

    if (session && !session.isRevoked) {
      await this.sessionRepo.revokeById(session.id);

      await this.audit.logEvent({
        action: 'AUTH_LOGOUT',
        actorId: session.userId,
        actorRole: AuditActorRole.PATRON,
        entityType: AuditEntityType.SESSION,
        entityId: session.id,
        ipAddress: '127.0.0.1',
        metadata: { familyId: session.familyId },
      });
    }
  }

  /**
   * Rotates a single-use refresh token and issues a new 15-minute access token.
   * If an already-revoked token is presented, REPLAY ATTACK is detected:
   * immediately revokes all sessions in that familyId and throws 401 SESSION_REVOKED.
   */
  public async refresh(refreshToken: string): Promise<RefreshResult> {
    if (!refreshToken) {
      throw new AuthenticationError('Refresh token is required', 'ERR-AUTH-UNAUTHORIZED');
    }

    const tokenHash = this.jwt.hashToken(refreshToken);
    const session = await this.sessionRepo.findByTokenHash(tokenHash);

    if (!session) {
      throw new AuthenticationError('Invalid or expired refresh token', 'ERR-AUTH-INVALID-TOKEN');
    }

    // Intrusion Detection: Token Family Replay Revocation (Decision MADR-06 & Phase 6 Section 9.2)
    if (session.isRevoked) {
      // Invalidate the entire token family immediately
      await this.sessionRepo.revokeFamily(session.familyId);

      await this.audit.logEvent({
        action: AuditAction.SECURITY_ALERT,
        actorId: session.userId,
        actorRole: AuditActorRole.SYSTEM,
        entityType: AuditEntityType.SESSION,
        entityId: session.id,
        ipAddress: '127.0.0.1',
        metadata: {
          securityAlert: 'SECURITY_ALERT_SESSION_REPLAY',
          familyId: session.familyId,
          description:
            'Replay of consumed refresh token detected. Entire token family invalidated.',
        },
      });

      throw new AuthenticationError(
        'Security alert: Refresh token reuse detected. All active sessions in this family have been terminated.',
        'ERR-AUTH-REPLAY-DETECTED',
      );
    }

    // Check expiration
    if (new Date() > session.expiresAt) {
      throw new AuthenticationError(
        'Refresh token has expired: Please log in again',
        'ERR-AUTH-TOKEN-EXPIRED',
      );
    }

    // Verify associated user account
    const user = await this.userRepo.findById(session.userId);
    if (!user) {
      throw new AuthenticationError(
        'User account associated with this session no longer exists',
        'ERR-AUTH-UNAUTHORIZED',
      );
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenError(
        'Patron account is suspended: Access to token refresh is barred',
        'ERR-AUTH-ACCOUNT-SUSPENDED',
      );
    }

    // Consume current token (single-use rotation)
    await this.sessionRepo.revokeById(session.id);

    // Issue successor refresh token in the SAME family
    const { rawToken: newRawToken, tokenHash: newTokenHash } = this.jwt.generateRefreshToken();
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const newSession = await this.sessionRepo.create({
      userId: user.id,
      tokenHash: newTokenHash,
      familyId: session.familyId,
      expiresAt: newExpiresAt,
    });

    // Issue new 15-minute access token
    const newAccessToken = this.jwt.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      sessionId: newSession.id,
    });

    return {
      accessToken: newAccessToken,
      expiresIn: 900, // 15 minutes in seconds
      rawRefreshToken: newRawToken,
    };
  }
}

export const authService = new AuthService();
