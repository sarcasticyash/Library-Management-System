import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  LogOut,
  Menu,
  X,
  User,
  LayoutDashboard,
  Layers,
  History,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/user';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { DemoModal } from '../common/DemoModal';

export const Header: React.FC = () => {
  const { user, isAuthenticated, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = role === UserRole.ADMIN;
  const isPatron = role === UserRole.PATRON;

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate(`/#${id}`);
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header className="app-header" role="banner">
        <div className="app-header-inner">
          {/* Brand Logo & Station Badge (Left Side) */}
          <Link to="/" className="brand-logo" aria-label="Nālandā National Digital Archive Home">
            <div className="brand-icon-box">
              <BookOpen size={20} strokeWidth={2.5} />
            </div>
            <div>
              <span>NĀLANDĀ</span>
              <span className="brand-subtext">NATIONAL DIGITAL ARCHIVE // राष्ट्रीय ग्रंथालय</span>
            </div>
          </Link>

          {/* Middle Floating Pill Dock (Reference: Image 2) */}
          <nav className="nav-pill-dock" aria-label="Main Navigation">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `nav-pill-item ${isActive && location.hash === '' ? 'active' : ''}`
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/books"
              className={({ isActive }) => `nav-pill-item ${isActive ? 'active' : ''}`}
            >
              Catalog
            </NavLink>

            <button
              type="button"
              className="nav-pill-item"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onClick={() => scrollToSection('features')}
            >
              Features
            </button>

            <button
              type="button"
              className="nav-pill-item"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onClick={() => scrollToSection('about')}
            >
              About
            </button>

            <NavLink
              to="/contact"
              className={({ isActive }) => `nav-pill-item ${isActive ? 'active' : ''}`}
            >
              Contact
            </NavLink>

            {/* Authenticated Patron Links */}
            {isPatron && (
              <>
                <NavLink
                  to="/my-loans"
                  className={({ isActive }) => `nav-pill-item ${isActive ? 'active' : ''}`}
                >
                  <Layers size={14} />
                  <span>Loans</span>
                  {user && (
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '1px 5px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(56, 189, 248, 0.2)',
                        color: '#38bdf8',
                      }}
                    >
                      {user.activeBorrowCount}/5
                    </span>
                  )}
                </NavLink>

                <NavLink
                  to="/my-history"
                  className={({ isActive }) => `nav-pill-item ${isActive ? 'active' : ''}`}
                >
                  <History size={14} />
                  <span>History</span>
                </NavLink>
              </>
            )}

            {/* Authenticated Admin Links */}
            {isAdmin && (
              <>
                <NavLink
                  to="/admin/dashboard"
                  className={({ isActive }) => `nav-pill-item ${isActive ? 'active' : ''}`}
                >
                  <LayoutDashboard size={14} />
                  <span>Admin</span>
                </NavLink>

                <NavLink
                  to="/admin/books"
                  className={({ isActive }) => `nav-pill-item ${isActive ? 'active' : ''}`}
                >
                  <BookOpen size={14} />
                  <span>Inventory</span>
                </NavLink>

                <NavLink
                  to="/admin/circulation"
                  className={({ isActive }) => `nav-pill-item ${isActive ? 'active' : ''}`}
                >
                  <Layers size={14} />
                  <span>Circulation</span>
                </NavLink>
              </>
            )}
          </nav>

          {/* Right Side Header Actions */}
          <div className="header-actions">
            {isAuthenticated && user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <Badge
                  variant={isAdmin ? 'info' : 'success'}
                  icon={isAdmin ? <ShieldCheck size={12} /> : <User size={12} />}
                >
                  {isAdmin ? 'ADMIN' : 'PATRON'}
                </Badge>

                <Link to="/profile" className="btn-pill-login" title={`Signed in as ${user.email}`}>
                  <User size={15} />
                  <span>{user.firstName}</span>
                </Link>

                <button
                  type="button"
                  className="btn-pill-login"
                  onClick={handleLogout}
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Link to="/login" className="btn-pill-login">
                  Sign In
                </Link>
                <button
                  type="button"
                  className="btn-pill-demo"
                  onClick={() => setIsDemoModalOpen(true)}
                  aria-label="Try Free Demo"
                >
                  <Sparkles size={15} />
                  <span>Try Free Demo</span>
                </button>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className="btn btn-ghost btn-sm mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              style={{ padding: '6px', color: '#f8fafc' }}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Responsive Mobile Drawer */}
        {isMobileMenuOpen && (
          <div
            className="mobile-drawer animate-fade-in"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: '#0d1424',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              padding: 'var(--space-6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
            }}
          >
            <NavLink to="/" className="nav-pill-item" onClick={() => setIsMobileMenuOpen(false)}>
              Home
            </NavLink>
            <NavLink
              to="/books"
              className="nav-pill-item"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Catalog Discovery
            </NavLink>
            <button
              type="button"
              className="nav-pill-item"
              style={{ background: 'transparent', border: 'none', textAlign: 'left' }}
              onClick={() => scrollToSection('features')}
            >
              Features
            </button>
            <button
              type="button"
              className="nav-pill-item"
              style={{ background: 'transparent', border: 'none', textAlign: 'left' }}
              onClick={() => scrollToSection('about')}
            >
              About Nālandā
            </button>
            <NavLink
              to="/contact"
              className="nav-pill-item"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Archival Helpdesk & Contact
            </NavLink>

            {isPatron && (
              <>
                <NavLink
                  to="/my-loans"
                  className="nav-pill-item"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Loans {user ? `(${user.activeBorrowCount}/5)` : ''}
                </NavLink>
                <NavLink
                  to="/my-history"
                  className="nav-pill-item"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Loan History
                </NavLink>
              </>
            )}

            {isAdmin && (
              <>
                <NavLink
                  to="/admin/dashboard"
                  className="nav-pill-item"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin Dashboard
                </NavLink>
                <NavLink
                  to="/admin/books"
                  className="nav-pill-item"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Manage Books
                </NavLink>
                <NavLink
                  to="/admin/users"
                  className="nav-pill-item"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  User Directory
                </NavLink>
                <NavLink
                  to="/admin/circulation"
                  className="nav-pill-item"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Circulation
                </NavLink>
                <NavLink
                  to="/admin/audit-logs"
                  className="nav-pill-item"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Audit Logs
                </NavLink>
              </>
            )}

            <div
              style={{
                marginTop: 'var(--space-2)',
                paddingTop: 'var(--space-4)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}
            >
              {isAuthenticated && user ? (
                <>
                  <Link
                    to="/profile"
                    className="btn-pill-login"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User size={16} />
                    <span>Profile ({user.firstName})</span>
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      void handleLogout();
                    }}
                    leftIcon={<LogOut size={16} />}
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <Link
                    to="/login"
                    style={{ flex: 1 }}
                    className="btn-pill-login"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <button
                    type="button"
                    style={{ flex: 1 }}
                    className="btn-pill-demo"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsDemoModalOpen(true);
                    }}
                  >
                    Try Free Demo
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Instant Demo Sandbox Modal */}
      <DemoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
    </>
  );
};
