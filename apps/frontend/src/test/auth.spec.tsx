import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from '../pages/auth/LoginPage';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import { RoleRoute } from '../routes/RoleRoute';
import { GuestOnlyRoute } from '../routes/GuestOnlyRoute';
import { AuthContext, AuthContextValue } from '../store/auth.context.type';
import { UserRole, UserStatus } from '../types/user';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

describe('Authentication Flows & Route Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form with email and password fields', () => {
    const mockAuth: AuthContextValue = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      role: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    };

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <AuthContext.Provider value={mockAuth}>
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>,
    );

    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('submits login form and calls login handler', async () => {
    const user = userEvent.setup();
    const loginMock = vi.fn().mockResolvedValue(undefined);

    const mockAuth: AuthContextValue = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      role: null,
      login: loginMock,
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    };

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <AuthContext.Provider value={mockAuth}>
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>,
    );

    await user.type(screen.getByLabelText(/Email Address/i), 'patron@test.com');
    await user.type(screen.getByLabelText(/Password/i), 'ValidPass123!');
    await user.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: 'patron@test.com',
        password: 'ValidPass123!',
      });
    });
  });

  it('displays validation errors on invalid email submission', async () => {
    const user = userEvent.setup();

    const mockAuth: AuthContextValue = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      role: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    };

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <AuthContext.Provider value={mockAuth}>
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>,
    );

    await user.type(screen.getByLabelText(/Email Address/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('ProtectedRoute redirects unauthenticated users to /login', () => {
    const mockAuth: AuthContextValue = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      role: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    };

    render(
      <AuthContext.Provider value={mockAuth}>
        <MemoryRouter initialEntries={['/protected-page']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/protected-page" element={<div>Protected Content</div>} />
            </Route>
            <Route path="/login" element={<div>Login Page Target</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page Target')).toBeInTheDocument();
  });

  it('RoleRoute denies access to non-admin users and redirects to /forbidden', () => {
    const mockAuth: AuthContextValue = {
      user: {
        id: 'u-1',
        firstName: 'Patron',
        lastName: 'User',
        email: 'patron@test.com',
        role: UserRole.PATRON,
        status: UserStatus.ACTIVE,
        activeBorrowCount: 0,
        phoneNumber: null,
        createdAt: new Date().toISOString(),
      },
      isAuthenticated: true,
      isLoading: false,
      role: UserRole.PATRON,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    };

    render(
      <AuthContext.Provider value={mockAuth}>
        <MemoryRouter initialEntries={['/admin/secret']}>
          <Routes>
            <Route element={<RoleRoute requiredRole={UserRole.ADMIN} />}>
              <Route path="/admin/secret" element={<div>Admin Secret</div>} />
            </Route>
            <Route path="/forbidden" element={<div>Forbidden 403 Target</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(screen.queryByText('Admin Secret')).not.toBeInTheDocument();
    expect(screen.getByText('Forbidden 403 Target')).toBeInTheDocument();
  });

  it('GuestOnlyRoute redirects authenticated users away from login', () => {
    const mockAuth: AuthContextValue = {
      user: {
        id: 'u-1',
        firstName: 'Patron',
        lastName: 'User',
        email: 'patron@test.com',
        role: UserRole.PATRON,
        status: UserStatus.ACTIVE,
        activeBorrowCount: 0,
        phoneNumber: null,
        createdAt: new Date().toISOString(),
      },
      isAuthenticated: true,
      isLoading: false,
      role: UserRole.PATRON,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    };

    render(
      <AuthContext.Provider value={mockAuth}>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route element={<GuestOnlyRoute />}>
              <Route path="/login" element={<div>Login Form</div>} />
            </Route>
            <Route path="/books" element={<div>Books Catalog Destination</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(screen.queryByText('Login Form')).not.toBeInTheDocument();
    expect(screen.getByText('Books Catalog Destination')).toBeInTheDocument();
  });
});
