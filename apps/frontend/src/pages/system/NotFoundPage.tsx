import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div
      className="container page-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        minHeight: 'calc(100vh - 240px)',
        padding: 'var(--space-12) var(--space-4)',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-primary-400)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <FileQuestion size={36} />
      </div>

      <span
        style={{
          fontSize: 'var(--font-size-sm)',
          fontWeight: 700,
          color: 'var(--color-primary-400)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 'var(--space-2)',
        }}
      >
        Error 404
      </span>

      <h1
        style={{
          fontSize: 'var(--font-size-3xl)',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--space-3)',
        }}
      >
        Page Not Found
      </h1>

      <p
        style={{
          fontSize: 'var(--font-size-base)',
          color: 'var(--color-text-secondary)',
          maxWidth: '480px',
          marginBottom: 'var(--space-8)',
          lineHeight: 1.6,
        }}
      >
        The page you are searching for does not exist, has been moved, or is temporarily
        unavailable.
      </p>

      <Link to="/books">
        <Button variant="primary" size="md" leftIcon={<ArrowLeft size={16} />}>
          Return to Catalog
        </Button>
      </Link>
    </div>
  );
};
