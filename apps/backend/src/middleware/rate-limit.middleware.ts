/**
 * Cloud-Native Library Management System (LMS)
 * Rate Limiting Middleware
 *
 * Implements sliding-window rate limiting per client IP to safeguard sensitive
 * endpoints (e.g., authentication, session rotation) against brute-force and DoS attacks.
 * Conforms to RFC 7807 problem details using RateLimitExceededError (HTTP 429).
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { RateLimitExceededError } from '../utils/error';

export interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  skipInTest?: boolean;
  keyGenerator?: (req: Request) => string;
}

interface RateLimitRecord {
  timestamps: number[];
}

/**
 * Creates an in-memory sliding-window rate limiter middleware.
 */
export function createRateLimiter(options: RateLimiterOptions = {}): RequestHandler {
  const windowMs = options.windowMs ?? 15 * 60 * 1000; // 15 minutes default
  const max = options.max ?? 100; // 100 requests per window default
  const message =
    options.message ?? 'Too many requests from this IP address, please try again later.';
  const skipInTest = options.skipInTest ?? true;
  const keyGenerator =
    options.keyGenerator ??
    ((req: Request) =>
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      req.socket.remoteAddress ||
      '127.0.0.1');

  const ipStore = new Map<string, RateLimitRecord>();

  // Periodically clean up stale IP entries every 5 minutes to prevent memory leaks
  const cleanupInterval = setInterval(
    () => {
      const now = Date.now();
      for (const [key, record] of ipStore.entries()) {
        record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
        if (record.timestamps.length === 0) {
          ipStore.delete(key);
        }
      }
    },
    5 * 60 * 1000,
  );

  // Unref interval to allow clean process exit in Node.js
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip in test environment if configured and not explicitly forced
    if (skipInTest && process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();

    let record = ipStore.get(key);
    if (!record) {
      record = { timestamps: [] };
      ipStore.set(key, record);
    }

    // Filter out timestamps outside the current sliding window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    const currentRequests = record.timestamps.length;
    const remaining = Math.max(0, max - currentRequests - 1);
    const oldestTimestamp = record.timestamps[0] ?? now;
    const resetTime = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

    // Standard rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTime);

    if (currentRequests >= max) {
      res.setHeader('Retry-After', Math.max(1, resetTime));
      return next(new RateLimitExceededError(message));
    }

    record.timestamps.push(now);
    return next();
  };
}

/**
 * Default rate limiter for sensitive authentication routes.
 */
export const defaultAuthRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skipInTest: true,
});
