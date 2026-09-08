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

export interface IBorrowing {
  id: string;
  userId: string;
  bookId: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  status: CirculationStatus;
  returnedBy: ReturnedByRole | string | null;
  adminReturnRemarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IActiveLoanBook {
  id: string;
  title: string;
  author: string;
  coverImageUrl?: string | null;
}

export interface IActiveLoanItem {
  id: string;
  book: IActiveLoanBook;
  borrowDate: string;
  dueDate: string;
  status: CirculationStatus;
  isOverdue: boolean;
  daysRemaining: number;
}

export interface IActiveLoansResponse {
  data: IActiveLoanItem[];
  totalActiveLoans: number;
}

export interface BorrowBookDto {
  bookId: string;
}

export interface ReturnOverrideDto {
  adminRemarks: string;
}

/**
 * Authoritative Overdue Status Evaluation Utility.
 *
 * Enforces Phase 3 Decision DBD-09 and Phase 4 Section 9:
 * Business Truth: isOverdue <=> (returnDate == null && now > dueDate)
 */
export function computeOverdueStatus(
  dueDate: string,
  returnDate: string | null | undefined,
  now: Date = new Date(),
): { isOverdue: boolean; daysRemaining: number } {
  const isReturned = returnDate !== null && returnDate !== undefined;

  if (isReturned) {
    return { isOverdue: false, daysRemaining: 0 };
  }

  const due = new Date(dueDate);
  const msDiff = due.getTime() - now.getTime();
  const daysRemaining = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
  const isOverdue = msDiff < 0;

  return { isOverdue, daysRemaining };
}
