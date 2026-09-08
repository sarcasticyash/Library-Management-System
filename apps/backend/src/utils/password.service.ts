/**
 * Cloud-Native Library Management System (LMS)
 * Password Security Service
 *
 * Governed by Phase 1 (NFR-SEC-01), Phase 6 Section 18.2 (bcrypt Work Factor >= 12),
 * and Phase 6 Section 8.4 (Constant-time execution against email enumeration).
 */

import bcrypt from 'bcrypt';
import { env } from '../config/env';

export interface IPasswordService {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
  dummyCompare(): Promise<void>;
}

export class PasswordService implements IPasswordService {
  private readonly saltRounds: number;
  // Pre-computed dummy hash used to equalize execution timing during failed email lookups
  private readonly dummyHash = '$2b$12$e8f1e0d29b244a5f8c317b89d42e12a0ZpQYwK3V.w0tqD6tK2TGy';

  constructor(saltRounds: number = env.BCRYPT_SALT_ROUNDS) {
    this.saltRounds = saltRounds;
  }

  /**
   * Hashes a plaintext password using bcrypt with work factor >= 12.
   */
  public async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Securely compares a candidate password against an existing bcrypt hash.
   */
  public async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Executes a constant-time dummy bcrypt comparison when an email is not found,
   * defeating user enumeration timing attacks (Phase 6 Section 18.2).
   */
  public async dummyCompare(): Promise<void> {
    await bcrypt.compare('dummyPasswordVerification123!', this.dummyHash);
  }
}

export const passwordService = new PasswordService();
