/**
 * Cloud-Native Library Management System (LMS)
 * Book Persistence Model & Schema
 *
 * Governed by Phase 3 Section 7.2 (Collection: books), Section 10 (Invariants INV-01, INV-02),
 * and Section 13 (Indexes).
 */

import { Schema, model, Document, Model } from 'mongoose';
import { IBookLocation } from '../types/book.types';

export interface BookDocument extends Document {
  title: string;
  author: string;
  isbn: string;
  genre: string;
  description: string;
  publisher: string;
  publicationYear: number;
  totalCopies: number;
  availableCopies: number;
  location: IBookLocation;
  coverImageUrl?: string | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSubSchema = new Schema<IBookLocation>(
  {
    aisle: {
      type: String,
      required: [true, 'Aisle coordinate is required'],
      trim: true,
      maxlength: [30, 'Aisle coordinate cannot exceed 30 characters'],
    },
    shelf: {
      type: String,
      required: [true, 'Shelf coordinate is required'],
      trim: true,
      maxlength: [30, 'Shelf coordinate cannot exceed 30 characters'],
    },
  },
  { _id: false },
);

export const BookSchema = new Schema<BookDocument>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [1, 'Title cannot be empty'],
      maxlength: [255, 'Title cannot exceed 255 characters'],
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
      minlength: [1, 'Author cannot be empty'],
      maxlength: [150, 'Author cannot exceed 150 characters'],
    },
    isbn: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    genre: {
      type: String,
      required: [true, 'Genre is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    publisher: {
      type: String,
      required: [true, 'Publisher is required'],
      trim: true,
      maxlength: [100, 'Publisher cannot exceed 100 characters'],
    },
    publicationYear: {
      type: Number,
      required: [true, 'Publication year is required'],
      min: [1000, 'Publication year must be at least 1000'],
      validate: {
        validator: Number.isInteger,
        message: 'Publication year must be an integer',
      },
    },
    totalCopies: {
      type: Number,
      required: [true, 'Total copies is required'],
      min: [1, 'Total copies must be at least 1'],
      max: [1000, 'Total copies cannot exceed 1000'],
      validate: {
        validator: Number.isInteger,
        message: 'Total copies must be an integer',
      },
    },
    availableCopies: {
      type: Number,
      required: [true, 'Available copies is required'],
      min: [0, 'Available copies cannot be negative (Invariant INV-01)'],
    },
    location: {
      type: LocationSubSchema,
      required: [true, 'Shelf location coordinates are required'],
    },
    coverImageUrl: {
      type: String,
      default: null,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'books',
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Invariant INV-02: availableCopies <= totalCopies & integer check
BookSchema.path('availableCopies').validate(function (this: unknown, val: number): boolean {
  if (!Number.isInteger(val)) {
    return false;
  }
  const doc = this as { totalCopies?: number };
  if (doc && doc.totalCopies !== undefined && doc.totalCopies !== null) {
    return val <= doc.totalCopies;
  }
  return true;
}, 'Available copies must be an integer and cannot exceed total copies (Invariant INV-02)');

// Indexes per Phase 3 Section 13 & 14
BookSchema.index(
  { title: 'text', author: 'text', description: 'text' },
  {
    name: 'idx_books_text_search',
    weights: { title: 10, author: 5, description: 1 },
  },
);

BookSchema.index({ genre: 1, availableCopies: 1, isDeleted: 1 }, { name: 'idx_books_genre_avail' });

BookSchema.index({ publicationYear: -1 }, { name: 'idx_books_pub_year' });

export const BookModel: Model<BookDocument> = model<BookDocument>('Book', BookSchema);
