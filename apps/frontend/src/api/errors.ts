import { AxiosError } from 'axios';
import { FieldError, ProblemDetails } from '../types/common';

/**
 * Standardized client API error derived from RFC 7807 Problem Details.
 * Governed by Phase 5 Section 16.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly detail: string;
  public readonly title?: string;
  public readonly instance?: string;
  public readonly correlationId?: string;
  public readonly fieldErrors?: FieldError[];

  constructor(problem: Partial<ProblemDetails> & { message?: string; status?: number }) {
    super(problem.detail ?? problem.message ?? 'Unknown error');
    this.name = 'ApiError';
    this.status = problem.status ?? 500;
    this.code = problem.code ?? 'UNKNOWN_ERROR';
    this.title = problem.title;
    this.detail = problem.detail ?? problem.message ?? 'Unknown error';
    this.instance = problem.instance;
    this.correlationId = problem.correlationId;
    this.fieldErrors = problem.errors;
  }
}

/**
 * Safely parse an unknown error (e.g. AxiosError or Network Error) into a typed ApiError.
 */
export function parseProblemDetails(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (isAxiosError(error)) {
    const responseData = error.response?.data;

    if (responseData && typeof responseData === 'object') {
      const p = responseData as Partial<ProblemDetails>;
      return new ApiError({
        title: p.title,
        message: p.detail ?? error.message,
        detail: p.detail ?? error.message,
        status: error.response?.status ?? 500,
        code: p.code ?? `HTTP_${error.response?.status ?? 500}`,
        instance: p.instance ?? error.config?.url,
        correlationId: p.correlationId,
        errors: Array.isArray(p.errors) ? p.errors : undefined,
      });
    }

    // Network timeout or no response
    if (error.request && !error.response) {
      return new ApiError({
        message: 'Network connection failed. Please check your internet connection.',
        detail: 'Network connection failed. Please check your internet connection.',
        status: 0,
        code: 'NETWORK_ERROR',
      });
    }
  }

  const genericMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
  return new ApiError({
    message: genericMsg,
    detail: genericMsg,
    status: 500,
    code: 'UNEXPECTED_ERROR',
  });
}

function isAxiosError(error: unknown): error is AxiosError {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error;
}
