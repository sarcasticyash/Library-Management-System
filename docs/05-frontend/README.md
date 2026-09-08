# 05 - Frontend Architecture & UI/UX Design

[![Frontend Spec Version](https://img.shields.io/badge/Frontend_Architecture-v1.0.0_(Locked_and_Approved)-green)](FRONTEND_ARCHITECTURE_AND_UI_UX_DESIGN.md)
[![Current Phase](https://img.shields.io/badge/Current_Phase-Phase_5:_Frontend_Architecture-orange)](FRONTEND_ARCHITECTURE_AND_UI_UX_DESIGN.md)
[![Implementation Gate](https://img.shields.io/badge/Implementation-Gated_Until_Phase_14-red)](../../README.md#-lifecycle-governance--15-phase-roadmap)

---

## Overview
This directory contains the authoritative **Frontend Architecture and UI/UX Design Specification** for the **Cloud-Native Library Management System (LMS)**.

The frontend architecture translates the approved functional requirements (Phase 1), system design models (Phase 2), database persistence invariants (Phase 3), and backend API contracts (Phase 4) into a cohesive, modern, accessible, and responsive user experience specification.

In strict compliance with engineering lifecycle governance, **Phase 5 is an architecture and design phase only. Zero application source code, React components, JSX/TSX syntax, CSS style files, or npm dependencies have been implemented in this phase.**

👉 **[Read the Full Frontend Architecture & UI/UX Design Specification](FRONTEND_ARCHITECTURE_AND_UI_UX_DESIGN.md)**

---

## Key Frontend Architectural Highlights

### 1. Layered Component & State Architecture
- **Presentation Layer**: Pure, accessible design system primitives (`Button`, `Input`, `Badge`, `ModalDialog`, `Toast`).
- **Composite Domain Layer**: High-order UI modules (`BookCard`, `AvailabilityIndicator`, `DueCountdownBadge`, `BorrowQuotaMeter`, `KPICard`).
- **Server State Management**: Declarative asynchronous data synchronization via **TanStack Query (React Query v5)** with automated cache invalidation post-mutation (`useBorrowBookMutation`, `useReturnBookMutation`).
- **Client Ephemeral State**: Localized UI state (filter drawers, dialog visibility) strictly decoupled from server-cached entities.

### 2. Zero-Storage Dual-Token Security Architecture
- **In-Memory Access Token**: The short-lived JWT access token is stored strictly in memory (`AuthContext`).
- **HttpOnly Cookie Refresh Token**: Refresh tokens are transported exclusively via browser-managed `HttpOnly; Secure; SameSite=Strict` cookies. **Zero tokens reside in `localStorage` or `sessionStorage`**, completely neutralizing persistent XSS token theft.
- **Silent Background Refresh**: Automatic response interceptor handshakes with `POST /api/v1/auth/refresh` on token expiration without disrupting user flow.

### 3. Role-Based Navigation & Route Guards
- **Public Experience**: Open catalog browsing, multi-field full-text search, faceted filtering, and real-time availability inspection.
- **Patron Portal (`ROLE_PATRON`)**: Self-service transactional checkout (`POST /api/v1/borrowings`), self-service returns (`POST /api/v1/borrowings/:borrowingId/return`), active loans countdown dashboard, borrowing history archive, and authenticated password changes.
- **Administrative Portal (`ROLE_ADMIN`)**: Live operational dashboard KPIs (`GET /api/v1/admin/dashboard/kpis`), book acquisition and inventory editing, user suspension management, global circulation oversight, staff return overrides, and immutable audit log ledger inspection.
- **Route Guard Principle**: UI hiding is treated strictly as an ergonomic UX convenience; the Phase 4 backend remains the sole authoritative authorization enforcement point.

### 4. Concurrency & Conflict-Resilient UX
- **Duplicate Active Loan Protection (INV-06)**: Humanized recovery when concurrent checkout triggers `409 Conflict (DUPLICATE_ACTIVE_LOAN)`.
- **Quota Ceiling Feedback (INV-04)**: Clear visual warnings when the patron reaches 5 active loans (`409 Conflict: BORROWING_QUOTA_EXCEEDED`).
- **Return Idempotency Handling**: Graceful client handling for `409 Conflict (ALREADY_RETURNED)` without duplicate inventory decrements.
- **Authoritative Temporal Truth (DBD-09)**: Overdue status is calculated dynamically in real-time ($returnDate == null \land now > dueDate$), ensuring immediate, accurate overdue badge display.

### 5. Accessibility (WCAG 2.2 AA) & Responsive Excellence
- **Keyboard Navigation**: 100% keyboard operability, modal focus traps, focus restoration, and global search shortcut (`/`).
- **Screen Reader Support**: ARIA live regions for dynamic mutations, semantic HTML5 landmarks, and form field error announcements.
- **Responsive Breakpoints**: Seamless visual transitions across mobile ($< 640\text{px}$), tablet ($640 - 1024\text{px}$), desktop ($1024 - 1280\text{px}$), and wide desktop ($\ge 1280\text{px}$).

---

## Documents in This Section
- **[`FRONTEND_ARCHITECTURE_AND_UI_UX_DESIGN.md`](FRONTEND_ARCHITECTURE_AND_UI_UX_DESIGN.md)**: Authoritative 29-section Frontend Architecture and UI/UX Design Specification (Version 1.0.0 — Permanently Baseline Locked and Approved).
