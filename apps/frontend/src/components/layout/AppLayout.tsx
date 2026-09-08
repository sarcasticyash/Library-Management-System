import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* WCAG 2.2 AA Skip Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Global Application Header */}
      <Header />

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

      {/* Semantic Global Footer */}
      <Footer />
    </div>
  );
};
