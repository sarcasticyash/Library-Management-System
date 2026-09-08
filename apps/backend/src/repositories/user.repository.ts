/**
 * Cloud-Native Library Management System (LMS)
 * User Repository Implementation
 *
 * Governed by Phase 3 Section 7.1 and Phase 4 Section 4.4.
 */

import { ClientSession } from 'mongoose';
import { IUserRepository, UserStatusCounts } from './user.repository.interface';
import { UserDocument, UserModel } from '../models/user.model';
import { IUser, UserStatus } from '../types/user.types';
import { MAX_ACTIVE_LOANS_PER_PATRON } from '../types/constants';

export class UserRepository implements IUserRepository {
  private toDomain(doc: UserDocument): IUser {
    return {
      id: doc._id.toString(),
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      passwordHash: doc.passwordHash,
      role: doc.role,
      status: doc.status,
      activeBorrowCount: doc.activeBorrowCount,
      phoneNumber: doc.phoneNumber,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  public async findById(id: string, session?: ClientSession): Promise<IUser | null> {
    const doc = await UserModel.findById(id).session(session || null);
    return doc ? this.toDomain(doc) : null;
  }

  public async findByEmail(email: string, session?: ClientSession): Promise<IUser | null> {
    const doc = await UserModel.findOne({
      email: email.toLowerCase().trim(),
    }).session(session || null);
    return doc ? this.toDomain(doc) : null;
  }

  public async create(
    userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>,
    session?: ClientSession,
  ): Promise<IUser> {
    const [created] = await UserModel.create([userData], { session });
    if (!created) {
      throw new Error('Failed to create user record');
    }
    return this.toDomain(created);
  }

  public async updatePassword(
    id: string,
    passwordHash: string,
    session?: ClientSession,
  ): Promise<boolean> {
    const res = await UserModel.updateOne({ _id: id }, { $set: { passwordHash } }).session(
      session || null,
    );
    return res.matchedCount > 0;
  }

  public async updateStatus(
    id: string,
    status: UserStatus,
    session?: ClientSession,
  ): Promise<IUser | null> {
    const doc = await UserModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, session: session || null },
    );
    return doc ? this.toDomain(doc) : null;
  }

  /**
   * Concurrency-safe atomic increment of activeBorrowCount with quota floor/ceiling check.
   * Enforces Invariant INV-04: activeBorrowCount < 5.
   */
  public async incrementActiveBorrowCount(id: string, session?: ClientSession): Promise<boolean> {
    const res = await UserModel.updateOne(
      {
        _id: id,
        activeBorrowCount: { $lt: MAX_ACTIVE_LOANS_PER_PATRON },
        status: UserStatus.ACTIVE,
      },
      { $inc: { activeBorrowCount: 1 } },
    ).session(session || null);

    return res.modifiedCount > 0;
  }

  /**
   * Concurrency-safe atomic decrement of activeBorrowCount with floor guard (min 0).
   */
  public async decrementActiveBorrowCount(id: string, session?: ClientSession): Promise<boolean> {
    const res = await UserModel.updateOne(
      { _id: id, activeBorrowCount: { $gt: 0 } },
      { $inc: { activeBorrowCount: -1 } },
    ).session(session || null);

    return res.modifiedCount > 0;
  }

  public async countUsersByStatus(): Promise<UserStatusCounts> {
    const [active, suspended, total] = await Promise.all([
      UserModel.countDocuments({ status: UserStatus.ACTIVE }),
      UserModel.countDocuments({ status: UserStatus.SUSPENDED }),
      UserModel.countDocuments({}),
    ]);

    return { total, active, suspended };
  }
}

export const userRepository: IUserRepository = new UserRepository();
