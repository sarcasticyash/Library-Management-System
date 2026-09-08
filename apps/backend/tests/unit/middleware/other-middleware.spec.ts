import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { correlationMiddleware } from '@middleware/correlation.middleware';
import { notFoundMiddleware } from '@middleware/not-found.middleware';
import { requestLoggerMiddleware } from '@middleware/request-logger.middleware';
import { NotFoundError } from '@utils/error';

describe('Additional Middlewares Unit Tests', () => {
  describe('correlationMiddleware', () => {
    it('should reuse existing X-Correlation-ID header if present', () => {
      const req = {
        header: vi.fn().mockImplementation((name: string) => {
          if (name === 'X-Correlation-ID') return 'existing-corr-id-123';
          return undefined;
        }),
      } as unknown as Request;
      const res = { setHeader: vi.fn() } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      correlationMiddleware(req, res, next);

      expect(req.correlationId).toBe('existing-corr-id-123');
      expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-ID', 'existing-corr-id-123');
      expect(next).toHaveBeenCalled();
    });

    it('should generate a new UUID if no header is present', () => {
      const req = { header: vi.fn().mockReturnValue(undefined) } as unknown as Request;
      const res = { setHeader: vi.fn() } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      correlationMiddleware(req, res, next);

      expect(req.correlationId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-ID', req.correlationId);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('notFoundMiddleware', () => {
    it('should forward a NotFoundError to next()', () => {
      const req = { method: 'GET', originalUrl: '/non-existent-route' } as Request;
      const res = {} as Response;
      const next = vi.fn() as unknown as NextFunction;

      notFoundMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
      expect(err).toBeInstanceOf(NotFoundError);
      expect((err as NotFoundError).message).toBe('Cannot GET /non-existent-route');
    });
  });

  describe('requestLoggerMiddleware', () => {
    it('should register finish listener and execute next()', () => {
      const listeners: Record<string, () => void> = {};
      const req = {
        method: 'GET',
        originalUrl: '/api/v1/test',
        header: vi.fn().mockReturnValue('test-agent'),
        ip: '127.0.0.1',
        startTime: Date.now(),
        correlationId: 'corr-1',
      } as unknown as Request;
      const res = {
        statusCode: 200,
        on: vi.fn().mockImplementation((event, cb) => {
          listeners[event] = cb;
        }),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      requestLoggerMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));

      // Trigger finish
      expect(() => listeners['finish']?.()).not.toThrow();
    });

    it('should handle error status code in finish listener', () => {
      const listeners: Record<string, () => void> = {};
      const req = {
        method: 'POST',
        originalUrl: '/api/v1/test',
        header: vi.fn(),
        socket: { remoteAddress: '10.0.0.1' },
        startTime: Date.now(),
        user: { id: 'u1', role: 'ROLE_ADMIN' },
      } as unknown as Request;
      const res = {
        statusCode: 500,
        on: vi.fn().mockImplementation((event, cb) => {
          listeners[event] = cb;
        }),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      requestLoggerMiddleware(req, res, next);

      // Trigger finish
      expect(() => listeners['finish']?.()).not.toThrow();
    });
  });
});
