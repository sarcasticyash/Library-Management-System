# 01 - Requirements Documentation

[![SRS Status](https://img.shields.io/badge/SRS-Version_1.1.0_(Locked_Baseline)-blue)](SOFTWARE_REQUIREMENTS_SPECIFICATION.md)
[![Phase](https://img.shields.io/badge/Phase-Phase_1:_Requirements_Specification-orange)](SOFTWARE_REQUIREMENTS_SPECIFICATION.md)
[![Implementation Gate](https://img.shields.io/badge/Implementation-Gated_Until_Phase_14-red)](../../README.md#-lifecycle-governance--15-phase-roadmap)

---

## Overview
This directory contains the formal **Software Requirements Specification (SRS)** for the **Cloud-Native Library Management System (LMS)**. 

The SRS acts as the authoritative requirements baseline for all subsequent planning, design, and architecture phases (Phases 2 through 13). In strict compliance with lifecycle governance, **zero implementation code, database schemas, or infrastructure assets have been created in this phase.**

👉 **[Read the Full Software Requirements Specification (SRS v1.1.0)](SOFTWARE_REQUIREMENTS_SPECIFICATION.md)**

---

## Key Requirements Highlights

### 1. Implementation-Independent Requirements & Phase Separation
- The SRS focuses strictly on **WHAT** the system must do, decoupling requirements from premature implementation details.
- Concrete technical mechanisms (specific hashing algorithms, validation libraries, middleware packages, database transaction mechanics, and deployment manifests) are formally documented as **Technical Decisions Deferred to Later Phases** (Phases 2 through 13).

### 2. Formally Resolved Stakeholder Decisions & Confirmed Rules
- **DEC-01 (Active Loan Quota)**: Maximum **5 active book loans** per patron simultaneously (BR-001).
- **DEC-02 (Loan Duration)**: Standard loan period is **14 calendar days** from checkout (BR-002).
- **DEC-03 (Loan Renewals)**: Excluded from Version 1; patrons must return a book prior to re-borrowing (BR-005).
- **DEC-04 (Account Deletion)**: Self-service deletion is excluded from Version 1; account status is managed by administrators to protect historical loan and audit records (BR-011).
- **Password Management Scope**: Authenticated password change is mandatory for Version 1; forgot-password email workflows and external account recovery are excluded from V1 as future enhancements (BR-010).
- **Administrative Returns**: An authorized administrator may process a book return on behalf of a patron when required (BR-013).
- **Pragmatic Audit Logging**: Append-only audit records for critical administrative actions (book creation, modification, deactivation, user status changes, return overrides) and security-sensitive events (BR-014).

### 3. Strict Scope Boundaries
- **Mandatory Version 1**: User Registration, Login/Logout (JWT + sliding cookie refresh rotation with replay detection), Authenticated Password Change, Catalog Search & Faceted Filtering, Consistent Self-Service Borrowing & Returning, Active Loans Dashboard with Overdue Indicators, Complete Borrowing History, Admin KPI Dashboard, Book Inventory CRUD (with soft deletion), User Management (Suspend/Activate), Administrative Return on Behalf of Patron, and Critical Append-Only Audit Logging.
- **Explicitly Excluded from V1 (Future Enhancements)**: Automated fine calculation ($/day), third-party payment gateways (Stripe/PayPal), lost/damaged book replacement fees, automated external email/SMS notifications (AWS SES), forgot-password email recovery, barcode/RFID hardware scanners, and machine learning recommendations.

### 4. Traceability & Engineering Quality
- Complete 26-section SRS conforming to IEEE 830 / ISO 29148 standards.
- Full end-to-end Traceability Matrix mapping:  
  **Business Objective → Functional Requirement → User Story → Use Case → Downstream Architecture Phase**.

---

## Documents in This Section
- **[`SOFTWARE_REQUIREMENTS_SPECIFICATION.md`](SOFTWARE_REQUIREMENTS_SPECIFICATION.md)**: Authoritative 26-section SRS document (Version 1.1.0).
