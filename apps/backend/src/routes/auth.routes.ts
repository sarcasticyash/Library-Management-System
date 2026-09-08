/**
 * Cloud-Native Library Management System (LMS)
 * Authentication & Session Delivery Routes
 *
 * Governed by Phase 1 (FR-AUTH-001 to FR-AUTH-004), Phase 4 Section 12.1,
 * and Phase 6 (Security Architecture).
 */

import { Router, RequestHandler } from 'express';
import { authController, AuthController } from '../controllers/auth.controller';

import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { defaultAuthRateLimiter } from '../middleware/rate-limit.middleware';
import { RegisterUserSchema, LoginUserSchema } from '../schemas/auth.schema';

/**
 * Factory function creating authentication routes with injected controller for testing.
 */
export function createAuthRoutes(
  controller: AuthController = authController,
  rateLimiter: RequestHandler = defaultAuthRateLimiter,
): Router {
  const router = Router();

  /**
   * POST /api/v1/auth/register (FR-AUTH-001)
   * Patron self-registration
   */
  router.post(
    '/register',
    rateLimiter,
    validateRequest({ body: RegisterUserSchema }),
    controller.register,
  );

  /**
   * POST /api/v1/auth/login (FR-AUTH-002)
   * Credential authentication & session establishment
   */
  router.post('/login', rateLimiter, validateRequest({ body: LoginUserSchema }), controller.login);

  /**
   * POST /api/v1/auth/logout (FR-AUTH-003)
   * Invalidate active session and clear cookie
   */
  router.post('/logout', authenticate, controller.logout);

  /**
   * POST /api/v1/auth/refresh (FR-AUTH-004)
   * Single-use refresh token rotation
   */
  router.post('/refresh', rateLimiter, controller.refresh);

  return router;
}

export const authRoutes = createAuthRoutes();
