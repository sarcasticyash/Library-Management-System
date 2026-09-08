/**
 * Cloud-Native Library Management System (LMS)
 * Role-Based Access Control (RBAC) & Account Status Middleware
 *
 * Governed by Phase 6 Section 10 (Authorization & Access Control Architecture),
 * and Phase 7 (Engineering Standards).
 */

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/user.types';
import { AuthenticationError, ForbiddenError } from '../utils/error';

/**
 * Middleware factory requiring that the authenticated user possesses one of the specified roles.
 */
export function requireRole(...allowedRoles: (UserRole | string)[]) {
  return function rbacGuard(req: Request, _res: Response, next: NextFunction): void {
    if (!req.user) {
      return next(
        new AuthenticationError(
          'Unauthenticated request: Authentication token must be provided',
          'ERR-AUTH-UNAUTHORIZED',
        ),
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Forbidden: Insufficient privileges. Required one of: [${allowedRoles.join(', ')}]`,
          'ERR-AUTH-FORBIDDEN',
        ),
      );
    }

    return next();
  };
}

/**
 * Middleware verifying that the authenticated user account is in ACTIVE standing.
 * Suspended patron accounts are barred from performing mutating library actions.
 */
export function requireActiveAccount(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(
      new AuthenticationError(
        'Unauthenticated request: Authentication token must be provided',
        'ERR-AUTH-UNAUTHORIZED',
      ),
    );
  }

  if (req.user.status === 'SUSPENDED') {
    return next(
      new ForbiddenError(
        'Access denied: Patron account is suspended. Contact library administration.',
        'ERR-AUTH-ACCOUNT-SUSPENDED',
      ),
    );
  }

  return next();
}
