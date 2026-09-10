import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  RotateCcw,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { circulationApi } from '../../api/circulation.api';
import { bookApi } from '../../api/book.api';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../common/Button';
import { IActiveLoanItem } from '../../types/circulation';

interface CirculationLedgerCornerProps {
  /**
   * Optional specific book ID to display book-level status & days remaining
   */
  currentBookId?: string;
  /**
   * Layout display mode: 'corner-card' for header/sidebar integration, 'floating-hud' for fixed bottom/top corner
   */
  variant?: 'corner-card' | 'floating-hud';
  /**
   * Optional callback when a book is returned
   */
  onReturnSuccess?: () => void;
}

export const CirculationLedgerCorner: React.FC<CirculationLedgerCornerProps> = ({
  currentBookId,
  variant = 'corner-card',
  onReturnSuccess,
}) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);
  const [returnMessage, setReturnMessage] = useState<string | null>(null);

  // 1. Fetch library-wide catalog stock (available & borrowed copies)
  const { data: catalogAll } = useQuery({
    queryKey: ['catalog-summary-all'],
    queryFn: () => bookApi.searchBooks({ limit: 100 }),
    staleTime: 30000,
  });

  // Calculate dynamic catalog metrics
  const totalTitles = catalogAll?.pagination?.totalRecords ?? 24;
  const totalCopies =
    catalogAll?.data && catalogAll.data.length > 0
      ? catalogAll.data.reduce((acc, b) => acc + b.totalCopies, 0)
      : 125;
  const availableCopies =
    catalogAll?.data && catalogAll.data.length > 0
      ? catalogAll.data.reduce((acc, b) => acc + b.availableCopies, 0)
      : 114;
  const borrowedCopies = Math.max(0, totalCopies - availableCopies);
  const availabilityPercent = Math.round((availableCopies / (totalCopies || 1)) * 100);

  // 2. Fetch logged-in user's active loans & remaining return days
  const { data: activeLoansData, refetch: refetchLoans } = useQuery({
    queryKey: ['my-loans'],
    queryFn: () => circulationApi.getActiveLoans(),
    enabled: isAuthenticated,
    staleTime: 15000,
  });

  const activeLoans: IActiveLoanItem[] = activeLoansData?.data ?? [];
  const currentBookLoan = currentBookId
    ? activeLoans.find((l) => l.book?.id === currentBookId)
    : undefined;

  // 3. Return Book Mutation
  const returnMutation = useMutation({
    mutationFn: (loanId: string) => circulationApi.returnBook(loanId),
    onSuccess: () => {
      setReturnMessage(`Successfully returned to collection! Archival inventory refreshed.`);
      setTimeout(() => setReturnMessage(null), 5000);
      void queryClient.invalidateQueries({ queryKey: ['my-loans'] });
      void queryClient.invalidateQueries({ queryKey: ['books'] });
      void queryClient.invalidateQueries({ queryKey: ['book'] });
      void queryClient.invalidateQueries({ queryKey: ['book-availability'] });
      void queryClient.invalidateQueries({ queryKey: ['catalog-summary-all'] });
      void queryClient.invalidateQueries({ queryKey: ['catalog-summary-count'] });
      void refetchLoans();
      onReturnSuccess?.();
    },
  });

  // Helper for countdown formatting
  const formatDaysRemaining = (days: number, isOverdue: boolean) => {
    if (isOverdue || days < 0) {
      return {
        label: `Overdue by ${Math.abs(days)} days!`,
        color: '#dc2626',
        bg: '#fee2e2',
        border: '#fca5a5',
      };
    }
    if (days === 0) {
      return {
        label: `Due Today (11:59 PM)`,
        color: '#ea580c',
        bg: '#ffedd5',
        border: '#fdba74',
      };
    }
    if (days <= 3) {
      return {
        label: `${days} Days Remaining (Due Soon)`,
        color: '#d97706',
        bg: '#fef3c7',
        border: '#fcd34d',
      };
    }
    return {
      label: `${days} Days Remaining`,
      color: '#16a34a',
      bg: '#dcfce7',
      border: '#86efac',
    };
  };

  // 4. Render Floating HUD mode
  if (variant === 'floating-hud') {
    return (
      <aside
        className="circulation-hud-floating"
        aria-label="Real-time Library Circulation HUD"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 999,
          maxWidth: isExpanded ? '380px' : '220px',
          width: '100%',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(16px)',
            border: '1.5px solid #ded5c7',
            borderRadius: '16px',
            boxShadow: '0 12px 36px rgba(44, 24, 16, 0.18), 0 2px 8px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
          }}
        >
          {/* Header Bar */}
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: '#1d1815',
              color: '#f6f3eb',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-family-mono, monospace)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Circulation Ledger
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '11px',
                  color: '#fbbf24',
                  fontFamily: 'var(--font-family-mono, monospace)',
                }}
              >
                {availableCopies} Avail / {borrowedCopies} Borr
              </span>
              {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </div>
          </div>

          {/* Expanded Content Body */}
          {isExpanded && (
            <div style={{ padding: '16px', maxHeight: '420px', overflowY: 'auto' }}>
              {/* Overall Catalog Stock Numbers */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  marginBottom: '14px',
                }}
              >
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '10px',
                    padding: '10px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#15803d' }}>
                    {availableCopies}
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: '#166534',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginTop: '2px',
                    }}
                  >
                    🟢 Books Available
                  </div>
                </div>

                <div
                  style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '10px',
                    padding: '10px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#b45309' }}>
                    {borrowedCopies}
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: '#92400e',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginTop: '2px',
                    }}
                  >
                    🟠 Books Borrowed
                  </div>
                </div>
              </div>

              {/* Stock Health Bar */}
              <div style={{ marginBottom: '14px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: '#57534e',
                    marginBottom: '4px',
                  }}
                >
                  <span>Inventory In Stock</span>
                  <span style={{ fontWeight: 700, color: '#15803d' }}>
                    {availabilityPercent}% Available ({totalCopies} Holdings)
                  </span>
                </div>
                <div
                  style={{
                    height: '6px',
                    background: '#e7e5e4',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${availabilityPercent}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #16a34a, #10b981)',
                    }}
                  />
                </div>
              </div>

              {/* Patron's Active Loans & Days Remaining Section */}
              {isAuthenticated ? (
                <div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#78716c',
                      letterSpacing: '0.05em',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>Your Active Loans</span>
                    <span
                      style={{
                        background: '#1d1815',
                        color: '#fff',
                        padding: '1px 6px',
                        borderRadius: '99px',
                        fontSize: '10px',
                      }}
                    >
                      {activeLoans.length}
                    </span>
                  </div>

                  {activeLoans.length === 0 ? (
                    <div
                      style={{
                        padding: '12px',
                        background: '#fcfaf6',
                        border: '1px dashed #ded5c7',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: '#78716c',
                        textAlign: 'center',
                      }}
                    >
                      No books currently in your custody. Browse the catalog to borrow volumes.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {activeLoans.map((loan) => {
                        const countdown = formatDaysRemaining(loan.daysRemaining, loan.isOverdue);
                        const isThisBook = currentBookId === loan.book?.id;

                        return (
                          <div
                            key={loan.id}
                            style={{
                              padding: '10px',
                              background: isThisBook ? '#fefce8' : '#faf8f5',
                              border: `1px solid ${isThisBook ? '#fde047' : '#e7e5e4'}`,
                              borderRadius: '8px',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                gap: '6px',
                                marginBottom: '4px',
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: 600,
                                  fontSize: '12px',
                                  color: '#1c1917',
                                  lineHeight: 1.3,
                                }}
                              >
                                {loan.book?.title}
                              </div>
                              <span
                                style={{
                                  fontSize: '9px',
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  color: countdown.color,
                                  backgroundColor: countdown.bg,
                                  border: `1px solid ${countdown.border}`,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {loan.status}
                              </span>
                            </div>

                            {/* Days Remaining Timer Badge */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginTop: '6px',
                                paddingTop: '6px',
                                borderTop: '1px dotted #e7e5e4',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: countdown.color,
                                }}
                              >
                                <Clock size={12} />
                                <span>{countdown.label}</span>
                              </div>

                              <button
                                type="button"
                                disabled={returnMutation.isPending}
                                onClick={() => returnMutation.mutate(loan.id)}
                                style={{
                                  fontSize: '11px',
                                  padding: '3px 8px',
                                  background: '#fff',
                                  border: '1px solid #d6d3d1',
                                  borderRadius: '4px',
                                  color: '#44403c',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <RotateCcw size={11} />
                                <span>Return</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    padding: '12px',
                    background: '#fdf8f0',
                    border: '1px solid #fde68a',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#78350f',
                    lineHeight: 1.4,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: '2px' }}>🏛️ Guest Scholar Mode</div>
                  Sign in or use <strong>Demo Login (Arjun Sharma)</strong> to borrow books and view
                  your active return countdown timers here.
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    );
  }

  // 5. Default: Render as Top-Right Corner / Embedded Institutional Ledger Card
  return (
    <div
      className="circulation-ledger-corner-card"
      aria-label="Institutional Circulation Ledger & Return Status"
      style={{
        background: '#ffffff',
        border: '1.5px solid #ded5c7',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 20px rgba(44, 24, 16, 0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative Stamp Tag */}
      <div
        style={{
          position: 'absolute',
          top: '0',
          right: '0',
          background: 'linear-gradient(135deg, #f14616, #d6370a)',
          color: '#ffffff',
          fontSize: '9px',
          fontWeight: 800,
          letterSpacing: '0.1em',
          padding: '4px 12px',
          borderBottomLeftRadius: '10px',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-family-mono, monospace)',
        }}
      >
        Live Ledger
      </div>

      {/* Title */}
      <div style={{ marginBottom: '14px' }}>
        <div
          style={{
            fontSize: '11px',
            fontFamily: 'var(--font-family-mono, monospace)',
            color: '#78716c',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#16a34a',
              display: 'inline-block',
            }}
          />
          Rashtriya Granthagar • National Repository
        </div>
        <h3
          style={{
            fontSize: '17px',
            fontWeight: 700,
            color: '#1d1815',
            marginTop: '2px',
            marginBottom: '0',
            fontFamily: 'var(--font-family-display, sans-serif)',
          }}
        >
          Circulation & Loan Status Corner
        </h3>
      </div>

      {/* Return Success Alert */}
      {returnMessage && (
        <div
          style={{
            padding: '10px 14px',
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '8px',
            color: '#166534',
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{returnMessage}</span>
        </div>
      )}

      {/* Key Metric Blocks: Available vs Borrowed Books */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        {/* Available Books */}
        <div
          style={{
            background: '#f0fdf4',
            border: '1.5px solid #86efac',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
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
                fontSize: '10px',
                fontWeight: 700,
                color: '#15803d',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Available Books
            </span>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#16a34a',
              }}
            />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#15803d', lineHeight: 1 }}>
            {availableCopies}
          </div>
          <span style={{ fontSize: '11px', color: '#166534', marginTop: '4px' }}>
            Ready in repository stacks
          </span>
        </div>

        {/* Already Borrowed Books */}
        <div
          style={{
            background: '#fffbeb',
            border: '1.5px solid #fcd34d',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
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
                fontSize: '10px',
                fontWeight: 700,
                color: '#b45309',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Already Borrowed
            </span>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#f59e0b',
              }}
            />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#b45309', lineHeight: 1 }}>
            {borrowedCopies}
          </div>
          <span style={{ fontSize: '11px', color: '#92400e', marginTop: '4px' }}>
            Active scholar loans
          </span>
        </div>

        {/* Total Catalog Titles */}
        <div
          style={{
            background: '#f6f3eb',
            border: '1.5px solid #ded5c7',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
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
                fontSize: '10px',
                fontWeight: 700,
                color: '#57534e',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Curated Titles
            </span>
            <Layers size={14} color="#78716c" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#1c1917', lineHeight: 1 }}>
            {totalTitles}
          </div>
          <span style={{ fontSize: '11px', color: '#78716c', marginTop: '4px' }}>
            {totalCopies} total holdings
          </span>
        </div>
      </div>

      {/* Book-Specific Status (if viewing a particular book) */}
      {currentBookId && (
        <div
          style={{
            background: currentBookLoan ? '#fefce8' : '#f8fafc',
            border: `1.5px solid ${currentBookLoan ? '#fde047' : '#cbd5e1'}`,
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: currentBookLoan ? '#854d0e' : '#475569',
              marginBottom: '6px',
            }}
          >
            📌 Current Volume Status
          </div>

          {currentBookLoan ? (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1c1917' }}>
                  In Your Custody (Active Scholar Loan)
                </span>
                <span
                  style={{
                    background: '#16a34a',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '99px',
                    fontSize: '10px',
                    fontWeight: 700,
                  }}
                >
                  ACTIVE
                </span>
              </div>

              {/* Days Remaining Countdown Timer */}
              {(() => {
                const countdown = formatDaysRemaining(
                  currentBookLoan.daysRemaining,
                  currentBookLoan.isOverdue,
                );
                return (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: countdown.bg,
                      border: `1px solid ${countdown.border}`,
                      borderRadius: '8px',
                      padding: '8px 12px',
                      marginTop: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={16} color={countdown.color} />
                      <div>
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            color: countdown.color,
                          }}
                        >
                          {countdown.label}
                        </div>
                        <div style={{ fontSize: '10px', color: '#57534e' }}>
                          Due Date:{' '}
                          {new Date(currentBookLoan.dueDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={returnMutation.isPending}
                      onClick={() => returnMutation.mutate(currentBookLoan.id)}
                      style={{
                        padding: '6px 12px',
                        background: '#1d1815',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <RotateCcw size={13} />
                      <span>{returnMutation.isPending ? 'Returning...' : 'Return Book'}</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: '12px', color: '#334155' }}>
                Available in repository stack. 14-day lending period applies upon checkout.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scholar's Active Loans & Days Remaining List */}
      {isAuthenticated && activeLoans.length > 0 && !currentBookLoan && (
        <div
          style={{
            background: '#faf8f5',
            border: '1px solid #ded5c7',
            borderRadius: '12px',
            padding: '14px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#78716c',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Your Active Borrowings & Return Countdown
            </span>
            <Link
              to="/my-loans"
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#f14616',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <span>View All</span>
              <ExternalLink size={11} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeLoans.map((loan) => {
              const countdown = formatDaysRemaining(loan.daysRemaining, loan.isOverdue);

              return (
                <div
                  key={loan.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e7e5e4',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#1c1917',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {loan.book?.title}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: countdown.color,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '2px',
                      }}
                    >
                      <Clock size={11} />
                      <span>{countdown.label}</span>
                      <span style={{ color: '#78716c', fontWeight: 400 }}>
                        • Due{' '}
                        {new Date(loan.dueDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={returnMutation.isPending}
                    onClick={() => returnMutation.mutate(loan.id)}
                    style={{
                      padding: '5px 10px',
                      background: '#f6f3eb',
                      border: '1px solid #d6d3d1',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#44403c',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <RotateCcw size={11} />
                    <span>Return</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Guest Scholar Prompt */}
      {!isAuthenticated && (
        <div
          style={{
            background: '#fdfbf7',
            border: '1px dashed #ded5c7',
            borderRadius: '10px',
            padding: '10px 14px',
            fontSize: '11px',
            color: '#78716c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>
            💡 Sign in as Demo Scholar <strong>Arjun Sharma</strong> to check out books and track
            return due dates.
          </span>
          <Link to="/login">
            <Button variant="outline" size="sm" style={{ padding: '4px 10px', fontSize: '11px' }}>
              Sign In
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};
