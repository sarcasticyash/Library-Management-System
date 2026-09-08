/**
 * Cloud-Native Library Management System (LMS)
 * Audit Service Implementation
 *
 * Governed by Phase 1 (FR-ADMIN-008), Phase 3 (Decision DBD-05),
 * Phase 4 Section 14 (Two-Tier Audit Integration), and Phase 6 Section 19.
 */

import { IAuditService } from './audit.service.interface';
import { IAuditLogRepository } from '../repositories/audit-log.repository.interface';
import { auditLogRepository } from '../repositories';
import { IAuditLog } from '../types/audit.types';
import { PaginatedResponse } from '../types/common.types';
import { AuditQueryDto } from '../schemas/audit.schema';
import { logger } from '../utils/logger';

const SENSITIVE_KEYS = new Set([
  'password',
  'currentpassword',
  'newpassword',
  'token',
  'refreshtoken',
  'authorization',
  'secret',
  'passwordhash',
]);

/**
 * Recursively redacts sensitive keys from audit event metadata.
 */
function sanitizeAuditMetadata(meta: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!meta || typeof meta !== 'object') {
    return {};
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(meta)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      sanitized[key] = sanitizeAuditMetadata(val as Record<string, unknown>);
    } else {
      sanitized[key] = val;
    }
  }

  return sanitized;
}

export class AuditService implements IAuditService {
  private readonly auditRepo: IAuditLogRepository;

  constructor(auditRepo: IAuditLogRepository = auditLogRepository) {
    this.auditRepo = auditRepo;
  }

  /**
   * Records an immutable append-only audit log entry.
   * Sanitizes metadata unconditionally to prevent secret leakage.
   */
  public async logEvent(
    event: Omit<IAuditLog, 'id' | 'timestamp'>,
    session?: unknown,
  ): Promise<IAuditLog> {
    const sanitizedMetadata = sanitizeAuditMetadata(event.metadata);

    const created = await this.auditRepo.create(
      {
        ...event,
        metadata: sanitizedMetadata,
      },
      session as never,
    );

    logger.info(`Audit Log [${event.action}]: ${event.entityType}/${event.entityId}`, {
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      actorId: event.actorId,
    });

    return created;
  }

  /**
   * Paginated administrative query over historical immutable audit ledger.
   */
  public async queryLogs(query: AuditQueryDto): Promise<PaginatedResponse<IAuditLog>> {
    return this.auditRepo.query(query);
  }
}

export const auditService = new AuditService();
