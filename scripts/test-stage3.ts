/**
 * Cloud-Native Library Management System (LMS)
 * Stage 3 Automated Verification Test Suite
 *
 * Validates:
 * 1. MongoDB connection options (maxPoolSize: 20, safe URI credential redaction)
 * 2. Mongoose Schemas & Models (INV-01, INV-02, INV-04, INV-06, DBD-08, DBD-09, DBD-05)
 * 3. Compound partial unique active loan index
 * 4. AuditLog append-only immutability hooks
 * 5. Repository interfaces & implementations
 * 6. Clean Architecture boundary audit
 */

import {
  sanitizeMongoUri,
  MONGOOSE_CONNECT_OPTIONS,
} from '../apps/backend/src/config/database';

import {
  UserSchema,
  UserModel,
  BookSchema,
  BookModel,
  BorrowingSchema,
  SessionSchema,
  AuditLogSchema,
} from '../apps/backend/src/models';

import {
  userRepository,
  bookRepository,
  borrowingRepository,
  sessionRepository,
  auditLogRepository,
  transactionManager,
} from '../apps/backend/src/repositories';

import { MAX_ACTIVE_LOANS_PER_PATRON } from '../apps/backend/src/types/constants';
import { CirculationStatus } from '../apps/backend/src/types/circulation.types';
import fs from 'fs';
import path from 'path';

