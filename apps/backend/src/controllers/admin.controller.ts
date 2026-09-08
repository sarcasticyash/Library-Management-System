/**
 * Cloud-Native Library Management System (LMS)
 * Administrative Delivery Controller
 *
 * Governed by Phase 1 (FR-ADMIN-001 to FR-ADMIN-008), Phase 4 Section 12.5,
 * and Phase 7 (Engineering Standards).
 */

import { Request, Response, NextFunction } from 'express';
import {
  IAdminBookService,
  IAdminCirculationService,
  IAdminDashboardService,
} from '../services/admin.service.interface';
import { adminService } from '../services/admin.service';
import { IUserService } from '../services/user.service.interface';
import { userService } from '../services/user.service';
import { IAuditService } from '../services/audit.service.interface';
import { auditService } from '../services/audit.service';
import { AuthenticationError } from '../utils/error';

export class AdminController {
  private readonly adminService: IAdminBookService &
    IAdminCirculationService &
    IAdminDashboardService;
  private readonly userService: IUserService;
  private readonly auditService: IAuditService;

  constructor(
    admin: IAdminBookService & IAdminCirculationService & IAdminDashboardService = adminService,
    user: IUserService = userService,
    audit: IAuditService = auditService,
  ) {
    this.adminService = admin;
    this.userService = user;
    this.auditService = audit;
  }

  /**
   * GET /api/v1/admin/dashboard/kpis (FR-ADMIN-001 / RC-20)
   */
  public getDashboardKpis = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const kpis = await this.adminService.getDashboardKpis();
      res.status(200).json(kpis);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/admin/books (FR-ADMIN-002)
   */
  public createBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Unauthenticated request', 'ERR-AUTH-UNAUTHORIZED');
      }

      const book = await this.adminService.createBook(req.body, req.user);
      res.status(201).json(book);
    } catch (err) {
      next(err);
    }
  };

  /**
   * PUT /api/v1/admin/books/:bookId (FR-ADMIN-003 / RC-18)
   */
  public updateBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Unauthenticated request', 'ERR-AUTH-UNAUTHORIZED');
      }

      const bookId = req.params.bookId ?? '';
      const book = await this.adminService.updateBook(bookId, req.body, req.user);
      res.status(200).json(book);
    } catch (err) {
      next(err);
    }
  };

  /**
   * DELETE /api/v1/admin/books/:bookId (FR-ADMIN-004 / RC-19)
   */
  public deleteBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Unauthenticated request', 'ERR-AUTH-UNAUTHORIZED');
      }

      const bookId = req.params.bookId ?? '';
      const book = await this.adminService.deactivateBook(bookId, req.user);
      res.status(200).json({
        id: book.id,
        isDeleted: true,
        deletedAt: book.updatedAt,
        message: 'Book deactivated successfully.',
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * PATCH /api/v1/admin/users/:userId/status (FR-ADMIN-005)
   */
  public updateUserStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Unauthenticated request', 'ERR-AUTH-UNAUTHORIZED');
      }

      const userId = req.params.userId ?? '';
      const updatedUser = await this.userService.updateUserStatus(userId, req.body, req.user);
      res.status(200).json(updatedUser);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/admin/borrowings (FR-ADMIN-006)
   */
  public getAllBorrowings = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const borrowings = await this.adminService.getAllBorrowings(req.query as never);
      res.status(200).json(borrowings);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/admin/borrowings/:borrowingId/return-override (FR-ADMIN-007)
   */
  public returnOverride = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Unauthenticated request', 'ERR-AUTH-UNAUTHORIZED');
      }

      const borrowingId = req.params.borrowingId ?? '';
      const updated = await this.adminService.adminReturnOverride(borrowingId, req.body, req.user);
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/admin/audit-logs (FR-ADMIN-008 / RC-02)
   */
  public getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const logs = await this.auditService.queryLogs(req.query as never);
      res.status(200).json(logs);
    } catch (err) {
      next(err);
    }
  };
}

export const adminController = new AdminController();
