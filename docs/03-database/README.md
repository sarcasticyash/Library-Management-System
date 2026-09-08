# 03 - Database Architecture & Persistence Design

[![Database Spec Version](https://img.shields.io/badge/Database_Architecture-v1.2.0_(Locked_and_Approved)-green)](DATABASE_ARCHITECTURE.md)
[![Current Phase](https://img.shields.io/badge/Current_Phase-Phase_3:_Database_Architecture-orange)](DATABASE_ARCHITECTURE.md)
[![Implementation Gate](https://img.shields.io/badge/Implementation-Gated_Until_Phase_14-red)](../../README.md#-lifecycle-governance--15-phase-roadmap)

---

## Overview
This directory contains the authoritative **Database Architecture Specification** for the **Cloud-Native Library Management System (LMS)**. 

The persistence layer is designed for **MongoDB Atlas**, structured specifically for a clean modular application architecture. In strict compliance with engineering lifecycle governance, **zero application source code, Mongoose model files, or database queries have been implemented in this phase.**

👉 **[Read the Full Database Architecture Specification](DATABASE_ARCHITECTURE.md)**

---

## Key Persistence Highlights

### 1. Approved Collections
- **`users`**: Manages patron and administrator identities, hashed credentials, roles (`ROLE_PATRON`, `ROLE_ADMIN`), account statuses (`ACTIVE`, `SUSPENDED`), and active loan counters (`0 <= activeBorrowCount <= 5`).
- **`books`**: Houses literary catalog metadata, physical shelf coordinates (`location: { aisle, shelf }`), stock copy counts (`totalCopies`, `availableCopies`), and soft-deletion lifecycle state (`isDeleted`).
- **`borrowings`**: Manages circulation transactions across their three approved lifecycle states (**`ACTIVE`**, **`OVERDUE`**, **`RETURNED`**), checkout dates, and standard 14-day due dates.
- **`sessions`**: Manages session refresh tokens, rotation family tracking, and automated background purging via native MongoDB Time-To-Live (TTL) indexing (`expireAfterSeconds: 0`).
- **`audit_logs`**: Houses an application-level append-only historical audit ledger with restricted write and administrative access controls, capturing administrative actions (`BOOK_CREATED`, `BOOK_UPDATED`, `BOOK_DEACTIVATED`, `USER_STATUS_UPDATED`, `ADMIN_RETURN_OVERRIDE`) and security events.

### 2. Circulation Consistency & Inventory Invariants
The architecture mathematically guarantees six formal consistency invariants:
- **Non-Negative Stock**: `availableCopies >= 0` under all concurrent conditions.
- **Stock Conservation**: `availableCopies <= totalCopies`.
- **Active Loan Balance**: `totalCopies = availableCopies + sum(activeLoans)`.
- **Patron Quota Bound**: A patron cannot exceed **5 active loans** simultaneously.
- **Single Active Loan Per Title (INV-06)**: Competing transactions cannot grant duplicate active loans for the same book to the same patron (grounded in `FR-BORROW-001`, `BR-CIRC-005`). Concurrency-safe enforcement is mandated at the persistence layer via partial unique indexing (`idx_borrowings_active_user_book`) rather than check-then-act application queries alone.
- **Authoritative Overdue Evaluation**: Hybrid model where real-time temporal truth (`returnDate == null && now > dueDate`) governs patron eligibility and invariants, while persisted `status` enables indexed dashboard reporting.

### 3. Concurrency & Transaction Strategy
- **Single-Document Atomic Operations**: Leveraged for single-entity mutations (user profile updates, book metadata edits, session invalidation).
- **Multi-Document ACID Transactions**: Leveraged strictly for circulation checkout and return workflows, ensuring stock modifications, patron quota updates, and loan records commit or roll back as an atomic unit.
- **Audit Consistency Policy**: Two-tier model distinguishing atomic business-audit operations (user suspension, return override) from decoupled audit recording (routine borrow/return).

### 4. Indexing & Search Architecture
- **Catalog Search**: Multi-field text-search index (`$text`) across `title`, `author`, and `description`, providing relevance-ranked catalog search with zero third-party cloud infrastructure costs.
- **Compound Query Indexes**: Dedicated indexes for user email uniqueness, ISBN uniqueness, active duplicate loan prevention (`idx_borrowings_active_user_book`), faceted genre/availability search, patron active loans, overdue scanning, and audit log chronological streams.

---

## Documents in This Section
- **[`DATABASE_ARCHITECTURE.md`](DATABASE_ARCHITECTURE.md)**: Authoritative 26-section Database Architecture Specification (Version 1.2.0 — Baseline Locked and Approved).
