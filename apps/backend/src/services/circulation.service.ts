/**
 * Cloud-Native Library Management System (LMS)
 * Circulation & Lending Service Implementation
 *
 * Governed by Phase 1 (FR-BORROW-001 to FR-BORROW-004, BR-01 to BR-05),
 * Phase 3 (Invariants INV-01 to INV-06, DBD-08, DBD-09),
 * Phase 4 Section 8, 9, 10 & 12.4, and Phase 7 (Engineering Standards).
 */

import { ICirculationService } from './circulation.service.interface';
import { IBorrowingRepository } from '../repositories/borrowing.repository.interface';
import { IBookRepository } from '../repositories/book.repository.interface';
import { IUserRepository } from '../repositories/user.repository.interface';
import { ITransactionManager } from '../repositories/transaction.manager.interface';
import {
  borrowingRepository,
  bookRepository,
  userRepository,
  transactionManager,
} from '../repositories';
import { IAuditService } from './audit.service.interface';
import { auditService } from './audit.service';
import { BorrowBookDto } from '../schemas/circulation.schema';
import {
  CirculationStatus,
  computeOverdueStatus,
  IActiveLoanItem,
  IActiveLoansResponse,
  IBorrowing,
} from '../types/circulation.types';
import { PaginatedResponse, PaginationParams } from '../types/common.types';
import { AuthUserContext, UserRole, UserStatus } from '../types/user.types';
import { AuditActorRole, AuditEntityType } from '../types/audit.types';

import { ConflictError, ForbiddenError, NotFoundError } from '../utils/error';

export class CirculationService implements ICirculationService {
  private readonly borrowingRepo: IBorrowingRepository;
  private readonly bookRepo: IBookRepository;
  private readonly userRepo: IUserRepository;
  private readonly txManager: ITransactionManager;
  private readonly audit: IAuditService;

  constructor(
    borrowRepo: IBorrowingRepository = borrowingRepository,
    bookRepo: IBookRepository = bookRepository,
    userRepo: IUserRepository = userRepository,
    txManager: ITransactionManager = transactionManager,
    audit: IAuditService = auditService,
  ) {
    this.borrowingRepo = borrowRepo;
    this.bookRepo = bookRepo;
    this.userRepo = userRepo;
    this.txManager = txManager;
    this.audit = audit;
  }

