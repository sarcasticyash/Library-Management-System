import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateRequest } from '@middleware/validate.middleware';
import { ValidationError } from '@utils/error';

describe('validateRequest Middleware', () => {
  const sampleBodySchema = z.object({
    title: z.string().min(3),
    copies: z.number().int().min(1),
  });

  const sampleQuerySchema = z.object({
    page: z.coerce.number().min(1),
  });

  const sampleParamSchema = z.object({
    id: z.string().length(24),
  });

  it('should call next() and populate parsed body when validation succeeds', async () => {
    const middleware = validateRequest({ body: sampleBodySchema });
    const req = {
      body: { title: 'Valid Title', copies: 5 },
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ title: 'Valid Title', copies: 5 });
  });

  it('should call next() with ValidationError when body validation fails', async () => {
    const middleware = validateRequest({ body: sampleBodySchema });
    const req = {
      body: { title: 'No', copies: 0 },
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const errorArg = (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(errorArg).toBeInstanceOf(ValidationError);
    expect((errorArg as ValidationError).invalidParams).toHaveLength(2);
  });

  it('should parse and coerce query and params parameters', async () => {
    const middleware = validateRequest({
      query: sampleQuerySchema,
      params: sampleParamSchema,
    });
    const req = {
      query: { page: '2' },
      params: { id: '64f1a2b3c4d5e6f7a8b9c0d1' },
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.query.page).toBe(2);
    expect(req.params.id).toBe('64f1a2b3c4d5e6f7a8b9c0d1');
  });

  it('should pass non-Zod errors through to next', async () => {
    const brokenSchema = {
      parseAsync: vi.fn().mockRejectedValue(new Error('Internal schema error')),
    } as unknown as z.ZodSchema;

    const middleware = validateRequest({ body: brokenSchema });
    const req = { body: {} } as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const errorArg = (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect((errorArg as Error).message).toBe('Internal schema error');
  });
});
