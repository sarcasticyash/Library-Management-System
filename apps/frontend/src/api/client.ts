import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { env } from '../config/env';
import { parseProblemDetails } from './errors';
import { RefreshTokenResponseDto } from '../types/auth';

/**
 * In-memory storage for JWT access token.
 * Governed by Phase 5 ADR-FE-02: Zero token storage in localStorage / sessionStorage.
 */
let inMemoryAccessToken: string | null = null;
let onAuthFailureCallback: (() => void) | null = null;

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export function setOnAuthFailure(callback: () => void): void {
  onAuthFailureCallback = callback;
}

/**
 * Generate cryptographically secure or pseudo-random UUID v4 for correlation tracking.
 */
function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Central Axios HTTP Client instance.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: env.API_BASE_URL,
  withCredentials: true, // Required for HttpOnly refreshToken cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Bearer JWT and X-Correlation-ID
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (inMemoryAccessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }

    if (!config.headers['X-Correlation-ID']) {
      config.headers['X-Correlation-ID'] = generateCorrelationId();
    }

    return config;
  },
  (error: unknown) => Promise.reject(parseProblemDetails(error)),
);

// Queue for requests while token is refreshing
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Silent Token Refresh Retry Queue & RFC 7807 normalization
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    const requestUrl = originalRequest?.url ?? '';
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/logout');

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(parseProblemDetails(err)));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Direct call to refresh endpoint
        const refreshBaseUrl = apiClient.defaults.baseURL || env.API_BASE_URL;
        const refreshResponse = await axios.post<RefreshTokenResponseDto>(
          `${refreshBaseUrl}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const newAccessToken = refreshResponse.data.accessToken;
        setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        setAccessToken(null);
        processQueue(refreshErr, null);
        if (onAuthFailureCallback) {
          onAuthFailureCallback();
        }
        return Promise.reject(parseProblemDetails(refreshErr));
      } finally {
        isRefreshing = false;
      }
    }

    // Zero-Downtime Fallback: When backend is offline (Network Error / ECONNREFUSED) or returns 500
    const isServerErrorOrOffline = !error.response || error.response.status === 500;
    if (isServerErrorOrOffline && originalRequest) {
      try {
        const { mockDb } = await import('../mock/mockDb');
        const fallbackRes = await handleMockFallback(originalRequest, mockDb);
        if (fallbackRes) {
          return fallbackRes;
        }
      } catch (mockErr) {
        return Promise.reject(mockErr instanceof Error ? mockErr : parseProblemDetails(error));
      }
    }

    return Promise.reject(parseProblemDetails(error));
  },
);

async function handleMockFallback(
  config: InternalAxiosRequestConfig,
  mockDb: typeof import('../mock/mockDb').mockDb,
) {
  const url = config.url || '';
  const method = (config.method || 'GET').toUpperCase();
  let data: Record<string, unknown> = {};
  try {
    data = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : config.data || {};
  } catch {
    data = (config.data as Record<string, unknown>) || {};
  }
  const params = config.params || {};

  // Auth: Register
  if (url.includes('/auth/register') && method === 'POST') {
    const user = await mockDb.register(data as unknown as import('../types/auth').RegisterUserDto);
    return { data: user, status: 201, statusText: 'Created', headers: {}, config };
  }

  // Auth: Login
  if (url.includes('/auth/login') && method === 'POST') {
    const tokens = await mockDb.login(data as unknown as import('../types/auth').LoginUserDto);
    setAccessToken(tokens.accessToken);
    return { data: tokens, status: 200, statusText: 'OK', headers: {}, config };
  }

  // Auth: Refresh
  if (url.includes('/auth/refresh') && method === 'POST') {
    const tokens = await mockDb.refresh();
    setAccessToken(tokens.accessToken);
    return { data: tokens, status: 200, statusText: 'OK', headers: {}, config };
  }

  // Auth: Forgot Password
  if (url.includes('/auth/forgot-password') && method === 'POST') {
    const result = await mockDb.requestPasswordReset((data.email as string) || '');
    return { data: result, status: 200, statusText: 'OK', headers: {}, config };
  }

  // Auth: Reset Password
  if (url.includes('/auth/reset-password') && method === 'POST') {
    const result = await mockDb.resetPassword(
      (data.email as string) || '',
      (data.newPassword as string) || '',
      (data.code as string) || '',
    );
    return { data: result, status: 200, statusText: 'OK', headers: {}, config };
  }

  // Auth: Logout
  if (url.includes('/auth/logout') && method === 'POST') {
    await mockDb.logout();
    setAccessToken(null);
    return { data: { message: 'Logged out' }, status: 200, statusText: 'OK', headers: {}, config };
  }

  // User Profile
  if (url.includes('/users/profile') && method === 'GET') {
    const session = mockDb.getSession();
    if (!session) throw new Error('Unauthenticated');
    return { data: session, status: 200, statusText: 'OK', headers: {}, config };
  }

  // Books
  if (url.includes('/books')) {
    if (url.includes('/availability')) {
      const match = url.match(/\/books\/([^/]+)\/availability/);
      const bookId = match?.[1] ? decodeURIComponent(match[1]) : '';
      const avail = mockDb.getBookAvailability(bookId);
      return { data: avail, status: 200, statusText: 'OK', headers: {}, config };
    }
    const match = url.match(/\/books\/([^/?]+)$/);
    if (match?.[1] && match[1] !== 'books') {
      const bookId = decodeURIComponent(match[1]);
      const book = mockDb.getBookById(bookId);
      return { data: book, status: 200, statusText: 'OK', headers: {}, config };
    }
    const results = mockDb.searchBooks(params);
    return { data: results, status: 200, statusText: 'OK', headers: {}, config };
  }

  // Circulation
  if (url.includes('/borrowings/my-active') && method === 'GET') {
    const loans = mockDb.getActiveLoans();
    return { data: loans, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (url.includes('/borrowings/my-history') && method === 'GET') {
    return {
      data: {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          totalRecords: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
  }
  if (url.includes('/borrowings') && url.includes('/return') && method === 'POST') {
    const match = url.match(/\/borrowings\/([^/]+)\/return/);
    const loanId = match?.[1] ? decodeURIComponent(match[1]) : '';
    const updated = mockDb.returnBook(loanId);
    return { data: updated, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (url.includes('/borrowings') && method === 'POST') {
    const loan = mockDb.borrowBook(String(data.bookId || ''));
    return { data: loan, status: 201, statusText: 'Created', headers: {}, config };
  }

  // Admin Dashboard KPIs
  if (url.includes('/admin/dashboard/kpis') && method === 'GET') {
    const kpis = mockDb.getDashboardKpis();
    return { data: kpis, status: 200, statusText: 'OK', headers: {}, config };
  }

  return null;
}
