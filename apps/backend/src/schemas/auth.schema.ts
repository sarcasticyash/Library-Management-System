/**
 * Cloud-Native Library Management System (LMS)
 * Authentication Validation Schemas & Canonical DTOs
 *
 * Governed by Phase 1 (FR-AUTH-001 to FR-AUTH-004), Phase 6 (Security),
 * and Phase 4 Section 12.1.
 */

import { z } from 'zod';
import { PASSWORD_MIN_LENGTH, REGEX_PASSWORD } from '../types/constants';
import { IUserPublic } from '../types/user.types';

/**
 * Patron registration payload validation (FR-AUTH-001).
 */
export const RegisterUserSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(50, 'First name cannot exceed 50 characters'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(50, 'Last name cannot exceed 50 characters'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address format')
    .max(255, 'Email cannot exceed 255 characters'),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`)
    .regex(
      REGEX_PASSWORD,
      'Password must contain at least one uppercase letter, one lowercase letter, one numeric digit, and one special character',
    ),
  phoneNumber: z
    .string()
    .trim()
    .max(20, 'Phone number cannot exceed 20 characters')
    .optional()
    .nullable(),
});

export type RegisterUserDto = z.infer<typeof RegisterUserSchema>;

/**
 * User login payload validation (FR-AUTH-002).
 */
export const LoginUserSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginUserDto = z.infer<typeof LoginUserSchema>;

/**
 * Successful authentication response body contract.
 * Note: Long-lived refreshToken is transmitted via HttpOnly Secure Cookie.
 */
export interface AuthTokensResponseDto {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: IUserPublic;
}
