import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { AuthController } from '@controllers/auth.controller';
import { UserController } from '@controllers/user.controller';
import { BookController } from '@controllers/book.controller';
import { CirculationController } from '@controllers/circulation.controller';
import { AdminController } from '@controllers/admin.controller';
import { HealthController } from '@controllers/health.controller';
import { IAuthService } from '@services/auth.service.interface';
import { IUserService } from '@services/user.service.interface';
import { ICatalogService } from '@services/catalog.service.interface';
import { ICirculationService } from '@services/circulation.service.interface';
import {
  IAdminBookService,
  IAdminCirculationService,
  IAdminDashboardService,
} from '@services/admin.service.interface';
import { IAuditService } from '@services/audit.service.interface';
import { UserRole, UserStatus } from '@types/user.types';

describe('Controllers Unit Tests', () => {
  const createMockResponse = () => {
    const res = {} as Response;
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.cookie = vi.fn().mockReturnValue(res);
    res.clearCookie = vi.fn().mockReturnValue(res);
    return res;
  };

  const dummyUser = {
    id: 'user-1',
    email: 'user@lms.org',
    role: UserRole.PATRON,
    status: UserStatus.ACTIVE,
  };

  describe('AuthController', () => {
    const mockAuthService: IAuthService = {
      register: vi.fn().mockResolvedValue({ id: 'user-1', email: 'user@lms.org' }),
      login: vi.fn().mockResolvedValue({
        tokens: { accessToken: 'jwt', tokenType: 'Bearer', expiresIn: 900, user: dummyUser },
        rawRefreshToken: 'refresh-token-123',
      }),
      logout: vi.fn().mockResolvedValue(undefined),
      refresh: vi.fn().mockResolvedValue({
        accessToken: 'new-jwt',
        expiresIn: 900,
        rawRefreshToken: 'new-refresh-token',
      }),
    };

    const controller = new AuthController(mockAuthService);

    it('register should respond with HTTP 201 (FR-AUTH-001)', async () => {
      const req = { body: { email: 'user@lms.org' } } as Request;
      const res = createMockResponse();
      const next = vi.fn() as unknown as NextFunction;

      await controller.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-1' }));
    });

    it('login should set HttpOnly refresh cookie and respond with HTTP 200 (FR-AUTH-002)', async () => {
      const req = { body: { email: 'user@lms.org', password: 'Password123!' } } as Request;
      const res = createMockResponse();
      const next = vi.fn() as unknown as NextFunction;

      await controller.login(req, res, next);

      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh-token-123',
        expect.objectContaining({ httpOnly: true, sameSite: 'strict' }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('logout should clear cookie and respond with HTTP 204 (FR-AUTH-003)', async () => {
      const req = { cookies: { refreshToken: 'token' } } as unknown as Request;
      const res = createMockResponse();
      const next = vi.fn() as unknown as NextFunction;

      await controller.logout(req, res, next);

      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.anything());
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it('refresh should rotate cookie and respond with HTTP 200 (FR-AUTH-004)', async () => {
      const req = { cookies: { refreshToken: 'old-token' } } as unknown as Request;
      const res = createMockResponse();
      const next = vi.fn() as unknown as NextFunction;

      await controller.refresh(req, res, next);

      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'new-refresh-token',
        expect.anything(),
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('UserController', () => {
    const mockUserService: IUserService = {
      getProfile: vi.fn().mockResolvedValue(dummyUser),
      changePassword: vi.fn().mockResolvedValue(undefined),
      updateUserStatus: vi.fn().mockResolvedValue(dummyUser),
    };

    const controller = new UserController(mockUserService);

    it('getProfile should respond with HTTP 200 (FR-USER-001)', async () => {
      const req = { user: dummyUser } as Request;
      const res = createMockResponse();
      const next = vi.fn() as unknown as NextFunction;

      await controller.getProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(dummyUser);
    });

    it('changePassword should respond with HTTP 200 (FR-USER-002)', async () => {
      const req = {
        user: dummyUser,
        body: { currentPassword: 'old', newPassword: 'new' },
      } as Request;
      const res = createMockResponse();
      const next = vi.fn() as unknown as NextFunction;

      await controller.changePassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('BookController', () => {
    const mockCatalogService: ICatalogService = {
      searchBooks: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
      getBookById: vi.fn().mockResolvedValue({ id: 'b1', title: 'Book 1' }),
      getBookAvailability: vi.fn().mockResolvedValue({ isAvailable: true, availableCopies: 2 }),
    };

    const controller = new BookController(mockCatalogService);

    it('searchBooks should respond with HTTP 200 (FR-BOOK-001, FR-BOOK-002)', async () => {
      const req = { query: {} } as Request;
      const res = createMockResponse();
      const next = vi.fn() as unknown as NextFunction;

      await controller.searchBooks(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('getBookById should respond with HTTP 200 (FR-BOOK-003)', async () => {
      const req = { params: { bookId: 'b1' } } as unknown as Request;
      const res = createMockResponse();
      const next = vi.fn() as unknown as NextFunction;

      await controller.getBookById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 'b1' }));
    });

    it('getBookAvailability should respond with HTTP 200 (FR-BOOK-004)', async () => {
      const req = { params: { bookId: 'b1' } } as unknown as Request;
      const res = createMockResponse();
      const next = vi.fn() as unknown as NextFunction;

      await controller.getBookAvailability(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ isAvailable: true }));
    });
  });

  describe('CirculationController', () => {
    const mockCirculationService: ICirculationService = {
      borrowBook: vi.fn().mockResolvedValue({ id: 'loan-1', status: 'ACTIVE' }),
      returnBook: vi.fn().mockResolvedValue({ id: 'loan-1', status: 'RETURNED' }),
      getActiveLoans: vi.fn().mockResolvedValue({ data: [], totalActiveLoans: 0 }),
      getBorrowingHistory: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
    };

    const controller = new CirculationController(mockCirculationService);

    it('borrowBook should respond with HTTP 201 (FR-BORROW-001)', async () => {
      const req = { user: dummyUser, body: { bookId: 'b1' } } as Request;
      const res = createMockResponse();
      const next = vi.fn() as unknown as NextFunction;

      await controller.borrowBook(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('returnBook should respond with HTTP 200 (FR-BORROW-002)', async () => {
      const req = { user: dummyUser, params: { borrowingId: 'l1' } } as unknown as Request;
      const res = createMockResponse();
      const next = vi.fn() as unknown as NextFunction;

      await controller.returnBook(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('getActiveLoans should respond with HTTP 200 (FR-BORROW-003)', async () => {
      const req = { user: dummyUser } as Request;
      const res = createMockResponse();
      const next = vi.fn() as unknown as NextFunction;

      await controller.getActiveLoans(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('getBorrowingHistory should respond with HTTP 200 (FR-BORROW-004)', async () => {
      const req = { user: dummyUser, query: {} } as Request;
      const res = createMockResponse();
      const next = vi.fn() as unknown as NextFunction;

      await controller.getBorrowingHistory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('AdminController', () => {
    const mockAdminService: IAdminBookService & IAdminCirculationService & IAdminDashboardService =
      {
        createBook: vi.fn().mockResolvedValue({ id: 'b1' }),
        updateBook: vi.fn().mockResolvedValue({ id: 'b1' }),
        deactivateBook: vi
          .fn()
          .mockResolvedValue({ id: 'b1', isDeleted: true, updatedAt: new Date() }),
        getAllBorrowings: vi.fn().mockResolvedValue({ data: [] }),
        adminReturnOverride: vi.fn().mockResolvedValue({ id: 'l1', status: 'RETURNED' }),
        getDashboardKpis: vi.fn().mockResolvedValue({ catalog: {}, circulation: {}, users: {} }),
      };

    const mockUserService: IUserService = {
      getProfile: vi.fn(),
      changePassword: vi.fn(),
      updateUserStatus: vi.fn().mockResolvedValue({ id: 'u1', status: 'SUSPENDED' }),
    };

    const mockAuditService: IAuditService = {
      logEvent: vi.fn(),
      queryLogs: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
    };

    const adminUser = { ...dummyUser, role: UserRole.ADMIN };
    const controller = new AdminController(mockAdminService, mockUserService, mockAuditService);

    it('getDashboardKpis should respond with HTTP 200 (FR-ADMIN-001)', async () => {
      const req = { user: adminUser } as Request;
      const res = createMockResponse();
      const next = vi.fn() as unknown as NextFunction;

      await controller.getDashboardKpis(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('createBook should respond with HTTP 201 (FR-ADMIN-002)', async () => {
      const req = { user: adminUser, body: {} } as Request;
      const res = createMockResponse();
      const next = vi.fn() as unknown as NextFunction;

      await controller.createBook(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('updateBook should respond with HTTP 200 (FR-ADMIN-003)', async () => {
      const req = { user: adminUser, params: { bookId: 'b1' }, body: {} } as unknown as Request;
      const res = createMockResponse();
      const next = vi.fn() as unknown as NextFunction;

      await controller.updateBook(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deleteBook should respond with HTTP 200 (FR-ADMIN-004)', async () => {
      const req = { user: adminUser, params: { bookId: 'b1' } } as unknown as Request;
      const res = createMockResponse();
      const next = vi.fn() as unknown as NextFunction;

      await controller.deleteBook(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('updateUserStatus should respond with HTTP 200 (FR-ADMIN-005)', async () => {
      const req = {
        user: adminUser,
        params: { userId: 'u1' },
        body: { status: 'SUSPENDED' },
      } as unknown as Request;
      const res = createMockResponse();
      const next = vi.fn() as unknown as NextFunction;

      await controller.updateUserStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('getAllBorrowings should respond with HTTP 200 (FR-ADMIN-006)', async () => {
      const req = { user: adminUser, query: {} } as Request;
      const res = createMockResponse();
      const next = vi.fn() as unknown as NextFunction;

      await controller.getAllBorrowings(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returnOverride should respond with HTTP 200 (FR-ADMIN-007)', async () => {
      const req = {
        user: adminUser,
        params: { borrowingId: 'l1' },
        body: {},
      } as unknown as Request;
      const res = createMockResponse();
      const next = vi.fn() as unknown as NextFunction;

      await controller.returnOverride(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('getAuditLogs should respond with HTTP 200 (FR-ADMIN-008)', async () => {
      const req = { user: adminUser, query: {} } as Request;
      const res = createMockResponse();
      const next = vi.fn() as unknown as NextFunction;

      await controller.getAuditLogs(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should forward unauthenticated errors to next() when req.user is missing', async () => {
      const req = {} as Request;
      const res = createMockResponse();
      const next = vi.fn() as unknown as NextFunction;

      await controller.createBook(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));

      await controller.updateBook(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));

      await controller.deleteBook(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));

      await controller.updateUserStatus(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));

      await controller.returnOverride(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('HealthController', () => {
    it('getLiveness should respond with HTTP 200 UP status', () => {
      const req = {} as Request;
      const res = createMockResponse();

      HealthController.getLiveness(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'UP' }));
    });

    it('getReadiness should respond with HTTP 200 and checks metadata', () => {
      const req = {} as Request;
      const res = createMockResponse();

      HealthController.getReadiness(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'UP',
          service: 'lms-backend',
          checks: expect.any(Object),
        }),
      );
    });

    it('getApiInfo should respond with HTTP 200 and API metadata', () => {
      const req = {} as Request;
      const res = createMockResponse();

      HealthController.getApiInfo(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ONLINE',
          canonicalNamespace: '/api/v1',
        }),
      );
    });
  });
});
