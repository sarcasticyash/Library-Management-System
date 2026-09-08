/**
 * Cloud-Native Library Management System (LMS)
 * Session Persistence Model & Schema
 *
 * Governed by Phase 3 Section 7.4 (Collection: sessions), Section 13 (Indexes),
 * and Decision DBD-03 (Ephemeral Sessions Collection with TTL Indexing).
 */

import { Schema, model, Document, Model, Types } from 'mongoose';

export interface SessionDocument extends Document {
  userId: Types.ObjectId;
  tokenHash: string;
  familyId: string;
  isRevoked: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export const SessionSchema = new Schema<SessionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    tokenHash: {
      type: String,
      required: [true, 'Token hash is required'],
      unique: true,
    },
    familyId: {
      type: String,
      required: [true, 'Token family identifier is required'],
    },
    isRevoked: {
      type: Boolean,
      required: true,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration timestamp is required'],
    },
    createdAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    collection: 'sessions',
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Indexes per Phase 3 Section 13
SessionSchema.index({ userId: 1, familyId: 1 }, { name: 'idx_sessions_user_family' });

// Native MongoDB TTL index: Purges documents automatically when expiresAt timestamp arrives
SessionSchema.index({ expiresAt: 1 }, { name: 'idx_sessions_ttl_expiry', expireAfterSeconds: 0 });

export const SessionModel: Model<SessionDocument> = model<SessionDocument>(
  'Session',
  SessionSchema,
);
