/**
 * Cloud-Native Library Management System (LMS)
 * Book Repository Implementation
 *
 * Governed by Phase 3 Section 7.2, Section 10 (Invariants INV-01, INV-02),
 * and Section 14 (Search Architecture).
 */

import { ClientSession } from 'mongoose';
import { IBookRepository, BookStockCounts } from './book.repository.interface';
import { BookDocument, BookModel } from '../models/book.model';
import { IBook, IBookSummary } from '../types/book.types';
import { PaginatedResponse } from '../types/common.types';
import { BookSearchQueryDto } from '../schemas/book.schema';

export class BookRepository implements IBookRepository {
  private toDomain(doc: BookDocument): IBook {
    return {
      id: doc._id.toString(),
      title: doc.title,
      author: doc.author,
      isbn: doc.isbn,
      genre: doc.genre,
      description: doc.description,
      publisher: doc.publisher,
      publicationYear: doc.publicationYear,
      totalCopies: doc.totalCopies,
      availableCopies: doc.availableCopies,
      location: {
        aisle: doc.location.aisle,
        shelf: doc.location.shelf,
      },
      coverImageUrl: doc.coverImageUrl || null,
      isDeleted: doc.isDeleted,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  private toSummary(doc: BookDocument): IBookSummary {
    return {
      id: doc._id.toString(),
      title: doc.title,
      author: doc.author,
      isbn: doc.isbn,
      genre: doc.genre,
      publicationYear: doc.publicationYear,
      availableCopies: doc.availableCopies,
      totalCopies: doc.totalCopies,
      coverImageUrl: doc.coverImageUrl || null,
    };
  }

  public async findById(id: string, session?: ClientSession): Promise<IBook | null> {
    const doc = await BookModel.findById(id).session(session || null);
    return doc ? this.toDomain(doc) : null;
  }

  public async findByIsbn(isbn: string, session?: ClientSession): Promise<IBook | null> {
    const doc = await BookModel.findOne({
      isbn: isbn.toUpperCase().trim(),
    }).session(session || null);
    return doc ? this.toDomain(doc) : null;
  }

  public async create(
    bookData: Omit<IBook, 'id' | 'createdAt' | 'updatedAt'>,
    session?: ClientSession,
  ): Promise<IBook> {
    const [created] = await BookModel.create([bookData], { session });
    if (!created) {
      throw new Error('Failed to create book record');
    }
    return this.toDomain(created);
  }

  public async update(
    id: string,
    updates: Partial<IBook>,
    session?: ClientSession,
  ): Promise<IBook | null> {
    const doc = await BookModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true, session: session || null },
    );
    return doc ? this.toDomain(doc) : null;
  }

  /**
   * Concurrency-safe atomic decrement of availableCopies.
   * Enforces Invariant INV-01: availableCopies > 0.
   */
  public async decrementAvailableCopies(id: string, session?: ClientSession): Promise<boolean> {
    const res = await BookModel.updateOne(
      {
        _id: id,
        availableCopies: { $gt: 0 },
        isDeleted: false,
      },
      { $inc: { availableCopies: -1 } },
    ).session(session || null);

    return res.modifiedCount > 0;
  }

  /**
   * Concurrency-safe atomic increment of availableCopies with ceiling guard (Invariant INV-02).
   */
  public async incrementAvailableCopies(id: string, session?: ClientSession): Promise<boolean> {
    const res = await BookModel.updateOne(
      {
        _id: id,
        $expr: { $lt: ['$availableCopies', '$totalCopies'] },
      },
      { $inc: { availableCopies: 1 } },
    ).session(session || null);

    return res.modifiedCount > 0;
  }

  public async softDelete(id: string, session?: ClientSession): Promise<boolean> {
    const res = await BookModel.updateOne(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true } },
    ).session(session || null);

    return res.modifiedCount > 0;
  }

  /**
   * Catalog search and faceted filtering query matching Phase 4 Section 13.
   */
  public async search(query: BookSearchQueryDto): Promise<PaginatedResponse<IBookSummary>> {
    const { q, genre, available, sortBy, sortOrder, page, limit } = query;
    const filter: Record<string, unknown> = { isDeleted: false };

    if (q) {
      filter.$text = { $search: q };
    }

    if (genre) {
      filter.genre = genre;
    }

    if (available !== undefined && available) {
      filter.availableCopies = { $gt: 0 };
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    let sortOptions: Record<string, 1 | -1> = {};

    if (q) {
      // Full-text relevance ranking
      sortOptions = { _id: 1 };
    } else {
      sortOptions = { [sortBy]: sortDirection, _id: 1 };
    }

    const skip = (page - 1) * limit;

    const [docs, totalRecords] = await Promise.all([
      BookModel.find(filter).sort(sortOptions).skip(skip).limit(limit).exec(),
      BookModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalRecords / limit) || 1;

    return {
      data: docs.map((doc) => this.toSummary(doc)),
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

  public async countStock(): Promise<BookStockCounts> {
    const result = await BookModel.aggregate<{
      totalTitles: number;
      totalCopies: number;
      availableCopies: number;
    }>([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalTitles: { $sum: 1 },
          totalCopies: { $sum: '$totalCopies' },
          availableCopies: { $sum: '$availableCopies' },
        },
      },
    ]);

    const first = result[0];
    if (!first) {
      return { totalTitles: 0, totalCopies: 0, availableCopies: 0 };
    }

    return {
      totalTitles: first.totalTitles,
      totalCopies: first.totalCopies,
      availableCopies: first.availableCopies,
    };
  }
}

export const bookRepository: IBookRepository = new BookRepository();
