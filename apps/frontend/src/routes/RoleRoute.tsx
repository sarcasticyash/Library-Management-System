import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/user';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export interface RoleRouteProps {
  requiredRole: UserRole;
  children?: React.ReactNode;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ requiredRole, children }) => {
  const { user, isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Verifying user authorization..." size={36} />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== requiredRole) {
    return <Navigate to="/forbidden" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
