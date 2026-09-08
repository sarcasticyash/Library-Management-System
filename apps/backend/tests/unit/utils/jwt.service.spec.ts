import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { JwtService, AccessTokenClaims } from '@utils/jwt.service';
import { AuthenticationError } from '@utils/error';

describe('JwtService', () => {
  const testSecret = 'super-secret-test-key-at-least-32-chars-long!';
  const jwtService = new JwtService(testSecret, '15m');

  const validClaims: AccessTokenClaims = {
    sub: '64f1a2b3c4d5e6f7a8b9c0d1',
    email: 'patron@library.org',
    role: 'ROLE_PATRON',
    status: 'ACTIVE',
    sessionId: 'sess-12345',
  };

  describe('generateAccessToken', () => {
    it('should generate a valid HS256 JWT string', () => {
      const token = jwtService.generateAccessToken(validClaims);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);

      const decodedHeader = jwt.decode(token, { complete: true });
      expect(decodedHeader?.header.alg).toBe('HS256');
    });

    it('should encode all supplied claims in payload', () => {
      const token = jwtService.generateAccessToken(validClaims);
      const verified = jwtService.verifyAccessToken(token);

      expect(verified.sub).toBe(validClaims.sub);
      expect(verified.email).toBe(validClaims.email);
      expect(verified.role).toBe(validClaims.role);
      expect(verified.status).toBe(validClaims.status);
      expect(verified.sessionId).toBe(validClaims.sessionId);
    });
  });

  describe('verifyAccessToken', () => {
    it('should successfully verify a valid access token', () => {
      const token = jwtService.generateAccessToken(validClaims);
      const claims = jwtService.verifyAccessToken(token);

      expect(claims.sub).toBe(validClaims.sub);
      expect(claims.email).toBe(validClaims.email);
    });

    it('should throw AuthenticationError with ERR-AUTH-TOKEN-EXPIRED when token has expired', () => {
      const shortLivedJwtService = new JwtService(testSecret, '0s');
      const expiredToken = shortLivedJwtService.generateAccessToken(validClaims);

      expect(() => jwtService.verifyAccessToken(expiredToken)).toThrow(AuthenticationError);
      try {
        jwtService.verifyAccessToken(expiredToken);
      } catch (err) {
        expect((err as AuthenticationError).code).toBe('ERR-AUTH-TOKEN-EXPIRED');
      }
    });

    it('should throw AuthenticationError with ERR-AUTH-INVALID-TOKEN on forged signature', () => {
      const token = jwtService.generateAccessToken(validClaims);
      const differentSecretService = new JwtService(
        'completely-different-signing-secret-key-32',
        '15m',
      );

      expect(() => differentSecretService.verifyAccessToken(token)).toThrow(AuthenticationError);
      try {
        differentSecretService.verifyAccessToken(token);
      } catch (err) {
        expect((err as AuthenticationError).code).toBe('ERR-AUTH-INVALID-TOKEN');
      }
    });

    it('should throw AuthenticationError with ERR-AUTH-INVALID-TOKEN on malformed token string', () => {
      expect(() => jwtService.verifyAccessToken('invalid.token.string')).toThrow(
        AuthenticationError,
      );
      try {
        jwtService.verifyAccessToken('invalid.token.string');
      } catch (err) {
        expect((err as AuthenticationError).code).toBe('ERR-AUTH-INVALID-TOKEN');
      }
    });

    it('should throw AuthenticationError with ERR-AUTH-INVALID-TOKEN if required claims are missing', () => {
      const incompleteToken = jwt.sign(
        { sub: '123' }, // missing email, role, status
        testSecret,
        { algorithm: 'HS256' },
      );

      expect(() => jwtService.verifyAccessToken(incompleteToken)).toThrow(AuthenticationError);
      try {
        jwtService.verifyAccessToken(incompleteToken);
      } catch (err) {
        expect((err as AuthenticationError).code).toBe('ERR-AUTH-INVALID-TOKEN');
      }
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a 64-character hex CSPRNG raw token and corresponding SHA-256 hash', () => {
      const { rawToken, tokenHash } = jwtService.generateRefreshToken();

      expect(rawToken).toMatch(/^[a-f0-9]{64}$/);
      expect(tokenHash).toMatch(/^[a-f0-9]{64}$/);
      expect(tokenHash).toBe(jwtService.hashToken(rawToken));
    });

    it('should generate unique refresh tokens on consecutive calls', () => {
      const token1 = jwtService.generateRefreshToken();
      const token2 = jwtService.generateRefreshToken();

      expect(token1.rawToken).not.toBe(token2.rawToken);
      expect(token1.tokenHash).not.toBe(token2.tokenHash);
    });
  });

  describe('hashToken', () => {
    it('should produce deterministic SHA-256 hash', () => {
      const raw = 'test-token-value-12345';
      const hash1 = jwtService.hashToken(raw);
      const hash2 = jwtService.hashToken(raw);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
