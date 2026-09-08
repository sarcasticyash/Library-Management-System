/**
 * Cloud-Native Library Management System (LMS)
 * Catalog & Book Discovery Service Application Boundary Interface
 *
 * Governed by Phase 1 (FR-BOOK-001 to FR-BOOK-004) and Phase 4 Section 4.3 & 12.3.
 */

import { BookSearchQueryDto } from '../schemas/book.schema';
import { IBook, IBookAvailability, IBookSummary } from '../types/book.types';
import { PaginatedResponse } from '../types/common.types';

export interface ICatalogService {
  /**
   * Discovers books matching full-text queries, genre filters, and in-stock toggles.
   * Excludes soft-deleted items (isDeleted: true).
   */
  searchBooks(query: BookSearchQueryDto): Promise<PaginatedResponse<IBookSummary>>;

  /**
   * Retrieves detailed catalog metadata including physical shelf location coordinates.
   * Throws 404 RESOURCE_NOT_FOUND or 404 BOOK_DEACTIVATED.
   */
  getBookById(bookId: string): Promise<IBook>;

  /**
   * Dynamic real-time readout of book availability and shelf placement.
   */
  getBookAvailability(bookId: string): Promise<IBookAvailability>;
}
