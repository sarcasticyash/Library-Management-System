# Project Automation & Developer Scripts

## Overview
This directory houses project-level developer tooling, seed data scripts, database migration runners, and local environment initialization helpers.

## Scripts (Stage Verification)
- `test-stage1-regression.ts`: Foundation infrastructure & health check verification.
- `test-stage2.ts`: Domain models, shared types, Zod schemas, and service contracts.
- `test-stage3.ts`: MongoDB persistence, collections, indexes, and repository layer.
- `test-stage4.ts`: Authentication, RBAC, business services, and security controls.
- `test-stage5.ts`: Full API delivery layer (21 canonical REST endpoints) over HTTP loopback.
- `test-stage8.ts`: Frontend feature integration, end-to-end API client verification, dual-token security, and silent 401 refresh rotation.
- `test-stage9.ts`: Production readiness, containerization, Docker Compose, production hardening, CI/CD pipeline, and DevOps verification.
- `test-stage10.ts`: Master runner orchestrating all Stage 10 production validation quality gates.
- `test-stage10-security.ts`: 14 automated security attack and control vectors (auth bypass, RBAC, JWT tampering, rate limiting, etc.).
- `test-stage10-performance.ts`: API load test benchmark across 5 core endpoints (latency p50/p95/p99, throughput, 0% error rate).
- `test-stage10-accessibility.ts`: WCAG 2.2 AA audit (focus visible, skip links, ARIA semantics, color contrast).
- `test-stage10-e2e.ts`: 18-step multi-role full lifecycle journey (9-step Patron journey + 9-step Administrator journey).

## Scripts (Planned / Utility)
- `dev-setup.sh` / `dev-setup.ps1`: One-command bootstrap for local development prerequisites.
- `seed-database.ts`: Generates initial mock library data.
- `verify-env.sh`: Validates required environment variables and connectivity.
