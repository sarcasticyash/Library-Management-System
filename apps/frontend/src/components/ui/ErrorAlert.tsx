import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { ApiError } from '../../api/errors';
import { Button } from '../common/Button';

export interface ErrorAlertProps {
  error: ApiError | Error | string | null;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  title,
  onRetry,
  className = '',
}) => {
  if (!error) return null;

  let message = '';
  let correlationId: string | undefined;
  let code: string | undefined;
  let fieldErrors: { field: string; message: string }[] | undefined;
  let resolvedTitle = title;

  if (error instanceof ApiError) {
    message = error.detail;
    correlationId = error.correlationId;
    code = error.code;
    fieldErrors = error.fieldErrors;
    if (!resolvedTitle) {
      resolvedTitle = error.title || 'An error occurred';
    }
  } else if (error instanceof Error) {
    message = error.message;
    if (!resolvedTitle) resolvedTitle = 'An error occurred';
  } else {
    message = error;
    if (!resolvedTitle) resolvedTitle = 'An error occurred';
  }

  return (
    <div
      className={`card ${className}`.trim()}
      role="alert"
      aria-live="assertive"
      style={{
        backgroundColor: 'rgba(220, 38, 38, 0.08)',
        borderColor: 'rgba(220, 38, 38, 0.3)',
        padding: 'var(--space-4) var(--space-5)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
        <AlertCircle
          size={20}
          style={{ color: 'var(--color-danger-400)', flexShrink: 0, marginTop: '2px' }}
        />
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-danger-400)',
              marginBottom: 'var(--space-1)',
            }}
          >
            {resolvedTitle} {code ? `(${code})` : ''}
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {message}
          </p>

          {fieldErrors && fieldErrors.length > 0 && (
            <ul
              style={{
                marginTop: 'var(--space-2)',
                paddingLeft: 'var(--space-4)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-danger-400)',
              }}
            >
              {fieldErrors.map((fe, idx) => (
                <li key={idx}>
                  <strong>{fe.field}:</strong> {fe.message}
                </li>
              ))}
            </ul>
          )}

          {correlationId && (
            <p
              style={{
                marginTop: 'var(--space-2)',
                fontSize: 'var(--font-size-xs)',
                fontFamily: 'var(--font-family-mono)',
                color: 'var(--color-text-muted)',
              }}
            >
              Correlation ID: {correlationId}
            </p>
          )}

          {onRetry && (
            <div style={{ marginTop: 'var(--space-3)' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                leftIcon={<RefreshCw size={14} />}
              >
                Retry Request
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
