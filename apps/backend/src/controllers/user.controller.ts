/**
 * Cloud-Native Library Management System (LMS)
 * User Profile & Account Delivery Controller
 *
 * Governed by Phase 1 (FR-USER-001, FR-USER-002), Phase 4 Section 12.2,
 * and Phase 7 (Engineering Standards).
 */

import { Request, Response, NextFunction } from 'express';
import { IUserService } from '../services/user.service.interface';
import { userService } from '../services/user.service';
import { AuthenticationError } from '../utils/error';

export class UserController {
  private readonly userService: IUserService;

  constructor(user: IUserService = userService) {
    this.userService = user;
  }

  /**
   * GET /api/v1/users/profile (FR-USER-001)
   */
  public getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Unauthenticated request', 'ERR-AUTH-UNAUTHORIZED');
      }

      const profile = await this.userService.getProfile(req.user.id);
      res.status(200).json(profile);
    } catch (err) {
      next(err);
    }
  };

  /**
   * PATCH /api/v1/users/password (FR-USER-002)
   */
  public changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Unauthenticated request', 'ERR-AUTH-UNAUTHORIZED');
      }

      await this.userService.changePassword(req.user.id, req.body);
      res.status(200).json({
        message: 'Password updated successfully. Other active sessions revoked.',
      });
    } catch (err) {
      next(err);
    }
  };
}

export const userController = new UserController();
