import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '@services/user.service';
import { IUserRepository } from '@repositories/user.repository.interface';
import { ISessionRepository } from '@repositories/session.repository.interface';
import { ITransactionManager } from '@repositories/transaction.manager.interface';
import { IPasswordService } from '@utils/password.service';
import { IAuditService } from '@services/audit.service.interface';
import { IUser, UserRole, UserStatus } from '@types/user.types';
import { NotFoundError, AuthenticationError } from '@utils/error';

describe('UserService Unit Tests', () => {
  let mockUserRepo: IUserRepository;
  let mockSessionRepo: ISessionRepository;
  let mockTxManager: ITransactionManager;
  let mockPasswordService: IPasswordService;
  let mockAuditService: IAuditService;
  let userService: UserService;

  const mockUser: IUser = {
    id: '64f1a2b3c4d5e6f7a8b9c0d1',
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice@library.org',
    passwordHash: '$2b$12$currentPasswordHash123456789012345678901234567890',
    role: UserRole.PATRON,
    status: UserStatus.ACTIVE,
    activeBorrowCount: 2,
    phoneNumber: '+1987654321',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockUserRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      update: vi.fn(),
      updatePassword: vi.fn(),
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
      revokeAllByUserId: vi.fn(),
      deleteExpired: vi.fn(),
    };

    mockTxManager = {
      withTransaction: vi.fn().mockImplementation(async (work) => work({})),
    };

    mockPasswordService = {
      hash: vi.fn().mockResolvedValue('$2b$12$newHashedPassword'),
      compare: vi.fn().mockResolvedValue(true),
      dummyCompare: vi.fn().mockResolvedValue(undefined),
    };

    mockAuditService = {
      logEvent: vi.fn().mockResolvedValue(undefined),
      queryLogs: vi.fn().mockResolvedValue({ logs: [], total: 0 }),
    };

    userService = new UserService(
      mockUserRepo,
      mockSessionRepo,
      mockTxManager,
      mockPasswordService,
      mockAuditService,
    );
  });

  describe('getProfile', () => {
    it('should retrieve user profile excluding passwordHash (FR-USER-001)', async () => {
      vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser);

      const profile = await userService.getProfile(mockUser.id);

      expect(mockUserRepo.findById).toHaveBeenCalledWith(mockUser.id);
      expect(profile.id).toBe(mockUser.id);
      expect(profile.email).toBe(mockUser.email);
      expect(profile.activeBorrowCount).toBe(2);
      expect(profile).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundError if user does not exist', async () => {
      vi.mocked(mockUserRepo.findById).mockResolvedValue(null);

      await expect(userService.getProfile('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('changePassword', () => {
    it('should verify current password, update password, and revoke sessions (FR-USER-002)', async () => {
      vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordService.compare).mockResolvedValue(true);

      await userService.changePassword(mockUser.id, {
        currentPassword: 'CurrentPassword123!',
        newPassword: 'NewStrongPassword123!',
      });

      expect(mockPasswordService.compare).toHaveBeenCalledWith(
        'CurrentPassword123!',
        mockUser.passwordHash,
      );
      expect(mockPasswordService.hash).toHaveBeenCalledWith('NewStrongPassword123!');
      expect(mockUserRepo.updatePassword).toHaveBeenCalledWith(
        mockUser.id,
        '$2b$12$newHashedPassword',
        expect.anything(),
      );
      expect(mockSessionRepo.revokeAllByUserId).toHaveBeenCalledWith(
        mockUser.id,
        expect.anything(),
      );
      expect(mockAuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'USER_PASSWORD_CHANGED' }),
        expect.anything(),
      );
    });

    it('should throw AuthenticationError if current password does not match', async () => {
      vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordService.compare).mockResolvedValue(false);

      await expect(
        userService.changePassword(mockUser.id, {
          currentPassword: 'WrongPassword!',
          newPassword: 'NewStrongPassword123!',
        }),
      ).rejects.toThrow(AuthenticationError);

      expect(mockUserRepo.updatePassword).not.toHaveBeenCalled();
      expect(mockSessionRepo.revokeAllByUserId).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError if user does not exist', async () => {
      vi.mocked(mockUserRepo.findById).mockResolvedValue(null);

      await expect(
        userService.changePassword('missing-user-id', {
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateUserStatus', () => {
    it('should administratively suspend user and terminate active sessions (FR-ADMIN-005, INV-05)', async () => {
      vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser);
      const suspendedUser = { ...mockUser, status: UserStatus.SUSPENDED };
      vi.mocked(mockUserRepo.updateStatus).mockResolvedValue(suspendedUser);

      const result = await userService.updateUserStatus(
        mockUser.id,
        { status: UserStatus.SUSPENDED, reason: 'Overdue violation' },
        { id: 'admin-1', email: 'admin@lms.org', role: UserRole.ADMIN, status: UserStatus.ACTIVE },
      );

      expect(mockUserRepo.updateStatus).toHaveBeenCalledWith(
        mockUser.id,
        UserStatus.SUSPENDED,
        expect.anything(),
      );
      expect(mockSessionRepo.revokeAllByUserId).toHaveBeenCalledWith(
        mockUser.id,
        expect.anything(),
      );
      expect(result.status).toBe(UserStatus.SUSPENDED);
    });

    it('should reactivate suspended user without terminating sessions', async () => {
      const suspendedUser = { ...mockUser, status: UserStatus.SUSPENDED };
      vi.mocked(mockUserRepo.findById).mockResolvedValue(suspendedUser);
      const reactivatedUser = { ...mockUser, status: UserStatus.ACTIVE };
      vi.mocked(mockUserRepo.updateStatus).mockResolvedValue(reactivatedUser);

      const result = await userService.updateUserStatus(
        mockUser.id,
        { status: UserStatus.ACTIVE, reason: 'Patron cleared fines' },
        { id: 'admin-1', email: 'admin@lms.org', role: UserRole.ADMIN, status: UserStatus.ACTIVE },
      );

      expect(mockUserRepo.updateStatus).toHaveBeenCalledWith(
        mockUser.id,
        UserStatus.ACTIVE,
        expect.anything(),
      );
      expect(mockSessionRepo.revokeAllByUserId).not.toHaveBeenCalled();
      expect(result.status).toBe(UserStatus.ACTIVE);
    });
  });
});
