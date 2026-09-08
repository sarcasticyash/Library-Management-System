/**
 * Cloud-Native Library Management System (LMS)
 * Catalog & Book Discovery Service Implementation
 *
 * Governed by Phase 1 (FR-BOOK-001 to FR-BOOK-004), Phase 4 Section 4.3 & 12.3,
 * and Phase 7 (Engineering Standards).
 */

import { ICatalogService } from './catalog.service.interface';
import { IBookRepository } from '../repositories/book.repository.interface';
import { bookRepository } from '../repositories';
import { BookSearchQueryDto } from '../schemas/book.schema';
import { IBook, IBookAvailability, IBookSummary } from '../types/book.types';
import { PaginatedResponse } from '../types/common.types';
import { NotFoundError } from '../utils/error';

export class CatalogService implements ICatalogService {
  private readonly bookRepo: IBookRepository;

  constructor(bookRepo: IBookRepository = bookRepository) {
    this.bookRepo = bookRepo;
  }

  /**
   * Discovers books matching full-text queries, genre filters, and in-stock toggles.
   * Excludes soft-deleted items (isDeleted: true).
   */
  public async searchBooks(query: BookSearchQueryDto): Promise<PaginatedResponse<IBookSummary>> {
    return this.bookRepo.search(query);
  }

  /**
   * Retrieves detailed catalog metadata including physical shelf location coordinates.
   * Throws 404 RESOURCE_NOT_FOUND or 404 BOOK_DEACTIVATED.
   */
  public async getBookById(bookId: string): Promise<IBook> {
    const book = await this.bookRepo.findById(bookId);

    if (!book) {
      throw new NotFoundError('Book not found in library catalog', 'ERR-RES-NOT-FOUND');
    }

    if (book.isDeleted) {
      throw new NotFoundError('Book has been deactivated from catalog', 'BOOK_DEACTIVATED');
    }

    return book;
  }

  /**
   * Dynamic real-time readout of book availability and shelf placement.
   */
  public async getBookAvailability(bookId: string): Promise<IBookAvailability> {
    const book = await this.bookRepo.findById(bookId);

    if (!book) {
      throw new NotFoundError('Book not found in library catalog', 'ERR-RES-NOT-FOUND');
    }

    if (book.isDeleted) {
      throw new NotFoundError('Book has been deactivated from catalog', 'BOOK_DEACTIVATED');
    }

    return {
      bookId: book.id,
      isAvailable: book.availableCopies > 0,
      availableCopies: book.availableCopies,
      totalCopies: book.totalCopies,
      location: book.location,
    };
  }
}

export const catalogService = new CatalogService();
