# 08 - Testing Strategy & Quality Assurance

[![Testing Spec Version](https://img.shields.io/badge/Testing_Strategy-v1.0.0_(Locked_and_Approved)-green)](TESTING_STRATEGY_AND_QUALITY_ASSURANCE.md)
[![Current Phase](https://img.shields.io/badge/Current_Phase-Phase_8:_Testing_Strategy-green)](TESTING_STRATEGY_AND_QUALITY_ASSURANCE.md)
[![Implementation Gate](https://img.shields.io/badge/Implementation-Gated_Until_Phase_14-red)](../../README.md#-lifecycle-governance--15-phase-roadmap)

---

## Overview
This directory contains the authoritative **Testing Strategy and Quality Assurance Architecture** for the **Cloud-Native Library Management System (LMS)**.

Phase 8 defines the complete verification contract governing how future implementation will be rigorously tested against all approved requirements, architectural decisions, database invariants, API contracts, frontend behaviors, security controls, and engineering quality standards.

In strict accordance with software lifecycle governance, **Phase 8 is a testing architecture and quality assurance specification phase only. Zero executable tests (.test.ts, .spec.ts), application source code (.ts, .tsx, .js, .jsx, .html, .css), package manifests (package.json), container files (Dockerfile), or deployment infrastructure have been created.**

👉 **[Read the Full Testing Strategy & Quality Assurance Specification](TESTING_STRATEGY_AND_QUALITY_ASSURANCE.md)**

---

## Core Quality Assurance Pillars

### 1. Requirements-Driven Testing Pyramid
- **Distribution Hierarchy**: Unit Tests (~60%), Integration & API Contract Tests (~25%), Component & Accessibility Tests (~10%), and End-to-End Tests (~5%).
- **Exhaustive Traceability**: 100% test coverage across all 22 Phase 1 Functional Requirements (`FR-AUTH-001..004`, `FR-USER-001..002`, `FR-BOOK-001..004`, `FR-BORROW-001..004`, `FR-ADMIN-001..008`) and all 5 Business Rules (`BR-001..005`).

### 2. Rigorous Invariant & Concurrency Verification
- **Invariants INV-01 to INV-06**: Explicit test scenarios for non-negative inventory, borrowing count consistency, single active loan per user/book, quota limits ($\le 5$), suspended patron containment (`BR-003`), and referential integrity.
- **Dynamic Overdue Truth (`DBD-09`)**: Deterministic clock-injected testing asserting that overdue status is computed dynamically ($\text{isOverdue} \iff [\text{returnDate} == \text{null} \land \text{now} > \text{dueDate}]$) and zero static boolean columns exist in the database.
- **Multi-Document ACID Concurrency**: High-concurrency race condition testing validating atomic inventory decrements and compound unique partial index protection under simulated simultaneous checkout spikes.

### 3. Comprehensive API Contract & Security Testing
- **21 Approved Endpoints**: Canonical `/api/v1` route verification with zero generic `:id` path parameters and universal RFC 7807 problem details error envelopes.
- **STRIDE Security Verification**: Automated negative testing for JWT tampering, BOLA/IDOR resource ownership bypass, NoSQL injection, mass assignment, Refresh Token Family Rotation replay detection, credential redaction, and rate limiting.

### 4. Accessibility, Performance & Reliability
- **Accessibility (WCAG 2.1 AA)**: Automated `axe-core` accessibility audits paired with manual keyboard traversal and focus trap verification.
- **Performance Baselines**: k6 latency verification targeting P95 $< 150\text{ms}$ for catalog queries, P95 $< 250\text{ms}$ for checkout transactions, and sustained endurance tests.
- **Fail-Safe Reliability**: Simulation of database network cuts and transaction write conflicts to verify automated retries and clean rollbacks.

### 5. Code Coverage & Definition of Done
- **Strict Coverage Baselines**: Minimum $\ge 85\%$ overall branch coverage ($\ge 90\%$ for domain services and security middleware).
- **15-Point Testing Definition of Done**: Mandatory completion criteria required before any future implementation feature can be merged.

---

## Documents in This Section
- **[`TESTING_STRATEGY_AND_QUALITY_ASSURANCE.md`](TESTING_STRATEGY_AND_QUALITY_ASSURANCE.md)**: Primary Authoritative Testing Specification (36 numbered sections, test pyramid, traceability matrix, and compliance audit).

---

## Phase Status Summary
```text
CURRENT STATUS: PERMANENTLY BASELINE LOCKED AND APPROVED
UPSTREAM PHASES 0-7: PERMANENTLY BASELINE LOCKED AND APPROVED
NEXT PHASE: PHASE 9 — AWS INFRASTRUCTURE ARCHITECTURE
IMPLEMENTATION STATUS: STRICTLY PROHIBITED (GATED UNTIL PHASE 14)
EXECUTABLE TEST IMPLEMENTATION: STRICTLY PROHIBITED (GATED UNTIL PHASE 14)
```
