/**
 * Cloud-Native Library Management System (LMS)
 * Borrowing Repository Implementation
 *
 * Governed by Phase 3 Section 7.3, Section 10 (Invariants INV-03 to INV-06, DBD-08, DBD-09),
 * and Phase 4 Section 8.
 */

import { ClientSession, Types } from 'mongoose';
import { IBorrowingRepository, CirculationKpiCounts } from './borrowing.repository.interface';
import { BorrowingDocument, BorrowingModel } from '../models/borrowing.model';
import { CirculationStatus, IBorrowing } from '../types/circulation.types';
import { PaginatedResponse, PaginationParams } from '../types/common.types';
import { AdminBorrowingsQueryDto } from '../schemas/circulation.schema';

export class BorrowingRepository implements IBorrowingRepository {
  private toDomain(doc: BorrowingDocument): IBorrowing {
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      bookId: doc.bookId.toString(),
      borrowDate: doc.borrowDate,
      dueDate: doc.dueDate,
      returnDate: doc.returnDate,
      status: doc.status,
      returnedBy: doc.returnedBy,
      adminReturnRemarks: doc.adminReturnRemarks,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  public async findById(id: string, session?: ClientSession): Promise<IBorrowing | null> {
    const doc = await BorrowingModel.findById(id).session(session || null);
    return doc ? this.toDomain(doc) : null;
  }

  /**
   * Fast-fail application pre-check for existing active/overdue loans for this book.
   * Concurrency arbitration is finalized at persistence level by idx_borrowings_active_user_book.
   */
  public async findActiveByUserAndBook(
    userId: string,
    bookId: string,
    session?: ClientSession,
  ): Promise<IBorrowing | null> {
    const doc = await BorrowingModel.findOne({
      userId: new Types.ObjectId(userId),
      bookId: new Types.ObjectId(bookId),
      status: { $in: [CirculationStatus.ACTIVE, CirculationStatus.OVERDUE] },
    }).session(session || null);

    return doc ? this.toDomain(doc) : null;
  }

  public async findActiveByUserId(userId: string, session?: ClientSession): Promise<IBorrowing[]> {
    const docs = await BorrowingModel.find({
      userId: new Types.ObjectId(userId),
      status: { $in: [CirculationStatus.ACTIVE, CirculationStatus.OVERDUE] },
    })
      .sort({ dueDate: 1, _id: 1 })
      .session(session || null)
      .exec();

    return docs.map((doc) => this.toDomain(doc));
  }

  public async findHistoryByUserId(
    userId: string,
    pagination: PaginationParams,
    session?: ClientSession,
  ): Promise<PaginatedResponse<IBorrowing>> {
    const { page, limit } = pagination;
    const filter = { userId: new Types.ObjectId(userId) };
    const skip = (page - 1) * limit;

    const [docs, totalRecords] = await Promise.all([
      BorrowingModel.find(filter)
        .sort({ borrowDate: -1, _id: 1 })
        .skip(skip)
        .limit(limit)
        .session(session || null)
        .exec(),
      BorrowingModel.countDocuments(filter).session(session || null),
    ]);

    const totalPages = Math.ceil(totalRecords / limit) || 1;

    return {
      data: docs.map((doc) => this.toDomain(doc)),
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  public async findAll(
    query: AdminBorrowingsQueryDto,
    session?: ClientSession,
  ): Promise<PaginatedResponse<IBorrowing>> {
    const { status, userId, bookId, page, limit } = query;
    const filter: Record<string, unknown> = {};

    if (status) {
      filter.status = status;
    }

    if (userId) {
      filter.userId = new Types.ObjectId(userId);
    }

    if (bookId) {
      filter.bookId = new Types.ObjectId(bookId);
    }

    const skip = (page - 1) * limit;

    const [docs, totalRecords] = await Promise.all([
      BorrowingModel.find(filter)
        .sort({ borrowDate: -1, _id: 1 })
        .skip(skip)
        .limit(limit)
        .session(session || null)
        .exec(),
      BorrowingModel.countDocuments(filter).session(session || null),
    ]);

    const totalPages = Math.ceil(totalRecords / limit) || 1;

    return {
      data: docs.map((doc) => this.toDomain(doc)),
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  public async create(
    borrowingData: Omit<IBorrowing, 'id' | 'createdAt' | 'updatedAt'>,
    session?: ClientSession,
  ): Promise<IBorrowing> {
    const [created] = await BorrowingModel.create(
      [
        {
          ...borrowingData,
          userId: new Types.ObjectId(borrowingData.userId),
          bookId: new Types.ObjectId(borrowingData.bookId),
        },
      ],
      { session },
    );

    if (!created) {
      throw new Error('Failed to create borrowing record');
    }

    return this.toDomain(created);
  }

  public async markReturned(
    id: string,
    returnDate: Date,
    returnedBy: string,
    adminRemarks?: string | null,
    session?: ClientSession,
  ): Promise<IBorrowing | null> {
    const doc = await BorrowingModel.findOneAndUpdate(
      {
        _id: id,
        status: { $in: [CirculationStatus.ACTIVE, CirculationStatus.OVERDUE] },
      },
      {
        $set: {
          status: CirculationStatus.RETURNED,
          returnDate,
          returnedBy,
          adminReturnRemarks: adminRemarks || null,
        },
      },
      { new: true, session: session || null },
    );

    return doc ? this.toDomain(doc) : null;
  }

  /**
   * Evaluates real-time active and overdue counts adhering strictly to DBD-09.
   * Overdue truth: returnDate === null && dueDate < now.
   */
  public async countActiveAndOverdue(): Promise<CirculationKpiCounts> {
    const now = new Date();

    const [activeLoans, overdueLoans] = await Promise.all([
      BorrowingModel.countDocuments({
        status: { $in: [CirculationStatus.ACTIVE, CirculationStatus.OVERDUE] },
      }),
      BorrowingModel.countDocuments({
        returnDate: null,
        dueDate: { $lt: now },
      }),
    ]);

    return { activeLoans, overdueLoans };
  }

  public async countActiveByUserId(userId: string, session?: ClientSession): Promise<number> {
    return await BorrowingModel.countDocuments({
      userId: new Types.ObjectId(userId),
      status: { $in: [CirculationStatus.ACTIVE, CirculationStatus.OVERDUE] },
    }).session(session || null);
  }
}

export const borrowingRepository: IBorrowingRepository = new BorrowingRepository();
