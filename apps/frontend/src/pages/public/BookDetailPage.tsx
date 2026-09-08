import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  BookOpen,
  MapPin,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { bookApi } from '../../api/book.api';
import { circulationApi } from '../../api/circulation.api';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/user';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorAlert } from '../../components/ui/ErrorAlert';

export const BookDetailPage: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, role } = useAuth();

  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [borrowError, setBorrowError] = useState<string | null>(null);
  const [borrowSuccess, setBorrowSuccess] = useState(false);

  const {
    data: book,
    isLoading: isBookLoading,
    error: bookError,
    refetch: refetchBook,
  } = useQuery({
    queryKey: ['book', bookId],
    queryFn: () => (bookId ? bookApi.getBookById(bookId) : Promise.reject('No ID')),
    enabled: !!bookId,
  });

  const {
    data: availability,
    isLoading: isAvailLoading,
    refetch: refetchAvailability,
  } = useQuery({
    queryKey: ['book-availability', bookId],
    queryFn: () => (bookId ? bookApi.getBookAvailability(bookId) : Promise.reject('No ID')),
    enabled: !!bookId,
  });

  const borrowMutation = useMutation({
    mutationFn: () => {
      if (!bookId) throw new Error('Missing book ID');
      return circulationApi.borrowBook({ bookId });
    },
    onSuccess: () => {
      setBorrowSuccess(true);
      void queryClient.invalidateQueries({ queryKey: ['books'] });
      void queryClient.invalidateQueries({ queryKey: ['book-availability', bookId] });
      void queryClient.invalidateQueries({ queryKey: ['my-loans'] });
      void queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Checkout failed';
      setBorrowError(msg);
    },
  });

  if (isBookLoading || isAvailLoading) {
    return (
      <div className="container page-container">
        <LoadingSpinner message="Loading volume details..." />
      </div>
    );
  }

  if (bookError || !book) {
    return (
      <div className="container page-container">
        <ErrorAlert
          title="Failed to Load Book"
          error={bookError instanceof Error ? bookError.message : 'Book record not found'}
          onRetry={() => {
            void refetchBook();
            void refetchAvailability();
          }}
        />
        <div style={{ marginTop: 'var(--space-4)' }}>
          <Link to="/books">
            <Button variant="outline" leftIcon={<ArrowLeft size={16} />}>
              Back to Catalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isAvailable = availability?.isAvailable ?? book.availableCopies > 0;
  const isPatron = role === UserRole.PATRON;
  const isSuspended = user?.status === 'SUSPENDED';

  const handleBorrowClick = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`/books/${book.id}`)}`);
      return;
    }
    setBorrowError(null);
    setBorrowSuccess(false);
    setIsBorrowModalOpen(true);
  };

  return (
    <div className="container page-container">
      {/* Breadcrumbs */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Link to="/books" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} />
          <span>Back to Catalog</span>
        </Link>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-8)',
        }}
      >
        {/* Book Information */}
        <div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <Badge variant="neutral">{book.genre}</Badge>
            <Badge
              variant={isAvailable ? 'success' : 'danger'}
              icon={isAvailable ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
            >
              {isAvailable
                ? `${availability?.availableCopies ?? book.availableCopies} Available`
                : 'Out of Stock'}
            </Badge>
          </div>

          <h1
            style={{
              fontSize: 'var(--font-size-3xl)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-2)',
              lineHeight: 1.2,
            }}
          >
            {book.title}
          </h1>

          <p
            style={{
              fontSize: 'var(--font-size-lg)',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-6)',
            }}
          >
            by <strong style={{ color: 'var(--color-text-primary)' }}>{book.author}</strong>
          </p>

          <Card style={{ marginBottom: 'var(--space-6)' }}>
            <h3
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--space-3)',
              }}
            >
              Synopsis
            </h3>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
              }}
            >
              {book.description}
            </p>
          </Card>
        </div>

        {/* Shelf Coordinates & Circulation Actions */}
        <div>
          <Card style={{ padding: 'var(--space-6)' }}>
            <h2
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--space-4)',
                borderBottom: '1px solid var(--color-border-subtle)',
                paddingBottom: 'var(--space-3)',
              }}
            >
              Physical Holdings & Checkout
            </h2>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                marginBottom: 'var(--space-6)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <span style={{ color: 'var(--color-text-secondary)' }}>ISBN:</span>
                <span
                  style={{
                    fontFamily: 'var(--font-family-mono)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {book.isbn}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <span style={{ color: 'var(--color-text-secondary)' }}>Publisher:</span>
                <span style={{ color: 'var(--color-text-primary)' }}>{book.publisher}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <span style={{ color: 'var(--color-text-secondary)' }}>Publication Year:</span>
                <span style={{ color: 'var(--color-text-primary)' }}>{book.publicationYear}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <span style={{ color: 'var(--color-text-secondary)' }}>Physical Coordinates:</span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'var(--color-primary-400)',
                  }}
                >
                  <MapPin size={14} />
                  <span>
                    Aisle {book.location.aisle}, Shelf {book.location.shelf}
                  </span>
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <span style={{ color: 'var(--color-text-secondary)' }}>Total Stock:</span>
                <span style={{ color: 'var(--color-text-primary)' }}>
                  {book.totalCopies} copies in collection
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            {isSuspended ? (
              <div
                style={{
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--color-danger-400)',
                  fontSize: 'var(--font-size-xs)',
                  marginBottom: 'var(--space-3)',
                }}
              >
                Your account is currently suspended. You may view active loans and return books, but
                new checkouts are barred.
              </div>
            ) : (
              <Button
                variant="primary"
                size="lg"
                disabled={!isAvailable || isSuspended || (isAuthenticated && !isPatron)}
                onClick={handleBorrowClick}
                style={{ width: '100%' }}
                leftIcon={<BookOpen size={18} />}
              >
                {!isAuthenticated
                  ? 'Sign In to Borrow'
                  : !isAvailable
                    ? 'Out of Stock'
                    : !isPatron
                      ? 'Administrative Account (Browsing)'
                      : 'Borrow Book (14-Day Loan)'}
              </Button>
            )}
          </Card>
        </div>
      </div>

      {/* Checkout Confirmation Modal */}
      <Modal
        isOpen={isBorrowModalOpen}
        onClose={() => setIsBorrowModalOpen(false)}
        title={borrowSuccess ? 'Checkout Complete!' : 'Confirm Book Checkout'}
        footer={
          borrowSuccess ? (
            <Link to="/my-loans">
              <Button variant="primary" size="md">
                View in My Active Loans
              </Button>
            </Link>
          ) : (
            <>
              <Button
                variant="ghost"
                size="md"
                onClick={() => setIsBorrowModalOpen(false)}
                disabled={borrowMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                isLoading={borrowMutation.isPending}
                onClick={() => borrowMutation.mutate()}
              >
                Confirm Checkout
              </Button>
            </>
          )
        }
      >
        {borrowSuccess ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                color: 'var(--color-success-400)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--space-3)',
              }}
            >
              <CheckCircle size={24} />
            </div>
            <h3
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 600,
                marginBottom: 'var(--space-2)',
              }}
            >
              Successfully Borrowed &apos;{book.title}&apos;
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Your loan period is 14 days. Please collect your copy from Aisle {book.location.aisle}
              , Shelf {book.location.shelf}.
            </p>
          </div>
        ) : (
          <div>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-4)',
              }}
            >
              You are checking out <strong>{book.title}</strong> by {book.author}.
            </p>

            {borrowError && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <ErrorAlert title="Checkout Error" error={borrowError} />
              </div>
            )}

            <div
              style={{
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-bg-surface-elevated)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Calendar size={14} style={{ color: 'var(--color-primary-400)' }} />
                <span>
                  Standard Loan Duration: <strong>14 Days</strong>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Layers size={14} style={{ color: 'var(--color-primary-400)' }} />
                <span>Quota: Maximum 5 concurrent active loans per patron</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
