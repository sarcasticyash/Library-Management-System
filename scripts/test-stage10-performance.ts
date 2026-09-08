/**
 * Cloud-Native Library Management System (LMS)
 * Stage 10 Automated API Performance Benchmark Suite
 *
 * Benchmarks the 5 critical production API endpoints under concurrent workloads:
 * 1. GET /api/v1/books (Catalog search & faceted filtering)
 * 2. GET /api/v1/books/:bookId (Book detail retrieval)
 * 3. POST /api/v1/auth/login (Bcrypt credential verification & JWT emission)
 * 4. GET /api/v1/borrowings/my-active (Active loan quota meter & dynamic overdue computation)
 * 5. GET /api/v1/admin/dashboard/kpis (Cross-collection multi-aggregate analytics)
 *
 * Metrics measured:
 * - Minimum, Average, p50, p95, p99, and Maximum Latencies (ms)
 * - Error rate (target: 0%)
 * - Throughput (Requests per Second)
 */

import http from 'http';
import { AddressInfo } from 'net';
import { performance } from 'perf_hooks';
import axios, { AxiosInstance } from 'axios';
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
// IN-MEMORY REPOSITORIES PRE-SEEDED WITH DATA
// ============================================================================

class PerfUserRepository implements IUserRepository {
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
    const created: IUser = { ...user, id, createdAt: now, updatedAt: now };
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

class PerfSessionRepository implements ISessionRepository {
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

class PerfBookRepository implements IBookRepository {
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
    let list = Array.from(this.books.values()).filter((b) => !b.isDeleted);
    if (query.q) {
      const q = query.q.toLowerCase();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.isbn.toLowerCase().includes(q),
      );
    }
    if (query.genre) {
      list = list.filter((b) => b.genre === query.genre);
    }
    if (query.available) {
      list = list.filter((b) => b.availableCopies > 0);
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);
    const totalPages = Math.ceil(list.length / limit) || 1;

