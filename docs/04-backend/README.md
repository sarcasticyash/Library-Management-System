# 04 - Backend Architecture & API Design

[![Backend Spec Version](https://img.shields.io/badge/Backend_Architecture-v1.1.0_(Locked_and_Approved)-green)](BACKEND_ARCHITECTURE_AND_API_DESIGN.md)
[![Current Phase](https://img.shields.io/badge/Current_Phase-Phase_4:_Backend_Architecture-orange)](BACKEND_ARCHITECTURE_AND_API_DESIGN.md)
[![Implementation Gate](https://img.shields.io/badge/Implementation-Gated_Until_Phase_14-red)](../../README.md#-lifecycle-governance--15-phase-roadmap)

---

## Overview
This directory contains the authoritative **Backend Architecture and API Design Specification** for the **Cloud-Native Library Management System (LMS)**. 

The backend architecture translates the approved functional requirements (Phase 1), system design models (Phase 2), and database persistence architecture (Phase 3) into formal software component boundaries, controller-service-repository patterns, middleware pipelines, and RESTful API contracts.

In strict compliance with engineering lifecycle governance, **zero application source code, Express routes, controllers, or database models have been implemented in this phase.**

👉 **[Read the Full Backend Architecture & API Design Specification](BACKEND_ARCHITECTURE_AND_API_DESIGN.md)**

---

## Key Backend Architectural Highlights

### 1. Layered Clean Architecture
- **API & Routing Boundary**: Request reception, correlation (`X-Correlation-ID`), authentication and role guards, and schema input validation.
- **Controller Layer**: Protocol adapter; extracts validated parameters and `req.user` context, invokes domain services, formats RFC 7807 responses. **Zero business logic.**
- **Service Layer**: Pure domain rules, multi-entity orchestration, transaction Unit of Work demarcation, and audit dispatch. **Protocol agnostic.**
- **Repository Layer**: Data access abstraction; MongoDB query construction, session passing, document-to-entity mapping. **Zero HTTP concerns.**

### 2. Standardized Error Architecture (RFC 7807)
- Unified problem-details error envelope across all endpoints (`type`, `title`, `status`, `code`, `detail`, `instance`, `timestamp`, `correlationId`, `errors`).
- Domain-specific machine-readable codes (`DUPLICATE_ACTIVE_LOAN`, `BORROWING_QUOTA_EXCEEDED`, `BOOK_UNAVAILABLE`, `ACCOUNT_SUSPENDED`, `ALREADY_RETURNED`).

### 3. Concurrency-Safe Circulation Service (INV-01 to INV-06)
- **Borrowing Workflow**: Multi-Document ACID Transaction coordinating stock decrement, patron quota increment ($\le 5$), and loan creation.
- **Two-Tier Race Defense (INV-06 / DBD-08)**: Preliminary application read check backed by mandatory persistence-level compound unique partial indexing (`idx_borrowings_active_user_book`). Competing duplicate requests trigger atomic rollback and translate to HTTP 409 Conflict.
- **Return Workflow**: ACID transaction restoring inventory stock, updating loan status to `RETURNED`, and decrementing `activeBorrowCount`. Fully idempotent against duplicate returns (returns `409 ALREADY_RETURNED`).

### 4. Authoritative Overdue Status Evaluation (DBD-09)
- Real-time temporal truth formula: $\text{isOverdue}(loan) \iff (returnDate == null \land now > dueDate)$.
- Zero dependency on external cron jobs or background schedulers for business correctness.
- Stored `borrowings.status` enumeration leveraged for fast indexed administrative filtering (`idx_borrowings_overdue_scan`).

### 5. Two-Tier Audit Consistency Governance
- **Tier 1 (Atomic Business-Audit)**: Sensitive administrative mutations (patron suspension, staff return override) share an atomic transaction session with the audit log.
- **Tier 2 (Decoupled Audit)**: Routine patron circulation operations commit business state immediately; audit logs are recorded reliably post-commit via an in-process reliable event dispatcher.

---

## Documents in This Section
- **[`BACKEND_ARCHITECTURE_AND_API_DESIGN.md`](BACKEND_ARCHITECTURE_AND_API_DESIGN.md)**: Authoritative 19-section Backend Architecture and API Design Specification (Version 1.1.0 — Baseline Locked and Approved).
