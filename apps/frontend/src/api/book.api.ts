import { apiClient } from './client';
import { PaginatedResponse } from '../types/common';
import { IBook, IBookAvailability, IBookSummary, SearchBooksParams } from '../types/book';

export const bookApi = {
  /**
   * GET /api/v1/books (FR-BOOK-001, FR-BOOK-002)
   */
  async searchBooks(params?: SearchBooksParams): Promise<PaginatedResponse<IBookSummary>> {
    const response = await apiClient.get<PaginatedResponse<IBookSummary>>('/books', {
      params,
    });
    return response.data;
  },

  /**
   * GET /api/v1/books/:bookId (FR-BOOK-003)
   */
  async getBookById(bookId: string): Promise<IBook> {
    const response = await apiClient.get<IBook>(`/books/${encodeURIComponent(bookId)}`);
    return response.data;
  },

  /**
   * GET /api/v1/books/:bookId/availability (FR-BOOK-004)
   */
  async getBookAvailability(bookId: string): Promise<IBookAvailability> {
    const response = await apiClient.get<IBookAvailability>(
      `/books/${encodeURIComponent(bookId)}/availability`,
    );
    return response.data;
  },
};
