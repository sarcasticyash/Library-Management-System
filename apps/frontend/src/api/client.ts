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

    return Promise.reject(parseProblemDetails(error));
  },
);
