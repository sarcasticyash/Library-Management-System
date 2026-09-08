/**
 * Cloud-Native Library Management System (LMS)
 * Administrative Services Implementation
 *
 * Implements IAdminBookService, IAdminCirculationService, and IAdminDashboardService.
 * Governed by Phase 1 (FR-ADMIN-001 to FR-ADMIN-007), Phase 4 Section 12.5,
 * and Phase 7 (Engineering Standards).
 */

import {
  IAdminBookService,
  IAdminCirculationService,
  IAdminDashboardService,
} from './admin.service.interface';
import { IBookRepository } from '../repositories/book.repository.interface';
import { IBorrowingRepository } from '../repositories/borrowing.repository.interface';
import { IUserRepository } from '../repositories/user.repository.interface';
import { ITransactionManager } from '../repositories/transaction.manager.interface';
import {
  bookRepository,
  borrowingRepository,
  userRepository,
  transactionManager,
} from '../repositories';
import { IAuditService } from './audit.service.interface';
import { auditService } from './audit.service';
import { CreateBookDto, UpdateBookDto } from '../schemas/book.schema';
import { AdminBorrowingsQueryDto, AdminReturnOverrideDto } from '../schemas/circulation.schema';
import { IBook } from '../types/book.types';
import { CirculationStatus, computeOverdueStatus, IBorrowing } from '../types/circulation.types';
import { PaginatedResponse } from '../types/common.types';
import { IDashboardKpis } from '../types/dashboard.types';
import { AuthUserContext } from '../types/user.types';
import { AuditAction, AuditActorRole, AuditEntityType } from '../types/audit.types';
import { ConflictError, NotFoundError } from '../utils/error';

