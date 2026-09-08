import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Layers,
  Calendar,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  BookOpen,
  Clock,
} from 'lucide-react';
import { circulationApi } from '../../api/circulation.api';
import { IActiveLoanItem } from '../../types/circulation';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { EmptyState } from '../../components/ui/EmptyState';

export const ActiveLoansPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [returnTarget, setReturnTarget] = useState<IActiveLoanItem | null>(null);
  const [returnError, setReturnError] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-loans'],
    queryFn: () => circulationApi.getActiveLoans(),
  });

  const returnMutation = useMutation({
    mutationFn: (borrowingId: string) => circulationApi.returnBook(borrowingId),
    onSuccess: () => {
      setReturnTarget(null);
      void queryClient.invalidateQueries({ queryKey: ['my-loans'] });
      void queryClient.invalidateQueries({ queryKey: ['my-history'] });
      void queryClient.invalidateQueries({ queryKey: ['books'] });
      void queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Return failed';
      setReturnError(msg);
    },
  });

  const activeLoans = data?.data ?? [];
  const totalCount = activeLoans.length;
  const anyOverdue = activeLoans.some((loan) => loan.isOverdue);

  return (
    <div className="container page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Active Loans</h1>
          <p className="page-subtitle">Manage your checked-out books and track due dates</p>
        </div>

        {/* Quota Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            backgroundColor: 'var(--color-bg-surface)',
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          <Layers size={18} style={{ color: 'var(--color-primary-400)' }} />
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Quota Usage:
          </span>
          <strong
            style={{
              color: totalCount >= 5 ? 'var(--color-warning-400)' : 'var(--color-text-primary)',
            }}
          >
            {totalCount} / 5 Books
          </strong>
        </div>
      </div>

      {anyOverdue && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--color-danger-400)',
            marginBottom: 'var(--space-6)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>
            <strong>Overdue Alert:</strong> You have one or more loans that have passed their due
            date. Please return them promptly to restore good standing.
          </span>
        </div>
      )}

      {isLoading && <LoadingSpinner message="Retrieving active loans..." />}

      {error && (
        <ErrorAlert
          title="Failed to Load Active Loans"
          error={error instanceof Error ? error.message : 'Error fetching active loans'}
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !error && activeLoans.length === 0 && (
        <EmptyState
          title="No Active Loans"
          description="You currently do not have any books checked out from the library. Discover your next read in our catalog."
          actionLabel="Explore Book Catalog"
          onAction={() => window.location.assign('/books')}
        />
      )}

      {!isLoading && !error && activeLoans.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-6)',
          }}
        >
          {activeLoans.map((loan) => {
            const isOverdue = loan.isOverdue;
            const dueSoon = loan.daysRemaining <= 3 && !isOverdue;

            return (
              <Card
                key={loan.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderColor: isOverdue ? 'rgba(239, 68, 68, 0.4)' : undefined,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-3)',
                  }}
                >
                  <Badge
                    variant={isOverdue ? 'danger' : dueSoon ? 'warning' : 'success'}
                    icon={
                      isOverdue ? (
                        <AlertTriangle size={12} />
                      ) : dueSoon ? (
                        <Clock size={12} />
                      ) : (
                        <CheckCircle size={12} />
                      )
                    }
                  >
                    {isOverdue
                      ? `OVERDUE by ${Math.abs(loan.daysRemaining)} days`
                      : `Due in ${loan.daysRemaining} days`}
                  </Badge>

                  <Link to={`/books/${loan.book.id}`}>
                    <Button variant="ghost" size="sm" rightIcon={<BookOpen size={14} />}>
                      Details
                    </Button>
                  </Link>
                </div>

                <h3
                  style={{
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  {loan.book.title}
                </h3>
                <p
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  by {loan.book.author}
                </p>

                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: 'var(--space-4)',
                    borderTop: '1px solid var(--color-border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                    }}
                  >
                    <Calendar size={12} />
                    <span>Borrowed: {new Date(loan.borrowDate).toLocaleDateString()}</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReturnError(null);
                      setReturnTarget(loan);
                    }}
                    leftIcon={<RotateCcw size={14} />}
                  >
                    Return Book
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Return Confirmation Modal */}
      <Modal
        isOpen={!!returnTarget}
        onClose={() => setReturnTarget(null)}
        title="Confirm Book Return"
        footer={
          <>
            <Button
              variant="ghost"
              size="md"
              onClick={() => setReturnTarget(null)}
              disabled={returnMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={returnMutation.isPending}
              onClick={() => {
                if (returnTarget) {
                  returnMutation.mutate(returnTarget.id);
                }
              }}
            >
              Confirm Return
            </Button>
          </>
        }
      >
        {returnTarget && (
          <div>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-4)',
              }}
            >
              Are you sure you want to return <strong>{returnTarget.book.title}</strong>?
            </p>

            {returnError && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <ErrorAlert title="Return Failed" error={returnError} />
              </div>
            )}

            <div
              style={{
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-bg-surface-elevated)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
              }}
            >
              Returning this volume will immediately decrement your active loan count and make the
              copy available for other patrons.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
