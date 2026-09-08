/**
 * Cloud-Native Library Management System (LMS)
 * Stage 10 Automated Security Verification Suite
 *
 * Exercises all 14 mandated security vectors:
 * 1. Authentication bypass attempts (401 Unauthorized)
 * 2. Unauthorized API access (403 Forbidden)
 * 3. RBAC privilege escalation attempts (role tampering blocked)
 * 4. Suspended user restrictions (403 ERR-AUTH-ACCOUNT-SUSPENDED)
 * 5. JWT token tampering (invalid signature / corrupted payload -> 401)
 * 6. Expired JWT handling (expired token -> 401)
 * 7. Refresh token replay attacks (reuse of rotated/revoked token -> 401)
 * 8. Sensitive data exposure (password hashes excluded from all payloads)
 * 9. Password and token leakage prevention (audit logs & responses sanitized)
 * 10. Invalid input handling (Zod schema validation -> RFC 7807 400)
 * 11. Malformed request handling (payloads > 100kb -> 413)
 * 12. CORS configuration (preflight & origin headers)
 * 13. Security headers (Helmet protections)
 * 14. Rate limiting (threshold breaches -> 429 ERR-SEC-RATE-LIMIT)
 */

import http from 'http';
import { AddressInfo } from 'net';
import axios, { AxiosInstance } from 'axios';
import jwt from 'jsonwebtoken';
import { createApp } from '../apps/backend/src/app';
import { env } from '../apps/backend/src/config/env';
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
import { createRateLimiter } from '../apps/backend/src/middleware/rate-limit.middleware';
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
// MOCK REPOSITORIES FOR DETERMINISTIC SECURITY SUITE
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

  public async create(user: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
    const id = (this.idCounter++).toString().padStart(24, '0');
    const now = new Date();
    const created: IUser = {
      ...user,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, created);
    return created;
  }

  public async update(id: string, updates: Partial<IUser>): Promise<IUser | null> {
    const existing = this.users.get(id);
    if (!existing) return null;
    const updated: IUser = { ...existing, ...updates, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
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
      if (u.status === UserStatus.SUSPENDED) suspended++;
    }
    return { total: this.users.size, active, suspended };
  }
}

class MockSessionRepository implements ISessionRepository {
  public sessions: Map<string, ISessionRecord> = new Map();
  private idCounter = 1;

  public async create(session: {
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
  }): Promise<ISessionRecord> {
    const id = (this.idCounter++).toString().padStart(24, '0');
    const record: ISessionRecord = { ...session, id, isRevoked: false };
    this.sessions.set(id, record);
    return record;
  }

  public async findByTokenHash(hash: string): Promise<ISessionRecord | null> {
    for (const s of this.sessions.values()) {
      if (s.tokenHash === hash) return s;
    }
    return null;
  }

