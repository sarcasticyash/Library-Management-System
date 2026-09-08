import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.on('finish', () => {
    const latencyMs = req.startTime ? Date.now() - req.startTime : 0;
    const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger.log({
      level: logLevel,
      message: `${req.method} ${req.originalUrl} - ${res.statusCode} (${latencyMs}ms)`,
      correlationId: req.correlationId,
      http: {
        method: req.method,
        route: req.originalUrl,
        statusCode: res.statusCode,
        latencyMs,
        clientIp: req.ip || req.socket.remoteAddress,
        userAgent: req.header('user-agent'),
      },
      user: req.user ? { userId: req.user.id, role: req.user.role } : undefined,
    });
  });

  next();
}
