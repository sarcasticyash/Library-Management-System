import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { computeOverdueStatus, CirculationStatus } from '@types/circulation.types';
import { CirculationService } from '@services/circulation.service';
import { AdminService } from '@services/admin.service';
import { UserService } from '@services/user.service';
import { IBorrowingRepository } from '@repositories/borrowing.repository.interface';
import { IBookRepository } from '@repositories/book.repository.interface';
import { IUserRepository } from '@repositories/user.repository.interface';
import { ISessionRepository } from '@repositories/session.repository.interface';
import { ITransactionManager } from '@repositories/transaction.manager.interface';
import { IPasswordService } from '@utils/password.service';
import { IAuditService } from '@services/audit.service.interface';
import { UserRole, UserStatus } from '@types/user.types';
import { BookGenre } from '@types/book.types';
import { ConflictError, ForbiddenError } from '@utils/error';

describe('Invariants & Business Rules Master Suite (Phase 8 Section 6, 7, 8)', () => {
  describe('DBD-09: Dynamic Overdue Truth Formula Verification', () => {
    // DBD-09: isOverdue <=> (returnDate == null && now > dueDate)
    const baseNow = new Date('2026-09-08T12:00:00.000Z');

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(baseNow);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('Scenario 1: Loan before due date is NOT overdue', () => {
      const dueDate = new Date('2026-09-15T12:00:00.000Z'); // 7 days in future
      const status = computeOverdueStatus(dueDate, null, baseNow);

      expect(status.isOverdue).toBe(false);
      expect(status.daysRemaining).toBe(7);
    });

    it('Scenario 2: Loan exactly at due date is NOT overdue', () => {
      const dueDate = new Date('2026-09-08T12:00:00.000Z'); // exactly now
      const status = computeOverdueStatus(dueDate, null, baseNow);

      expect(status.isOverdue).toBe(false);
      expect(status.daysRemaining).toBe(0);
    });

    it('Scenario 3: Loan after due date with returnDate = null IS overdue', () => {
      const dueDate = new Date('2026-09-07T12:00:00.000Z'); // 1 day in past
      const status = computeOverdueStatus(dueDate, null, baseNow);

      expect(status.isOverdue).toBe(true);
      expect(status.daysRemaining).toBe(-1);
    });

    it('Scenario 4: Returned loan after due date is NEVER overdue (returned items are cleared)', () => {
      const dueDate = new Date('2026-09-01T12:00:00.000Z');
      const returnDate = new Date('2026-09-05T12:00:00.000Z'); // returned late, but returned
      const status = computeOverdueStatus(dueDate, returnDate, baseNow);

      expect(status.isOverdue).toBe(false);
    });

    it('Scenario 5: Timezone independence - evaluates identical status across UTC and offsets', () => {
      const dueDateUtc = new Date('2026-09-01T00:00:00.000Z');
      const nowUtc = new Date('2026-09-02T00:00:00.000Z');

      const status = computeOverdueStatus(dueDateUtc, null, nowUtc);
      expect(status.isOverdue).toBe(true);
    });
  });

  describe('INV-01: Non-Negative Inventory (0 <= availableCopies <= totalCopies)', () => {
    let mockBookRepo: IBookRepository;
    let mockBorrowingRepo: IBorrowingRepository;
    let mockUserRepo: IUserRepository;
    let mockTxManager: ITransactionManager;
    let mockAuditService: IAuditService;
    let circulationService: CirculationService;

    beforeEach(() => {
      mockBookRepo = {
        create: vi.fn(),
        findById: vi.fn(),
        findByIsbn: vi.fn(),
        update: vi.fn(),
        softDelete: vi.fn(),
        decrementAvailableCopies: vi.fn().mockResolvedValue(null),
        incrementAvailableCopies: vi.fn().mockResolvedValue(null),
        search: vi.fn(),
        countAll: vi.fn(),
        countAvailable: vi.fn(),
      };
      mockBorrowingRepo = {
        create: vi.fn(),
        findById: vi.fn(),
        findActiveByUserId: vi.fn().mockResolvedValue([]),
        findActiveByUserAndBook: vi.fn().mockResolvedValue(null),
        markReturned: vi.fn(),
        findHistoryByUserId: vi.fn(),
        findAllPaginated: vi.fn(),
        countActive: vi.fn(),
        countOverdue: vi.fn(),
        countTotal: vi.fn(),
        countActiveByBookId: vi.fn(),
      };
      mockUserRepo = {
        create: vi.fn(),
        findById: vi.fn().mockResolvedValue({
          id: 'user-1',
          role: UserRole.PATRON,
          status: UserStatus.ACTIVE,
          activeBorrowCount: 0,
        }),
        findByEmail: vi.fn(),
        update: vi.fn(),
        incrementBorrowCount: vi.fn(),
        decrementBorrowCount: vi.fn(),
        incrementActiveBorrowCount: vi.fn(),
        decrementActiveBorrowCount: vi.fn(),
        updateStatus: vi.fn(),
        countAll: vi.fn(),
        countByStatus: vi.fn(),
        countByRole: vi.fn(),
      };
      mockTxManager = {
        withTransaction: vi.fn().mockImplementation(async (work) => work({})),
      };
      mockAuditService = { logEvent: vi.fn().mockResolvedValue(undefined), queryLogs: vi.fn() };

      circulationService = new CirculationService(
        mockBorrowingRepo,
        mockBookRepo,
        mockUserRepo,
        mockTxManager,
        mockAuditService,
      );
    });

    it('should reject checkout when availableCopies is 0 (INV-01 Stock Check)', async () => {
      vi.mocked(mockBookRepo.findById).mockResolvedValue({
        id: 'book-1',
        title: 'Zero Stock Book',
        author: 'Author',
        isbn: '9780000000000',
        genre: BookGenre.TECHNOLOGY,
        description: 'Desc',
        publisher: 'Pub',
        publicationYear: 2024,
        totalCopies: 5,
        availableCopies: 0, // Exhausted
        location: { aisle: 'A', shelf: '1' },
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(circulationService.borrowBook('user-1', { bookId: 'book-1' })).rejects.toThrow(
        ConflictError,
      );
    });
  });

  describe('INV-02: Borrowing Count Consistency (RC-18)', () => {
    let mockBookRepo: IBookRepository;
    let mockBorrowingRepo: IBorrowingRepository;
    let mockUserRepo: IUserRepository;
    let mockTxManager: ITransactionManager;
    let mockAuditService: IAuditService;
    let adminService: AdminService;

    beforeEach(() => {
      mockBookRepo = {
        create: vi.fn(),
        findById: vi.fn(),
        findByIsbn: vi.fn(),
        update: vi.fn(),
        softDelete: vi.fn(),
        decrementAvailableCopies: vi.fn(),
        incrementAvailableCopies: vi.fn(),
        search: vi.fn(),
        countStock: vi.fn(),
        countAll: vi.fn(),
        countAvailable: vi.fn(),
      };
      mockBorrowingRepo = {
        create: vi.fn(),
        findById: vi.fn(),
        findActiveByUserId: vi.fn(),
        findActiveByUserAndBook: vi.fn(),
        markReturned: vi.fn(),
        findHistoryByUserId: vi.fn(),
        findAll: vi.fn(),
        findAllPaginated: vi.fn(),
        countActiveAndOverdue: vi.fn(),
        countActive: vi.fn(),
        countOverdue: vi.fn(),
        countTotal: vi.fn(),
        countActiveByBookId: vi.fn(),
      };
      mockUserRepo = {
        create: vi.fn(),
        findById: vi.fn(),
        findByEmail: vi.fn(),
        update: vi.fn(),
        incrementBorrowCount: vi.fn(),
        decrementBorrowCount: vi.fn(),
        updateStatus: vi.fn(),
        countUsersByStatus: vi.fn(),
        countAll: vi.fn(),
        countByStatus: vi.fn(),
        countByRole: vi.fn(),
      };
      mockTxManager = { withTransaction: vi.fn().mockImplementation(async (w) => w({})) };
      mockAuditService = { logEvent: vi.fn().mockResolvedValue(undefined), queryLogs: vi.fn() };

      adminService = new AdminService(
        mockBookRepo,
        mockBorrowingRepo,
        mockUserRepo,
        mockTxManager,
        mockAuditService,
      );
    });

    it('should block reducing totalCopies below active loans (INV-02, RC-18)', async () => {
      // Book with totalCopies = 5, availableCopies = 2 (3 active loans outstanding)
      vi.mocked(mockBookRepo.findById).mockResolvedValue({
        id: 'book-1',
        title: 'Title',
        author: 'Author',
        isbn: '9780000000000',
        genre: BookGenre.TECHNOLOGY,
        description: 'Desc',
        publisher: 'Pub',
        publicationYear: 2024,
        totalCopies: 5,
        availableCopies: 2, // active loans = 5 - 2 = 3
        location: { aisle: 'A', shelf: '1' },
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Reducing totalCopies to 2 when 3 are on loan must be blocked!
      await expect(
        adminService.updateBook(
          'book-1',
          { totalCopies: 2 },
          { id: 'admin-1', email: 'a@l.org', role: UserRole.ADMIN, status: UserStatus.ACTIVE },
        ),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('INV-03 & INV-04: Single Active Loan & Quota of 5 (BR-01)', () => {
    let mockBookRepo: IBookRepository;
    let mockBorrowingRepo: IBorrowingRepository;
    let mockUserRepo: IUserRepository;
    let mockTxManager: ITransactionManager;
    let mockAuditService: IAuditService;
    let circulationService: CirculationService;

    beforeEach(() => {
      mockBookRepo = {
        create: vi.fn(),
        findById: vi.fn().mockResolvedValue({
          id: 'book-1',
          totalCopies: 5,
          availableCopies: 3,
          isDeleted: false,
        }),
        findByIsbn: vi.fn(),
        update: vi.fn(),
        softDelete: vi.fn(),
        decrementAvailableCopies: vi.fn(),
        incrementAvailableCopies: vi.fn(),
        search: vi.fn(),
        countAll: vi.fn(),
        countAvailable: vi.fn(),
      };
      mockBorrowingRepo = {
        create: vi.fn(),
        findById: vi.fn(),
        findActiveByUserId: vi.fn().mockResolvedValue([]),
        findActiveByUserAndBook: vi.fn().mockResolvedValue(null),
        markReturned: vi.fn(),
        findHistoryByUserId: vi.fn(),
        findAllPaginated: vi.fn(),
        countActive: vi.fn(),
        countOverdue: vi.fn(),
        countTotal: vi.fn(),
        countActiveByBookId: vi.fn(),
      };
      mockUserRepo = {
        create: vi.fn(),
        findById: vi.fn().mockResolvedValue({
          id: 'user-1',
          role: UserRole.PATRON,
          status: UserStatus.ACTIVE,
          activeBorrowCount: 5, // At quota!
        }),
        findByEmail: vi.fn(),
        update: vi.fn(),
        incrementBorrowCount: vi.fn(),
        decrementBorrowCount: vi.fn(),
        incrementActiveBorrowCount: vi.fn(),
        decrementActiveBorrowCount: vi.fn(),
        updateStatus: vi.fn(),
        countAll: vi.fn(),
        countByStatus: vi.fn(),
        countByRole: vi.fn(),
      };
      mockTxManager = { withTransaction: vi.fn().mockImplementation(async (w) => w({})) };
      mockAuditService = { logEvent: vi.fn().mockResolvedValue(undefined), queryLogs: vi.fn() };

      circulationService = new CirculationService(
        mockBorrowingRepo,
        mockBookRepo,
        mockUserRepo,
        mockTxManager,
        mockAuditService,
      );
    });

    it('should reject borrowing when activeBorrowCount >= 5 (INV-04 / BR-01 Quota Exceeded)', async () => {
      await expect(circulationService.borrowBook('user-1', { bookId: 'book-1' })).rejects.toThrow(
        ConflictError,
      );
    });

    it('should reject borrowing duplicate copy of same book while already active (INV-03)', async () => {
      // User with 2 active loans, but one of them is already book-1!
      vi.mocked(mockUserRepo.findById).mockResolvedValue({
        id: 'user-1',
        role: UserRole.PATRON,
        status: UserStatus.ACTIVE,
        activeBorrowCount: 2,
      });
      vi.mocked(mockBorrowingRepo.findActiveByUserAndBook).mockResolvedValue({
        id: 'existing-loan-id',
        userId: 'user-1',
        bookId: 'book-1',
        status: CirculationStatus.ACTIVE,
      });

      await expect(circulationService.borrowBook('user-1', { bookId: 'book-1' })).rejects.toThrow(
        ConflictError,
      );
    });
  });

  describe('INV-05: Account Suspension Behavioral Containment (BR-003)', () => {
    let mockBookRepo: IBookRepository;
    let mockBorrowingRepo: IBorrowingRepository;
    let mockUserRepo: IUserRepository;
    let mockSessionRepo: ISessionRepository;
    let mockTxManager: ITransactionManager;
    let mockPasswordService: IPasswordService;
    let mockAuditService: IAuditService;
    let circulationService: CirculationService;
    let userService: UserService;

    beforeEach(() => {
      mockBookRepo = {
        create: vi.fn(),
        findById: vi.fn().mockResolvedValue({
          id: 'book-1',
          totalCopies: 5,
          availableCopies: 3,
          isDeleted: false,
        }),
        findByIsbn: vi.fn(),
        update: vi.fn(),
        softDelete: vi.fn(),
        decrementAvailableCopies: vi.fn(),
        incrementAvailableCopies: vi.fn(),
        search: vi.fn(),
        countAll: vi.fn(),
        countAvailable: vi.fn(),
      };
      mockBorrowingRepo = {
        create: vi.fn(),
        findById: vi.fn().mockResolvedValue({
          id: 'loan-1',
          userId: 'user-suspended',
          bookId: 'book-1',
          status: CirculationStatus.ACTIVE,
          returnDate: null,
        }),
        findActiveByUserId: vi.fn().mockResolvedValue([]),
        findActiveByUserAndBook: vi.fn().mockResolvedValue(null),
        markReturned: vi.fn().mockResolvedValue({
          id: 'loan-1',
          status: CirculationStatus.RETURNED,
          returnDate: new Date(),
        }),
        findHistoryByUserId: vi.fn(),
        findAllPaginated: vi.fn(),
        countActive: vi.fn(),
        countOverdue: vi.fn(),
        countTotal: vi.fn(),
        countActiveByBookId: vi.fn(),
      };
      mockUserRepo = {
        create: vi.fn(),
        findById: vi.fn().mockResolvedValue({
          id: 'user-suspended',
          role: UserRole.PATRON,
          status: UserStatus.SUSPENDED,
          activeBorrowCount: 1,
        }),
        findByEmail: vi.fn(),
        update: vi.fn(),
        updatePassword: vi.fn(),
        incrementBorrowCount: vi.fn(),
        decrementBorrowCount: vi.fn(),
        incrementActiveBorrowCount: vi.fn(),
        decrementActiveBorrowCount: vi.fn(),
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
      mockTxManager = { withTransaction: vi.fn().mockImplementation(async (w) => w({})) };
      mockPasswordService = {
        hash: vi.fn().mockResolvedValue('newHash'),
        compare: vi.fn().mockResolvedValue(true),
        dummyCompare: vi.fn().mockResolvedValue(undefined),
      };
      mockAuditService = { logEvent: vi.fn().mockResolvedValue(undefined), queryLogs: vi.fn() };

      circulationService = new CirculationService(
        mockBorrowingRepo,
        mockBookRepo,
        mockUserRepo,
        mockTxManager,
        mockAuditService,
      );

      userService = new UserService(
        mockUserRepo,
        mockSessionRepo,
        mockTxManager,
        mockPasswordService,
        mockAuditService,
      );
    });

    it('Action 1: Initiating new checkout is FORBIDDEN for suspended patron (BR-003)', async () => {
      await expect(
        circulationService.borrowBook('user-suspended', { bookId: 'book-1' }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('Action 2: Returning existing borrowed book is PERMITTED for suspended patron (BR-003)', async () => {
      const result = await circulationService.returnBook('loan-1', {
        id: 'user-suspended',
        email: 'suspended@lms.org',
        role: UserRole.PATRON,
        status: UserStatus.SUSPENDED,
      });

      expect(result.status).toBe(CirculationStatus.RETURNED);
    });
  });

  describe('INV-06: Soft-Delete Referential Integrity (BR-004, RC-19)', () => {
    let mockBookRepo: IBookRepository;
    let mockBorrowingRepo: IBorrowingRepository;
    let mockUserRepo: IUserRepository;
    let mockTxManager: ITransactionManager;
    let mockAuditService: IAuditService;
    let adminService: AdminService;

    beforeEach(() => {
      mockBookRepo = {
        create: vi.fn(),
        findById: vi.fn(),
        findByIsbn: vi.fn(),
        update: vi.fn(),
        softDelete: vi.fn(),
        decrementAvailableCopies: vi.fn(),
        incrementAvailableCopies: vi.fn(),
        search: vi.fn(),
        countStock: vi.fn(),
        countAll: vi.fn(),
        countAvailable: vi.fn(),
      };
      mockBorrowingRepo = {
        create: vi.fn(),
        findById: vi.fn(),
        findActiveByUserId: vi.fn(),
        findActiveByUserAndBook: vi.fn(),
        markReturned: vi.fn(),
        findHistoryByUserId: vi.fn(),
        findAll: vi.fn(),
        findAllPaginated: vi.fn(),
        countActiveAndOverdue: vi.fn(),
        countActive: vi.fn(),
        countOverdue: vi.fn(),
        countTotal: vi.fn(),
        countActiveByBookId: vi.fn(),
      };
      mockUserRepo = {
        create: vi.fn(),
        findById: vi.fn(),
        findByEmail: vi.fn(),
        update: vi.fn(),
        incrementBorrowCount: vi.fn(),
        decrementBorrowCount: vi.fn(),
        updateStatus: vi.fn(),
        countUsersByStatus: vi.fn(),
        countAll: vi.fn(),
        countByStatus: vi.fn(),
        countByRole: vi.fn(),
      };
      mockTxManager = { withTransaction: vi.fn().mockImplementation(async (w) => w({})) };
      mockAuditService = { logEvent: vi.fn().mockResolvedValue(undefined), queryLogs: vi.fn() };

      adminService = new AdminService(
        mockBookRepo,
        mockBorrowingRepo,
        mockUserRepo,
        mockTxManager,
        mockAuditService,
      );
    });

    it('should block deactivating book with active loans outstanding (INV-06, BR-004, RC-19)', async () => {
      vi.mocked(mockBookRepo.findById).mockResolvedValue({
        id: 'book-with-loans',
        title: 'Title',
        author: 'Author',
        isbn: '9780000000000',
        genre: BookGenre.TECHNOLOGY,
        description: 'Desc',
        publisher: 'Pub',
        publicationYear: 2024,
        totalCopies: 5,
        availableCopies: 4, // 1 loan outstanding!
        location: { aisle: 'A', shelf: '1' },
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        adminService.deactivateBook('book-with-loans', {
          id: 'admin-1',
          email: 'admin@lms.org',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        }),
      ).rejects.toThrow(ConflictError);

      expect(mockBookRepo.softDelete).not.toHaveBeenCalled();
    });
  });
});
