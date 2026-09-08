import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditService } from '@services/audit.service';
import { IAuditLogRepository } from '@repositories/audit-log.repository.interface';
import { IAuditLog, AuditAction, AuditActorRole, AuditEntityType } from '@types/audit.types';

describe('AuditService Unit Tests', () => {
  let mockAuditRepo: IAuditLogRepository;
  let auditService: AuditService;

  const mockAuditLog: IAuditLog = {
    id: '64f1a2b3c4d5e6f7a8b9c0f1',
    action: AuditAction.USER_REGISTERED,
    actorId: '64f1a2b3c4d5e6f7a8b9c0d1',
    actorRole: AuditActorRole.PATRON,
    entityType: AuditEntityType.USER,
    entityId: '64f1a2b3c4d5e6f7a8b9c0d1',
    ipAddress: '127.0.0.1',
    metadata: { email: 'test@lms.org' },
    timestamp: new Date(),
  };

  beforeEach(() => {
    mockAuditRepo = {
      create: vi.fn().mockImplementation(async (entry) => ({
        ...entry,
        id: 'mock-audit-id',
        timestamp: new Date(),
      })),
      query: vi.fn().mockResolvedValue({
        data: [mockAuditLog],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }),
      countTotal: vi.fn().mockResolvedValue(1),
    };

    auditService = new AuditService(mockAuditRepo);
  });

  describe('logEvent', () => {
    it('should create audit log entry with sanitized metadata', async () => {
      await auditService.logEvent({
        action: AuditAction.AUTH_LOGIN_SUCCESS,
        actorId: 'user-1',
        actorRole: AuditActorRole.PATRON,
        entityType: AuditEntityType.SESSION,
        entityId: 'session-1',
        ipAddress: '192.168.1.1',
        metadata: {
          email: 'user@lms.org',
          password: 'PlaintextPassword123!', // Must be redacted!
          nested: {
            refreshToken: 'secret-refresh-token', // Must be redacted!
            publicData: 'allowed',
          },
        },
      });

      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.AUTH_LOGIN_SUCCESS,
          metadata: {
            email: 'user@lms.org',
            password: '[REDACTED]',
            nested: {
              refreshToken: '[REDACTED]',
              publicData: 'allowed',
            },
          },
        }),
        undefined,
      );
    });
  });

  describe('queryLogs', () => {
    it('should delegate query to audit repository (FR-ADMIN-008)', async () => {
      const query = { page: 1, limit: 10 };
      const response = await auditService.queryLogs(query);

      expect(mockAuditRepo.query).toHaveBeenCalledWith(query);
      expect(response.data).toHaveLength(1);
    });
  });
});
