import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function correlationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existingCorrelationId = req.header('X-Correlation-ID') || req.header('X-Request-ID');
  const correlationId =
    existingCorrelationId && typeof existingCorrelationId === 'string'
      ? existingCorrelationId
      : crypto.randomUUID();

  req.correlationId = correlationId;
  req.startTime = Date.now();
  res.setHeader('X-Correlation-ID', correlationId);

  next();
}
