/**
 * Cloud-Native Library Management System (LMS)
 * Session Repository Interface
 *
 * Governed by Phase 3 Section 7.4 (Collection: sessions), Decision DBD-03,
 * and Phase 6 (Token Family Rotation & Replay Revocation).
 */

import { ClientSession } from 'mongoose';

export interface ISessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  isRevoked: boolean;
  expiresAt: Date;
}

export interface ISessionRepository {
  create(
    sessionData: {
      userId: string;
      tokenHash: string;
      familyId: string;
      expiresAt: Date;
    },
    session?: ClientSession,
  ): Promise<ISessionRecord>;
  findByTokenHash(tokenHash: string, session?: ClientSession): Promise<ISessionRecord | null>;
  revokeById(id: string, session?: ClientSession): Promise<boolean>;
  revokeFamily(familyId: string, session?: ClientSession): Promise<number>;
  revokeAllByUserId(userId: string, session?: ClientSession): Promise<number>;
}
