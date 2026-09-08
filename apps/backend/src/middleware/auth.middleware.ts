/**
 * Cloud-Native Library Management System (LMS)
 * Authentication Middleware
 *
 * Governed by Phase 6 Section 8 & Section 10 (Access Token Verification),
 * and Phase 7 (Engineering Standards).
 */

import { Request, Response, NextFunction } from 'express';
import { jwtService, IJwtService } from '../utils/jwt.service';
import { AuthenticationError } from '../utils/error';

/**
 * Creates an authentication middleware instance with injected JWT service.
 */
export function createAuthMiddleware(jwt: IJwtService = jwtService) {
  return function authenticate(req: Request, _res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next(
        new AuthenticationError(
          'Authentication token missing: Provide Bearer token in Authorization header',
          'ERR-AUTH-UNAUTHORIZED',
        ),
      );
    }

    if (!authHeader.startsWith('Bearer ')) {
      return next(
        new AuthenticationError(
          'Invalid authorization format: Expected "Bearer <token>"',
          'ERR-AUTH-INVALID-TOKEN',
        ),
      );
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return next(
        new AuthenticationError('Authentication token is empty', 'ERR-AUTH-UNAUTHORIZED'),
      );
    }

    try {
      const claims = jwt.verifyAccessToken(token);

      req.user = {
        id: claims.sub,
        email: claims.email,
        role: claims.role,
        status: claims.status,
        sessionId: claims.sessionId,
      };

      return next();
    } catch (err) {
      return next(err);
    }
  };
}

export const authenticate = createAuthMiddleware();
