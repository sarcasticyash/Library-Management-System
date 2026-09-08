import { describe, it, expect } from 'vitest';
import { PasswordService } from '@utils/password.service';

describe('PasswordService', () => {
  const passwordService = new PasswordService();

  describe('hash', () => {
    it('should successfully hash a plaintext password with bcrypt work factor >= 12', async () => {
      const password = 'StrongPassword123!';
      const hash = await passwordService.hash(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      // bcrypt hashes start with $2a$ or $2b$ followed by the cost factor (12)
      expect(hash).toMatch(/^\$2[ab]\$12\$/);
    });

    it('should generate different salts/hashes for identical passwords', async () => {
      const password = 'StrongPassword123!';
      const hash1 = await passwordService.hash(password);
      const hash2 = await passwordService.hash(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('compare', () => {
    it('should return true when plaintext matches hash', async () => {
      const password = 'StrongPassword123!';
      const hash = await passwordService.hash(password);

      const isValid = await passwordService.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it('should return false when plaintext does not match hash', async () => {
      const password = 'StrongPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hash = await passwordService.hash(password);

      const isValid = await passwordService.compare(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe('dummyCompare', () => {
    it('should execute constant-time dummy comparison without error', async () => {
      await expect(passwordService.dummyCompare()).resolves.toBeUndefined();
    });
  });
});
