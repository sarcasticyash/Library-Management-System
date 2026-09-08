/**
 * Cloud-Native Library Management System (LMS)
 * User Repository Interface
 *
 * Governed by Phase 3 Section 7.1 and Phase 4 Section 4.4.
 */

import { ClientSession } from 'mongoose';
import { IUser, UserStatus } from '../types/user.types';

export interface UserStatusCounts {
  total: number;
  active: number;
  suspended: number;
}

export interface IUserRepository {
  findById(id: string, session?: ClientSession): Promise<IUser | null>;
  findByEmail(email: string, session?: ClientSession): Promise<IUser | null>;
  create(
    userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>,
    session?: ClientSession,
  ): Promise<IUser>;
  updatePassword(id: string, passwordHash: string, session?: ClientSession): Promise<boolean>;
  updateStatus(id: string, status: UserStatus, session?: ClientSession): Promise<IUser | null>;
  incrementActiveBorrowCount(id: string, session?: ClientSession): Promise<boolean>;
  decrementActiveBorrowCount(id: string, session?: ClientSession): Promise<boolean>;
  countUsersByStatus(): Promise<UserStatusCounts>;
}
