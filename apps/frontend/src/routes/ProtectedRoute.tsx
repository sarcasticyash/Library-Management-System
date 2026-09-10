import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner message="Authenticating session..." size={36} />;
  }

  if (!isAuthenticated) {
    const currentPath = `${location.pathname}${location.search}`;
    const safeTarget =
      currentPath && !currentPath.startsWith('/login')
        ? `?redirect=${encodeURIComponent(currentPath)}`
        : '';
    return <Navigate to={`/login${safeTarget}`} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
