import { apiClient } from './client';
import { PaginatedResponse } from '../types/common';
import { IDashboardKpis } from '../types/dashboard';
import { CreateBookDto, IBook, UpdateBookDto } from '../types/book';
import { IUserPublic, UpdateUserStatusDto } from '../types/user';
import { IBorrowing, ReturnOverrideDto } from '../types/circulation';
import { AuditLogQueryParams, IAuditLog } from '../types/audit';

export const adminApi = {
  /**
   * GET /api/v1/admin/dashboard/kpis (FR-ADMIN-001)
   */
  async getDashboardKpis(): Promise<IDashboardKpis> {
    const response = await apiClient.get<IDashboardKpis>('/admin/dashboard/kpis');
    return response.data;
  },

  /**
   * POST /api/v1/admin/books (FR-ADMIN-002)
   */
  async createBook(dto: CreateBookDto): Promise<IBook> {
    const response = await apiClient.post<IBook>('/admin/books', dto);
    return response.data;
  },

  /**
   * PUT /api/v1/admin/books/:bookId (FR-ADMIN-003)
   */
  async updateBook(bookId: string, dto: UpdateBookDto): Promise<IBook> {
    const response = await apiClient.put<IBook>(`/admin/books/${encodeURIComponent(bookId)}`, dto);
    return response.data;
  },

  /**
   * DELETE /api/v1/admin/books/:bookId (FR-ADMIN-004)
   */
  async deleteBook(
    bookId: string,
  ): Promise<{ id: string; isDeleted: boolean; deletedAt: string; message: string }> {
    const response = await apiClient.delete<{
      id: string;
      isDeleted: boolean;
      deletedAt: string;
      message: string;
    }>(`/admin/books/${encodeURIComponent(bookId)}`);
    return response.data;
  },

  /**
   * PATCH /api/v1/admin/users/:userId/status (FR-ADMIN-005)
   */
  async updateUserStatus(userId: string, dto: UpdateUserStatusDto): Promise<IUserPublic> {
    const response = await apiClient.patch<IUserPublic>(
      `/admin/users/${encodeURIComponent(userId)}/status`,
      dto,
    );
    return response.data;
  },

  /**
   * GET /api/v1/admin/borrowings (FR-ADMIN-006)
   */
  async getAllBorrowings(params?: {
    status?: string;
    userId?: string;
    bookId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<IBorrowing>> {
    const response = await apiClient.get<PaginatedResponse<IBorrowing>>('/admin/borrowings', {
      params,
    });
    return response.data;
  },

  /**
   * POST /api/v1/admin/borrowings/:borrowingId/return-override (FR-ADMIN-007)
   */
  async returnOverride(borrowingId: string, dto: ReturnOverrideDto): Promise<IBorrowing> {
    const response = await apiClient.post<IBorrowing>(
      `/admin/borrowings/${encodeURIComponent(borrowingId)}/return-override`,
      dto,
    );
    return response.data;
  },

  /**
   * GET /api/v1/admin/audit-logs (FR-ADMIN-008)
   */
  async getAuditLogs(params?: AuditLogQueryParams): Promise<PaginatedResponse<IAuditLog>> {
    const response = await apiClient.get<PaginatedResponse<IAuditLog>>('/admin/audit-logs', {
      params,
    });
    return response.data;
  },
};
