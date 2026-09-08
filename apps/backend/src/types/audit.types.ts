/**
 * Cloud-Native Library Management System (LMS)
 * Audit Log Domain Types
 *
 * Governed by Phase 1 (FR-ADMIN-008), Phase 3 (Collection: audit_logs),
 * and Phase 4 Section 14 (Two-Tier Audit Integration).
 */

export enum AuditAction {
  BOOK_CREATED = 'BOOK_CREATED',
  BOOK_UPDATED = 'BOOK_UPDATED',
  BOOK_DEACTIVATED = 'BOOK_DEACTIVATED',
  USER_STATUS_UPDATED = 'USER_STATUS_UPDATED',
  ADMIN_RETURN_OVERRIDE = 'ADMIN_RETURN_OVERRIDE',
  SECURITY_ALERT = 'SECURITY_ALERT',
}

export enum AuditEntityType {
  BOOK = 'BOOK',
  USER = 'USER',
  BORROWING = 'BORROWING',
  SESSION = 'SESSION',
  SYSTEM = 'SYSTEM',
}

export enum AuditActorRole {
  ADMIN = 'ROLE_ADMIN',
  PATRON = 'ROLE_PATRON',
  SYSTEM = 'SYSTEM',
}

/**
 * Append-only immutable audit trail domain entity.
 */
export interface IAuditLog {
  id: string;
  actorId: string;
  actorRole: AuditActorRole | string;
  action: AuditAction | string;
  entityType: AuditEntityType | string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress: string;
  timestamp: Date;
}
