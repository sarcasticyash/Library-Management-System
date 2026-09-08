import { apiClient } from './client';
import { PaginatedResponse, PaginationParams } from '../types/common';
import { BorrowBookDto, IActiveLoansResponse, IBorrowing } from '../types/circulation';

export const circulationApi = {
  /**
   * POST /api/v1/borrowings (FR-BORROW-001)
   */
  async borrowBook(dto: BorrowBookDto): Promise<IBorrowing> {
    const response = await apiClient.post<IBorrowing>('/borrowings', dto);
    return response.data;
  },

  /**
   * POST /api/v1/borrowings/:borrowingId/return (FR-BORROW-002)
   */
  async returnBook(borrowingId: string): Promise<IBorrowing> {
    const response = await apiClient.post<IBorrowing>(
      `/borrowings/${encodeURIComponent(borrowingId)}/return`,
    );
    return response.data;
  },

  /**
   * GET /api/v1/borrowings/my-active (FR-BORROW-003)
   */
  async getActiveLoans(): Promise<IActiveLoansResponse> {
    const response = await apiClient.get<IActiveLoansResponse>('/borrowings/my-active');
    return response.data;
  },

  /**
   * GET /api/v1/borrowings/my-history (FR-BORROW-004)
   */
  async getBorrowingHistory(params?: PaginationParams): Promise<PaginatedResponse<IBorrowing>> {
    const response = await apiClient.get<PaginatedResponse<IBorrowing>>('/borrowings/my-history', {
      params,
    });
    return response.data;
  },
};
