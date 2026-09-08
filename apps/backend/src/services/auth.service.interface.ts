/**
 * Cloud-Native Library Management System (LMS)
 * Authentication Service Application Boundary Interface
 *
 * Governed by Phase 1 (FR-AUTH-001 to FR-AUTH-004), Phase 4 Section 4.3 & 12.1,
 * and Phase 6 (Security Architecture).
 */

import { RegisterUserDto, LoginUserDto, AuthTokensResponseDto } from '../schemas/auth.schema';
import { IUserPublic } from '../types/user.types';

export interface LoginResult {
  tokens: AuthTokensResponseDto;
  rawRefreshToken: string;
}

export interface RefreshResult {
  accessToken: string;
  expiresIn: number;
  rawRefreshToken: string;
}

export interface IAuthService {
  /**
   * Registers a new patron account with default ACTIVE status and ROLE_PATRON.
   * Throws 409 EMAIL_ALREADY_REGISTERED if the email exists.
   */
  register(dto: RegisterUserDto): Promise<IUserPublic>;

  /**
   * Authenticates user credentials, generates access token and refresh token family.
   * Throws 401 INVALID_CREDENTIALS or 403 ACCOUNT_SUSPENDED.
   */
  login(dto: LoginUserDto): Promise<LoginResult>;

  /**
   * Invalidates active refresh token session in persistent session store.
   */
  logout(refreshToken: string): Promise<void>;

  /**
   * Rotates single-use refresh token and issues a new access token.
   * Triggers replay detection and family revocation if a reused token is presented.
   */
  refresh(refreshToken: string): Promise<RefreshResult>;
}