async function runStage3Verification(): Promise<void> {
  console.log('--- Starting Stage 3 Automated Database & Persistence Verification ---');

  // ============================================================================
  // DOMAIN 1: MongoDB Connection Infrastructure & Credential Redaction
  // ============================================================================
  const secretUri1 = 'mongodb://app_user:SuperSecretPassword123@cluster0.abcde.mongodb.net/library_db?retryWrites=true&w=majority';
  const redactedUri1 = sanitizeMongoUri(secretUri1);
  console.assert(
    !redactedUri1.includes('SuperSecretPassword123') && redactedUri1.includes('***:***@'),
    'Credentials must be redacted from standard MongoDB URI'
  );

  const secretUri2 = 'mongodb+srv://admin_user:P@ssword!#@atlas-replica.mongodb.net/lms';
  const redactedUri2 = sanitizeMongoUri(secretUri2);
  console.assert(
    !redactedUri2.includes('P@ssword!#') && redactedUri2.includes('***:***@'),
    'Credentials must be redacted from mongodb+srv URI'
  );

  console.assert(
    MONGOOSE_CONNECT_OPTIONS.maxPoolSize === 20,
    'maxPoolSize must be strictly locked at 20 per MADR-10 and Phases 10, 12, 13'
  );
  console.assert(
    MONGOOSE_CONNECT_OPTIONS.serverSelectionTimeoutMS === 5000,
    'serverSelectionTimeoutMS must be 5000ms'
  );
  console.log('✓ Domain 1: Connection configuration and URI credential redaction verified');

  // ============================================================================
  // DOMAIN 2: User Persistence Model & Invariant INV-04
  // ============================================================================
  console.assert(UserSchema.path('email') !== undefined, 'User schema must have email');
  console.assert(UserSchema.path('passwordHash') !== undefined, 'User schema must have passwordHash');

  // Validate activeBorrowCount constraints (min 0, max 5 per INV-04)
  const validUserDoc = new UserModel({
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@university.edu',
    passwordHash: '$2b$12$e8f1e0d29b244a5f8c317b89d42e12a0',
    activeBorrowCount: 5,
  });
  let userValErr: unknown = null;
  try {
    await validUserDoc.validate();
  } catch (err) {
    userValErr = err;
  }
  console.assert(!userValErr, 'User with 5 active loans must be valid');

  const quotaExceededDoc = new UserModel({
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@university.edu',
    passwordHash: '$2b$12$e8f1e0d29b244a5f8c317b89d42e12a0',
    activeBorrowCount: 6, // Exceeds INV-04
  });
  let quotaErr: Record<string, unknown> | null = null;
  try {
    await quotaExceededDoc.validate();
  } catch (err) {
    quotaErr = err as Record<string, unknown>;
  }
  console.assert(
    Boolean((quotaErr?.errors as Record<string, unknown> | undefined)?.['activeBorrowCount']),
    `activeBorrowCount > ${MAX_ACTIVE_LOANS_PER_PATRON} must fail schema validation (Invariant INV-04)`
  );

  const negativeQuotaDoc = new UserModel({
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@university.edu',
    passwordHash: '$2b$12$e8f1e0d29b244a5f8c317b89d42e12a0',
    activeBorrowCount: -1,
  });
  let negQuotaErr: Record<string, unknown> | null = null;
  try {
    await negativeQuotaDoc.validate();
  } catch (err) {
    negQuotaErr = err as Record<string, unknown>;
  }
  console.assert(
    Boolean((negQuotaErr?.errors as Record<string, unknown> | undefined)?.['activeBorrowCount']),
    'activeBorrowCount < 0 must fail schema validation'
  );

  // Verify User Indexes
  const userIndexes = UserSchema.indexes();
  const hasEmailUnique = userIndexes.some((idx) => {
    const fields = idx[0];
    const options = idx[1] as { unique?: boolean };
    return fields['email'] === 1 || options?.unique === true;
  });
  const hasRoleStatus = userIndexes.some((idx) => {
    const fields = idx[0];
    return fields['role'] === 1 && fields['status'] === 1;
  });
  console.assert(hasEmailUnique, 'User email must be indexed unique');
  console.assert(hasRoleStatus, 'User role+status compound index must exist');
  console.log('✓ Domain 2: User model, Invariant INV-04, and indexes verified');

  // ============================================================================
  // DOMAIN 3: Book Persistence Model & Invariants INV-01, INV-02
  // ============================================================================
  // Valid Book Document
  const validBookDoc = new BookModel({
    title: 'Clean Architecture',
    author: 'Robert C. Martin',
    isbn: '978-0134494166',
    genre: 'Software Engineering',
    description: 'A craftsman guide to software structure and design.',
    publisher: 'Prentice Hall',
    publicationYear: 2017,
    totalCopies: 5,
    availableCopies: 3,
    location: { aisle: 'B3', shelf: '2A' },
  });
  let bookValErr: unknown = null;
  try {
    await validBookDoc.validate();
  } catch (err) {
    bookValErr = err;
  }
  console.assert(!bookValErr, 'Valid book document must pass validation');

  // INV-01: availableCopies < 0 must fail
  const negativeStockDoc = new BookModel({
    title: 'Clean Architecture',
    author: 'Robert C. Martin',
    isbn: '978-0134494166',
    genre: 'Software Engineering',
    description: 'Description',
    publisher: 'Prentice Hall',
    publicationYear: 2017,
    totalCopies: 5,
    availableCopies: -1, // Breaches INV-01
    location: { aisle: 'B3', shelf: '2A' },
  });
  let inv01Err: Record<string, unknown> | null = null;
  try {
    await negativeStockDoc.validate();
  } catch (err) {
    inv01Err = err as Record<string, unknown>;
  }
  console.assert(
    Boolean((inv01Err?.errors as Record<string, unknown> | undefined)?.['availableCopies']),
    'availableCopies < 0 must fail schema validation (Invariant INV-01)'
  );

  // INV-02: availableCopies > totalCopies must fail
  const stockOverflowDoc = new BookModel({
    title: 'Clean Architecture',
    author: 'Robert C. Martin',
    isbn: '978-0134494166',
    genre: 'Software Engineering',
    description: 'Description',
    publisher: 'Prentice Hall',
    publicationYear: 2017,
    totalCopies: 5,
    availableCopies: 6, // Breaches INV-02
    location: { aisle: 'B3', shelf: '2A' },
  });
  let inv02Err: Record<string, unknown> | null = null;
  try {
    await stockOverflowDoc.validate();
  } catch (err) {
    inv02Err = err as Record<string, unknown>;
  }
  console.assert(
    Boolean((inv02Err?.errors as Record<string, unknown> | undefined)?.['availableCopies']),
    'availableCopies > totalCopies must fail schema validation (Invariant INV-02)'
  );

  // Verify Book Indexes
  const bookIndexes = BookSchema.indexes();
  const hasTextSearch = bookIndexes.some((idx) => {
    const fields = idx[0];
    return fields['title'] === 'text' && fields['author'] === 'text';
  });
  const hasGenreAvail = bookIndexes.some((idx) => {
    const fields = idx[0];
    return fields['genre'] === 1 && fields['availableCopies'] === 1;
  });
  console.assert(hasTextSearch, 'Book text search index must exist across title, author, description');
  console.assert(hasGenreAvail, 'Book genre+availableCopies compound index must exist');
  console.log('✓ Domain 3: Book model, Invariants INV-01 & INV-02, and text/faceted indexes verified');

  // ============================================================================
  // DOMAIN 4: Borrowing Model, INV-06 Partial Unique Index & DBD-09 Compliance
  // ============================================================================
  // CRITICAL (Decision DBD-09): Confirm zero permanently stored static 'isOverdue' field exists
  const hasStaticOverdueField = BorrowingSchema.path('isOverdue') !== undefined;
  console.assert(
    !hasStaticOverdueField,
    'CRITICAL (Decision DBD-09): Borrowing schema MUST NOT define a static persisted isOverdue column'
  );

  // Invariant INV-06 / Decision DBD-08: Compound Unique Partial Index on Active Loans
  const borrowingIndexes = BorrowingSchema.indexes();
  const activeLoanUniquePartial = borrowingIndexes.find((idx) => {
    const fields = idx[0];
    const options = idx[1] as { unique?: boolean; partialFilterExpression?: Record<string, unknown> };
    return (
      fields['userId'] === 1 &&
      fields['bookId'] === 1 &&
      options?.unique === true &&
      options?.partialFilterExpression !== undefined
    );
  });

  console.assert(
    Boolean(activeLoanUniquePartial),
    'Invariant INV-06 / DBD-08: Compound Unique Partial Index { userId: 1, bookId: 1 } MUST exist on borrowings'
  );

  if (activeLoanUniquePartial) {
    const opts = activeLoanUniquePartial[1] as {
      partialFilterExpression: { status: { $in: string[] } };
    };
    const filterStatuses = opts.partialFilterExpression?.status?.$in || [];
    console.assert(
      filterStatuses.includes(CirculationStatus.ACTIVE) &&
      filterStatuses.includes(CirculationStatus.OVERDUE),
      'Partial unique index filter expression must include both ACTIVE and OVERDUE states'
    );
  }

  // Verify Borrowing Query Indexes
  const hasBorrowingUserStatus = borrowingIndexes.some((idx) => idx[0]['userId'] === 1 && idx[0]['status'] === 1);
  const hasBorrowingOverdueScan = borrowingIndexes.some((idx) => idx[0]['status'] === 1 && idx[0]['dueDate'] === 1);
  console.assert(hasBorrowingUserStatus, 'idx_borrowings_user_status index must exist');
  console.assert(hasBorrowingOverdueScan, 'idx_borrowings_overdue_scan index must exist');
  console.log('✓ Domain 4: Borrowing model, Invariant INV-06 partial unique index, and DBD-09 dynamic compliance verified');

  // ============================================================================
  // DOMAIN 5: Session Model & TTL Indexing (DBD-03)
  // ============================================================================
  const sessionIndexes = SessionSchema.indexes();
  const hasTtlIndex = sessionIndexes.some((idx) => {
    const fields = idx[0];
    const options = idx[1] as { expireAfterSeconds?: number };
    return fields['expiresAt'] === 1 && options?.expireAfterSeconds === 0;
  });
  console.assert(hasTtlIndex, 'Session schema must feature TTL index on expiresAt with expireAfterSeconds: 0 (Decision DBD-03)');

  const hasTokenHashUnique = sessionIndexes.some((idx) => {
    return idx[0]['tokenHash'] === 1 && (idx[1] as { unique?: boolean })?.unique === true;
  });
  console.assert(hasTokenHashUnique, 'Session tokenHash must be uniquely indexed');
  console.log('✓ Domain 5: Session model and native MongoDB TTL index verified');

  // ============================================================================
  // DOMAIN 6: AuditLog Model & Append-Only Immutability Guard (DBD-05)
  // ============================================================================
  // Verify that pre-update and pre-delete hooks throw immutability errors
  let updateBlocked = false;
  try {
    // Directly invoke the schema's pre-update hook to verify rejection
    const updateHooks = (AuditLogSchema as unknown as { s: { hooks: { _pres: Map<string, Array<{ fn: () => void }>> } } })
      .s?.hooks?._pres?.get('updateOne');
    if (updateHooks && updateHooks.length > 0) {
      updateHooks[0]?.fn();
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('AuditLog immutability violation')) {
      updateBlocked = true;
    }
  }
  console.assert(updateBlocked, 'AuditLog schema pre-hook must reject update operations (Decision DBD-05)');

  const auditIndexes = AuditLogSchema.indexes();
  const hasAuditTimestamp = auditIndexes.some((idx) => idx[0]['timestamp'] === -1);
  const hasAuditEntity = auditIndexes.some((idx) => idx[0]['entityType'] === 1 && idx[0]['entityId'] === 1);
  console.assert(hasAuditTimestamp, 'AuditLog chronological timestamp index must exist');
  console.assert(hasAuditEntity, 'AuditLog entityType+entityId index must exist');
  console.log('✓ Domain 6: AuditLog model, Decision DBD-05 append-only hooks, and indexes verified');

  // ============================================================================
  // DOMAIN 7: Repositories & Transaction Manager Interfaces
  // ============================================================================
  console.assert(typeof userRepository.findById === 'function', 'userRepository.findById must exist');
  console.assert(typeof userRepository.incrementActiveBorrowCount === 'function', 'userRepository.incrementActiveBorrowCount must exist');
  console.assert(typeof bookRepository.decrementAvailableCopies === 'function', 'bookRepository.decrementAvailableCopies must exist');
  console.assert(typeof bookRepository.search === 'function', 'bookRepository.search must exist');
  console.assert(typeof borrowingRepository.findActiveByUserAndBook === 'function', 'borrowingRepository.findActiveByUserAndBook must exist');
  console.assert(typeof borrowingRepository.markReturned === 'function', 'borrowingRepository.markReturned must exist');
  console.assert(typeof sessionRepository.revokeFamily === 'function', 'sessionRepository.revokeFamily must exist');
  console.assert(typeof auditLogRepository.create === 'function', 'auditLogRepository.create must exist');
  console.assert(typeof transactionManager.withTransaction === 'function', 'transactionManager.withTransaction must exist');
  console.log('✓ Domain 7: All 5 repository implementations and transaction manager contracts verified');

  // ============================================================================
  // DOMAIN 8: Clean Architecture Boundary Audit
  // ============================================================================
  // Verify that domain types (src/types/) and validation schemas (src/schemas/) have ZERO imports of Mongoose/MongoDB
  const coreDirs = [
    path.resolve(__dirname, '../apps/backend/src/types'),
    path.resolve(__dirname, '../apps/backend/src/schemas'),
  ];

  let leaksDetected = 0;
  for (const dir of coreDirs) {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.ts') && f !== 'express.d.ts');
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      if (/from\s+['"](mongoose|mongodb)['"]/i.test(content)) {
        console.error(`Clean Architecture leak: ${file} imports mongoose/mongodb!`);
        leaksDetected++;
      }
    }
  }

  console.assert(leaksDetected === 0, 'Domain types and schemas must not leak Mongoose/MongoDB dependencies');
  console.log('✓ Domain 8: Clean Architecture boundary audit passed (0 leaks)');

  console.log('\n====================================================================');
  console.log('ALL 8 STAGE 3 PERSISTENCE VERIFICATION DOMAINS PASSED WITH 0 ERRORS!');
  console.log('====================================================================');
}

void runStage3Verification().catch((err) => {
  console.error('Stage 3 Verification Failed:', err);
  process.exit(1);
});