  public async revokeById(id: string): Promise<boolean> {
    const s = this.sessions.get(id);
    if (!s) return false;
    s.isRevoked = true;
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
      if (b.isbn === isbn.toUpperCase().trim()) return b;
    }
    return null;
  }

  public async create(data: Omit<IBook, 'id' | 'createdAt' | 'updatedAt'>): Promise<IBook> {
    const id = (this.idCounter++).toString().padStart(24, '0');
    const now = new Date();
    const created: IBook = { ...data, id, createdAt: now, updatedAt: now };
    this.books.set(id, created);
    return created;
  }

  public async update(id: string, updates: Partial<IBook>): Promise<IBook | null> {
    const existing = this.books.get(id);
    if (!existing) return null;
    const updated: IBook = { ...existing, ...updates, updatedAt: new Date() };
    this.books.set(id, updated);
    return updated;
  }

  public async decrementAvailableCopies(id: string): Promise<boolean> {
    const book = this.books.get(id);
    if (!book || book.availableCopies <= 0) return false;
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
    if (!book) return false;
    book.isDeleted = true;
    return true;
  }

  public async search(query: BookSearchQueryDto): Promise<PaginatedResponse<IBookSummary>> {
    const list = Array.from(this.books.values()).filter((b) => !b.isDeleted);
    return {
      data: list.map((b) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        isbn: b.isbn,
        genre: b.genre,
        publicationYear: b.publicationYear,
        availableCopies: b.availableCopies,
        totalCopies: b.totalCopies,
        coverImageUrl: b.coverImageUrl,
      })),
      pagination: {
        page: 1,
        limit: query.limit || 10,
        totalRecords: list.length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
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
      if (
        b.userId === userId &&
        b.bookId === bookId &&
        (b.status === CirculationStatus.ACTIVE || b.status === CirculationStatus.OVERDUE)
      ) {
        return b;
      }
    }
    return null;
  }

  public async countActiveByUserId(userId: string): Promise<number> {
    let count = 0;
    for (const b of this.borrowings.values()) {
      if (
        b.userId === userId &&
        (b.status === CirculationStatus.ACTIVE || b.status === CirculationStatus.OVERDUE)
      ) {
        count++;
      }
    }
    return count;
  }

  public async create(
    borrowing: Omit<IBorrowing, 'id' | 'createdAt' | 'updatedAt' | 'isOverdue'>,
  ): Promise<IBorrowing> {
    const id = (this.idCounter++).toString().padStart(24, '0');
    const now = new Date();
    const created: IBorrowing = {
      ...borrowing,
      id,
      createdAt: now,
      updatedAt: now,
      isOverdue: false,
    };
    this.borrowings.set(id, created);
    return created;
  }

  public async update(id: string, updates: Partial<IBorrowing>): Promise<IBorrowing | null> {
    const existing = this.borrowings.get(id);
    if (!existing) return null;
    const updated: IBorrowing = { ...existing, ...updates, updatedAt: new Date() };
    this.borrowings.set(id, updated);
    return updated;
  }

  public async findActiveByUserId(userId: string): Promise<IBorrowing[]> {
    return Array.from(this.borrowings.values()).filter(
      (b) =>
        b.userId === userId &&
        (b.status === CirculationStatus.ACTIVE || b.status === CirculationStatus.OVERDUE),
    );
  }

  public async findHistoryByUserId(
    userId: string,
    params: PaginationParams,
  ): Promise<PaginatedResponse<IBorrowing>> {
    const list = Array.from(this.borrowings.values()).filter((b) => b.userId === userId);
    return {
      data: list,
      pagination: {
        page: params.page,
        limit: params.limit,
        totalRecords: list.length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }

  public async findAll(params: AdminBorrowingsQueryDto): Promise<PaginatedResponse<IBorrowing>> {
    const list = Array.from(this.borrowings.values());
    return {
      data: list,
      pagination: {
        page: params.page,
        limit: params.limit,
        totalRecords: list.length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }

  public async countActiveAndOverdue(): Promise<CirculationKpiCounts> {
    let activeLoans = 0;
    let overdueLoans = 0;
    const now = new Date();
    for (const b of this.borrowings.values()) {
      if (b.status === CirculationStatus.ACTIVE) {
        if (now > b.dueDate) overdueLoans++;
        else activeLoans++;
      } else if (b.status === CirculationStatus.OVERDUE) {
        overdueLoans++;
      }
    }
    return { activeLoans, overdueLoans };
  }
}

class MockAuditLogRepository implements IAuditLogRepository {
  public logs: IAuditLog[] = [];
  private idCounter = 1;

  public async create(log: Omit<IAuditLog, 'id' | 'timestamp'>): Promise<IAuditLog> {
    const id = (this.idCounter++).toString().padStart(24, '0');
    const created: IAuditLog = { ...log, id, timestamp: new Date() };
    this.logs.push(created);
    return created;
  }

  public async find(query: AuditQueryDto): Promise<PaginatedResponse<IAuditLog>> {
    return {
      data: [...this.logs].reverse(),
      pagination: {
        page: query.page,
        limit: query.limit,
        totalRecords: this.logs.length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }
}

class MockTransactionManager implements ITransactionManager {
  public async withTransaction<T>(operation: () => Promise<T>): Promise<T> {
    return operation();
  }
}

// ============================================================================
// MAIN STAGE 10 SECURITY VALIDATION SUITE
// ============================================================================

async function runSecurityValidationSuite(): Promise<void> {
  console.log('================================================================');
  console.log('  STAGE 10: AUTOMATED SECURITY VERIFICATION SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, description: string): void {
    if (condition) {
      console.log(`  ✓ PASS: ${description}`);
      passedTests++;
    } else {
      console.error(`  ✗ FAIL: ${description}`);
      failedTests++;
    }
  }

  // 1. Instantiate Repositories
  const userRepo = new MockUserRepository();
  const sessionRepo = new MockSessionRepository();
  const bookRepo = new MockBookRepository();
  const borrowingRepo = new MockBorrowingRepository();
  const auditRepo = new MockAuditLogRepository();
  const txManager = new MockTransactionManager();

  // 2. Instantiate Services
  const passwordService = new PasswordService();
  const jwtService = new JwtService();
  const auditService = new AuditService(auditRepo);
  const authService = new AuthService(userRepo, sessionRepo, passwordService, jwtService, auditService);
  const userService = new UserService(userRepo, sessionRepo, txManager, passwordService, auditService);
  const catalogService = new CatalogService(bookRepo);
  const circulationService = new CirculationService(
    borrowingRepo,
    bookRepo,
    userRepo,
    txManager,
    auditService,
  );
  const adminService = new AdminService(bookRepo, borrowingRepo, userRepo, txManager, auditService);

  // 3. Test Rate Limiter Middleware for auth routes
  const testRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 3, // Allow 3 requests per IP window, block on 4th
    skipInTest: false,
  });

  // 4. Controllers & Router
  const authController = new AuthController(authService);
  const userController = new UserController(userService);
  const bookController = new BookController(catalogService);
  const circulationController = new CirculationController(circulationService);
  const adminController = new AdminController(adminService, userService, auditService);

  const authRoutes = createAuthRoutes(authController, testRateLimiter);
  const userRoutes = createUserRoutes(userController);
  const bookRoutes = createBookRoutes(bookController);
  const circulationRoutes = createCirculationRoutes(circulationController);
  const adminRoutes = createAdminRoutes(adminController);

  const apiRouter = createApiRouter({
    auth: authRoutes,
    users: userRoutes,
    books: bookRoutes,
    borrowings: circulationRoutes,
    admin: adminRoutes,
  });

  const app = createApp(apiRouter);
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[SECURITY TEST SERVER] Listening on ${baseUrl}\n`);

  const client: AxiosInstance = axios.create({
    baseURL: baseUrl,
    validateStatus: () => true, // Don't throw on error status codes
    headers: {
      'X-Forwarded-For': '192.168.1.10',
    },
  });

  try {
    // --- 1. Authentication Bypass Attempts ---
    console.log('--- 1. Authentication Bypass Attempts ---');
    const unauthProfile = await client.get('/api/v1/users/profile');
    assert(unauthProfile.status === 401, 'Unauthenticated GET /api/v1/users/profile rejected with 401');
    assert(
      unauthProfile.data.code === 'ERR-AUTH-UNAUTHORIZED',
      'Unauthenticated profile request returns ERR-AUTH-UNAUTHORIZED',
    );

    const unauthLoans = await client.get('/api/v1/borrowings/my-active');
    assert(unauthLoans.status === 401, 'Unauthenticated GET /api/v1/borrowings/my-active rejected with 401');

    const unauthBorrow = await client.post('/api/v1/borrowings', {
      bookId: '000000000000000000000001',
    });
    assert(unauthBorrow.status === 401, 'Unauthenticated POST /api/v1/borrowings rejected with 401');

    // Create a regular patron and an admin for security tests
    const patronPasswordHash = await passwordService.hash('PatronPass123!');
    const adminPasswordHash = await passwordService.hash('AdminPass123!');

    const patronUser = await userRepo.create({
      firstName: 'Security',
      lastName: 'Patron',
      email: 'security.patron@library.test',
      passwordHash: patronPasswordHash,
      role: UserRole.PATRON,
      status: UserStatus.ACTIVE,
      activeBorrowCount: 0,
      phoneNumber: null,
    });

    const adminUser = await userRepo.create({
      firstName: 'Security',
      lastName: 'Admin',
      email: 'security.admin@library.test',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      activeBorrowCount: 0,
      phoneNumber: null,
    });

    const testBook = await bookRepo.create({
      title: 'Security Engineering Principles',
      author: 'Ross Anderson',
      isbn: '9780470068526',
      genre: BookGenre.TECHNOLOGY,
      description: 'Comprehensive guide to building dependable distributed systems.',
      publisher: 'Wiley',
      publicationYear: 2020,
      totalCopies: 5,
      availableCopies: 5,
      location: { floor: 2, aisle: 'A', shelf: '1' },
      coverImageUrl: null,
      isDeleted: false,
    });

    const patronToken = jwtService.generateAccessToken({
      sub: patronUser.id,
      email: patronUser.email,
      role: UserRole.PATRON,
      status: UserStatus.ACTIVE,
    });

    const adminToken = jwtService.generateAccessToken({
      sub: adminUser.id,
      email: adminUser.email,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });

    // --- 2. Unauthorized API Access & RBAC Controls ---
    console.log('\n--- 2. Unauthorized API Access & RBAC Controls ---');
    const patronToAdminKpis = await client.get('/api/v1/admin/dashboard/kpis', {
      headers: { Authorization: `Bearer ${patronToken}` },
    });
    assert(
      patronToAdminKpis.status === 403,
      'Patron token accessing GET /api/v1/admin/dashboard/kpis rejected with 403',
    );
    assert(
      patronToAdminKpis.data.code === 'ERR-AUTH-FORBIDDEN',
      'Patron access to admin endpoint returns ERR-AUTH-FORBIDDEN',
    );

    const patronToAdminBooks = await client.post(
      '/api/v1/admin/books',
      {
        title: 'Unauthorized Title',
        author: 'Unknown',
        isbn: '9780000000000',
        genre: 'TECHNOLOGY',
        description: 'Test',
        publisher: 'Test',
        publicationYear: 2024,
        totalCopies: 5,
        location: { floor: 1, aisle: 'A', shelf: '1' },
      },
      { headers: { Authorization: `Bearer ${patronToken}` } },
    );
    assert(
      patronToAdminBooks.status === 403,
      'Patron token invoking POST /api/v1/admin/books rejected with 403',
    );

    const patronToAdminAuditLogs = await client.get('/api/v1/admin/audit-logs', {
      headers: { Authorization: `Bearer ${patronToken}` },
    });
    assert(
      patronToAdminAuditLogs.status === 403,
      'Patron token invoking GET /api/v1/admin/audit-logs rejected with 403',
    );

    const adminToAdminKpis = await client.get('/api/v1/admin/dashboard/kpis', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminToAdminKpis.status === 200, 'Admin token accessing admin dashboard succeeds with 200 OK');

    // --- 3. Privilege Escalation Prevention ---
    console.log('\n--- 3. Privilege Escalation Prevention ---');
    const escalateRegister = await client.post('/api/v1/auth/register', {
      firstName: 'Hacker',
      lastName: 'User',
      email: 'hacker@library.test',
      password: 'HackerPassword123!',
      role: 'ROLE_ADMIN', // Attempt privilege escalation
    });
    assert(
      escalateRegister.status === 201,
      'Self-registration endpoint processes valid user creation parameters',
    );
    const registeredUser = await userRepo.findByEmail('hacker@library.test');
    assert(
      registeredUser?.role === UserRole.PATRON,
      'Server enforces ROLE_PATRON default regardless of client role payload',
    );

    // --- 4. Suspended User Restrictions ---
    console.log('\n--- 4. Suspended User Restrictions ---');
    const suspendedUser = await userRepo.create({
      firstName: 'Suspended',
      lastName: 'User',
      email: 'suspended.user@library.test',
      passwordHash: patronPasswordHash,
      role: UserRole.PATRON,
      status: UserStatus.SUSPENDED,
      activeBorrowCount: 0,
      phoneNumber: null,
    });

    const suspendedToken = jwtService.generateAccessToken({
      sub: suspendedUser.id,
      email: suspendedUser.email,
      role: UserRole.PATRON,
      status: UserStatus.SUSPENDED,
    });

    const suspendedBorrowAttempt = await client.post(
      '/api/v1/borrowings',
      { bookId: testBook.id },
      { headers: { Authorization: `Bearer ${suspendedToken}` } },
    );
    assert(
      suspendedBorrowAttempt.status === 403,
      'Suspended patron checkout blocked with 403 Forbidden',
    );
    assert(
      suspendedBorrowAttempt.data.code === 'ERR-AUTH-ACCOUNT-SUSPENDED',
      'Suspended patron receives ERR-AUTH-ACCOUNT-SUSPENDED problem details',
    );

    // --- 5. JWT Token Tampering ---
    console.log('\n--- 5. JWT Token Tampering ---');
    const parts = patronToken.split('.');
    const tamperedSignature = parts[0] + '.' + parts[1] + '.TAMPEREDSIGNATURE';
    const tamperedRes = await client.get('/api/v1/users/profile', {
      headers: { Authorization: `Bearer ${tamperedSignature}` },
    });
    assert(tamperedRes.status === 401, 'Tampered JWT signature rejected with 401 Unauthorized');
    assert(
      tamperedRes.data.code === 'ERR-AUTH-INVALID-TOKEN',
      'Tampered token returns ERR-AUTH-INVALID-TOKEN',
    );

    const decoded = jwt.decode(patronToken) as Record<string, unknown>;
    const alteredPayload = Buffer.from(
      JSON.stringify({ ...decoded, role: 'ROLE_ADMIN' }),
    ).toString('base64url');
    const tamperedPayloadToken = `${parts[0]}.${alteredPayload}.${parts[2]}`;
    const tamperedPayloadRes = await client.get('/api/v1/users/profile', {
      headers: { Authorization: `Bearer ${tamperedPayloadToken}` },
    });
    assert(
      tamperedPayloadRes.status === 401,
      'Altered JWT payload rejected with 401 Unauthorized due to signature mismatch',
    );

    // --- 6. Expired JWT Handling ---
    console.log('\n--- 6. Expired JWT Handling ---');
    const expiredToken = jwt.sign(
      {
        sub: patronUser.id,
        email: patronUser.email,
        role: UserRole.PATRON,
        status: UserStatus.ACTIVE,
      },
      env.JWT_SECRET,
      { expiresIn: '-10s' },
    );

    const expiredRes = await client.get('/api/v1/users/profile', {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    assert(expiredRes.status === 401, 'Expired JWT rejected with 401 Unauthorized');
    assert(
      expiredRes.data.code === 'ERR-AUTH-TOKEN-EXPIRED',
      'Expired JWT returns ERR-AUTH-TOKEN-EXPIRED',
    );

    // --- 7. Refresh Token Replay Attacks ---
    console.log('\n--- 7. Refresh Token Replay Attacks ---');
    // Use fresh IP so rate limiter is unaffected
    const replayClient = axios.create({
      baseURL: baseUrl,
      validateStatus: () => true,
      headers: { 'X-Forwarded-For': '192.168.2.20' },
    });

    const loginRes = await replayClient.post('/api/v1/auth/login', {
      email: patronUser.email,
      password: 'PatronPass123!',
    });
    assert(loginRes.status === 200, 'Login returns 200 OK');
    const refreshCookieHeader = loginRes.headers['set-cookie']?.[0] || '';
    const refreshTokenMatch = refreshCookieHeader.match(/refreshToken=([^;]+)/);
    const refreshToken = refreshTokenMatch ? refreshTokenMatch[1] : '';

    // First rotation succeeds
    const firstRefresh = await replayClient.post(
      '/api/v1/auth/refresh',
      {},
      { headers: { Cookie: `refreshToken=${refreshToken}` } },
    );
    assert(firstRefresh.status === 200, 'Initial single-use refresh token exchange succeeds with 200 OK');

    // Replay attack with same old refresh token must trigger security alert & family revocation
    const replayRefresh = await replayClient.post(
      '/api/v1/auth/refresh',
      {},
      { headers: { Cookie: `refreshToken=${refreshToken}` } },
    );
    assert(
      replayRefresh.status === 401,
      'Replay attack with consumed refresh token rejected with 401 Unauthorized',
    );
    assert(
      replayRefresh.data.code === 'ERR-AUTH-REPLAY-DETECTED',
      'Replayed refresh token triggers ERR-AUTH-REPLAY-DETECTED',
    );

    // --- 8. Sensitive Data Exposure ---
    console.log('\n--- 8. Sensitive Data Exposure ---');
    const profileRes = await client.get('/api/v1/users/profile', {
      headers: { Authorization: `Bearer ${patronToken}` },
    });
    assert(profileRes.status === 200, 'GET /api/v1/users/profile returns 200 OK');
    const profileData = profileRes.data;
    assert(
      profileData.passwordHash === undefined,
      'User profile response omits passwordHash field',
    );
    assert(
      profileData.password === undefined,
      'User profile response omits password field',
    );
    assert(
      profileData.__v === undefined,
      'User profile response omits internal MongoDB version (__v)',
    );

    // --- 9. Password and Token Leakage Prevention in Audit Logs ---
    console.log('\n--- 9. Password and Token Leakage Prevention ---');
    const auditLogs = auditRepo.logs;
    let foundLeakedPassword = false;
    let foundLeakedToken = false;
    for (const log of auditLogs) {
      const serialized = JSON.stringify(log);
      if (
        serialized.includes('PatronPass123!') ||
        serialized.includes('AdminPass123!') ||
        serialized.includes('HackerPassword123!')
      ) {
        foundLeakedPassword = true;
      }
      if (serialized.includes('eyJhbGciOi')) {
        foundLeakedToken = true;
      }
    }
    assert(!foundLeakedPassword, 'Audit log trail contains 0 plaintext passwords');
    assert(!foundLeakedToken, 'Audit log trail contains 0 exposed JWT bearer tokens');

    // --- 10. Invalid Input Handling (Zod & RFC 7807) ---
    console.log('\n--- 10. Invalid Input Handling ---');
    const invalidClient = axios.create({
      baseURL: baseUrl,
      validateStatus: () => true,
      headers: { 'X-Forwarded-For': '192.168.3.30' },
    });

    const invalidLogin = await invalidClient.post('/api/v1/auth/login', {
      email: 'not-an-email',
      password: '',
    });
    assert(invalidLogin.status === 400, 'Invalid login input rejected with 400 Bad Request');
    assert(
      invalidLogin.data.code === 'ERR-VAL-INVALID-INPUT',
      'Invalid input returns RFC 7807 ERR-VAL-INVALID-INPUT',
    );
    assert(
      Array.isArray(invalidLogin.data.invalidParams),
      'Validation failure returns array of invalidParams',
    );

    const invalidObjectId = await client.get('/api/v1/books/invalid-id-format');
    assert(
      invalidObjectId.status === 400,
      'Invalid 24-character ObjectId parameter rejected with 400 Bad Request',
    );

    // --- 11. Malformed Request Handling (100kb Payload Limit) ---
    console.log('\n--- 11. Malformed Request Handling ---');
    const oversizedString = 'x'.repeat(1024 * 110); // 110kb > 100kb limit
    const oversizedRes = await client.post(
      '/api/v1/auth/login',
      { email: 'test@library.test', password: oversizedString },
      { headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '192.168.4.40' } },
    );
    assert(
      oversizedRes.status === 413,
      'Payload exceeding 100kb rejected with 413 Payload Too Large',
    );

    // --- 12. CORS Configuration ---
    console.log('\n--- 12. CORS Configuration ---');
    const corsPreflight = await client.options('/api/v1/books', {
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
      },
    });
    assert(corsPreflight.status === 204, 'CORS preflight OPTIONS returns 204 No Content');
    assert(
      corsPreflight.headers['access-control-allow-origin'] === 'http://localhost:5173',
      'CORS responds with allowed origin http://localhost:5173',
    );
    assert(
      corsPreflight.headers['access-control-allow-credentials'] === 'true',
      'CORS credentials support enabled',
    );

    // --- 13. Security Headers (Helmet) ---
    console.log('\n--- 13. Security Headers (Helmet) ---');
    const headersRes = await client.get('/healthz');
    assert(
      headersRes.headers['x-dns-prefetch-control'] === 'off',
      'Helmet sets X-DNS-Prefetch-Control: off',
    );
    assert(
      headersRes.headers['x-frame-options'] === 'SAMEORIGIN',
      'Helmet sets X-Frame-Options: SAMEORIGIN',
    );
    assert(
      headersRes.headers['x-content-type-options'] === 'nosniff',
      'Helmet sets X-Content-Type-Options: nosniff',
    );

    // --- 14. Rate Limiting Verification ---
    console.log('\n--- 14. Rate Limiting Verification ---');
    const rateClient = axios.create({
      baseURL: baseUrl,
      validateStatus: () => true,
      headers: {
        'X-Forwarded-For': '198.51.100.99',
      },
    });

    const r1 = await rateClient.post('/api/v1/auth/login', {
      email: 'nonexistent1@test.com',
      password: 'Pass123!Password',
    });
    const r2 = await rateClient.post('/api/v1/auth/login', {
      email: 'nonexistent2@test.com',
      password: 'Pass123!Password',
    });
    const r3 = await rateClient.post('/api/v1/auth/login', {
      email: 'nonexistent3@test.com',
      password: 'Pass123!Password',
    });
    const r4 = await rateClient.post('/api/v1/auth/login', {
      email: 'nonexistent4@test.com',
      password: 'Pass123!Password',
    });

    assert(r1.status === 401, 'Rate limit attempt 1 executed normally (401 invalid creds)');
    assert(r2.status === 401, 'Rate limit attempt 2 executed normally');
    assert(r3.status === 401, 'Rate limit attempt 3 executed normally');
    assert(r4.status === 429, 'Rate limit attempt 4 triggers 429 Too Many Requests');
    assert(
      r4.data.code === 'ERR-SEC-RATE-LIMIT',
      'Rate limit breach returns ERR-SEC-RATE-LIMIT problem details',
    );
    assert(
      r4.headers['retry-after'] !== undefined,
      'Rate limit response includes standard Retry-After header',
    );

    console.log('\n================================================================');
    console.log(`  STAGE 10 SECURITY SUITE: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('================================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
  } finally {
    server.close();
    console.log('[SECURITY TEST SERVER] Closed cleanly\n');
  }
}

runSecurityValidationSuite().catch((err) => {
  console.error('Fatal error in Stage 10 security suite:', err);
  process.exit(1);
});