  /**
   * Self-service patron checkout within a Multi-Document ACID Transaction.
   * Enforces:
   * - Invariant INV-04 / BR-01: activeBorrowCount < 5
   * - Invariant INV-01: availableCopies > 0
   * - Invariant INV-06 / DBD-08: No existing active or overdue loan for the same title
   * - Overdue Check (DBD-09): Zero overdue loans
   * - BR-02: 14-day loan duration
   */
  public async borrowBook(userId: string, dto: BorrowBookDto): Promise<IBorrowing> {
    // 1. Fast-fail patron check
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('Patron account not found', 'ERR-RES-NOT-FOUND');
    }
    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenError(
        'Patron account is suspended. Contact library administration.',
        'ERR-AUTH-ACCOUNT-SUSPENDED',
      );
    }

    // Invariant INV-04 / BR-01: Active loan limit
    if (user.activeBorrowCount >= 5) {
      throw new ConflictError(
        'Active borrowing quota exceeded (maximum 5 active loans)',
        'BORROWING_QUOTA_EXCEEDED',
      );
    }

    // 2. Fast-fail catalog item check
    const book = await this.bookRepo.findById(dto.bookId);
    if (!book || book.isDeleted) {
      throw new NotFoundError('Book not found in library catalog', 'ERR-RES-NOT-FOUND');
    }

    // Invariant INV-01: Stock check
    if (book.availableCopies <= 0) {
      throw new ConflictError(
        'Book is currently out of stock and unavailable for borrowing',
        'BOOK_UNAVAILABLE',
      );
    }

    // 3. Fast-fail duplicate active loan check (INV-06)
    const existingLoan = await this.borrowingRepo.findActiveByUserAndBook(userId, dto.bookId);
    if (existingLoan) {
      throw new ConflictError(
        'Patron already holds an active or overdue loan for this book title',
        'DUPLICATE_ACTIVE_LOAN',
      );
    }

    // 4. Fast-fail overdue check (patron cannot borrow with overdue obligations)
    const activeLoans = await this.borrowingRepo.findActiveByUserId(userId);
    const hasOverdue = activeLoans.some((loan) => {
      const { isOverdue } = computeOverdueStatus(loan.dueDate, loan.returnDate);
      return isOverdue;
    });
    if (hasOverdue) {
      throw new ConflictError(
        'Patron has overdue obligations and cannot borrow new titles until overdue books are returned',
        'ERR-RES-CONFLICT',
      );
    }

    // 5. Multi-Document ACID Transaction Execution
    try {
      return await this.txManager.withTransaction(async (session) => {
        // Decrement book inventory atomically
        const stockUpdated = await this.bookRepo.decrementAvailableCopies(
          dto.bookId,
          session as never,
        );
        if (!stockUpdated) {
          throw new ConflictError(
            'Book is currently out of stock and unavailable for checkout',
            'BOOK_UNAVAILABLE',
          );
        }

        // Increment user active borrow count atomically
        const quotaUpdated = await this.userRepo.incrementActiveBorrowCount(
          userId,
          session as never,
        );
        if (!quotaUpdated) {
          throw new ConflictError(
            'Active borrowing quota exceeded (maximum 5 active loans)',
            'BORROWING_QUOTA_EXCEEDED',
          );
        }

        // Calculate timestamps: 14-day duration (BR-02)
        const now = new Date();
        const dueDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

        const created = await this.borrowingRepo.create(
          {
            userId,
            bookId: dto.bookId,
            borrowDate: now,
            dueDate,
            returnDate: null,
            status: CirculationStatus.ACTIVE,
            returnedBy: null,
            adminReturnRemarks: null,
          },
          session as never,
        );

        // Tier 2 Decoupled Audit Event Dispatch
        await this.audit.logEvent(
          {
            action: 'LOAN_CREATED',
            actorId: userId,

            actorRole: AuditActorRole.PATRON,
            entityType: AuditEntityType.BORROWING,
            entityId: created.id,
            ipAddress: '127.0.0.1',
            metadata: {
              bookId: dto.bookId,
              dueDate: dueDate.toISOString(),
            },
          },
          session,
        );

        return created;
      });
    } catch (err: unknown) {
      // Map storage engine duplicate key conflict (code 11000 on compound partial unique index)
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: number }).code === 11000
      ) {
        throw new ConflictError(
          'Patron already holds an active or overdue loan for this book title',
          'DUPLICATE_ACTIVE_LOAN',
        );
      }
      throw err;
    }
  }

  /**
   * Self-service return of borrowed volume within a Multi-Document ACID Transaction.
   * Verifies ownership (borrowing.userId === actorContext.id).
   * Throws 409 ALREADY_RETURNED if terminal status is already reached (Idempotency RC-08).
   */
  public async returnBook(borrowingId: string, actorContext: AuthUserContext): Promise<IBorrowing> {
    const borrowing = await this.borrowingRepo.findById(borrowingId);
    if (!borrowing) {
      throw new NotFoundError('Circulation loan record not found', 'ERR-RES-NOT-FOUND');
    }

    // Ownership verification
    if (borrowing.userId !== actorContext.id) {
      throw new ForbiddenError(
        'Access denied: Cannot return a book borrowed by another user',
        'ERR-AUTH-FORBIDDEN',
      );
    }

    // State invariance & idempotency contract (RC-08)
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
        null,
        session as never,
      );

      if (!updated) {
        throw new NotFoundError('Circulation loan record not found', 'ERR-RES-NOT-FOUND');
      }

      // Restore book inventory
      await this.bookRepo.incrementAvailableCopies(borrowing.bookId, session as never);

      // Decrement patron active loan quota
      await this.userRepo.decrementActiveBorrowCount(borrowing.userId, session as never);

      // Audit logging
      await this.audit.logEvent(
        {
          action: 'LOAN_RETURNED',
          actorId: actorContext.id,

          actorRole:
            actorContext.role === UserRole.ADMIN ? AuditActorRole.ADMIN : AuditActorRole.PATRON,
          entityType: AuditEntityType.BORROWING,
          entityId: borrowingId,
          ipAddress: '127.0.0.1',
          metadata: {
            bookId: borrowing.bookId,
            returnDate: now.toISOString(),
          },
        },
        session,
      );

      return updated;
    });
  }

  /**
   * Retrieves currently held active and overdue loans for authenticated patron.
   * Dynamically applies DBD-09 overdue formula and populates embedded book details.
   */
  public async getActiveLoans(userId: string): Promise<IActiveLoansResponse> {
    const loans = await this.borrowingRepo.findActiveByUserId(userId);
    const now = new Date();

    const items: IActiveLoanItem[] = await Promise.all(
      loans.map(async (loan) => {
        const book = await this.bookRepo.findById(loan.bookId);
        const { isOverdue, daysRemaining } = computeOverdueStatus(
          loan.dueDate,
          loan.returnDate,
          now,
        );
        const status = isOverdue ? CirculationStatus.OVERDUE : loan.status;

        return {
          id: loan.id,
          book: {
            id: book ? book.id : loan.bookId,
            title: book ? book.title : 'Unknown Title',
            author: book ? book.author : 'Unknown Author',
            coverImageUrl: book?.coverImageUrl || null,
          },
          borrowDate: loan.borrowDate,
          dueDate: loan.dueDate,
          status,
          isOverdue,
          daysRemaining,
        };
      }),
    );

    return {
      data: items,
      totalActiveLoans: items.length,
    };
  }

  /**
   * Paginated archive of patron's entire circulation history with dynamic overdue evaluation.
   */
  public async getBorrowingHistory(
    userId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResponse<IBorrowing>> {
    const history = await this.borrowingRepo.findHistoryByUserId(userId, pagination);
    const now = new Date();

    const updatedData = history.data.map((loan) => {
      if (loan.returnDate === null) {
        const { isOverdue } = computeOverdueStatus(loan.dueDate, loan.returnDate, now);
        if (isOverdue) {
          return { ...loan, status: CirculationStatus.OVERDUE };
        }
      }
      return loan;
    });

    return {
      ...history,
      data: updatedData,
    };
  }
}

export const circulationService = new CirculationService();
