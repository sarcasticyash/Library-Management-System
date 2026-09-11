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
      origin: (requestOrigin, callback) => {
        if (!requestOrigin) return callback(null, true);
        const isAllowed = allowedOrigins.some((o) => o === '*' || o === requestOrigin);
        const isVercel = /\.vercel\.app$/.test(requestOrigin);
        const isLocal = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin);

        if (isAllowed || isVercel || isLocal) {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${requestOrigin}`));
      },
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

  // Root Status & Health Endpoints
  app.get('/', (_req, res) => {
    res.status(200).json({
      service: 'Library Management System API',
      status: 'operational',
      version: '1.0.0',
      endpoints: {
        health: '/healthz',
        api: '/api/v1',
      },
    });
  });

  // Direct Liveness Probe (Top-level /healthz for Kubernetes & Render)
  app.get('/healthz', HealthController.getLiveness);

  // Canonical API Routes
  app.use('/api/v1', apiRoutes);

  // 404 Not Found Handler
  app.use(notFoundMiddleware);

  // Centralized RFC 7807 Error Handler
  app.use(errorMiddleware);

  return app;
}
