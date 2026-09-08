/**
 * Cloud-Native Library Management System (LMS)
 * User Profile & Account Management Service
 *
 * Governed by Phase 1 (FR-USER-001, FR-USER-002, FR-ADMIN-005), Phase 4 Section 12.2,
 * and Phase 6 Section 9.3 (Password Change & Account Suspension Session Invalidation).
 */

import { IUserService } from './user.service.interface';
import { ChangePasswordDto, UpdateUserStatusDto } from '../schemas/user.schema';
import { AuthUserContext, IUser, IUserPublic, UserRole, UserStatus } from '../types/user.types';
import { IUserRepository } from '../repositories/user.repository.interface';
import { ISessionRepository } from '../repositories/session.repository.interface';
import { ITransactionManager } from '../repositories/transaction.manager.interface';
import { userRepository, sessionRepository, transactionManager } from '../repositories';
import { IPasswordService, passwordService } from '../utils/password.service';
import { IAuditService } from './audit.service.interface';
import { auditService } from './audit.service';
import { AuditAction, AuditActorRole, AuditEntityType } from '../types/audit.types';
import { AuthenticationError, NotFoundError } from '../utils/error';

export class UserService implements IUserService {
  private readonly userRepo: IUserRepository;
  private readonly sessionRepo: ISessionRepository;
  private readonly txManager: ITransactionManager;
  private readonly passService: IPasswordService;
  private readonly audit: IAuditService;

  constructor(
    userRepo: IUserRepository = userRepository,
    sessionRepo: ISessionRepository = sessionRepository,
    txManager: ITransactionManager = transactionManager,
    passService: IPasswordService = passwordService,
    audit: IAuditService = auditService,
  ) {
    this.userRepo = userRepo;
    this.sessionRepo = sessionRepo;
    this.txManager = txManager;
    this.passService = passService;
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
   * Retrieves user profile details and current active loan count.
   */
  public async getProfile(userId: string): Promise<IUserPublic> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User account not found', 'ERR-RES-NOT-FOUND');
    }

    return this.toPublic(user);
  }

  /**
   * Changes the patron password and revokes all active sessions in a Multi-Doc ACID Tx.
   */
  public async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User account not found', 'ERR-RES-NOT-FOUND');
    }

    const isMatch = await this.passService.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AuthenticationError(
        'Current password verification failed',
        'ERR-AUTH-INVALID-CREDENTIALS',
      );
    }

    const newHash = await this.passService.hash(dto.newPassword);

    await this.txManager.withTransaction(async (session) => {
      await this.userRepo.updatePassword(userId, newHash, session);

      // Invalidate all active session tokens on all devices
      await this.sessionRepo.revokeAllByUserId(userId, session);

      await this.audit.logEvent(
        {
          action: 'USER_PASSWORD_CHANGED',
          actorId: userId,
          actorRole: user.role === UserRole.ADMIN ? AuditActorRole.ADMIN : AuditActorRole.PATRON,
          entityType: AuditEntityType.USER,
          entityId: userId,
          ipAddress: '127.0.0.1',
          metadata: { email: user.email },
        },
        session,
      );
    });
  }

  /**
   * Administratively toggles user status between ACTIVE and SUSPENDED.
   * If SUSPENDED, revokes all active session tokens in a Multi-Doc ACID Tx with audit log.
   */
  public async updateUserStatus(
    userId: string,
    dto: UpdateUserStatusDto,
    actorContext: AuthUserContext,
  ): Promise<IUserPublic> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User account not found', 'ERR-RES-NOT-FOUND');
    }

    let updatedUser: IUser | null = null;

    await this.txManager.withTransaction(async (session) => {
      updatedUser = await this.userRepo.updateStatus(userId, dto.status, session);

      if (dto.status === UserStatus.SUSPENDED) {
        // Immediate termination of active sessions upon account suspension
        await this.sessionRepo.revokeAllByUserId(userId, session);
      }

      await this.audit.logEvent(
        {
          action: AuditAction.USER_STATUS_UPDATED,
          actorId: actorContext.id,
          actorRole: actorContext.role,
          entityType: AuditEntityType.USER,
          entityId: userId,
          ipAddress: '127.0.0.1',
          metadata: {
            previousStatus: user.status,
            newStatus: dto.status,
            reason: dto.reason || 'Administrative status adjustment',
          },
        },
        session,
      );
    });

    if (!updatedUser) {
      throw new Error('Failed to update user status in transaction');
    }

    return this.toPublic(updatedUser);
  }
}

export const userService = new UserService();
