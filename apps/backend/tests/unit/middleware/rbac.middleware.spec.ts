import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requireRole, requireActiveAccount } from '@middleware/rbac.middleware';
import { AuthenticationError, ForbiddenError } from '@utils/error';

describe('RBAC & Account Status Middleware', () => {
  describe('requireRole', () => {
    it('should throw AuthenticationError if req.user is undefined', () => {
      const guard = requireRole('ROLE_ADMIN');
      const req = {} as Request;
      const res = {} as Response;
      const next = vi.fn() as unknown as NextFunction;

      guard(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
      expect(err).toBeInstanceOf(AuthenticationError);
    });

    it('should call next() if user possesses permitted role', () => {
      const guard = requireRole('ROLE_ADMIN', 'ROLE_LIBRARIAN');
      const req = {
        user: { id: '1', email: 'admin@lms.org', role: 'ROLE_ADMIN', status: 'ACTIVE' },
      } as Request;
      const res = {} as Response;
      const next = vi.fn() as unknown as NextFunction;

      guard(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should throw ForbiddenError if user role is not permitted', () => {
      const guard = requireRole('ROLE_ADMIN');
      const req = {
        user: { id: '1', email: 'patron@lms.org', role: 'ROLE_PATRON', status: 'ACTIVE' },
      } as Request;
      const res = {} as Response;
      const next = vi.fn() as unknown as NextFunction;

      guard(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
      expect(err).toBeInstanceOf(ForbiddenError);
      expect((err as ForbiddenError).code).toBe('ERR-AUTH-FORBIDDEN');
    });
  });

  describe('requireActiveAccount', () => {
    it('should throw AuthenticationError if req.user is undefined', () => {
      const req = {} as Request;
      const res = {} as Response;
      const next = vi.fn() as unknown as NextFunction;

      requireActiveAccount(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
      expect(err).toBeInstanceOf(AuthenticationError);
    });

    it('should call next() if user status is ACTIVE', () => {
      const req = {
        user: { id: '1', email: 'p@l.org', role: 'ROLE_PATRON', status: 'ACTIVE' },
      } as Request;
      const res = {} as Response;
      const next = vi.fn() as unknown as NextFunction;

      requireActiveAccount(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should throw ForbiddenError with ERR-AUTH-ACCOUNT-SUSPENDED if user status is SUSPENDED (BR-003)', () => {
      const req = {
        user: { id: '1', email: 'p@l.org', role: 'ROLE_PATRON', status: 'SUSPENDED' },
      } as Request;
      const res = {} as Response;
      const next = vi.fn() as unknown as NextFunction;

      requireActiveAccount(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
      expect(err).toBeInstanceOf(ForbiddenError);
      expect((err as ForbiddenError).code).toBe('ERR-AUTH-ACCOUNT-SUSPENDED');
    });
  });
});
