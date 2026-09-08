import { Request, Response } from 'express';
import { env } from '../config/env';
import { isDatabaseConnected } from '../config/database';

export class HealthController {
  /**
   * Liveness probe: /healthz
   * Lightweight probe for Kubernetes kubelet to verify the container process is alive.
   */
  public static getLiveness(_req: Request, res: Response): void {
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Readiness probe: /api/v1/health
   * Verifies the application is ready to accept incoming user traffic.
   */
  public static getReadiness(_req: Request, res: Response): void {
    const uptimeSeconds = Math.floor(process.uptime());

    res.status(200).json({
      status: 'UP',
      service: 'lms-backend',
      environment: env.NODE_ENV,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      checks: {
        system: 'UP',
        database: isDatabaseConnected() ? 'UP' : 'DOWN',
        memory: {
          rssBytes: process.memoryUsage().rss,
          heapUsedBytes: process.memoryUsage().heapUsed,
        },
      },
    });
  }

  /**
   * API Root info endpoint: /api/v1
   */
  public static getApiInfo(_req: Request, res: Response): void {
    res.status(200).json({
      name: 'Cloud-Native Library Management System API',
      version: '1.0.0',
      canonicalNamespace: '/api/v1',
      documentation: 'https://github.com/cloud-native-lms',
      status: 'ONLINE',
      timestamp: new Date().toISOString(),
    });
  }
}
