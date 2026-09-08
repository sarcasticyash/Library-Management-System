/**
 * Cloud-Native Library Management System (LMS)
 * Circulation & Borrowing Domain Types
 *
 * Governed by Phase 1 (FR-BORROW, BR-01 to BR-05),
 * Phase 3 (Collection: borrowings, Invariants INV-01 to INV-06, Decision DBD-09),
 * and Phase 4 Section 8, 9, 12.4 & 12.5.
 */

export enum CirculationStatus {
  ACTIVE = 'ACTIVE',
  OVERDUE = 'OVERDUE',
  RETURNED = 'RETURNED',
}

export enum ReturnedByRole {
  PATRON = 'ROLE_PATRON',
  ADMIN = 'ROLE_ADMIN',
}

/**
 * Complete Borrowing domain entity representing a physical volume circulation record.
 */
export interface IBorrowing {
  id: string;
  userId: string;
  bookId: string;
  borrowDate: Date;
  dueDate: Date;
  returnDate: Date | null;
  status: CirculationStatus;
  returnedBy: ReturnedByRole | string | null;
  adminReturnRemarks: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Embedded book representation on an active loan card.
 */
export interface IActiveLoanBook {
  id: string;
  title: string;
  author: string;
  coverImageUrl?: string | null;
}

/**
 * Active loan item presentation DTO including dynamic overdue indicators.
 */
export interface IActiveLoanItem {
  id: string;
  book: IActiveLoanBook;
  borrowDate: Date | string;
  dueDate: Date | string;
  status: CirculationStatus;
  isOverdue: boolean;
  daysRemaining: number;
}

/**
 * Response envelope for patron active borrowings list per FR-BORROW-003.
 */
export interface IActiveLoansResponse {
  data: IActiveLoanItem[];
  totalActiveLoans: number;
}

/**
 * Authoritative Overdue Status Evaluation Utility.
 *
 * Enforces Phase 3 Decision DBD-09 and Phase 4 Section 9:
 * Business Truth: isOverdue <=> (returnDate == null && now > dueDate)
 *
 * @param dueDate The loan due date
 * @param returnDate Check-in timestamp (null if still in circulation)
 * @param now Reference timestamp (defaults to current system time, injectable for testing)
 */
export function computeOverdueStatus(
  dueDate: Date | string,
  returnDate: Date | string | null,
  now: Date = new Date(),
): { isOverdue: boolean; daysRemaining: number } {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const isReturned = returnDate !== null && returnDate !== undefined;

  if (isReturned) {
    return { isOverdue: false, daysRemaining: 0 };
  }

  const msDiff = due.getTime() - now.getTime();
  const daysRemaining = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
  const isOverdue = msDiff < 0;

  return { isOverdue, daysRemaining };
}
