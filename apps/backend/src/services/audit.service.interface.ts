/**
 * Cloud-Native Library Management System (LMS)
 * Audit Service Application Boundary Interface
 *
 * Governed by Phase 1 (FR-ADMIN-008), Phase 3 (Decision DBD-05),
 * and Phase 4 Section 14 (Two-Tier Audit Integration).
 */

import { AuditQueryDto } from '../schemas/audit.schema';
import { IAuditLog } from '../types/audit.types';
import { PaginatedResponse } from '../types/common.types';

export interface IAuditService {
  /**
   * Records an immutable append-only audit log entry.
   * Supports passing an optional active transaction session for Tier 1 atomic operations.
   */
  logEvent(event: Omit<IAuditLog, 'id' | 'timestamp'>, session?: unknown): Promise<IAuditLog>;

  /**
   * Paginated administrative search of historical audit ledger.
   */
  queryLogs(query: AuditQueryDto): Promise<PaginatedResponse<IAuditLog>>;
}
