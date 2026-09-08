import { apiClient, setAccessToken } from './client';
import {
  AuthTokensResponseDto,
  LoginUserDto,
  RefreshTokenResponseDto,
  RegisterUserDto,
} from '../types/auth';
import { IUserPublic } from '../types/user';

export const authApi = {
  /**
   * POST /api/v1/auth/login (FR-AUTH-002)
   */
  async login(dto: LoginUserDto): Promise<AuthTokensResponseDto> {
    const response = await apiClient.post<AuthTokensResponseDto>('/auth/login', dto);
    setAccessToken(response.data.accessToken);
    return response.data;
  },

  /**
   * POST /api/v1/auth/register (FR-AUTH-001)
   */
  async register(dto: RegisterUserDto): Promise<IUserPublic> {
    const response = await apiClient.post<IUserPublic>('/auth/register', dto);
    return response.data;
  },

  /**
   * POST /api/v1/auth/logout (FR-AUTH-003)
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setAccessToken(null);
    }
  },

  /**
   * POST /api/v1/auth/refresh (FR-AUTH-004)
   */
  async refresh(): Promise<RefreshTokenResponseDto> {
    const response = await apiClient.post<RefreshTokenResponseDto>('/auth/refresh');
    setAccessToken(response.data.accessToken);
    return response.data;
  },
};
