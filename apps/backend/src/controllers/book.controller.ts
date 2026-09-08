/**
 * Cloud-Native Library Management System (LMS)
 * Book Catalog & Discovery Delivery Controller
 *
 * Governed by Phase 1 (FR-BOOK-001 to FR-BOOK-004), Phase 4 Section 12.3,
 * and Phase 7 (Engineering Standards).
 */

import { Request, Response, NextFunction } from 'express';
import { ICatalogService } from '../services/catalog.service.interface';
import { catalogService } from '../services/catalog.service';

export class BookController {
  private readonly catalogService: ICatalogService;

  constructor(catalog: ICatalogService = catalogService) {
    this.catalogService = catalog;
  }

  /**
   * GET /api/v1/books (FR-BOOK-001, FR-BOOK-002)
   */
  public searchBooks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.catalogService.searchBooks(req.query as never);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/books/:bookId (FR-BOOK-003)
   */
  public getBookById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bookId = req.params.bookId ?? '';
      const book = await this.catalogService.getBookById(bookId);
      res.status(200).json(book);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/books/:bookId/availability (FR-BOOK-004)
   */
  public getBookAvailability = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const bookId = req.params.bookId ?? '';
      const availability = await this.catalogService.getBookAvailability(bookId);
      res.status(200).json(availability);
    } catch (err) {
      next(err);
    }
  };
}

export const bookController = new BookController();
