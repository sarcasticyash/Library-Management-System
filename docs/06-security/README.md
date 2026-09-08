# 06 - Security Architecture & Threat Model

[![Security Spec Version](https://img.shields.io/badge/Security_Architecture-v1.0.0_(Locked_and_Approved)-green)](SECURITY_ARCHITECTURE.md)
[![Current Phase](https://img.shields.io/badge/Current_Phase-Phase_6:_Security_Architecture-orange)](SECURITY_ARCHITECTURE.md)
[![Implementation Gate](https://img.shields.io/badge/Implementation-Gated_Until_Phase_14-red)](../../README.md#-lifecycle-governance--15-phase-roadmap)

---

## Overview
This directory contains the authoritative **Security Architecture and Threat Model Specification** for the **Cloud-Native Library Management System (LMS)**.

The security architecture translates the approved functional requirements (Phase 1), system design models (Phase 2), database persistence invariants (Phase 3), backend API contracts (Phase 4), and frontend interaction boundaries (Phase 5) into an enterprise-grade, defense-in-depth, zero-trust security framework.

In strict compliance with engineering lifecycle governance, **Phase 6 is an architecture and threat modeling phase only. Zero application source code, security modules, cryptographic scripts, or infrastructure templates have been implemented in this phase.**

👉 **[Read the Full Security Architecture & Threat Model Specification](SECURITY_ARCHITECTURE.md)**

---

## Key Security Architectural Highlights

### 1. Comprehensive STRIDE Threat Modeling
- **Formal Risk Assessment**: Evaluates threats across Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege.
- **Actionable Countermeasures**: Every material attack vector is paired with concrete preventive, detective, and recovery controls across the application, database, and perimeter layers.

### 2. Dual-Token IAM & Token Family Replay Defense
- **Short-Lived In-Memory Access Token**: Ephemeral 15-minute JWT stored strictly in application JavaScript memory (`AuthContext`), eliminating persistent credential theft via XSS.
- **Browser-Managed HttpOnly Refresh Cookie**: 7-day refresh token transmitted exclusively via `HttpOnly; Secure; SameSite=Strict` cookie (`Path=/api/v1/auth`).
- **Single-Use Token Family Rotation**: Consumption of a refresh token replaces it with a successor in the same family. Any attempt to replay an already-consumed token triggers instant invalidation of the entire session family across all devices.

### 3. Context-Bound RBAC & BOLA / IDOR Prevention
- **Backend-Authoritative Security**: Client UI hiding and route guards are recognized as ergonomic usability controls only; backend middleware and domain services strictly enforce all access boundaries.
- **Resource Ownership Validation**: Circulation checkout and return operations verify that the target loan record belongs strictly to `req.user.id`, eliminating horizontal privilege escalation (Broken Object-Level Authorization).

### 4. Account Suspension Security Model (BR-003)
- **Multi-Layered Containment**: Suspended patrons are strictly barred from checking out new books or altering account credentials.
- **Permitted Recovery Operations**: To facilitate physical property recovery, suspended patrons retain read access to active loans and borrowing history, and are actively permitted to return checked-out books.

### 5. Complete 21-Endpoint Security Coverage
- **Canonical `/api/v1` Protection**: Every single approved Phase 4 backend route is mapped to its mandatory authentication tier, role requirements, ownership checks, Zod schema validation, rate-limiting tier, and audit level.
- **Zero Unapproved Routes**: Operates exclusively across approved contracts; zero invented endpoints or generic parameter tokens.

### 6. Persistence Invariant Preservation & Cryptographic Standards
- **Two-Tier Concurrency Defense**: Multi-document ACID transactions combined with atomic conditional decrements (`{ availableCopies: { $gt: 0 } }`) and compound unique partial indexing (`idx_borrowings_active_user_book`) guarantee Invariants INV-01 to INV-06.
- **Authoritative Overdue Truth (DBD-09)**: Overdue status is evaluated dynamically in real time ($\text{isOverdue} \iff [returnDate == null \land now > dueDate]$), preventing stale client flags from subverting business logic.
- **Cryptographic Rigor**: Enforced TLS 1.3 in transit, AES-256 at rest, and bcrypt password hashing with work factor $\ge 12$.

### 7. Immutable Audit Trails & Credential Redaction
- **Two-Tier Audit Model**: Sensitive administrative actions (patron suspension, return override, catalog deactivation) commit atomically with business state (Tier 1); routine circulation operations log post-commit (Tier 2).
- **Mandatory Redaction**: Automatic scrubbing of passwords, tokens, and secrets from all application log streams.

---

## Documents in This Section
- **[`SECURITY_ARCHITECTURE.md`](SECURITY_ARCHITECTURE.md)**: Authoritative 29-section Security Architecture and Threat Model Specification (Version 1.0.0 — Permanently Baseline Locked and Approved).
