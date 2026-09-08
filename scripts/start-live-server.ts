/**
 * Cloud-Native Library Management System (LMS)
 * Interactive Live Backend Dev Server for Manual & E2E Verification
 *
 * Pre-populates:
 * - Admin Account: admin@lms.local / Admin123!Secure
 * - Patron Account: patron@lms.local / Patron123!Secure
 * - 6 Comprehensive Catalog Titles with inventory
 * - Pre-existing active borrowing for patron loan verification
 *
 * Serves canonical REST API at http://localhost:3000/api/v1
 */

import http from 'http';
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
// IN-MEMORY REPOSITORIES
// ============================================================================

class LiveUserRepository implements IUserRepository {
  public users: Map<string, IUser> = new Map();
  private idCounter = 10;

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

  public async updateStatus(id: string, status: UserStatus): Promise<IUser | null> {
    const user = this.users.get(id);
    if (!user) return null;
    user.status = status;
    user.updatedAt = new Date();
    return user;
  }

  public async updatePassword(id: string, passwordHash: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    user.passwordHash = passwordHash;
    user.updatedAt = new Date();
    return true;
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

class LiveSessionRepository implements ISessionRepository {
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

class LiveBookRepository implements IBookRepository {
  public books: Map<string, IBook> = new Map();
  private idCounter = 10;

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
      list = list.filter((b) => b.genre.toLowerCase() === query.genre?.toLowerCase());
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

class LiveBorrowingRepository implements IBorrowingRepository {
  public borrowings: Map<string, IBorrowing> = new Map();
  private idCounter = 10;

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

  public async markReturned(
    id: string,
    returnDate: Date,
    returnedBy: string,
    adminRemarks?: string | null,
  ): Promise<IBorrowing | null> {
    const existing = this.borrowings.get(id);
    if (!existing) return null;
    const updated: IBorrowing = {
      ...existing,
      status: CirculationStatus.RETURNED,
      returnDate,
      returnedBy: returnedBy as unknown as CirculationStatus,
      adminRemarks: adminRemarks || existing.adminRemarks,
      updatedAt: new Date(),
    };
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

class LiveAuditLogRepository implements IAuditLogRepository {
  public logs: IAuditLog[] = [];
  private idCounter = 1;

  public async create(log: Omit<IAuditLog, 'id' | 'timestamp'>): Promise<IAuditLog> {
    const id = (this.idCounter++).toString().padStart(24, '0');
    const created: IAuditLog = { ...log, id, timestamp: new Date() };
    this.logs.push(created);
    return created;
  }

  public async query(params: AuditQueryDto): Promise<PaginatedResponse<IAuditLog>> {
    const list = [...this.logs].reverse();
    return {
      data: list.slice(0, params.limit || 10),
      pagination: {
        page: params.page || 1,
        limit: params.limit || 10,
        totalRecords: list.length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }
}

class LiveTransactionManager implements ITransactionManager {
  public async startSession(): Promise<any> {
    return {} as any;
  }

  public async withTransaction<T>(operation: (session: any) => Promise<T>): Promise<T> {
    return operation({} as any);
  }
}

async function startLiveServer() {
  console.log('>>> Initializing LMS Live Server with Seed Data...');

  const passService = new PasswordService();
  const jwtService = new JwtService();

  const userRepo = new LiveUserRepository();
  const sessionRepo = new LiveSessionRepository();
  const bookRepo = new LiveBookRepository();
  const borrowingRepo = new LiveBorrowingRepository();
  const auditRepo = new LiveAuditLogRepository();
  const txManager = new LiveTransactionManager();

  // 1. Seed Accounts
  const adminPassHash = await passService.hash('Admin123!Secure');
  const patronPassHash = await passService.hash('Patron123!Secure');

  const adminId = '000000000000000000000001';
  const patronId = '000000000000000000000002';

  userRepo.users.set(adminId, {
    id: adminId,
    email: 'admin@lms.local',
    passwordHash: adminPassHash,
    role: UserRole.ADMIN,
    firstName: 'System',
    lastName: 'Administrator',
    status: UserStatus.ACTIVE,
    activeBorrowCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  userRepo.users.set(patronId, {
    id: patronId,
    email: 'patron@lms.local',
    passwordHash: patronPassHash,
    role: UserRole.PATRON,
    firstName: 'Alex',
    lastName: 'Patron',
    status: UserStatus.ACTIVE,
    activeBorrowCount: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 2. Seed Books
  const seedBooks: Array<Omit<IBook, 'createdAt' | 'updatedAt'>> = [
    {
      id: '000000000000000000000001',
      title: 'Designing Data-Intensive Applications',
      author: 'Martin Kleppmann',
      isbn: '9781449373320',
      genre: BookGenre.TECHNOLOGY,
      description: 'The big ideas behind reliable, scalable, and maintainable systems.',
      publicationYear: 2017,
      totalCopies: 5,
      availableCopies: 4,
      location: { aisle: 'A3', shelf: 'S2' },
      isDeleted: false,
    },
    {
      id: '000000000000000000000002',
      title: 'Clean Architecture: A Craftsman Guide',
      author: 'Robert C. Martin',
      isbn: '9780134494166',
      genre: BookGenre.TECHNOLOGY,
      description: 'A Craftsman Guide to Software Structure and Design.',
      publicationYear: 2017,
      totalCopies: 4,
      availableCopies: 4,
      location: { aisle: 'B1', shelf: 'S4' },
      isDeleted: false,
    },
    {
      id: '000000000000000000000003',
      title: 'Site Reliability Engineering',
      author: 'Betsy Beyer',
      isbn: '9781491929124',
      genre: BookGenre.TECHNOLOGY,
      description: 'How Google Runs Production Systems.',
      publicationYear: 2016,
      totalCopies: 3,
      availableCopies: 3,
      location: { aisle: 'C2', shelf: 'S1' },
      isDeleted: false,
    },
    {
      id: '000000000000000000000004',
      title: 'Building Microservices: Designing Fine-Grained Systems',
      author: 'Sam Newman',
      isbn: '9781492034025',
      genre: BookGenre.TECHNOLOGY,
      description: 'Distributed architecture principles and practical microservice design.',
      publicationYear: 2021,
      totalCopies: 4,
      availableCopies: 4,
      location: { aisle: 'B2', shelf: 'S3' },
      isDeleted: false,
    },
    {
      id: '000000000000000000000005',
      title: 'Database Internals',
      author: 'Alex Petrov',
      isbn: '9781492040347',
      genre: BookGenre.TECHNOLOGY,
      description: 'A deep dive into how distributed data storage engines work.',
      publicationYear: 2019,
      totalCopies: 3,
      availableCopies: 3,
      location: { aisle: 'A1', shelf: 'S1' },
      isDeleted: false,
    },
  ];

  for (const b of seedBooks) {
    bookRepo.books.set(b.id, { ...b, createdAt: new Date(), updatedAt: new Date() });
  }

  // 3. Seed 1 Active Loan for Patron
  const loanId = '000000000000000000000001';
  borrowingRepo.borrowings.set(loanId, {
    id: loanId,
    userId: patronId,
    bookId: '000000000000000000000001',
    bookTitle: 'Designing Data-Intensive Applications',
    borrowDate: new Date(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    status: CirculationStatus.ACTIVE,
    isOverdue: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Services
  const audit = new AuditService(auditRepo);
  const authService = new AuthService(userRepo, sessionRepo, passService, jwtService, audit);
  const userService = new UserService(userRepo, sessionRepo, txManager, passService, audit);
  const catalogService = new CatalogService(bookRepo, borrowingRepo, txManager, audit);
  const circService = new CirculationService(borrowingRepo, bookRepo, userRepo, txManager, audit);
  const adminService = new AdminService(bookRepo, borrowingRepo, userRepo, txManager, audit);

  // Controllers
  const authCtrl = new AuthController(authService);
  const userCtrl = new UserController(userService);
  const bookCtrl = new BookController(catalogService);
  const circCtrl = new CirculationController(circService);
  const adminCtrl = new AdminController(adminService, userService, audit);

  const apiRouter = createApiRouter({
    auth: createAuthRoutes(authCtrl),
    users: createUserRoutes(userCtrl),
    books: createBookRoutes(bookCtrl),
    borrowings: createCirculationRoutes(circCtrl),
    admin: createAdminRoutes(adminCtrl),
  });

  const app = createApp(apiRouter);
  const server = http.createServer(app);

  server.listen(3000, () => {
    console.log('================================================================');
    console.log('🚀 LMS LIVE BACKEND SERVER LISTENING ON http://localhost:3000');
    console.log('   Canonical API: http://localhost:3000/api/v1');
    console.log('   Admin: admin@lms.local / Admin123!Secure');
    console.log('   Patron: patron@lms.local / Patron123!Secure');
    console.log('================================================================\n');
  });
}

startLiveServer();
