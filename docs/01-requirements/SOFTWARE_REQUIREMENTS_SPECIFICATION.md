# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
## Cloud-Native Library Management System (LMS)

---

**Document Version**: 1.1.0  
**Phase**: Phase 1 – Software Requirements Specification  
**Status**: BASELINE LOCKED FOR FINAL APPROVAL  
**Author**: Senior Business Analyst & Software Requirements Engineer  
**Architectural Baseline**: Phase 0 Master Project Architecture Document (v1.1.0)  
**Classification**: Formal Requirements Specification & Engineering Baseline  
**Implementation Policy**: *STRICT GATE — Implementation (Phase 14) must not begin until all planning and architecture phases (Phases 1 through 13) have been fully completed and approved.*

---

## TABLE OF CONTENTS
1. [Document Control](#1-document-control)
2. [Project Overview](#2-project-overview)
3. [Scope Definition & Feature Classification](#3-scope-definition--feature-classification)
4. [Stakeholders](#4-stakeholders)
5. [User Roles and Personas](#5-user-roles-and-personas)
6. [Functional Requirements](#6-functional-requirements)
7. [Detailed User Stories](#7-detailed-user-stories)
8. [Use Case Specifications](#8-use-case-specifications)
9. [Borrowing and Circulation Rules](#9-borrowing-and-circulation-rules)
10. [Book Catalog Requirements](#10-book-catalog-requirements)
11. [Authentication & Password Management Requirements](#11-authentication--password-management-requirements)
12. [Authorization Requirements](#12-authorization-requirements)
13. [Input Validation Requirements](#13-input-validation-requirements)
14. [Error Handling Requirements](#14-error-handling-requirements)
15. [Non-Functional Requirements](#15-non-functional-requirements)
16. [Security Requirements](#16-security-requirements)
17. [Data Requirements](#17-data-requirements)
18. [API Behavior Requirements](#18-api-behavior-requirements)
19. [User Interface Requirements](#19-user-interface-requirements)
20. [Edge Cases](#20-edge-cases)
21. [Confirmed Version 1 Business Rules](#21-confirmed-version-1-business-rules)
22. [Assumptions & Resolved Stakeholder Decisions](#22-assumptions--resolved-stakeholder-decisions)
23. [Technical Decisions Deferred to Later Phases](#23-technical-decisions-deferred-to-later-phases)
24. [Dependencies & Risks](#24-dependencies--risks)
25. [Requirements Traceability Matrix](#25-requirements-traceability-matrix)
26. [Acceptance and Approval Criteria](#26-acceptance-and-approval-criteria)

---

## 1. Document Control

### 1.1 Document Metadata
| Field | Value |
|---|---|
| **Document Title** | Software Requirements Specification (SRS) - Cloud-Native Library Management System |
| **Document Version** | 1.1.0 |
| **Document Status** | BASELINE LOCKED FOR FINAL APPROVAL |
| **Project Name** | Cloud-Native Library Management System (LMS) |
| **Author** | Senior Business Analyst & Software Requirements Engineer |
| **Approval Status** | Formally Updated & Locked Pending Stakeholder Sign-Off |
| **Current Phase** | Phase 1 – Software Requirements Specification |
| **Next Phase** | Phase 2 – Detailed System Design |

### 1.2 Revision History
| Version | Date | Author | Summary of Changes |
|---|---|---|---|
| 1.0.0 | 2026-09-07 | Requirements Team | Initial draft of Phase 1 SRS following Phase 0 baseline approval. |
| 1.1.0 | 2026-09-07 | Requirements Team | Full alignment with Phase 1 governance: <br/>1. Rewrote implementation-prescriptive text into implementation-independent requirements.<br/>2. Formally locked stakeholder decisions DEC-01 through DEC-04 into confirmed business rules.<br/>3. Explicitly defined password management scope (authenticated password change in V1; forgot-password workflows deferred).<br/>4. Defined pragmatic audit logging scope (append-only records for critical administrative actions).<br/>5. Generalized administrative returns to "An authorized administrator may process a book return on behalf of a patron when required."<br/>6. Added dedicated Section 23: "Technical Decisions Deferred to Later Phases".<br/>7. Updated traceability matrix and verified consistency. |

### 1.3 Related Documents
- [Phase 0 Master Project Architecture Document (v1.1.0)](../02-architecture/MASTER_ARCHITECTURE.md)
- [Project Repository Master README](../../README.md)
- IEEE Standard 830-1998 / ISO/IEC/IEEE 29148:2018 (Systems and Software Engineering — Requirements Engineering)

---

## 2. Project Overview

### 2.1 Project Purpose
The Cloud-Native Library Management System (LMS) delivers a responsive, self-service digital circulation platform for library patrons, paired with centralized inventory governance, loan tracking, and account administration for library staff. 

The purpose of this SRS is to establish **WHAT** the system must accomplish from a functional, behavioral, and quality perspective. It serves as the authoritative, implementation-independent requirements baseline governing all downstream architecture and design phases (Phases 2 through 13) before physical implementation (Phase 14) begins.

### 2.2 Business Problem & Operational Context
Traditional physical library operations encounter recurring friction points:
1. **Catalog Opacity**: Patrons experience difficulty locating titles without physical shelf searches.
2. **Circulation Contention**: Manual checkouts create administrative queues and operational overhead.
3. **Inventory Inconsistencies**: Non-atomic loan records cause book over-borrowing, lost assets, and phantom inventory.
4. **Circulation Status Blindness**: Patrons lack real-time visibility into active loan due dates and overdue statuses.

### 2.3 System Objectives
- Provide a responsive, accessible web interface for catalog browsing, borrowing, and loan tracking.
- Guarantee transactional integrity across all circulation operations, preventing inventory stock from becoming inconsistent under concurrent usage.
- Enforce strict role-based separation of responsibilities between patrons and administrative personnel.
- Maintain a complete, traceable requirements baseline that enables subsequent engineering teams to design architectures without ambiguous assumptions.

---

## 3. Scope Definition & Feature Classification

To protect delivery focus and prevent scope creep, features are explicitly divided into four scope categories:

```
+-----------------------------------------------------------------------------+
|                          FORMAL SCOPE CLASSIFICATION                        |
+-----------------------------------------------------------------------------+
|  [A. MANDATORY VERSION 1]     [B. OPTIONAL FEATURES (V1.1)]                |
|  - Self-Registration & Auth   - Book Cover Image File Uploads               |
|  - In-Memory Access & Cookie  - Multi-Tag Advanced Faceted Search           |
|    Refresh Session Strategy   - Personal Borrowing History CSV Export       |
|  - Catalog Search & Filters                                                 |
|  - Self-Service Borrowing     [D. EXPLICITLY OUT-OF-SCOPE]                  |
|  - Self-Service Returns       - Direct Inter-Patron Book Swaps              |
|  - Active Loans & History     - Physical Hardware Drivers (Thermal/Printers)|
|  - Authenticated Password     - Physical Self-Checkout Hardware Integration |
|    Change (Self-Service)      - Multi-Branch Inter-Library Loans            |
|  - Admin Dashboard & KPIs     - Non-Web Desktop / Native Mobile Apps        |
|  - Admin Book CRUD                                                          |
|  - Admin Patron Management    [C. FUTURE ENHANCEMENTS]                      |
|  - Admin Return on Behalf     - Automated Overdue Fine Calculation ($/day)  |
|    of Patron                  - Third-Party Payment Gateways (Stripe/PayPal)|
|  - Critical Admin Append-Only - Lost / Damaged Book Replacement Surcharges  |
|    Audit Logging              - Automated External Email/SMS (AWS SES)      |
|                               - Barcode & RFID Scanner Hardware Integration |
|                               - Forgot-Password / Email Account Recovery    |
|                               - Self-Service Patron Account Deletion        |
|                               - Machine Learning Book Recommendations       |
+-----------------------------------------------------------------------------+
```

### 3.1 Category A: Mandatory Version 1 Features
1. **Patron Identity & Session**: User registration, login, logout, authenticated password change, and secure session management with replay detection.
2. **Catalog Discovery**: Search across title, author, and description; faceted filtering by genre and stock availability; paginated results.
3. **Self-Service Circulation**: Borrowing of in-stock titles up to the 5-book active loan quota; book returns updating availability; active loans dashboard with overdue warning indicators.
4. **Circulation History**: Complete chronological history of active and completed loans for each patron.
5. **Administrative Catalog Governance**: Full Book CRUD operations (Create, Read, Update, Soft-Delete), stock copy management, and physical shelf coordinates (Aisle/Shelf).
6. **Administrative Patron Governance**: User search, view user borrowing records, and toggle account status (`ACTIVE` vs. `SUSPENDED`).
7. **Administrative Circulation Oversight**: View all active and historical circulation records across the library, with the authority to process returns on behalf of patrons.
8. **Critical Audit Logging**: Append-only records for critical administrative actions and security-sensitive events.

### 3.2 Category B: Optional Features (Deferred to Post-V1 Review)
- Direct image file uploads for book covers (V1 utilizes external HTTPS image URLs).
- Export of personal borrowing history as CSV.
- Extended multi-tag filtering by publication year span.

### 3.3 Category C: Future Enhancements (Strictly Excluded from V1)
- Automated overdue fine computation ($X/day overdue).
- Third-party payment gateways and financial transaction processing.
- Lost or damaged book financial surcharges and invoicing.
- Automated email and SMS notifications (AWS SES, Twilio). Notifications in V1 are confined to in-app UI badges and alerts.
- Forgot-password workflows and email-based password reset.
- Self-service patron account deletion (GDPR "Right to be Forgotten" self-service).
- Barcode and RFID scanner hardware integration.
- Machine learning book recommendations and advanced BI analytics.

### 3.4 Category D: Explicitly Out-of-Scope Features
- Native mobile applications (iOS/Android) or legacy desktop client software.
- Multi-branch inter-library transfers between distinct physical libraries.
- Physical self-checkout kiosk hardware drivers.

---

## 4. Stakeholders

| Stakeholder Role | Representative | Primary Interests & Business Goals | System Interaction Touchpoints |
|---|---|---|---|
| **Library Patron** | Students, Public Members | Fast discovery, friction-free self-service borrowing, clear visibility into return deadlines. | Web Browser (Catalog, Loan Dashboard, Profile). |
| **Library Staff / Admin**| Head Librarian, Clerks | Real-time inventory accuracy, patron account governance, circulation oversight, return overrides. | Web Browser (Admin Console, Book CRUD, User Management). |
| **System Administrator**| DevOps / Infrastructure Eng. | High availability, secure authentication, zero data loss, observable workloads. | AWS Management Console, CloudWatch, CI/CD, Kubernetes. |
| **Product Owner** | Project Sponsor | Delivery on schedule, strict compliance with scope boundaries, cost adherence. | Documentation, Phase Reviews, Acceptance Sign-off. |
| **Engineering Team** | Architects, Backend, Frontend | Unambiguous requirements, clear architectural separation, robust testability. | SRS, Codebase, Issue Trackers, Pipeline Artifacts. |

---

## 5. User Roles and Personas

### 5.1 Persona 1: The Library Patron ("Alex the Student")
- **Profile**: Academic library user accessing the LMS via mobile and laptop browsers.
- **Goals**: Quick search for catalog titles, instant self-service borrowing, clear visibility into return deadlines.
- **Pain Points**: Forgetting return due dates, encountering books marked "available" that are physically missing, complex account setup.
- **Permissions**:
  - Allowed: Register, Authenticate, Search catalog, View details, Borrow books (quota <= 5), Return borrowed books, View own history, Change own password while authenticated, Update personal contact details.
  - Restricted: Cannot access administrative dashboards, cannot view other patrons' loans, cannot modify catalog stock, cannot alter system settings, cannot delete own account.

### 5.2 Persona 2: The Library Administrator ("Margaret the Head Librarian")
- **Profile**: Experienced librarian responsible for catalog curation, physical copy tracking, and patron account management.
- **Goals**: Accurate inventory counts, instant identification of overdue loans, ability to suspend patron accounts for policy violations, ability to process returns on behalf of patrons.
- **Pain Points**: Discrepancies between digital counts and shelf stock, handling patrons with delinquent materials.
- **Permissions**:
  - Allowed: Inherits all patron capabilities; Full CRUD on books; Suspend/activate patrons; View all system loans; Process book returns on behalf of patrons; View append-only audit records; View dashboard KPIs.
  - Restricted: Cannot directly alter or delete historical audit records; cannot view raw user passwords; cannot suspend their own active administrative account.

---

## 6. Functional Requirements

### 6.1 Domain A: User Registration
- **FR-AUTH-001: Patron Self-Registration**
  - **Title**: User Account Self-Registration
  - **Description**: The system shall allow unauthenticated visitors to register a new Patron account by providing First Name, Last Name, Email Address, and a Password meeting complexity standards.
  - **User Role**: Unauthenticated Visitor
  - **Priority**: High (Mandatory V1)
  - **Preconditions**: User is not authenticated.
  - **Trigger**: Visitor clicks "Register" and submits the registration form.
  - **Main Workflow**:
    1. Visitor inputs first name, last name, email address, and password.
    2. System validates input syntax and password complexity rules.
    3. System verifies that the email address is unique across the system.
    4. System securely hashes the password using a one-way cryptographic hash.
    5. System creates patron account with status `ACTIVE` and role `ROLE_PATRON`.
    6. System confirms successful registration and directs user to login.
  - **Failure Scenarios**:
    - *Email Conflict*: If email already exists, system rejects with an appropriate conflict notification indicating the email is already registered.
    - *Validation Failure*: If password does not meet complexity requirements, system rejects with specific validation prompts.
  - **Acceptance Criteria**:
    - Account is created in database with hashed password (no plain text).
    - Duplicate email registrations are strictly prevented.
    - Status defaults to `ACTIVE` and role defaults to `ROLE_PATRON`.

---

### 6.2 Domain B: User Login
- **FR-AUTH-002: User Authentication & Session Establishment**
  - **Title**: Secure User Login
  - **Description**: The system shall authenticate registered users using their email and password, establishing a secure session via an ephemeral access credential and a secure refresh credential.
  - **User Role**: Unauthenticated Visitor / Patron / Admin
  - **Priority**: High (Mandatory V1)
  - **Preconditions**: User account exists in database.
  - **Trigger**: User enters credentials and clicks "Log In".
  - **Main Workflow**:
    1. User submits email and password.
    2. System verifies user existence and validates credentials against the stored cryptographic hash.
    3. System verifies account status is `ACTIVE` (rejects if `SUSPENDED`).
    4. Upon successful verification, system issues:
       - Short-lived Access Token (held in client memory).
       - Long-lived Refresh Token (stored in a secure, HTTP-only cookie inaccessible to client scripts).
    5. System initializes user session state and directs user to their designated dashboard.
  - **Failure Scenarios**:
    - *Invalid Credentials*: System returns a generic authentication error ("Invalid email or password") to prevent user enumeration.
    - *Suspended Account*: System rejects authentication with a notice indicating the account is suspended.
  - **Acceptance Criteria**:
    - Authentication succeeds only upon exact credential match.
    - Refresh credential cannot be read or manipulated by client-side browser scripts.

---

### 6.3 Domain C: User Logout
- **FR-AUTH-003: Session Termination & Credential Invalidation**
  - **Title**: Secure Logout
  - **Description**: The system shall terminate an authenticated session by invalidating the server-side refresh credential and clearing the browser session cookie.
  - **User Role**: Authenticated Patron / Admin
  - **Priority**: High (Mandatory V1)
  - **Preconditions**: User has an active authenticated session.
  - **Trigger**: User clicks "Log Out".
  - **Main Workflow**:
    1. Client submits a logout request.
    2. Server invalidates the active refresh credential in persistence storage.
    3. Server instructs client browser to clear the session cookie.
    4. Client clears in-memory access credentials and returns to unauthenticated state.
  - **Acceptance Criteria**:
    - Invalidated refresh credentials can never be reused to obtain new access tokens.
    - Logout operation is idempotent.

---

### 6.4 Domain D: Session Continuity & Token Rotation
- **FR-AUTH-004: Silent Session Renewal with Replay Detection**
  - **Title**: Automatic Session Renewal
  - **Description**: The system shall enable clients to obtain fresh access credentials using a valid refresh token, enforcing single-use token rotation and invalidating the active session family if token reuse is detected.
  - **User Role**: Client Application (on behalf of authenticated user)
  - **Priority**: High (Mandatory V1)
  - **Preconditions**: Valid refresh token cookie is present.
  - **Trigger**: Client receives an expired-token response on a protected operation.
  - **Main Workflow**:
    1. Client transmits refresh request with the secure session cookie.
    2. System validates that the refresh token is valid and unrevoked.
    3. System revokes the presented refresh token and issues a new refresh token and access token pair.
    4. Client continues interaction seamlessly.
  - **Failure Scenarios (Intrusion Detection)**:
    - *Replay Detected*: If a previously consumed or revoked refresh token is presented again, system detects potential theft and immediately **revokes all active sessions for that user family**, requiring re-authentication.
  - **Acceptance Criteria**:
    - Session continuity maintained without user disruption during standard use.
    - Any attempt to reuse a consumed token terminates all active sessions for that token family.

---

### 6.5 Domain E: User Profile & Password Management
- **FR-USER-001: View Profile Information**
  - **Title**: Patron Profile Inspection
  - **Description**: The system shall permit authenticated patrons to view their profile details, role, status, and active loan count.
  - **User Role**: Patron / Admin
  - **Priority**: Medium (Mandatory V1)
  - **Preconditions**: User is authenticated.
  - **Acceptance Criteria**: Returns profile attributes excluding sensitive authentication secrets.

- **FR-USER-002: Authenticated Password Change**
  - **Title**: Secure Self-Service Password Change
  - **Description**: The system shall permit an authenticated user to change their password by supplying their current password and a new valid password meeting complexity rules.
  - **User Role**: Patron / Admin
  - **Priority**: High (Mandatory V1)
  - **Preconditions**: User is authenticated; current password is confirmed.
  - **Acceptance Criteria**:
    - Rejects if current password verification fails.
    - Enforces password complexity rules on new password.
    - Revokes existing active refresh tokens, forcing re-authentication on other devices.
    - *Scope Note*: Forgot-password and email recovery workflows are excluded from Version 1.

---

### 6.6 Domain F, G, H, I & J: Catalog Browsing, Search, Filtering & Availability
- **FR-BOOK-001: Catalog Browsing & Search**
  - **Title**: Public Catalog Discovery
  - **Description**: The system shall allow users to search the active book catalog across Title, Author, ISBN, and Description with pagination and sorting.
  - **User Role**: Public / Patron / Admin
  - **Priority**: High (Mandatory V1)
  - **Preconditions**: None.
  - **Acceptance Criteria**:
    - Search operates case-insensitively across text fields.
    - Deactivated books are excluded from public search results.
    - Results support pagination (configurable page size up to 50 items).

- **FR-BOOK-002: Catalog Faceted Filtering**
  - **Title**: Genre and Availability Filtering
  - **Description**: The system shall allow users to filter catalog search results by specific Genre and by real-time Stock Availability ("In Stock" vs. "All").
  - **User Role**: Public / Patron / Admin
  - **Priority**: High (Mandatory V1)
  - **Acceptance Criteria**: Filtering accurately narrows results matching selected criteria.

- **FR-BOOK-003: Book Detail View**
  - **Title**: Detailed Book Metadata View
  - **Description**: The system shall display full catalog details for a selected title: Title, Author, ISBN, Publisher, Publication Year, Genre, Synopsis, Shelf Location (Aisle/Shelf), Total Copies, and Available Copies.
  - **User Role**: Public / Patron / Admin
  - **Priority**: High (Mandatory V1)
  - **Acceptance Criteria**: Returns full metadata for valid book identifier; returns appropriate not-found notice for invalid identifiers.

- **FR-BOOK-004: Real-Time Availability Indicator**
  - **Title**: Stock Status Indication
  - **Description**: The system shall dynamically indicate whether a title is currently available for borrowing ("In Stock" when `availableCopies > 0`) or unavailable ("Out of Stock" when `availableCopies == 0`).
  - **User Role**: Public / Patron / Admin
  - **Priority**: High (Mandatory V1)
  - **Acceptance Criteria**: Matches actual persistent available copy count.

---

### 6.7 Domain K: Book Borrowing (Self-Service)
- **FR-BORROW-001: Self-Service Book Borrowing**
  - **Title**: Consistent Book Borrowing Operation
  - **Description**: The system shall allow an authenticated patron to borrow an available book copy. The system shall maintain data consistency during concurrent borrowing operations and prevent inventory from becoming inconsistent or negative.
  - **User Role**: Authenticated Patron
  - **Priority**: High (Mandatory V1)
  - **Preconditions**:
    1. Patron account status is `ACTIVE`.
    2. Patron has fewer than 5 active loans (`activeBorrowCount < 5`).
    3. The requested book has `availableCopies > 0` and is not deactivated.
    4. Patron does not already hold an active loan for this exact book title.
  - **Trigger**: Patron clicks "Borrow Book".
  - **Main Workflow**:
    1. Patron submits borrow request for a book title.
    2. System verifies patron eligibility and active loan limit (max 5).
    3. System verifies book availability.
    4. System atomically decrements available copies by 1, creates a loan record with status `ISSUED` and a due date set to exactly 14 calendar days from checkout, and increments patron's active loan count by 1.
    5. System confirms loan creation and updates patron dashboard.
  - **Failure Scenarios**:
    - *Quota Exceeded*: Active loans == 5. System rejects with clear notification that limit is reached.
    - *Concurrent Stock Depletion*: Last copy claimed simultaneously by another patron. System prevents negative inventory and informs patron that the title is out of stock.
    - *Duplicate Loan*: Patron already holds an active loan for this book. System rejects with notice.
  - **Acceptance Criteria**:
    - Stock decrements and loan record creation succeed or fail as a single consistent operation.
    - Due date is set to exactly 14 calendar days from borrow timestamp.
    - Available stock never drops below zero.

---

### 6.8 Domain L: Book Returning (Self-Service)
- **FR-BORROW-002: Self-Service Book Returning**
  - **Title**: Consistent Book Return Operation
  - **Description**: The system shall allow an authenticated patron to return a borrowed book, updating the loan record and returning the physical volume to available stock.
  - **User Role**: Authenticated Patron
  - **Priority**: High (Mandatory V1)
  - **Preconditions**: Active loan exists with status `ISSUED` belonging to the authenticated patron.
  - **Trigger**: Patron clicks "Return Book" on active loan row.
  - **Main Workflow**:
    1. Patron submits return request for an active loan.
    2. System verifies that the loan belongs to the patron and is currently `ISSUED`.
    3. System consistently updates the loan status to `RETURNED`, records return timestamp, increments available book copies by 1, and decrements patron active loan count by 1.
    4. System confirms return completion and moves loan to history view.
  - **Failure Scenarios**:
    - *Already Returned*: Loan record is already marked `RETURNED`. System rejects return attempt.
  - **Acceptance Criteria**:
    - Available book copies increments by exactly 1.
    - Patron active loan count decrements by exactly 1.
    - Return timestamp is recorded accurately.

---

### 6.9 Domain M & N: Active Loans & Borrowing History
- **FR-BORROW-003: Active Loans Dashboard**
  - **Title**: Patron Active Loans Oversight
  - **Description**: The system shall display all currently held loans for the logged-in patron, showing Title, Author, Checkout Date, Due Date, and an operational `OVERDUE` indicator if the current date exceeds the due date.
  - **User Role**: Authenticated Patron
  - **Priority**: High (Mandatory V1)
  - **Acceptance Criteria**:
    - Displays all loans where status is `ISSUED`.
    - Visually flags any loan where `currentDate > dueDate` as "OVERDUE".
    - Contains zero dollar fine or financial calculation.

- **FR-BORROW-004: Complete Borrowing History Archive**
  - **Title**: Chronological Loan History
  - **Description**: The system shall provide patrons with a chronological history of all past and completed loans.
  - **User Role**: Authenticated Patron
  - **Priority**: Medium (Mandatory V1)
  - **Acceptance Criteria**: Displays past loans sorted descending by checkout date, showing checkout date, return date, and completion status.

---

### 6.10 Domain O: Administrative Dashboard
- **FR-ADMIN-001: Operational Metric Cards**
  - **Title**: Library Executive KPI Summary
  - **Description**: The administrative dashboard shall display real-time operational counts: Total Catalog Titles, Total Physical Copies, Currently Issued Loans, Overdue Loans, and Registered Patrons.
  - **User Role**: Administrator
  - **Priority**: High (Mandatory V1)
  - **Acceptance Criteria**: Accessible only to users with `ROLE_ADMIN`; values reflect persistent system counts.

---

### 6.11 Domain P: Book Inventory Management (CRUD)
- **FR-ADMIN-002: Add New Catalog Item**
  - **Title**: Create Book Record
  - **Description**: Administrators shall be able to add new catalog items, specifying Title, Author, ISBN, Genre, Description, Publisher, Publication Year, Total Copies, Shelf Coordinates (Aisle/Shelf), and optional Cover Image URL.
  - **User Role**: Administrator
  - **Priority**: High (Mandatory V1)
  - **Acceptance Criteria**:
    - Validates unique ISBN format.
    - Initial `availableCopies` is set equal to `totalCopies`.
    - Writes an append-only audit record.

- **FR-ADMIN-003: Edit Book Record & Stock**
  - **Title**: Update Catalog Metadata & Copies
  - **Description**: Administrators shall be able to update metadata and adjust total copy counts. The system shall strictly prevent reducing total copies below the number of currently checked-out volumes.
  - **User Role**: Administrator
  - **Priority**: High (Mandatory V1)
  - **Acceptance Criteria**:
    - Prevents total copies from being set lower than currently issued copies.
    - Writes an append-only audit record.

- **FR-ADMIN-004: Deactivate (Soft-Delete) Book Item**
  - **Title**: Catalog Item Deactivation
  - **Description**: Administrators shall be able to deactivate a book title. Deactivated books are removed from public catalog discovery but retained for historical loan integrity.
  - **User Role**: Administrator
  - **Priority**: High (Mandatory V1)
  - **Acceptance Criteria**:
    - Rejects deactivation if active loans exist for that title.
    - Sets deactivation status; does not delete historical records.
    - Writes an append-only audit record.

---

### 6.12 Domain Q: User Management
- **FR-ADMIN-005: Patron Account Oversight & Status Toggling**
  - **Title**: Administrative User Management
  - **Description**: Administrators shall be able to browse all registered users, view patron borrowing records, and toggle patron status between `ACTIVE` and `SUSPENDED`.
  - **User Role**: Administrator
  - **Priority**: High (Mandatory V1)
  - **Acceptance Criteria**:
    - Suspended patrons are prevented from authenticating and cannot borrow books.
    - Administrators cannot suspend their own active administrative account.
    - Self-service patron account deletion is prohibited; account status is managed strictly by administrators.
    - Writes an append-only audit record upon status change.

---

### 6.13 Domain R & S: Borrowing & Transaction Management
- **FR-ADMIN-006: Global Circulation Oversight**
  - **Title**: System-Wide Loan Monitoring
  - **Description**: Administrators shall be able to view all library loans across all patrons with filtering by status (`ISSUED`, `RETURNED`, `OVERDUE`) and date ranges.
  - **User Role**: Administrator
  - **Priority**: High (Mandatory V1)
  - **Acceptance Criteria**: Displays patron identity, title, borrow date, due date, return date, and circulation status.

- **FR-ADMIN-007: Administrative Return on Behalf of Patron**
  - **Title**: Staff Return Processing
  - **Description**: An authorized administrator may process a book return on behalf of a patron when required.
  - **User Role**: Administrator
  - **Priority**: High (Mandatory V1)
  - **Preconditions**: Active loan exists in `ISSUED` status.
  - **Acceptance Criteria**:
    - Successfully checks in the book, increments stock by 1, and marks loan `RETURNED`.
    - Writes an append-only audit record capturing staff override.

- **FR-ADMIN-008: Critical Administrative Audit Records**
  - **Title**: Append-Only Audit Logging
  - **Description**: The system shall maintain append-only audit records for critical administrative actions and security-sensitive events. Audit records shall not be modified through normal application functionality.
  - **User Role**: System Automated / Administrator (Read-Only)
  - **Priority**: High (Mandatory V1)
  - **Acceptance Criteria**:
    - Captures: Administrative book creation, modification, and deactivation; User status changes; Administrative return overrides; Security-sensitive administrative actions.
    - Records actor identifier, action type, target entity identifier, timestamp, and client IP address.
    - Audit records are strictly append-only and cannot be edited or deleted via application APIs.

---

## 7. Detailed User Stories

| Story ID | User Role | User Story Statement | Acceptance Criteria | Priority | Dependencies | Edge Cases Handled |
|---|---|---|---|---|---|---|
| **US-01** | Visitor | As a visitor, I want to self-register online, so that I can gain access to borrow library materials. | Valid email, strong password, unique record created, directed to login. | High | None | Duplicate email registration attempts. |
| **US-02** | Patron | As a patron, I want to authenticate securely and maintain my session, so that I can interact without frequent re-login. | Ephemeral access token + secure cookie refresh credential with replay detection. | High | US-01 | Replayed refresh token revokes entire session family. |
| **US-03** | Patron | As an authenticated user, I want to change my password securely, so that I can protect my account if compromised. | Current password verification, complexity rules, invalidates other active sessions. | High | US-02 | Incorrect current password rejected. |
| **US-04** | Patron | As a patron, I want to search catalog books by title, author, or keyword, so that I can quickly find relevant reading material. | Search query filters results in real-time with sub-200ms response; paginated. | High | None | Special search characters sanitized. |
| **US-05** | Patron | As a patron, I want to filter the catalog by genre and stock availability, so that I can focus only on in-stock items. | Dynamic filtering; out-of-stock items can be hidden. | Medium | US-04 | Empty filter results display helpful empty state. |
| **US-06** | Patron | As a patron, I want to borrow an available book online, so that I can secure reading material up to my 5-book quota. | Stock decrements consistently; loan created with 14-day due date; caps at 5 loans. | High | US-02, US-04 | Concurrent checkout on last copy fails gracefully. |
| **US-07** | Patron | As a patron, I want to return a borrowed book when finished, so that my active loan quota is restored. | Stock increments consistently; loan marked returned; quota restored. | High | US-06 | Returning an already-returned book rejected. |
| **US-08** | Patron | As a patron, I want to view all my active loans and due dates, so that I never miss a return deadline. | Displays active loans with clear due dates and overdue flags. | High | US-06 | Overdue books display prominent visual indicator. |
| **US-09** | Patron | As a patron, I want to view my past borrowing history, so that I can keep track of books I have read. | Chronological list of returned books with borrow and return dates. | Low | US-07 | Zero past loans shows informative empty state. |
| **US-10** | Admin | As a librarian, I want an executive dashboard displaying inventory KPIs, so that I have immediate operational visibility. | Real-time counts of titles, copies, active loans, and overdue items. | High | US-06 | Zero library stock shows 0 counts without error. |
| **US-11** | Admin | As a librarian, I want to add new books to the catalog, so that patrons can discover new arrivals. | Captures title, author, ISBN, copies, shelf location; validates unique ISBN. | High | None | Duplicate ISBN rejected with clear notification. |
| **US-12** | Admin | As a librarian, I want to edit book metadata and copy counts, so that catalog records reflect physical changes. | Updates saved; prevents reducing total copies below active loan count. | High | US-11 | Reducing copies below active loans rejected. |
| **US-13** | Admin | As a librarian, I want to deactivate books no longer in circulation, so that patrons do not attempt to borrow retired titles. | Hides book from public search; blocked if active loans exist. | High | US-11 | Deactivation blocked if active loans exist. |
| **US-14** | Admin | As a librarian, I want to suspend patron accounts, so that policy violators cannot borrow materials. | Suspends user; blocks login and checkout immediately; logs audit record. | High | US-01 | Admin cannot suspend own active account. |
| **US-15** | Admin | As a librarian, I want to process returns on behalf of patrons when required, so that returned physical materials are promptly checked back in. | Staff check-in marks loan returned and increments available stock. | High | US-06 | Loan already returned handled safely. |
| **US-16** | Admin | As an administrator, I want an append-only audit log of critical administrative actions, so that I can verify who performed system mutations. | Logs actor, action, timestamp, entity ID, and IP; read-only access. | Medium | US-11, US-14 | Audit records cannot be modified or deleted. |

---

## 8. Use Case Specifications

### 8.1 UC-01: User Self-Registration
- **Primary Actor**: Unauthenticated Visitor
- **Preconditions**: Visitor has internet connectivity and a modern web browser.
- **Trigger**: Visitor navigates to registration page and submits credentials.
- **Main Success Flow**:
  1. Visitor inputs Name, Email, Password, and Password Confirmation.
  2. System validates form fields for syntax and complexity.
  3. System verifies that email is unique.
  4. System hashes password using a secure one-way cryptographic hash.
  5. System creates patron account with status `ACTIVE` and role `ROLE_PATRON`.
  6. System confirms registration and directs visitor to login.
- **Alternative Flows**: None.
- **Failure Flows**:
  - *2a. Validation Failure*: Passwords do not match or fail complexity rules. System highlights offending fields.
  - *3a. Duplicate Email*: Email already registered. System displays error notification.
- **Postconditions**: New active user persisted; no session token granted until explicit login.

---

### 8.2 UC-02: User Login
- **Primary Actor**: Registered User (Patron or Admin)
- **Preconditions**: User possesses registered credentials.
- **Trigger**: User enters email and password, clicks "Log In".
- **Main Success Flow**:
  1. System checks email existence and validates password against stored hash.
  2. System confirms account status is `ACTIVE`.
  3. System issues ephemeral access token (in-memory) and secure refresh token (HttpOnly cookie).
  4. Frontend routes user to Catalog (Patron) or Dashboard (Admin).
- **Failure Flows**:
  - *1a. Invalid Credentials*: Email or password incorrect. System displays generic authentication error.
  - *2a. Suspended Account*: Account is `SUSPENDED`. System rejects login with suspension notice.
- **Postconditions**: User authenticated; session credentials established.

---

### 8.3 UC-03: User Logout
- **Primary Actor**: Authenticated User
- **Preconditions**: User is logged in.
- **Trigger**: User clicks "Log Out".
- **Main Success Flow**:
  1. Client sends logout request.
  2. Server invalidates refresh credential in persistent store.
  3. Server clears session cookie.
  4. Client clears in-memory credentials and redirects to login page.
- **Postconditions**: Session terminated; stored credentials invalidated.

---

### 8.4 UC-04: Browse and Search Book Catalog
- **Primary Actor**: Public Visitor / Patron / Admin
- **Preconditions**: None.
- **Trigger**: User accesses catalog page or enters search text.
- **Main Success Flow**:
  1. System queries active catalog (`isDeleted == false`).
  2. System applies text query, genre filter, and availability filter.
  3. System renders paginated list of matching book summary cards.
- **Postconditions**: Read-only catalog results rendered.

---

### 8.5 UC-05: View Book Details
- **Primary Actor**: Public Visitor / Patron / Admin
- **Preconditions**: Book exists in system.
- **Trigger**: User clicks on a book card.
- **Main Success Flow**:
  1. System retrieves full book metadata: Title, Author, ISBN, Publisher, Year, Genre, Synopsis, Shelf Coordinates, Total Copies, Available Copies.
  2. Renders metadata and displays "Borrow Book" (if in stock and user is patron) or "Out of Stock".
- **Failure Flows**:
  - *1a. Not Found*: Identifier invalid or deactivated. System displays not-found notice.
- **Postconditions**: Full metadata displayed.

---

### 8.6 UC-06: Borrow Book (Self-Service)
- **Primary Actor**: Authenticated Patron
- **Preconditions**: Patron status is `ACTIVE`; Patron active loans < 5; Book `availableCopies > 0`.
- **Trigger**: Patron clicks "Borrow Book".
- **Main Success Flow**:
  1. Client sends borrow request with book identifier.
  2. Server verifies patron eligibility and active loan limit (max 5).
  3. Server consistently decrements available copies by 1, creates loan record (`status: ISSUED`, `dueDate: now + 14 days`), and increments patron active loan count by 1.
  4. Server confirms creation; client displays success notification and updates active loan view.
- **Failure Flows**:
  - *2a. Quota Exceeded*: Active loans == 5. Rejects with quota notice.
  - *3a. Concurrent Depletion*: Another patron borrowed the last copy simultaneously. Operation safely fails; informs patron book is out of stock.
- **Postconditions**: Stock decremented; active loan bound to patron.

---

### 8.7 UC-07: Return Book (Self-Service)
- **Primary Actor**: Authenticated Patron
- **Preconditions**: Active loan exists in `ISSUED` status belonging to patron.
- **Trigger**: Patron clicks "Return Book" on active loan row.
- **Main Success Flow**:
  1. Client sends return request with loan identifier.
  2. Server verifies loan ownership and active status.
  3. Server consistently updates loan status to `RETURNED`, increments book available copies by 1, and decrements patron active loan count by 1.
  4. Server confirms completion; client moves item from active loans to history.
- **Failure Flows**:
  - *2a. Already Returned*: Loan already returned. Rejection notice displayed.
- **Postconditions**: Available stock incremented; loan archived as returned.

---

### 8.8 UC-08: View Active Loans & Borrowing History
- **Primary Actor**: Authenticated Patron
- **Preconditions**: User is logged in.
- **Trigger**: User navigates to active loans or history tab.
- **Main Success Flow**:
  1. System queries loans for authenticated user.
  2. Active tab displays loans with `status == ISSUED`, calculating remaining days and flagging overdue items.
  3. History tab displays chronologically sorted completed loans.
- **Postconditions**: Patron reviews circulation records.

---

### 8.9 UC-09: Add Book to Inventory
- **Primary Actor**: Administrator
- **Preconditions**: User authenticated with `ROLE_ADMIN`.
- **Trigger**: Admin submits "Add New Book" form.
- **Main Success Flow**:
  1. Admin enters Title, Author, ISBN, Genre, Description, Publisher, Year, Total Copies, Shelf Location (Aisle/Shelf).
  2. System validates syntax and checks ISBN uniqueness.
  3. System creates book record (`availableCopies = totalCopies`, `isDeleted = false`).
  4. System records append-only audit log entry (`BOOK_CREATED`).
  5. System confirms creation and updates catalog view.
- **Failure Flows**:
  - *2a. Duplicate ISBN*: ISBN exists. Rejection notice displayed.
- **Postconditions**: New catalog item live and discoverable.

---

### 8.10 UC-10: Edit Book Record & Stock
- **Primary Actor**: Administrator
- **Preconditions**: User authenticated with `ROLE_ADMIN`; book exists.
- **Trigger**: Admin submits edited book details.
- **Main Success Flow**:
  1. Admin modifies metadata or adjusts total copy count.
  2. System verifies that `newTotalCopies >= (totalCopies - availableCopies)`.
  3. System updates book record and recalculates available copies.
  4. System records append-only audit log entry (`BOOK_UPDATED`).
  5. System confirms update.
- **Failure Flows**:
  - *2a. Illegal Reduction*: Total copies reduced below currently borrowed copies. System rejects modification.
- **Postconditions**: Book metadata and stock updated.

---

### 8.11 UC-11: Deactivate (Soft-Delete) Book
- **Primary Actor**: Administrator
- **Preconditions**: User authenticated with `ROLE_ADMIN`; book exists.
- **Trigger**: Admin clicks "Deactivate Book".
- **Main Success Flow**:
  1. System verifies active loan count for book is zero.
  2. System sets `isDeleted = true`.
  3. System records append-only audit log entry (`BOOK_DEACTIVATED`).
  4. System confirms deactivation; book hidden from public search.
- **Failure Flows**:
  - *1a. Active Loans Exist*: System blocks deactivation while active loans exist.
- **Postconditions**: Book marked deactivated.

---

### 8.12 UC-12: Manage Patron Accounts
- **Primary Actor**: Administrator
- **Preconditions**: User authenticated with `ROLE_ADMIN`.
- **Trigger**: Admin toggles patron status.
- **Main Success Flow**:
  1. Admin views patron profile, contact info, and loan counts.
  2. Admin clicks "Suspend Account" or "Reactivate Account".
  3. System updates patron status (`SUSPENDED` or `ACTIVE`).
  4. System records append-only audit log entry (`USER_STATUS_UPDATED`).
  5. If suspended, system terminates active patron sessions.
- **Failure Flows**:
  - *2a. Self-Suspension*: Admin attempts to suspend their own account. Operation blocked.
- **Postconditions**: Patron status toggled; sessions terminated if suspended.

---

### 8.13 UC-13: Process Return on Behalf of Patron
- **Primary Actor**: Administrator
- **Preconditions**: User authenticated with `ROLE_ADMIN`; active loan exists.
- **Trigger**: Admin processes return on circulation management view.
- **Main Success Flow**:
  1. Admin identifies loan by patron name or book title.
  2. Admin executes return action.
  3. System consistently marks loan `RETURNED`, increments book stock by 1, and decrements patron active loan count by 1.
  4. System records append-only audit log entry (`ADMIN_RETURN_OVERRIDE`).
  5. System confirms return completion.
- **Postconditions**: Book returned to shelf stock on patron's behalf.

---

## 9. Borrowing and Circulation Rules

The following circulation rules are formally locked for Version 1:

```
+-----------------------------------------------------------------------------+
|                     CONFIRMED CIRCULATION RULES (V1)                        |
+-----------------------------------------------------------------------------+
| Rule ID    | Policy Topic         | Rule Summary                            |
+------------+----------------------+-----------------------------------------+
| BR-CIRC-001| Patron Active Quota  | Maximum 5 active books simultaneously   |
| BR-CIRC-002| Standard Loan Period | Exactly 14 calendar days from checkout  |
| BR-CIRC-003| Unavailable Titles   | Borrowing strictly disabled             |
| BR-CIRC-004| Book Reservations    | Excluded from Version 1                 |
| BR-CIRC-005| Loan Renewals        | Excluded from Version 1                 |
| BR-CIRC-006| Return Eligibility   | Returned at any time; overdue accepted  |
| BR-CIRC-007| Overdue Tracking     | Operational status flag only (no fines) |
| BR-CIRC-008| Administrative Return| Admin may return on behalf of patron    |
+------------+----------------------+-----------------------------------------+
```

1. **BR-CIRC-001 (Active Loan Quota)**: A patron may hold a maximum of **5 active book loans** simultaneously. If `activeBorrowCount >= 5`, checkout is blocked.
2. **BR-CIRC-002 (Standard Loan Period)**: The standard loan duration is **14 calendar days** from the checkout timestamp (`dueDate = borrowDate + 14 days`).
3. **BR-CIRC-003 (Unavailable Titles)**: When `availableCopies == 0`, borrowing is strictly disabled. The UI disables checkout and backend rejects borrow requests.
4. **BR-CIRC-004 (Book Reservations Excluded)**: Book holds, reservations, and waitlist queuing are explicitly excluded from Version 1.
5. **BR-CIRC-005 (Loan Renewals Excluded)**: Loan renewal functionality is excluded from Version 1. A patron must return a book before borrowing it again.
6. **BR-CIRC-006 (Return Eligibility)**: A patron may return a book at any time before or after the due date. Overdue returns are accepted immediately to replenish inventory.
7. **BR-CIRC-007 (Overdue Tracking Without Fines)**: Overdue status is tracked purely as an **operational condition** (`currentDate > dueDate` while `status == ISSUED`). Automated financial calculations, fines, and payment processing are excluded from V1.
8. **BR-CIRC-008 (Administrative Return on Behalf of Patron)**: An authorized administrator may process a book return on behalf of a patron when required.

---

## 10. Book Catalog Requirements

### 10.1 Required Book Metadata Fields
Every catalog item must maintain the following attributes:

| Field Name | Description | Constraints |
|---|---|---|
| `title` | Title of the literary work | Mandatory text, max 255 characters |
| `author` | Primary author or contributor | Mandatory text, max 150 characters |
| `isbn` | International Standard Book Number | Mandatory string, unique, ISBN-10 or ISBN-13 format |
| `genre` | Primary taxonomic classification | Mandatory enum (Fiction, Technology, Science, History, etc.) |
| `description` | Synopsis and book summary | Mandatory text, max 2000 characters |
| `publisher` | Publishing house | Mandatory text, max 100 characters |
| `publicationYear`| Year of publication | Mandatory integer, 1000 <= Year <= Current Year + 1 |
| `totalCopies` | Total physical volumes owned | Mandatory integer >= 1 |
| `availableCopies`| Physical copies currently on shelf | Mandatory integer, 0 <= availableCopies <= totalCopies |
| `location.aisle` | Physical shelving aisle | Mandatory text (e.g., "Aisle 4") |
| `location.shelf` | Physical shelf coordinates | Mandatory text (e.g., "Shelf B-2") |
| `coverImageUrl` | Link to cover art graphic | Optional valid HTTPS image URL |
| `isDeleted` | Soft-delete status flag | Mandatory boolean, default `false` |

### 10.2 Hardware & Classification Decisions
- **Dewey Decimal Classification**: Excluded from V1. Genre categorization combined with human-readable shelf coordinates (`location.aisle`, `location.shelf`) provides complete shelf locating capability without classification complexity.
- **Barcode & RFID Scanner Integrations**: Excluded from V1. The web application relies on standard keyboard/text input for ISBNs. Hardware drivers and scanner integrations are excluded.

---

## 11. Authentication & Password Management Requirements

### 11.1 Credential & Registration Standards
- **AR-01 (Password Complexity)**: Passwords must contain a minimum of 8 characters, including at least one uppercase letter, one lowercase letter, one digit, and one special symbol.
- **AR-02 (Password Storage)**: Passwords must be protected using a modern one-way cryptographic hashing algorithm. Plaintext passwords must never be stored or logged.
- **AR-03 (Unique Identity)**: Email addresses serve as the unique login username across the system.

### 11.2 Password Management Scope (Explicit V1 Boundaries)
- **Mandatory Version 1 Functionality**:
  - Authenticated users may change their password securely by providing their current password and a new valid password meeting complexity standards.
- **Excluded from Version 1 (Future Enhancements)**:
  - Email-based forgot-password workflows.
  - External password reset notifications.
  - Multi-factor authentication (MFA).
- *Governance Confirmation*: The system does not require an email service or third-party notification provider for password management in Version 1.

### 11.3 Session Handling Requirements
- **AR-04 (Access Credentials)**: Authenticated sessions use an ephemeral access credential held in client memory.
- **AR-05 (Refresh Credentials)**: Sessions maintain continuity via a secure refresh credential stored in a cookie protected with `HttpOnly`, `Secure`, and `SameSite` flags, inaccessible to client-side scripts.
- **AR-06 (Replay Intrusion Detection)**: The system enforces single-use refresh token rotation. If a previously consumed refresh token is presented, the system detects replay theft and immediately revokes all active sessions for that token family.

---

## 12. Authorization Requirements

### 12.1 Complete Role-Based Access Control (RBAC) Matrix

| Resource Entity | Functional Operation | Patron Role | Administrator Role | Unauthenticated Visitor |
|---|---|---|---|---|
| **Public Catalog** | Search / Browse Books | ALLOW | ALLOW | ALLOW |
| **Book Details** | View Full Metadata | ALLOW | ALLOW | ALLOW |
| **User Account** | Self-Register Account | DENY (Already reg) | DENY (Already reg) | ALLOW |
| **User Account** | Log In / Log Out | ALLOW | ALLOW | ALLOW (Login only) |
| **Personal Profile** | View / Edit Own Details | ALLOW | ALLOW | DENY |
| **Personal Profile** | Change Own Password | ALLOW | ALLOW | DENY |
| **Circulation** | Borrow Book Copy | ALLOW (Own account) | ALLOW (Own account) | DENY |
| **Circulation** | Return Borrowed Book | ALLOW (Own loan) | ALLOW (Any loan) | DENY |
| **Circulation** | View Active Loans | ALLOW (Own loans) | ALLOW (All loans) | DENY |
| **Circulation** | View Loan History | ALLOW (Own history) | ALLOW (All history) | DENY |
| **Inventory CRUD** | Add New Book Title | DENY | ALLOW | DENY |
| **Inventory CRUD** | Edit Book / Stock | DENY | ALLOW | DENY |
| **Inventory CRUD** | Deactivate Book | DENY | ALLOW | DENY |
| **User Management** | List All Users | DENY | ALLOW | DENY |
| **User Management** | Suspend / Enable User | DENY | ALLOW | DENY |
| **Dashboard KPIs** | View Executive Summary | DENY | ALLOW | DENY |
| **Audit Records** | View Audit Log Stream | DENY | ALLOW | DENY |

### 12.2 Privilege Isolation Rules
- **AZ-01**: A patron can strictly query and mutate only their own loans and profile records.
- **AZ-02**: URL manipulation attempts to access another patron's data must be rejected with an authorization failure (`403 Forbidden`).
- **AZ-03**: Administrative operations must strictly verify that the active credential holds `ROLE_ADMIN`.

---

## 13. Input Validation Requirements

All inputs must be validated at the application boundary against syntax and business rules prior to executing business operations:

| Input Domain | Field Name | Validation Requirement | Error Behavior |
|---|---|---|---|
| **Registration** | `firstName`, `lastName` | 1-50 characters, alphabetic and standard name punctuation | Informative validation error prompt |
| **Registration** | `email` | Valid email syntax, max 255 characters | Rejection of invalid email format |
| **Registration** | `password` | Min 8 chars, uppercase, lowercase, digit, special symbol | Specific password complexity prompt |
| **Catalog** | `isbn` | Standard ISBN-10 or ISBN-13 syntax | Rejection of invalid ISBN format |
| **Catalog** | `publicationYear` | Integer between 1000 and (Current Year + 1) | Rejection of out-of-range year |
| **Catalog** | `totalCopies` | Positive integer >= 1 | Rejection of invalid copy count |
| **Catalog** | `location.aisle`, `shelf` | Non-empty text, max 30 characters | Rejection of missing shelf location |
| **Search Query** | `q` | Max 100 characters, stripped of command operators | Sanitized text matching |
| **Pagination** | `page`, `limit` | Integers; `page >= 1`, `1 <= limit <= 50` | Default fallback to standard page bounds |
| **Identifiers** | Entity IDs | Standard alphanumeric entity identifier format | Rejection of malformed identifiers |

---

## 14. Error Handling Requirements

### 14.1 User-Facing Error Standards
The system shall deliver predictable, safe, and informative error messages to client applications. Internal implementation details, database errors, and stack traces must never be exposed to clients.

### 14.2 Scenario-Specific Behavioral Rules
- **EH-01 (Authentication Failure)**: Return generic message: "Invalid email or password" (prevents username enumeration).
- **EH-02 (Authorization Failure)**: Return: "You do not have permission to perform this action."
- **EH-03 (Resource Not Found)**: Return informative entity context (e.g., "Requested book record was not found.").
- **EH-04 (Concurrent Stock Conflict)**: Return: "This book is currently out of stock and cannot be borrowed."
- **EH-05 (Quota Breach)**: Return: "Maximum borrowing limit of 5 books reached."
- **EH-06 (System / Connectivity Fault)**: Return sanitized notice: "An unexpected system error occurred. Please try again later."

---

## 15. Non-Functional Requirements

### 15.1 Performance Requirements
- **NFR-PERF-01**: Catalog search queries shall return results within **P95 < 200 ms** under baseline operational load.
- **NFR-PERF-02**: Borrow and return operations shall execute within **P95 < 500 ms**.
- **NFR-PERF-03**: Initial frontend bundle load time shall be **< 2.0 seconds** over standard 4G connections.
- *Note*: Peak concurrent user and throughput targets are classified as **TARGETS TO BE VALIDATED DURING TESTING** in Phase 13.

### 15.2 Scalability Requirements
- **NFR-SCAL-01**: Backend compute services shall remain completely stateless, allowing horizontal expansion based on load metrics.
- **NFR-SCAL-02**: Catalog queries shall leverage indexed data structures ensuring query time scales logarithmically rather than linearly with collection size.

### 15.3 Availability & Reliability
- **NFR-AVAIL-01**: Target operational availability of **99.9% uptime**.
- **NFR-REL-01**: The system shall maintain complete data consistency across borrowing and returning operations, guaranteeing that inventory counts never become negative or out-of-sync.
- **NFR-REL-02**: Application workloads shall support automatic self-healing and recovery from process faults.

### 15.4 Security & Privacy
- **NFR-SEC-01**: All data in transit across public networks must be encrypted using TLS 1.3.
- **NFR-SEC-02**: All sensitive authentication credentials and refresh tokens must be cryptographically protected.
- **NFR-SEC-03**: Container deployment images must have zero critical or high unfixed vulnerabilities at deployment time.

### 15.5 Maintainability & Code Quality
- **NFR-MAINT-01**: Strict type-checking enforced across application codebases with zero untyped bypasses.
- **NFR-MAINT-02**: Automated unit test coverage baseline of >= 85% across domain business logic.

### 15.6 Usability & Accessibility
- **NFR-USE-01**: The user interface shall be fully responsive across mobile (320px+), tablet, and desktop displays.
- **NFR-ACC-01**: Interactive controls shall comply with **WCAG 2.1 Level AA** accessibility standards (keyboard navigation, aria labels, color contrast >= 4.5:1).

### 15.7 Observability & Recoverability
- **NFR-OBS-01**: All system requests shall be tracked with a unique correlation identifier across all log entries.
- **NFR-REC-01**: Production disaster recovery targets: RPO < 15 minutes; RTO < 60 minutes.

---

## 16. Security Requirements

- **SR-01 (Defense in Depth)**: Security controls must be enforced at multiple architectural boundaries: Ingress network boundary, application routing, business middleware, and persistence layer.
- **SR-02 (Brute-Force Protection)**: Authentication endpoints must enforce rate limiting (maximum 5 attempts per 15-minute window per IP) to mitigate automated password guessing.
- **SR-03 (Injection Defense)**: All incoming query parameters and request payloads must be sanitized to prevent NoSQL query injection and script injection attacks.
- **SR-04 (Cross-Site Scripting - XSS)**: All user-supplied content rendered in the client interface must be sanitized against HTML injection; HTTP responses must enforce strict security headers.
- **SR-05 (Secrets Protection)**: System configuration secrets must be injected dynamically via secure environment configurations; hard-coding secrets in source repositories is strictly prohibited.
- **SR-06 (Append-Only Audit Logging)**: Critical administrative actions and security-sensitive events must write append-only records that cannot be modified or deleted via normal application functionality.

---

## 17. Data Requirements

The system must store, manage, and preserve consistency across five core data domains:

1. **User Identity Data**: Patron Name, Email Address, Password Hash, Role (`ROLE_PATRON`, `ROLE_ADMIN`), Status (`ACTIVE`, `SUSPENDED`), and Active Loan Counter.
2. **Catalog Inventory Data**: Title, Author, ISBN, Genre, Description, Publisher, Publication Year, Total Copies, Available Copies, Shelf Coordinates (`aisle`, `shelf`), Cover Image URL, and Soft-Delete Flag.
3. **Circulation Transaction Data**: Loan ID, User Identifier, Book Identifier, Borrow Date, Due Date, Return Date, and Circulation Status (`ISSUED`, `RETURNED`, `OVERDUE`).
4. **Session Authentication Data**: Hashed Refresh Token, User Identifier, Family Identifier, Revocation Flag, and Expiry Timestamp.
5. **Administrative Audit Data**: Event ID, Actor User Identifier, Action Type, Target Entity Identifier, Client IP Address, and Timestamp.

*(Detailed database schema structures, field types, and indexing specifications will be designed in Phase 3 – Database Architecture).*

---

## 18. API Behavior Requirements

- **ABR-01 (REST Architectural Standards)**: APIs must adhere to standard REST conventions using standard HTTP methods (`GET`, `POST`, `PUT`/`PATCH`, `DELETE`).
- **ABR-02 (Uniform JSON Response Envelopes)**: Successful responses must return consistent structured JSON containing status, data payload, and user-friendly message.
- **ABR-03 (Idempotency)**: Logout and resource deactivation operations must be idempotent.
- **ABR-04 (Standard Pagination Envelopes)**: Collection endpoints must accept `page` and `limit` parameters and return metadata: `{ total, page, totalPages, limit }`.
- **ABR-05 (Stateless Authentication Transport)**: Protected endpoints must accept credentials via standard `Authorization: Bearer <token>` headers.

---

## 19. User Interface Requirements

### 19.1 Public Views
- **UI-PUB-01 (Landing Page)**: Introduces the library, highlights featured catalog titles, and provides navigation to Catalog, Login, and Registration.
- **UI-PUB-02 (Catalog Search & Browse)**: Search bar with debounced query execution, genre filter dropdown, availability filter toggle, and responsive book card grid.
- **UI-PUB-03 (Registration View)**: Clean form with client-side password strength indicator, email validation, and accessible feedback prompts.
- **UI-PUB-04 (Login View)**: Minimalist login interface with email and password fields, clear error feedback, and link to registration.

### 19.2 Patron Views
- **UI-PAT-01 (Patron Dashboard)**: Displays summary cards: Active Loans count ("X of 5 used"), Books Due Soon, and quick links to browse catalog.
- **UI-PAT-02 (Active Loans View)**: Card/table list of currently held books with Title, Author, Checkout Date, Due Date, Days Remaining, and a prominent "Return Book" action. Overdue items are visually highlighted in red.
- **UI-PAT-03 (Borrowing History View)**: Chronological archive of past completed loans with borrow and return dates.
- **UI-PAT-04 (Profile & Password View)**: Displays user details and provides a form to update contact information and execute authenticated password change.

### 19.3 Administrator Views
- **UI-ADM-01 (Executive Dashboard)**: Displays KPI metric cards (Total Titles, Total Volumes, Active Loans, Overdue Items, Registered Patrons) and recent transaction activity feed.
- **UI-ADM-02 (Book Inventory Management)**: Searchable data table of all catalog titles with column sorting, stock indicators (`availableCopies / totalCopies`), "Add Book" modal, "Edit Metadata" modal, and "Deactivate" action.
- **UI-ADM-03 (User Account Management)**: Administrative patron roster with search, active loan counters, and "Suspend / Activate" toggle buttons.
- **UI-ADM-04 (Circulation & Audit Console)**: Real-time global view of all library borrowings with status filters, administrative return buttons, and an append-only audit log table.

### 19.4 General UI State Standards
- **Loading States**: Display skeleton shimmer loaders during data fetching (no blank screens or abrupt layout shifts).
- **Empty States**: Present informative empty state cards when queries return zero results.
- **Error States**: Display clear toast notifications for network failures with a "Retry" option.

---

## 20. Edge Cases

| Edge Case ID | Scenario | Required System Behavior |
|---|---|---|
| **EC-01** | Simultaneous borrow on final available copy | The system maintains inventory consistency: the first transaction succeeds; the second safely fails and informs the patron the book is out of stock. |
| **EC-02** | Patron attempts to borrow 6th book | System verifies `activeBorrowCount < 5`, rejects checkout, and displays quota limit notice. |
| **EC-03** | Patron attempts to borrow duplicate copy of currently held book | System detects active loan for same book and rejects checkout. |
| **EC-04** | Return of already-returned book | System verifies active status; rejects duplicate return safely. |
| **EC-05** | Suspended patron attempts borrowing | System checks patron status prior to circulation mutations and rejects with suspension notice. |
| **EC-06** | Admin attempts to deactivate book with active loans | System checks active loan count for title; blocks deactivation if active loans exist. |
| **EC-07** | Admin attempts to reduce total copies below active loans | System validates `newTotalCopies >= (totalCopies - availableCopies)`; rejects illegal copy reduction. |
| **EC-08** | Client presents expired access token | Client automatically invokes session renewal silently and retries original call transparently. |
| **EC-09** | Client presents already-consumed refresh token | Intrusion detection triggers: system revokes all refresh tokens in that family, terminating all active sessions. |
| **EC-10** | System connectivity fault during checkout | System safely aborts transaction; no stock decremented; user prompted to retry. |

---

## 21. Confirmed Version 1 Business Rules

The following business rules are formally confirmed and locked for Version 1:

- **BR-001 (Active Loan Limit)**: A patron may have a maximum of 5 active book loans simultaneously.
- **BR-002 (Standard Loan Duration)**: The standard borrowing period is exactly 14 calendar days from checkout.
- **BR-003 (Unavailable Titles)**: Out-of-stock titles (`availableCopies == 0`) cannot be borrowed under any circumstances.
- **BR-004 (Book Reservations Excluded)**: Book reservations, holds, and waitlists are excluded from Version 1.
- **BR-005 (Loan Renewals Excluded)**: Loan renewals are excluded from Version 1; a patron must return a book before borrowing it again.
- **BR-006 (Overdue Tracking Without Fines)**: Overdue status tracking is included purely as an operational condition; automated financial fine calculations and payment gateways are excluded from Version 1.
- **BR-007 (Lost or Damaged Book Charges Excluded)**: Financial charges and replacement fees for lost or damaged books are excluded from Version 1.
- **BR-008 (Notifications Excluded)**: Automated external email and SMS notifications (AWS SES/Twilio) are excluded from Version 1; notifications are confined to in-app UI alerts.
- **BR-009 (Hardware Integrations Excluded)**: Physical barcode and RFID scanner integrations are excluded from Version 1.
- **BR-010 (Authenticated Password Change)**: Authenticated users may change their password securely; unauthenticated forgot-password email workflows are excluded from Version 1 as future enhancements.
- **BR-011 (Self-Service Account Deletion Excluded)**: Self-service patron account deletion is excluded from Version 1; patron account status is managed by administrators to preserve historical loan and audit records.
- **BR-012 (Administrative Patron Management)**: Administrators may suspend or reactivate patron accounts; administrators cannot suspend their own active account.
- **BR-013 (Administrative Return on Behalf of Patron)**: An authorized administrator may process a book return on behalf of a patron when required.
- **BR-014 (Append-Only Audit Logging)**: The system shall maintain append-only audit records for critical administrative actions (book creation, modification, deactivation, user status changes, return overrides) and security-sensitive events.
- **BR-015 (ISBN Uniqueness)**: ISBNs must be globally unique within the catalog.
- **BR-016 (Copy Reduction Bound)**: Total copies cannot be reduced below the number of currently checked-out volumes.

---

## 22. Assumptions & Resolved Stakeholder Decisions

### 22.1 Formally Resolved Stakeholder Decisions
The four open decisions inherited from Phase 0 are formally resolved and locked into confirmed business rules:

| Decision ID | Topic | Resolution Status | Confirmed Policy & Rule Reference |
|---|---|---|---|
| **DEC-01** | Active Loan Limit | **RESOLVED & LOCKED** | Maximum 5 active book loans per patron (BR-001). |
| **DEC-02** | Loan Duration | **RESOLVED & LOCKED** | Standard loan duration is 14 calendar days (BR-002). |
| **DEC-03** | Loan Renewal Policy | **RESOLVED & LOCKED** | Loan renewals are excluded from Version 1; return required prior to re-borrowing (BR-005). |
| **DEC-04** | Patron Account Deletion | **RESOLVED & LOCKED** | Self-service deletion is excluded from V1; status managed by administrators (BR-011). |

### 22.2 Genuine System Assumptions
The remaining system assumptions are documented below:

| Assumption ID | Description | Impact | Recommended Policy |
|---|---|---|---|
| **ASM-01** | Web-Only Patron Access: Patrons access the system exclusively via modern desktop and mobile web browsers complying with ECMAScript 2020+. | Eliminates requirements for native mobile or legacy browser polyfills. | **Approved Baseline.** |
| **ASM-02** | Single-Library Physical Scope: The system manages inventory for a single library facility with localized aisles and shelves. | Multi-branch routing and inter-library loan logistics are excluded from V1. | **Approved Baseline.** |
| **ASM-03** | Human-Readable Physical Shelving: Physical shelf mapping via text coordinates (`aisle`, `shelf`) is sufficient without Dewey Decimal or barcode hardware. | Simplifies metadata schema and avoids external hardware drivers. | **Approved Baseline.** |

---

## 23. Technical Decisions Deferred to Later Phases

In strict accordance with Phase 1 governance, the following technical and implementation decisions are explicitly deferred to downstream architecture and design phases:

```
+-----------------------------------------------------------------------------+
|               TECHNICAL DECISIONS DEFERRED TO DOWNSTREAM PHASES             |
+-----------------------------------------------------------------------------+
| Technical Decision                  | Target Downstream Phase               |
+-------------------------------------+---------------------------------------+
| Component Interaction Diagrams      | Phase 2 – Detailed System Design      |
| State Machine Models (Loan/Book)    | Phase 2 – Detailed System Design      |
| Database Schemas & Field Data Types | Phase 3 – Database Architecture       |
| MongoDB Compound & Text Indexes     | Phase 3 – Database Architecture       |
| Concurrency & Transaction Mechanisms| Phase 3 & Phase 4 (DAL / Services)    |
| Specific Password Hashing Library   | Phase 6 – Security Architecture       |
| Specific Validation Library (Zod)   | Phase 4 – Backend Architecture        |
| Specific Security Middlewares       | Phase 4 & Phase 6 (Security Arch)     |
| Detailed REST API Enpoints & DTOs   | Phase 4 – Backend Architecture        |
| Component Hierarchy & Design Tokens | Phase 5 – Frontend Architecture       |
| Dockerfile Multi-Stage Optimization | Phase 8 – Containerization Design     |
| AWS VPC CIDRs, Subnets & Terraform  | Phase 9 – AWS Infrastructure Arch     |
| Kubernetes Manifests, HPA & ALB Ing.| Phase 10 – Kubernetes & EKS Arch      |
| CI/CD GitHub Actions Workflow YAML  | Phase 11 – CI/CD Architecture         |
| CloudWatch Metric Alarms & Logging  | Phase 12 – Observability & Scale      |
| Test Suites (Jest, Playwright, k6)  | Phase 13 – Testing Strategy           |
| Source Code Implementation          | Phase 14 – Implementation (STRICT)    |
+-------------------------------------+---------------------------------------+
```

---

## 24. Dependencies & Risks

### 24.1 Dependencies
- **Phase 0 Baseline**: Conforms strictly to Phase 0 Master Project Architecture Document (v1.1.0).
- **Phase Gate Dependency**: Formal sign-off on Phase 1 SRS is required before commencing **Phase 2: Detailed System Design**.

### 24.2 Risk Management Matrix

| Risk ID | Description | Severity | Likelihood | Mitigation Strategy in SRS |
|---|---|---|---|---|
| **RSK-REQ-01** | **Scope Creep (Fines / Payments)**: Stakeholders requesting automated payment gateways midway through development. | High | Low | Section 3 explicitly locks financial tracking as Category C (Future Enhancement). Mid-project additions require formal project reset. |
| **RSK-REQ-02** | **Hardware Dependency Creep**: Expectations for physical barcode scanner drivers or RFID readers. | Medium | Low | Section 10 formally excludes dedicated hardware integrations from the web application scope. |
| **RSK-REQ-03** | **Concurrent Inventory Depletion**: Simultaneous checkout of the last copy causing negative stock counts. | High | Medium | FR-BORROW-001 mandates transactional consistency, rejecting conflicting requests when stock is depleted. |
| **RSK-REQ-04** | **Session Hijacking**: Interception of long-lived session credentials. | High | Medium | Section 11 specifies token family rotation and immediate invalidation of the entire session family upon replay detection. |
| **RSK-REQ-05** | **Historical Record Destruction**: Accidental deletion of borrowing records upon patron account termination. | High | Low | DEC-04 prohibits self-service patron deletion; status is managed by administrators without deleting historical records. |

---

## 25. Requirements Traceability Matrix

| Business Objective | Functional Requirement | User Story | Use Case | Target Architecture Phase |
|---|---|---|---|---|
| **Secure Patron Access** | FR-AUTH-001 (Registration)<br/>FR-AUTH-002 (Login)<br/>FR-AUTH-003 (Logout)<br/>FR-AUTH-004 (Refresh) | US-01<br/>US-02 | UC-01<br/>UC-02<br/>UC-03 | **Phase 4** (Backend Auth)<br/>**Phase 6** (Security Arch) |
| **Password Management** | FR-USER-002 (Auth Password Change) | US-03 | UC-02 | **Phase 4** (User Service)<br/>**Phase 6** (Security Arch) |
| **Digital Catalog Discovery** | FR-BOOK-001 (Search)<br/>FR-BOOK-002 (Filter)<br/>FR-BOOK-003 (Details)<br/>FR-BOOK-004 (Stock) | US-04<br/>US-05 | UC-04<br/>UC-05 | **Phase 3** (Database Indexes)<br/>**Phase 5** (Frontend UI) |
| **Transactional Circulation** | FR-BORROW-001 (Borrow)<br/>FR-BORROW-002 (Return) | US-06<br/>US-07 | UC-06<br/>UC-07 | **Phase 3** (Transactions)<br/>**Phase 4** (Circulation Logic) |
| **Patron Loan Transparency** | FR-BORROW-003 (Active Loans)<br/>FR-BORROW-004 (History) | US-08<br/>US-09 | UC-08 | **Phase 5** (Patron Views)<br/>**Phase 4** (Loan API) |
| **Inventory Governance** | FR-ADMIN-002 (Create Book)<br/>FR-ADMIN-003 (Edit Book)<br/>FR-ADMIN-004 (Deactivate Book) | US-11<br/>US-12<br/>US-13 | UC-09<br/>UC-10<br/>UC-11 | **Phase 3** (Book Schema)<br/>**Phase 4** (Admin Book API) |
| **Patron Account Oversight** | FR-ADMIN-005 (User Management) | US-14 | UC-12 | **Phase 4** (User Service)<br/>**Phase 6** (RBAC Enforcement) |
| **Staff Return Processing** | FR-ADMIN-007 (Return on Behalf) | US-15 | UC-13 | **Phase 4** (Circulation API) |
| **Operational Visibility** | FR-ADMIN-001 (Dashboard KPIs)<br/>FR-ADMIN-006 (Global Loans)<br/>FR-ADMIN-008 (Audit Logs) | US-10<br/>US-16 | UC-13 | **Phase 4** (Metrics/Audit API)<br/>**Phase 12** (Observability) |

---

## 26. Acceptance and Approval Criteria

### 26.1 Conditions for Formal Baseline Locking
This Software Requirements Specification (Version 1.1.0) is formally locked when:
1. All functional requirements are articulated in implementation-independent language.
2. Stakeholder decisions DEC-01 through DEC-04 are formally locked into confirmed business rules.
3. Scope boundaries strictly segregating Mandatory V1 features from Future Enhancements are approved.
4. Technical decisions (libraries, schemas, middleware, manifests) are explicitly deferred to downstream phases.
5. Zero application code, database schemas, Dockerfiles, or cloud infrastructure scripts have been created during this phase.
6. Traceability from business objectives to future architecture phases is fully established.

---
*End of Software Requirements Specification (Version 1.1.0). Phase 1 requirements baseline is complete, internally consistent, and locked pending formal stakeholder sign-off to begin Phase 2 (Detailed System Design).*
