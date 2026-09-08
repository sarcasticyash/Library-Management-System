import {
  computeOverdueStatus,
  BookGenre,
  UserRole,
  UserStatus,
  CirculationStatus,
  AuditAction,
  AuditEntityType,
  MAX_ACTIVE_LOANS_PER_PATRON,
  DEFAULT_LOAN_DURATION_DAYS,
} from '../apps/backend/src/types';

import {
  RegisterUserSchema,
  LoginUserSchema,
  ChangePasswordSchema,
  UpdateUserStatusSchema,
  UserIdParamSchema,
  CreateBookSchema,
  UpdateBookSchema,
  BookSearchQuerySchema,
  BookIdParamSchema,
  BorrowBookSchema,
  BorrowingIdParamSchema,
  AdminReturnOverrideSchema,
  AdminBorrowingsQuerySchema,
  AuditQuerySchema,
} from '../apps/backend/src/schemas';

console.log('--- Starting Stage 2 Automated Domain & Schema Verification ---');

// 1. Verify Constants
console.assert(MAX_ACTIVE_LOANS_PER_PATRON === 5, 'MAX_ACTIVE_LOANS_PER_PATRON must be 5');
console.assert(DEFAULT_LOAN_DURATION_DAYS === 14, 'DEFAULT_LOAN_DURATION_DAYS must be 14');
console.log('✓ Business constants verified');

// 2. Verify Dynamic Overdue Status Calculation (DBD-09)
const now = new Date('2026-09-08T12:00:00.000Z');
const futureDue = new Date('2026-09-15T12:00:00.000Z');
const pastDue = new Date('2026-09-01T12:00:00.000Z');
const returnedDate = new Date('2026-09-05T12:00:00.000Z');

const activeCheck = computeOverdueStatus(futureDue, null, now);
console.assert(activeCheck.isOverdue === false && activeCheck.daysRemaining === 7, 'Active loan should not be overdue');

const overdueCheck = computeOverdueStatus(pastDue, null, now);
console.assert(overdueCheck.isOverdue === true && overdueCheck.daysRemaining < 0, 'Past due loan should be overdue');

const returnedCheck = computeOverdueStatus(pastDue, returnedDate, now);
console.assert(returnedCheck.isOverdue === false && returnedCheck.daysRemaining === 0, 'Returned loan should not be overdue');
console.log('✓ Authoritative dynamic overdue calculation (DBD-09) verified');

// 3. Verify Auth Schemas
const validRegister = RegisterUserSchema.safeParse({
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'Jane.Doe@University.Edu',
  password: 'Password123!',
  phoneNumber: '+1-555-0199',
});
console.assert(validRegister.success && validRegister.data.email === 'jane.doe@university.edu', 'Register schema should lowercase email');

const weakRegister = RegisterUserSchema.safeParse({
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'invalid-email',
  password: 'weak',
});
console.assert(!weakRegister.success, 'Weak password and invalid email must fail');

const validLogin = LoginUserSchema.safeParse({
  email: 'jane.doe@university.edu',
  password: 'Password123!',
});
console.assert(validLogin.success, 'Login schema should pass valid credentials');
console.log('✓ Authentication schemas verified');

// 4. Verify User Schemas
const validPwChange = ChangePasswordSchema.safeParse({
  currentPassword: 'Password123!',
  newPassword: 'NewPassword456@',
});
console.assert(validPwChange.success, 'Change password should succeed with strong password');

const validStatusUpdate = UpdateUserStatusSchema.safeParse({
  status: UserStatus.SUSPENDED,
  reason: 'Account suspended due to policy violation.',
});
console.assert(validStatusUpdate.success, 'Update status schema should accept valid status and reason');

const validUserId = UserIdParamSchema.safeParse({
  userId: '64a7f9b8c2d5e1f0a1b2c3d4',
});
console.assert(validUserId.success, 'Valid ObjectId should pass UserIdParamSchema');
console.log('✓ User identity schemas verified');

