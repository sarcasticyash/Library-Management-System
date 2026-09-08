/**
 * Cloud-Native Library Management System (LMS)
 * Circulation Service Application Boundary Interface
 *
 * Governed by Phase 1 (FR-BORROW-001 to FR-BORROW-004), Phase 3 (INV-01 to INV-06),
 * and Phase 4 Section 8, 9, 10 & 12.4.
 */

import { BorrowBookDto } from '../schemas/circulation.schema';
import { IActiveLoansResponse, IBorrowing } from '../types/circulation.types';
import { PaginatedResponse, PaginationParams } from '../types/common.types';
import { AuthUserContext } from '../types/user.types';

export interface ICirculationService {
  /**
   * Self-service patron checkout within a Multi-Document ACID Transaction.
   * Enforces:
   * - Invariant INV-04 / BR-01: activeBorrowCount < 5
   * - Invariant INV-01: availableCopies > 0
   * - Invariant INV-06 / DBD-08: No existing active or overdue loan for the same title
   * - BR-02: 14-day loan duration
   */
  borrowBook(userId: string, dto: BorrowBookDto): Promise<IBorrowing>;

  /**
   * Self-service return of borrowed volume within a Multi-Document ACID Transaction.
   * Verifies ownership (borrowing.userId === actorContext.id).
   * Throws 409 ALREADY_RETURNED if terminal status is already reached.
   */
  returnBook(borrowingId: string, actorContext: AuthUserContext): Promise<IBorrowing>;

  /**
   * Retrieves currently held active and overdue loans for authenticated patron.
   * Dynamically applies DBD-09 overdue formula.
   */
  getActiveLoans(userId: string): Promise<IActiveLoansResponse>;

  /**
   * Paginated archive of patron's entire circulation history.
   */
  getBorrowingHistory(
    userId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResponse<IBorrowing>>;
}
