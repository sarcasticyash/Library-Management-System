/**
 * Cloud-Native Library Management System (LMS)
 * User & Identity Validation Schemas & Canonical DTOs
 *
 * Governed by Phase 1 (FR-USER-002, FR-ADMIN-005) and Phase 4 Section 12.2 & 12.5.
 */

import { z } from 'zod';
import { PASSWORD_MIN_LENGTH, REGEX_PASSWORD } from '../types/constants';
import { UserStatus } from '../types/user.types';
import { ObjectIdSchema } from './common.schema';

/**
 * Route path parameter for user-specific endpoints: :userId
 */
export const UserIdParamSchema = z.object({
  userId: ObjectIdSchema,
});

export type UserIdParamDto = z.infer<typeof UserIdParamSchema>;

/**
 * Password change payload validation (FR-USER-002).
 */
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(
      PASSWORD_MIN_LENGTH,
      `New password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
    )
    .regex(
      REGEX_PASSWORD,
      'New password must contain at least one uppercase letter, one lowercase letter, one numeric digit, and one special character',
    ),
});

export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;

/**
 * Administrative account suspension/reactivation payload validation (FR-ADMIN-005).
 */
export const UpdateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus, {
    errorMap: () => ({
      message: 'Status must be either ACTIVE or SUSPENDED',
    }),
  }),
  reason: z
    .string()
    .trim()
    .min(5, 'Reason must be at least 5 characters')
    .max(500, 'Reason cannot exceed 500 characters'),
});

export type UpdateUserStatusDto = z.infer<typeof UpdateUserStatusSchema>;
