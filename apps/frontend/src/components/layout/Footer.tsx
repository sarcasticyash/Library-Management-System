import React from 'react';
import { BookOpen, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer
      role="contentinfo"
      style={{
        marginTop: 'auto',
        backgroundColor: 'var(--color-bg-surface)',
        borderTop: '1px solid var(--color-border-subtle)',
        padding: 'var(--space-8) 0 var(--space-6)',
        color: 'var(--color-text-secondary)',
        fontSize: 'var(--font-size-sm)',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-6)',
            marginBottom: 'var(--space-6)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 'var(--space-4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-primary-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <BookOpen size={16} />
              </div>
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Cloud-Native LMS
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <Link to="/books" className="nav-link" style={{ padding: 0 }}>
                Catalog
              </Link>
              <Link to="/login" className="nav-link" style={{ padding: 0 }}>
                Sign In
              </Link>
              <Link to="/register" className="nav-link" style={{ padding: 0 }}>
                Register
              </Link>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-success-400)',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-success-400)',
                }}
                className="animate-pulse"
              />
              <span>API v1 Operational</span>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--color-border-subtle)',
            paddingTop: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)',
          }}
        >
          <p>
            © {new Date().getFullYear()} Cloud-Native Library Management System. All rights
            reserved.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <Shield size={12} />
            <span>WCAG 2.2 AA Compliant • RFC 7807 Standardized</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
