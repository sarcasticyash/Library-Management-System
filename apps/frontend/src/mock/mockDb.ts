/**
 * Cloud-Native Library Management System (LMS)
 * Client-Side Resilient Mock & Fallback Engine
 *
 * Provides instant zero-setup offline/sandbox resilience when MongoDB or backend
 * dev server is unreachable or fails with 500. Automatically syncs state to localStorage
 * so patron registrations, demo sign-ins, and book borrowings persist across browser reloads.
 */

import { IUserPublic, UserRole, UserStatus } from '../types/user';
import {
  AuthTokensResponseDto,
  LoginUserDto,
  RefreshTokenResponseDto,
  RegisterUserDto,
} from '../types/auth';
import {
  BookGenre,
  IBook,
  IBookAvailability,
  IBookSummary,
  SearchBooksParams,
} from '../types/book';
import {
  CirculationStatus,
  IActiveLoanItem,
  IActiveLoansResponse,
  IBorrowing,
} from '../types/circulation';
import { IDashboardKpis } from '../types/dashboard';
import { PaginatedResponse } from '../types/common';
import { getBookCoverUrl } from '../utils/bookCover.util';
import {
  ISupportTicket,
  CreateSupportTicketDto,
  STUDENT_RECIPIENT_EMAIL,
  ADMIN_RECIPIENT_EMAIL,
} from '../types/support';

const USERS_KEY = 'lms_mock_users';
const SESSION_KEY = 'lms_mock_session';
const BOOKS_KEY = 'lms_mock_books';
const LOANS_KEY = 'lms_mock_loans';
const TICKETS_KEY = 'lms_mock_tickets';

// Default Seed Accounts
const DEFAULT_USERS: Array<IUserPublic & { password: string }> = [
  {
    id: '000000000000000000000003',
    firstName: 'Arjun',
    lastName: 'Sharma',
    email: 'arjun.sharma@iitd.ac.in',
    role: UserRole.PATRON,
    status: UserStatus.ACTIVE,
    activeBorrowCount: 1,
    phoneNumber: '+919876543210',
    createdAt: new Date().toISOString(),
    password: 'PatronPassword123!',
  },
  {
    id: '000000000000000000000004',
    firstName: 'Dr. Vikramaditya',
    lastName: 'Sen',
    email: 'librarian@delhi.library.gov.in',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    activeBorrowCount: 0,
    phoneNumber: '+919811122233',
    createdAt: new Date().toISOString(),
    password: 'AdminSecret123!',
  },
  {
    id: '000000000000000000000005',
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice.smith@university.edu',
    role: UserRole.PATRON,
    status: UserStatus.ACTIVE,
    activeBorrowCount: 0,
    phoneNumber: null,
    createdAt: new Date().toISOString(),
    password: 'PatronPassword123!',
  },
  {
    id: '000000000000000000000006',
    firstName: 'Super',
    lastName: 'Admin',
    email: 'admin@library.edu',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    activeBorrowCount: 0,
    phoneNumber: null,
    createdAt: new Date().toISOString(),
    password: 'AdminSecret123!',
  },
  {
    id: '000000000000000000000007',
    firstName: 'Yash',
    lastName: 'Singh',
    email: 'singhyash0706@gmail.com',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    activeBorrowCount: 0,
    phoneNumber: '+919876543210',
    createdAt: new Date().toISOString(),
    password: 'AdminSecret123!',
  },
];

