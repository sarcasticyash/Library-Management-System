/**
 * Cloud-Native Library Management System (LMS)
 * Shared Common & Pagination Types
 *
 * Governed by Phase 4 Section 6 (RFC 7807) and Section 13 (Pagination).
 */

export type SortOrder = 'asc' | 'desc';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface FieldError {
  field: string;
  message: string;
}

/**
 * Standardized Problem Details for HTTP APIs (RFC 7807).
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  code: string;
  detail: string;
  instance: string;
  timestamp: string;
  correlationId: string;
  errors?: FieldError[];
}
