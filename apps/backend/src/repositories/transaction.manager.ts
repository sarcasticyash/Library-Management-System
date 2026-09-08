/**
 * Cloud-Native Library Management System (LMS)
 * Mongoose Transaction Manager Implementation
 *
 * Governed by Phase 3 Decision DBD-02, Phase 4 Section 8.3 & Section 10.
 */

import mongoose, { ClientSession } from 'mongoose';
import { ITransactionManager } from './transaction.manager.interface';
import { logger } from '../utils/logger';

export class MongooseTransactionManager implements ITransactionManager {
  /**
   * Starts a new MongoDB client session.
   */
  public async startSession(): Promise<ClientSession> {
    return await mongoose.startSession();
  }

  /**
   * Executes an operation within a multi-document ACID transaction with automatic retries
   * on transient write conflict (code 112 / TransientTransactionError).
   */
  public async withTransaction<T>(
    operation: (session: ClientSession) => Promise<T>,
    maxRetries = 3,
  ): Promise<T> {
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;
      const session = await this.startSession();

      try {
        let result: T | undefined;

        await session.withTransaction(async (activeSession) => {
          result = await operation(activeSession);
        });

        if (result === undefined) {
          throw new Error('Transaction completed without returning a result');
        }

        return result;
      } catch (error: unknown) {
        const isTransient = this.isTransientConflict(error);

        if (isTransient && attempt < maxRetries) {
          logger.warn(
            `Transient transaction conflict encountered (attempt ${attempt}/${maxRetries}). Retrying...`,
            { error: error instanceof Error ? error.message : String(error) },
          );
          // Exponential backoff before retry: 50ms, 100ms, 200ms
          await new Promise((resolve) => setTimeout(resolve, 50 * Math.pow(2, attempt - 1)));
          continue;
        }

        throw error;
      } finally {
        await session.endSession();
      }
    }

    throw new Error(`Transaction failed after ${maxRetries} retry attempts`);
  }

  /**
   * Determines if an error is a transient write conflict (code 112) or transient network issue.
   */
  private isTransientConflict(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const err = error as Record<string, unknown>;

    // MongoDB error code 112 = WriteConflict
    if (err.code === 112 || err.codeName === 'WriteConflict') {
      return true;
    }

    // MongoDB driver error labels
    if (Array.isArray(err.errorLabels) && err.errorLabels.includes('TransientTransactionError')) {
      return true;
    }

    return false;
  }
}

export const transactionManager: ITransactionManager = new MongooseTransactionManager();
