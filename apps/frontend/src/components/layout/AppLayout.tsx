import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { Sidebar } from './Sidebar';
import { CirculationLedgerCorner } from '../circulation/CirculationLedgerCorner';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAuthRoute =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/forgot-password' ||
    location.pathname.startsWith('/login/') ||
    location.pathname.startsWith('/register/') ||
    location.pathname.startsWith('/forgot-password/');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* WCAG 2.2 AA Skip Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Global Application Header (Hidden on Sign In & Register pages) */}
      {!isAuthRoute && <Header />}

      {/* Content Body */}
      {isAdminRoute ? (
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <Sidebar />
          <main
            id="main-content"
            tabIndex={-1}
            style={{ flex: 1, padding: 'var(--space-6)', overflowY: 'auto' }}
          >
            <Outlet />
          </main>
        </div>
      ) : (
        <main id="main-content" tabIndex={-1} style={{ flex: 1 }}>
          <Outlet />
        </main>
      )}

      {/* Real-Time Circulation Ledger Corner HUD (Available, Borrowed, Status & Days Remaining) */}
      {!isAuthRoute && <CirculationLedgerCorner variant="floating-hud" />}

      {/* Semantic Global Footer (Hidden on Sign In & Register pages) */}
      {!isAuthRoute && <Footer />}
    </div>
  );
};