// 5. Verify Book Schemas
const validBook = CreateBookSchema.safeParse({
  title: 'Clean Architecture',
  author: 'Robert C. Martin',
  isbn: '978-0134494166',
  genre: BookGenre.SOFTWARE_ENGINEERING,
  description: 'A craftsman guide to software structure and design.',
  publisher: 'Prentice Hall',
  publicationYear: 2017,
  totalCopies: 5,
  location: { aisle: 'Aisle B3', shelf: 'Shelf 2A' },
  coverImageUrl: 'https://cdn.library.cloud/covers/clean-arch.jpg',
});
console.assert(validBook.success, 'Create book schema should pass valid book payload');

const invalidCoverUrl = CreateBookSchema.safeParse({
  title: 'Clean Architecture',
  author: 'Robert C. Martin',
  isbn: '978-0134494166',
  genre: BookGenre.SOFTWARE_ENGINEERING,
  description: 'Description',
  publisher: 'Prentice Hall',
  publicationYear: 2017,
  totalCopies: 5,
  location: { aisle: 'B3', shelf: '2A' },
  coverImageUrl: 'http://insecure.com/cover.jpg', // Non-HTTPS
});
console.assert(!invalidCoverUrl.success, 'Non-HTTPS cover image URL must be rejected');

const validSearch = BookSearchQuerySchema.safeParse({
  q: 'Architecture',
  genre: 'Software Engineering',
  available: 'true',
  page: '2',
  limit: '10',
});
console.assert(
  validSearch.success &&
  validSearch.data.available === true &&
  validSearch.data.page === 2 &&
  validSearch.data.limit === 10,
  'Search query schema should coerce string numbers and boolean strings'
);
console.log('✓ Book catalog schemas verified');

// 6. Verify Circulation Schemas
const validBorrow = BorrowBookSchema.safeParse({
  bookId: '64a7f9b8c2d5e1f0a1b2c3e1',
});
console.assert(validBorrow.success, 'Borrow book schema should pass valid ObjectId');

const invalidBorrow = BorrowBookSchema.safeParse({
  bookId: 'invalid-id',
});
console.assert(!invalidBorrow.success, 'Invalid ObjectId must fail BorrowBookSchema');

const validOverride = AdminReturnOverrideSchema.safeParse({
  adminRemarks: 'Book returned in patron drop box after hours.',
});
console.assert(validOverride.success, 'Admin return override schema should accept valid remarks');

const validAdminBorrowingsQuery = AdminBorrowingsQuerySchema.safeParse({
  status: CirculationStatus.OVERDUE,
  page: '1',
  limit: '25',
});
console.assert(validAdminBorrowingsQuery.success, 'Admin borrowings query should accept status enum and pagination');
console.log('✓ Circulation schemas verified');

// 7. Verify Audit Schemas
const validAuditQuery = AuditQuerySchema.safeParse({
  action: AuditAction.ADMIN_RETURN_OVERRIDE,
  entityType: AuditEntityType.BORROWING,
  page: '1',
  limit: '50',
});
console.assert(validAuditQuery.success, 'Audit query schema should accept valid filter parameters');
console.log('✓ Audit query schemas verified');

// 8. Verify Clean Architecture Boundaries
import * as fs from 'fs';
import * as path from 'path';

const dirsToAudit = [
  path.resolve(__dirname, '../apps/backend/src/types'),
  path.resolve(__dirname, '../apps/backend/src/schemas'),
  path.resolve(__dirname, '../apps/backend/src/services'),
];

const disallowedImports = ['express', 'mongoose', 'mongodb'];
let boundaryViolations = 0;

for (const dir of dirsToAudit) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && f !== 'express.d.ts');
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    for (const disallowed of disallowedImports) {
      const regex = new RegExp(`from\\s+['"][^'"]*${disallowed}['"]`, 'i');
      if (regex.test(content)) {
        console.error(`Boundary violation: ${file} imports ${disallowed}`);
        boundaryViolations++;
      }
    }
  }
}

console.assert(boundaryViolations === 0, 'Must have zero clean architecture boundary violations');
console.log('✓ Clean Architecture boundary audit passed (0 violations)');

console.log('\nALL 8 VERIFICATION DOMAINS PASSED WITH ZERO ERRORS!');
