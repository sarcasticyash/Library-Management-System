/**
 * Cloud-Native Library Management System (LMS)
 * Audit Trail Validation Schemas & Canonical DTOs
 *
 * Governed by Phase 1 (FR-ADMIN-008), Phase 3 (Collection: audit_logs),
 * and Phase 4 Section 12.5.
 */

import { z } from 'zod';
import { AuditAction, AuditEntityType } from '../types/audit.types';
import { ObjectIdSchema, PaginationQuerySchema } from './common.schema';

/**
 * Administrative audit log stream query filter schema (FR-ADMIN-008).
 */
export const AuditQuerySchema = PaginationQuerySchema.extend({
  action: z.nativeEnum(AuditAction).optional(),
  actorId: ObjectIdSchema.optional(),
  entityType: z.nativeEnum(AuditEntityType).optional(),
  startDate: z.string().datetime({ message: 'Start date must be an ISO 8601 string' }).optional(),
  endDate: z.string().datetime({ message: 'End date must be an ISO 8601 string' }).optional(),
});

export type AuditQueryDto = z.infer<typeof AuditQuerySchema>;
