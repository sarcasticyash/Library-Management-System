import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, BookOpen, ShieldCheck, Search, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handlePatronDemo = async () => {
    try {
      // Fast demo sign-in for Scholar Patron
      await login({ email: 'arjun.sharma@iitd.ac.in', password: 'PatronPassword123!' });
      onClose();
      navigate('/books');
    } catch {
      onClose();
      navigate('/books');
    }
  };

  const handleAdminDemo = async () => {
    try {
      // Fast demo sign-in for Chief Librarian Admin
      await login({ email: 'librarian@delhi.library.gov.in', password: 'AdminSecret123!' });
      onClose();
      navigate('/admin/dashboard');
    } catch {
      onClose();
      navigate('/admin/dashboard');
    }
  };

  const handleExploreGuest = () => {
    onClose();
    navigate('/books?q=architecture');
  };

  return (
    <div
      className="modal-backdrop animate-fade-in"
      onClick={onClose}
      style={{ zIndex: 200, padding: 'var(--space-4)' }}
    >
      <div
        className="demo-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-modal-title"
      >
        {/* Header */}
        <div
          style={{
            padding: 'var(--space-6) var(--space-6) var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, #ff5500, #f97316)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <h2
                id="demo-modal-title"
                style={{
                  fontFamily: 'var(--font-family-display)',
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                }}
              >
                Instant Live Demo Experience
              </h2>
              <p style={{ fontSize: 'var(--font-size-xs)', color: '#94a3b8', marginTop: '2px' }}>
                Select a sandbox persona to experience the library system with zero setup.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
            }}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Roles List */}
        <div
          style={{
            padding: '0 var(--space-6) var(--space-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          {/* Patron Persona */}
          <button type="button" className="demo-role-card" onClick={handlePatronDemo}>
            <div
              className="demo-role-icon"
              style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}
            >
              <BookOpen size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-family-sans)',
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 700,
                    color: '#f8fafc',
                  }}
                >
                  Patron / Reader Persona
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    fontFamily: 'var(--font-family-mono)',
                    fontWeight: 600,
                  }}
                >
                  Arjun Sharma (IITD)
                </span>
              </div>
              <p style={{ fontSize: 'var(--font-size-xs)', color: '#94a3b8', lineHeight: 1.5 }}>
                Test 14-day checkout flows, manage active borrow quotas (up to 5 volumes), and view
                due date countdown badges.
              </p>
            </div>
            <ArrowRight size={18} style={{ color: '#64748b', marginTop: '4px' }} />
          </button>

          {/* Administrator Persona */}
          <button type="button" className="demo-role-card" onClick={handleAdminDemo}>
            <div
              className="demo-role-icon"
              style={{ backgroundColor: 'rgba(255, 85, 0, 0.15)', color: '#ff5500' }}
            >
              <ShieldCheck size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-family-sans)',
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 700,
                    color: '#f8fafc',
                  }}
                >
                  Chief Librarian / Admin
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(255, 85, 0, 0.15)',
                    color: '#ff7a3d',
                    fontFamily: 'var(--font-family-mono)',
                    fontWeight: 600,
                  }}
                >
                  Dr. Vikramaditya Sen
                </span>
              </div>
              <p style={{ fontSize: 'var(--font-size-xs)', color: '#94a3b8', lineHeight: 1.5 }}>
                Access administrative oversight, add books with aisle/shelf coordinates, enforce
                loan returns, and view audit trails.
              </p>
            </div>
            <ArrowRight size={18} style={{ color: '#64748b', marginTop: '4px' }} />
          </button>

          {/* Guest Catalog Persona */}
          <button type="button" className="demo-role-card" onClick={handleExploreGuest}>
            <div
              className="demo-role-icon"
              style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34d399' }}
            >
              <Search size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-family-sans)',
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 700,
                    color: '#f8fafc',
                  }}
                >
                  Public Archive Discovery
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(52, 211, 153, 0.15)',
                    color: '#34d399',
                    fontFamily: 'var(--font-family-mono)',
                    fontWeight: 600,
                  }}
                >
                  Guest Access
                </span>
              </div>
              <p style={{ fontSize: 'var(--font-size-xs)', color: '#94a3b8', lineHeight: 1.5 }}>
                Search over 4,200 holdings across Fiction, Science, Engineering, and History without
                signing in.
              </p>
            </div>
            <ArrowRight size={18} style={{ color: '#64748b', marginTop: '4px' }} />
          </button>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-6)',
            backgroundColor: '#0c121e',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#64748b',
          }}
        >
          <span>Pre-loaded with sample catalog data and loans</span>
          <span style={{ fontFamily: 'var(--font-family-mono)' }}>CloudLMS v1.0</span>
        </div>
      </div>
    </div>
  );
};
