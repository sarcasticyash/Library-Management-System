import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  LogOut,
  Menu,
  X,
  User,
  LayoutDashboard,
  Layers,
  Users,
  ClipboardList,
  History,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/user';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

export const Header: React.FC = () => {
  const { user, isAuthenticated, role, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = role === UserRole.ADMIN;
  const isPatron = role === UserRole.PATRON;

  return (
    <header className="app-header" role="banner">
      <div className="container app-header-inner">
        {/* Brand Logo */}
        <Link to="/" className="brand-logo" aria-label="CloudLMS Home">
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background:
                'linear-gradient(135deg, var(--color-primary-600), var(--color-secondary-600))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)',
            }}
          >
            <BookOpen size={20} />
          </div>
          <span>
            Cloud<span style={{ color: 'var(--color-primary-400)' }}>LMS</span>
          </span>
          <span className="brand-badge">v1.0</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="nav-links" aria-label="Main Navigation">
          <NavLink to="/books" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Explore Catalog
          </NavLink>

          {isPatron && (
            <>
              <NavLink
                to="/my-loans"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Layers size={16} />
                <span>My Active Loans</span>
                {user && (
                  <Badge
                    variant={user.activeBorrowCount >= 5 ? 'warning' : 'info'}
                    style={{ fontSize: '10px', padding: '1px 5px' }}
                  >
                    {user.activeBorrowCount}/5
                  </Badge>
                )}
              </NavLink>

              <NavLink
                to="/my-history"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <History size={16} />
                <span>Loan History</span>
              </NavLink>
            </>
          )}

          {isAdmin && (
            <>
              <NavLink
                to="/admin/dashboard"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/admin/books"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <BookOpen size={16} />
                <span>Manage Books</span>
              </NavLink>

              <NavLink
                to="/admin/users"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Users size={16} />
                <span>User Directory</span>
              </NavLink>

              <NavLink
                to="/admin/circulation"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Layers size={16} />
                <span>Circulation</span>
              </NavLink>

              <NavLink
                to="/admin/audit-logs"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <ClipboardList size={16} />
                <span>Audit Logs</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* Desktop Auth Actions */}
        <div
          style={{ display: 'none', alignItems: 'center', gap: 'var(--space-3)' }}
          className="desktop-auth-actions"
        >
          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Badge
                variant={isAdmin ? 'info' : 'success'}
                icon={isAdmin ? <ShieldCheck size={12} /> : <User size={12} />}
              >
                {isAdmin ? 'ADMIN' : 'PATRON'}
              </Badge>

              <Link
                to="/profile"
                className="nav-link"
                style={{ padding: 'var(--space-1) var(--space-3)' }}
                title={`Signed in as ${user.email}`}
              >
                <User size={16} />
                <span>{user.firstName}</span>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                aria-label="Sign out"
                leftIcon={<LogOut size={16} />}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Join / Register
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          className="btn btn-ghost btn-sm mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          style={{ display: 'flex' }}
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Responsive Mobile Drawer */}
      {isMobileMenuOpen && (
        <div
          className="mobile-drawer animate-fade-in"
          style={{
            position: 'absolute',
            top: '68px',
            left: 0,
            right: 0,
            backgroundColor: 'var(--color-bg-surface)',
            borderBottom: '1px solid var(--color-border-subtle)',
            padding: 'var(--space-4) var(--space-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            boxShadow: 'var(--elevation-modal)',
          }}
        >
          <NavLink to="/books" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
            Explore Catalog
          </NavLink>

          {isPatron && (
            <>
              <NavLink
                to="/my-loans"
                className="nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                My Active Loans {user ? `(${user.activeBorrowCount}/5)` : ''}
              </NavLink>
              <NavLink
                to="/my-history"
                className="nav-link"
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
                className="nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/admin/books"
                className="nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Manage Books
              </NavLink>
              <NavLink
                to="/admin/users"
                className="nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                User Directory
              </NavLink>
              <NavLink
                to="/admin/circulation"
                className="nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Circulation
              </NavLink>
              <NavLink
                to="/admin/audit-logs"
                className="nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Audit Logs
              </NavLink>
            </>
          )}

          <div
            style={{
              marginTop: 'var(--space-3)',
              paddingTop: 'var(--space-3)',
              borderTop: '1px solid var(--color-border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
            }}
          >
            {isAuthenticated && user ? (
              <>
                <Link to="/profile" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
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
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Link to="/login" style={{ flex: 1 }} onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="secondary" size="sm" style={{ width: '100%' }}>
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" style={{ flex: 1 }} onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" style={{ width: '100%' }}>
                    Join
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
