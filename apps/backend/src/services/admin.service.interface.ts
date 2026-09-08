/**
 * Cloud-Native Library Management System (LMS)
 * Administrative Services Application Boundary Interfaces
 *
 * Governed by Phase 1 (FR-ADMIN-001 to FR-ADMIN-007) and Phase 4 Section 12.5.
 */

import { CreateBookDto, UpdateBookDto } from '../schemas/book.schema';
import { AdminBorrowingsQueryDto, AdminReturnOverrideDto } from '../schemas/circulation.schema';
import { IBook } from '../types/book.types';
import { IBorrowing } from '../types/circulation.types';
import { PaginatedResponse } from '../types/common.types';
import { IDashboardKpis } from '../types/dashboard.types';
import { AuthUserContext } from '../types/user.types';

/**
 * Administrative Book Catalog Management (FR-ADMIN-002, FR-ADMIN-003, FR-ADMIN-004).
 */
export interface IAdminBookService {
  /**
   * Adds a new book title to the catalog.
   * Throws 409 ISBN_ALREADY_EXISTS if ISBN is taken.
   */
  createBook(dto: CreateBookDto, actorContext: AuthUserContext): Promise<IBook>;

  /**
   * Updates catalog metadata and stock counts.
   * Enforces stock invariant: newTotalCopies >= (oldTotalCopies - oldAvailableCopies).
   * Throws 409 TOTAL_COPIES_BELOW_LOANS if invariant breached.
   */
  updateBook(bookId: string, dto: UpdateBookDto, actorContext: AuthUserContext): Promise<IBook>;

  /**
   * Soft-deletes catalog title (sets isDeleted: true).
   * Throws 409 ACTIVE_LOANS_EXIST if active loans are outstanding (availableCopies !== totalCopies).
   */
  deactivateBook(bookId: string, actorContext: AuthUserContext): Promise<IBook>;
}

/**
 * Administrative Circulation Oversight & Overrides (FR-ADMIN-006, FR-ADMIN-007).
 */
export interface IAdminCirculationService {
  /**
   * Queries global circulation records across all library patrons and books.
   */
  getAllBorrowings(query: AdminBorrowingsQueryDto): Promise<PaginatedResponse<IBorrowing>>;

  /**
   * Staff return on behalf of patron with mandatory override remarks.
   * Executes inside a Tier 1 Multi-Document ACID Transaction with unified audit log.
   */
  adminReturnOverride(
    borrowingId: string,
    dto: AdminReturnOverrideDto,
    actorContext: AuthUserContext,
  ): Promise<IBorrowing>;
}

/**
 * Administrative Executive Dashboard & Operational KPIs (FR-ADMIN-001).
 */
export interface IAdminDashboardService {
  /**
   * Computes real-time live operational counts across catalog, circulation, and user collections.
   */
  getDashboardKpis(): Promise<IDashboardKpis>;
}
