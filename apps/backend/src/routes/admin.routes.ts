/**
 * Cloud-Native Library Management System (LMS)
 * Administrative Delivery Routes
 *
 * Governed by Phase 1 (FR-ADMIN-001 to FR-ADMIN-008), Phase 4 Section 12.5,
 * and Phase 6 Section 10 (ROLE_ADMIN RBAC).
 */

import { Router } from 'express';
import { adminController, AdminController } from '../controllers/admin.controller';

import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { BookIdParamSchema, CreateBookSchema, UpdateBookSchema } from '../schemas/book.schema';
import {
  AdminBorrowingsQuerySchema,
  AdminReturnOverrideSchema,
  BorrowingIdParamSchema,
} from '../schemas/circulation.schema';
import { UserIdParamSchema, UpdateUserStatusSchema } from '../schemas/user.schema';
import { AuditQuerySchema } from '../schemas/audit.schema';
import { UserRole } from '../types/user.types';

/**
 * Factory function creating admin routes with injected controller for testing.
 */
export function createAdminRoutes(controller: AdminController = adminController): Router {
  const router = Router();

  // Enforce authentication & administrator role across all admin endpoints
  router.use(authenticate, requireRole(UserRole.ADMIN));

  /**
   * GET /api/v1/admin/dashboard/kpis (FR-ADMIN-001 / RC-20)
   * Real-time operational KPI metrics
   */
  router.get('/dashboard/kpis', controller.getDashboardKpis);

  /**
   * POST /api/v1/admin/books (FR-ADMIN-002)
   * Add new catalog title with unique ISBN verification
   */
  router.post('/books', validateRequest({ body: CreateBookSchema }), controller.createBook);

  /**
   * PUT /api/v1/admin/books/:bookId (FR-ADMIN-003 / RC-18)
   * Update catalog metadata and enforce stock invariants
   */
  router.put(
    '/books/:bookId',
    validateRequest({ params: BookIdParamSchema, body: UpdateBookSchema }),
    controller.updateBook,
  );

  /**
   * DELETE /api/v1/admin/books/:bookId (FR-ADMIN-004 / RC-19)
   * Soft-delete catalog title after verifying zero active loans
   */
  router.delete(
    '/books/:bookId',
    validateRequest({ params: BookIdParamSchema }),
    controller.deleteBook,
  );

  /**
   * PATCH /api/v1/admin/users/:userId/status (FR-ADMIN-005)
   * Administrative patron suspension/reactivation with multi-device session revocation
   */
  router.patch(
    '/users/:userId/status',
    validateRequest({ params: UserIdParamSchema, body: UpdateUserStatusSchema }),
    controller.updateUserStatus,
  );

  /**
   * GET /api/v1/admin/borrowings (FR-ADMIN-006)
   * Global circulation roster oversight with status/user/book filters
   */
  router.get(
    '/borrowings',
    validateRequest({ query: AdminBorrowingsQuerySchema }),
    controller.getAllBorrowings,
  );

  /**
   * POST /api/v1/admin/borrowings/:borrowingId/return-override (FR-ADMIN-007)
   * Staff return override on behalf of patron with mandatory remarks
   */
  router.post(
    '/borrowings/:borrowingId/return-override',
    validateRequest({ params: BorrowingIdParamSchema, body: AdminReturnOverrideSchema }),
    controller.returnOverride,
  );

  /**
   * GET /api/v1/admin/audit-logs (FR-ADMIN-008 / RC-02)
   * Query immutable audit log stream with action, actor, and date filters
   */
  router.get('/audit-logs', validateRequest({ query: AuditQuerySchema }), controller.getAuditLogs);

  return router;
}

export const adminRoutes = createAdminRoutes();
