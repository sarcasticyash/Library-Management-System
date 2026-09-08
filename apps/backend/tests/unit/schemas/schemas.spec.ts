import { describe, it, expect } from 'vitest';
import {
  ObjectIdSchema,
  PaginationQuerySchema,
  RegisterUserSchema,
  LoginUserSchema,
  ChangePasswordSchema,
  UserIdParamSchema,
  UpdateUserStatusSchema,
  BookLocationSchema,
  CreateBookSchema,
  UpdateBookSchema,
  BookSearchQuerySchema,
  BookIdParamSchema,
  BorrowBookSchema,
  BorrowingIdParamSchema,
  AdminReturnOverrideSchema,
  AdminBorrowingsQuerySchema,
  AuditQuerySchema,
} from '@schemas/index';
import { BookGenre } from '@types/book.types';

describe('Validation Schemas Unit Tests', () => {
  describe('Common Schemas', () => {
    describe('ObjectIdSchema', () => {
      it('should accept valid 24-character hexadecimal ObjectId', () => {
        const validId = '64f1a2b3c4d5e6f7a8b9c0d1';
        const result = ObjectIdSchema.safeParse(validId);
        expect(result.success).toBe(true);
      });

      it('should reject non-hexadecimal or invalid length strings', () => {
        expect(ObjectIdSchema.safeParse('not-an-id').success).toBe(false);
        expect(ObjectIdSchema.safeParse('64f1a2b3c4d5e6f7a8b9c0d').success).toBe(false); // 23 chars
        expect(ObjectIdSchema.safeParse('64f1a2b3c4d5e6f7a8b9c0d12').success).toBe(false); // 25 chars
        expect(ObjectIdSchema.safeParse('64f1a2b3c4d5e6f7a8b9c0z!').success).toBe(false); // invalid chars
      });
    });

    describe('PaginationQuerySchema', () => {
      it('should apply defaults when page and limit are omitted', () => {
        const result = PaginationQuerySchema.parse({});
        expect(result.page).toBe(1);
        expect(result.limit).toBe(20);
      });

      it('should coerce string numbers to integer types', () => {
        const result = PaginationQuerySchema.parse({ page: '3', limit: '50' });
        expect(result.page).toBe(3);
        expect(result.limit).toBe(50);
      });

      it('should reject page < 1', () => {
        const result = PaginationQuerySchema.safeParse({ page: 0 });
        expect(result.success).toBe(false);
      });

      it('should reject limit > 100', () => {
        const result = PaginationQuerySchema.safeParse({ limit: 101 });
        expect(result.success).toBe(false);
      });

      it('should reject non-integer floats', () => {
        const result = PaginationQuerySchema.safeParse({ page: 1.5 });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Auth Schemas', () => {
    describe('RegisterUserSchema', () => {
      it('should accept valid registration payload and normalize email', () => {
        const input = {
          firstName: '  Jane  ',
          lastName: '  Doe  ',
          email: '  Jane.Doe@Library.Org  ',
          password: 'Password123!',
        };
        const result = RegisterUserSchema.parse(input);
        expect(result.firstName).toBe('Jane');
        expect(result.lastName).toBe('Doe');
        expect(result.email).toBe('jane.doe@library.org');
        expect(result.password).toBe('Password123!');
      });

      it('should reject invalid email format', () => {
        const input = {
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'invalid-email',
          password: 'Password123!',
        };
        const result = RegisterUserSchema.safeParse(input);
        expect(result.success).toBe(false);
      });

      it('should reject weak passwords lacking required character classes', () => {
        // Missing uppercase
        expect(
          RegisterUserSchema.safeParse({
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'j@l.org',
            password: 'password123!',
          }).success,
        ).toBe(false);
        // Missing lowercase
        expect(
          RegisterUserSchema.safeParse({
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'j@l.org',
            password: 'PASSWORD123!',
          }).success,
        ).toBe(false);
        // Missing number
        expect(
          RegisterUserSchema.safeParse({
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'j@l.org',
            password: 'Password!@#',
          }).success,
        ).toBe(false);
        // Missing special character
        expect(
          RegisterUserSchema.safeParse({
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'j@l.org',
            password: 'Password123',
          }).success,
        ).toBe(false);
        // Too short (< 8 chars)
        expect(
          RegisterUserSchema.safeParse({
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'j@l.org',
            password: 'Pa1!',
          }).success,
        ).toBe(false);
      });

      it('should strip unexpected fields', () => {
        const input = {
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@lms.org',
          password: 'Password123!',
          role: 'ROLE_ADMIN', // Mass assignment attempt
        };
        const result = RegisterUserSchema.parse(input);
        expect(result).not.toHaveProperty('role');
      });
    });

    describe('LoginUserSchema', () => {
      it('should accept valid login credentials and normalize email', () => {
        const input = { email: '  PATRON@LMS.ORG ', password: 'Password123!' };
        const result = LoginUserSchema.parse(input);
        expect(result.email).toBe('patron@lms.org');
        expect(result.password).toBe('Password123!');
      });

      it('should reject missing email or password', () => {
        expect(LoginUserSchema.safeParse({ email: 'patron@lms.org' }).success).toBe(false);
        expect(LoginUserSchema.safeParse({ password: 'Password123!' }).success).toBe(false);
        expect(LoginUserSchema.safeParse({ email: '', password: 'Password123!' }).success).toBe(
          false,
        );
      });
    });
  });

  describe('User Schemas', () => {
    describe('ChangePasswordSchema', () => {
      it('should accept valid change password payload', () => {
        const input = { currentPassword: 'OldPassword123!', newPassword: 'NewPassword123!' };
        const result = ChangePasswordSchema.parse(input);
        expect(result.currentPassword).toBe('OldPassword123!');
        expect(result.newPassword).toBe('NewPassword123!');
      });

      it('should reject weak new password', () => {
        const input = { currentPassword: 'OldPassword123!', newPassword: 'weak' };
        const result = ChangePasswordSchema.safeParse(input);
        expect(result.success).toBe(false);
      });
    });

    describe('UserIdParamSchema', () => {
      it('should accept valid userId ObjectId', () => {
        const result = UserIdParamSchema.safeParse({ userId: '64f1a2b3c4d5e6f7a8b9c0d1' });
        expect(result.success).toBe(true);
      });

      it('should reject malformed userId', () => {
        const result = UserIdParamSchema.safeParse({ userId: 'invalid-user-id' });
        expect(result.success).toBe(false);
      });
    });

    describe('UpdateUserStatusSchema', () => {
      it('should accept ACTIVE and SUSPENDED status values with reason', () => {
        const activeResult = UpdateUserStatusSchema.parse({
          status: 'ACTIVE',
          reason: 'Patron cleared all overdue penalties',
        });
        expect(activeResult.status).toBe('ACTIVE');

        const suspendedResult = UpdateUserStatusSchema.parse({
          status: 'SUSPENDED',
          reason: 'Excessive overdue loans requiring review',
        });
        expect(suspendedResult.status).toBe('SUSPENDED');
      });

      it('should reject unsupported status values', () => {
        expect(
          UpdateUserStatusSchema.safeParse({ status: 'PENDING', reason: 'valid reason' }).success,
        ).toBe(false);
        expect(
          UpdateUserStatusSchema.safeParse({ status: 'DELETED', reason: 'valid reason' }).success,
        ).toBe(false);
      });

      it('should reject missing or too short reason', () => {
        expect(UpdateUserStatusSchema.safeParse({ status: 'ACTIVE' }).success).toBe(false);
        expect(UpdateUserStatusSchema.safeParse({ status: 'ACTIVE', reason: 'bad' }).success).toBe(
          false,
        );
      });
    });
  });

  describe('Book Schemas', () => {
    describe('BookLocationSchema', () => {
      it('should accept valid aisle and shelf coordinates', () => {
        const result = BookLocationSchema.parse({ aisle: 'A-3', shelf: 'S-12' });
        expect(result.aisle).toBe('A-3');
        expect(result.shelf).toBe('S-12');
      });

      it('should reject empty coordinates', () => {
        expect(BookLocationSchema.safeParse({ aisle: '', shelf: 'S-1' }).success).toBe(false);
        expect(BookLocationSchema.safeParse({ aisle: 'A-1', shelf: '' }).success).toBe(false);
      });
    });

    describe('CreateBookSchema', () => {
      it('should accept valid book payload and normalize ISBN', () => {
        const input = {
          title: 'Clean Architecture',
          author: 'Robert C. Martin',
          isbn: '978-0-13-449416-6',
          genre: BookGenre.SOFTWARE_ENGINEERING,
          description: 'A guide to software architecture and design principles.',
          publisher: 'Prentice Hall',
          publicationYear: 2017,
          totalCopies: 5,
          location: { aisle: 'B-2', shelf: 'S-04' },
        };
        const result = CreateBookSchema.parse(input);
        expect(result.title).toBe('Clean Architecture');
        expect(result.isbn).toBe('978-0-13-449416-6');
        expect(result.genre).toBe(BookGenre.SOFTWARE_ENGINEERING);
        expect(result.totalCopies).toBe(5);
        expect(result.location.aisle).toBe('B-2');
      });

      it('should accept valid 10-digit ISBN', () => {
        const input = {
          title: 'Design Patterns',
          author: 'Gang of Four',
          isbn: '0-201-63361-2',
          genre: BookGenre.COMPUTER_SCIENCE,
          description: 'Elements of reusable object-oriented software.',
          publisher: 'Addison-Wesley',
          publicationYear: 1994,
          totalCopies: 3,
          location: { aisle: 'B-1', shelf: 'S-01' },
        };
        const result = CreateBookSchema.parse(input);
        expect(result.isbn).toBe('0-201-63361-2');
      });

      it('should reject invalid ISBN format', () => {
        const input = {
          title: 'Book',
          author: 'Author',
          isbn: '12345',
          genre: BookGenre.TECHNOLOGY,
          description: 'Desc',
          publisher: 'Pub',
          publicationYear: 2020,
          totalCopies: 1,
          location: { aisle: 'A-1', shelf: 'S-1' },
        };
        expect(CreateBookSchema.safeParse(input).success).toBe(false);
      });

      it('should reject totalCopies < 1', () => {
        const input = {
          title: 'Book',
          author: 'Author',
          isbn: '978-0-13-449416-6',
          genre: BookGenre.TECHNOLOGY,
          description: 'Desc',
          publisher: 'Pub',
          publicationYear: 2020,
          totalCopies: 0,
          location: { aisle: 'A-1', shelf: 'S-1' },
        };
        expect(CreateBookSchema.safeParse(input).success).toBe(false);
      });

      it('should reject non-HTTPS coverImageUrl', () => {
        const input = {
          title: 'Book',
          author: 'Author',
          isbn: '978-0-13-449416-6',
          genre: BookGenre.TECHNOLOGY,
          description: 'Desc',
          publisher: 'Pub',
          publicationYear: 2020,
          totalCopies: 1,
          location: { aisle: 'A-1', shelf: 'S-1' },
          coverImageUrl: 'http://insecure.org/img.png',
        };
        expect(CreateBookSchema.safeParse(input).success).toBe(false);
      });
    });

    describe('UpdateBookSchema', () => {
      it('should accept partial book updates', () => {
        const result = UpdateBookSchema.parse({ title: 'Updated Title' });
        expect(result.title).toBe('Updated Title');
        expect(result.author).toBeUndefined();
      });

      it('should reject totalCopies < 1 in update', () => {
        expect(UpdateBookSchema.safeParse({ totalCopies: 0 }).success).toBe(false);
      });
    });

    describe('BookSearchQuerySchema', () => {
      it('should parse search and filter parameters with defaults', () => {
        const result = BookSearchQuerySchema.parse({
          q: 'architecture',
          genre: 'Technology',
          available: 'true',
          sortBy: 'title',
          sortOrder: 'asc',
        });
        expect(result.q).toBe('architecture');
        expect(result.genre).toBe('Technology');
        expect(result.available).toBe(true);
        expect(result.sortBy).toBe('title');
        expect(result.sortOrder).toBe('asc');
      });

      it('should reject invalid sort field', () => {
        const result = BookSearchQuerySchema.safeParse({ sortBy: 'invalidField' });
        expect(result.success).toBe(false);
      });
    });

    describe('BookIdParamSchema', () => {
      it('should accept valid bookId ObjectId', () => {
        const result = BookIdParamSchema.safeParse({ bookId: '64f1a2b3c4d5e6f7a8b9c0d1' });
        expect(result.success).toBe(true);
      });

      it('should reject malformed bookId', () => {
        const result = BookIdParamSchema.safeParse({ bookId: 'invalid' });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Circulation Schemas', () => {
    describe('BorrowBookSchema', () => {
      it('should accept valid bookId', () => {
        const result = BorrowBookSchema.safeParse({ bookId: '64f1a2b3c4d5e6f7a8b9c0d1' });
        expect(result.success).toBe(true);
      });

      it('should reject invalid bookId', () => {
        expect(BorrowBookSchema.safeParse({ bookId: 'invalid' }).success).toBe(false);
      });
    });

    describe('BorrowingIdParamSchema', () => {
      it('should accept valid borrowingId', () => {
        const result = BorrowingIdParamSchema.safeParse({
          borrowingId: '64f1a2b3c4d5e6f7a8b9c0d1',
        });
        expect(result.success).toBe(true);
      });

      it('should reject invalid borrowingId', () => {
        expect(BorrowingIdParamSchema.safeParse({ borrowingId: 'bad-id' }).success).toBe(false);
      });
    });

    describe('AdminReturnOverrideSchema', () => {
      it('should accept valid admin remarks >= 5 characters', () => {
        const result = AdminReturnOverrideSchema.parse({
          adminRemarks: 'Damaged item settled with fine override',
        });
        expect(result.adminRemarks).toBe('Damaged item settled with fine override');
      });

      it('should reject short remarks < 5 characters', () => {
        expect(AdminReturnOverrideSchema.safeParse({ adminRemarks: 'done' }).success).toBe(false);
      });
    });

    describe('AdminBorrowingsQuerySchema', () => {
      it('should parse filters for borrowings roster', () => {
        const result = AdminBorrowingsQuerySchema.parse({
          status: 'ACTIVE',
          userId: '64f1a2b3c4d5e6f7a8b9c0d1',
          bookId: '64f1a2b3c4d5e6f7a8b9c0d2',
          page: '2',
          limit: '15',
        });
        expect(result.status).toBe('ACTIVE');
        expect(result.userId).toBe('64f1a2b3c4d5e6f7a8b9c0d1');
        expect(result.bookId).toBe('64f1a2b3c4d5e6f7a8b9c0d2');
        expect(result.page).toBe(2);
        expect(result.limit).toBe(15);
      });
    });
  });

  describe('Audit Schemas', () => {
    describe('AuditQuerySchema', () => {
      it('should parse valid audit log query options', () => {
        const result = AuditQuerySchema.parse({
          actorId: '64f1a2b3c4d5e6f7a8b9c0d1',
          action: 'BOOK_CREATED',
          page: '2',
          limit: '10',
          startDate: '2026-01-01T00:00:00.000Z',
          endDate: '2026-12-31T23:59:59.999Z',
        });
        expect(result.actorId).toBe('64f1a2b3c4d5e6f7a8b9c0d1');
        expect(result.action).toBe('BOOK_CREATED');
        expect(result.page).toBe(2);
        expect(result.limit).toBe(10);
      });

      it('should reject invalid ISO date format', () => {
        expect(AuditQuerySchema.safeParse({ startDate: 'not-a-date' }).success).toBe(false);
      });
    });
  });
});
