/**
 * Cloud-Native Library Management System (LMS)
 * Borrowing Repository Interface
 *
 * Governed by Phase 3 Section 7.3 and Phase 4 Section 4.4.
 */

import { ClientSession } from 'mongoose';
import { IBorrowing } from '../types/circulation.types';
import { PaginatedResponse, PaginationParams } from '../types/common.types';
import { AdminBorrowingsQueryDto } from '../schemas/circulation.schema';

export interface CirculationKpiCounts {
  activeLoans: number;
  overdueLoans: number;
}

export interface IBorrowingRepository {
  findById(id: string, session?: ClientSession): Promise<IBorrowing | null>;
  findActiveByUserAndBook(
    userId: string,
    bookId: string,
    session?: ClientSession,
  ): Promise<IBorrowing | null>;
  findActiveByUserId(userId: string, session?: ClientSession): Promise<IBorrowing[]>;
  findHistoryByUserId(
    userId: string,
    pagination: PaginationParams,
    session?: ClientSession,
  ): Promise<PaginatedResponse<IBorrowing>>;
  findAll(
    query: AdminBorrowingsQueryDto,
    session?: ClientSession,
  ): Promise<PaginatedResponse<IBorrowing>>;
  create(
    borrowingData: Omit<IBorrowing, 'id' | 'createdAt' | 'updatedAt'>,
    session?: ClientSession,
  ): Promise<IBorrowing>;
  markReturned(
    id: string,
    returnDate: Date,
    returnedBy: string,
    adminRemarks?: string | null,
    session?: ClientSession,
  ): Promise<IBorrowing | null>;
  countActiveAndOverdue(): Promise<CirculationKpiCounts>;
  countActiveByUserId(userId: string, session?: ClientSession): Promise<number>;
}