// Default Curated Catalog (Indian Heritage & Computer Science Classics)
const DEFAULT_BOOKS: IBook[] = [
  {
    id: '000000000000000000000001',
    title: 'Aryabhatiya & Classical Indian Mathematics',
    author: 'Aryabhata (Trans. Prof. K.S. Shukla)',
    isbn: '9788172360214',
    genre: BookGenre.SCIENCE,
    description:
      'Foundational 5th-century treatise on trigonometry, algebra, quadratic equations, and astronomical computations.',
    publisher: 'Indian National Science Academy (INSA)',
    publicationYear: 1976,
    totalCopies: 5,
    availableCopies: 4,
    location: { aisle: 'Heritage Wing A1', shelf: 'Indic-04' },
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '000000000000000000000002',
    title: 'The Arthashastra: Science of Wealth & Statecraft',
    author: 'Kautilya (Chanakya)',
    isbn: '9780140446036',
    genre: BookGenre.PHILOSOPHY,
    description:
      'Masterwork on statecraft, economic policy, institutional governance, and administrative intelligence in ancient India.',
    publisher: 'Penguin Classics India',
    publicationYear: 1992,
    totalCopies: 6,
    availableCopies: 6,
    location: { aisle: 'Heritage Wing B2', shelf: 'Indic-12' },
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '000000000000000000000003',
    title: 'The Discovery of India',
    author: 'Jawaharlal Nehru',
    isbn: '9780195623598',
    genre: BookGenre.HISTORY,
    description:
      'Comprehensive exploration of Indian history, art, philosophy, and cultural evolution from the Indus Valley Civilization to independence.',
    publisher: 'Oxford University Press India',
    publicationYear: 1989,
    totalCopies: 5,
    availableCopies: 4,
    location: { aisle: 'Central Hall C1', shelf: 'History-02' },
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '000000000000000000000004',
    title: 'Concepts of Physics (Volume 1 & 2)',
    author: 'Dr. H.C. Verma',
    isbn: '9788177091878',
    genre: BookGenre.SCIENCE,
    description:
      'Legendary Indian textbook presenting deep conceptual physics, mechanics, thermodynamics, and quantum fundamentals with unmatched clarity.',
    publisher: 'Bharati Bhawan',
    publicationYear: 2022,
    totalCopies: 8,
    availableCopies: 7,
    location: { aisle: 'STEM Wing D3', shelf: 'Physics-01' },
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '000000000000000000000005',
    title: 'Sanskrit Computational Linguistics: Paninian Grammar & NLP',
    author: 'Dr. Girish Nath Jha',
    isbn: '9783642175275',
    genre: BookGenre.COMPUTER_SCIENCE,
    description:
      'Analysis of Paninis Ashtadhyayi formal grammar generative rules and their direct application in modern compiler theory and Natural Language Processing.',
    publisher: 'Springer',
    publicationYear: 2010,
    totalCopies: 4,
    availableCopies: 4,
    location: { aisle: 'Digital Wing E2', shelf: 'CS-09' },
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    totalCopies: 5,
    availableCopies: 4,
    location: { aisle: 'Computing Wing A3', shelf: 'S2' },
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    totalCopies: 4,
    availableCopies: 4,
    location: { aisle: 'Computing Wing B1', shelf: 'S4' },
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '000000000000000000000008',
    title: 'Introduction to Algorithms (CLRS)',
    author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest',
    isbn: '9780262033848',
    genre: BookGenre.COMPUTER_SCIENCE,
    description:
      'Comprehensive textbook on algorithms, data structures, dynamic programming, and computational complexity.',
    publisher: 'MIT Press',
    publicationYear: 2009,
    totalCopies: 6,
    availableCopies: 5,
    location: { aisle: 'Computing Wing A2', shelf: 'CS-01' },
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '000000000000000000000009',
    title: 'Wings of Fire: An Autobiography',
    author: 'Dr. A.P.J. Abdul Kalam & Arun Tiwari',
    isbn: '9788173711466',
    genre: BookGenre.BIOGRAPHY,
    description:
      'Inspiring life journey of the Missile Man and former President of India, detailing perseverance and scientific leadership.',
    publisher: 'Universities Press India',
    publicationYear: 1999,
    totalCopies: 6,
    availableCopies: 5,
    location: { aisle: 'Biographies Wing C3', shelf: 'Bio-05' },
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '000000000000000000000010',
    title: 'The Upanishads: Classic of Indian Spirituality',
    author: 'Eknath Easwaran',
    isbn: '9781586380212',
    genre: BookGenre.PHILOSOPHY,
    description:
      'Revered spiritual and philosophical discourses exploring the nature of consciousness, reality, and Self.',
    publisher: 'Nilgiri Press',
    publicationYear: 2007,
    totalCopies: 5,
    availableCopies: 5,
    location: { aisle: 'Heritage Wing B3', shelf: 'Indic-20' },
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '000000000000000000000011',
    title: 'India After Gandhi: The History of the Worlds Largest Democracy',
    author: 'Ramachandra Guha',
    isbn: '9780330505543',
    genre: BookGenre.HISTORY,
    description:
      'Magisterial account of India post-1947, examining democratic endurance, social movements, and national unity.',
    publisher: 'Picador India',
    publicationYear: 2008,
    totalCopies: 5,
    availableCopies: 4,
    location: { aisle: 'Central Hall C2', shelf: 'History-08' },
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '000000000000000000000012',
    title: 'Panchatantra: Ancient Wisdom & Moral Statecraft',
    author: 'Pandit Vishnu Sharma',
    isbn: '9788171670659',
    genre: BookGenre.FICTION,
    description:
      'Timeless interconnected animal fables illustrating practical wisdom, friendship, strategic alliance, and ethics.',
    publisher: 'Rupa Publications',
    publicationYear: 1993,
    totalCopies: 5,
    availableCopies: 5,
    location: { aisle: 'Heritage Wing A3', shelf: 'Fable-01' },
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '000000000000000000000013',
    title: 'Site Reliability Engineering',
    author: 'Betsy Beyer, Chris Jones, Jennifer Petoff',
    isbn: '9781491929124',
    genre: BookGenre.TECHNOLOGY,
    description:
      'How Google Runs Production Systems with resilience, SLOs, error budgets, and distributed automation.',
    publisher: "O'Reilly Media",
    publicationYear: 2016,
    totalCopies: 4,
    availableCopies: 4,
    location: { aisle: 'Computing Wing C2', shelf: 'S1' },
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '000000000000000000000014',
    title: 'Building Microservices: Designing Fine-Grained Systems',
    author: 'Sam Newman',
    isbn: '9781492034025',
    genre: BookGenre.TECHNOLOGY,
    description:
      'Distributed architecture principles and practical microservice design across cloud boundaries.',
    publisher: "O'Reilly Media",
    publicationYear: 2021,
    totalCopies: 5,
    availableCopies: 5,
    location: { aisle: 'Computing Wing B2', shelf: 'S3' },
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '000000000000000000000015',
    title: 'Database Internals: A Deep Dive',
    author: 'Alex Petrov',
    isbn: '9781492040347',
    genre: BookGenre.TECHNOLOGY,
    description:
      'A deep dive into how distributed data storage engines, B-trees, LSM trees, and consensus protocols operate.',
    publisher: "O'Reilly Media",
    publicationYear: 2019,
    totalCopies: 4,
    availableCopies: 4,
    location: { aisle: 'Computing Wing A1', shelf: 'S1' },
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '000000000000000000000016',
    title: 'Operating System Concepts (Silberschatz)',
    author: 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne',
    isbn: '9781119456339',
    genre: BookGenre.COMPUTER_SCIENCE,
    description:
      'Core principles of concurrency, virtual memory, scheduling, process synchronization, and file systems.',
    publisher: 'Wiley',
    publicationYear: 2018,
    totalCopies: 5,
    availableCopies: 4,
    location: { aisle: 'Computing Wing B3', shelf: 'OS-02' },
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '000000000000000000000017',
    title: 'Gitanjali (Song Offerings)',
    author: 'Rabindranath Tagore',
    isbn: '9780143417095',
    genre: BookGenre.FICTION,
    description:
      'Nobel Prize-winning collection of poetic devotion, philosophical reflection, and the beauty of human communion.',
    publisher: 'Penguin Classics',
    publicationYear: 2011,
    totalCopies: 5,
    availableCopies: 5,
    location: { aisle: 'Literature Wing D1', shelf: 'Poetry-03' },
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '000000000000000000000018',
    title: 'The Argumentative Indian: Writings on Indian History & Culture',
    author: 'Amartya Sen',
    isbn: '9780141012117',
    genre: BookGenre.PHILOSOPHY,
    description:
      'Essays by the Nobel Laureate exploring Indias long tradition of public debate, intellectual skepticism, and pluralism.',
    publisher: 'Penguin Books',
    publicationYear: 2005,
    totalCopies: 5,
    availableCopies: 5,
    location: { aisle: 'Heritage Wing B1', shelf: 'Econ-04' },
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '000000000000000000000019',
    title: 'Structure and Interpretation of Computer Programs (SICP)',
    author: 'Harold Abelson & Gerald Jay Sussman',
    isbn: '9780262510875',
    genre: BookGenre.COMPUTER_SCIENCE,
    description:
      'Landmark MIT curriculum on procedural abstraction, data modeling, metacircular evaluation, and functional paradigms.',
    publisher: 'MIT Press',
    publicationYear: 1996,
    totalCopies: 5,
    availableCopies: 4,
    location: { aisle: 'Computing Wing A4', shelf: 'CS-15' },
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '000000000000000000000020',
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    isbn: '9780553380163',
    genre: BookGenre.SCIENCE,
    description:
      'From the Big Bang to Black Holes: a masterpiece introducing cosmology, spacetime curvature, and quantum gravity.',
    publisher: 'Bantam Books',
    publicationYear: 1998,
    totalCopies: 6,
    availableCopies: 5,
    location: { aisle: 'STEM Wing D1', shelf: 'Astro-02' },
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '000000000000000000000021',
    title: 'Compilers: Principles, Techniques, and Tools (Dragon Book)',
    author: 'Alfred V. Aho, Monica S. Lam, Ravi Sethi, Jeffrey D. Ullman',
    isbn: '9780321486813',
    genre: BookGenre.COMPUTER_SCIENCE,
    description:
      'The authoritative reference on lexical analysis, parsing, syntax-directed translation, and code optimization.',
    publisher: 'Pearson',
    publicationYear: 2006,
    totalCopies: 4,
    availableCopies: 4,
    location: { aisle: 'Computing Wing B4', shelf: 'CS-08' },
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '000000000000000000000022',
    title: 'Computer Networks: A Systems Approach',
    author: 'Larry L. Peterson & Bruce S. Davie',
    isbn: '9780123850591',
    genre: BookGenre.TECHNOLOGY,
    description:
      'Comprehensive systems-oriented study of internet protocols, routing, congestion control, and modern transport architectures.',
    publisher: 'Morgan Kaufmann',
    publicationYear: 2011,
    totalCopies: 5,
    availableCopies: 5,
    location: { aisle: 'Computing Wing C3', shelf: 'Net-01' },
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '000000000000000000000023',
    title: 'Artificial Intelligence: A Modern Approach',
    author: 'Stuart Russell & Peter Norvig',
    isbn: '9780136042594',
    genre: BookGenre.COMPUTER_SCIENCE,
    description:
      'The standard worldwide AI textbook on intelligent agents, probabilistic reasoning, reinforcement learning, and neural nets.',
    publisher: 'Prentice Hall',
    publicationYear: 2020,
    totalCopies: 5,
    availableCopies: 4,
    location: { aisle: 'Computing Wing A5', shelf: 'AI-01' },
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '000000000000000000000024',
    title: 'Refactoring: Improving the Design of Existing Code',
    author: 'Martin Fowler',
    isbn: '9780134757599',
    genre: BookGenre.SOFTWARE_ENGINEERING,
    description:
      'Essential guide to identifying code smells and iteratively restructuring codebases with tests and confidence.',
    publisher: 'Addison-Wesley',
    publicationYear: 2018,
    totalCopies: 5,
    availableCopies: 5,
    location: { aisle: 'Computing Wing B5', shelf: 'SE-03' },
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Default Seed Loans
const DEFAULT_LOANS: IBorrowing[] = [
  {
    id: '000000000000000000000001',
    userId: '000000000000000000000003', // Arjun Sharma (Demo Scholar)
    bookId: '000000000000000000000001', // Aryabhatiya
    borrowDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    returnDate: null,
    status: CirculationStatus.ACTIVE,
    returnedBy: null,
    adminReturnRemarks: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class MockDatabase {
  private getUsers(): Array<IUserPublic & { password: string }> {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      if (!raw) {
        localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_USERS;
    }
  }

  private saveUsers(users: Array<IUserPublic & { password: string }>) {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch {
      // Storage unavailable fallback
    }
  }

  public getSession(): IUserPublic | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public setSession(user: IUserPublic | null) {
    try {
      if (user) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // ignore
    }
  }

  public getBooks(): IBook[] {
    try {
      const raw = localStorage.getItem(BOOKS_KEY);
      let books: IBook[] = DEFAULT_BOOKS;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length >= DEFAULT_BOOKS.length) {
          books = parsed;
        } else {
          localStorage.setItem(BOOKS_KEY, JSON.stringify(DEFAULT_BOOKS));
        }
      }
      return books.map((b) => ({
        ...b,
        coverImageUrl: b.coverImageUrl || getBookCoverUrl(b),
      }));
    } catch {
      return DEFAULT_BOOKS.map((b) => ({
        ...b,
        coverImageUrl: b.coverImageUrl || getBookCoverUrl(b),
      }));
    }
  }

  public saveBooks(books: IBook[]) {
    try {
      localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    } catch {
      // ignore
    }
  }

  public getLoans(): IBorrowing[] {
    try {
      const raw = localStorage.getItem(LOANS_KEY);
      if (!raw) {
        localStorage.setItem(LOANS_KEY, JSON.stringify(DEFAULT_LOANS));
        return DEFAULT_LOANS;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 0) {
        localStorage.setItem(LOANS_KEY, JSON.stringify(DEFAULT_LOANS));
        return DEFAULT_LOANS;
      }
      return parsed;
    } catch {
      return DEFAULT_LOANS;
    }
  }

  public saveLoans(loans: IBorrowing[]) {
    try {
      localStorage.setItem(LOANS_KEY, JSON.stringify(loans));
    } catch {
      // ignore
    }
  }

  // --- Auth Methods ---

  public async register(dto: RegisterUserDto): Promise<IUserPublic> {
    const users = this.getUsers();
    const existing = users.find((u) => u.email.toLowerCase() === dto.email.toLowerCase());
    if (existing) {
      throw new Error('A scholar account with this institutional email already exists');
    }

    const newUser: IUserPublic & { password: string } = {
      id: 'usr_' + Math.random().toString(36).substring(2, 10),
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email: dto.email.trim().toLowerCase(),
      role: UserRole.PATRON,
      status: UserStatus.ACTIVE,
      activeBorrowCount: 0,
      phoneNumber: dto.phoneNumber || null,
      createdAt: new Date().toISOString(),
      password: dto.password,
    };

    users.push(newUser);
    this.saveUsers(users);

    const { password: _, ...publicUser } = newUser;
    this.setSession(publicUser);
    return publicUser;
  }

  public async login(dto: LoginUserDto): Promise<AuthTokensResponseDto> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const users = this.getUsers();
    let user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    // Super Admin Yash Singh: Instant seamless authentication
    if (normalizedEmail === 'singhyash0706@gmail.com') {
      if (!user) {
        user = {
          id: '000000000000000000000007',
          firstName: 'Yash',
          lastName: 'Singh',
          email: 'singhyash0706@gmail.com',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          activeBorrowCount: 0,
          phoneNumber: '+919876543210',
          createdAt: new Date().toISOString(),
          password: dto.password || 'AdminSecret123!',
        };
        users.push(user);
        this.saveUsers(users);
      }
      const { password: _, ...publicUser } = user;
      this.setSession(publicUser);
      return {
        accessToken: 'mock_jwt_superadmin_' + Date.now(),
        tokenType: 'Bearer',
        expiresIn: 900,
        user: publicUser,
      };
    }

    // In mock fallback mode, accept if user exists and password matches,
    // or if it's one of the known demo accounts, authenticate seamlessly
    if (!user) {
      // Auto-provision if demo login requested but missing in store
      if (dto.email.includes('admin') || dto.email.includes('librarian')) {
        const adminUser: IUserPublic = {
          id: 'admin_auto_' + Date.now(),
          firstName: 'Chief',
          lastName: 'Librarian',
          email: dto.email,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          activeBorrowCount: 0,
          phoneNumber: null,
          createdAt: new Date().toISOString(),
        };
        this.setSession(adminUser);
        return {
          accessToken: 'mock_jwt_' + Math.random().toString(36).substring(2),
          tokenType: 'Bearer',
          expiresIn: 900,
          user: adminUser,
        };
      } else {
        throw new Error('Invalid email or password. Please verify credentials.');
      }
    }

    if (user.password && user.password !== dto.password) {
      throw new Error('Invalid password for this scholar account.');
    }

    const { password: _, ...publicUser } = user;
    this.setSession(publicUser);

    return {
      accessToken: 'mock_jwt_' + Math.random().toString(36).substring(2),
      tokenType: 'Bearer',
      expiresIn: 900,
      user: publicUser,
    };
  }

  public async refresh(): Promise<RefreshTokenResponseDto> {
    const session = this.getSession();
    if (!session) {
      throw new Error('Session expired');
    }
    return {
      accessToken: 'mock_jwt_' + Math.random().toString(36).substring(2),
      tokenType: 'Bearer',
      expiresIn: 900,
    };
  }

  public async logout(): Promise<void> {
    this.setSession(null);
  }

  public async requestPasswordReset(
    email: string,
  ): Promise<{ success: boolean; message: string; simulatedCode?: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new Error('Please enter a valid institutional scholar email address.');
    }
    return {
      success: true,
      message: `Archival verification OTP generated and dispatched for ${normalizedEmail}.`,
      simulatedCode: 'GRANTHA-8821',
    };
  }

  public async resetPassword(
    email: string,
    newPassword: string,
    _code?: string,
  ): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const users = this.getUsers();
    const userIndex = users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);

    if (userIndex === -1) {
      const newUser: IUserPublic & { password: string } = {
        id: 'usr_' + Math.random().toString(36).substring(2, 10),
        firstName: 'Scholar',
        lastName: 'Member',
        email: normalizedEmail,
        role:
          normalizedEmail.includes('admin') || normalizedEmail.includes('librarian')
            ? UserRole.ADMIN
            : UserRole.PATRON,
        status: UserStatus.ACTIVE,
        activeBorrowCount: 0,
        phoneNumber: null,
        createdAt: new Date().toISOString(),
        password: newPassword,
      };
      users.push(newUser);
      this.saveUsers(users);
    } else if (users[userIndex]) {
      users[userIndex].password = newPassword;
      this.saveUsers(users);
    }

    return {
      success: true,
      message: 'Password successfully reset and synchronized with institutional vault.',
    };
  }

  // --- Catalog Methods ---

  public searchBooks(params?: SearchBooksParams): PaginatedResponse<IBookSummary> {
    let list = this.getBooks().filter((b) => !b.isDeleted);

    if (params?.q) {
      const q = params.q.toLowerCase();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.isbn.includes(q),
      );
    }

    const targetGenre = params?.genre;
    if (targetGenre && targetGenre !== 'All') {
      list = list.filter((b) => b.genre.toLowerCase() === targetGenre.toLowerCase());
    }

    if (params?.available) {
      list = list.filter((b) => b.availableCopies > 0);
    }

    const page = params?.page || 1;
    const limit = params?.limit || 12;
    const start = (page - 1) * limit;
    const paginated = list.slice(start, start + limit);

    const summaries: IBookSummary[] = paginated.map((b) => ({
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
      data: summaries,
      pagination: {
        page,
        limit,
        totalRecords: list.length,
        totalPages: Math.ceil(list.length / limit) || 1,
        hasNextPage: start + limit < list.length,
        hasPrevPage: page > 1,
      },
    };
  }

  public getBookById(id: string): IBook {
    const books = this.getBooks();
    const book = books.find((b) => b.id === id);
    if (!book) {
      throw new Error('Book not found in national repository');
    }
    return book;
  }

  public getBookAvailability(id: string): IBookAvailability {
    const book = this.getBookById(id);
    return {
      bookId: book.id,
      isAvailable: book.availableCopies > 0,
      availableCopies: book.availableCopies,
      totalCopies: book.totalCopies,
      location: book.location,
    };
  }

  // --- Circulation & Borrowings ---

  public getActiveLoans(): IActiveLoansResponse {
    const session = this.getSession();
    const loans = this.getLoans();
    const books = this.getBooks();

    const userLoans = session
      ? loans.filter((l) => l.userId === session.id && l.status === CirculationStatus.ACTIVE)
      : [];

    const items: IActiveLoanItem[] = userLoans.map((loan) => {
      const book = books.find((b) => b.id === loan.bookId);
      const dueDate = new Date(loan.dueDate);
      const now = new Date();
      const msDiff = dueDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
      const isOverdue = msDiff < 0;

      return {
        id: loan.id,
        book: {
          id: loan.bookId,
          title: book?.title || 'Cataloged Volume',
          author: book?.author || 'Scholar Archive',
          coverImageUrl: book?.coverImageUrl,
        },
        borrowDate: loan.borrowDate,
        dueDate: loan.dueDate,
        status: isOverdue ? CirculationStatus.OVERDUE : CirculationStatus.ACTIVE,
        isOverdue,
        daysRemaining,
      };
    });

    return {
      data: items,
      totalActiveLoans: items.length,
    };
  }

  public borrowBook(bookId: string): IBorrowing {
    const session = this.getSession();
    if (!session) {
      throw new Error('You must be signed in to borrow from the repository');
    }

    const books = this.getBooks();
    const targetBook = books.find((b) => b.id === bookId);
    if (!targetBook) {
      throw new Error('Book not found');
    }
    if (targetBook.availableCopies <= 0) {
      throw new Error('This volume is currently out of stock');
    }

    // Decrement available copies
    targetBook.availableCopies -= 1;
    this.saveBooks(books);

    // Add loan
    const loans = this.getLoans();
    const now = new Date();
    const dueDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days loan

    const newLoan: IBorrowing = {
      id: 'loan_' + Math.random().toString(36).substring(2, 10),
      userId: session.id,
      bookId,
      borrowDate: now.toISOString(),
      dueDate: dueDate.toISOString(),
      returnDate: null,
      status: CirculationStatus.ACTIVE,
      returnedBy: null,
      adminReturnRemarks: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    loans.unshift(newLoan);
    this.saveLoans(loans);

    // Update session active borrow count
    session.activeBorrowCount += 1;
    this.setSession(session);

    return newLoan;
  }

  public returnBook(loanId: string): IBorrowing {
    const loans = this.getLoans();
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) {
      throw new Error('Borrowing record not found');
    }

    loan.status = CirculationStatus.RETURNED;
    loan.returnDate = new Date().toISOString();
    this.saveLoans(loans);

    // Increment book copies
    const books = this.getBooks();
    const book = books.find((b) => b.id === loan.bookId);
    if (book) {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
      this.saveBooks(books);
    }

    // Decrement session active borrow count
    const session = this.getSession();
    if (session && session.activeBorrowCount > 0) {
      session.activeBorrowCount -= 1;
      this.setSession(session);
    }

    return loan;
  }

  public getDashboardKpis(): IDashboardKpis {
    const books = this.getBooks();
    const users = this.getUsers();
    const loans = this.getLoans();

    const totalTitles = books.filter((b) => !b.isDeleted).length;
    const totalCopies = books.reduce((acc, b) => acc + b.totalCopies, 0);
    const availableCopies = books.reduce((acc, b) => acc + b.availableCopies, 0);

    const activeLoans = loans.filter((l) => l.status === CirculationStatus.ACTIVE).length;
    const overdueLoans = loans.filter((l) => l.status === CirculationStatus.OVERDUE).length;

    return {
      catalog: {
        totalTitles,
        totalCopies,
        availableCopies,
      },
      circulation: {
        activeLoans,
        overdueLoans,
      },
      users: {
        totalRegisteredUsers: users.length,
        activePatrons: users.filter(
          (u) => u.role === UserRole.PATRON && u.status === UserStatus.ACTIVE,
        ).length,
        suspendedPatrons: users.filter((u) => u.status === UserStatus.SUSPENDED).length,
      },
      calculatedAt: new Date().toISOString(),
    };
  }

  public getTickets(): ISupportTicket[] {
    try {
      const raw = localStorage.getItem(TICKETS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public createTicket(dto: CreateSupportTicketDto): ISupportTicket {
    const tickets = this.getTickets();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const prefix = dto.role === 'STUDENT' ? 'STU' : 'ADM';
    const year = new Date().getFullYear();
    const ticketNumber = `TKT-${year}-${prefix}-${randomSuffix}`;

    const isStudent = dto.role === 'STUDENT';
    const recipientEmail = isStudent ? STUDENT_RECIPIENT_EMAIL : ADMIN_RECIPIENT_EMAIL;
    const recipientRoleTitle = isStudent
      ? 'Delhi Central Library Administration (Librarian Desk)'
      : 'Chief Systems Architect & Super Admin (singhyash0706@gmail.com)';

    const newTicket: ISupportTicket = {
      id: 'tkt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      ticketNumber,
      role: dto.role,
      senderName: dto.senderName,
      senderEmail: dto.senderEmail,
      senderPhone: dto.senderPhone || undefined,
      libraryCardId: dto.libraryCardId || undefined,
      recipientEmail,
      recipientRoleTitle,
      category: dto.category,
      priority: dto.priority,
      subject: dto.subject,
      relatedBookTitle: dto.relatedBookTitle || undefined,
      message: dto.message,
      status: 'DISPATCHED',
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    };

    tickets.unshift(newTicket);
    try {
      localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
    } catch {
      // ignore
    }

    return newTicket;
  }
}

export const mockDb = new MockDatabase();
