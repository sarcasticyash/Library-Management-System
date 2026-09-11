/**
 * Cloud-Native Library Management System (LMS)
 * React Error Boundary Component
 *
 * Catches unhandled JavaScript exceptions in child component trees, logs them,
 * and renders an accessible, elegant fallback UI conforming to WCAG 2.2 AA.
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo?: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    // eslint-disable-next-line no-console
    console.error('Unhandled UI Exception caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleHome = (): void => {
    window.location.href = '/';
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-6)',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              textAlign: 'center',
              padding: 'var(--space-8)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              backgroundColor: 'var(--color-bg-surface)',
              boxShadow: 'var(--elevation-modal)',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: 'var(--color-danger-400)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <AlertOctagon size={28} />
            </div>

            <h1
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--space-2)',
              }}
            >
              Application Error
            </h1>

            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-6)',
                lineHeight: 1.6,
              }}
            >
              An unexpected runtime error occurred while rendering this view. Your session and
              stored state remain secure.
            </p>

            {this.state.error?.message && (
              <div
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--color-bg-surface-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-subtle)',
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                  marginBottom: 'var(--space-6)',
                  wordBreak: 'break-word',
                  textAlign: 'left',
                }}
              >
                {this.state.error.message}
                {this.state.error.stack && (
                  <details style={{ marginTop: '8px', cursor: 'pointer' }}>
                    <summary style={{ color: 'var(--color-danger-400)', fontWeight: 600 }}>
                      Inspect Component Stack
                    </summary>
                    <pre
                      style={{
                        marginTop: '8px',
                        fontSize: '11px',
                        whiteSpace: 'pre-wrap',
                        color: 'var(--color-text-secondary)',
                        maxHeight: '160px',
                        overflowY: 'auto',
                      }}
                    >
                      {this.state.error.stack}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 'var(--space-3)',
                flexWrap: 'wrap',
              }}
            >
              <Button
                variant="primary"
                onClick={this.handleReload}
                leftIcon={<RefreshCw size={16} />}
              >
                Reload Page
              </Button>
              <Button variant="secondary" onClick={this.handleHome} leftIcon={<Home size={16} />}>
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
