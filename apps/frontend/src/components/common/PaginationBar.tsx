import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export interface PaginationBarProps {
  page: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  className?: string;
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  page,
  totalPages,
  totalRecords,
  limit,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1 && totalRecords <= limit) {
    return null;
  }

  const startRecord = Math.min((page - 1) * limit + 1, totalRecords);
  const endRecord = Math.min(page * limit, totalRecords);

  return (
    <nav
      className={`pagination-container ${className}`.trim()}
      aria-label="Pagination Navigation"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
        paddingTop: 'var(--space-4)',
      }}
    >
      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
        Showing <strong style={{ color: 'var(--color-text-primary)' }}>{startRecord}</strong> to{' '}
        <strong style={{ color: 'var(--color-text-primary)' }}>{endRecord}</strong> of{' '}
        <strong style={{ color: 'var(--color-text-primary)' }}>{totalRecords}</strong> results
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          leftIcon={<ChevronLeft size={16} />}
        >
          Previous
        </Button>

        <span
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500,
            padding: '0 var(--space-2)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Page <span style={{ color: 'var(--color-primary-400)' }}>{page}</span> of {totalPages}
        </span>

        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          rightIcon={<ChevronRight size={16} />}
        >
          Next
        </Button>
      </div>
    </nav>
  );
};
