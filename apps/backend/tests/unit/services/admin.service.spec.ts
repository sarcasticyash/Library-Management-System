import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminService } from '@services/admin.service';
import { IBookRepository } from '@repositories/book.repository.interface';
import { IBorrowingRepository } from '@repositories/borrowing.repository.interface';
import { IUserRepository } from '@repositories/user.repository.interface';
import { ITransactionManager } from '@repositories/transaction.manager.interface';
import { IAuditService } from '@services/audit.service.interface';
import { IBook, BookGenre } from '@types/book.types';
import { IBorrowing, CirculationStatus } from '@types/circulation.types';
import { UserRole, UserStatus } from '@types/user.types';
import { ConflictError, NotFoundError } from '@utils/error';

describe('AdminService Unit Tests', () => {
  let mockBookRepo: IBookRepository;
  let mockBorrowingRepo: IBorrowingRepository;
  let mockUserRepo: IUserRepository;
  let mockTxManager: ITransactionManager;
  let mockAuditService: IAuditService;
  let adminService: AdminService;

  const adminContext = {
    id: '64f1a2b3c4d5e6f7a8b9c0a1',
    email: 'admin@library.org',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
  };

  const mockBook: IBook = {
    id: '64f1a2b3c4d5e6f7a8b9c0d2',
    title: 'Refactoring',
    author: 'Martin Fowler',
    isbn: '9780201485677',
    genre: BookGenre.SOFTWARE_ENGINEERING,
    description: 'Improving the Design of Existing Code',
    publisher: 'Addison-Wesley',
    publicationYear: 1999,
    totalCopies: 5,
    availableCopies: 3, // 2 active loans
    location: { aisle: 'A-1', shelf: 'S-01' },
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBorrowing: IBorrowing = {
    id: '64f1a2b3c4d5e6f7a8b9c0d3',
    userId: '64f1a2b3c4d5e6f7a8b9c0d1',
    bookId: mockBook.id,
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
    mockBookRepo = {
      create: vi.fn().mockResolvedValue(mockBook),
      findById: vi.fn().mockResolvedValue(mockBook),
      findByIsbn: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue(mockBook),
      softDelete: vi.fn().mockResolvedValue(true),
      decrementAvailableCopies: vi.fn(),
      incrementAvailableCopies: vi.fn(),
      search: vi.fn(),
      countStock: vi
        .fn()
        .mockResolvedValue({ totalTitles: 10, totalCopies: 50, availableCopies: 40 }),
      countAll: vi.fn(),
      countAvailable: vi.fn(),
    };

    mockBorrowingRepo = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue(mockBorrowing),
      findActiveByUserId: vi.fn(),
      findActiveByUserAndBook: vi.fn(),
      markReturned: vi.fn().mockResolvedValue({
        ...mockBorrowing,
        status: CirculationStatus.RETURNED,
        returnDate: new Date(),
      }),
      findHistoryByUserId: vi.fn(),
      findAll: vi.fn().mockResolvedValue({
        data: [mockBorrowing],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }),
      findAllPaginated: vi.fn(),
      countActiveAndOverdue: vi.fn().mockResolvedValue({ activeLoans: 10, overdueLoans: 2 }),
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
      updatePassword: vi.fn(),
      incrementBorrowCount: vi.fn(),
      decrementBorrowCount: vi.fn(),
      incrementActiveBorrowCount: vi.fn(),
      decrementActiveBorrowCount: vi.fn().mockResolvedValue(null),
      updateStatus: vi.fn(),
      countUsersByStatus: vi.fn().mockResolvedValue({ total: 25, active: 23, suspended: 2 }),
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

    adminService = new AdminService(
      mockBookRepo,
      mockBorrowingRepo,
      mockUserRepo,
      mockTxManager,
      mockAuditService,
    );
  });

  describe('createBook', () => {
    it('should create a book with availableCopies equal to totalCopies and log audit (FR-ADMIN-002)', async () => {
      const dto = {
        title: 'New Book',
        author: 'New Author',
        isbn: '9781234567890',
        genre: BookGenre.TECHNOLOGY,
        description: 'New Description',
        publisher: 'New Publisher',
        publicationYear: 2026,
        totalCopies: 4,
        location: { aisle: 'A-1', shelf: 'S-01' },
      };

      const result = await adminService.createBook(dto, adminContext);

      expect(mockBookRepo.findByIsbn).toHaveBeenCalledWith('9781234567890');
      expect(mockBookRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          totalCopies: 4,
          availableCopies: 4,
          isDeleted: false,
        }),
      );
      expect(mockAuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'BOOK_CREATED' }),
      );
      expect(result).toBeDefined();
    });

    it('should throw ConflictError if ISBN already exists', async () => {
      vi.mocked(mockBookRepo.findByIsbn).mockResolvedValue(mockBook);

      await expect(
        adminService.createBook(
          {
            title: 'Duplicate',
            author: 'Author',
            isbn: mockBook.isbn,
            genre: BookGenre.TECHNOLOGY,
            description: 'Desc',
            publisher: 'Pub',
            publicationYear: 2026,
            totalCopies: 2,
            location: { aisle: 'A-1', shelf: 'S-01' },
          },
          adminContext,
        ),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('updateBook', () => {
    it('should update metadata and adjust availableCopies by delta (FR-ADMIN-003, INV-02)', async () => {
      // mockBook has totalCopies: 5, availableCopies: 3 (2 active loans)
      // Increasing totalCopies to 7 (+2) -> availableCopies should be 5
      await adminService.updateBook(mockBook.id, { totalCopies: 7 }, adminContext);

      expect(mockBookRepo.update).toHaveBeenCalledWith(
        mockBook.id,
        expect.objectContaining({
          totalCopies: 7,
          availableCopies: 5,
        }),
      );
    });

    it('should throw ConflictError if totalCopies is reduced below active loans (RC-18, INV-02)', async () => {
      // mockBook active loans = 5 - 3 = 2. Reducing to 1 must be rejected!
      await expect(
        adminService.updateBook(mockBook.id, { totalCopies: 1 }, adminContext),
      ).rejects.toThrow(ConflictError);
      expect(mockBookRepo.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError if book does not exist', async () => {
      vi.mocked(mockBookRepo.findById).mockResolvedValue(null);

      await expect(
        adminService.updateBook('missing-id', { title: 'New' }, adminContext),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deactivateBook', () => {
    it('should soft-delete book when availableCopies equals totalCopies (FR-ADMIN-004, RC-19, INV-06)', async () => {
      // No active loans: totalCopies = 5, availableCopies = 5
      const fullyReturnedBook = { ...mockBook, availableCopies: 5, totalCopies: 5 };
      vi.mocked(mockBookRepo.findById).mockResolvedValue(fullyReturnedBook);

      const result = await adminService.deactivateBook(mockBook.id, adminContext);

      expect(mockBookRepo.softDelete).toHaveBeenCalledWith(mockBook.id);
      expect(mockAuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'BOOK_DEACTIVATED' }),
      );
      expect(result.isDeleted).toBe(true);
    });

    it('should throw ConflictError if book has active loans outstanding (RC-19, INV-06)', async () => {
      // mockBook has availableCopies: 3, totalCopies: 5 (2 active loans)
      await expect(adminService.deactivateBook(mockBook.id, adminContext)).rejects.toThrow(
        ConflictError,
      );
      expect(mockBookRepo.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('getAllBorrowings', () => {
    it('should query borrowings and compute dynamic overdue status (FR-ADMIN-006, DBD-09)', async () => {
      const response = await adminService.getAllBorrowings({ page: 1, limit: 10 });

      expect(mockBorrowingRepo.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(response.data).toHaveLength(1);
      expect(response.data[0]?.status).toBeDefined();
    });
  });

  describe('adminReturnOverride', () => {
    it('should perform staff override return with audit remarks (FR-ADMIN-007)', async () => {
      const result = await adminService.adminReturnOverride(
        mockBorrowing.id,
        { adminRemarks: 'Returned directly to staff desk' },
        adminContext,
      );

      expect(mockBorrowingRepo.markReturned).toHaveBeenCalledWith(
        mockBorrowing.id,
        expect.any(Date),
        adminContext.role,
        'Returned directly to staff desk',
        expect.anything(),
      );
      expect(mockBookRepo.incrementAvailableCopies).toHaveBeenCalledWith(
        mockBorrowing.bookId,
        expect.anything(),
      );
      expect(mockUserRepo.decrementActiveBorrowCount).toHaveBeenCalledWith(
        mockBorrowing.userId,
        expect.anything(),
      );
      expect(mockAuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ADMIN_RETURN_OVERRIDE' }),
        expect.anything(),
      );
      expect(result.status).toBe(CirculationStatus.RETURNED);
    });

    it('should throw ConflictError if borrowing was already returned (RC-08)', async () => {
      vi.mocked(mockBorrowingRepo.findById).mockResolvedValue({
        ...mockBorrowing,
        status: CirculationStatus.RETURNED,
        returnDate: new Date(),
      });

      await expect(
        adminService.adminReturnOverride(
          mockBorrowing.id,
          { adminRemarks: 'Override' },
          adminContext,
        ),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('getDashboardKpis', () => {
    it('should aggregate catalog, circulation, and user operational KPIs (FR-ADMIN-001, RC-20)', async () => {
      const kpis = await adminService.getDashboardKpis();

      expect(kpis.catalog.totalTitles).toBe(10);
      expect(kpis.catalog.totalCopies).toBe(50);
      expect(kpis.catalog.availableCopies).toBe(40);
      expect(kpis.circulation.activeLoans).toBe(10);
      expect(kpis.circulation.overdueLoans).toBe(2);
      expect(kpis.users.totalRegisteredUsers).toBe(25);
      expect(kpis.users.activePatrons).toBe(23);
      expect(kpis.users.suspendedPatrons).toBe(2);
      expect(kpis.calculatedAt).toBeDefined();
    });
  });
});
