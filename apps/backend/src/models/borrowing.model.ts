/**
 * Cloud-Native Library Management System (LMS)
 * Borrowing / Circulation Persistence Model & Schema
 *
 * Governed by Phase 3 Section 7.3 (Collection: borrowings),
 * Section 10 (Invariants INV-03 to INV-06, Decision DBD-08, Decision DBD-09),
 * and Section 13 (Indexes).
 */

import { Schema, model, Document, Model, Types } from 'mongoose';
import { CirculationStatus, ReturnedByRole } from '../types/circulation.types';

export interface BorrowingDocument extends Document {
  userId: Types.ObjectId;
  bookId: Types.ObjectId;
  borrowDate: Date;
  dueDate: Date;
  returnDate: Date | null;
  status: CirculationStatus;
  returnedBy: ReturnedByRole | string | null;
  adminReturnRemarks: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const BorrowingSchema = new Schema<BorrowingDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID reference is required'],
    },
    bookId: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book ID reference is required'],
    },
    borrowDate: {
      type: Date,
      required: [true, 'Borrow checkout date is required'],
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due return date is required'],
    },
    returnDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: [CirculationStatus.ACTIVE, CirculationStatus.OVERDUE, CirculationStatus.RETURNED],
        message: 'Invalid circulation status: {VALUE}',
      },
      default: CirculationStatus.ACTIVE,
      required: true,
    },
    returnedBy: {
      type: String,
      enum: {
        values: [ReturnedByRole.PATRON, ReturnedByRole.ADMIN],
        message: 'Invalid returnedBy actor role: {VALUE}',
      },
      default: null,
    },
    adminReturnRemarks: {
      type: String,
      default: null,
      maxlength: [500, 'Admin remarks cannot exceed 500 characters'],
    },
    // CRITICAL (DBD-09): Zero static 'isOverdue' field is defined in this schema.
    // Overdue truth is authoritatively computed at runtime using (returnDate == null && now > dueDate).
  },
  {
    timestamps: true,
    collection: 'borrowings',
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Indexes per Phase 3 Section 13

// 1. Invariant INV-06 / Decision DBD-08: Compound Unique Partial Index on Active/Overdue Loans
// Prevents race conditions and guarantees that a patron cannot hold duplicate active loans for the same book.
BorrowingSchema.index(
  { userId: 1, bookId: 1 },
  {
    name: 'idx_borrowings_active_user_book',
    unique: true,
    partialFilterExpression: {
      status: { $in: [CirculationStatus.ACTIVE, CirculationStatus.OVERDUE] },
    },
  },
);

// 2. Query indexes
BorrowingSchema.index({ userId: 1, status: 1 }, { name: 'idx_borrowings_user_status' });

BorrowingSchema.index({ userId: 1, borrowDate: -1 }, { name: 'idx_borrowings_user_history' });

BorrowingSchema.index({ bookId: 1, status: 1 }, { name: 'idx_borrowings_book_status' });

BorrowingSchema.index({ status: 1, dueDate: 1 }, { name: 'idx_borrowings_overdue_scan' });

export const BorrowingModel: Model<BorrowingDocument> = model<BorrowingDocument>(
  'Borrowing',
  BorrowingSchema,
);
