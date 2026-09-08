import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CatalogService } from '@services/catalog.service';
import { IBookRepository } from '@repositories/book.repository.interface';
import { IBook, BookGenre } from '@types/book.types';
import { NotFoundError } from '@utils/error';

describe('CatalogService Unit Tests', () => {
  let mockBookRepo: IBookRepository;
  let catalogService: CatalogService;

  const mockBook: IBook = {
    id: '64f1a2b3c4d5e6f7a8b9c0d2',
    title: 'The Pragmatic Programmer',
    author: 'Andrew Hunt, David Thomas',
    isbn: '9780201616224',
    genre: BookGenre.SOFTWARE_ENGINEERING,
    description: 'Your journey to mastery.',
    publisher: 'Addison-Wesley',
    publicationYear: 1999,
    totalCopies: 5,
    availableCopies: 3,
    location: { aisle: 'B-1', shelf: 'S-02' },
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockBookRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findByIsbn: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      decrementAvailableCopies: vi.fn(),
      incrementAvailableCopies: vi.fn(),
      search: vi.fn(),
      countAll: vi.fn(),
      countAvailable: vi.fn(),
    };

    catalogService = new CatalogService(mockBookRepo);
  });

  describe('searchBooks', () => {
    it('should delegate search query to book repository (FR-BOOK-001, FR-BOOK-002)', async () => {
      const paginatedResult = {
        data: [mockBook],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      vi.mocked(mockBookRepo.search).mockResolvedValue(paginatedResult);

      const query = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const,
      };
      const result = await catalogService.searchBooks(query);

      expect(mockBookRepo.search).toHaveBeenCalledWith(query);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.title).toBe('The Pragmatic Programmer');
    });
  });

  describe('getBookById', () => {
    it('should retrieve book details by ID (FR-BOOK-003)', async () => {
      vi.mocked(mockBookRepo.findById).mockResolvedValue(mockBook);

      const book = await catalogService.getBookById(mockBook.id);

      expect(mockBookRepo.findById).toHaveBeenCalledWith(mockBook.id);
      expect(book.id).toBe(mockBook.id);
      expect(book.title).toBe(mockBook.title);
    });

    it('should throw NotFoundError if book does not exist', async () => {
      vi.mocked(mockBookRepo.findById).mockResolvedValue(null);

      await expect(catalogService.getBookById('non-existent-id')).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if book is soft-deleted (BR-004)', async () => {
      const deletedBook = { ...mockBook, isDeleted: true };
      vi.mocked(mockBookRepo.findById).mockResolvedValue(deletedBook);

      await expect(catalogService.getBookById(mockBook.id)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getBookAvailability', () => {
    it('should calculate availability and return location coordinates (FR-BOOK-004, INV-01)', async () => {
      vi.mocked(mockBookRepo.findById).mockResolvedValue(mockBook);

      const availability = await catalogService.getBookAvailability(mockBook.id);

      expect(availability.bookId).toBe(mockBook.id);
      expect(availability.isAvailable).toBe(true);
      expect(availability.availableCopies).toBe(3);
      expect(availability.totalCopies).toBe(5);
      expect(availability.location).toEqual({ aisle: 'B-1', shelf: 'S-02' });
    });

    it('should return isAvailable: false when availableCopies is 0', async () => {
      const outOfStockBook = { ...mockBook, availableCopies: 0 };
      vi.mocked(mockBookRepo.findById).mockResolvedValue(outOfStockBook);

      const availability = await catalogService.getBookAvailability(mockBook.id);

      expect(availability.isAvailable).toBe(false);
      expect(availability.availableCopies).toBe(0);
    });

    it('should throw NotFoundError if book is soft-deleted', async () => {
      const deletedBook = { ...mockBook, isDeleted: true };
      vi.mocked(mockBookRepo.findById).mockResolvedValue(deletedBook);

      await expect(catalogService.getBookAvailability(mockBook.id)).rejects.toThrow(NotFoundError);
    });
  });
});
