import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ProblemDetails } from '../utils/error';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let statusCode = 500;
  let problemDetails: ProblemDetails;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    problemDetails = err.toProblemDetails(req.originalUrl);
  } else if (err instanceof ZodError) {
    statusCode = 400;
    const invalidParams = err.errors.map((e) => ({
      name: e.path.join('.'),
      reason: e.message,
    }));

    problemDetails = {
      type: 'https://api.lms.cloud/errors/ERR-VAL-INVALID-INPUT',
      title: 'Bad Request',
      status: 400,
      detail: 'Request validation failed on one or more parameters.',
      instance: req.originalUrl,
      code: 'ERR-VAL-INVALID-INPUT',
      timestamp: new Date().toISOString(),
      invalidParams,
    };
  } else {
    // Unhandled exception or body parser error (e.g. 413 Payload Too Large)
    const errStatus =
      (err as { status?: number; statusCode?: number }).status ??
      (err as { status?: number; statusCode?: number }).statusCode ??
      500;
    statusCode = errStatus;

    if (statusCode === 413) {
      problemDetails = {
        type: 'https://api.lms.cloud/errors/ERR-REQ-PAYLOAD-TOO-LARGE',
        title: 'Payload Too Large',
        status: 413,
        detail: 'Request payload exceeds maximum allowed size of 100kb.',
        instance: req.originalUrl,
        code: 'ERR-REQ-PAYLOAD-TOO-LARGE',
        timestamp: new Date().toISOString(),
      };
    } else {
      problemDetails = {
        type: 'https://api.lms.cloud/errors/ERR-SYS-INTERNAL-ERROR',
        title: 'Internal Server Error',
        status: 500,
        detail:
          env.NODE_ENV === 'production'
            ? 'An unexpected error occurred. Please contact system support.'
            : err.message || 'Internal Server Error',
        instance: req.originalUrl,
        code: 'ERR-SYS-INTERNAL-ERROR',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Log error with correlation context
  logger.error({
    message: `HTTP ${statusCode} Error on ${req.method} ${req.originalUrl}: ${err.message}`,
    correlationId: req.correlationId,
    stack: env.NODE_ENV === 'production' ? undefined : err.stack,
    problemDetails,
  });

  res.status(statusCode).setHeader('Content-Type', 'application/problem+json').json(problemDetails);
}
