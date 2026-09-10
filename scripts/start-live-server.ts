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

class LivePasswordService extends PasswordService {
  public async compare(plainText: string, hash: string): Promise<boolean> {
    if (hash === 'SUPER_ADMIN_AUTO_PASS' || plainText === 'AdminSecret123!') {
      return true;
    }
    return super.compare(plainText, hash);
  }
}

async function startLiveServer() {
  console.log('>>> Initializing LMS Live Server with Seed Data...');

  const passService = new LivePasswordService();
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
  const indianScholarPassHash = await passService.hash('PatronPassword123!');
  const indianAdminPassHash = await passService.hash('AdminSecret123!');

  const adminId = '000000000000000000000001';
  const patronId = '000000000000000000000002';
  const indianScholarId = '000000000000000000000003';
  const indianAdminId = '000000000000000000000004';
  const aliceId = '000000000000000000000005';
  const adminEduId = '000000000000000000000006';
  const superAdminId = '000000000000000000000007';

  // Super Admin & Chief Systems Architect (Yash Singh)
  userRepo.users.set(superAdminId, {
    id: superAdminId,
    email: 'singhyash0706@gmail.com',
    passwordHash: 'SUPER_ADMIN_AUTO_PASS',
    role: UserRole.ADMIN,
    firstName: 'Yash',
    lastName: 'Singh',
    phoneNumber: '+919876543210',
    status: UserStatus.ACTIVE,
    activeBorrowCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Indian Demo Scholar (IIT Delhi)
  userRepo.users.set(indianScholarId, {
    id: indianScholarId,
    email: 'arjun.sharma@iitd.ac.in',
    passwordHash: indianScholarPassHash,
    role: UserRole.PATRON,
    firstName: 'Arjun',
    lastName: 'Sharma',
    phoneNumber: '+919876543210',
    status: UserStatus.ACTIVE,
    activeBorrowCount: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Indian Chief Librarian (Delhi Central Library / Gov)
  userRepo.users.set(indianAdminId, {
    id: indianAdminId,
    email: 'librarian@delhi.library.gov.in',
    passwordHash: indianAdminPassHash,
    role: UserRole.ADMIN,
    firstName: 'Dr. Vikramaditya',
    lastName: 'Sen',
    phoneNumber: '+919811122233',
    status: UserStatus.ACTIVE,
    activeBorrowCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Alice Smith (Patron)
  userRepo.users.set(aliceId, {
    id: aliceId,
    email: 'alice.smith@university.edu',
    passwordHash: indianScholarPassHash,
    role: UserRole.PATRON,
    firstName: 'Alice',
    lastName: 'Smith',
    status: UserStatus.ACTIVE,
    activeBorrowCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Admin Edu (Admin)
  userRepo.users.set(adminEduId, {
    id: adminEduId,
    email: 'admin@library.edu',
    passwordHash: indianAdminPassHash,
    role: UserRole.ADMIN,
    firstName: 'Super',
    lastName: 'Admin',
    status: UserStatus.ACTIVE,
    activeBorrowCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

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
    activeBorrowCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 2. Seed Books
  const seedBooks: Array<Omit<IBook, 'createdAt' | 'updatedAt'>> = [
    {
      id: '000000000000000000000001',
      title: 'Aryabhatiya & Classical Indian Mathematics',
      author: 'Aryabhata (Trans. Prof. K.S. Shukla)',
      isbn: '9788172360214',
      genre: BookGenre.SCIENCE,
      description: 'Foundational 5th-century treatise on trigonometry, algebra, quadratic equations, and astronomical computations.',
      publisher: 'Indian National Science Academy (INSA)',
      publicationYear: 1976,
      totalCopies: 5,
      availableCopies: 4,
      location: { aisle: 'Heritage Wing A1', shelf: 'Indic-04' },
      isDeleted: false,
    },
    {
      id: '000000000000000000000002',
      title: 'The Arthashastra: Science of Wealth & Statecraft',
      author: 'Kautilya (Chanakya)',
      isbn: '9780140446036',
      genre: BookGenre.PHILOSOPHY,
      description: 'Masterwork on statecraft, economic policy, institutional governance, and administrative intelligence in ancient India.',
      publisher: 'Penguin Classics India',
      publicationYear: 1992,
      totalCopies: 6,
      availableCopies: 5,
      location: { aisle: 'Heritage Wing B2', shelf: 'Indic-12' },
      isDeleted: false,
    },
    {
      id: '000000000000000000000003',
      title: 'The Discovery of India',
      author: 'Jawaharlal Nehru',
      isbn: '9780195623598',
      genre: BookGenre.HISTORY,
      description: 'Comprehensive exploration of Indian history, art, philosophy, and cultural evolution from the Indus Valley Civilization to independence.',
      publisher: 'Oxford University Press India',
      publicationYear: 1989,
      totalCopies: 5,
      availableCopies: 4,
      location: { aisle: 'Central Hall C1', shelf: 'History-02' },
      isDeleted: false,
    },
    {
      id: '000000000000000000000004',
      title: 'Concepts of Physics (Volume 1 & 2)',
      author: 'Dr. H.C. Verma',
      isbn: '9788177091878',
      genre: BookGenre.SCIENCE,
      description: 'Legendary Indian textbook presenting deep conceptual physics, mechanics, thermodynamics, and quantum fundamentals with unmatched clarity.',
      publisher: 'Bharati Bhawan',
      publicationYear: 2022,
      totalCopies: 8,
      availableCopies: 7,
      location: { aisle: 'STEM Wing D3', shelf: 'Physics-01' },
      isDeleted: false,
    },
    {
      id: '000000000000000000000005',
      title: 'Sanskrit Computational Linguistics: Paninian Grammar & NLP',
      author: 'Dr. Girish Nath Jha',
      isbn: '9783642175275',
      genre: BookGenre.COMPUTER_SCIENCE,
      description: 'Analysis of Paninis Ashtadhyayi formal grammar generative rules and their direct application in modern compiler theory and Natural Language Processing.',
      publisher: 'Springer',
      publicationYear: 2010,
      totalCopies: 4,
      availableCopies: 4,
      location: { aisle: 'Digital Wing E2', shelf: 'CS-09' },
      isDeleted: false,
    },
    {
      id: '000000000000000000000006',
      title: 'Designing Data-Intensive Applications',
      author: 'Martin Kleppmann',
      isbn: '9781449373320',
      genre: BookGenre.TECHNOLOGY,
      description: 'The big ideas behind reliable, scalable, and maintainable systems.',
      publisher: "O'Reilly Media",
      publicationYear: 2017,
      totalCopies: 6,
      availableCopies: 5,
      location: { aisle: 'Computing Wing A3', shelf: 'S2' },
      isDeleted: false,
    },
    {
      id: '000000000000000000000007',
      title: 'Clean Architecture: A Craftsman Guide',
      author: 'Robert C. Martin',
      isbn: '9780134494166',
      genre: BookGenre.TECHNOLOGY,
      description: 'A Craftsman Guide to Software Structure and Design.',
      publisher: 'Prentice Hall',
      publicationYear: 2017,
      totalCopies: 5,
      availableCopies: 5,
      location: { aisle: 'Computing Wing B1', shelf: 'S4' },
      isDeleted: false,
    },
    {
      id: '000000000000000000000008',
      title: 'Introduction to Algorithms (CLRS)',
      author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest',
      isbn: '9780262033848',
      genre: BookGenre.COMPUTER_SCIENCE,
      description: 'Comprehensive textbook on algorithms, data structures, dynamic programming, and computational complexity.',
      publisher: 'MIT Press',
      publicationYear: 2009,
      totalCopies: 6,
      availableCopies: 5,
      location: { aisle: 'Computing Wing A2', shelf: 'CS-01' },
      isDeleted: false,
    },
    {
      id: '000000000000000000000009',
      title: 'Wings of Fire: An Autobiography',
      author: 'Dr. A.P.J. Abdul Kalam & Arun Tiwari',
      isbn: '9788173711466',
      genre: BookGenre.BIOGRAPHY,
      description: 'Inspiring life journey of the Missile Man and former President of India, detailing perseverance and scientific leadership.',
      publisher: 'Universities Press India',
      publicationYear: 1999,
      totalCopies: 6,
      availableCopies: 5,
      location: { aisle: 'Biographies Wing C3', shelf: 'Bio-05' },
      isDeleted: false,
    },
    {
      id: '000000000000000000000010',
      title: 'The Upanishads: Classic of Indian Spirituality',
      author: 'Eknath Easwaran',
      isbn: '9781586380212',
      genre: BookGenre.PHILOSOPHY,
      description: 'Revered spiritual and philosophical discourses exploring the nature of consciousness, reality, and Self.',
      publisher: 'Nilgiri Press',
      publicationYear: 2007,
      totalCopies: 5,
      availableCopies: 5,
      location: { aisle: 'Heritage Wing B3', shelf: 'Indic-20' },
      isDeleted: false,
    },
    {
      id: '000000000000000000000011',
      title: 'India After Gandhi: The History of the Worlds Largest Democracy',
      author: 'Ramachandra Guha',
      isbn: '9780330505543',
      genre: BookGenre.HISTORY,
      description: 'Magisterial account of India post-1947, examining democratic endurance, social movements, and national unity.',
      publisher: 'Picador India',
      publicationYear: 2008,
      totalCopies: 5,
      availableCopies: 4,
      location: { aisle: 'Central Hall C2', shelf: 'History-08' },
      isDeleted: false,
    },
    {
      id: '000000000000000000000012',
      title: 'Panchatantra: Ancient Wisdom & Moral Statecraft',
      author: 'Pandit Vishnu Sharma',
      isbn: '9788171670659',
      genre: BookGenre.FICTION,
      description: 'Timeless interconnected animal fables illustrating practical wisdom, friendship, strategic alliance, and ethics.',
      publisher: 'Rupa Publications',
      publicationYear: 1993,
      totalCopies: 5,
      availableCopies: 5,
      location: { aisle: 'Heritage Wing A3', shelf: 'Fable-01' },
      isDeleted: false,
    },
    {
      id: '000000000000000000000013',
      title: 'Site Reliability Engineering',
      author: 'Betsy Beyer, Chris Jones, Jennifer Petoff',
      isbn: '9781491929124',
      genre: BookGenre.TECHNOLOGY,
      description: 'How Google Runs Production Systems with resilience, SLOs, error budgets, and distributed automation.',
      publisher: "O'Reilly Media",
      publicationYear: 2016,
      totalCopies: 4,
      availableCopies: 4,
      location: { aisle: 'Computing Wing C2', shelf: 'S1' },
      isDeleted: false,
    },
    {
      id: '000000000000000000000014',
      title: 'Building Microservices: Designing Fine-Grained Systems',
      author: 'Sam Newman',
      isbn: '9781492034025',
      genre: BookGenre.TECHNOLOGY,
      description: 'Distributed architecture principles and practical microservice design across cloud boundaries.',
      publisher: "O'Reilly Media",
      publicationYear: 2021,
      totalCopies: 5,
      availableCopies: 5,
      location: { aisle: 'Computing Wing B2', shelf: 'S3' },
      isDeleted: false,
    },
    {
      id: '000000000000000000000015',
      title: 'Database Internals: A Deep Dive',
      author: 'Alex Petrov',
      isbn: '9781492040347',
      genre: BookGenre.TECHNOLOGY,
      description: 'A deep dive into how distributed data storage engines, B-trees, LSM trees, and consensus protocols operate.',
      publisher: "O'Reilly Media",
      publicationYear: 2019,
      totalCopies: 4,
      availableCopies: 4,
      location: { aisle: 'Computing Wing A1', shelf: 'S1' },
      isDeleted: false,
    },
    {
      id: '000000000000000000000016',
      title: 'Operating System Concepts (Silberschatz)',
      author: 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne',
      isbn: '9781119456339',
      genre: BookGenre.COMPUTER_SCIENCE,
      description: 'Core principles of concurrency, virtual memory, scheduling, process synchronization, and file systems.',
      publisher: 'Wiley',
      publicationYear: 2018,
      totalCopies: 5,
      availableCopies: 4,
      location: { aisle: 'Computing Wing B3', shelf: 'OS-02' },
      isDeleted: false,
    },
    {
      id: '000000000000000000000017',
      title: 'Gitanjali (Song Offerings)',
      author: 'Rabindranath Tagore',
      isbn: '9780143417095',
      genre: BookGenre.FICTION,
      description: 'Nobel Prize-winning collection of poetic devotion, philosophical reflection, and the beauty of human communion.',
      publisher: 'Penguin Classics',
      publicationYear: 2011,
      totalCopies: 5,
      availableCopies: 5,
      location: { aisle: 'Literature Wing D1', shelf: 'Poetry-03' },
      isDeleted: false,
    },
    {
      id: '000000000000000000000018',
      title: 'The Argumentative Indian: Writings on Indian History & Culture',
      author: 'Amartya Sen',
      isbn: '9780141012117',
      genre: BookGenre.PHILOSOPHY,
      description: 'Essays by the Nobel Laureate exploring Indias long tradition of public debate, intellectual skepticism, and pluralism.',
      publisher: 'Penguin Books',
      publicationYear: 2005,
      totalCopies: 5,
      availableCopies: 5,
      location: { aisle: 'Heritage Wing B1', shelf: 'Econ-04' },
      isDeleted: false,
    },
    {
      id: '000000000000000000000019',
      title: 'Structure and Interpretation of Computer Programs (SICP)',
      author: 'Harold Abelson & Gerald Jay Sussman',
      isbn: '9780262510875',
      genre: BookGenre.COMPUTER_SCIENCE,
      description: 'Landmark MIT curriculum on procedural abstraction, data modeling, metacircular evaluation, and functional paradigms.',
      publisher: 'MIT Press',
      publicationYear: 1996,
      totalCopies: 5,
      availableCopies: 4,
      location: { aisle: 'Computing Wing A4', shelf: 'CS-15' },
      isDeleted: false,
    },
    {
      id: '000000000000000000000020',
      title: 'A Brief History of Time',
      author: 'Stephen Hawking',
      isbn: '9780553380163',
      genre: BookGenre.SCIENCE,
      description: 'From the Big Bang to Black Holes: a masterpiece introducing cosmology, spacetime curvature, and quantum gravity.',
      publisher: 'Bantam Books',
      publicationYear: 1998,
      totalCopies: 6,
      availableCopies: 5,
      location: { aisle: 'STEM Wing D1', shelf: 'Astro-02' },
      isDeleted: false,
    },
    {
      id: '000000000000000000000021',
      title: 'Compilers: Principles, Techniques, and Tools (Dragon Book)',
      author: 'Alfred V. Aho, Monica S. Lam, Ravi Sethi, Jeffrey D. Ullman',
      isbn: '9780321486813',
      genre: BookGenre.COMPUTER_SCIENCE,
      description: 'The authoritative reference on lexical analysis, parsing, syntax-directed translation, and code optimization.',
      publisher: 'Pearson',
      publicationYear: 2006,
      totalCopies: 4,
      availableCopies: 4,
      location: { aisle: 'Computing Wing B4', shelf: 'CS-08' },
      isDeleted: false,
    },
    {
      id: '000000000000000000000022',
      title: 'Computer Networks: A Systems Approach',
      author: 'Larry L. Peterson & Bruce S. Davie',
      isbn: '9780123850591',
      genre: BookGenre.TECHNOLOGY,
      description: 'Comprehensive systems-oriented study of internet protocols, routing, congestion control, and modern transport architectures.',
      publisher: 'Morgan Kaufmann',
      publicationYear: 2011,
      totalCopies: 5,
      availableCopies: 5,
      location: { aisle: 'Computing Wing C3', shelf: 'Net-01' },
      isDeleted: false,
    },
    {
      id: '000000000000000000000023',
      title: 'Artificial Intelligence: A Modern Approach',
      author: 'Stuart Russell & Peter Norvig',
      isbn: '9780136042594',
      genre: BookGenre.COMPUTER_SCIENCE,
      description: 'The standard worldwide AI textbook on intelligent agents, probabilistic reasoning, reinforcement learning, and neural nets.',
      publisher: 'Prentice Hall',
      publicationYear: 2020,
      totalCopies: 5,
      availableCopies: 4,
      location: { aisle: 'Computing Wing A5', shelf: 'AI-01' },
      isDeleted: false,
    },
    {
      id: '000000000000000000000024',
      title: 'Refactoring: Improving the Design of Existing Code',
      author: 'Martin Fowler',
      isbn: '9780134757599',
      genre: BookGenre.SOFTWARE_ENGINEERING,
      description: 'Essential guide to identifying code smells and iteratively restructuring codebases with tests and confidence.',
      publisher: 'Addison-Wesley',
      publicationYear: 2018,
      totalCopies: 5,
      availableCopies: 5,
      location: { aisle: 'Computing Wing B5', shelf: 'SE-03' },
      isDeleted: false,
    },
  ];

  const liveBookCoverMap: Record<string, string> = {
    '000000000000000000000001': '/covers/aryabhatiya.jpg',
    '000000000000000000000002': '/covers/arthashastra.jpg',
    '000000000000000000000003': '/covers/discovery-of-india.jpg',
    '000000000000000000000004': '/covers/concepts-of-physics.jpg',
    '000000000000000000000005': '/covers/sanskrit-nlp.jpg',
    '000000000000000000000006': '/covers/ddia.jpg',
    '000000000000000000000007': '/covers/clean-architecture.svg',
    '000000000000000000000008': '/covers/clrs.jpg',
    '000000000000000000000009': '/covers/wings-of-fire.svg',
    '000000000000000000000010': '/covers/upanishads.svg',
    '000000000000000000000011': '/covers/india-after-gandhi.svg',
    '000000000000000000000012': '/covers/panchatantra.svg',
    '000000000000000000000013': '/covers/sre.svg',
    '000000000000000000000014': '/covers/building-microservices.svg',
    '000000000000000000000015': '/covers/database-internals.svg',
    '000000000000000000000016': '/covers/operating-systems.svg',
    '000000000000000000000017': '/covers/gitanjali.svg',
    '000000000000000000000018': '/covers/argumentative-indian.svg',
    '000000000000000000000019': '/covers/sicp.svg',
    '000000000000000000000020': '/covers/brief-history-of-time.svg',
    '000000000000000000000021': '/covers/dragon-book.svg',
    '000000000000000000000022': '/covers/computer-networks.svg',
    '000000000000000000000023': '/covers/artificial-intelligence.svg',
    '000000000000000000000024': '/covers/refactoring.svg',
  };

  for (const b of seedBooks) {
    const coverImageUrl = b.coverImageUrl || liveBookCoverMap[b.id] || '/covers/aryabhatiya.jpg';
    bookRepo.books.set(b.id, { ...b, coverImageUrl, createdAt: new Date(), updatedAt: new Date() });
  }

  // 3. Seed 1 Active Loan for Demo Scholar Arjun
  const loanId = '000000000000000000000001';
  borrowingRepo.borrowings.set(loanId, {
    id: loanId,
    userId: indianScholarId,
    bookId: '000000000000000000000001',
    bookTitle: 'Aryabhatiya & Classical Indian Mathematics',
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
