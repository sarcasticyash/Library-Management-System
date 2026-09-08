/**
 * Cloud-Native Library Management System (LMS)
 * Session Repository Implementation
 *
 * Governed by Phase 3 Section 7.4, Decision DBD-03, and Phase 6 Section 6.
 */

import { ClientSession, Types } from 'mongoose';
import { ISessionRecord, ISessionRepository } from './session.repository.interface';
import { SessionDocument, SessionModel } from '../models/session.model';

export class SessionRepository implements ISessionRepository {
  private toDomain(doc: SessionDocument): ISessionRecord {
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      tokenHash: doc.tokenHash,
      familyId: doc.familyId,
      isRevoked: doc.isRevoked,
      expiresAt: doc.expiresAt,
    };
  }

  public async create(
    sessionData: {
      userId: string;
      tokenHash: string;
      familyId: string;
      expiresAt: Date;
    },
    session?: ClientSession,
  ): Promise<ISessionRecord> {
    const [created] = await SessionModel.create(
      [
        {
          userId: new Types.ObjectId(sessionData.userId),
          tokenHash: sessionData.tokenHash,
          familyId: sessionData.familyId,
          expiresAt: sessionData.expiresAt,
          isRevoked: false,
        },
      ],
      { session },
    );

    if (!created) {
      throw new Error('Failed to create session document');
    }

    return this.toDomain(created);
  }

  public async findByTokenHash(
    tokenHash: string,
    session?: ClientSession,
  ): Promise<ISessionRecord | null> {
    const doc = await SessionModel.findOne({ tokenHash }).session(session || null);
    return doc ? this.toDomain(doc) : null;
  }

  public async revokeById(id: string, session?: ClientSession): Promise<boolean> {
    const res = await SessionModel.updateOne({ _id: id }, { $set: { isRevoked: true } }).session(
      session || null,
    );

    return res.modifiedCount > 0;
  }

  /**
   * Invalidates all tokens within a session family (triggered on replay detection).
   */
  public async revokeFamily(familyId: string, session?: ClientSession): Promise<number> {
    const res = await SessionModel.updateMany(
      { familyId, isRevoked: false },
      { $set: { isRevoked: true } },
    ).session(session || null);

    return res.modifiedCount;
  }

  /**
   * Invalidates all active sessions for a user (e.g. password change or account suspension).
   */
  public async revokeAllByUserId(userId: string, session?: ClientSession): Promise<number> {
    const res = await SessionModel.updateMany(
      { userId: new Types.ObjectId(userId), isRevoked: false },
      { $set: { isRevoked: true } },
    ).session(session || null);

    return res.modifiedCount;
  }
}

export const sessionRepository: ISessionRepository = new SessionRepository();
