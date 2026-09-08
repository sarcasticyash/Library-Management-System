import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { errorMiddleware } from '@middleware/error.middleware';
import { NotFoundError, ConflictError } from '@utils/error';

describe('errorMiddleware', () => {
  const createMockResponse = () => {
    const res = {} as Response;
    res.status = vi.fn().mockReturnValue(res);
    res.setHeader = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  it('should serialize AppError into RFC 7807 Problem Details response', () => {
    const error = new NotFoundError('Book with id 123 not found', 'ERR-RES-NOT-FOUND');
    const req = {
      originalUrl: '/api/v1/books/123',
      method: 'GET',
      correlationId: 'req-abc-123',
    } as Request;
    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    errorMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/problem+json');
    expect(res.json).toHaveBeenCalledTimes(1);

    const problem = (res.json as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(problem.status).toBe(404);
    expect(problem.code).toBe('ERR-RES-NOT-FOUND');
    expect(problem.title).toBe('Not Found');
    expect(problem.detail).toBe('Book with id 123 not found');
    expect(problem.instance).toBe('/api/v1/books/123');
  });

  it('should serialize ZodError into 400 Bad Request with invalidParams', () => {
    const schema = z.object({ title: z.string() });
    let zodError: ZodError | undefined;
    try {
      schema.parse({});
    } catch (err) {
      zodError = err as ZodError;
    }

    const req = {
      originalUrl: '/api/v1/books',
      method: 'POST',
      correlationId: 'req-val-456',
    } as Request;
    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    errorMiddleware(zodError!, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/problem+json');

    const problem = (res.json as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(problem.status).toBe(400);
    expect(problem.code).toBe('ERR-VAL-INVALID-INPUT');
    expect(problem.invalidParams).toBeDefined();
    expect(problem.invalidParams[0].name).toBe('title');
  });

  it('should handle unhandled Error with 500 status code', () => {
    const error = new Error('Unexpected database failure');
    const req = {
      originalUrl: '/api/v1/catalog',
      method: 'GET',
      correlationId: 'req-sys-789',
    } as Request;
    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    errorMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/problem+json');

    const problem = (res.json as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(problem.status).toBe(500);
    expect(problem.code).toBe('ERR-SYS-INTERNAL-ERROR');
  });
});
