import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, Clock, BookCheck } from 'lucide-react';
import { bookApi } from '../../api/book.api';
import { circulationApi } from '../../api/circulation.api';
import { useAuth } from '../../hooks/useAuth';
import { BookGenre } from '../../types/book';
import { useDebounce } from '../../hooks/useDebounce';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { PaginationBar } from '../../components/common/PaginationBar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { EmptyState } from '../../components/ui/EmptyState';
import { CirculationLedgerCorner } from '../../components/circulation/CirculationLedgerCorner';
import { LuxuryBookCover } from '../../components/ui/LuxuryBookCover';

const GENRES = [
  'All',
  BookGenre.FICTION,
  BookGenre.COMPUTER_SCIENCE,
  BookGenre.TECHNOLOGY,
  BookGenre.SCIENCE,
  BookGenre.HISTORY,
  BookGenre.PHILOSOPHY,
];

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const initialQ = searchParams.get('q') ?? '';
  const initialGenre = searchParams.get('genre') ?? 'All';

  const [searchTerm, setSearchTerm] = useState(initialQ);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [availableOnly, setAvailableOnly] = useState(searchParams.get('available') === 'true');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(searchTerm, 300);

  // Fetch active loans for logged-in scholar to identify checked-out books & days remaining
  const { data: myLoansData } = useQuery({
    queryKey: ['my-loans'],
    queryFn: () => circulationApi.getActiveLoans(),
    enabled: isAuthenticated,
    staleTime: 15000,
  });

  // Keyboard shortcut '/' to focus search input per Phase 5 Section 14.1
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update URL search parameters when filters change
  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedQuery.trim()) params.q = debouncedQuery.trim();
    if (selectedGenre !== 'All') params.genre = selectedGenre;
    if (availableOnly) params.available = 'true';
    if (page > 1) params.page = String(page);
    setSearchParams(params, { replace: true });
  }, [debouncedQuery, selectedGenre, availableOnly, page, setSearchParams]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      'books',
      { q: debouncedQuery, genre: selectedGenre, available: availableOnly, page },
    ],
    queryFn: () =>
      bookApi.searchBooks({
        q: debouncedQuery.trim() || undefined,
        genre: selectedGenre !== 'All' ? selectedGenre : undefined,
        available: availableOnly ? true : undefined,
        page,
        limit: 12,
      }),
  });

  return (
    <div className="container page-container">
      {/* Header & Live Circulation Corner */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <h1 className="page-title">Library Book Catalog</h1>
          <p className="page-subtitle">
            Explore our curated collection of technical and Indic heritage volumes
          </p>
        </div>

        {/* Real-time Circulation Ledger Corner displaying Available, Borrowed, and Return Countdown */}
        <CirculationLedgerCorner />
      </div>

      {/* Search & Filter Toolbar */}
      <Card style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4) var(--space-6)' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 'var(--space-4)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: '260px' }}>
              <Input
                ref={searchInputRef}
                placeholder="Search by title, author, or ISBN... (Press / to focus)"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                leftIcon={<Search size={18} />}
              />
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => {
                  setAvailableOnly(e.target.checked);
                  setPage(1);
                }}
                style={{ accentColor: 'var(--color-primary-500)', width: '16px', height: '16px' }}
              />
              <span>In-Stock Only</span>
            </label>
          </div>

          {/* Genre Pill Filters */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                marginRight: 'var(--space-1)',
              }}
            >
              Genres:
            </span>
            {GENRES.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => {
                  setSelectedGenre(genre);
                  setPage(1);
                }}
                className={`btn btn-sm ${
                  selectedGenre === genre ? 'btn-primary' : 'btn-secondary'
                }`}
                style={{ borderRadius: 'var(--radius-full)' }}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Query State Render */}
      {isLoading && <LoadingSpinner message="Searching catalog records..." />}

      {error && (
        <ErrorAlert
          title="Catalog Search Failed"
          error={error instanceof Error ? error.message : 'Failed to retrieve books'}
          onRetry={() => void refetch()}
        />
      )}

      {data && Array.isArray(data.data) && data.data.length === 0 && (
        <EmptyState
          title="No Books Found"
          description="We couldn't find any books matching your search filters. Try clearing your search term or adjusting filters."
          actionLabel="Reset Search Filters"
          onAction={() => {
            setSearchTerm('');
            setSelectedGenre('All');
            setAvailableOnly(false);
            setPage(1);
          }}
        />
      )}

      {data && Array.isArray(data.data) && data.data.length > 0 && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
              gap: 'var(--space-8)',
              marginBottom: 'var(--space-8)',
            }}
          >
            {data.data.map((book) => {
              const inStock = book.availableCopies > 0;
              const userLoan = myLoansData?.data?.find((l) => l.book?.id === book.id);
              const borrowedCount = Math.max(0, book.totalCopies - book.availableCopies);

              return (
                <div
                  key={book.id}
                  className="luxury-catalog-card"
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'linear-gradient(170deg, #ffffff 0%, #faf8f5 55%, #f4ede2 100%)',
                    border: userLoan ? '2px solid #eab308' : '1.5px solid rgba(212, 175, 55, 0.45)',
                    borderRadius: '18px',
                    padding: '20px',
                    boxShadow: userLoan
                      ? '0 12px 36px rgba(234, 179, 8, 0.22), 0 2px 10px rgba(0, 0, 0, 0.06)'
                      : '0 12px 30px rgba(44, 24, 16, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {/* Active Scholar Loan Banner */}
                  {userLoan && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'linear-gradient(135deg, #fefce8 0%, #fef08a 100%)',
                        border: '1.5px solid #eab308',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        marginBottom: '14px',
                        fontSize: '11px',
                        color: '#713f12',
                        fontWeight: 700,
                        boxShadow: '0 2px 8px rgba(234, 179, 8, 0.2)',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <BookCheck size={14} color="#15803d" />
                        <span>In Your Custody</span>
                      </span>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          color: '#a16207',
                        }}
                      >
                        <Clock size={13} />
                        <span>{userLoan.daysRemaining}d remaining</span>
                      </span>
                    </div>
                  )}

                  {/* Header Row: Genre & Stock Pill */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Cinzel', 'Plus Jakarta Sans', serif",
                        fontSize: '10.5px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: '#78350f',
                        background: '#fef3c7',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        border: '1px solid #fde68a',
                      }}
                    >
                      {book.genre}
                    </span>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '999px',
                        color: inStock ? '#166534' : '#991b1b',
                        background: inStock ? '#f0fdf4' : '#fef2f2',
                        border: `1px solid ${inStock ? '#bbf7d0' : '#fecaca'}`,
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: inStock ? '#16a34a' : '#ef4444',
                          boxShadow: inStock ? '0 0 6px #16a34a' : '0 0 6px #ef4444',
                        }}
                      />
                      {inStock ? `${book.availableCopies} available` : 'Out of Stock'}
                    </span>
                  </div>

                  {/* Center Showcase: Luxury 3D Physical Book Cover */}
                  <Link
                    to={`/books/${book.id}`}
                    aria-label={`View ${book.title}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: '12px 0 20px 0',
                      position: 'relative',
                      textDecoration: 'none',
                    }}
                  >
                    {/* Atmospheric Spotlight Shadow under book */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        width: '180px',
                        height: '22px',
                        background:
                          'radial-gradient(ellipse at center, rgba(35, 25, 18, 0.38) 0%, transparent 75%)',
                        pointerEvents: 'none',
                        zIndex: 0,
                      }}
                    />

                    <LuxuryBookCover
                      book={book}
                      size="md"
                      interactiveHover
                      showRibbon
                      showFoilSheen
                    />
                  </Link>

                  {/* Book Title & Author Section */}
                  <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                    <Link
                      to={`/books/${book.id}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <h3
                        style={{
                          fontFamily: "'Cinzel', 'Cormorant Garamond', Georgia, serif",
                          fontSize: '1.12rem',
                          fontWeight: 700,
                          color: '#1a1614',
                          marginBottom: '4px',
                          lineHeight: 1.35,
                          letterSpacing: '0.01em',
                          transition: 'color 0.2s',
                        }}
                      >
                        {book.title}
                      </h3>
                    </Link>

                    <p
                      style={{
                        fontSize: '0.86rem',
                        fontStyle: 'italic',
                        color: '#6b5e52',
                        marginBottom: '14px',
                      }}
                    >
                      by {book.author}
                    </p>

                    {/* Stock & Circulation Inventory Ledger Bar */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(238, 230, 218, 0.65)',
                        borderRadius: '8px',
                        padding: '7px 11px',
                        fontSize: '11px',
                        marginBottom: '16px',
                        border: '1px solid rgba(212, 175, 55, 0.25)',
                      }}
                    >
                      <span
                        style={{
                          color: inStock ? '#15803d' : '#dc2626',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: inStock ? '#16a34a' : '#ef4444',
                          }}
                        />
                        {book.availableCopies} in Stacks
                      </span>
                      <span style={{ color: '#b45309', fontWeight: 600 }}>
                        {borrowedCount} Borrowed
                      </span>
                      <span style={{ color: '#78716c' }}>{book.totalCopies} Total Copies</span>
                    </div>

                    {/* Card Footer: ISBN barcode & Luxury Examine Button */}
                    <div
                      style={{
                        paddingTop: '12px',
                        borderTop: '1px solid rgba(212, 175, 55, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '11px',
                          fontFamily: 'var(--font-family-mono, monospace)',
                          color: '#8c7e72',
                          background: '#f2ece1',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid #e5dcce',
                          letterSpacing: '0.04em',
                        }}
                      >
                        ISBN {book.isbn}
                      </span>

                      <Link to={`/books/${book.id}`} style={{ textDecoration: 'none' }}>
                        <button
                          type="button"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 14px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #1d1815 0%, #352820 100%)',
                            color: '#fbbf24',
                            border: '1px solid rgba(245, 158, 11, 0.45)',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                            fontFamily: "'Cinzel', 'Plus Jakarta Sans', serif",
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              'linear-gradient(135deg, #2b221c 0%, #4a382d 100%)';
                            e.currentTarget.style.borderColor = '#fbbf24';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              'linear-gradient(135deg, #1d1815 0%, #352820 100%)';
                            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.45)';
                            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <span>Examine Volume</span>
                          <BookOpen size={13} color="#fbbf24" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <PaginationBar
            page={data?.pagination?.page || 1}
            totalPages={data?.pagination?.totalPages || 1}
            totalRecords={data?.pagination?.totalRecords || 0}
            limit={data?.pagination?.limit || 12}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </>
      )}
    </div>
  );
};
