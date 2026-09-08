/**
 * Cloud-Native Library Management System (LMS)
 * Book Catalog & Discovery Delivery Routes
 *
 * Governed by Phase 1 (FR-BOOK-001 to FR-BOOK-004), Phase 4 Section 12.3,
 * and Phase 7 (Engineering Standards).
 */

import { Router } from 'express';
import { bookController, BookController } from '../controllers/book.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { BookIdParamSchema, BookSearchQuerySchema } from '../schemas/book.schema';

/**
 * Factory function creating book routes with injected controller for testing.
 */
export function createBookRoutes(controller: BookController = bookController): Router {
  const router = Router();

  /**
   * GET /api/v1/books (FR-BOOK-001, FR-BOOK-002)
   * Full-text search, faceted genre/stock filtering, and offset pagination
   */
  router.get('/', validateRequest({ query: BookSearchQuerySchema }), controller.searchBooks);

  /**
   * GET /api/v1/books/:bookId (FR-BOOK-003)
   * Detailed book metadata including physical shelf location
   */
  router.get('/:bookId', validateRequest({ params: BookIdParamSchema }), controller.getBookById);

  /**
   * GET /api/v1/books/:bookId/availability (FR-BOOK-004)
   * Real-time availability readout and physical shelf coordinates
   */
  router.get(
    '/:bookId/availability',
    validateRequest({ params: BookIdParamSchema }),
    controller.getBookAvailability,
  );

  return router;
}

export const bookRoutes = createBookRoutes();