export class AdminService
  implements IAdminBookService, IAdminCirculationService, IAdminDashboardService
{
  private readonly bookRepo: IBookRepository;
  private readonly borrowingRepo: IBorrowingRepository;
  private readonly userRepo: IUserRepository;
  private readonly txManager: ITransactionManager;
  private readonly audit: IAuditService;

  constructor(
    bookRepo: IBookRepository = bookRepository,
    borrowRepo: IBorrowingRepository = borrowingRepository,
    userRepo: IUserRepository = userRepository,
    txManager: ITransactionManager = transactionManager,
    audit: IAuditService = auditService,
  ) {
    this.bookRepo = bookRepo;
    this.borrowingRepo = borrowRepo;
    this.userRepo = userRepo;
    this.txManager = txManager;
    this.audit = audit;
  }

  // ==========================================================================
  // IAdminBookService (FR-ADMIN-002, FR-ADMIN-003, FR-ADMIN-004)
  // ==========================================================================

  /**
   * Adds a new book title to the catalog.
   * Throws 409 ISBN_ALREADY_EXISTS if ISBN is taken.
   */
  public async createBook(dto: CreateBookDto, actorContext: AuthUserContext): Promise<IBook> {
    const existing = await this.bookRepo.findByIsbn(dto.isbn);
    if (existing) {
      throw new ConflictError(
        'A book with this ISBN already exists in the catalog',
        'ISBN_ALREADY_EXISTS',
      );
    }

    const created = await this.bookRepo.create({
      ...dto,
      availableCopies: dto.totalCopies,
      isDeleted: false,
      coverImageUrl: dto.coverImageUrl || null,
    });

    await this.audit.logEvent({
      action: AuditAction.BOOK_CREATED,
      actorId: actorContext.id,
      actorRole: AuditActorRole.ADMIN,
      entityType: AuditEntityType.BOOK,
      entityId: created.id,
      ipAddress: '127.0.0.1',
      metadata: {
        title: created.title,
        isbn: created.isbn,
        totalCopies: created.totalCopies,
      },
    });

    return created;
  }

  /**
   * Updates catalog metadata and stock counts.
   * Enforces stock invariant: newTotalCopies >= (oldTotalCopies - oldAvailableCopies).
   * Throws 409 TOTAL_COPIES_BELOW_LOANS if invariant breached (RC-18).
   */
  public async updateBook(
    bookId: string,
    dto: UpdateBookDto,
    actorContext: AuthUserContext,
  ): Promise<IBook> {
    const book = await this.bookRepo.findById(bookId);
    if (!book || book.isDeleted) {
      throw new NotFoundError('Book not found in library catalog', 'ERR-RES-NOT-FOUND');
    }

    let updates: Partial<IBook> = { ...dto };

    // Stock Invariant Enforcement (RC-18)
    if (dto.totalCopies !== undefined) {
      const activeBorrowedCopies = book.totalCopies - book.availableCopies;
      if (dto.totalCopies < activeBorrowedCopies) {
        throw new ConflictError(
          `Cannot reduce total copies below active loans. Current active loans: ${activeBorrowedCopies}, Requested: ${dto.totalCopies}`,
          'TOTAL_COPIES_BELOW_LOANS',
        );
      }

      const delta = dto.totalCopies - book.totalCopies;
      const newAvailableCopies = book.availableCopies + delta;
      updates = {
        ...dto,
        availableCopies: newAvailableCopies,
      };
    }

    const updated = await this.bookRepo.update(bookId, updates);
    if (!updated) {
      throw new NotFoundError('Book not found in library catalog', 'ERR-RES-NOT-FOUND');
    }

    await this.audit.logEvent({
      action: AuditAction.BOOK_UPDATED,
      actorId: actorContext.id,
      actorRole: AuditActorRole.ADMIN,
      entityType: AuditEntityType.BOOK,
      entityId: bookId,
      ipAddress: '127.0.0.1',
      metadata: { updates },
    });

    return updated;
  }

  /**
   * Soft-deletes catalog title (sets isDeleted: true).
   * Throws 409 ACTIVE_LOANS_EXIST if active loans are outstanding (RC-19: availableCopies !== totalCopies).
   */
  public async deactivateBook(bookId: string, actorContext: AuthUserContext): Promise<IBook> {
    const book = await this.bookRepo.findById(bookId);
    if (!book || book.isDeleted) {
      throw new NotFoundError('Book not found in library catalog', 'ERR-RES-NOT-FOUND');
    }

    // Pre-Condition (RC-19): Zero outstanding active loans
    if (book.availableCopies !== book.totalCopies) {
      throw new ConflictError(
        'Cannot deactivate book title while active loans are outstanding',
        'ACTIVE_LOANS_EXIST',
      );
    }

    await this.bookRepo.softDelete(bookId);

    await this.audit.logEvent({
      action: AuditAction.BOOK_DEACTIVATED,
      actorId: actorContext.id,

      actorRole: AuditActorRole.ADMIN,
      entityType: AuditEntityType.BOOK,
      entityId: bookId,
      ipAddress: '127.0.0.1',
      metadata: { title: book.title, isbn: book.isbn },
    });

    return {
      ...book,
      isDeleted: true,
      updatedAt: new Date(),
    };
  }

  // ==========================================================================
  // IAdminCirculationService (FR-ADMIN-006, FR-ADMIN-007)
  // ==========================================================================

  /**
   * Queries global circulation records across all library patrons and books.
   */
  public async getAllBorrowings(
    query: AdminBorrowingsQueryDto,
  ): Promise<PaginatedResponse<IBorrowing>> {
    const result = await this.borrowingRepo.findAll(query);
    const now = new Date();

    const updated = result.data.map((loan) => {
      if (loan.returnDate === null) {
        const { isOverdue } = computeOverdueStatus(loan.dueDate, loan.returnDate, now);
        if (isOverdue) {
          return { ...loan, status: CirculationStatus.OVERDUE };
        }
      }
      return loan;
    });

    return {
      ...result,
      data: updated,
    };
  }

  /**
   * Staff return on behalf of patron with mandatory override remarks.
   * Executes inside a Tier 1 Multi-Document ACID Transaction with unified audit log.
   */
  public async adminReturnOverride(
    borrowingId: string,
    dto: AdminReturnOverrideDto,
    actorContext: AuthUserContext,
  ): Promise<IBorrowing> {
    const borrowing = await this.borrowingRepo.findById(borrowingId);
    if (!borrowing) {
      throw new NotFoundError('Circulation loan record not found', 'ERR-RES-NOT-FOUND');
    }

    // State invariance check / Idempotency
    if (borrowing.status === CirculationStatus.RETURNED || borrowing.returnDate !== null) {
      throw new ConflictError(
        'This circulation loan has already been returned and checked in',
        'ALREADY_RETURNED',
      );
    }

    return this.txManager.withTransaction(async (session) => {
      const now = new Date();
      const updated = await this.borrowingRepo.markReturned(
        borrowingId,
        now,
        actorContext.role,
        dto.adminRemarks,
        session as never,
      );

      if (!updated) {
        throw new NotFoundError('Circulation loan record not found', 'ERR-RES-NOT-FOUND');
      }

      // Restore book inventory
      await this.bookRepo.incrementAvailableCopies(borrowing.bookId, session as never);

      // Decrement patron active borrow quota
      await this.userRepo.decrementActiveBorrowCount(borrowing.userId, session as never);

      // Tier 1 Atomic Audit Record inserted within the transaction
      await this.audit.logEvent(
        {
          action: AuditAction.ADMIN_RETURN_OVERRIDE,
          actorId: actorContext.id,

          actorRole: AuditActorRole.ADMIN,
          entityType: AuditEntityType.BORROWING,
          entityId: borrowingId,
          ipAddress: '127.0.0.1',
          metadata: {
            bookId: borrowing.bookId,
            borrowerUserId: borrowing.userId,
            adminRemarks: dto.adminRemarks,
            returnDate: now.toISOString(),
          },
        },
        session,
      );

      return updated;
    });
  }

  // ==========================================================================
  // IAdminDashboardService (FR-ADMIN-001 / RC-20)
  // ==========================================================================

  /**
   * Computes real-time live operational counts across catalog, circulation, and user collections.
   */
  public async getDashboardKpis(): Promise<IDashboardKpis> {
    const [catalog, circulation, users] = await Promise.all([
      this.bookRepo.countStock(),
      this.borrowingRepo.countActiveAndOverdue(),
      this.userRepo.countUsersByStatus(),
    ]);

    return {
      catalog: {
        totalTitles: catalog.totalTitles,
        totalCopies: catalog.totalCopies,
        availableCopies: catalog.availableCopies,
      },
      circulation: {
        activeLoans: circulation.activeLoans,
        overdueLoans: circulation.overdueLoans,
      },
      users: {
        totalRegisteredUsers: users.total,
        activePatrons: users.active,
        suspendedPatrons: users.suspended,
      },
      calculatedAt: new Date().toISOString(),
    };
  }
}

export const adminService = new AdminService();
