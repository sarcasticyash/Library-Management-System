/**
 * Cloud-Native Library Management System (LMS)
 * Audit Log Repository Implementation
 *
 * Governed by Phase 3 Section 7.5, Decision DBD-05, and Phase 4 Section 14.
 */

import { ClientSession, Types } from 'mongoose';
import { IAuditLogRepository } from './audit-log.repository.interface';
import { AuditLogDocument, AuditLogModel } from '../models/audit-log.model';
import { IAuditLog } from '../types/audit.types';
import { PaginatedResponse } from '../types/common.types';
import { AuditQueryDto } from '../schemas/audit.schema';

export class AuditLogRepository implements IAuditLogRepository {
  private toDomain(doc: AuditLogDocument): IAuditLog {
    return {
      id: doc._id.toString(),
      actorId: doc.actorId.toString(),
      actorRole: doc.actorRole,
      action: doc.action,
      entityType: doc.entityType,
      entityId: doc.entityId,
      metadata: doc.metadata,
      ipAddress: doc.ipAddress,
      timestamp: doc.timestamp,
    };
  }

  public async create(
    logData: Omit<IAuditLog, 'id' | 'timestamp'>,
    session?: ClientSession,
  ): Promise<IAuditLog> {
    const [created] = await AuditLogModel.create(
      [
        {
          ...logData,
          actorId: new Types.ObjectId(logData.actorId),
        },
      ],
      { session },
    );

    if (!created) {
      throw new Error('Failed to create audit log entry');
    }

    return this.toDomain(created);
  }

  public async query(query: AuditQueryDto): Promise<PaginatedResponse<IAuditLog>> {
    const { action, actorId, entityType, startDate, endDate, page, limit } = query;
    const filter: Record<string, unknown> = {};

    if (action) {
      filter.action = action;
    }

    if (actorId) {
      filter.actorId = new Types.ObjectId(actorId);
    }

    if (entityType) {
      filter.entityType = entityType;
    }

    if (startDate || endDate) {
      const timestampFilter: Record<string, Date> = {};
      if (startDate) {
        timestampFilter.$gte = new Date(startDate);
      }
      if (endDate) {
        timestampFilter.$lte = new Date(endDate);
      }
      filter.timestamp = timestampFilter;
    }

    const skip = (page - 1) * limit;

    const [docs, totalRecords] = await Promise.all([
      AuditLogModel.find(filter).sort({ timestamp: -1, _id: 1 }).skip(skip).limit(limit).exec(),
      AuditLogModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalRecords / limit) || 1;

    return {
      data: docs.map((doc) => this.toDomain(doc)),
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}

export const auditLogRepository: IAuditLogRepository = new AuditLogRepository();
