import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Layers,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Mail,
  Compass,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { bookApi } from '../../api/book.api';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ThreeBookCanvas } from '../../components/ui/ThreeBookCanvas';
import { TypewriterTitle } from '../../components/ui/TypewriterTitle';
import { DemoModal } from '../../components/common/DemoModal';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/user';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, role } = useAuth();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const { data: catalogData } = useQuery({
    queryKey: ['catalog-summary-count'],
    queryFn: () => bookApi.searchBooks({ limit: 1 }),
    staleTime: 60000,
  });

  const totalTitles = catalogData?.pagination?.totalRecords || 24;

  return (
    <div className="container page-container" style={{ paddingTop: 'var(--space-4)' }}>
      {/* ====================================================================
          Hero Section: Editorial Soulful Typography + 3D Three.js Archive
          ==================================================================== */}
      <section className="hero-editorial-wrapper" aria-label="Hero Section">
        <div className="hero-editorial-grid">
          {/* Left Column: Soulful Editorial Copy & CTAs */}
          <div className="hero-editorial-left">
            {/* Archive Badge */}
            <div className="hero-badge-tag">
              <span className="hero-stat-dot" />
              NATIONAL DIGITAL ARCHIVE // भारत राष्ट्रीय ग्रंथालय • STATION 042-B
            </div>

            {/* Massive Soul-stirring Typewriter Headline (Reference: Image 3) */}
            <TypewriterTitle />

            {/* CTA Button Cluster */}
            <div className="hero-cta-cluster">
              {!isAuthenticated ? (
                <>
                  <button
                    type="button"
                    className="btn-pill-demo"
                    style={{ padding: '12px 30px', fontSize: 'var(--font-size-base)' }}
                    onClick={() => setIsDemoModalOpen(true)}
                  >
                    <Sparkles size={18} />
                    <span>Try Free Demo</span>
                  </button>

                  <Link to="/books" style={{ textDecoration: 'none' }}>
                    <Button
                      variant="secondary"
                      size="lg"
                      rightIcon={<ArrowRight size={18} />}
                      style={{
                        borderRadius: 'var(--radius-full)',
                        padding: '0 var(--space-8)',
                      }}
                    >
                      Explore Catalog ({totalTitles})
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  {role === UserRole.ADMIN ? (
                    <Link to="/admin/dashboard" style={{ textDecoration: 'none' }}>
                      <Button
                        variant="primary"
                        size="lg"
                        leftIcon={<ShieldCheck size={18} />}
                        style={{
                          borderRadius: 'var(--radius-full)',
                          padding: '12px 28px',
                          fontSize: 'var(--font-size-base)',
                        }}
                      >
                        Enter Admin Console
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/loans/active" style={{ textDecoration: 'none' }}>
                      <Button
                        variant="primary"
                        size="lg"
                        leftIcon={<BookOpen size={18} />}
                        style={{
                          borderRadius: 'var(--radius-full)',
                          padding: '12px 28px',
                          fontSize: 'var(--font-size-base)',
                        }}
                      >
                        View My Active Loans
                      </Button>
                    </Link>
                  )}

                  <Link to="/books" style={{ textDecoration: 'none' }}>
                    <Button
                      variant="secondary"
                      size="lg"
                      rightIcon={<ArrowRight size={18} />}
                      style={{
                        borderRadius: 'var(--radius-full)',
                        padding: '0 var(--space-8)',
                      }}
                    >
                      Explore Catalog ({totalTitles})
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Quick Metrics & Highlights */}
            <div className="hero-stats-pills">
              <div className="hero-stat-pill">
                <span className="hero-stat-dot" />
                <span>125 Active Holdings (114 Available • 11 Borrowed)</span>
              </div>
              <div className="hero-stat-pill">
                <span
                  className="hero-stat-dot"
                  style={{
                    backgroundColor: '#0284c7',
                    boxShadow: '0 0 8px rgba(2, 132, 199, 0.4)',
                  }}
                />
                <span>Real-Time Aisle & Shelf Coordinates</span>
              </div>
              <div className="hero-stat-pill">
                <span
                  className="hero-stat-dot"
                  style={{
                    backgroundColor: '#16a34a',
                    boxShadow: '0 0 8px rgba(22, 163, 74, 0.4)',
                  }}
                />
                <span>14-Day Lending Windows</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive 3D Three.js Book Canvas */}
          <div className="hero-editorial-right">
            <ThreeBookCanvas />
          </div>
        </div>
      </section>

      {/* ====================================================================
          Section 2: Platform Pillars / Features (#features)
          ==================================================================== */}
      <section
        id="features"
        style={{
          paddingTop: 'var(--space-16)',
          paddingBottom: 'var(--space-12)',
          borderTop: '1px solid #ded5c7',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              color: '#ff4500',
              fontFamily: 'var(--font-family-mono)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 'var(--space-2)',
            }}
          >
            <Compass size={14} />
            ENGINEERED FOR PRECISION
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
              fontWeight: 800,
              color: '#171412',
              letterSpacing: '-0.03em',
            }}
          >
            Where Physical Library Romance Meets Digital Precision
          </h2>
          <p
            style={{
              color: '#59534c',
              maxWidth: '640px',
              margin: 'var(--space-3) auto 0',
              fontSize: 'var(--font-size-base)',
            }}
          >
            Built from the ground up on Clean Architecture with sub-millisecond query caching,
            bulletproof circulation state machines, and dual-token patron security.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--space-6)',
          }}
        >
          {/* Card 1 */}
          <Card hoverEffect style={{ background: '#ffffff', border: '1px solid #ded5c7' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(255, 69, 0, 0.08)',
                color: '#ff4500',
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
                fontWeight: 700,
                color: '#171412',
                marginBottom: 'var(--space-2)',
              }}
            >
              Instant Full-Text Catalog
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: '#59534c', lineHeight: 1.6 }}>
              Debounced real-time searches across titles, authors, and ISBNs. Find physical copy
              availability with exact aisle, shelf, and section coordinates.
            </p>
          </Card>

          {/* Card 2 */}
          <Card hoverEffect style={{ background: '#ffffff', border: '1px solid #ded5c7' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(2, 132, 199, 0.08)',
                color: '#0284c7',
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
                fontWeight: 700,
                color: '#171412',
                marginBottom: 'var(--space-2)',
              }}
            >
              Automated 14-Day Lending
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: '#59534c', lineHeight: 1.6 }}>
              5-volume active borrow quota enforcement, smart countdown alerts before due dates, and
              instant self-service return workflows for patrons.
            </p>
          </Card>

          {/* Card 3 */}
          <Card hoverEffect style={{ background: '#ffffff', border: '1px solid #ded5c7' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(22, 163, 74, 0.08)',
                color: '#16a34a',
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
                fontWeight: 700,
                color: '#171412',
                marginBottom: 'var(--space-2)',
              }}
            >
              Dual-Token Security & Audit
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: '#59534c', lineHeight: 1.6 }}>
              Enterprise-grade role-based access control (RBAC), HttpOnly refresh cookie rotation,
              and immutable audit logs tracking every loan transition.
            </p>
          </Card>
        </div>
      </section>

      {/* ====================================================================
          Section 3: About Nālandā Archive (#about)
          ==================================================================== */}
      <section
        id="about"
        style={{
          paddingTop: 'var(--space-12)',
          paddingBottom: 'var(--space-12)',
          borderTop: '1px solid #ded5c7',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #ded5c7',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-10) var(--space-8)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-8)',
            alignItems: 'center',
            boxShadow: '0 4px 16px rgba(23, 20, 18, 0.04)',
          }}
        >
          <div>
            <div
              style={{
                color: '#ff4500',
                fontFamily: 'var(--font-family-mono)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 'var(--space-2)',
              }}
            >
              THE NĀLANDĀ LEGACY // नालंदा ग्रंथालय परंपरा
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-family-display)',
                fontSize: 'var(--font-size-3xl)',
                fontWeight: 800,
                color: '#171412',
                letterSpacing: '-0.02em',
                marginBottom: 'var(--space-4)',
              }}
            >
              Preserving Knowledge, Streamlining Operations
            </h3>
            <p style={{ color: '#59534c', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
              Drawing inspiration from ancient Nālandā University’s legendary <em>Dharmaganja</em>{' '}
              repository, Nālandā LMS preserves historical Sanskrit folios, classical literature,
              and state-of-the-art engineering volumes for premier Indian institutions (IITs, IISc,
              Central Universities) and global researchers.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  color: '#171412',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <CheckCircle2 size={16} style={{ color: '#16a34a' }} />
                <span>UGC, AICTE & NDLI cataloging standard compliance</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  color: '#171412',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <CheckCircle2 size={16} style={{ color: '#16a34a' }} />
                <span>Seamless institutional patron onboarding across campuses</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  color: '#171412',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <CheckCircle2 size={16} style={{ color: '#16a34a' }} />
                <span>Real-time loan ledger with zero discrepancy tracking</span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'var(--space-4)',
            }}
          >
            <div
              style={{
                background: '#f6f3eb',
                border: '1px solid #ded5c7',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-5)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-family-display)',
                  fontSize: '36px',
                  fontWeight: 800,
                  color: '#ff4500',
                }}
              >
                {totalTitles}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#78716c',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginTop: '4px',
                }}
              >
                Curated Volumes (125 Holdings)
              </div>
            </div>

            <div
              style={{
                background: '#f6f3eb',
                border: '1px solid #ded5c7',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-5)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-family-display)',
                  fontSize: '36px',
                  fontWeight: 800,
                  color: '#0284c7',
                }}
              >
                99.8%
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#78716c',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginTop: '4px',
                }}
              >
                On-Time Returns
              </div>
            </div>

            <div
              style={{
                background: '#f6f3eb',
                border: '1px solid #ded5c7',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-5)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-family-display)',
                  fontSize: '36px',
                  fontWeight: 800,
                  color: '#16a34a',
                }}
              >
                14
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#78716c',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginTop: '4px',
                }}
              >
                Days Loan Window
              </div>
            </div>

            <div
              style={{
                background: '#f6f3eb',
                border: '1px solid #ded5c7',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-5)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-family-display)',
                  fontSize: '36px',
                  fontWeight: 800,
                  color: '#d97706',
                }}
              >
                042-B
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#78716c',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginTop: '4px',
                }}
              >
                Station Code
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          Section 4: Contact & Archival Helpdesk (#contact)
          ==================================================================== */}
      <section
        id="contact"
        style={{
          paddingTop: 'var(--space-8)',
          paddingBottom: 'var(--space-12)',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(145deg, #ffffff 0%, #fffdfa 100%)',
            borderRadius: '24px',
            border: '1.5px solid rgba(212, 175, 55, 0.45)',
            boxShadow: '0 12px 36px rgba(28, 20, 14, 0.06)',
            padding: 'clamp(28px, 5vw, 48px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top 24K Gold Foil Accent Ribbon */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #b38600 0%, #ffd700 50%, #b38600 100%)',
            }}
          />

          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '999px',
                background: 'rgba(212, 175, 55, 0.12)',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                color: '#8c6b12',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: '10px',
              }}
            >
              <Mail size={12} />
              <span>Official Archival Helpdesk & Liaison</span>
            </div>

            <h3
              style={{
                fontFamily: "'Cinzel', 'Cormorant Garamond', Georgia, serif",
                fontSize: 'clamp(1.75rem, 3vw, 2.3rem)',
                fontWeight: 800,
                color: '#1a1614',
                marginBottom: '10px',
                letterSpacing: '0.01em',
              }}
            >
              Have an Inquiry or Need Circulation Support?
            </h3>

            <p style={{ color: '#6b5e52', fontSize: '0.94rem', lineHeight: 1.6, margin: 0 }}>
              Direct dual-channel communication matrix. Scholars connect directly with the{' '}
              <strong>Library Administration</strong>, while administrators escalate system events
              directly to the <strong>Chief Systems Architect (singhyash0706@gmail.com)</strong>.
            </p>
          </div>

          {/* Dual Channel Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '36px',
            }}
          >
            {/* Student Channel Card */}
            <div
              style={{
                background: '#faf7f2',
                borderRadius: '16px',
                border: '1px solid #e7ddc4',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '14px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#171412',
                      color: '#ffd700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <BookOpen size={20} />
                  </div>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '999px',
                      background: '#dcfce7',
                      color: '#166534',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Librarian Desk
                  </span>
                </div>

                <h4
                  style={{
                    fontFamily: "'Cinzel', Georgia, serif",
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#1a1614',
                    marginBottom: '6px',
                  }}
                >
                  Student & Scholar Helpdesk
                </h4>
                <p
                  style={{
                    fontSize: '0.84rem',
                    color: '#57534e',
                    lineHeight: 1.5,
                    marginBottom: '14px',
                  }}
                >
                  Circulation queries, book reservation holds, shelf navigation assistance, and
                  lending window renewal requests.
                </p>
                <div
                  style={{
                    fontSize: '0.82rem',
                    color: '#166534',
                    fontWeight: 600,
                    marginBottom: '16px',
                  }}
                >
                  Routes to: librarian@delhi.library.gov.in
                </div>
              </div>

              <Link to="/contact" style={{ textDecoration: 'none' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  style={{ width: '100%', borderRadius: '999px', fontWeight: 600 }}
                >
                  Submit Student Inquiry
                </Button>
              </Link>
            </div>

            {/* Admin Channel Card */}
            <div
              style={{
                background: '#faf7f2',
                borderRadius: '16px',
                border: '1px solid #e7ddc4',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '14px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#171412',
                      color: '#ffd700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ShieldCheck size={20} />
                  </div>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '999px',
                      background: '#fee2e2',
                      color: '#991b1b',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Super Admin Direct
                  </span>
                </div>

                <h4
                  style={{
                    fontFamily: "'Cinzel', Georgia, serif",
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#1a1614',
                    marginBottom: '6px',
                  }}
                >
                  Administrator & System Escalation
                </h4>
                <p
                  style={{
                    fontSize: '0.84rem',
                    color: '#57534e',
                    lineHeight: 1.5,
                    marginBottom: '14px',
                  }}
                >
                  Infrastructure outages, replica errors, catalog sync exceptions, security audits,
                  and architectural enhancements.
                </p>
                <div
                  style={{
                    fontSize: '0.82rem',
                    color: '#991b1b',
                    fontWeight: 600,
                    marginBottom: '16px',
                  }}
                >
                  Routes to: singhyash0706@gmail.com
                </div>
              </div>

              <Link to="/contact" style={{ textDecoration: 'none' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  style={{ width: '100%', borderRadius: '999px', fontWeight: 600 }}
                >
                  Escalate to Super Admin
                </Button>
              </Link>
            </div>
          </div>

          {/* Central Actions Cluster */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '14px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <Link to="/contact" style={{ textDecoration: 'none' }}>
              <Button
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight size={16} />}
                style={{
                  background: 'linear-gradient(135deg, #b38600 0%, #ffd700 50%, #997014 100%)',
                  color: '#1a1405',
                  fontWeight: 700,
                  border: '1px solid rgba(255, 215, 0, 0.8)',
                  borderRadius: '999px',
                  boxShadow: '0 4px 14px rgba(179, 134, 0, 0.35)',
                  padding: '12px 28px',
                }}
              >
                Open Official Contact Pavilion
              </Button>
            </Link>

            {!isAuthenticated && (
              <button
                type="button"
                className="btn-pill-demo"
                onClick={() => setIsDemoModalOpen(true)}
                style={{ padding: '12px 24px', fontSize: 'var(--font-size-base)' }}
              >
                <Sparkles size={16} />
                <span>Launch Live Demo Now</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Demo Modal (Only shown for guest visitors) */}
      {!isAuthenticated && (
        <DemoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
      )}
    </div>
  );
};
