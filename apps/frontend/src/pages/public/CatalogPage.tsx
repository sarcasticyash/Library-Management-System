import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, CheckCircle, AlertTriangle } from 'lucide-react';
import { bookApi } from '../../api/book.api';
import { BookGenre } from '../../types/book';
import { useDebounce } from '../../hooks/useDebounce';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { PaginationBar } from '../../components/common/PaginationBar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { EmptyState } from '../../components/ui/EmptyState';

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
  const initialQ = searchParams.get('q') ?? '';
  const initialGenre = searchParams.get('genre') ?? 'All';

  const [searchTerm, setSearchTerm] = useState(initialQ);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [availableOnly, setAvailableOnly] = useState(searchParams.get('available') === 'true');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(searchTerm, 300);

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
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Library Book Catalog</h1>
          <p className="page-subtitle">
            Explore our curated collection of technical and literary volumes
          </p>
        </div>
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

      {data && data.data.length === 0 && (
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

      {data && data.data.length > 0 && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 'var(--space-6)',
              marginBottom: 'var(--space-6)',
            }}
          >
            {data.data.map((book) => {
              const inStock = book.availableCopies > 0;

              return (
                <Card
                  key={book.id}
                  hoverEffect
                  style={{ display: 'flex', flexDirection: 'column' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 'var(--space-3)',
                    }}
                  >
                    <Badge variant="neutral">{book.genre}</Badge>
                    <Badge
                      variant={inStock ? 'success' : 'danger'}
                      icon={inStock ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                    >
                      {inStock ? `${book.availableCopies} available` : 'Out of Stock'}
                    </Badge>
                  </div>

                  <h3
                    style={{
                      fontSize: 'var(--font-size-base)',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      marginBottom: 'var(--space-1)',
                      lineHeight: 1.4,
                    }}
                  >
                    {book.title}
                  </h3>

                  <p
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-secondary)',
                      marginBottom: 'var(--space-4)',
                    }}
                  >
                    by {book.author}
                  </p>

                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: 'var(--space-3)',
                      borderTop: '1px solid var(--color-border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        fontFamily: 'var(--font-family-mono)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {book.isbn}
                    </span>

                    <Link to={`/books/${book.id}`}>
                      <Button variant="outline" size="sm" rightIcon={<BookOpen size={14} />}>
                        View Details
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>

          <PaginationBar
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            totalRecords={data.pagination.totalRecords}
            limit={data.pagination.limit}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </>
      )}
    </div>
  );
};
