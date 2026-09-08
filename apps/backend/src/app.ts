import express, { Application, Router } from 'express';

import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { correlationMiddleware } from './middleware/correlation.middleware';
import { requestLoggerMiddleware } from './middleware/request-logger.middleware';
import { notFoundMiddleware } from './middleware/not-found.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { HealthController } from './controllers/health.controller';
import { routes } from './routes';

export function createApp(apiRoutes: Router = routes): Application {
  const app = express();

  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

  // Phase 1: Security & Global Infrastructure Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));
  app.use(cookieParser());

  // Phase 2: Telemetry & Correlation
  app.use(correlationMiddleware);
  app.use(requestLoggerMiddleware);

  // Direct Liveness Probe (Top-level /healthz for Kubernetes)
  app.get('/healthz', HealthController.getLiveness);

  // Canonical API Routes
  app.use('/api/v1', apiRoutes);

  // 404 Not Found Handler
  app.use(notFoundMiddleware);

  // Centralized RFC 7807 Error Handler
  app.use(errorMiddleware);

  return app;
}
