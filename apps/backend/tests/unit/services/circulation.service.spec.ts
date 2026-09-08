import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CirculationService } from '@services/circulation.service';
import { IBorrowingRepository } from '@repositories/borrowing.repository.interface';
import { IBookRepository } from '@repositories/book.repository.interface';
import { IUserRepository } from '@repositories/user.repository.interface';
import { ITransactionManager } from '@repositories/transaction.manager.interface';
import { IAuditService } from '@services/audit.service.interface';
import { IUser, UserRole, UserStatus } from '@types/user.types';
import { IBook, BookGenre } from '@types/book.types';
import { IBorrowing, CirculationStatus } from '@types/circulation.types';
import { ConflictError, ForbiddenError, NotFoundError } from '@utils/error';

describe('CirculationService Unit Tests', () => {
  let mockBorrowingRepo: IBorrowingRepository;
  let mockBookRepo: IBookRepository;
  let mockUserRepo: IUserRepository;
  let mockTxManager: ITransactionManager;
  let mockAuditService: IAuditService;
  let circulationService: CirculationService;

  const patronId = '64f1a2b3c4d5e6f7a8b9c0d1';
  const bookId = '64f1a2b3c4d5e6f7a8b9c0d2';
  const borrowingId = '64f1a2b3c4d5e6f7a8b9c0d3';

  const mockPatron: IUser = {
    id: patronId,
    firstName: 'John',
    lastName: 'Patron',
    email: 'patron@library.org',
    passwordHash: 'hash',
    role: UserRole.PATRON,
    status: UserStatus.ACTIVE,
    activeBorrowCount: 2,
    phoneNumber: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBook: IBook = {
    id: bookId,
    title: 'Domain-Driven Design',
    author: 'Eric Evans',
    isbn: '9780321125217',
    genre: BookGenre.SOFTWARE_ENGINEERING,
    description: 'Tackling Complexity in the Heart of Software',
    publisher: 'Addison-Wesley',
    publicationYear: 2003,
    totalCopies: 5,
    availableCopies: 2,
    location: { aisle: 'B-1', shelf: 'S-03' },
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBorrowing: IBorrowing = {
    id: borrowingId,
    userId: patronId,
    bookId,
    borrowDate: new Date('2026-09-01T10:00:00.000Z'),
    dueDate: new Date('2026-09-15T10:00:00.000Z'),
    returnDate: null,
    status: CirculationStatus.ACTIVE,
    returnedBy: null,
    adminReturnRemarks: null,
    createdAt: new Date('2026-09-01T10:00:00.000Z'),
    updatedAt: new Date('2026-09-01T10:00:00.000Z'),
  };

  beforeEach(() => {
    mockBorrowingRepo = {
      create: vi.fn().mockResolvedValue(mockBorrowing),
      findById: vi.fn(),
      findActiveByUserId: vi.fn().mockResolvedValue([]),
      findActiveByUserAndBook: vi.fn().mockResolvedValue(null),
      markReturned: vi.fn().mockResolvedValue({
        ...mockBorrowing,
        status: CirculationStatus.RETURNED,
        returnDate: new Date(),
      }),
      findHistoryByUserId: vi.fn().mockResolvedValue({
        data: [mockBorrowing],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }),
      findAllPaginated: vi.fn(),
      countActive: vi.fn().mockResolvedValue(0),
      countOverdue: vi.fn().mockResolvedValue(0),
      countTotal: vi.fn().mockResolvedValue(0),
      countActiveByBookId: vi.fn().mockResolvedValue(0),
    };

    mockBookRepo = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue(mockBook),
      findByIsbn: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      decrementAvailableCopies: vi.fn().mockResolvedValue(mockBook),
      incrementAvailableCopies: vi.fn().mockResolvedValue(mockBook),
      search: vi.fn(),
      countAll: vi.fn(),
      countAvailable: vi.fn(),
    };

    mockUserRepo = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue(mockPatron),
      findByEmail: vi.fn(),
      update: vi.fn(),
      updatePassword: vi.fn(),
      incrementBorrowCount: vi.fn().mockResolvedValue(mockPatron),
      decrementBorrowCount: vi.fn().mockResolvedValue(mockPatron),
      incrementActiveBorrowCount: vi.fn().mockResolvedValue(mockPatron),
      decrementActiveBorrowCount: vi.fn().mockResolvedValue(mockPatron),
      updateStatus: vi.fn(),
      countAll: vi.fn(),
      countByStatus: vi.fn(),
      countByRole: vi.fn(),
    };

    mockTxManager = {
      withTransaction: vi.fn().mockImplementation(async (work) => work({})),
    };

    mockAuditService = {
      logEvent: vi.fn().mockResolvedValue(undefined),
      queryLogs: vi.fn().mockResolvedValue({ logs: [], total: 0 }),
    };

    circulationService = new CirculationService(
      mockBorrowingRepo,
      mockBookRepo,
      mockUserRepo,
      mockTxManager,
      mockAuditService,
    );
  });

  describe('borrowBook', () => {
    it('should successfully borrow a book and decrement inventory (FR-BORROW-001, BR-02)', async () => {
      const result = await circulationService.borrowBook(patronId, { bookId });

      expect(mockBookRepo.decrementAvailableCopies).toHaveBeenCalledWith(bookId, expect.anything());
      expect(mockUserRepo.incrementActiveBorrowCount).toHaveBeenCalledWith(
        patronId,
        expect.anything(),
      );
      expect(mockBorrowingRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: patronId,
          bookId,
          status: CirculationStatus.ACTIVE,
        }),
        expect.anything(),
      );
      expect(mockAuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOAN_CREATED' }),
        expect.anything(),
      );
      expect(result.id).toBe(borrowingId);
    });

    it('should reject borrowing if patron is SUSPENDED (INV-05, BR-003)', async () => {
      vi.mocked(mockUserRepo.findById).mockResolvedValue({
        ...mockPatron,
        status: UserStatus.SUSPENDED,
      });

      await expect(circulationService.borrowBook(patronId, { bookId })).rejects.toThrow(
        ForbiddenError,
      );
      expect(mockBookRepo.decrementAvailableCopies).not.toHaveBeenCalled();
    });

    it('should reject borrowing if patron quota of 5 active loans is reached (INV-04, BR-01)', async () => {
      vi.mocked(mockUserRepo.findById).mockResolvedValue({
        ...mockPatron,
        activeBorrowCount: 5,
      });

      await expect(circulationService.borrowBook(patronId, { bookId })).rejects.toThrow(
        ConflictError,
      );
      expect(mockBookRepo.decrementAvailableCopies).not.toHaveBeenCalled();
    });

    it('should reject borrowing if book available copies is 0 (INV-01)', async () => {
      vi.mocked(mockBookRepo.findById).mockResolvedValue({
        ...mockBook,
        availableCopies: 0,
      });

      await expect(circulationService.borrowBook(patronId, { bookId })).rejects.toThrow(
        ConflictError,
      );
      expect(mockBookRepo.decrementAvailableCopies).not.toHaveBeenCalled();
    });

    it('should reject borrowing if patron already holds an active loan for this book (INV-03, INV-06)', async () => {
      vi.mocked(mockBorrowingRepo.findActiveByUserAndBook).mockResolvedValue(mockBorrowing);

      await expect(circulationService.borrowBook(patronId, { bookId })).rejects.toThrow(
        ConflictError,
      );
      expect(mockBookRepo.decrementAvailableCopies).not.toHaveBeenCalled();
    });

    it('should reject borrowing if patron has overdue loans (DBD-09)', async () => {
      const overdueLoan: IBorrowing = {
        ...mockBorrowing,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day overdue
      };
      vi.mocked(mockBorrowingRepo.findActiveByUserId).mockResolvedValue([overdueLoan]);

      await expect(circulationService.borrowBook(patronId, { bookId })).rejects.toThrow(
        ConflictError,
      );
    });

    it('should handle MongoDB duplicate key error code 11000 and throw ConflictError (INV-03 race protection)', async () => {
      vi.mocked(mockTxManager.withTransaction).mockRejectedValue({ code: 11000 });

      await expect(circulationService.borrowBook(patronId, { bookId })).rejects.toThrow(
        ConflictError,
      );
    });
  });

  describe('returnBook', () => {
    it('should successfully return book and increment inventory (FR-BORROW-002, INV-01, INV-02)', async () => {
      vi.mocked(mockBorrowingRepo.findById).mockResolvedValue(mockBorrowing);

      const result = await circulationService.returnBook(borrowingId, {
        id: patronId,
        email: 'patron@lms.org',
        role: UserRole.PATRON,
        status: UserStatus.ACTIVE,
      });

      expect(mockBorrowingRepo.markReturned).toHaveBeenCalled();
      expect(mockBookRepo.incrementAvailableCopies).toHaveBeenCalledWith(bookId, expect.anything());
      expect(mockUserRepo.decrementActiveBorrowCount).toHaveBeenCalledWith(
        patronId,
        expect.anything(),
      );
      expect(mockAuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOAN_RETURNED' }),
        expect.anything(),
      );
      expect(result.status).toBe(CirculationStatus.RETURNED);
    });

    it('should reject return if borrowing does not exist', async () => {
      vi.mocked(mockBorrowingRepo.findById).mockResolvedValue(null);

      await expect(
        circulationService.returnBook('invalid-id', {
          id: patronId,
          email: 'patron@lms.org',
          role: UserRole.PATRON,
          status: UserStatus.ACTIVE,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should reject return if borrowing belongs to a different user (BOLA Guard)', async () => {
      vi.mocked(mockBorrowingRepo.findById).mockResolvedValue(mockBorrowing);

      await expect(
        circulationService.returnBook(borrowingId, {
          id: 'other-patron-id',
          email: 'attacker@lms.org',
          role: UserRole.PATRON,
          status: UserStatus.ACTIVE,
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should reject return if book was already returned (RC-08 Idempotency)', async () => {
      const alreadyReturned = {
        ...mockBorrowing,
        status: CirculationStatus.RETURNED,
        returnDate: new Date(),
      };
      vi.mocked(mockBorrowingRepo.findById).mockResolvedValue(alreadyReturned);

      await expect(
        circulationService.returnBook(borrowingId, {
          id: patronId,
          email: 'patron@lms.org',
          role: UserRole.PATRON,
          status: UserStatus.ACTIVE,
        }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('getActiveLoans', () => {
    it('should retrieve active loans with dynamic overdue flags and embedded book metadata (FR-BORROW-003, DBD-09)', async () => {
      vi.mocked(mockBorrowingRepo.findActiveByUserId).mockResolvedValue([mockBorrowing]);

      const response = await circulationService.getActiveLoans(patronId);

      expect(response.totalActiveLoans).toBe(1);
      expect(response.data[0]?.book.title).toBe('Domain-Driven Design');
      expect(response.data[0]?.isOverdue).toBeDefined();
    });
  });

  describe('getBorrowingHistory', () => {
    it('should retrieve paginated borrowing history (FR-BORROW-004)', async () => {
      const response = await circulationService.getBorrowingHistory(patronId, {
        page: 1,
        limit: 10,
      });

      expect(response.data).toHaveLength(1);
      expect(mockBorrowingRepo.findHistoryByUserId).toHaveBeenCalledWith(patronId, {
        page: 1,
        limit: 10,
      });
    });
  });
});
