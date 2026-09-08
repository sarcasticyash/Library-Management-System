# 12 - Monitoring, Logging and Scalability Architecture

[![Observability Spec Version](https://img.shields.io/badge/Observability_Architecture-v1.0.0_(Locked_and_Approved)-green)](MONITORING_LOGGING_SCALABILITY_ARCHITECTURE.md)
[![Current Phase](https://img.shields.io/badge/Current_Phase-Phase_12:_Monitoring_&_Scalability-green)](MONITORING_LOGGING_SCALABILITY_ARCHITECTURE.md)
[![Implementation Gate](https://img.shields.io/badge/Implementation-Gated_Until_Phase_14-red)](../../README.md#-lifecycle-governance--15-phase-roadmap)

---

## Overview
This directory contains the authoritative **Monitoring, Logging and Scalability Architecture** for the **Cloud-Native Library Management System (LMS)**.

Phase 12 defines the complete full-stack observability model, structured JSON logging schemas, automated sensitive data redaction, multi-layer metrics architecture, OpenTelemetry distributed tracing with AWS X-Ray interoperability, SLI/SLO and Error Budget governance, multi-tier alerting (SEV-1 through SEV-4), incident response lifecycles, and end-to-end capacity and scalability modeling across Amazon EKS and MongoDB Atlas.

In strict adherence to software lifecycle governance, **Phase 12 is an architectural specification phase only. Zero deployable Prometheus configurations, Grafana dashboard JSON files, OpenTelemetry code instrumentation, Fluent Bit configurations, CloudWatch alarms, or shell deployment scripts have been created.**

👉 **[Read the Full Monitoring, Logging & Scalability Architecture Specification](MONITORING_LOGGING_SCALABILITY_ARCHITECTURE.md)**

---

## Core Observability Pillars

### 1. Unified Telemetry Model
- **Three Core Pillars**: Metrics, structured logs, and distributed traces correlated via W3C `traceId`, `spanId`, user-safe `correlationId`, and Phase 11 container `imageDigest`.
- **Zero Sensitive Data Disclosures**: Multi-tiered regex scrubbing at application and Fluent Bit collector layers guarantees that passwords, JWT tokens, session cookies, and database credentials never reach CloudWatch.

### 2. Centralized Logging & Retention
- **Log Groups Topology**: Segmented across application containers (`/aws/containerinsights/.../application`), EKS control-plane, and ALB access logs.
- **Dual-Profile Retention**: 30 days active + 365 days Glacier archive in Profile A (Production Reference); 7 days active retention in Profile B (Cost-Optimized Student).

### 3. OpenTelemetry Distributed Tracing & AWS X-Ray
- **End-to-End Tracing**: W3C trace propagation from ALB ingress through backend Express services down to MongoDB Atlas query execution.
- **Critical Operation Profiling**: Explicit trace budgets validating Phase 1 P95 latency requirements ($< 150\text{ms}$ catalog, $< 250\text{ms}$ checkout).

### 4. Mathematical Scalability & Connection Modeling
- **Coordinated Elasticity**: Horizontal Pod Autoscaling (HPA v2 on CPU 70% / Memory 80%) coupled with EKS Cluster Autoscaler.
- **Atlas Connection Protection**: Governs Mongoose connection pools (`maxPoolSize: 20`), mathematically proving that peak 12-pod scale consumes only 250 connections (safe within Atlas M10 and M0 limits).

### 5. Multi-Tier Alerting & Incident Response
- **4-Tier Taxonomy**: Critical (SEV-1), High (SEV-2), Warning (SEV-3), and Informational (SEV-4) routing to PagerDuty/SMS and Slack.
- **Standardized Incident Flow**: Detection $\rightarrow$ Triage $\rightarrow$ Automated Rollback / Scaling $\rightarrow$ Recovery $\rightarrow$ Post-Mortem.

---

## Documents in This Section
- **[`MONITORING_LOGGING_SCALABILITY_ARCHITECTURE.md`](MONITORING_LOGGING_SCALABILITY_ARCHITECTURE.md)**: Primary Authoritative Specification (37 sections, 10 ADRs, 10 Mermaid architecture diagrams, and cross-phase traceability matrices).

---

## Phase Status Summary
```text
CURRENT STATUS: PERMANENTLY BASELINE LOCKED AND APPROVED
UPSTREAM PHASES 0-11: PERMANENTLY BASELINE LOCKED AND APPROVED
NEXT PHASE: PHASE 13 — SECURITY, GOVERNANCE AND FINAL ARCHITECTURE CONSOLIDATION
IMPLEMENTATION STATUS: STRICTLY PROHIBITED (GATED UNTIL PHASE 14)
MONITORING DEPLOYMENT: STRICTLY PROHIBITED (GATED UNTIL PHASE 14)
```
