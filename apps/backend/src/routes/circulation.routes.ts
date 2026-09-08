/**
 * Cloud-Native Library Management System (LMS)
 * Patron Circulation Delivery Routes
 *
 * Governed by Phase 1 (FR-BORROW-001 to FR-BORROW-004), Phase 4 Section 12.4,
 * and Phase 6 Section 10 (RBAC & Account Standing).
 */

import { Router } from 'express';
import {
  circulationController,
  CirculationController,
} from '../controllers/circulation.controller';

import { authenticate } from '../middleware/auth.middleware';
import { requireRole, requireActiveAccount } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { BorrowBookSchema, BorrowingIdParamSchema } from '../schemas/circulation.schema';
import { PaginationQuerySchema } from '../schemas/common.schema';
import { UserRole } from '../types/user.types';

/**
 * Factory function creating circulation routes with injected controller for testing.
 */
export function createCirculationRoutes(
  controller: CirculationController = circulationController,
): Router {
  const router = Router();

  // Enforce authentication & patron role across all patron circulation routes
  router.use(authenticate, requireRole(UserRole.PATRON));

  /**
   * POST /api/v1/borrowings (FR-BORROW-001)
   * Self-service book checkout within Multi-Doc ACID Transaction.
   * Suspended accounts are blocked by requireActiveAccount.
   */
  router.post(
    '/',
    requireActiveAccount,
    validateRequest({ body: BorrowBookSchema }),
    controller.borrowBook,
  );

  /**
   * POST /api/v1/borrowings/:borrowingId/return (FR-BORROW-002)
   * Self-service return of borrowed volume with ownership verification & idempotency
   */
  router.post(
    '/:borrowingId/return',
    validateRequest({ params: BorrowingIdParamSchema }),
    controller.returnBook,
  );

  /**
   * GET /api/v1/borrowings/my-active (FR-BORROW-003)
   * Retrieve authenticated patron's active & overdue loans with dynamic indicators
   */
  router.get('/my-active', controller.getActiveLoans);

  /**
   * GET /api/v1/borrowings/my-history (FR-BORROW-004)
   * Paginated historical circulation ledger for authenticated patron
   */
  router.get(
    '/my-history',
    validateRequest({ query: PaginationQuerySchema }),
    controller.getBorrowingHistory,
  );

  return router;
}

export const circulationRoutes = createCirculationRoutes();
