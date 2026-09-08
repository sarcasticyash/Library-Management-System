import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from '../common/Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`card ${className}`.trim()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'var(--space-12) var(--space-6)',
        backgroundColor: 'var(--color-bg-surface)',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-primary-400)',
          marginBottom: 'var(--space-4)',
        }}
      >
        {icon ?? <PackageOpen size={28} />}
      </div>

      <h3
        style={{
          fontSize: 'var(--font-size-lg)',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--space-2)',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-secondary)',
          maxWidth: '420px',
          marginBottom: actionLabel && onAction ? 'var(--space-6)' : 0,
        }}
      >
        {description}
      </p>

      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
