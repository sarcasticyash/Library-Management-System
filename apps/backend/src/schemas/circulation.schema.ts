/**
 * Cloud-Native Library Management System (LMS)
 * Circulation Validation Schemas & Canonical DTOs
 *
 * Governed by Phase 1 (FR-BORROW-001 to FR-BORROW-004, FR-ADMIN-006, FR-ADMIN-007),
 * Phase 3 (Invariants INV-01 to INV-06), and Phase 4 Section 12.4 & 12.5.
 */

import { z } from 'zod';
import { CirculationStatus } from '../types/circulation.types';
import { ObjectIdSchema, PaginationQuerySchema } from './common.schema';

/**
 * Route path parameter for borrowing-specific endpoints: :borrowingId
 */
export const BorrowingIdParamSchema = z.object({
  borrowingId: ObjectIdSchema,
});

export type BorrowingIdParamDto = z.infer<typeof BorrowingIdParamSchema>;

/**
 * Patron book checkout payload validation (FR-BORROW-001).
 */
export const BorrowBookSchema = z.object({
  bookId: ObjectIdSchema,
});

export type BorrowBookDto = z.infer<typeof BorrowBookSchema>;

/**
 * Staff administrative return override payload validation (FR-ADMIN-007).
 */
export const AdminReturnOverrideSchema = z.object({
  adminRemarks: z
    .string()
    .trim()
    .min(5, 'Admin remarks must be at least 5 characters')
    .max(500, 'Admin remarks cannot exceed 500 characters'),
});

export type AdminReturnOverrideDto = z.infer<typeof AdminReturnOverrideSchema>;

/**
 * Administrative global borrowings roster filter query schema (FR-ADMIN-006).
 */
export const AdminBorrowingsQuerySchema = PaginationQuerySchema.extend({
  status: z.nativeEnum(CirculationStatus).optional(),
  userId: ObjectIdSchema.optional(),
  bookId: ObjectIdSchema.optional(),
});

export type AdminBorrowingsQueryDto = z.infer<typeof AdminBorrowingsQuerySchema>;