    return {
      data: paginated.map((b) => ({
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
        page,
        limit,
        totalRecords: list.length,
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

class PerfBorrowingRepository implements IBorrowingRepository {
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

class PerfAuditLogRepository implements IAuditLogRepository {
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

class PerfTransactionManager implements ITransactionManager {
  public async withTransaction<T>(operation: () => Promise<T>): Promise<T> {
    return operation();
  }
}

// ============================================================================
// PERFORMANCE BENCHMARK HARNESS
// ============================================================================

interface EndpointBenchmarkResult {
  endpoint: string;
  method: string;
  totalRequests: number;
  concurrency: number;
  successCount: number;
  errorCount: number;
  errorRatePercent: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  meanLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  throughputRps: number;
}

function computePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))] ?? 0;
}

async function benchmarkEndpoint(
  name: string,
  totalRequests: number,
  concurrency: number,
  requestFn: () => Promise<{ status: number }>,
): Promise<EndpointBenchmarkResult> {
  const latencies: number[] = [];
  let successCount = 0;
  let errorCount = 0;

  const totalBatches = Math.ceil(totalRequests / concurrency);
  const wallStartTime = performance.now();

  for (let b = 0; b < totalBatches; b++) {
    const currentBatchSize = Math.min(concurrency, totalRequests - b * concurrency);
    const promises: Promise<void>[] = [];

    for (let i = 0; i < currentBatchSize; i++) {
      promises.push(
        (async () => {
          const start = performance.now();
          try {
            const res = await requestFn();
            const elapsed = performance.now() - start;
            latencies.push(elapsed);
            if (res.status >= 200 && res.status < 400) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch {
            const elapsed = performance.now() - start;
            latencies.push(elapsed);
            errorCount++;
          }
        })(),
      );
    }

    await Promise.all(promises);
  }

  const wallDurationMs = performance.now() - wallStartTime;
  latencies.sort((a, b) => a - b);

  const minLatencyMs = latencies[0] ?? 0;
  const maxLatencyMs = latencies[latencies.length - 1] ?? 0;
  const sumLatency = latencies.reduce((acc, v) => acc + v, 0);
  const meanLatencyMs = latencies.length > 0 ? sumLatency / latencies.length : 0;
  const p50LatencyMs = computePercentile(latencies, 50);
  const p95LatencyMs = computePercentile(latencies, 95);
  const p99LatencyMs = computePercentile(latencies, 99);
  const throughputRps = wallDurationMs > 0 ? (totalRequests / (wallDurationMs / 1000)) : 0;

  const [method, ...endpointParts] = name.split(' ');
  const endpoint = endpointParts.join(' ');

  return {
    endpoint,
    method: method ?? 'GET',
    totalRequests,
    concurrency,
    successCount,
    errorCount,
    errorRatePercent: (errorCount / totalRequests) * 100,
    minLatencyMs: Number(minLatencyMs.toFixed(2)),
    maxLatencyMs: Number(maxLatencyMs.toFixed(2)),
    meanLatencyMs: Number(meanLatencyMs.toFixed(2)),
    p50LatencyMs: Number(p50LatencyMs.toFixed(2)),
    p95LatencyMs: Number(p95LatencyMs.toFixed(2)),
    p99LatencyMs: Number(p99LatencyMs.toFixed(2)),
    throughputRps: Number(throughputRps.toFixed(1)),
  };
}

// ============================================================================
// MAIN PERFORMANCE BENCHMARK RUNNER
// ============================================================================

async function runPerformanceTestSuite(): Promise<void> {
  console.log('================================================================');
  console.log('  STAGE 10: AUTOMATED API PERFORMANCE BENCHMARK SUITE');
  console.log('================================================================\n');

  // 1. Initialize Repositories
  const userRepo = new PerfUserRepository();
  const sessionRepo = new PerfSessionRepository();
  const bookRepo = new PerfBookRepository();
  const borrowingRepo = new PerfBorrowingRepository();
  const auditRepo = new PerfAuditLogRepository();
  const txManager = new PerfTransactionManager();

  // 2. Pre-seed 100 Books
  const genres = Object.values(BookGenre);
  for (let i = 1; i <= 100; i++) {
    await bookRepo.create({
      title: `High Performance System Architecture Vol. ${i}`,
      author: `Distinguished Engineer ${i % 10}`,
      isbn: `9780000000${i.toString().padStart(3, '0')}`,
      genre: genres[i % genres.length] || BookGenre.TECHNOLOGY,
      description: `Comprehensive reference manual on scalable cloud infrastructure, volume ${i}.`,
      publisher: 'Cloud Engineering Press',
      publicationYear: 2015 + (i % 10),
      totalCopies: 10,
      availableCopies: 8,
      location: { floor: (i % 3) + 1, aisle: 'B', shelf: `${(i % 5) + 1}` },
      coverImageUrl: null,
      isDeleted: false,
    });
  }

  // 3. Pre-seed Users & Borrowings
  const passwordService = new PasswordService(10); // Use 10 rounds for rapid, realistic benchmark
  const jwtService = new JwtService();
  const auditService = new AuditService(auditRepo);

  const patronHash = await passwordService.hash('PatronPassword123!');
  const adminHash = await passwordService.hash('AdminPassword123!');

  const testPatron = await userRepo.create({
    firstName: 'Performance',
    lastName: 'Tester',
    email: 'perf.patron@library.test',
    passwordHash: patronHash,
    role: UserRole.PATRON,
    status: UserStatus.ACTIVE,
    activeBorrowCount: 3,
    phoneNumber: '+15550100',
  });

  const testAdmin = await userRepo.create({
    firstName: 'System',
    lastName: 'Administrator',
    email: 'perf.admin@library.test',
    passwordHash: adminHash,
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    activeBorrowCount: 0,
    phoneNumber: null,
  });

  // Pre-seed 3 active borrowings for the patron
  const now = new Date();
  const due = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  for (let i = 1; i <= 3; i++) {
    await borrowingRepo.create({
      userId: testPatron.id,
      bookId: i.toString().padStart(24, '0'),
      borrowDate: now,
      dueDate: due,
      returnDate: null,
      status: CirculationStatus.ACTIVE,
      adminRemarks: null,
    });
  }

  // 4. Setup Services, Controllers, and App
  const authService = new AuthService(userRepo, sessionRepo, passwordService, jwtService, auditService);
  const userService = new UserService(userRepo, sessionRepo, txManager, passwordService, auditService);
  const catalogService = new CatalogService(bookRepo);
  const circulationService = new CirculationService(borrowingRepo, bookRepo, userRepo, txManager, auditService);
  const adminService = new AdminService(bookRepo, borrowingRepo, userRepo, txManager, auditService);

  // Rate limiter bypassed for performance tests via skipInTest
  const noopRateLimiter = createRateLimiter({ skipInTest: true });

  const authController = new AuthController(authService);
  const userController = new UserController(userService);
  const bookController = new BookController(catalogService);
  const circulationController = new CirculationController(circulationService);
  const adminController = new AdminController(adminService, userService, auditService);

  const authRoutes = createAuthRoutes(authController, noopRateLimiter);
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
  console.log(`[PERFORMANCE BENCHMARK SERVER] Listening on ${baseUrl}`);
  console.log(`[SEEDED DATA] 100 Books, 2 Users, 3 Active Loans\n`);

  const client: AxiosInstance = axios.create({
    baseURL: baseUrl,
    validateStatus: () => true,
  });

  const patronToken = jwtService.generateAccessToken({
    sub: testPatron.id,
    email: testPatron.email,
    role: UserRole.PATRON,
    status: UserStatus.ACTIVE,
  });

  const adminToken = jwtService.generateAccessToken({
    sub: testAdmin.id,
    email: testAdmin.email,
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
  });

  const results: EndpointBenchmarkResult[] = [];

  try {
    // ------------------------------------------------------------------------
    // Benchmark 1: GET /api/v1/books
    // ------------------------------------------------------------------------
    console.log('Running Benchmark 1: GET /api/v1/books (100 requests, concurrency 20)...');
    const b1 = await benchmarkEndpoint('GET /api/v1/books', 100, 20, () =>
      client.get('/api/v1/books?q=Architecture&limit=10'),
    );
    results.push(b1);

    // ------------------------------------------------------------------------
    // Benchmark 2: GET /api/v1/books/:bookId
    // ------------------------------------------------------------------------
    console.log('Running Benchmark 2: GET /api/v1/books/:bookId (100 requests, concurrency 20)...');
    const targetBookId = '000000000000000000000001';
    const b2 = await benchmarkEndpoint('GET /api/v1/books/:bookId', 100, 20, () =>
      client.get(`/api/v1/books/${targetBookId}`),
    );
    results.push(b2);

    // ------------------------------------------------------------------------
    // Benchmark 3: POST /api/v1/auth/login
    // ------------------------------------------------------------------------
    console.log('Running Benchmark 3: POST /api/v1/auth/login (50 requests, concurrency 10)...');
    const b3 = await benchmarkEndpoint('POST /api/v1/auth/login', 50, 10, () =>
      client.post('/api/v1/auth/login', {
        email: testPatron.email,
        password: 'PatronPassword123!',
      }),
    );
    results.push(b3);

    // ------------------------------------------------------------------------
    // Benchmark 4: GET /api/v1/borrowings/my-active
    // ------------------------------------------------------------------------
    console.log('Running Benchmark 4: GET /api/v1/borrowings/my-active (100 requests, concurrency 20)...');
    const b4 = await benchmarkEndpoint('GET /api/v1/borrowings/my-active', 100, 20, () =>
      client.get('/api/v1/borrowings/my-active', {
        headers: { Authorization: `Bearer ${patronToken}` },
      }),
    );
    results.push(b4);

    // ------------------------------------------------------------------------
    // Benchmark 5: GET /api/v1/admin/dashboard/kpis
    // ------------------------------------------------------------------------
    console.log('Running Benchmark 5: GET /api/v1/admin/dashboard/kpis (100 requests, concurrency 20)...');
    const b5 = await benchmarkEndpoint('GET /api/v1/admin/dashboard/kpis', 100, 20, () =>
      client.get('/api/v1/admin/dashboard/kpis', {
        headers: { Authorization: `Bearer ${adminToken}` },
      }),
    );
    results.push(b5);

    // ------------------------------------------------------------------------
    // Display Formatted Benchmark Results Table
    // ------------------------------------------------------------------------
    console.log('\n================================================================================================================');
    console.log('                                  STAGE 10 API PERFORMANCE BENCHMARK REPORT');
    console.log('================================================================================================================');
    console.log(
      'Endpoint'.padEnd(35) +
      'Requests'.padStart(10) +
      'Conc'.padStart(6) +
      'Err %'.padStart(8) +
      'Min(ms)'.padStart(10) +
      'Avg(ms)'.padStart(10) +
      'p50(ms)'.padStart(10) +
      'p95(ms)'.padStart(10) +
      'p99(ms)'.padStart(10) +
      'Req/s'.padStart(10)
    );
    console.log('----------------------------------------------------------------------------------------------------------------');

    let allPassed = true;
    for (const r of results) {
      const line =
        `${r.method} ${r.endpoint}`.padEnd(35) +
        r.totalRequests.toString().padStart(10) +
        r.concurrency.toString().padStart(6) +
        `${r.errorRatePercent.toFixed(1)}%`.padStart(8) +
        r.minLatencyMs.toFixed(2).padStart(10) +
        r.meanLatencyMs.toFixed(2).padStart(10) +
        r.p50LatencyMs.toFixed(2).padStart(10) +
        r.p95LatencyMs.toFixed(2).padStart(10) +
        r.p99LatencyMs.toFixed(2).padStart(10) +
        r.throughputRps.toFixed(1).padStart(10);
      console.log(line);

      if (r.errorRatePercent > 0) {
        allPassed = false;
      }
    }
    console.log('================================================================================================================\n');

    if (allPassed) {
      console.log('  ✓ ALL 5 CRITICAL ENDPOINTS PASSED PERFORMANCE BENCHMARKS WITH 0% ERROR RATE\n');
    } else {
      console.error('  ✗ SOME ENDPOINTS EXPERIENCED ERRORS UNDER LOAD\n');
      process.exit(1);
    }
  } finally {
    server.close();
    console.log('[PERFORMANCE BENCHMARK SERVER] Closed cleanly\n');
  }
}

runPerformanceTestSuite().catch((err) => {
  console.error('Fatal error in performance benchmark suite:', err);
  process.exit(1);
});
