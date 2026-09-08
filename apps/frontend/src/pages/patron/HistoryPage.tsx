import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Calendar } from 'lucide-react';
import { circulationApi } from '../../api/circulation.api';
import { CirculationStatus } from '../../types/circulation';
import { Badge } from '../../components/common/Badge';
import { PaginationBar } from '../../components/common/PaginationBar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { EmptyState } from '../../components/ui/EmptyState';

export const HistoryPage: React.FC = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-history', page],
    queryFn: () => circulationApi.getBorrowingHistory({ page, limit: 10 }),
  });

  const history = data?.data ?? [];

  return (
    <div className="container page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Borrowing History Archive</h1>
          <p className="page-subtitle">A chronological record of all your past library loans</p>
        </div>
      </div>

      {isLoading && <LoadingSpinner message="Loading circulation history..." />}

      {error && (
        <ErrorAlert
          title="Failed to Load History"
          error={error instanceof Error ? error.message : 'Error fetching history'}
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !error && history.length === 0 && (
        <EmptyState
          title="No Borrowing History"
          description="You have not completed any borrowing transactions yet. Explore our collection to borrow your first book."
          icon={<History size={32} />}
          actionLabel="Browse Catalog"
          onAction={() => window.location.assign('/books')}
        />
      )}

      {!isLoading && !error && history.length > 0 && (
        <>
          <div className="data-table-container" style={{ marginBottom: 'var(--space-6)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Book Identifier</th>
                  <th>Borrow Date</th>
                  <th>Due Date</th>
                  <th>Return Date</th>
                  <th>Circulation Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => {
                  const isReturned = record.status === CirculationStatus.RETURNED;

                  return (
                    <tr key={record.id}>
                      <td
                        style={{
                          fontFamily: 'var(--font-family-mono)',
                          fontSize: 'var(--font-size-xs)',
                        }}
                      >
                        {record.id.slice(-8)}
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-family-mono)',
                          fontSize: 'var(--font-size-xs)',
                        }}
                      >
                        {record.bookId}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} style={{ color: 'var(--color-text-muted)' }} />
                          <span>{new Date(record.borrowDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td>{new Date(record.dueDate).toLocaleDateString()}</td>
                      <td>
                        {record.returnDate ? new Date(record.returnDate).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <Badge variant={isReturned ? 'success' : 'warning'}>{record.status}</Badge>
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
    </div>
  );
};
