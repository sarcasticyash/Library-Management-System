/**
 * Cloud-Native Library Management System (LMS)
 * Authentication Delivery Controller
 *
 * Governed by Phase 1 (FR-AUTH-001 to FR-AUTH-004), Phase 4 Section 12.1,
 * and Phase 7 (Engineering Standards).
 */

import { Request, Response, NextFunction } from 'express';
import { IAuthService } from '../services/auth.service.interface';
import { authService } from '../services/auth.service';
import { env } from '../config/env';
import { AuthenticationError } from '../utils/error';

export class AuthController {
  private readonly authService: IAuthService;

  constructor(auth: IAuthService = authService) {
    this.authService = auth;
  }

  /**
   * POST /api/v1/auth/register (FR-AUTH-001)
   */
  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.authService.register(req.body);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/auth/login (FR-AUTH-002)
   */
  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.login(req.body);

      res.cookie('refreshToken', result.rawRefreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/v1/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json(result.tokens);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/auth/logout (FR-AUTH-003)
   */
  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }

      res.clearCookie('refreshToken', { path: '/api/v1/auth' });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/auth/refresh (FR-AUTH-004 / RC-11)
   */
  public refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        throw new AuthenticationError(
          'Refresh token missing from request cookies',
          'ERR-AUTH-UNAUTHORIZED',
        );
      }

      const result = await this.authService.refresh(refreshToken);

      res.cookie('refreshToken', result.rawRefreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/v1/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        accessToken: result.accessToken,
        tokenType: 'Bearer',
        expiresIn: result.expiresIn,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const authController = new AuthController();
