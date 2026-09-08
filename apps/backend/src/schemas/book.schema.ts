/**
 * Cloud-Native Library Management System (LMS)
 * Book Catalog Validation Schemas & Canonical DTOs
 *
 * Governed by Phase 1 (FR-BOOK-001 to FR-BOOK-004, FR-ADMIN-002 to FR-ADMIN-004),
 * Phase 3 (Collection: books), and Phase 4 Section 12.3 & 12.5.
 */

import { z } from 'zod';
import { REGEX_ISBN } from '../types/constants';
import { BookGenre } from '../types/book.types';
import { ObjectIdSchema, PaginationQuerySchema } from './common.schema';

/**
 * Route path parameter for book-specific endpoints: :bookId
 */
export const BookIdParamSchema = z.object({
  bookId: ObjectIdSchema,
});

export type BookIdParamDto = z.infer<typeof BookIdParamSchema>;

/**
 * Physical shelf placement sub-document schema.
 */
export const BookLocationSchema = z.object({
  aisle: z
    .string()
    .trim()
    .min(1, 'Aisle coordinate is required')
    .max(30, 'Aisle coordinate cannot exceed 30 characters'),
  shelf: z
    .string()
    .trim()
    .min(1, 'Shelf coordinate is required')
    .max(30, 'Shelf coordinate cannot exceed 30 characters'),
});

export type BookLocationDto = z.infer<typeof BookLocationSchema>;

/**
 * Administrative new book creation schema (FR-ADMIN-002).
 */
export const CreateBookSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(255, 'Title cannot exceed 255 characters'),
  author: z
    .string()
    .trim()
    .min(1, 'Author is required')
    .max(150, 'Author cannot exceed 150 characters'),
  isbn: z.string().trim().toUpperCase().regex(REGEX_ISBN, 'Invalid ISBN-10 or ISBN-13 format'),
  genre: z.nativeEnum(BookGenre, {
    errorMap: () => ({
      message: 'Genre must be one of the approved catalog genres',
    }),
  }),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(2000, 'Description cannot exceed 2000 characters'),
  publisher: z
    .string()
    .trim()
    .min(1, 'Publisher is required')
    .max(100, 'Publisher cannot exceed 100 characters'),
  publicationYear: z.coerce
    .number()
    .int('Publication year must be an integer')
    .min(1000, 'Publication year must be at least 1000')
    .max(
      new Date().getFullYear() + 1,
      `Publication year cannot exceed ${new Date().getFullYear() + 1}`,
    ),
  totalCopies: z.coerce
    .number()
    .int('Total copies must be an integer')
    .min(1, 'Total copies must be at least 1')
    .max(1000, 'Total copies cannot exceed 1000'),
  location: BookLocationSchema,
  coverImageUrl: z
    .string()
    .trim()
    .url('Cover image URL must be a valid URL')
    .refine((url) => url.startsWith('https://'), {
      message: 'Cover image URL must use secure HTTPS protocol',
    })
    .optional()
    .nullable(),
});

export type CreateBookDto = z.infer<typeof CreateBookSchema>;

/**
 * Administrative book update schema (FR-ADMIN-003).
 */
export const UpdateBookSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty')
    .max(255, 'Title cannot exceed 255 characters')
    .optional(),
  author: z
    .string()
    .trim()
    .min(1, 'Author cannot be empty')
    .max(150, 'Author cannot exceed 150 characters')
    .optional(),
  genre: z.nativeEnum(BookGenre).optional(),
  description: z
    .string()
    .trim()
    .min(1, 'Description cannot be empty')
    .max(2000, 'Description cannot exceed 2000 characters')
    .optional(),
  publisher: z
    .string()
    .trim()
    .min(1, 'Publisher cannot be empty')
    .max(100, 'Publisher cannot exceed 100 characters')
    .optional(),
  publicationYear: z.coerce
    .number()
    .int()
    .min(1000)
    .max(new Date().getFullYear() + 1)
    .optional(),
  totalCopies: z.coerce
    .number()
    .int('Total copies must be an integer')
    .min(1, 'Total copies must be at least 1')
    .max(1000, 'Total copies cannot exceed 1000')
    .optional(),
  location: BookLocationSchema.optional(),
  coverImageUrl: z
    .string()
    .trim()
    .url('Cover image URL must be a valid URL')
    .refine((url) => url.startsWith('https://'), {
      message: 'Cover image URL must use secure HTTPS protocol',
    })
    .optional()
    .nullable(),
});

export type UpdateBookDto = z.infer<typeof UpdateBookSchema>;

/**
 * Catalog search and faceted filtering query schema (FR-BOOK-001, FR-BOOK-002).
 */
export const BookSearchQuerySchema = PaginationQuerySchema.extend({
  q: z.string().trim().max(200, 'Search query cannot exceed 200 characters').optional(),
  genre: z.string().trim().optional(),
  available: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  sortBy: z.enum(['title', 'author', 'publicationYear', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type BookSearchQueryDto = z.infer<typeof BookSearchQuerySchema>;
