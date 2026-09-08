import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/user';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export interface GuestOnlyRouteProps {
  children?: React.ReactNode;
}

export const GuestOnlyRoute: React.FC<GuestOnlyRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Checking session..." size={36} />;
  }

  if (isAuthenticated) {
    const destination = role === UserRole.ADMIN ? '/admin/dashboard' : '/books';
    return <Navigate to={destination} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
