import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from '../pages/admin/DashboardPage';
import { CirculationPage } from '../pages/admin/CirculationPage';
import { AuditLogsPage } from '../pages/admin/AuditLogsPage';
import { adminApi } from '../api/admin.api';
import { IDashboardKpis } from '../types/dashboard';
import { CirculationStatus } from '../types/circulation';

vi.mock('../api/admin.api', () => ({
  adminApi: {
    getDashboardKpis: vi.fn(),
    getAllBorrowings: vi.fn(),
    returnOverride: vi.fn(),
    getAuditLogs: vi.fn(),
  },
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

describe('Administrative Console Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders executive operational dashboard with live KPI values', async () => {
    const mockKpis: IDashboardKpis = {
      catalog: {
        totalTitles: 142,
        totalCopies: 580,
        availableCopies: 412,
      },
      circulation: {
        activeLoans: 168,
        overdueLoans: 9,
      },
      users: {
        totalRegisteredUsers: 450,
        activePatrons: 438,
        suspendedPatrons: 12,
      },
      calculatedAt: '2026-09-08T18:00:00.000Z',
    };

    vi.mocked(adminApi.getDashboardKpis).mockResolvedValue(mockKpis);

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('142')).toBeInTheDocument();
      expect(screen.getByText('580')).toBeInTheDocument();
      expect(screen.getByText('412')).toBeInTheDocument();
      expect(screen.getByText('168')).toBeInTheDocument();
      expect(screen.getByText('9')).toBeInTheDocument();
      expect(screen.getByText('450')).toBeInTheDocument();
    });
  });

  it('renders global circulation oversight roster and opens staff override modal', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.getAllBorrowings).mockResolvedValue({
      data: [
        {
          id: 'loan-xyz-123',
          userId: 'usr-456',
          bookId: 'book-789',
          borrowDate: '2026-09-01T10:00:00.000Z',
          dueDate: '2026-09-15T10:00:00.000Z',
          returnDate: null,
          status: CirculationStatus.ACTIVE,
          returnedBy: null,
          adminReturnRemarks: null,
          createdAt: '2026-09-01T10:00:00.000Z',
          updatedAt: '2026-09-01T10:00:00.000Z',
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
          <CirculationPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('usr-456')).toBeInTheDocument();
      expect(screen.getByText('book-789')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Staff Override/i }));

    expect(
      screen.getByRole('heading', { name: /Execute Staff Return Override/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Execute Staff Return/i })).toBeInTheDocument();
  });

  it('renders system audit log ledger with expandable diff viewer', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue({
      data: [
        {
          id: 'audit-001',
          actorId: 'admin-1',
          actorRole: 'ROLE_ADMIN',
          action: 'BOOK_CREATED',
          entityType: 'BOOK',
          entityId: 'book-100',
          metadata: { title: 'Test Book Title', isbn: '978-1234567890' },
          ipAddress: '192.168.1.50',
          timestamp: '2026-09-08T12:30:00.000Z',
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
          <AuditLogsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('BOOK_CREATED')).toBeInTheDocument();
      expect(screen.getByText('book-100')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.50')).toBeInTheDocument();
    });

    // Click row to expand JSON payload diff
    await user.click(screen.getByText('BOOK_CREATED'));

    await waitFor(() => {
      expect(screen.getByText(/Metadata & Payload Diff:/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Book Title/i)).toBeInTheDocument();
    });
  });
});
