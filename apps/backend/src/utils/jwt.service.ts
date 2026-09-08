/**
 * Cloud-Native Library Management System (LMS)
 * JWT Infrastructure & Token Security Service
 *
 * Governed by Phase 1 (FR-AUTH-002, FR-AUTH-004), Phase 6 Section 8 & 18.1 (HS256, 15m JWT, 7d refresh),
 * and Phase 7 (Engineering Standards).
 */

import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { UserRole, UserStatus } from '../types/user.types';
import { AuthenticationError } from './error';

export interface AccessTokenClaims {
  sub: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  sessionId?: string;
}

export interface GeneratedRefreshToken {
  rawToken: string;
  tokenHash: string;
}

export interface IJwtService {
  generateAccessToken(claims: AccessTokenClaims): string;
  verifyAccessToken(token: string): AccessTokenClaims;
  generateRefreshToken(): GeneratedRefreshToken;
  hashToken(rawToken: string): string;
}

export class JwtService implements IJwtService {
  private readonly accessSecret: string;
  private readonly accessExpiresIn: string;

  constructor(accessSecret: string = env.JWT_SECRET, accessExpiresIn: string = env.JWT_EXPIRES_IN) {
    this.accessSecret = accessSecret;
    this.accessExpiresIn = accessExpiresIn;
  }

  /**
   * Signs a short-lived 15-minute JWT access token with HS256 HMAC.
   */
  public generateAccessToken(claims: AccessTokenClaims): string {
    const options: SignOptions = {
      algorithm: 'HS256',
      expiresIn: this.accessExpiresIn as unknown as number, // jsonwebtoken accepts string like '15m'
    };

    return jwt.sign(
      {
        sub: claims.sub,
        email: claims.email,
        role: claims.role,
        status: claims.status,
        sessionId: claims.sessionId,
      },
      this.accessSecret,
      options,
    );
  }

  /**
   * Verifies an access token's HMAC-SHA256 signature and validity window.
   * Throws standardized AuthenticationError on expiration or malformed signature.
   */
  public verifyAccessToken(token: string): AccessTokenClaims {
    try {
      const decoded = jwt.verify(token, this.accessSecret, {
        algorithms: ['HS256'],
      }) as AccessTokenClaims & { sub: string };

      if (!decoded.sub || !decoded.email || !decoded.role || !decoded.status) {
        throw new AuthenticationError('Malformed token payload', 'ERR-AUTH-INVALID-TOKEN');
      }

      return {
        sub: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        status: decoded.status,
        sessionId: decoded.sessionId,
      };
    } catch (err: unknown) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Token has expired', 'ERR-AUTH-TOKEN-EXPIRED');
      }
      if (err instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid authentication token', 'ERR-AUTH-INVALID-TOKEN');
      }
      if (err instanceof AuthenticationError) {
        throw err;
      }
      throw new AuthenticationError('Authentication failed', 'ERR-AUTH-UNAUTHORIZED');
    }
  }

  /**
   * Generates an opaque 256-bit CSPRNG refresh token and computes its SHA-256 hash.
   * Only the hash is stored in MongoDB; the raw token is emitted to the client cookie.
   */
  public generateRefreshToken(): GeneratedRefreshToken {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    return { rawToken, tokenHash };
  }

  /**
   * Computes deterministic SHA-256 hash of an opaque token for lookup in sessions.
   */
  public hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }
}

export const jwtService = new JwtService();
