/**
 * Cloud-Native Library Management System (LMS)
 * Audit Log Repository Interface
 *
 * Governed by Phase 3 Section 7.5, Decision DBD-05, and Phase 4 Section 14.
 */

import { ClientSession } from 'mongoose';
import { IAuditLog } from '../types/audit.types';
import { PaginatedResponse } from '../types/common.types';
import { AuditQueryDto } from '../schemas/audit.schema';

export interface IAuditLogRepository {
  create(logData: Omit<IAuditLog, 'id' | 'timestamp'>, session?: ClientSession): Promise<IAuditLog>;
  query(query: AuditQueryDto): Promise<PaginatedResponse<IAuditLog>>;
}
