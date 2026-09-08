/**
 * Cloud-Native Library Management System (LMS)
 * MongoDB & Mongoose Connection Manager
 *
 * Governed by Phase 3 (Database Architecture Section 4 & 20),
 * Phase 6 (Security Architecture), Phase 10/12/13 (MADR-10 connection pool safety: maxPoolSize: 20).
 */

import mongoose, { ConnectOptions } from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

/**
 * Strips sensitive credentials from MongoDB connection URI for safe logging.
 * Converts mongodb://user:pass@host/db to mongodb://***:***@host/db.
 */
export function sanitizeMongoUri(rawUri: string): string {
  try {
    // Regex safely handles standard mongodb:// and mongodb+srv:// URIs
    return rawUri.replace(/(mongodb(?:\+srv)?:\/\/)([^:@\s]+):([^@\s]+)@/i, '$1***:***@');
  } catch {
    return 'mongodb://[REDACTED_URI]';
  }
}

/**
 * Mongoose Connection Options.
 * Bounded connection pool (maxPoolSize: 20) guarantees stability across
 * horizontal pod autoscaling (HPA v2) under both Profile A and Profile B.
 */
export const MONGOOSE_CONNECT_OPTIONS: ConnectOptions = {
  maxPoolSize: 20, // Locked per Phase 10, 12, and 13
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4, // IPv4 preference for container network determinism
  autoIndex: env.NODE_ENV !== 'production', // Build indexes automatically in non-production
};

let isConnected = false;

/**
 * Initializes and manages connection lifecycle to MongoDB Atlas / replica set.
 */
export async function connectDatabase(
  customUri?: string,
  options?: ConnectOptions,
): Promise<typeof mongoose> {
  const uri = customUri || env.MONGODB_URI;
  const connectOpts = { ...MONGOOSE_CONNECT_OPTIONS, ...options };

  // Register connection event listeners once
  if (mongoose.connection.listenerCount('connected') === 0) {
    mongoose.connection.on('connected', () => {
      isConnected = true;
      logger.info('MongoDB connection established successfully', {
        sanitizedUri: sanitizeMongoUri(uri),
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        dbName: mongoose.connection.name,
      });
    });

    mongoose.connection.on('error', (err: Error) => {
      isConnected = false;
      logger.error('MongoDB connection encountered an error', {
        errorMessage: err.message,
        errorName: err.name,
      });
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('MongoDB connection lost / disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      logger.info('MongoDB connection re-established');
    });
  }

  try {
    const instance = await mongoose.connect(uri, connectOpts);
    isConnected = true;
    return instance;
  } catch (error) {
    isConnected = false;
    logger.error('Failed to establish initial MongoDB connection', {
      sanitizedUri: sanitizeMongoUri(uri),
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Gracefully disconnects Mongoose during application shutdown.
 */
export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    logger.info('Closing MongoDB connection gracefully...');
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB connection closed cleanly');
  }
}

/**
 * Readiness check inspecting Mongoose driver connection state.
 * readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting.
 */
export function isDatabaseConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}
