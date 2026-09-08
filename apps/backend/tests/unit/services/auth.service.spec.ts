import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '@services/auth.service';
import { IUserRepository } from '@repositories/user.repository.interface';
import { ISessionRepository } from '@repositories/session.repository.interface';
import { IPasswordService } from '@utils/password.service';
import { IJwtService } from '@utils/jwt.service';
import { IAuditService } from '@services/audit.service.interface';
import { IUser, UserRole, UserStatus } from '@types/user.types';
import { ISession } from '@models/session.model';
import { ConflictError, AuthenticationError, ForbiddenError } from '@utils/error';

describe('AuthService Unit Tests', () => {
  let mockUserRepo: IUserRepository;
  let mockSessionRepo: ISessionRepository;
  let mockPasswordService: IPasswordService;
  let mockJwtService: IJwtService;
  let mockAuditService: IAuditService;
  let authService: AuthService;

  const mockUser: IUser = {
    id: '64f1a2b3c4d5e6f7a8b9c0d1',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@library.org',
    passwordHash: '$2b$12$hashedPasswordExampleValue1234567890123456789012345678',
    role: UserRole.PATRON,
    status: UserStatus.ACTIVE,
    activeBorrowCount: 0,
    phoneNumber: '+1234567890',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSession: ISession = {
    id: '64f1a2b3c4d5e6f7a8b9c0e1',
    userId: mockUser.id,
    tokenHash: 'hashed-refresh-token',
    familyId: 'family-uuid-1234',
    isRevoked: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockUserRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      update: vi.fn(),
      incrementBorrowCount: vi.fn(),
      decrementBorrowCount: vi.fn(),
      updateStatus: vi.fn(),
      countAll: vi.fn(),
      countByStatus: vi.fn(),
      countByRole: vi.fn(),
    };

    mockSessionRepo = {
      create: vi.fn(),
      findByTokenHash: vi.fn(),
      revokeById: vi.fn(),
      revokeFamily: vi.fn(),
      revokeAllForUser: vi.fn(),
      deleteExpired: vi.fn(),
    };

    mockPasswordService = {
      hash: vi.fn().mockResolvedValue('$2b$12$hashedPassword'),
      compare: vi.fn().mockResolvedValue(true),
      dummyCompare: vi.fn().mockResolvedValue(undefined),
    };

    mockJwtService = {
      generateAccessToken: vi.fn().mockReturnValue('mock.access.token'),
      verifyAccessToken: vi.fn(),
      generateRefreshToken: vi.fn().mockReturnValue({
        rawToken: 'raw-refresh-token-64-hex',
        tokenHash: 'hashed-refresh-token',
      }),
      hashToken: vi.fn().mockReturnValue('hashed-refresh-token'),
    };

    mockAuditService = {
      logEvent: vi.fn().mockResolvedValue(undefined),
      queryLogs: vi.fn().mockResolvedValue({ logs: [], total: 0 }),
    };

    authService = new AuthService(
      mockUserRepo,
      mockSessionRepo,
      mockPasswordService,
      mockJwtService,
      mockAuditService,
    );
  });

  describe('register', () => {
    it('should successfully register a patron and return public DTO (FR-AUTH-001)', async () => {
      vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(null);
      vi.mocked(mockUserRepo.create).mockResolvedValue(mockUser);

      const result = await authService.register({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@library.org',
        password: 'Password123!',
      });

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('jane.doe@library.org');
      expect(mockPasswordService.hash).toHaveBeenCalledWith('Password123!');
      expect(mockUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.PATRON,
          status: UserStatus.ACTIVE,
        }),
      );
      expect(mockAuditService.logEvent).toHaveBeenCalled();
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
    });

    it('should throw ConflictError if email already exists', async () => {
      vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(mockUser);

      await expect(
        authService.register({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane.doe@library.org',
          password: 'Password123!',
        }),
      ).rejects.toThrow(ConflictError);
      expect(mockUserRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should authenticate valid credentials and issue tokens (FR-AUTH-002)', async () => {
      vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordService.compare).mockResolvedValue(true);
      vi.mocked(mockSessionRepo.create).mockResolvedValue(mockSession);

      const result = await authService.login({
        email: 'jane.doe@library.org',
        password: 'Password123!',
      });

      expect(result.tokens.accessToken).toBe('mock.access.token');
      expect(result.rawRefreshToken).toBe('raw-refresh-token-64-hex');
      expect(result.tokens.user.email).toBe(mockUser.email);
      expect(mockAuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'AUTH_LOGIN_SUCCESS' }),
      );
    });

    it('should execute dummyCompare and throw AuthenticationError when user does not exist (anti-enumeration)', async () => {
      vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'unknown@library.org',
          password: 'Password123!',
        }),
      ).rejects.toThrow(AuthenticationError);

      expect(mockPasswordService.dummyCompare).toHaveBeenCalledTimes(1);
      expect(mockPasswordService.compare).not.toHaveBeenCalled();
    });

    it('should throw AuthenticationError on incorrect password', async () => {
      vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordService.compare).mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'jane.doe@library.org',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe('logout', () => {
    it('should revoke active session by token hash', async () => {
      vi.mocked(mockSessionRepo.findByTokenHash).mockResolvedValue(mockSession);

      await authService.logout('raw-token');

      expect(mockSessionRepo.revokeById).toHaveBeenCalledWith(mockSession.id);
      expect(mockAuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'AUTH_LOGOUT' }),
      );
    });

    it('should safely do nothing if empty refresh token is supplied', async () => {
      await authService.logout('');
      expect(mockSessionRepo.findByTokenHash).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should rotate valid refresh token to successor within same family (FR-AUTH-004, BR-005)', async () => {
      vi.mocked(mockSessionRepo.findByTokenHash).mockResolvedValue(mockSession);
      vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser);
      vi.mocked(mockSessionRepo.create).mockResolvedValue({
        ...mockSession,
        id: 'new-session-id',
      });

      const result = await authService.refresh('valid-refresh-token');

      expect(mockSessionRepo.revokeById).toHaveBeenCalledWith(mockSession.id);
      expect(mockSessionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ familyId: mockSession.familyId }),
      );
      expect(result.accessToken).toBe('mock.access.token');
      expect(result.rawRefreshToken).toBe('raw-refresh-token-64-hex');
    });

    it('should detect REPLAY ATTACK, revoke entire family, and throw AuthenticationError (BR-005)', async () => {
      const revokedSession = { ...mockSession, isRevoked: true };
      vi.mocked(mockSessionRepo.findByTokenHash).mockResolvedValue(revokedSession);

      await expect(authService.refresh('replayed-token')).rejects.toThrow(AuthenticationError);

      expect(mockSessionRepo.revokeFamily).toHaveBeenCalledWith(revokedSession.familyId);
      expect(mockAuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            securityAlert: 'SECURITY_ALERT_SESSION_REPLAY',
          }),
        }),
      );
    });

    it('should reject expired refresh token', async () => {
      const expiredSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
      };
      vi.mocked(mockSessionRepo.findByTokenHash).mockResolvedValue(expiredSession);

      await expect(authService.refresh('expired-token')).rejects.toThrow(AuthenticationError);
    });

    it('should reject refresh if user status is SUSPENDED (BR-003)', async () => {
      const suspendedUser = { ...mockUser, status: UserStatus.SUSPENDED };
      vi.mocked(mockSessionRepo.findByTokenHash).mockResolvedValue(mockSession);
      vi.mocked(mockUserRepo.findById).mockResolvedValue(suspendedUser);

      await expect(authService.refresh('valid-token')).rejects.toThrow(ForbiddenError);
    });
  });
});
