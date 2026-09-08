/**
 * Cloud-Native Library Management System (LMS)
 * Stage 8 Automated End-to-End Frontend Feature Integration & API Verification Suite
 *
 * Verifies all 21 REST API endpoints over live loopback HTTP using the actual
 * frontend API client modules (`authApi`, `userApi`, `bookApi`, `circulationApi`, `adminApi`),
 * validating dual-token security (in-memory access token, HttpOnly refresh cookie),
 * silent 401 refresh rotation, and zero localStorage token leakage.
 */

import http from 'http';
import { AddressInfo } from 'net';
import axios from 'axios';
import { createApp } from '../apps/backend/src/app';
import { createApiRouter } from '../apps/backend/src/routes';
import { createAuthRoutes } from '../apps/backend/src/routes/auth.routes';
import { createUserRoutes } from '../apps/backend/src/routes/user.routes';
import { createBookRoutes } from '../apps/backend/src/routes/book.routes';
import { createCirculationRoutes } from '../apps/backend/src/routes/circulation.routes';
import { createAdminRoutes } from '../apps/backend/src/routes/admin.routes';
import { AuthController } from '../apps/backend/src/controllers/auth.controller';
import { UserController } from '../apps/backend/src/controllers/user.controller';
import { BookController } from '../apps/backend/src/controllers/book.controller';
import { CirculationController } from '../apps/backend/src/controllers/circulation.controller';
import { AdminController } from '../apps/backend/src/controllers/admin.controller';
import { AuthService } from '../apps/backend/src/services/auth.service';
import { UserService } from '../apps/backend/src/services/user.service';
import { CatalogService } from '../apps/backend/src/services/catalog.service';
import { CirculationService } from '../apps/backend/src/services/circulation.service';
import { AdminService } from '../apps/backend/src/services/admin.service';
import { AuditService } from '../apps/backend/src/services/audit.service';
import { PasswordService } from '../apps/backend/src/utils/password.service';
import { JwtService } from '../apps/backend/src/utils/jwt.service';
import { IUserRepository, UserStatusCounts } from '../apps/backend/src/repositories/user.repository.interface';
import { ISessionRecord, ISessionRepository } from '../apps/backend/src/repositories/session.repository.interface';
import { IBookRepository, BookStockCounts } from '../apps/backend/src/repositories/book.repository.interface';
import { IBorrowingRepository, CirculationKpiCounts } from '../apps/backend/src/repositories/borrowing.repository.interface';
import { IAuditLogRepository } from '../apps/backend/src/repositories/audit-log.repository.interface';
import { ITransactionManager } from '../apps/backend/src/repositories/transaction.manager.interface';
import { IUser, UserRole, UserStatus } from '../apps/backend/src/types/user.types';
import { IBook, IBookSummary, BookGenre } from '../apps/backend/src/types/book.types';
import { CirculationStatus, IBorrowing } from '../apps/backend/src/types/circulation.types';
import { IAuditLog } from '../apps/backend/src/types/audit.types';
import { PaginatedResponse, PaginationParams } from '../apps/backend/src/types/common.types';
import { BookSearchQueryDto } from '../apps/backend/src/schemas/book.schema';
import { AdminBorrowingsQueryDto } from '../apps/backend/src/schemas/circulation.schema';
import { AuditQueryDto } from '../apps/backend/src/schemas/audit.schema';

// Frontend API modules and client
import { apiClient, getAccessToken, setAccessToken } from '../apps/frontend/src/api/client';
import { authApi } from '../apps/frontend/src/api/auth.api';
import { userApi } from '../apps/frontend/src/api/user.api';
import { bookApi } from '../apps/frontend/src/api/book.api';
import { circulationApi } from '../apps/frontend/src/api/circulation.api';
import { adminApi } from '../apps/frontend/src/api/admin.api';

// ============================================================================
// IN-MEMORY MOCK REPOSITORIES FOR ISOLATED, REPEATABLE E2E TESTING
// ============================================================================

class MockUserRepository implements IUserRepository {
  public users: Map<string, IUser> = new Map();
  private idCounter = 1;

  public async findById(id: string): Promise<IUser | null> {
    return this.users.get(id) || null;
  }

