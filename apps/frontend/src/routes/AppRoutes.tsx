import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { UserRole } from '../types/user';
import { AppLayout } from '../components/layout/AppLayout';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { GuestOnlyRoute } from './GuestOnlyRoute';

// Public Pages (Code Split via React.lazy)
const LandingPage = lazy(() =>
  import('../pages/public/LandingPage').then((m) => ({ default: m.LandingPage })),
);
const CatalogPage = lazy(() =>
  import('../pages/public/CatalogPage').then((m) => ({ default: m.CatalogPage })),
);
const BookDetailPage = lazy(() =>
  import('../pages/public/BookDetailPage').then((m) => ({ default: m.BookDetailPage })),
);

// Auth Pages (Code Split via React.lazy)
const LoginPage = lazy(() =>
  import('../pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('../pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);

// Patron Pages (Code Split via React.lazy)
const ActiveLoansPage = lazy(() =>
  import('../pages/patron/ActiveLoansPage').then((m) => ({ default: m.ActiveLoansPage })),
);
const HistoryPage = lazy(() =>
  import('../pages/patron/HistoryPage').then((m) => ({ default: m.HistoryPage })),
);
const ProfilePage = lazy(() =>
  import('../pages/patron/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);

// Admin Pages (Code Split via React.lazy)
const DashboardPage = lazy(() =>
  import('../pages/admin/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const BookManagePage = lazy(() =>
  import('../pages/admin/BookManagePage').then((m) => ({ default: m.BookManagePage })),
);
const UserManagePage = lazy(() =>
  import('../pages/admin/UserManagePage').then((m) => ({ default: m.UserManagePage })),
);
const CirculationPage = lazy(() =>
  import('../pages/admin/CirculationPage').then((m) => ({ default: m.CirculationPage })),
);
const AuditLogsPage = lazy(() =>
  import('../pages/admin/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage })),
);

// System Pages (Code Split via React.lazy)
const NotFoundPage = lazy(() =>
  import('../pages/system/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);
const ForbiddenPage = lazy(() =>
  import('../pages/system/ForbiddenPage').then((m) => ({ default: m.ForbiddenPage })),
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
          }}
        >
          <LoadingSpinner size={40} />
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<AppLayout />}>
          {/* Public Routes */}
          <Route index element={<LandingPage />} />
          <Route path="books" element={<CatalogPage />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="books/:bookId" element={<BookDetailPage />} />

          {/* Guest Only Routes (Login, Register) */}
          <Route element={<GuestOnlyRoute />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>

          {/* Authenticated Routes (Profile) */}
          <Route element={<ProtectedRoute />}>
            <Route path="profile" element={<ProfilePage />} />

            {/* Patron Specific Routes */}
            <Route element={<RoleRoute requiredRole={UserRole.PATRON} />}>
              <Route path="my-loans" element={<ActiveLoansPage />} />
              <Route path="loans/active" element={<ActiveLoansPage />} />
              <Route path="my-history" element={<HistoryPage />} />
              <Route path="loans/history" element={<HistoryPage />} />
            </Route>

            {/* Administrator Specific Routes */}
            <Route path="admin" element={<RoleRoute requiredRole={UserRole.ADMIN} />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="books" element={<BookManagePage />} />
              <Route path="users" element={<UserManagePage />} />
              <Route path="circulation" element={<CirculationPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
            </Route>
          </Route>

          {/* System Error & Fallback Routes */}
          <Route path="forbidden" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
};
