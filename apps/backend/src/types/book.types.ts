/**
 * Cloud-Native Library Management System (LMS)
 * Book Catalog & Inventory Domain Types
 *
 * Governed by Phase 1 (FR-BOOK, FR-ADMIN), Phase 3 (Collection: books),
 * and Phase 4 Section 12.3 & 12.5.
 */

export enum BookGenre {
  FICTION = 'Fiction',
  NON_FICTION = 'Non-Fiction',
  SCIENCE = 'Science',
  TECHNOLOGY = 'Technology',
  COMPUTER_SCIENCE = 'Computer Science',
  SOFTWARE_ENGINEERING = 'Software Engineering',
  HISTORY = 'History',
  PHILOSOPHY = 'Philosophy',
  BIOGRAPHY = 'Biography',
  OTHER = 'Other',
}

export interface IBookLocation {
  aisle: string;
  shelf: string;
}

/**
 * Complete Book catalog domain entity.
 */
export interface IBook {
  id: string;
  title: string;
  author: string;
  isbn: string;
  genre: BookGenre | string;
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

/**
 * Public catalog card summary representation for browsing and search results.
 */
export interface IBookSummary {
  id: string;
  title: string;
  author: string;
  isbn: string;
  genre: BookGenre | string;
  publicationYear: number;
  availableCopies: number;
  totalCopies: number;
  coverImageUrl?: string | null;
}

/**
 * Real-time availability indicator payload per FR-BOOK-004.
 */
export interface IBookAvailability {
  bookId: string;
  isAvailable: boolean;
  availableCopies: number;
  totalCopies: number;
  location: IBookLocation;
}