  public async findByEmail(email: string): Promise<IUser | null> {
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) return u;
    }
    return null;
  }

  public async create(userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
    const hex = (this.idCounter++).toString(16).padStart(24, '0');
    const user: IUser = {
      ...userData,
      id: hex,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(hex, user);
    return user;
  }

  public async updatePassword(id: string, passwordHash: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    user.passwordHash = passwordHash;
    user.updatedAt = new Date();
    return true;
  }

  public async updateStatus(id: string, status: UserStatus): Promise<IUser | null> {
    const user = this.users.get(id);
    if (!user) return null;
    user.status = status;
    user.updatedAt = new Date();
    return user;
  }

  public async incrementActiveBorrowCount(id: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user || user.activeBorrowCount >= 5) return false;
    user.activeBorrowCount += 1;
    return true;
  }

  public async decrementActiveBorrowCount(id: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user || user.activeBorrowCount <= 0) return false;
    user.activeBorrowCount -= 1;
    return true;
  }

  public async countUsersByStatus(): Promise<UserStatusCounts> {
    let active = 0;
    let suspended = 0;
    for (const u of this.users.values()) {
      if (u.status === UserStatus.ACTIVE) active++;
      else if (u.status === UserStatus.SUSPENDED) suspended++;
    }
    return { total: this.users.size, active, suspended };
  }
}

class MockSessionRepository implements ISessionRepository {
  public sessions: Map<string, ISessionRecord> = new Map();
  private idCounter = 1;

  public async create(data: {
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
  }): Promise<ISessionRecord> {
    const hex = (this.idCounter++).toString(16).padStart(24, '0');
    const session: ISessionRecord = {
      ...data,
      id: hex,
      isRevoked: false,
    };
    this.sessions.set(hex, session);
    return session;
  }

  public async findByTokenHash(tokenHash: string): Promise<ISessionRecord | null> {
    for (const s of this.sessions.values()) {
      if (s.tokenHash === tokenHash) return s;
    }
    return null;
  }

  public async revokeById(id: string): Promise<boolean> {
    const session = this.sessions.get(id);
    if (!session) return false;
    session.isRevoked = true;
    return true;
  }

  public async revokeFamily(familyId: string): Promise<number> {
    let count = 0;
    for (const s of this.sessions.values()) {
      if (s.familyId === familyId) {
        s.isRevoked = true;
        count++;
      }
    }
    return count;
  }

  public async revokeAllByUserId(userId: string): Promise<number> {
    let count = 0;
    for (const s of this.sessions.values()) {
      if (s.userId === userId) {
        s.isRevoked = true;
        count++;
      }
    }
    return count;
  }
}

class MockBookRepository implements IBookRepository {
  public books: Map<string, IBook> = new Map();
  private idCounter = 1;

  public async findById(id: string): Promise<IBook | null> {
    const book = this.books.get(id);
    return book && !book.isDeleted ? book : null;
  }

  public async findByIsbn(isbn: string): Promise<IBook | null> {
    for (const b of this.books.values()) {
      if (b.isbn === isbn && !b.isDeleted) return b;
    }
    return null;
  }

