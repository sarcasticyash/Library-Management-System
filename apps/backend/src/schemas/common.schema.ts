/**
 * Cloud-Native Library Management System (LMS)
 * Shared Common Validation Schemas
 *
 * Governed by Phase 4 Section 11 & Section 13.
 */

import { z } from 'zod';
import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT, REGEX_OBJECT_ID } from '../types/constants';

/**
 * Standard 24-character hexadecimal MongoDB ObjectId validator.
 */
export const ObjectIdSchema = z.string().trim().regex(REGEX_OBJECT_ID, {
  message: 'Identifier must be a valid 24-character hexadecimal ObjectId',
});

/**
 * Reusable offset-based pagination query schema with type coercion and defaults.
 */
export const PaginationQuerySchema = z.object({
  page: z.coerce
    .number()
    .int('Page must be an integer')
    .min(1, 'Page must be greater than or equal to 1')
    .default(DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be greater than or equal to 1')
    .max(MAX_LIMIT, `Limit must be less than or equal to ${MAX_LIMIT}`)
    .default(DEFAULT_LIMIT),
});

export type PaginationQueryDto = z.infer<typeof PaginationQuerySchema>;
