import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { getSafeRedirectDestination } from '../utils/redirect.util';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { LandingPage } from '../pages/public/LandingPage';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import { RoleRoute } from '../routes/RoleRoute';
import { GuestOnlyRoute } from '../routes/GuestOnlyRoute';
import { AuthContext, AuthContextValue } from '../store/auth.context.type';
import { UserRole, UserStatus } from '../types/user';

vi.mock('../components/ui/ThreeBookCanvas', () => ({
  ThreeBookCanvas: () => <div data-testid="mock-3d-canvas" />,
}));

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

  it('hides Header navbar dock on /login and /register routes in AppLayout', () => {
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

    const renderWithRoute = (initialPath: string) =>
      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <AuthContext.Provider value={mockAuth}>
            <MemoryRouter initialEntries={[initialPath]}>
              <Routes>
                <Route path="/" element={<AppLayout />}>
                  <Route path="login" element={<div>Login Page Content</div>} />
                  <Route path="register" element={<div>Register Page Content</div>} />
                  <Route path="books" element={<div>Books Page Content</div>} />
                </Route>
              </Routes>
            </MemoryRouter>
          </AuthContext.Provider>
        </QueryClientProvider>,
      );

    // 1. Header dock is hidden on /login
    const loginResult = renderWithRoute('/login');
    expect(screen.getByText('Login Page Content')).toBeInTheDocument();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Main Navigation')).not.toBeInTheDocument();
    loginResult.unmount();

    // 2. Header dock is hidden on /register
    const registerResult = renderWithRoute('/register');
    expect(screen.getByText('Register Page Content')).toBeInTheDocument();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Main Navigation')).not.toBeInTheDocument();
    registerResult.unmount();

    // 3. Header dock IS present on /books
    renderWithRoute('/books');
    expect(screen.getByText('Books Page Content')).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByLabelText('Main Navigation')).toBeInTheDocument();
  });

  describe('getSafeRedirectDestination', () => {
    it('prevents redirect loop if target is /login or /register', () => {
      expect(getSafeRedirectDestination('/login', UserRole.ADMIN)).toBe('/admin/dashboard');
      expect(getSafeRedirectDestination('/login?redirect=%2Flogin', UserRole.PATRON)).toBe(
        '/books',
      );
      expect(getSafeRedirectDestination('/register', UserRole.ADMIN)).toBe('/admin/dashboard');
      expect(getSafeRedirectDestination('/forbidden', UserRole.ADMIN)).toBe('/admin/dashboard');
    });

    it('defaults to role dashboard when redirect is null or empty', () => {
      expect(getSafeRedirectDestination(null, UserRole.ADMIN)).toBe('/admin/dashboard');
      expect(getSafeRedirectDestination('', UserRole.ADMIN)).toBe('/admin/dashboard');
      expect(getSafeRedirectDestination('/', UserRole.ADMIN)).toBe('/admin/dashboard');
      expect(getSafeRedirectDestination(null, UserRole.PATRON)).toBe('/books');
      expect(getSafeRedirectDestination('', UserRole.PATRON)).toBe('/books');
    });

    it('prevents non-admin users from being redirected to /admin routes', () => {
      expect(getSafeRedirectDestination('/admin/dashboard', UserRole.PATRON)).toBe('/books');
      expect(getSafeRedirectDestination('/admin/circulation', UserRole.PATRON)).toBe('/books');
    });

    it('prevents admin users from being redirected to patron-only loan routes', () => {
      expect(getSafeRedirectDestination('/my-loans', UserRole.ADMIN)).toBe('/admin/dashboard');
      expect(getSafeRedirectDestination('/loans/active', UserRole.ADMIN)).toBe('/admin/dashboard');
    });

    it('allows valid safe deep links for appropriate roles', () => {
      expect(getSafeRedirectDestination('/books/123', UserRole.PATRON)).toBe('/books/123');
      expect(getSafeRedirectDestination('/profile', UserRole.PATRON)).toBe('/profile');
      expect(getSafeRedirectDestination('/admin/books', UserRole.ADMIN)).toBe('/admin/books');
    });
  });

  it('does not render demo login chips on login page for a clean production presentation', () => {
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

    expect(screen.queryByText(/Demo Scholar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Chief Librarian/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Super Admin/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Instant Scholar Credentials/i)).not.toBeInTheDocument();
  });

  describe('LandingPage Demo Visibility', () => {
    it('shows Try Free Demo and Launch Live Demo Now buttons for unauthenticated guests', () => {
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
              <LandingPage />
            </MemoryRouter>
          </AuthContext.Provider>
        </QueryClientProvider>,
      );

      expect(screen.getByText('Try Free Demo')).toBeInTheDocument();
      expect(screen.getByText('Launch Live Demo Now')).toBeInTheDocument();
    });

    it('hides all demo buttons and displays View My Active Loans when a Patron logs in', () => {
      const mockAuth: AuthContextValue = {
        user: {
          id: 'u-patron',
          firstName: 'Sangeeta',
          lastName: 'Devi',
          email: 'sangeeta@iitd.ac.in',
          role: UserRole.PATRON,
          status: UserStatus.ACTIVE,
          activeBorrowCount: 1,
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
        <QueryClientProvider client={createTestQueryClient()}>
          <AuthContext.Provider value={mockAuth}>
            <MemoryRouter>
              <LandingPage />
            </MemoryRouter>
          </AuthContext.Provider>
        </QueryClientProvider>,
      );

      // Demo buttons MUST NOT be visible when authenticated
      expect(screen.queryByText('Try Free Demo')).not.toBeInTheDocument();
      expect(screen.queryByText('Launch Live Demo Now')).not.toBeInTheDocument();

      // Authenticated Patron CTA must be visible
      expect(screen.getByText('View My Active Loans')).toBeInTheDocument();
      expect(screen.getByText(/Explore Catalog/i)).toBeInTheDocument();
    });

    it('hides all demo buttons and displays Enter Admin Console when an Admin logs in', () => {
      const mockAuth: AuthContextValue = {
        user: {
          id: 'u-admin',
          firstName: 'Yash',
          lastName: 'Singh',
          email: 'singhyash0706@gmail.com',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          activeBorrowCount: 0,
          phoneNumber: '+919876543210',
          createdAt: new Date().toISOString(),
        },
        isAuthenticated: true,
        isLoading: false,
        role: UserRole.ADMIN,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshProfile: vi.fn(),
      };

      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <AuthContext.Provider value={mockAuth}>
            <MemoryRouter>
              <LandingPage />
            </MemoryRouter>
          </AuthContext.Provider>
        </QueryClientProvider>,
      );

      // Demo buttons MUST NOT be visible when authenticated
      expect(screen.queryByText('Try Free Demo')).not.toBeInTheDocument();
      expect(screen.queryByText('Launch Live Demo Now')).not.toBeInTheDocument();

      // Authenticated Admin CTA must be visible
      expect(screen.getByText('Enter Admin Console')).toBeInTheDocument();
      expect(screen.getByText(/Explore Catalog/i)).toBeInTheDocument();
    });
  });

  describe('Forgot Password Flow & Credential Recovery', () => {
    it('renders "Forgot password?" link on LoginPage navigating to /forgot-password', () => {
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

      const forgotLink = screen.getByRole('link', { name: /Forgot password\?/i });
      expect(forgotLink).toBeInTheDocument();
      expect(forgotLink).toHaveAttribute('href', '/forgot-password');
    });

    it('renders ForgotPasswordPage in Step 1 (Request) with scholar email input and submit button', () => {
      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <MemoryRouter>
            <ForgotPasswordPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      expect(screen.getByRole('heading', { name: /Reset Scholar Password/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/Registered Scholar Email/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Send Archival Recovery Code/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Sign In to Granthagar/i })).toBeInTheDocument();
    });

    it('completes the interactive recovery flow from token request to password reset success', async () => {
      const user = userEvent.setup();

      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <MemoryRouter>
            <ForgotPasswordPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      // 1. Submit Step 1
      const emailInput = screen.getByLabelText(/Registered Scholar Email/i);
      await user.type(emailInput, 'scholar.test@iitd.ac.in');
      await user.click(screen.getByRole('button', { name: /Send Archival Recovery Code/i }));

      // 2. Advance to Step 2
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /Enter Verification Code/i }),
        ).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/Verification Code \(OTP\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();

      // 3. Fill in new password and submit
      const codeInput = screen.getByLabelText(/Verification Code \(OTP\)/i);
      const newPassInput = screen.getByLabelText('New Password');
      const confirmPassInput = screen.getByLabelText('Confirm New Password');

      await user.clear(codeInput);
      await user.type(codeInput, 'GRANTHA-8821');
      await user.type(newPassInput, 'NewStrongPass123!');
      await user.type(confirmPassInput, 'NewStrongPass123!');

      await user.click(screen.getByRole('button', { name: /Update Password/i }));

      // 4. Advance to Step 3 (Success)
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /Credentials Successfully Updated/i }),
        ).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /Proceed to Sign In/i })).toBeInTheDocument();
    });

    it('AppLayout hides header, footer and circulation HUD on /forgot-password', () => {
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
            <MemoryRouter initialEntries={['/forgot-password']}>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="forgot-password" element={<ForgotPasswordPage />} />
                </Route>
              </Routes>
            </MemoryRouter>
          </AuthContext.Provider>
        </QueryClientProvider>,
      );

      // Public site header elements must not exist
      expect(screen.queryByText(/Explore Collection/i)).not.toBeInTheDocument();
      // Floating circulation corner HUD must not exist
      expect(screen.queryByTestId('floating-hud')).not.toBeInTheDocument();
      // ForgotPasswordPage must be rendered
      expect(screen.getByRole('heading', { name: /Reset Scholar Password/i })).toBeInTheDocument();
    });
  });
});
