import winston from 'winston';
import { env } from '../config/env';

// List of sensitive field names to scrub from structured log metadata
const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'secret',
  'cookie',
  'credential',
  'credentials',
]);

/**
 * Recursively sanitizes sensitive fields in-place to preserve Winston Symbol properties
 */
function sanitizeInPlace(obj: unknown): void {
  if (!obj || typeof obj !== 'object') {
    return;
  }

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'string') {
        obj[i] = (obj[i] as string).replace(
          /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
          'Bearer [REDACTED]',
        );
      } else if (typeof obj[i] === 'object') {
        sanitizeInPlace(obj[i]);
      }
    }
    return;
  }

  const record = obj as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      record[key] = '[REDACTED]';
    } else if (typeof record[key] === 'string') {
      record[key] = (record[key] as string).replace(
        /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
        'Bearer [REDACTED]',
      );
    } else if (typeof record[key] === 'object') {
      sanitizeInPlace(record[key]);
    }
  }
}

// Custom Winston formatter to scrub sensitive fields
const redactSensitiveData = winston.format((info) => {
  sanitizeInPlace(info);
  return info;
});

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  defaultMeta: {
    service: 'lms-backend',
    environment: env.NODE_ENV,
  },
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    redactSensitiveData(),
    winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
});

export default logger;
