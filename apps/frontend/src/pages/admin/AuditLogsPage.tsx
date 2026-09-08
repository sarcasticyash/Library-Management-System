import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, ChevronDown, ChevronRight, Shield } from 'lucide-react';
import { adminApi } from '../../api/admin.api';
import { Badge } from '../../components/common/Badge';
import { PaginationBar } from '../../components/common/PaginationBar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorAlert } from '../../components/ui/ErrorAlert';

export const AuditLogsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-audit-logs', page],
    queryFn: () => adminApi.getAuditLogs({ page, limit: 10 }),
  });

  const logs = data?.data ?? [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">System Audit Log Ledger</h1>
          <p className="page-subtitle">
            Immutable append-only record of all administrative mutations and security events
          </p>
        </div>

        <Badge variant="info" icon={<Shield size={12} />}>
          Immutable Audit Trail
        </Badge>
      </div>

      {isLoading && <LoadingSpinner message="Retrieving audit records..." />}

      {error && (
        <ErrorAlert
          title="Failed to Load Audit Trail"
          error={error instanceof Error ? error.message : 'Error fetching audit logs'}
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !error && (
        <>
          <div className="data-table-container" style={{ marginBottom: 'var(--space-6)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }} />
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Entity Type</th>
                  <th>Entity ID</th>
                  <th>Actor Role</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const isExpanded = expandedRowId === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        style={{ cursor: 'pointer' }}
                        onClick={() => setExpandedRowId(isExpanded ? null : log.id)}
                      >
                        <td>
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </td>
                        <td style={{ fontSize: 'var(--font-size-xs)' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td>
                          <Badge variant="neutral">{log.action}</Badge>
                        </td>
                        <td>
                          <strong>{log.entityType}</strong>
                        </td>
                        <td
                          style={{
                            fontFamily: 'var(--font-family-mono)',
                            fontSize: 'var(--font-size-xs)',
                          }}
                        >
                          {log.entityId}
                        </td>
                        <td>
                          <Badge variant="info">{log.actorRole}</Badge>
                        </td>
                        <td
                          style={{
                            fontFamily: 'var(--font-family-mono)',
                            fontSize: 'var(--font-size-xs)',
                          }}
                        >
                          {log.ipAddress}
                        </td>
                      </tr>

                      {/* Expandable JSON Diff Row */}
                      {isExpanded && (
                        <tr>
                          <td
                            colSpan={7}
                            style={{
                              backgroundColor: 'var(--color-bg-canvas)',
                              padding: 'var(--space-4)',
                            }}
                          >
                            <div style={{ fontSize: 'var(--font-size-xs)' }}>
                              <div
                                style={{
                                  marginBottom: 'var(--space-2)',
                                  color: 'var(--color-text-secondary)',
                                }}
                              >
                                <ClipboardList
                                  size={14}
                                  style={{ display: 'inline', marginRight: '4px' }}
                                />
                                <strong>Metadata & Payload Diff:</strong>
                              </div>
                              <pre
                                style={{
                                  backgroundColor: 'var(--color-bg-surface)',
                                  border: '1px solid var(--color-border-subtle)',
                                  borderRadius: 'var(--radius-md)',
                                  padding: 'var(--space-3)',
                                  overflowX: 'auto',
                                  fontFamily: 'var(--font-family-mono)',
                                  color: 'var(--color-primary-400)',
                                }}
                              >
                                {JSON.stringify(log.metadata ?? {}, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {data && (
            <PaginationBar
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              totalRecords={data.pagination.totalRecords}
              limit={data.pagination.limit}
              onPageChange={(newPage) => setPage(newPage)}
            />
          )}
        </>
      )}
    </div>
  );
};
