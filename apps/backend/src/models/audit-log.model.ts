/**
 * Cloud-Native Library Management System (LMS)
 * Audit Log Persistence Model & Schema
 *
 * Governed by Phase 3 Section 7.5 (Collection: audit_logs), Section 13 (Indexes),
 * Section 17 (Application-Level Append-Only Audit Model), and Decision DBD-05.
 */

import { Schema, model, Document, Model, Types } from 'mongoose';
import { AuditAction, AuditActorRole, AuditEntityType } from '../types/audit.types';

export interface AuditLogDocument extends Document {
  actorId: Types.ObjectId;
  actorRole: AuditActorRole | string;
  action: AuditAction | string;
  entityType: AuditEntityType | string;
  entityId: string;
  metadata: Record<string, unknown>;
  ipAddress: string;
  timestamp: Date;
}

export const AuditLogSchema = new Schema<AuditLogDocument>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Actor user ID is required'],
    },
    actorRole: {
      type: String,
      enum: {
        values: [AuditActorRole.ADMIN, AuditActorRole.PATRON, AuditActorRole.SYSTEM],
        message: 'Invalid actor role: {VALUE}',
      },
      required: [true, 'Actor role is required'],
    },
    action: {
      type: String,
      enum: {
        values: [
          AuditAction.BOOK_CREATED,
          AuditAction.BOOK_UPDATED,
          AuditAction.BOOK_DEACTIVATED,
          AuditAction.USER_STATUS_UPDATED,
          AuditAction.ADMIN_RETURN_OVERRIDE,
          AuditAction.SECURITY_ALERT,
        ],
        message: 'Invalid audit action: {VALUE}',
      },
      required: [true, 'Audit action is required'],
    },
    entityType: {
      type: String,
      enum: {
        values: [
          AuditEntityType.BOOK,
          AuditEntityType.USER,
          AuditEntityType.BORROWING,
          AuditEntityType.SESSION,
          AuditEntityType.SYSTEM,
        ],
        message: 'Invalid entity type: {VALUE}',
      },
      required: [true, 'Entity type is required'],
    },
    entityId: {
      type: String,
      required: [true, 'Entity ID is required'],
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
    ipAddress: {
      type: String,
      required: [true, 'Client IP address is required'],
      trim: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    collection: 'audit_logs',
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        return ret;
      },
    },
  },
);

// Immutability Guard: Enforce Decision DBD-05 (Append-Only Audit Log)
// Strictly reject any update or delete operations attempting to modify historical logs
function rejectAuditMutation(): void {
  throw new Error(
    'AuditLog immutability violation: Audit records are strictly append-only and cannot be updated or deleted (Decision DBD-05).',
  );
}

AuditLogSchema.pre('updateOne', rejectAuditMutation);
AuditLogSchema.pre('updateMany', rejectAuditMutation);
AuditLogSchema.pre('deleteOne', rejectAuditMutation);
AuditLogSchema.pre('deleteMany', rejectAuditMutation);

// Indexes per Phase 3 Section 13
AuditLogSchema.index({ timestamp: -1 }, { name: 'idx_audit_timestamp_desc' });

AuditLogSchema.index({ entityType: 1, entityId: 1 }, { name: 'idx_audit_entity_lookup' });

AuditLogSchema.index({ actorId: 1, timestamp: -1 }, { name: 'idx_audit_actor_lookup' });

AuditLogSchema.index({ action: 1 }, { name: 'idx_audit_action' });

export const AuditLogModel: Model<AuditLogDocument> = model<AuditLogDocument>(
  'AuditLog',
  AuditLogSchema,
);
