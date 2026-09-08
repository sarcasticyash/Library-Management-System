import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActiveLoansPage } from '../pages/patron/ActiveLoansPage';
import { HistoryPage } from '../pages/patron/HistoryPage';
import { circulationApi } from '../api/circulation.api';
import { computeOverdueStatus, CirculationStatus, IActiveLoanItem } from '../types/circulation';

vi.mock('../api/circulation.api', () => ({
  circulationApi: {
    getActiveLoans: vi.fn(),
    returnBook: vi.fn(),
    getBorrowingHistory: vi.fn(),
  },
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

describe('Circulation & Patron Loan Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('correctly calculates dynamic overdue status using computeOverdueStatus (DBD-09)', () => {
    const fixedNow = new Date('2026-09-10T12:00:00.000Z');

    // Future due date (active)
    const activeResult = computeOverdueStatus('2026-09-14T12:00:00.000Z', null, fixedNow);
    expect(activeResult.isOverdue).toBe(false);
    expect(activeResult.daysRemaining).toBe(4);

    // Past due date (overdue)
    const overdueResult = computeOverdueStatus('2026-09-08T12:00:00.000Z', null, fixedNow);
    expect(overdueResult.isOverdue).toBe(true);
    expect(overdueResult.daysRemaining).toBe(-2);

    // Already returned (not overdue)
    const returnedResult = computeOverdueStatus(
      '2026-09-08T12:00:00.000Z',
      '2026-09-07T12:00:00.000Z',
      fixedNow,
    );
    expect(returnedResult.isOverdue).toBe(false);
    expect(returnedResult.daysRemaining).toBe(0);
  });

  it('renders active loans with quota meter and return trigger', async () => {
    const mockLoans: IActiveLoanItem[] = [
      {
        id: 'borrow-1',
        book: {
          id: 'book-1',
          title: 'Clean Architecture',
          author: 'Robert C. Martin',
        },
        borrowDate: new Date(Date.now() - 3 * 86400000).toISOString(),
        dueDate: new Date(Date.now() + 11 * 86400000).toISOString(),
        status: CirculationStatus.ACTIVE,
        isOverdue: false,
        daysRemaining: 11,
      },
    ];

    vi.mocked(circulationApi.getActiveLoans).mockResolvedValue({
      data: mockLoans,
      totalActiveLoans: 1,
    });

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <ActiveLoansPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Clean Architecture')).toBeInTheDocument();
      expect(screen.getByText('by Robert C. Martin')).toBeInTheDocument();
      expect(screen.getByText(/1 \/ 5 Books/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Return Book/i })).toBeInTheDocument();
    });
  });

  it('opens confirmation modal and executes return mutation', async () => {
    const user = userEvent.setup();
    const mockLoans: IActiveLoanItem[] = [
      {
        id: 'borrow-1',
        book: {
          id: 'book-1',
          title: 'Clean Architecture',
          author: 'Robert C. Martin',
        },
        borrowDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
        status: CirculationStatus.ACTIVE,
        isOverdue: false,
        daysRemaining: 14,
      },
    ];

    vi.mocked(circulationApi.getActiveLoans).mockResolvedValue({
      data: mockLoans,
      totalActiveLoans: 1,
    });
    vi.mocked(circulationApi.returnBook).mockResolvedValue({
      id: 'borrow-1',
      userId: 'u-1',
      bookId: 'book-1',
      borrowDate: new Date().toISOString(),
      dueDate: new Date().toISOString(),
      returnDate: new Date().toISOString(),
      status: CirculationStatus.RETURNED,
      returnedBy: 'ROLE_PATRON',
      adminReturnRemarks: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <ActiveLoansPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Clean Architecture')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Return Book/i }));

    expect(screen.getByRole('heading', { name: /Confirm Book Return/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirm Return/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Confirm Return/i }));

    await waitFor(() => {
      expect(circulationApi.returnBook).toHaveBeenCalledWith('borrow-1');
    });
  });

  it('renders historical borrowing archive in data table', async () => {
    vi.mocked(circulationApi.getBorrowingHistory).mockResolvedValue({
      data: [
        {
          id: 'b-tx-001',
          userId: 'u-1',
          bookId: 'book-99',
          borrowDate: '2026-08-01T10:00:00.000Z',
          dueDate: '2026-08-15T10:00:00.000Z',
          returnDate: '2026-08-12T15:00:00.000Z',
          status: CirculationStatus.RETURNED,
          returnedBy: 'ROLE_PATRON',
          adminReturnRemarks: null,
          createdAt: '2026-08-01T10:00:00.000Z',
          updatedAt: '2026-08-12T15:00:00.000Z',
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        totalRecords: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <HistoryPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('book-99')).toBeInTheDocument();
      expect(screen.getByText('RETURNED')).toBeInTheDocument();
    });
  });
});
