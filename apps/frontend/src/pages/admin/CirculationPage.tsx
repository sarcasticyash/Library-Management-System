import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, Calendar, CheckCircle } from 'lucide-react';
import { adminApi } from '../../api/admin.api';
import { CirculationStatus } from '../../types/circulation';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { PaginationBar } from '../../components/common/PaginationBar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorAlert } from '../../components/ui/ErrorAlert';

export const CirculationPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [overrideBorrowingId, setOverrideBorrowingId] = useState<string | null>(null);
  const [adminRemarks, setAdminRemarks] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-borrowings', { page, status: statusFilter }],
    queryFn: () =>
      adminApi.getAllBorrowings({
        page,
        limit: 10,
        status: statusFilter || undefined,
      }),
  });

  const overrideMutation = useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks: string }) =>
      adminApi.returnOverride(id, { adminRemarks: remarks }),
    onSuccess: () => {
      setOverrideBorrowingId(null);
      setAdminRemarks('');
      setActionSuccess('Staff return override executed successfully.');
      void queryClient.invalidateQueries({ queryKey: ['admin-borrowings'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-kpis'] });
    },
    onError: (err: unknown) => {
      setActionError(err instanceof Error ? err.message : 'Return override failed');
    },
  });

  const borrowings = data?.data ?? [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Global Circulation Oversight</h1>
          <p className="page-subtitle">
            Inspect active and overdue loans across all library patrons
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {[
            '',
            CirculationStatus.ACTIVE,
            CirculationStatus.OVERDUE,
            CirculationStatus.RETURNED,
          ].map((status) => (
            <button
              key={status}
              type="button"
              className={`btn btn-sm ${statusFilter === status ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
            >
              {status || 'All Loans'}
            </button>
          ))}
        </div>
      </div>

      {actionSuccess && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            color: 'var(--color-success-400)',
            fontSize: 'var(--font-size-sm)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <CheckCircle size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <ErrorAlert title="Circulation Action Failed" error={actionError} />
        </div>
      )}

      {isLoading && <LoadingSpinner message="Querying global circulation ledger..." />}

      {error && (
        <ErrorAlert
          title="Failed to Load Circulation Records"
          error={error instanceof Error ? error.message : 'Error fetching records'}
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !error && (
        <>
          <div className="data-table-container" style={{ marginBottom: 'var(--space-6)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Patron ID</th>
                  <th>Book ID</th>
                  <th>Borrow Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {borrowings.map((loan) => {
                  const isActiveOrOverdue =
                    loan.status === CirculationStatus.ACTIVE ||
                    loan.status === CirculationStatus.OVERDUE;

                  return (
                    <tr key={loan.id}>
                      <td
                        style={{
                          fontFamily: 'var(--font-family-mono)',
                          fontSize: 'var(--font-size-xs)',
                        }}
                      >
                        {loan.id.slice(-8)}
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-family-mono)',
                          fontSize: 'var(--font-size-xs)',
                        }}
                      >
                        {loan.userId}
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-family-mono)',
                          fontSize: 'var(--font-size-xs)',
                        }}
                      >
                        {loan.bookId}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} style={{ color: 'var(--color-text-muted)' }} />
                          <span>{new Date(loan.borrowDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td>{new Date(loan.dueDate).toLocaleDateString()}</td>
                      <td>
                        <Badge
                          variant={
                            loan.status === CirculationStatus.RETURNED
                              ? 'success'
                              : loan.status === CirculationStatus.OVERDUE
                                ? 'danger'
                                : 'warning'
                          }
                        >
                          {loan.status}
                        </Badge>
                      </td>
                      <td>
                        {isActiveOrOverdue && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActionError(null);
                              setActionSuccess(null);
                              setOverrideBorrowingId(loan.id);
                            }}
                            leftIcon={<RotateCcw size={14} />}
                          >
                            Staff Override
                          </Button>
                        )}
                      </td>
                    </tr>
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

      {/* Staff Override Modal */}
      <Modal
        isOpen={!!overrideBorrowingId}
        onClose={() => setOverrideBorrowingId(null)}
        title="Execute Staff Return Override"
        footer={
          <>
            <Button
              variant="ghost"
              size="md"
              onClick={() => setOverrideBorrowingId(null)}
              disabled={overrideMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={adminRemarks.trim().length < 3}
              isLoading={overrideMutation.isPending}
              onClick={() => {
                if (overrideBorrowingId) {
                  overrideMutation.mutate({
                    id: overrideBorrowingId,
                    remarks: adminRemarks.trim(),
                  });
                }
              }}
            >
              Execute Staff Return
            </Button>
          </>
        }
      >
        <div>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-4)',
            }}
          >
            Processing return on behalf of patron for loan <code>{overrideBorrowingId}</code> (e.g.
            physical drop-box intake).
          </p>

          <div className="form-group">
            <label className="form-label">Administrative Remarks (Mandatory)</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Provide context for audit record (e.g. Physical book returned to circulation desk drop-box)..."
              value={adminRemarks}
              onChange={(e) => setAdminRemarks(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