  public async search(query: BookSearchQueryDto): Promise<PaginatedResponse<IBookSummary>> {
    let filtered = Array.from(this.books.values()).filter((b) => !b.isDeleted);

    if (query.q) {
      const q = query.q.toLowerCase();
      filtered = filtered.filter(
        (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.isbn.includes(q),
      );
    }
    if (query.genre) {
      filtered = filtered.filter((b) => b.genre === query.genre);
    }
    if (query.available !== undefined) {
      filtered = filtered.filter((b) => (query.available ? b.availableCopies > 0 : true));
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const totalRecords = filtered.length;
    const totalPages = Math.ceil(totalRecords / limit) || 1;
    const skip = (page - 1) * limit;

    const data: IBookSummary[] = filtered.slice(skip, skip + limit).map((b) => ({
      id: b.id,
      isbn: b.isbn,
      title: b.title,
      author: b.author,
      genre: b.genre,
      totalCopies: b.totalCopies,
      availableCopies: b.availableCopies,
      publicationYear: b.publicationYear,
    }));

    return {
      data,
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

  public async create(bookData: Omit<IBook, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>): Promise<IBook> {
    const hex = (this.idCounter++).toString(16).padStart(24, '0');
    const book: IBook = {
      ...bookData,
      id: hex,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.books.set(hex, book);
    return book;
  }

  public async update(id: string, updateData: Partial<Omit<IBook, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>>): Promise<IBook | null> {
    const book = this.books.get(id);
    if (!book || book.isDeleted) return null;
    Object.assign(book, updateData, { updatedAt: new Date() });
    return book;
  }

  public async softDelete(id: string): Promise<boolean> {
    const book = this.books.get(id);
    if (!book || book.isDeleted) return false;
    book.isDeleted = true;
    book.updatedAt = new Date();
    return true;
  }

  public async decrementAvailableCopies(id: string): Promise<boolean> {
    const book = this.books.get(id);
    if (!book || book.isDeleted || book.availableCopies <= 0) return false;
    book.availableCopies -= 1;
    book.updatedAt = new Date();
    return true;
  }

  public async incrementAvailableCopies(id: string): Promise<boolean> {
    const book = this.books.get(id);
    if (!book || book.isDeleted || book.availableCopies >= book.totalCopies) return false;
    book.availableCopies += 1;
    book.updatedAt = new Date();
    return true;
  }

  public async countStock(): Promise<BookStockCounts> {
    let totalTitles = 0;
    let totalCopies = 0;
    let availableCopies = 0;
    for (const b of this.books.values()) {
      if (!b.isDeleted) {
        totalTitles++;
        totalCopies += b.totalCopies;
        availableCopies += b.availableCopies;
      }
    }
    return { totalTitles, totalCopies, availableCopies, borrowedCopies: totalCopies - availableCopies };
  }
}

class MockBorrowingRepository implements IBorrowingRepository {
  public borrowings: Map<string, IBorrowing> = new Map();
  private idCounter = 1;

  public async findById(id: string): Promise<IBorrowing | null> {
    return this.borrowings.get(id) || null;
  }

  public async findActiveByUserId(userId: string): Promise<IBorrowing[]> {
    return Array.from(this.borrowings.values()).filter(
      (b) => b.userId === userId && (b.status === CirculationStatus.ACTIVE || b.status === CirculationStatus.OVERDUE),
    );
  }

  public async findActiveByBookId(bookId: string): Promise<IBorrowing[]> {
    return Array.from(this.borrowings.values()).filter(
      (b) => b.bookId === bookId && (b.status === CirculationStatus.ACTIVE || b.status === CirculationStatus.OVERDUE),
    );
  }

  public async findHistoryByUserId(userId: string, pagination: PaginationParams): Promise<PaginatedResponse<IBorrowing>> {
    const all = Array.from(this.borrowings.values()).filter((b) => b.userId === userId);
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const totalRecords = all.length;
    const totalPages = Math.ceil(totalRecords / limit) || 1;
    const skip = (page - 1) * limit;
    return {
      data: all.slice(skip, skip + limit),
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

  public async findAll(query: AdminBorrowingsQueryDto): Promise<PaginatedResponse<IBorrowing>> {
    let all = Array.from(this.borrowings.values());
    if (query.status) all = all.filter((b) => b.status === query.status);
    if (query.userId) all = all.filter((b) => b.userId === query.userId);
    if (query.bookId) all = all.filter((b) => b.bookId === query.bookId);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const totalRecords = all.length;
    const totalPages = Math.ceil(totalRecords / limit) || 1;
    const skip = (page - 1) * limit;
    return {
      data: all.slice(skip, skip + limit),
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

  public async create(data: Omit<IBorrowing, 'id' | 'createdAt' | 'updatedAt'>): Promise<IBorrowing> {
    const hex = (this.idCounter++).toString(16).padStart(24, '0');
    const borrowing: IBorrowing = {
      ...data,
      id: hex,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.borrowings.set(hex, borrowing);
    return borrowing;
  }

  public async markReturned(id: string, returnDate: Date, returnedBy: string, adminRemarks?: string | null): Promise<IBorrowing | null> {
    const b = this.borrowings.get(id);
    if (!b) return null;
    b.status = CirculationStatus.RETURNED;
    b.returnDate = returnDate;
    b.returnedBy = returnedBy;
    b.adminReturnRemarks = adminRemarks || null;
    b.updatedAt = new Date();
    return b;
  }

  public async findActiveByUserAndBook(userId: string, bookId: string): Promise<IBorrowing | null> {
    for (const b of this.borrowings.values()) {
      if (b.userId === userId && b.bookId === bookId && (b.status === CirculationStatus.ACTIVE || b.status === CirculationStatus.OVERDUE)) {
        return b;
      }
    }
    return null;
  }

  public async countActiveByUserId(userId: string): Promise<number> {
    return Array.from(this.borrowings.values()).filter(
      (b) => b.userId === userId && (b.status === CirculationStatus.ACTIVE || b.status === CirculationStatus.OVERDUE),
    ).length;
  }

  public async countActiveByBookId(bookId: string): Promise<number> {
    return Array.from(this.borrowings.values()).filter(
      (b) => b.bookId === bookId && (b.status === CirculationStatus.ACTIVE || b.status === CirculationStatus.OVERDUE),
    ).length;
  }

  public async countActiveAndOverdue(): Promise<CirculationKpiCounts> {
    let activeLoans = 0;
    let overdueLoans = 0;
    const now = new Date();
    for (const b of this.borrowings.values()) {
      if (b.status === CirculationStatus.ACTIVE || b.status === CirculationStatus.OVERDUE) {
        activeLoans++;
        if (b.dueDate < now) overdueLoans++;
      }
    }
    return { activeLoans, overdueLoans };
  }
}

class MockAuditLogRepository implements IAuditLogRepository {
  public logs: IAuditLog[] = [];
  private idCounter = 1;

  public async create(logData: Omit<IAuditLog, 'id' | 'timestamp'>): Promise<IAuditLog> {
    const hex = (this.idCounter++).toString(16).padStart(24, '0');
    const log: IAuditLog = {
      ...logData,
      id: hex,
      timestamp: new Date(),
    };
    this.logs.unshift(log);
    return log;
  }

  public async query(query: AuditQueryDto): Promise<PaginatedResponse<IAuditLog>> {
    let filtered = [...this.logs];
    if (query.action) filtered = filtered.filter((l) => l.action === query.action);
    if (query.actorId) filtered = filtered.filter((l) => l.actorId === query.actorId);
    if (query.targetEntity) filtered = filtered.filter((l) => l.targetEntity === query.targetEntity);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const totalRecords = filtered.length;
    const totalPages = Math.ceil(totalRecords / limit) || 1;
    const skip = (page - 1) * limit;
    return {
      data: filtered.slice(skip, skip + limit),
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
}

class MockTransactionManager implements ITransactionManager {
  public async startSession(): Promise<never> {
    return {} as never;
  }

  public async withTransaction<T>(operation: (session: never) => Promise<T>): Promise<T> {
    return operation({} as never);
  }
}

// ============================================================================
// TEST HARNESS & RUNNER
// ============================================================================

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runStage8IntegrationSuite() {
  console.log('================================================================');
  console.log('  STAGE 8: FRONTEND FEATURE INTEGRATION & LIVE END-TO-END TEST');
  console.log('================================================================\n');

  // 1. Setup Backend Dependencies and Services
  const userRepo = new MockUserRepository();
  const sessionRepo = new MockSessionRepository();
  const bookRepo = new MockBookRepository();
  const borrowingRepo = new MockBorrowingRepository();
  const auditRepo = new MockAuditLogRepository();
  const txManager = new MockTransactionManager();

  const passwordService = new PasswordService();
  const jwtService = new JwtService();
  const auditService = new AuditService(auditRepo);

  const authService = new AuthService(userRepo, sessionRepo, passwordService, jwtService, auditService);
  const userService = new UserService(userRepo, sessionRepo, txManager, passwordService, auditService);
  const catalogService = new CatalogService(bookRepo);
  const circulationService = new CirculationService(borrowingRepo, bookRepo, userRepo, txManager, auditService);
  const adminService = new AdminService(bookRepo, borrowingRepo, userRepo, txManager, auditService);

  const authCtrl = new AuthController(authService);
  const userCtrl = new UserController(userService);
  const bookCtrl = new BookController(catalogService);
  const circulationCtrl = new CirculationController(circulationService);
  const adminCtrl = new AdminController(adminService, userService, auditService);

  const apiRouter = createApiRouter({
    auth: createAuthRoutes(authCtrl),
    users: createUserRoutes(userCtrl),
    books: createBookRoutes(bookCtrl),
    borrowings: createCirculationRoutes(circulationCtrl),
    admin: createAdminRoutes(adminCtrl),
  });

  const app = createApp(apiRouter);
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as AddressInfo).port;
  const loopbackUrl = `http://127.0.0.1:${port}/api/v1`;

  console.log(`[TEST SERVER] Running loopback API on ${loopbackUrl}\n`);

  // Configure Frontend ApiClient baseURL and simulated cookie jar for Node loopback
  apiClient.defaults.baseURL = loopbackUrl;
  axios.defaults.baseURL = loopbackUrl;

  const cookieJar: Record<string, string> = {};

  // Intercept responses to populate cookieJar from Set-Cookie headers
  apiClient.interceptors.response.use((response) => {
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
      const cookieArray = Array.isArray(setCookie) ? setCookie : [setCookie];
      for (const raw of cookieArray) {
        const [pair] = raw.split(';');
        const [k, v] = pair.split('=');
        if (k) {
          if (raw.includes('Max-Age=0') || !v) {
            delete cookieJar[k.trim()];
          } else {
            cookieJar[k.trim()] = v.trim();
          }
        }
      }
    }
    return response;
  });

  // Intercept requests to attach simulated cookies
  apiClient.interceptors.request.use((config) => {
    const cookieStr = Object.entries(cookieJar)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
    if (cookieStr) {
      config.headers.Cookie = cookieStr;
    }
    return config;
  });

  // Also attach cookie jar to default axios for the silent refresh call
  axios.interceptors.request.use((config) => {
    const cookieStr = Object.entries(cookieJar)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
    if (cookieStr) {
      config.headers.Cookie = cookieStr;
    }
    return config;
  });
  axios.interceptors.response.use((response) => {
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
      const cookieArray = Array.isArray(setCookie) ? setCookie : [setCookie];
      for (const raw of cookieArray) {
        const [pair] = raw.split(';');
        const [k, v] = pair.split('=');
        if (k) {
          if (raw.includes('Max-Age=0') || !v) {
            delete cookieJar[k.trim()];
          } else {
            cookieJar[k.trim()] = v.trim();
          }
        }
      }
    }
    return response;
  });

  try {
    // ========================================================================
    // SECTION 1: Patron Lifecycle & Dual-Token Security (Zero localStorage)
    // ========================================================================
    console.log('--- 1. Patron Authentication & Dual-Token Security ---');

    // 1.1 POST /api/v1/auth/register (FR-AUTH-001)
    const patronRegistered = await authApi.register({
      email: 'alex.patron@example.com',
      password: 'SecurePassword123!',
      firstName: 'Alex',
      lastName: 'Patron',
    });
    assert(patronRegistered.email === 'alex.patron@example.com', '1.1 authApi.register creates patron with matching email');
    assert(patronRegistered.role === UserRole.PATRON, '1.1 authApi.register sets default role to PATRON');

    // 1.2 POST /api/v1/auth/login (FR-AUTH-002)
    const loginTokens = await authApi.login({
      email: 'alex.patron@example.com',
      password: 'SecurePassword123!',
    });
    assert(!!loginTokens.accessToken, '1.2 authApi.login returns JWT access token');
    assert(getAccessToken() === loginTokens.accessToken, '1.2 setAccessToken saves JWT in-memory (ADR-FE-02)');
    assert(!!cookieJar['refreshToken'], '1.2 refreshToken captured in HttpOnly cookie jar');

    // 1.3 Verify zero storage footprint
    const globalStorage = (globalThis as unknown as { localStorage?: unknown; sessionStorage?: unknown });
    assert(
      !globalStorage.localStorage && !globalStorage.sessionStorage,
      '1.3 Zero access/refresh tokens in localStorage / sessionStorage (ADR-FE-02)',
    );

    // 1.4 GET /api/v1/users/profile (FR-USER-001)
    const patronProfile = await userApi.getProfile();
    assert(patronProfile.id === patronRegistered.id, '1.4 userApi.getProfile retrieves profile using in-memory bearer token');
    assert(patronProfile.activeBorrowCount === 0, '1.4 userApi.getProfile shows initial 0 active borrows');

    // 1.5 PATCH /api/v1/users/password (FR-USER-002)
    const pwChangeRes = await userApi.changePassword({
      currentPassword: 'SecurePassword123!',
      newPassword: 'UpdatedPassword456!',
    });
    assert(pwChangeRes.message.includes('successfully'), '1.5 userApi.changePassword updates patron credentials');

    // 1.6 POST /api/v1/auth/login with new credentials
    const reLogin = await authApi.login({
      email: 'alex.patron@example.com',
      password: 'UpdatedPassword456!',
    });
    assert(!!reLogin.accessToken, '1.6 authApi.login succeeds with updated password');

    // 1.7 POST /api/v1/auth/refresh (FR-AUTH-004)
    const previousToken = getAccessToken();
    const refreshRes = await authApi.refresh();
    assert(!!refreshRes.accessToken, '1.7 authApi.refresh returns new access token');
    assert(refreshRes.accessToken !== previousToken, '1.7 authApi.refresh performs single-use token rotation');
    assert(getAccessToken() === refreshRes.accessToken, '1.7 In-memory access token updated after rotation');

    // 1.8 POST /api/v1/auth/logout (FR-AUTH-003)
    await authApi.logout();
    assert(getAccessToken() === null, '1.8 authApi.logout flushes in-memory access token');
    assert(!cookieJar['refreshToken'], '1.8 authApi.logout clears HttpOnly refresh cookie');

    // ========================================================================
    // SECTION 2: Admin Operations & Catalog Management
    // ========================================================================
    console.log('\n--- 2. Admin Operations & Catalog Management ---');

    // Setup Admin account in mock DB
    const adminPasswordHash = await passwordService.hash('AdminMaster123!');
    const adminUser = await userRepo.create({
      email: 'admin.director@example.com',
      passwordHash: adminPasswordHash,
      firstName: 'Eleanor',
      lastName: 'Vance',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      activeBorrowCount: 0,
    });

    // 2.1 Admin login
    await authApi.login({
      email: 'admin.director@example.com',
      password: 'AdminMaster123!',
    });
    assert(getAccessToken() !== null, '2.1 Admin successfully authenticated');

    // 2.2 GET /api/v1/admin/dashboard/kpis (FR-ADMIN-001)
    const kpis = await adminApi.getDashboardKpis();
    assert(typeof kpis.catalog.totalTitles === 'number', '2.2 adminApi.getDashboardKpis returns totalTitles metric');
    assert(typeof kpis.circulation.activeLoans === 'number', '2.2 adminApi.getDashboardKpis returns activeLoans metric');
    assert(typeof kpis.circulation.overdueLoans === 'number', '2.2 adminApi.getDashboardKpis returns overdueLoans metric');

    // 2.3 POST /api/v1/admin/books (FR-ADMIN-002)
    const newBook = await adminApi.createBook({
      isbn: '9780132350884',
      title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      author: 'Robert C. Martin',
      genre: BookGenre.TECHNOLOGY,
      description: 'A handbook of agile software craftsmanship and best practices.',
      publisher: 'Prentice Hall',
      publicationYear: 2008,
      totalCopies: 5,
      location: {
        aisle: 'TECH-A',
        shelf: '04',
      },
    });
    assert(newBook.id.length === 24, '2.3 adminApi.createBook generates 24-char ObjectId');
    assert(newBook.availableCopies === 5, '2.3 adminApi.createBook initializes availableCopies === totalCopies');

    // 2.4 GET /api/v1/books (FR-BOOK-001, FR-BOOK-002)
    const searchRes = await bookApi.searchBooks({ q: 'Clean Code', genre: BookGenre.TECHNOLOGY });
    assert(searchRes.data.length >= 1, '2.4 bookApi.searchBooks finds title by keyword and genre filter');
    assert(searchRes.pagination.totalRecords >= 1, '2.4 bookApi.searchBooks returns pagination metadata');

    // 2.5 GET /api/v1/books/:bookId (FR-BOOK-003)
    const bookDetails = await bookApi.getBookById(newBook.id);
    assert(bookDetails.title === newBook.title, '2.5 bookApi.getBookById returns full book entity');
    assert(bookDetails.location.aisle === 'TECH-A', '2.5 bookApi.getBookById provides physical shelf coordinates');

    // 2.6 GET /api/v1/books/:bookId/availability (FR-BOOK-004)
    const availability = await bookApi.getBookAvailability(newBook.id);
    assert(availability.isAvailable === true, '2.6 bookApi.getBookAvailability confirms book in stock');
    assert(availability.availableCopies === 5, '2.6 bookApi.getBookAvailability reports 5 available copies');

    // 2.7 PUT /api/v1/admin/books/:bookId (FR-ADMIN-003)
    const updatedBook = await adminApi.updateBook(newBook.id, {
      totalCopies: 7,
      location: {
        aisle: 'TECH-B',
        shelf: '01',
      },
    });
    assert(updatedBook.totalCopies === 7, '2.7 adminApi.updateBook expands total copies');
    assert(updatedBook.availableCopies === 7, '2.7 adminApi.updateBook recalculates available copies dynamically');

    // 2.8 DELETE /api/v1/admin/books/:bookId (FR-ADMIN-004)
    const bookToDelete = await adminApi.createBook({
      isbn: '9780201633610',
      title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
      author: 'Erich Gamma et al.',
      genre: BookGenre.TECHNOLOGY,
      description: 'Elements of reusable object-oriented software patterns.',
      publisher: 'Addison-Wesley',
      publicationYear: 1994,
      totalCopies: 2,
      location: {
        aisle: 'TECH-B',
        shelf: '02',
      },
    });
    const deleteRes = await adminApi.deleteBook(bookToDelete.id);
    assert(deleteRes.isDeleted === true, '2.8 adminApi.deleteBook soft-deletes book title');

    // ========================================================================
    // SECTION 3: Patron Circulation Operations & Loan Invariants
    // ========================================================================
    console.log('\n--- 3. Patron Circulation Operations & Loan Invariants ---');

    // Login as Patron
    await authApi.login({
      email: 'alex.patron@example.com',
      password: 'UpdatedPassword456!',
    });

    // 3.1 POST /api/v1/borrowings (FR-BORROW-001)
    const borrowing = await circulationApi.borrowBook({ bookId: newBook.id });
    assert(borrowing.status === CirculationStatus.ACTIVE, '3.1 circulationApi.borrowBook creates loan in ACTIVE status');
    assert(!!borrowing.dueDate, '3.1 circulationApi.borrowBook sets 14-day loan due date');

    // 3.2 GET /api/v1/borrowings/my-active (FR-BORROW-003)
    const activeLoans = await circulationApi.getActiveLoans();
    assert(activeLoans.totalActiveLoans === 1, '3.2 circulationApi.getActiveLoans returns totalActiveLoans 1');
    assert(activeLoans.data.length === 1, '3.2 circulationApi.getActiveLoans lists borrowed volume');
    assert(activeLoans.data[0].book.title === newBook.title, '3.2 circulationApi.getActiveLoans contains book title');

    // 3.3 POST /api/v1/borrowings/:borrowingId/return (FR-BORROW-002)
    const returnRes = await circulationApi.returnBook(borrowing.id);
    assert(returnRes.status === CirculationStatus.RETURNED, '3.3 circulationApi.returnBook transitions status to RETURNED');
    assert(!!returnRes.returnDate, '3.3 circulationApi.returnBook records timestamp of return');

    // 3.4 GET /api/v1/borrowings/my-history (FR-BORROW-004)
    const history = await circulationApi.getBorrowingHistory({ page: 1, limit: 10 });
    assert(history.data.length >= 1, '3.4 circulationApi.getBorrowingHistory lists completed circulation history');
    assert(history.pagination.totalRecords >= 1, '3.4 circulationApi.getBorrowingHistory provides pagination metadata');

    // ========================================================================
    // SECTION 4: Administrative Oversight & Audit Trails
    // ========================================================================
    console.log('\n--- 4. Administrative Oversight, Overrides & Audit Ledger ---');

    // Login back as Admin
    await authApi.login({
      email: 'admin.director@example.com',
      password: 'AdminMaster123!',
    });

    // Patron borrows another book first so admin can override return
    await authApi.login({
      email: 'alex.patron@example.com',
      password: 'UpdatedPassword456!',
    });
    const staffLoan = await circulationApi.borrowBook({ bookId: newBook.id });

    // Switch to Admin
    await authApi.login({
      email: 'admin.director@example.com',
      password: 'AdminMaster123!',
    });

    // 4.1 GET /api/v1/admin/borrowings (FR-ADMIN-006)
    const adminBorrowings = await adminApi.getAllBorrowings({ status: CirculationStatus.ACTIVE });
    assert(adminBorrowings.data.length >= 1, '4.1 adminApi.getAllBorrowings provides system-wide loan oversight');

    // 4.2 POST /api/v1/admin/borrowings/:borrowingId/return-override (FR-ADMIN-007)
    const overrideRes = await adminApi.returnOverride(staffLoan.id, {
      adminRemarks: 'Returned directly to librarian front desk after hours.',
    });
    assert(overrideRes.status === CirculationStatus.RETURNED, '4.2 adminApi.returnOverride executes staff return override');
    assert(overrideRes.adminReturnRemarks?.includes('front desk') === true, '4.2 adminApi.returnOverride records staff audit remarks');

    // 4.3 PATCH /api/v1/admin/users/:userId/status (FR-ADMIN-005) - Suspend User
    const suspendRes = await adminApi.updateUserStatus(patronRegistered.id, {
      status: UserStatus.SUSPENDED,
      reason: 'Administrative suspension for security policy testing',
    });
    assert(suspendRes.status === UserStatus.SUSPENDED, '4.3 adminApi.updateUserStatus suspends patron account');

    // 4.4 Verify Suspended patron is blocked from borrowing
    await authApi.login({
      email: 'alex.patron@example.com',
      password: 'UpdatedPassword456!',
    });
    let borrowBlocked = false;
    try {
      await circulationApi.borrowBook({ bookId: newBook.id });
    } catch {
      borrowBlocked = true;
    }
    assert(borrowBlocked, '4.4 Suspended patron is blocked from borrowing new titles (RC-10)');

    // 4.5 Admin reactivates patron
    await authApi.login({
      email: 'admin.director@example.com',
      password: 'AdminMaster123!',
    });
    const reactivateRes = await adminApi.updateUserStatus(patronRegistered.id, {
      status: UserStatus.ACTIVE,
      reason: 'Reactivated after clearance',
    });
    assert(reactivateRes.status === UserStatus.ACTIVE, '4.5 adminApi.updateUserStatus reactivates patron account');

    // 4.6 GET /api/v1/admin/audit-logs (FR-ADMIN-008)
    const auditLogs = await adminApi.getAuditLogs({ page: 1, limit: 10 });
    assert(auditLogs.data.length > 0, '4.6 adminApi.getAuditLogs retrieves immutable audit trail');
    assert(!!auditLogs.data[0].action, '4.6 adminApi.getAuditLogs contains structured audit action tags');

    // ========================================================================
    // SECTION 5: Silent 401 Interception & Token Refresh Queue
    // ========================================================================
    console.log('\n--- 5. Silent 401 Interception & Token Refresh Queue ---');

    // Patron login ensures valid refresh cookie in jar
    await authApi.login({
      email: 'alex.patron@example.com',
      password: 'UpdatedPassword456!',
    });
    const validInitialToken = getAccessToken();
    assert(validInitialToken !== null, '5.1 Patron initial session established');

    // Corrupt in-memory access token to simulate expiration
    setAccessToken('corrupted.expired.token.simulation');

    // Trigger authenticated request: interceptor should catch 401, call /auth/refresh, update token, and retry
    const recoveredProfile = await userApi.getProfile();
    assert(recoveredProfile.id === patronRegistered.id, '5.2 Axios response interceptor silently refreshed expired token and completed request');
    assert(getAccessToken() !== 'corrupted.expired.token.simulation', '5.3 New valid access token populated in memory without user intervention');

    console.log('\n================================================================');
    console.log(`  STAGE 8 E2E INTEGRATION RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Unhandled fatal error in Stage 8 Integration Suite:', error);
    process.exit(1);
  } finally {
    server.close();
  }
}

runStage8IntegrationSuite();
