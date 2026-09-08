/**
 * Cloud-Native Library Management System (LMS)
 * Authentication DTO Types
 *
 * Governed by Phase 1 (FR-AUTH-001 to FR-AUTH-004), Phase 6 (Security),
 * and Phase 4 Section 12.1.
 */

import { IUserPublic } from './user';

export interface RegisterUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string | null;
}

export interface LoginUserDto {
  email: string;
  password: string;
}

export interface AuthTokensResponseDto {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: IUserPublic;
}

export interface RefreshTokenResponseDto {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}
