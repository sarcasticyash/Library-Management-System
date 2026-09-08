/**
 * Cloud-Native Library Management System (LMS)
 * Patron Circulation Delivery Controller
 *
 * Governed by Phase 1 (FR-BORROW-001 to FR-BORROW-004), Phase 4 Section 12.4,
 * and Phase 7 (Engineering Standards).
 */

import { Request, Response, NextFunction } from 'express';
import { ICirculationService } from '../services/circulation.service.interface';
import { circulationService } from '../services/circulation.service';
import { AuthenticationError } from '../utils/error';

export class CirculationController {
  private readonly circulationService: ICirculationService;

  constructor(circulation: ICirculationService = circulationService) {
    this.circulationService = circulation;
  }

  /**
   * POST /api/v1/borrowings (FR-BORROW-001)
   */
  public borrowBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Unauthenticated request', 'ERR-AUTH-UNAUTHORIZED');
      }

      const borrowing = await this.circulationService.borrowBook(req.user.id, req.body);
      res.status(201).json(borrowing);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/borrowings/:borrowingId/return (FR-BORROW-002)
   */
  public returnBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Unauthenticated request', 'ERR-AUTH-UNAUTHORIZED');
      }

      const borrowingId = req.params.borrowingId ?? '';
      const borrowing = await this.circulationService.returnBook(borrowingId, req.user);
      res.status(200).json(borrowing);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/borrowings/my-active (FR-BORROW-003)
   */
  public getActiveLoans = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Unauthenticated request', 'ERR-AUTH-UNAUTHORIZED');
      }

      const activeLoans = await this.circulationService.getActiveLoans(req.user.id);
      res.status(200).json(activeLoans);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/borrowings/my-history (FR-BORROW-004)
   */
  public getBorrowingHistory = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Unauthenticated request', 'ERR-AUTH-UNAUTHORIZED');
      }

      const history = await this.circulationService.getBorrowingHistory(
        req.user.id,
        req.query as never,
      );
      res.status(200).json(history);
    } catch (err) {
      next(err);
    }
  };
}

export const circulationController = new CirculationController();
