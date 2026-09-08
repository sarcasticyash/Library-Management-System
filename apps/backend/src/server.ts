import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './utils/logger';

const app = createApp();
const server = http.createServer(app);

// Connect to MongoDB
connectDatabase().catch((err: Error) => {
  logger.warn({
    message: `Initial MongoDB connection attempt failed or deferred: ${err.message}`,
    environment: env.NODE_ENV,
  });
});

// Start listening on configured port
server.listen(env.PORT, () => {
  logger.info({
    message: `🚀 LMS Backend API server successfully initialized on port ${env.PORT}`,
    port: env.PORT,
    environment: env.NODE_ENV,
    nodeVersion: process.version,
    canonicalNamespace: '/api/v1',
    pid: process.pid,
  });
});

// Graceful Shutdown Handler (FR-22 / Phase 7 Section 11.2)
let isShuttingDown = false;

function gracefulShutdown(signal: string): void {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  logger.warn({
    message: `Received ${signal}. Initiating graceful shutdown...`,
    signal,
    pid: process.pid,
  });

  // Stop accepting new connections and disconnect database
  server.close(async (err) => {
    if (err) {
      logger.error({
        message: 'Error during HTTP server closure',
        error: err.message,
      });
      process.exit(1);
    }

    try {
      await disconnectDatabase();
    } catch (dbErr) {
      logger.error({
        message: 'Error disconnecting database during shutdown',
        error: dbErr instanceof Error ? dbErr.message : String(dbErr),
      });
    }

    logger.info({
      message: 'HTTP server successfully closed. All in-flight requests drained. Exiting process.',
    });
    process.exit(0);
  });

  // Force shutdown if cleanup takes longer than 10 seconds
  const FORCE_SHUTDOWN_TIMEOUT_MS = 10000;
  setTimeout(() => {
    logger.error({
      message: `Graceful shutdown timed out after ${FORCE_SHUTDOWN_TIMEOUT_MS}ms. Forcing process exit.`,
    });
    process.exit(1);
  }, FORCE_SHUTDOWN_TIMEOUT_MS).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err: Error) => {
  logger.error({
    message: `Uncaught Exception: ${err.message}`,
    error: err.message,
    stack: err.stack,
  });
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error({
    message: `Unhandled Rejection: ${String(reason)}`,
    reason,
  });
  gracefulShutdown('unhandledRejection');
});
