/**
 * Cloud-Native Library Management System (LMS)
 * Stage 5 Automated End-to-End API Delivery Layer Test Suite
 *
 * Verifies all 21 REST API endpoints, middlewares, controllers, services,
 * and security controls over a live HTTP loopback server.
 */

import http from 'http';
import { AddressInfo } from 'net';
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

// ============================================================================
// IN-MEMORY MOCK REPOSITORIES FOR ISOLATED, REPEATABLE HTTP TESTING
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
    // Generate valid 24-character hexadecimal ObjectId
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
    return this.books.get(id) || null;
  }

  public async findByIsbn(isbn: string): Promise<IBook | null> {
    for (const b of this.books.values()) {
      if (b.isbn.toUpperCase() === isbn.toUpperCase()) return b;
    }
    return null;
  }

  public async create(data: Omit<IBook, 'id' | 'createdAt' | 'updatedAt'>): Promise<IBook> {
    const hex = (this.idCounter++).toString(16).padStart(24, '0');
    const book: IBook = {
      ...data,
      id: hex,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.books.set(hex, book);
    return book;
  }

  public async update(id: string, updates: Partial<IBook>): Promise<IBook | null> {
    const book = this.books.get(id);
    if (!book) return null;
    Object.assign(book, updates, { updatedAt: new Date() });
    return book;
  }

  public async decrementAvailableCopies(id: string): Promise<boolean> {
    const book = this.books.get(id);
    if (!book || book.availableCopies <= 0 || book.isDeleted) return false;
    book.availableCopies -= 1;
    return true;
  }

  public async incrementAvailableCopies(id: string): Promise<boolean> {
    const book = this.books.get(id);
    if (!book || book.availableCopies >= book.totalCopies) return false;
    book.availableCopies += 1;
    return true;
  }

  public async softDelete(id: string): Promise<boolean> {
    const book = this.books.get(id);
    if (!book || book.isDeleted) return false;
    book.isDeleted = true;
    book.updatedAt = new Date();
    return true;
  }

  public async search(query: BookSearchQueryDto): Promise<PaginatedResponse<IBookSummary>> {
    let items = Array.from(this.books.values()).filter((b) => !b.isDeleted);
    if (query.q) {
      const q = query.q.toLowerCase();
      items = items.filter((b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
    }
    if (query.genre) {
      items = items.filter((b) => b.genre === query.genre);
    }
    if (query.available !== undefined) {
      items = items.filter((b) => (query.available ? b.availableCopies > 0 : b.availableCopies === 0));
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const totalRecords = items.length;
    const totalPages = Math.ceil(totalRecords / limit) || 1;
    const skip = (page - 1) * limit;
    const data: IBookSummary[] = items.slice(skip, skip + limit).map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      isbn: b.isbn,
      genre: b.genre,
      publicationYear: b.publicationYear,
      availableCopies: b.availableCopies,
      totalCopies: b.totalCopies,
      coverImageUrl: b.coverImageUrl,
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
    return { totalTitles, totalCopies, availableCopies };
  }
}

class MockBorrowingRepository implements IBorrowingRepository {
  public borrowings: Map<string, IBorrowing> = new Map();
  private idCounter = 1;

  public async findById(id: string): Promise<IBorrowing | null> {
    return this.borrowings.get(id) || null;
  }

  public async findActiveByUserAndBook(userId: string, bookId: string): Promise<IBorrowing | null> {
    for (const b of this.borrowings.values()) {
      if (b.userId === userId && b.bookId === bookId && (b.status === CirculationStatus.ACTIVE || b.status === CirculationStatus.OVERDUE)) {
        return b;
      }
    }
    return null;
  }

  public async findActiveByUserId(userId: string): Promise<IBorrowing[]> {
    const list: IBorrowing[] = [];
    for (const b of this.borrowings.values()) {
      if (b.userId === userId && (b.status === CirculationStatus.ACTIVE || b.status === CirculationStatus.OVERDUE)) {
        list.push(b);
      }
    }
    return list;
  }

  public async findHistoryByUserId(userId: string, pagination: PaginationParams): Promise<PaginatedResponse<IBorrowing>> {
    const all = Array.from(this.borrowings.values()).filter((b) => b.userId === userId);
    const { page, limit } = pagination;
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

  public async countActiveAndOverdue(): Promise<CirculationKpiCounts> {
    let activeLoans = 0;
    let overdueLoans = 0;
    const now = new Date();
    for (const b of this.borrowings.values()) {
      if (b.status === CirculationStatus.ACTIVE || b.status === CirculationStatus.OVERDUE) {
        if (b.returnDate === null && now > b.dueDate) overdueLoans++;
        else activeLoans++;
      }
    }
    return { activeLoans, overdueLoans };
  }

  public async countActiveByUserId(userId: string): Promise<number> {
    const active = await this.findActiveByUserId(userId);
    return active.length;
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
    this.logs.push(log);
    return log;
  }

  public async query(query: AuditQueryDto): Promise<PaginatedResponse<IAuditLog>> {
    let items = [...this.logs];
    if (query.action) items = items.filter((l) => l.action === query.action);
    if (query.actorId) items = items.filter((l) => l.actorId === query.actorId);
    if (query.entityType) items = items.filter((l) => l.entityType === query.entityType);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const totalRecords = items.length;
    const totalPages = Math.ceil(totalRecords / limit) || 1;
    const skip = (page - 1) * limit;

    return {
      data: items.slice(skip, skip + limit),
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

async function runStage5Tests() {
  console.log('================================================================');
  console.log('  STAGE 5: FULL API DELIVERY LAYER & CORE FEATURE INTEGRATION');
  console.log('================================================================\n');

  // Instantiate isolated dependencies
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

  // Instantiate controllers
  const authCtrl = new AuthController(authService);
  const userCtrl = new UserController(userService);
  const bookCtrl = new BookController(catalogService);
  const circulationCtrl = new CirculationController(circulationService);
  const adminCtrl = new AdminController(adminService, userService, auditService);

  // Wire custom routes with injected controllers
  const apiRouter = createApiRouter({
    auth: createAuthRoutes(authCtrl),
    users: createUserRoutes(userCtrl),
    books: createBookRoutes(bookCtrl),
    borrowings: createCirculationRoutes(circulationCtrl),
    admin: createAdminRoutes(adminCtrl),
  });

  // Create Express application
  const app = createApp(apiRouter);

  // Start ephemeral HTTP server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`[TEST SERVER] Running on ${baseUrl}\n`);

  try {
    // ------------------------------------------------------------------------
    // SECTION 1: Health & Liveness Probes
    // ------------------------------------------------------------------------
    console.log('--- 1. Health, Liveness & Telemetry Probes ---');

    const resHealthz = await fetch(`${baseUrl}/healthz`);
    const dataHealthz = await resHealthz.json();
    assert(resHealthz.status === 200 && dataHealthz.status === 'UP', 'GET /healthz returns 200 UP');
    assert(!!resHealthz.headers.get('x-correlation-id'), 'GET /healthz includes X-Correlation-ID header');

    const resHealth = await fetch(`${baseUrl}/api/v1/health`);
    const dataHealth = await resHealth.json();
    assert(resHealth.status === 200 && dataHealth.service === 'lms-backend', 'GET /api/v1/health returns 200 with service metadata');

    const resRoot = await fetch(`${baseUrl}/api/v1`);
    const dataRoot = await resRoot.json();
    assert(resRoot.status === 200 && dataRoot.name === 'Cloud-Native Library Management System API', 'GET /api/v1 returns root metadata');


    // ------------------------------------------------------------------------
    // SECTION 2: Request Validation Middleware & RFC 7807 Error Handling
    // ------------------------------------------------------------------------
    console.log('\n--- 2. Request Validation Middleware & RFC 7807 ---');

    const resBadRegister = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: '',
        lastName: '',
        email: 'not-an-email',
        password: 'weak',
      }),
    });
    const dataBadRegister = await resBadRegister.json();
    assert(resBadRegister.status === 400, 'Invalid register payload returns 400 Bad Request');
    assert(
      resBadRegister.headers.get('content-type')?.includes('application/problem+json') === true,
      'Validation failure returns application/problem+json content type',
    );
    assert(dataBadRegister.code === 'ERR-VAL-INVALID-INPUT', 'Problem Details code is ERR-VAL-INVALID-INPUT');
    assert(Array.isArray(dataBadRegister.invalidParams) && dataBadRegister.invalidParams.length >= 3, 'Problem Details contains invalidParams list');

    // Test invalid ObjectId param validation
    const resBadObjectId = await fetch(`${baseUrl}/api/v1/books/invalid-hex-id`);
    const dataBadObjectId = await resBadObjectId.json();
    assert(resBadObjectId.status === 400, 'Invalid ObjectId path param returns 400 Bad Request');
    assert(dataBadObjectId.code === 'ERR-VAL-INVALID-INPUT', 'ObjectId validation failure mapped to ERR-VAL-INVALID-INPUT');

    // ------------------------------------------------------------------------
    // SECTION 3: Authentication Delivery Layer (FR-AUTH-001 to FR-AUTH-004)
    // ------------------------------------------------------------------------
    console.log('\n--- 3. Authentication Delivery Layer ---');

    // FR-AUTH-001: Patron Registration
    const patronPayload = {
      firstName: 'Alice',
      lastName: 'Patron',
      email: 'alice@patron.com',
      password: 'StrongPassword123!',
      phoneNumber: '+1-555-0101',
    };
    const resRegister = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patronPayload),
    });
    const dataRegister = await resRegister.json();
    assert(resRegister.status === 201, 'POST /api/v1/auth/register returns 201 Created');
    assert(dataRegister.email === 'alice@patron.com', 'Registration response includes user email');
    assert(dataRegister.role === UserRole.PATRON, 'New user assigned default ROLE_PATRON');
    assert(dataRegister.status === UserStatus.ACTIVE, 'New user assigned default ACTIVE status');
    assert(!('passwordHash' in dataRegister) && !('password' in dataRegister), 'Zero sensitive password hash exposed');

    const patronId = dataRegister.id;

    // Duplicate Registration Handling
    const resDupRegister = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patronPayload),
    });
    const dataDupRegister = await resDupRegister.json();
    assert(resDupRegister.status === 409, 'Duplicate registration returns 409 Conflict');
    assert(dataDupRegister.code === 'ERR-AUTH-DUPLICATE-EMAIL', 'Duplicate registration code is ERR-AUTH-DUPLICATE-EMAIL');

    // FR-AUTH-002: Patron Login
    const resLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@patron.com', password: 'StrongPassword123!' }),
    });
    const dataLogin = await resLogin.json();
    const setCookieHeader = resLogin.headers.get('set-cookie');
    assert(resLogin.status === 200, 'POST /api/v1/auth/login returns 200 OK');
    assert(!!dataLogin.accessToken && dataLogin.tokenType === 'Bearer', 'Login returns valid Bearer accessToken');
    assert(dataLogin.expiresIn === 900, 'Access token expiresIn is 900 seconds (15 minutes)');
    assert(dataLogin.user.email === 'alice@patron.com', 'Login returns public user profile');
    assert(!!setCookieHeader && setCookieHeader.includes('refreshToken='), 'Login sets refreshToken cookie');
    assert(setCookieHeader!.includes('HttpOnly'), 'Refresh token cookie is HttpOnly');
    assert(setCookieHeader!.includes('Path=/api/v1/auth'), 'Refresh token cookie path is /api/v1/auth');

    const patronAccessToken = dataLogin.accessToken;
    // Extract refreshToken cookie string for subsequent refresh/logout tests
    const rawCookie = setCookieHeader!.split(';')[0];

    // Invalid Login Credentials
    const resBadLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@patron.com', password: 'WrongPassword999!' }),
    });
    const dataBadLogin = await resBadLogin.json();
    assert(resBadLogin.status === 401, 'Invalid password returns 401 Unauthorized');
    assert(dataBadLogin.code === 'ERR-AUTH-INVALID-CREDENTIALS', 'Error code is ERR-AUTH-INVALID-CREDENTIALS');

    // FR-AUTH-004: Token Refresh
    const resRefresh = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: rawCookie },
    });
    const dataRefresh = await resRefresh.json();
    const rotatedCookieHeader = resRefresh.headers.get('set-cookie');
    assert(resRefresh.status === 200, 'POST /api/v1/auth/refresh returns 200 OK');
    assert(!!dataRefresh.accessToken && dataRefresh.tokenType === 'Bearer', 'Refresh returns new access token');
    assert(!!rotatedCookieHeader && rotatedCookieHeader.includes('refreshToken='), 'Refresh rotates HttpOnly cookie');

    const refreshedAccessToken = dataRefresh.accessToken;
    const rotatedCookie = rotatedCookieHeader!.split(';')[0];

    // ------------------------------------------------------------------------
    // SECTION 4: User Profile & Password Management (FR-USER-001, FR-USER-002)
    // ------------------------------------------------------------------------
    console.log('\n--- 4. User Profile & Password Delivery Layer ---');

    // FR-USER-001: Get Profile
    const resProfile = await fetch(`${baseUrl}/api/v1/users/profile`, {
      headers: { Authorization: `Bearer ${refreshedAccessToken}` },
    });
    const dataProfile = await resProfile.json();
    assert(resProfile.status === 200, 'GET /api/v1/users/profile returns 200 OK');
    assert(dataProfile.id === patronId && dataProfile.email === 'alice@patron.com', 'Profile matches authenticated user');
    assert(dataProfile.activeBorrowCount === 0, 'Initial activeBorrowCount is 0');

    // Missing Authentication Rejection
    const resNoAuth = await fetch(`${baseUrl}/api/v1/users/profile`);
    assert(resNoAuth.status === 401, 'Unauthenticated request to protected route returns 401 Unauthorized');

    // Malformed Authentication Rejection
    const resBadToken = await fetch(`${baseUrl}/api/v1/users/profile`, {
      headers: { Authorization: 'Bearer this-is-not-a-valid-token' },
    });
    assert(resBadToken.status === 401, 'Malformed token returns 401 Unauthorized');

    // FR-USER-002: Transactional Password Change
    const resChangePw = await fetch(`${baseUrl}/api/v1/users/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshedAccessToken}`,
      },
      body: JSON.stringify({
        currentPassword: 'StrongPassword123!',
        newPassword: 'SuperUpdatedPassword456!',
      }),
    });
    assert(resChangePw.status === 200, 'PATCH /api/v1/users/password returns 200 OK');

    // Verify login with updated password
    const resNewPwLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@patron.com', password: 'SuperUpdatedPassword456!' }),
    });
    const dataNewPwLogin = await resNewPwLogin.json();
    assert(resNewPwLogin.status === 200, 'Login with updated password succeeds');
    const activePatronToken = dataNewPwLogin.accessToken;

    // ------------------------------------------------------------------------
    // SECTION 5: Administrator Setup & Book Administration (FR-ADMIN-002 to 004)
    // ------------------------------------------------------------------------
    console.log('\n--- 5. Administrative Management Delivery Layer ---');

    // Register an administrator account
    const adminPayload = {
      firstName: 'Admin',
      lastName: 'Root',
      email: 'admin@library.gov',
      password: 'AdminMasterPassword999!',
    };
    const resAdminReg = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminPayload),
    });
    const dataAdminReg = await resAdminReg.json();
    // Directly elevate role in mock repository to simulate admin user
    const adminUser = userRepo.users.get(dataAdminReg.id)!;
    adminUser.role = UserRole.ADMIN;

    // Login as administrator
    const resAdminLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@library.gov', password: 'AdminMasterPassword999!' }),
    });
    const dataAdminLogin = await resAdminLogin.json();
    const adminToken = dataAdminLogin.accessToken;
    assert(dataAdminLogin.user.role === UserRole.ADMIN, 'Admin login returns role ROLE_ADMIN');

    // FR-ADMIN-002: Create Book Title
    const newBookPayload = {
      title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      author: 'Robert C. Martin',
      isbn: '978-0132350884',
      genre: BookGenre.COMPUTER_SCIENCE,
      description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees.',
      publisher: 'Prentice Hall',
      publicationYear: 2008,
      totalCopies: 5,
      location: { aisle: 'CS', shelf: '101' },
      coverImageUrl: 'https://images.library.cloud/covers/clean-code.jpg',
    };

    const resCreateBook = await fetch(`${baseUrl}/api/v1/admin/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(newBookPayload),
    });
    const dataCreateBook = await resCreateBook.json();
    assert(resCreateBook.status === 201, 'POST /api/v1/admin/books returns 201 Created');
    assert(dataCreateBook.title === newBookPayload.title, 'Created book title matches payload');
    assert(dataCreateBook.availableCopies === 5 && dataCreateBook.totalCopies === 5, 'Initial stock initialized: availableCopies === totalCopies');

    const bookId = dataCreateBook.id;

    // Duplicate ISBN Rejection
    const resDupBook = await fetch(`${baseUrl}/api/v1/admin/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(newBookPayload),
    });
    assert(resDupBook.status === 409, 'Duplicate ISBN returns 409 Conflict');

    // RBAC: Patron access to admin book creation blocked
    const resPatronCreateBook = await fetch(`${baseUrl}/api/v1/admin/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activePatronToken}`,
      },
      body: JSON.stringify(newBookPayload),
    });
    assert(resPatronCreateBook.status === 403, 'Patron access to POST /api/v1/admin/books blocked with 403 Forbidden');

    // ------------------------------------------------------------------------
    // SECTION 6: Public Book Catalog Discovery (FR-BOOK-001 to FR-BOOK-004)
    // ------------------------------------------------------------------------
    console.log('\n--- 6. Public Book Catalog Discovery Layer ---');

    // FR-BOOK-001, FR-BOOK-002: Catalog Search
    const resSearch = await fetch(`${baseUrl}/api/v1/books?q=Clean&available=true`);
    const dataSearch = await resSearch.json();
    assert(resSearch.status === 200, 'GET /api/v1/books returns 200 OK');
    assert(Array.isArray(dataSearch.data) && dataSearch.data.length >= 1, 'Search returns catalog items array');
    assert(dataSearch.pagination.totalRecords >= 1, 'Search response includes pagination metadata');

    // FR-BOOK-003: Book Detail Retrieval
    const resBookDetail = await fetch(`${baseUrl}/api/v1/books/${bookId}`);
    const dataBookDetail = await resBookDetail.json();
    assert(resBookDetail.status === 200, 'GET /api/v1/books/:bookId returns 200 OK');
    assert(dataBookDetail.id === bookId, 'Retrieved book ID matches');
    assert(dataBookDetail.location.aisle === 'CS', 'Detailed book includes physical location coordinates');

    // FR-BOOK-004: Book Real-Time Availability
    const resAvailability = await fetch(`${baseUrl}/api/v1/books/${bookId}/availability`);
    const dataAvailability = await resAvailability.json();
    assert(resAvailability.status === 200, 'GET /api/v1/books/:bookId/availability returns 200 OK');
    assert(dataAvailability.bookId === bookId && dataAvailability.isAvailable === true, 'Book availability status is true');
    assert(dataAvailability.availableCopies === 5, 'Available copies count is 5');

    // ------------------------------------------------------------------------
    // SECTION 7: Patron Circulation Lending (FR-BORROW-001 to FR-BORROW-004)
    // ------------------------------------------------------------------------
    console.log('\n--- 7. Patron Circulation Lending Layer ---');

    // FR-BORROW-001: Self-Service Checkout
    const resBorrow = await fetch(`${baseUrl}/api/v1/borrowings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activePatronToken}`,
      },
      body: JSON.stringify({ bookId }),
    });
    const dataBorrow = await resBorrow.json();
    assert(resBorrow.status === 201, 'POST /api/v1/borrowings returns 201 Created');
    assert(dataBorrow.userId === patronId && dataBorrow.bookId === bookId, 'Borrowing record links patron and book');
    assert(dataBorrow.status === CirculationStatus.ACTIVE, 'Loan status is ACTIVE');
    assert(!!dataBorrow.dueDate, 'Due date is computed');

    const borrowingId = dataBorrow.id;

    // Concurrency / Duplicate Active Loan Prevention (INV-06 / DBD-08)
    const resDupBorrow = await fetch(`${baseUrl}/api/v1/borrowings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activePatronToken}`,
      },
      body: JSON.stringify({ bookId }),
    });
    assert(resDupBorrow.status === 409, 'Duplicate checkout of same title rejected with 409 Conflict (DUPLICATE_ACTIVE_LOAN)');

    // Verify inventory decrement (INV-01)
    const bookAfterBorrow = bookRepo.books.get(bookId)!;
    assert(bookAfterBorrow.availableCopies === 4, 'Book availableCopies decremented to 4');
    const userAfterBorrow = userRepo.users.get(patronId)!;
    assert(userAfterBorrow.activeBorrowCount === 1, 'Patron activeBorrowCount incremented to 1');

    // FR-BORROW-003: Patron Active Loans with dynamic indicators
    const resMyActive = await fetch(`${baseUrl}/api/v1/borrowings/my-active`, {
      headers: { Authorization: `Bearer ${activePatronToken}` },
    });
    const dataMyActive = await resMyActive.json();
    assert(resMyActive.status === 200, 'GET /api/v1/borrowings/my-active returns 200 OK');
    assert(dataMyActive.totalActiveLoans === 1, 'Patron active loan count is 1');
    assert(dataMyActive.data[0].id === borrowingId, 'Active loans item ID matches');
    assert(dataMyActive.data[0].isOverdue === false, 'Fresh loan isOverdue is false');
    assert(dataMyActive.data[0].daysRemaining >= 13, 'Days remaining computed dynamically');

    // FR-BORROW-004: Patron Borrowing History
    const resHistory = await fetch(`${baseUrl}/api/v1/borrowings/my-history`, {
      headers: { Authorization: `Bearer ${activePatronToken}` },
    });
    const dataHistory = await resHistory.json();
    assert(resHistory.status === 200, 'GET /api/v1/borrowings/my-history returns 200 OK');
    assert(dataHistory.data.length >= 1, 'Borrowing history contains recorded loan');

    // ------------------------------------------------------------------------
    // SECTION 8: Return Workflows & Idempotency (FR-BORROW-002, RC-08, FR-ADMIN-007)
    // ------------------------------------------------------------------------
    console.log('\n--- 8. Return Workflows & Invariant Governance ---');

    // FR-BORROW-002: Patron Self-Service Return
    const resReturn = await fetch(`${baseUrl}/api/v1/borrowings/${borrowingId}/return`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${activePatronToken}` },
    });
    const dataReturn = await resReturn.json();
    assert(resReturn.status === 200, 'POST /api/v1/borrowings/:id/return returns 200 OK');
    assert(dataReturn.status === CirculationStatus.RETURNED, 'Loan status transitioned to RETURNED');
    assert(!!dataReturn.returnDate, 'returnDate timestamp recorded');

    // Verify stock restoration & quota release
    const bookAfterReturn = bookRepo.books.get(bookId)!;
    assert(bookAfterReturn.availableCopies === 5, 'Book availableCopies restored to 5');
    const userAfterReturn = userRepo.users.get(patronId)!;
    assert(userAfterReturn.activeBorrowCount === 0, 'Patron activeBorrowCount restored to 0');

    // Idempotency Specification (RC-08): Double return must return 409 ALREADY_RETURNED
    const resDoubleReturn = await fetch(`${baseUrl}/api/v1/borrowings/${borrowingId}/return`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${activePatronToken}` },
    });
    assert(resDoubleReturn.status === 409, 'Double return rejected with 409 Conflict (ALREADY_RETURNED)');

    // Checkout again to test Admin Return Override
    const resBorrow2 = await fetch(`${baseUrl}/api/v1/borrowings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activePatronToken}`,
      },
      body: JSON.stringify({ bookId }),
    });
    const dataBorrow2 = await resBorrow2.json();
    const borrowingId2 = dataBorrow2.id;

    // Stock Invariant Check (RC-18): Total copies cannot be reduced below active loans
    // Simulate 2 active loans by setting availableCopies to 3 (total 5)
    const targetBook = bookRepo.books.get(bookId)!;
    targetBook.availableCopies = 3;

    // Attempt reducing totalCopies to 1 (which passes min(1) schema validation, but violates invariant 1 < 2 loans)
    const resViolateStock = await fetch(`${baseUrl}/api/v1/admin/books/${bookId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ totalCopies: 1 }),
    });
    assert(resViolateStock.status === 409, 'Reducing totalCopies below active loans rejected with 409 Conflict (RC-18)');

    // Restore availableCopies = 4 (1 active loan) for subsequent tests
    targetBook.availableCopies = 4;


    // Soft-Delete Guard (RC-19): Cannot deactivate book with active outstanding loans
    const resDeactivateActive = await fetch(`${baseUrl}/api/v1/admin/books/${bookId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(resDeactivateActive.status === 409, 'Deactivating book with active loans rejected with 409 Conflict (RC-19)');

    // FR-ADMIN-007: Staff Return Override
    const resOverride = await fetch(`${baseUrl}/api/v1/admin/borrowings/${borrowingId2}/return-override`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ adminRemarks: 'Returned directly to circulation desk by librarian' }),
    });
    const dataOverride = await resOverride.json();
    assert(resOverride.status === 200, 'POST /api/v1/admin/borrowings/:id/return-override returns 200 OK');
    assert(dataOverride.status === CirculationStatus.RETURNED, 'Override returns loan marked RETURNED');
    assert(dataOverride.adminReturnRemarks?.includes('Returned directly'), 'Override records administrative remarks');

    // Now that active loans = 0, deactivate book should succeed
    const resDeactivate = await fetch(`${baseUrl}/api/v1/admin/books/${bookId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(resDeactivate.status === 200, 'DELETE /api/v1/admin/books/:id succeeds when 0 active loans');

    // ------------------------------------------------------------------------
    // SECTION 9: Administrative Oversight (FR-ADMIN-001, 005, 006, 008)
    // ------------------------------------------------------------------------
    console.log('\n--- 9. Administrative Oversight & Audit Delivery Layer ---');

    // FR-ADMIN-006: Global Borrowings Roster
    const resAllBorrowings = await fetch(`${baseUrl}/api/v1/admin/borrowings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataAllBorrowings = await resAllBorrowings.json();
    assert(resAllBorrowings.status === 200, 'GET /api/v1/admin/borrowings returns 200 OK');
    assert(dataAllBorrowings.data.length >= 2, 'Global borrowings list returns all patron records');

    // FR-ADMIN-005: Suspend Patron Account
    const resSuspend = await fetch(`${baseUrl}/api/v1/admin/users/${patronId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: UserStatus.SUSPENDED,
        reason: 'Policy violation and excessive overdue inquiries',
      }),
    });
    const dataSuspend = await resSuspend.json();
    assert(resSuspend.status === 200, 'PATCH /api/v1/admin/users/:id/status returns 200 OK');
    assert(dataSuspend.status === UserStatus.SUSPENDED, 'User status successfully set to SUSPENDED');

    // Verify suspended patron is barred from mutating checkout actions
    const resSuspendedBorrow = await fetch(`${baseUrl}/api/v1/borrowings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activePatronToken}`,
      },
      body: JSON.stringify({ bookId }),
    });
    assert(resSuspendedBorrow.status === 403, 'Suspended patron barred from checkout with 403 Forbidden');

    // FR-ADMIN-001: Executive Dashboard KPIs (RC-20)
    const resKpis = await fetch(`${baseUrl}/api/v1/admin/dashboard/kpis`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataKpis = await resKpis.json();
    assert(resKpis.status === 200, 'GET /api/v1/admin/dashboard/kpis returns 200 OK');
    assert(dataKpis.catalog !== undefined && dataKpis.circulation !== undefined && dataKpis.users !== undefined, 'KPI response contains catalog, circulation, and users aggregates');
    assert(dataKpis.users.suspendedPatrons >= 1, 'KPI records suspended patron count accurately');

    // FR-ADMIN-008: Query Audit Logs (RC-02)
    const resAudit = await fetch(`${baseUrl}/api/v1/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataAudit = await resAudit.json();
    assert(resAudit.status === 200, 'GET /api/v1/admin/audit-logs returns 200 OK');
    assert(Array.isArray(dataAudit.data) && dataAudit.data.length >= 4, 'Audit logs stream returns populated records');

    // FR-AUTH-003: Logout & Cookie Invalidation
    const resLogout = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${activePatronToken}`,
        Cookie: rotatedCookie,
      },
    });
    assert(resLogout.status === 204, 'POST /api/v1/auth/logout returns 204 No Content');

  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    console.log('\n[TEST SERVER] Closed cleanly');
  }

  console.log('\n================================================================');
  console.log(`  STAGE 5 TEST EXECUTION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runStage5Tests().catch((err) => {
  console.error('Fatal Stage 5 Test Runner Error:', err);
  process.exit(1);
});
