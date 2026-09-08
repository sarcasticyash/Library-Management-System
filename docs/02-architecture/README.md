# 02 - Architecture & System Design Documentation

[![Architecture Version](https://img.shields.io/badge/Master_Architecture-v1.1.0_(Approved)-green)](MASTER_ARCHITECTURE.md)
[![Design Version](https://img.shields.io/badge/Detailed_System_Design-v1.1.0_(Locked_Baseline)-blue)](DETAILED_SYSTEM_DESIGN.md)
[![Current Phase](https://img.shields.io/badge/Current_Phase-Phase_2:_Detailed_System_Design-orange)](DETAILED_SYSTEM_DESIGN.md)
[![Implementation Gate](https://img.shields.io/badge/Implementation-Gated_Until_Phase_14-red)](../../README.md#-lifecycle-governance--15-phase-roadmap)

---

## Overview
This directory contains the authoritative architecture blueprints and system interaction models for the **Cloud-Native Library Management System (LMS)**.

These documents bridge the gap between business requirements and technical implementation, serving as the design foundation for downstream database, backend, frontend, security, and infrastructure phases.

In strict compliance with lifecycle governance, **zero implementation code, database schemas, Dockerfiles, or Kubernetes manifests have been created.**

---

## Documents in This Section

### 1. [`MASTER_ARCHITECTURE.md`](MASTER_ARCHITECTURE.md) (Phase 0 Baseline)
- **Status**: Formally Approved Baseline (Version 1.1.0)
- **Purpose**: Establishes global system principles, three-tier cloud-native architecture, dual deployment profiles (**Profile A: Production Reference** vs. **Profile B: Cost-Optimized Student Deployment**), technology justification, risk analysis, and the 15-phase engineering roadmap.

### 2. [`DETAILED_SYSTEM_DESIGN.md`](DETAILED_SYSTEM_DESIGN.md) (Phase 2 Deliverable)
- **Status**: Formally Locked Baseline (Version 1.1.0)
- **Purpose**: Translates approved requirements into an implementation-independent system interaction model.
- **Key Contents**:
  - **Component Model**: Client layer, frontend delivery component, backend application gateway, modular backend subsystems (Auth, Authorization, Catalog, Circulation, Users, Audit), persistence layer, and platform services.
  - **Verified Diagram Inventory**: Exactly 12 formal Mermaid design diagrams (C4 Context, Runtime Interaction, Request Lifecycle, Registration, Login/Renewal, Authorization Flow, Catalog/Admin Creation, Borrowing Activity Flow, Return Sequence, Circulation State Machine, Error Propagation, and Data Flow).
  - **Component Responsibility Matrix**: Clear separation of concerns with inputs, outputs, upstream callers, downstream callees, and failure impacts.
  - **Circulation State Machine**: Formal state transitions using standardized terminology (`ACTIVE`, `OVERDUE`, `RETURNED`).
  - **Circulation Consistency Design**: Enforces that available copies cannot become negative, borrowing cannot exceed stock, loans cap at 5, and duplicate records/returns are prevented, delegating persistence mechanisms to Phase 3 and enforcement to Phase 4.
  - **Trust Boundaries**: 5-layer trust boundary map from untrusted browser runtimes to restricted administrative privilege zones.
  - **Technical Decisions Deferred**: Explicit mapping of concrete implementation concerns (schemas, HTTP status codes, RFC error envelopes, container base images, Kubernetes manifests) to downstream phases (Phases 3 through 13).
  - **Requirements Traceability Matrix**: Complete bidirectional mapping from every Phase 1 requirement to design components and downstream phases.

---

## Next Steps
Following formal stakeholder review and approval of Phase 2 (Detailed System Design), the project will proceed sequentially to **Phase 3: Database Architecture**.
