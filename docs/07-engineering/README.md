# 07 - Engineering Standards & Code Quality

[![Engineering Spec Version](https://img.shields.io/badge/Engineering_Standards-v1.0.0_(Locked_and_Approved)-green)](ENGINEERING_STANDARDS_AND_CODE_QUALITY.md)
[![Current Phase](https://img.shields.io/badge/Current_Phase-Phase_7:_Engineering_Standards-orange)](ENGINEERING_STANDARDS_AND_CODE_QUALITY.md)
[![Implementation Gate](https://img.shields.io/badge/Implementation-Gated_Until_Phase_14-red)](../../README.md#-lifecycle-governance--15-phase-roadmap)

---

## Overview
This directory contains the authoritative **Engineering Standards and Code Quality Architecture** for the **Cloud-Native Library Management System (LMS)**.

Phase 7 establishes a comprehensive, enforceable engineering quality contract governing how all future software components will be engineered when physical implementation is eventually authorized in Phase 14.

In strict compliance with software engineering lifecycle governance, **Phase 7 is an engineering governance, standards, and architecture specification phase only. Zero application source code (.ts, .tsx, .js, .jsx, .html, .css), package manifests (package.json), container files (Dockerfile), or deployment infrastructure have been created.**

👉 **[Read the Full Engineering Standards & Code Quality Specification](ENGINEERING_STANDARDS_AND_CODE_QUALITY.md)**

---

## Core Engineering Pillars

### 1. Strict Layered Architectural Boundaries
- **Backend Flow**: `Routes -> Middleware -> Controllers -> Services -> Repositories -> Database`.
- **Decoupled Responsibilities**: Controllers only handle HTTP translation; Services encapsulate all domain logic, invariants, and transactions; Repositories handle database persistence and projections. Cross-layer leaks are prohibited.

### 2. Maximum TypeScript Strictness & Type Safety
- **Strict Compiler Baseline**: Enforced `strict: true`, `noImplicitAny: true`, `noUncheckedIndexedAccess: true`, and `exactOptionalPropertyTypes: true`.
- **Prohibition of Unsafe Patterns**: Strict ban on `any`, `@ts-ignore`, `@ts-nocheck`, and unconstrained non-null assertions (`!`).
- **Single Source of Truth**: Data Transfer Objects (DTOs) are derived directly from authoritative Zod runtime schemas (`z.infer<typeof Schema>`).

### 3. Full Upstream Baseline Preservation
- **Phase 1**: 100% preservation of all 22 Functional Requirements (`FR-AUTH-001..004`, `FR-USER-001..002`, `FR-BOOK-001..004`, `FR-BORROW-001..004`, `FR-ADMIN-001..008`).
- **Phase 3**: Strict enforcement of Invariants `INV-01` to `INV-06`, plus dynamic real-time overdue truth (`DBD-09`) with zero static database flags.
- **Phase 4**: Canonical `/api/v1` namespace, exactly 21 approved REST endpoints, canonical parameter naming (`:bookId`, `:borrowingId`, `:userId`), and universal RFC 7807 problem details error envelopes.
- **Phase 5**: In-memory JWT access token storage (`AuthContext`), browser-managed HttpOnly refresh cookie (`Path=/api/v1/auth`), TanStack Query v5 server-state caching, and WCAG 2.1 AA accessibility.
- **Phase 6**: STRIDE threat model mitigations, RBAC role enforcement, BOLA/IDOR ownership validation, Refresh Token Family Rotation, credential redaction, and two-tier audit logging.

### 4. Measurable Code Quality & Complexity Controls
- **Quantitative Limits**: Max function length of 30 lines, max module length of 300 lines, cyclomatic complexity $\le 10$, cognitive complexity $\le 15$, and max nesting depth of 3 levels.
- **Automated Quality Gates**: Mandatory pre-merge checks covering conventional commits, clean TypeScript compilation, zero ESLint warnings, Prettier formatting, zero high/critical vulnerabilities, and circular dependency checks.

### 5. 10-Point Engineering Definition of Done (DoD)
Every future implementation item must satisfy 10 mandatory conditions (requirements completeness, architecture compliance, invariant preservation, API fidelity, security checks, accessibility compliance, static analysis, $\ge 85\%$ test coverage, TSDoc documentation, and peer review approval) before being marked as done.

---

## Documents in This Section
- **[`ENGINEERING_STANDARDS_AND_CODE_QUALITY.md`](ENGINEERING_STANDARDS_AND_CODE_QUALITY.md)**: Primary Authoritative Engineering Specification (26 numbered sections, compliance matrix, and 6 formal Architecture Decision Records).

---

## Phase Status Summary
```text
CURRENT STATUS: PERMANENTLY BASELINE LOCKED AND APPROVED
UPSTREAM PHASES 0-6: PERMANENTLY BASELINE LOCKED AND APPROVED
NEXT PHASE: PHASE 8 — TESTING STRATEGY AND QUALITY ASSURANCE
IMPLEMENTATION STATUS: STRICTLY PROHIBITED (GATED UNTIL PHASE 14)
```
