import { apiClient } from './client';
import { ChangePasswordDto, IUserPublic } from '../types/user';

export const userApi = {
  /**
   * GET /api/v1/users/profile (FR-USER-001)
   */
  async getProfile(): Promise<IUserPublic> {
    const response = await apiClient.get<IUserPublic>('/users/profile');
    return response.data;
  },

  /**
   * PATCH /api/v1/users/password (FR-USER-002)
   */
  async changePassword(dto: ChangePasswordDto): Promise<{ message: string }> {
    const response = await apiClient.patch<{ message: string }>('/users/password', dto);
    return response.data;
  },
};
