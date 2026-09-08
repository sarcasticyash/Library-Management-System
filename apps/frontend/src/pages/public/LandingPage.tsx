import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ShieldCheck, Zap, Layers, ArrowRight } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export const LandingPage: React.FC = () => {
  return (
    <div className="container page-container">
      {/* Hero Section */}
      <section
        style={{
          textAlign: 'center',
          padding: 'var(--space-12) var(--space-4) var(--space-16)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-6)',
        }}
      >
        <Badge variant="info" icon={<Zap size={14} />}>
          Cloud-Native Library Management System
        </Badge>

        <h1
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            maxWidth: '900px',
            background: 'linear-gradient(135deg, #ffffff 40%, var(--color-primary-400) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Next-Generation Circulation & Catalog Discovery
        </h1>

        <p
          style={{
            fontSize: 'var(--font-size-lg)',
            color: 'var(--color-text-secondary)',
            maxWidth: '680px',
            lineHeight: 1.6,
          }}
        >
          An enterprise-grade, clean-architecture platform providing instant catalog search,
          real-time book checkout, automated overdue tracking, and staff oversight.
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-4)',
            flexWrap: 'wrap',
            marginTop: 'var(--space-2)',
          }}
        >
          <Link to="/books">
            <Button
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight size={18} />}
              style={{ padding: '0 var(--space-8)' }}
            >
              Explore Book Catalog
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" size="lg">
              Sign In to Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Feature Pillar Cards */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-6)',
          marginTop: 'var(--space-4)',
        }}
      >
        <Card hoverEffect>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              color: 'var(--color-primary-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-4)',
            }}
          >
            <BookOpen size={24} />
          </div>
          <h3
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-2)',
            }}
          >
            Instant Full-Text Catalog
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Search across titles, authors, and genres with 300ms debounced queries and real-time
            copy availability down to exact aisle and shelf coordinates.
          </p>
        </Card>

        <Card hoverEffect>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: 'var(--color-success-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-4)',
            }}
          >
            <Layers size={24} />
          </div>
          <h3
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-2)',
            }}
          >
            Dynamic Circulation
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Automated 14-day checkout windows, 5-book active quota enforcement, self-service
            returns, and real-time countdown alerts before due dates.
          </p>
        </Card>

        <Card hoverEffect>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--color-secondary-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-4)',
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <h3
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-2)',
            }}
          >
            Dual-Token Security
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Strict role-based access control, in-memory access tokens, HttpOnly refresh cookies, and
            immutable audit logs for administrative accountability.
          </p>
        </Card>
      </section>
    </div>
  );
};
