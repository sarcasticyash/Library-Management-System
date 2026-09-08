/**
 * Cloud-Native Library Management System (LMS)
 * Shared Domain & Business Constants
 *
 * All values are locked per Phase 1 (SRS), Phase 3 (Database Architecture),
 * and Phase 4 (Backend Architecture).
 */

/**
 * Business Rule BR-01 & Invariant INV-04:
 * Maximum active or overdue loans a patron can simultaneously hold.
 */
export const MAX_ACTIVE_LOANS_PER_PATRON = 5;

/**
 * Business Rule BR-02:
 * Standard loan duration in calendar days from checkout date.
 */
export const DEFAULT_LOAN_DURATION_DAYS = 14;

/**
 * Pagination Defaults per Phase 4 Section 13 (Offset-based Pagination).
 */
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

/**
 * Authentication & Password Complexity Rules per Phase 6 & Phase 4 Section 12.1.
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 numeric digit
 * - At least 1 special character
 */
export const PASSWORD_MIN_LENGTH = 8;
export const REGEX_PASSWORD =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

/**
 * Canonical 24-character hexadecimal MongoDB ObjectId string pattern.
 */
export const REGEX_OBJECT_ID = /^[0-9a-fA-F]{24}$/;

/**
 * ISBN-10 and ISBN-13 format validation pattern.
 * Supports standard ISBN-10 (10 characters, optional 'X' check digit)
 * and ISBN-13 (13 digits, prefix 978 or 979), with optional hyphens or spaces.
 */
export const REGEX_ISBN = /^(?:97[89][ -]?)?(?:[0-9][ -]?){9}[0-9X]$/i;
