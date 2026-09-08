/**
 * Cloud-Native Library Management System (LMS)
 * User Profile & Account Delivery Routes
 *
 * Governed by Phase 1 (FR-USER-001, FR-USER-002), Phase 4 Section 12.2,
 * and Phase 6 Section 9.3.
 */

import { Router } from 'express';
import { userController, UserController } from '../controllers/user.controller';

import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { ChangePasswordSchema } from '../schemas/user.schema';

/**
 * Factory function creating user routes with injected controller for testing.
 */
export function createUserRoutes(controller: UserController = userController): Router {
  const router = Router();

  /**
   * GET /api/v1/users/profile (FR-USER-001)
   * Authenticated patron/admin personal profile retrieval
   */
  router.get('/profile', authenticate, controller.getProfile);

  /**
   * PATCH /api/v1/users/password (FR-USER-002)
   * Transactional password change with multi-device session revocation
   */
  router.patch(
    '/password',
    authenticate,
    validateRequest({ body: ChangePasswordSchema }),
    controller.changePassword,
  );

  return router;
}

export const userRoutes = createUserRoutes();
