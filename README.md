# Nālandā National Digital Archive // राष्ट्रीय ग्रंथालय
### Cloud-Native Library Management System (LMS)

[![Build & Deploy](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge&logo=githubactions)](https://github.com/sarcasticyash/Library-Management-System)
[![Automated Tests](https://img.shields.io/badge/Automated_Tests-218_Passed-blue?style=for-the-badge&logo=vitest)](https://github.com/sarcasticyash/Library-Management-System)
[![Live Proxy Integration](https://img.shields.io/badge/Live_Proxy-52%2F52_Passed-success?style=for-the-badge)](https://github.com/sarcasticyash/Library-Management-System)
[![Security Vectors](https://img.shields.io/badge/Security_Audit-45_Vectors_Passed-brightgreen?style=for-the-badge&logo=shield)](https://github.com/sarcasticyash/Library-Management-System)
[![WCAG 2.2 AA](https://img.shields.io/badge/Accessibility-WCAG_2.2_AA_Compliant-blueviolet?style=for-the-badge)](https://github.com/sarcasticyash/Library-Management-System)
[![License](https://img.shields.io/badge/License-MIT-amber?style=for-the-badge)](LICENSE)

> *“सा विद्या या विमुक्तये — That which liberates is knowledge.”*  
> Preserving Indian intellectual heritage from Nālandā and Takshashila to modern high-performance cloud architectures.

An institutional-grade, full-stack, cloud-native Library Management System inspired by the **Nālandā National Digital Archive**. Built with a **Clean Architecture Express.js backend**, a **high-performance React 18 SPA frontend**, and **MongoDB persistence**. Fully containerized with Docker, orchestrated with Docker Compose and Kubernetes EKS manifests, and validated through exhaustive automated security, performance, accessibility, and multi-role user journey quality gates.

---

## 🏛️ System Architecture

```
[ Web Browser ]
      │
      ▼ (HTTP / HTTPS)
[ Nginx Reverse Proxy / Vite SPA (:80 / :5173) ]
      │
      ├──> Static Assets (Lazy-loaded route chunks, immutable cache)
      │
      └──> /api/v1/* (Reverse proxy forwarding)
              │
              ▼
    [ Express.js REST API Gateway (:3000) ]
       ├── Helmet Security Headers & CORS Lockdown
       ├── Sliding-Window Rate Limiting (429 ERR-SEC-RATE-LIMIT)
       ├── Correlation ID & Structured Winston JSON Logging
       ├── Centralized RFC 7807 Problem Details Error Handling
       │
       ├── Authentication & RBAC Layer
       │     ├── JWT Bearer Access Tokens (15m in-memory expiry)
       │     ├── HttpOnly Rotating Refresh Tokens (7d)
       │     └── Token Family Replay Detection
       │
       ├── Domain Services (Catalog, Circulation, Users, Admin, Audit)
       │     └── ACID Multi-Document Transactions
       │
       └── [ MongoDB 7.0 Persistence (:27017) ]
             ├── users (Compound & Unique email index)
             ├── books (Full-Text Search & ISBN unique index)
             ├── borrowings (patronId/bookId compound indexes)
             ├── sessions (TTL auto-expiration cleanup)
             └── audit_logs (Immutable append-only stream)
```

---

## ✨ Core Platform Capabilities

### 👤 Scholar & Patron Experience
- **Institutional Self-Registration**: Self-service onboarding automatically bound to `ROLE_PATRON` with RFC-compliant validation.
- **Dual-Token Zero-Storage Authentication**: In-memory JWT access token management (Phase 5 ADR-FE-02) with transparent silent token refresh rotation.
- **Museum-Grade 3D Folio Experience**: Interactive Three.js canvas featuring a 3D leather-bound archival book with gold hot-stamped typography, autonomous 360° turntable spin, and drag-to-inspect physics.
- **Full-Text Catalog Search & Discovery**: High-speed search querying titles, authors, and ISBNs with genre filtering and real-time inventory badges.
- **Physical Coordinates & Shelf Locator**: Instant guidance detailing exact physical archival locations (e.g. *Computing Wing A2, Shelf CS-01*).
- **Atomic Book Checkout**: Real-time loan issuance enforcing a 5-volume quota per scholar with immediate inventory decrement.
- **Active Loans Telemetry HUD**: Floating real-time circulation corner displaying days remaining, due-date warnings, and overdue indicators.
- **Self-Service Returns**: One-click book check-in with instantaneous inventory replenishment.
- **Borrowing History**: Complete historical ledger of past checkouts and returns.
- **Archival Credential Recovery**: 3-step password recovery workflow with simulated instant OTP dispatch and secure credential reset.

### 🛡️ Administrator Governance Console
- **Executive Operational Telemetry**: Real-time KPI metrics (catalog volume count, total holdings, active borrowings, overdue items, registered scholars).
- **Catalog Management Folio**: Create new catalog acquisitions, update metadata, calibrate physical inventory, and soft-delete titles.
- **Institutional Circulation Oversight**: Filter, inspect, and audit all active and historical loans across all university patrons.
- **Administrative Return Override**: Emergency circulation clearance requiring mandatory administrative remarks for audit compliance.
- **Scholar Lifecycle Governance**: Suspend accounts violating borrowing policies with immediate lockout enforcement, or reinstate accounts.
- **Immutable Audit Stream**: Chronological event ledger tracking all domain mutations, authentication events, and administrative overrides.

### 🇮🇳 Indian Academic & Cultural Heritage
- **Curated Indic & Modern Classics**:
  - *Aryabhatiya & Classical Indian Mathematics* (Aryabhata)
  - *The Arthashastra: Science of Wealth & Statecraft* (Kautilya / Chanakya)
  - *The Discovery of India* (Jawaharlal Nehru)
  - *Concepts of Physics* (Dr. H.C. Verma)
  - *Sanskrit Computational Linguistics: Paninian Grammar & NLP* (Dr. Girish Nath Jha)
  - *Wings of Fire* (Dr. A.P.J. Abdul Kalam)
  - *The Upanishads* (Eknath Easwaran)
  - *India After Gandhi* (Ramachandra Guha)
  - Alongside computing classics (*Designing Data-Intensive Applications*, *Clean Architecture*, *CLRS Algorithms*).
- **Compliance & Standards**: Aligned with NDLI (National Digital Library of India), INFLIBNET, UGC, and MeitY Cyber Governance standards.
- **Dual-Channel Official Helpdesk**:
  - **Student / Scholar Inquiries**: Routed directly to Library Administration (`librarian@delhi.library.gov.in`).
  - **Infrastructure & Systems Escalations**: Routed directly to the Chief Systems Architect Yash Singh (`singhyash0706@gmail.com`).

---

## 🧪 Comprehensive Quality Gates & Test Results

The monorepo enforces 100% automated quality gating across all stages:

| Quality Gate | Test Command | Scope | Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Prettier Formatting** | `npm run format:check` | All TS, TSX, CSS, JSON | **100% compliant** | **PASSED** |
| **Backend Linting** | `npm run backend:lint` | `apps/backend/src` | **0 errors, 0 warnings** | **PASSED** |
| **Frontend Linting** | `npm run frontend:lint` | `apps/frontend/src` | **0 errors, 0 warnings** | **PASSED** |
| **TypeScript Type Safety** | `npx tsc --noEmit` | Monorepo type check | **0 errors** | **PASSED** |
| **Backend Unit Tests** | `npm run test:unit` | Vitest (16 test suites) | **168 / 168 passed** | **PASSED** |
| **Frontend Component Tests** | `npm run frontend:test` | Vitest + React Testing Library | **50 / 50 passed** | **PASSED** |
| **Consolidated Test Runner** | `npm run test:all` | Full-stack test execution | **218 / 218 passed** | **PASSED** |
| **Live Proxy Integration** | `npx tsx scripts/test-live-integration.ts` | Deep SPA routes & API Proxy | **52 / 52 passed** | **PASSED** |
| **Security Audit** | `npm run test:stage10:security` | 14 Attack and Defense Vectors | **45 / 45 passed** | **PASSED** |
| **Load Benchmarks** | `npm run test:stage10:performance` | Concurrency & Latency (5 routes) | **0.0% errors, 717 RPS** | **PASSED** |
| **Accessibility Audit** | `npm run test:stage10:accessibility` | WCAG 2.2 AA Compliance Audit | **23 / 23 passed** | **PASSED** |
| **Production Build** | `npm run build` | Full Production Bundle | **0 errors** | **PASSED** |

---

## 🚀 Quickstart & Deployment

### Method 1: Single-Command Docker Compose (Recommended)

Requires Docker Engine and Docker Compose:

```bash
# 1. Clone repository
git clone https://github.com/sarcasticyash/Library-Management-System.git
cd Library-Management-System

# 2. Launch MongoDB, Backend API, and Frontend SPA in detached mode
docker compose up -d --build
```

Access services:
- **Frontend SPA**: [http://localhost](http://localhost)
- **Backend API**: [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
- **Liveness Health Probe**: [http://localhost:3000/healthz](http://localhost:3000/healthz)
- **Readiness Health Probe**: [http://localhost:3000/api/v1/health](http://localhost:3000/api/v1/health)

### Method 2: Local Development Setup

Prerequisites: Node.js 20 LTS, npm 10+.

```bash
# 1. Install dependencies across monorepo
npm install

# 2. Start local backend and frontend concurrently
npm run backend:dev    # Starts API on http://localhost:3000
npm run frontend:dev   # Starts Vite SPA on http://localhost:5173
```

### Method 3: Live Verification & Testing Mode

```bash
# 1. Start live backend with pre-seeded test data
npx tsx scripts/start-live-server.ts

# 2. Run full-stack live integration suite
npx tsx scripts/test-live-integration.ts
```

Default Test Credentials:
- **Administrator**: `admin@lms.local` / `Admin123!Secure`
- **Patron**: `patron@lms.local` / `Patron123!Secure`
- **Super Admin**: `singhyash0706@gmail.com` / `AdminSecret123!`

---

## 📁 Monorepo Folder Structure

```text
├── apps/
│   ├── backend/                    # Node.js 20, Express, Mongoose, Zod, Helmet, Winston
│   │   ├── Dockerfile              # Multi-stage container build (non-root user lms)
│   │   ├── src/                    # Controllers, Services, Repositories, Schemas, Utils
│   │   └── tests/                  # Unit and integration test suites (168 tests)
│   │
│   └── frontend/                   # React 18, TypeScript, Vite, TanStack Query, Three.js
│       ├── Dockerfile              # Multi-stage Nginx container build
│       ├── nginx.conf              # SPA fallback routing, reverse proxy, gzip, caching
│       └── src/
│           ├── components/         # Common primitives, Circulation HUD, Layout, 3D Canvas
│           ├── pages/              # Lazy-loaded Public, Patron, Admin, and Auth routes
│           ├── mock/               # Offline resilience & localStorage mockDb engine
│           ├── styles/             # Design tokens & museum-grade archival styling
│           └── utils/              # Book cover mapping, sound effects, redirect sanitizer
│
├── docker-compose.yml              # Production orchestration (mongo, backend, frontend)
├── .github/workflows/              # GitHub Actions CI/CD Quality Gate workflows
├── docs/                           # Architecture decision records & deployment specs
├── infrastructure/                 # Kubernetes EKS manifests and Helm charts
├── scripts/                        # Quality gate validation and integration test runners
├── README.md                       # Comprehensive institutional project documentation
└── package.json                    # Root monorepo workspace configuration
```

---

## 🔒 Security Posture & Standards

1. **Zero Secret Leakage**: Passwords hashed with `bcrypt` (work factor 12). Passwords and token hashes stripped from all API outputs. Audit logs sanitized.
2. **Brute-Force & DoS Mitigation**: In-memory sliding-window rate limiting on `/auth/*` endpoints returning HTTP 429 and `Retry-After`. Body-parser 100kb payload ceiling returning HTTP 413.
3. **Session Family Governance**: Single-use refresh token rotation; reuse of previously rotated tokens immediately revokes the entire session family (`ERR-AUTH-REPLAY-DETECTED`).
4. **WCAG 2.2 AA Compliance**: Verified primary contrast ratio of 18:1 (exceeding AAA requirement 7:1), visible focus rings on interactive elements, skip navigation links, and full screen-reader ARIA semantics.

---

## 👤 Author & Maintainer

**Yash Singh**  
- **Email**: [singhyash0706@gmail.com](mailto:singhyash0706@gmail.com)  
- **GitHub**: [@sarcasticyash](https://github.com/sarcasticyash)  
- **Repository**: [https://github.com/sarcasticyash/Library-Management-System](https://github.com/sarcasticyash/Library-Management-System)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
