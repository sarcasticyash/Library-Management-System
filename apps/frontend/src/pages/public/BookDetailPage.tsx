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
  Clock,
  BookCheck,
  RotateCcw,
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
import { CirculationLedgerCorner } from '../../components/circulation/CirculationLedgerCorner';
import { LuxuryBookCover } from '../../components/ui/LuxuryBookCover';
import { Feather, Sparkles } from 'lucide-react';

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

  // Query user's active loans to check if patron has already borrowed this specific book
  const { data: myLoansData, refetch: refetchMyLoans } = useQuery({
    queryKey: ['my-loans'],
    queryFn: () => circulationApi.getActiveLoans(),
    enabled: isAuthenticated,
    staleTime: 15000,
  });

  const userLoan = myLoansData?.data?.find((l) => l.book?.id === bookId);

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
          alignItems: 'start',
          marginBottom: 'var(--space-12)',
        }}
      >
        {/* Left Column: 3D Physical Book Cover Showcase */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              position: 'relative',
              padding: '30px 24px 34px 24px',
              background: 'linear-gradient(160deg, #ffffff 0%, #faf8f5 50%, #f4ede2 100%)',
              border: '1.5px solid rgba(212, 175, 55, 0.45)',
              borderRadius: '20px',
              boxShadow: '0 16px 40px rgba(44, 24, 16, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              maxWidth: '360px',
            }}
          >
            {/* Ambient Spotlight Shadow */}
            <div
              style={{
                position: 'absolute',
                bottom: '18px',
                width: '240px',
                height: '28px',
                background:
                  'radial-gradient(ellipse at center, rgba(35, 25, 18, 0.42) 0%, transparent 75%)',
                pointerEvents: 'none',
              }}
            />

            <LuxuryBookCover book={book} size="lg" interactiveHover showRibbon showFoilSheen />

            {/* Edition & Accession Footnote */}
            <div
              style={{
                marginTop: '32px',
                textAlign: 'center',
                borderTop: '1px solid rgba(212, 175, 55, 0.3)',
                paddingTop: '14px',
                width: '100%',
              }}
            >
              <div
                style={{
                  fontFamily: "'Cinzel', 'Plus Jakarta Sans', serif",
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#b45309',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <Sparkles size={11} color="#d97706" />
                <span>Nalanda Archival Folio</span>
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#78716c',
                  fontFamily: 'var(--font-family-mono, monospace)',
                }}
              >
                ISBN {book.isbn}
              </div>
            </div>
          </div>
        </div>

        {/* Center / Right Column: Book Information & Synopsis */}
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
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Feather size={16} color="#b45309" />
            <span>
              by <strong style={{ color: 'var(--color-text-primary)' }}>{book.author}</strong>
            </span>
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
                <span style={{ color: 'var(--color-text-secondary)' }}>Available Copies:</span>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>
                  {availability?.availableCopies ?? book.availableCopies} in repository
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <span style={{ color: 'var(--color-text-secondary)' }}>Already Borrowed:</span>
                <span style={{ color: '#d97706', fontWeight: 700 }}>
                  {book.totalCopies - (availability?.availableCopies ?? book.availableCopies)} on
                  loan
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

              {/* Status and return timer alert if borrowed by user */}
              {userLoan && (
                <div
                  style={{
                    marginTop: 'var(--space-2)',
                    padding: 'var(--space-3)',
                    background: '#fefce8',
                    border: '1.5px solid #fde047',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#854d0e',
                      }}
                    >
                      <BookCheck size={14} color="#16a34a" />
                      <span>Currently in Your Possession</span>
                    </span>
                    <Badge variant="warning">Active Loan</Badge>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: userLoan.isOverdue ? '#dc2626' : '#b45309',
                    }}
                  >
                    <Clock size={13} />
                    <span>
                      {userLoan.isOverdue
                        ? `Overdue by ${Math.abs(userLoan.daysRemaining)} days!`
                        : `${userLoan.daysRemaining} Days Remaining`}
                    </span>
                    <span style={{ color: '#78716c', fontWeight: 400 }}>
                      (Due{' '}
                      {new Date(userLoan.dueDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      )
                    </span>
                  </div>
                </div>
              )}
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
            ) : userLoan ? (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  void circulationApi.returnBook(userLoan.id).then(() => {
                    void queryClient.invalidateQueries({ queryKey: ['my-loans'] });
                    void queryClient.invalidateQueries({ queryKey: ['book', bookId] });
                    void queryClient.invalidateQueries({ queryKey: ['book-availability', bookId] });
                    void queryClient.invalidateQueries({ queryKey: ['catalog-summary-all'] });
                    void refetchBook();
                    void refetchAvailability();
                    void refetchMyLoans();
                  });
                }}
                style={{
                  width: '100%',
                  borderColor: '#fde047',
                  color: '#854d0e',
                  background: '#fefce8',
                }}
                leftIcon={<RotateCcw size={18} />}
              >
                Return Volume to Archive ({userLoan.daysRemaining}d Left)
              </Button>
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

          {/* Dedicated Institutional Circulation Ledger Corner */}
          <div style={{ marginTop: 'var(--space-6)' }}>
            <CirculationLedgerCorner
              currentBookId={book.id}
              onReturnSuccess={() => {
                void refetchBook();
                void refetchAvailability();
                void refetchMyLoans();
              }}
            />
          </div>
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
