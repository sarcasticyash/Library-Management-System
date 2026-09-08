/**
 * Cloud-Native Library Management System (LMS)
 * Transaction Manager Interface
 *
 * Governed by Phase 3 Decision DBD-02 (Multi-Document ACID Transactions)
 * and Phase 4 Section 10 (Transaction Orchestration Architecture).
 */

import { ClientSession } from 'mongoose';

export interface ITransactionManager {
  /**
   * Starts a new isolated Mongoose / MongoDB ClientSession.
   */
  startSession(): Promise<ClientSession>;

  /**
   * Executes an asynchronous operation inside a Multi-Document ACID Transaction boundary.
   * Handles automatic rollback on rejection and transient write conflict retries.
   *
   * @param operation Callback receiving the active ClientSession
   * @param maxRetries Maximum retry attempts for transient write conflicts (code 112)
   */
  withTransaction<T>(
    operation: (session: ClientSession) => Promise<T>,
    maxRetries?: number,
  ): Promise<T>;
}
