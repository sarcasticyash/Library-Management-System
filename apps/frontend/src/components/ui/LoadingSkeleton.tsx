import React from 'react';

export interface LoadingSkeletonProps {
  count?: number;
  height?: string;
  width?: string;
  borderRadius?: string;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  count = 1,
  height = '20px',
  width = '100%',
  borderRadius = 'var(--radius-md)',
  className = '',
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%' }}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse ${className}`.trim()}
          style={{
            height,
            width,
            borderRadius,
            backgroundColor: 'var(--color-bg-surface-elevated)',
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};
