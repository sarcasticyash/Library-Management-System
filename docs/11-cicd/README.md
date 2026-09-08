# 11 - CI/CD Architecture

[![CI/CD Spec Version](https://img.shields.io/badge/CI%2FCD_Architecture-v1.0.0_(Locked_and_Approved)-green)](CICD_ARCHITECTURE.md)
[![Current Phase](https://img.shields.io/badge/Current_Phase-Phase_11:_CI%2FCD_Architecture-green)](CICD_ARCHITECTURE.md)
[![Implementation Gate](https://img.shields.io/badge/Implementation-Gated_Until_Phase_14-red)](../../README.md#-lifecycle-governance--15-phase-roadmap)

---

## Overview
This directory contains the authoritative **Continuous Integration and Continuous Deployment (CI/CD) Architecture** for the **Cloud-Native Library Management System (LMS)**.

Phase 11 defines the complete automated software delivery lifecycle, path-aware monorepo pipeline triggering, GitHub Actions OIDC federation with AWS, 8-stage quality gates, DevSecOps security scanning, immutable Amazon ECR image pipelines, SLSA Level 3 supply chain security, and GitOps continuous delivery via Argo CD across Development, Staging, and Production environments.

In strict adherence to software lifecycle governance, **Phase 11 is an architectural specification phase only. Zero deployable GitHub Actions workflow files (`.github/workflows/*.yml`), executable shell scripts, Dockerfiles, application code, or actual container pushes have been created or executed.**

👉 **[Read the Full CI/CD Architecture Specification](CICD_ARCHITECTURE.md)**

---

## Core CI/CD Architecture Pillars

### 1. Zero Static AWS Credentials via GitHub OIDC
- **Cryptographic Trust Federation**: GitHub Actions runners authenticate to AWS Security Token Service (STS) using short-lived OpenID Connect (OIDC) JWT tokens.
- **Strict Prohibition**: Storing `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` in GitHub Secrets is strictly forbidden. Temporary STS credentials expire automatically within 15–60 minutes.

### 2. Path-Aware Monorepo Pipelines
- **Targeted Triggering**: Pull requests and commits automatically trigger only relevant pipeline stages (`apps/backend/**`, `apps/frontend/**`, `infrastructure/**`, `docs/**`), reducing build execution times by 60% while ensuring shared changes trigger full regression sweeps.

### 3. 8-Stage Continuous Integration Quality Gates
- **Comprehensive Verification**: Stages 1 through 8 directly implement the Phase 8 testing pyramid:
  - Repository Integrity & Dependency Validation (Frozen lockfiles).
  - Static Code Analysis (Strict TypeScript `noImplicitAny`, ESLint zero-warnings).
  - Unit Testing & Coverage Enforcement ($\ge 85\%$ branch coverage baseline).
  - Integration Testing with real containerized MongoDB replica sets via Testcontainers.
  - End-to-End Playwright testing across 4 critical user journeys.
  - Automated k6 performance latency gates (Catalog P95 $< 150\text{ms}$, Checkout P95 $< 250\text{ms}$).

### 4. DevSecOps Security & Supply Chain Defense
- **Automated Security Gates**: Integrated SAST (GitHub CodeQL), secret detection (TruffleHog), SCA (Trivy/Dependabot), and container vulnerability scanning.
- **SLSA Level 3 Compliance**: Cryptographic container image signing using Sigstore Cosign, in-toto build provenance attestations, and automated CycloneDX SBOM generation.

### 5. Single-Artifact Promotion & GitOps Delivery
- **Build Once, Promote Everywhere**: Container images are built exactly once, tagged immutably, and promoted across Dev, Staging, and Prod by referencing their immutable digest (`sha256:...`). Rebuilding images per environment is barred.
- **Declarative GitOps (Argo CD)**: Deployment state is maintained in a decoupled repository (`lms-gitops-manifests`), continuously reconciled into Amazon EKS with automated drift detection.

### 6. Deterministic Rollback Architecture
- **Instantaneous Reversion**: Deployment failures or latency regressions trigger immediate rollback to a previously verified immutable container digest via GitOps commit revert or `kubectl rollout undo` ($< 10\text{ seconds}$). Rebuilding older code during an incident is strictly prohibited.

---

## Documents in This Section
- **[`CICD_ARCHITECTURE.md`](CICD_ARCHITECTURE.md)**: Primary Authoritative Specification (26 sections, 10 ADRs, 10 Mermaid architecture diagrams, and cross-phase traceability matrices).

---

## Phase Status Summary
```text
CURRENT STATUS: PERMANENTLY BASELINE LOCKED AND APPROVED
UPSTREAM PHASES 0-10: PERMANENTLY BASELINE LOCKED AND APPROVED
NEXT PHASE: PHASE 12 — MONITORING, LOGGING AND SCALABILITY
IMPLEMENTATION STATUS: STRICTLY PROHIBITED (GATED UNTIL PHASE 14)
WORKFLOW IMPLEMENTATION: STRICTLY PROHIBITED (GATED UNTIL PHASE 14)
```
