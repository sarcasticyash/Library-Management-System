import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
  size?: number;
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 32,
  message,
  className = '',
}) => {
  return (
    <div
      className={`loading-spinner-wrapper ${className}`.trim()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8)',
        gap: 'var(--space-3)',
      }}
      role="status"
      aria-live="polite"
    >
      <Loader2 size={size} className="animate-spin" style={{ color: 'var(--color-primary-400)' }} />
      {message && (
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          {message}
        </p>
      )}
      <span className="sr-only">Loading content, please wait...</span>
    </div>
  );
};
