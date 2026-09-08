import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CatalogPage } from '../pages/public/CatalogPage';
import { BookDetailPage } from '../pages/public/BookDetailPage';
import { bookApi } from '../api/book.api';
import { AuthContext, AuthContextValue } from '../store/auth.context.type';
import { BookGenre, IBook, IBookAvailability, IBookSummary } from '../types/book';

vi.mock('../api/book.api', () => ({
  bookApi: {
    searchBooks: vi.fn(),
    getBookById: vi.fn(),
    getBookAvailability: vi.fn(),
  },
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

const mockBooks: IBookSummary[] = [
  {
    id: 'b-1',
    title: 'Clean Architecture',
    author: 'Robert C. Martin',
    isbn: '978-0134494166',
    genre: BookGenre.SOFTWARE_ENGINEERING,
    publicationYear: 2017,
    availableCopies: 3,
    totalCopies: 5,
  },
  {
    id: 'b-2',
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    isbn: '978-1449373320',
    genre: BookGenre.COMPUTER_SCIENCE,
    publicationYear: 2017,
    availableCopies: 0,
    totalCopies: 4,
  },
];

describe('Catalog & Book Discovery Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders book catalog with books and availability badges', async () => {
    vi.mocked(bookApi.searchBooks).mockResolvedValue({
      data: mockBooks,
      pagination: {
        page: 1,
        limit: 12,
        totalRecords: 2,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <CatalogPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Clean Architecture')).toBeInTheDocument();
      expect(screen.getByText('by Robert C. Martin')).toBeInTheDocument();
      expect(screen.getByText('3 available')).toBeInTheDocument();
      expect(screen.getByText('Designing Data-Intensive Applications')).toBeInTheDocument();
      expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    });
  });

  it('displays empty state when catalog search yields zero books', async () => {
    vi.mocked(bookApi.searchBooks).mockResolvedValue({
      data: [],
      pagination: {
        page: 1,
        limit: 12,
        totalRecords: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <CatalogPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/No Books Found/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reset Search Filters/i })).toBeInTheDocument();
    });
  });

  it('displays error alert when catalog API query fails', async () => {
    vi.mocked(bookApi.searchBooks).mockRejectedValue(new Error('Database connection failed'));

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <CatalogPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Catalog Search Failed/i)).toBeInTheDocument();
      expect(screen.getByText(/Database connection failed/i)).toBeInTheDocument();
    });
  });

  it('renders book detail page with shelf location and availability', async () => {
    const fullBook: IBook = {
      id: 'b-1',
      title: 'Clean Architecture',
      author: 'Robert C. Martin',
      isbn: '978-0134494166',
      genre: BookGenre.SOFTWARE_ENGINEERING,
      description: 'A Craftsman Guide to Software Structure and Design',
      publisher: 'Prentice Hall',
      publicationYear: 2017,
      totalCopies: 5,
      availableCopies: 3,
      location: { aisle: 'B3', shelf: '2A' },
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const availability: IBookAvailability = {
      bookId: 'b-1',
      isAvailable: true,
      availableCopies: 3,
      totalCopies: 5,
      location: { aisle: 'B3', shelf: '2A' },
    };

    vi.mocked(bookApi.getBookById).mockResolvedValue(fullBook);
    vi.mocked(bookApi.getBookAvailability).mockResolvedValue(availability);

    const mockAuth: AuthContextValue = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      role: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    };

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <AuthContext.Provider value={mockAuth}>
          <MemoryRouter initialEntries={['/books/b-1']}>
            <Routes>
              <Route path="/books/:bookId" element={<BookDetailPage />} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Clean Architecture' }),
      ).toBeInTheDocument();
      expect(screen.getByText(/Aisle B3, Shelf 2A/i)).toBeInTheDocument();
      expect(screen.getByText('3 Available')).toBeInTheDocument();
      expect(screen.getByText('Sign In to Borrow')).toBeInTheDocument();
    });
  });
});
