/**
 * Cloud-Native Library Management System (LMS)
 * Book Repository Interface
 *
 * Governed by Phase 3 Section 7.2 and Phase 4 Section 4.4.
 */

import { ClientSession } from 'mongoose';
import { IBook, IBookSummary } from '../types/book.types';
import { PaginatedResponse } from '../types/common.types';
import { BookSearchQueryDto } from '../schemas/book.schema';

export interface BookStockCounts {
  totalTitles: number;
  totalCopies: number;
  availableCopies: number;
}

export interface IBookRepository {
  findById(id: string, session?: ClientSession): Promise<IBook | null>;
  findByIsbn(isbn: string, session?: ClientSession): Promise<IBook | null>;
  create(
    bookData: Omit<IBook, 'id' | 'createdAt' | 'updatedAt'>,
    session?: ClientSession,
  ): Promise<IBook>;
  update(id: string, updates: Partial<IBook>, session?: ClientSession): Promise<IBook | null>;
  decrementAvailableCopies(id: string, session?: ClientSession): Promise<boolean>;
  incrementAvailableCopies(id: string, session?: ClientSession): Promise<boolean>;
  softDelete(id: string, session?: ClientSession): Promise<boolean>;
  search(query: BookSearchQueryDto): Promise<PaginatedResponse<IBookSummary>>;
  countStock(): Promise<BookStockCounts>;
}
