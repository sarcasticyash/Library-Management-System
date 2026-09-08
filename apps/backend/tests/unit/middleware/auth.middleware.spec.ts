import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { createAuthMiddleware } from '@middleware/auth.middleware';
import { IJwtService } from '@utils/jwt.service';
import { AuthenticationError } from '@utils/error';

describe('Auth Middleware', () => {
  const mockJwtService: IJwtService = {
    generateAccessToken: vi.fn(),
    verifyAccessToken: vi.fn(),
    generateRefreshToken: vi.fn(),
    hashToken: vi.fn(),
  };

  const authenticate = createAuthMiddleware(mockJwtService);

  it('should call next with AuthenticationError if authorization header is missing', () => {
    const req = { headers: {} } as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(err).toBeInstanceOf(AuthenticationError);
    expect((err as AuthenticationError).code).toBe('ERR-AUTH-UNAUTHORIZED');
  });

  it('should call next with AuthenticationError if header does not start with Bearer', () => {
    const req = { headers: { authorization: 'Basic dXNlcjpwYXNz' } } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(err).toBeInstanceOf(AuthenticationError);
    expect((err as AuthenticationError).code).toBe('ERR-AUTH-INVALID-TOKEN');
  });

  it('should call next with AuthenticationError if Bearer token is empty string', () => {
    const req = { headers: { authorization: 'Bearer   ' } } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(err).toBeInstanceOf(AuthenticationError);
    expect((err as AuthenticationError).code).toBe('ERR-AUTH-UNAUTHORIZED');
  });

  it('should populate req.user and call next() on valid token', () => {
    const claims = {
      sub: '64f1a2b3c4d5e6f7a8b9c0d1',
      email: 'patron@lms.org',
      role: 'ROLE_PATRON' as const,
      status: 'ACTIVE' as const,
      sessionId: 'sess-1',
    };

    vi.mocked(mockJwtService.verifyAccessToken).mockReturnValueOnce(claims);

    const req = {
      headers: { authorization: 'Bearer valid.jwt.token' },
    } as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual({
      id: claims.sub,
      email: claims.email,
      role: claims.role,
      status: claims.status,
      sessionId: claims.sessionId,
    });
  });

  it('should forward errors from jwtService to next', () => {
    vi.mocked(mockJwtService.verifyAccessToken).mockImplementationOnce(() => {
      throw new AuthenticationError('Token has expired', 'ERR-AUTH-TOKEN-EXPIRED');
    });

    const req = {
      headers: { authorization: 'Bearer expired.jwt.token' },
    } as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect((err as AuthenticationError).code).toBe('ERR-AUTH-TOKEN-EXPIRED');
  });
});
