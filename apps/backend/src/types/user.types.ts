/**
 * Cloud-Native Library Management System (LMS)
 * User & Identity Domain Types
 *
 * Governed by Phase 1 (FR-AUTH, FR-USER, FR-ADMIN),
 * Phase 3 (Collection: users), and Phase 4 Section 7 & 12.
 */

export enum UserRole {
  PATRON = 'ROLE_PATRON',
  ADMIN = 'ROLE_ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

/**
 * Complete User domain entity as maintained by persistence boundary.
 */
export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  activeBorrowCount: number;
  phoneNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Public User profile representation (sensitive fields such as passwordHash omitted).
 */
export interface IUserPublic {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  activeBorrowCount: number;
  phoneNumber: string | null;
  createdAt: Date | string;
}

/**
 * Authenticated user context bound to incoming requests by authentication middleware.
 */
export interface AuthUserContext {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  sessionId?: string;
}
