# 10 - Kubernetes & EKS Architecture

[![Kubernetes Spec](https://img.shields.io/badge/Kubernetes_Architecture-v1.0.0_(Locked_and_Approved)-green)](KUBERNETES_EKS_ARCHITECTURE.md)
[![Current Phase](https://img.shields.io/badge/Current_Phase-Phase_10:_Kubernetes_&_EKS-green)](KUBERNETES_EKS_ARCHITECTURE.md)
[![Implementation Gate](https://img.shields.io/badge/Implementation-Gated_Until_Phase_14-red)](../../README.md#-lifecycle-governance--15-phase-roadmap)

---

## Overview
This directory contains the authoritative **Kubernetes and EKS Architecture** for the **Cloud-Native Library Management System (LMS)**.

Phase 10 defines the complete container orchestration model, declarative workload blueprints, service topologies, AWS Application Load Balancer ingress routing, Pod Security Standards, network isolation policies, Secrets Store CSI Driver integration, and Kustomize multi-environment blueprints governing how future implementation will be orchestrated on Amazon Elastic Kubernetes Service (EKS v1.30+).

In strict adherence to software lifecycle governance, **Phase 10 is an architectural specification phase only. Zero deployable Kubernetes manifests (`.yaml`, `.yml`), Helm charts, Kustomize overlay implementations, Dockerfiles, application source code, or cluster modifications have been created.**

👉 **[Read the Full Kubernetes & EKS Architecture Specification](KUBERNETES_EKS_ARCHITECTURE.md)**

---

## Core Kubernetes Architecture Pillars

### 1. Dual Profile Workload Sizing
- **Profile A (Production Reference Architecture)**: Multi-AZ across 3 Availability Zones, 3 to 12 backend replicas with Horizontal Pod Autoscaling (HPA v2), strict PodDisruptionBudgets (`minAvailable: 2`), hard ResourceQuotas (16 CPU Cores / 32 GiB RAM), and pod anti-affinity.
- **Profile B (Cost-Optimized Student Architecture)**: 2 Availability Zones, 2 backend replicas (max 3), `minAvailable: 1`, cost-constrained ResourceQuotas (3 CPU Cores / 6 GiB RAM), designed to operate within 2 small EC2 worker nodes (`t3.medium` or `t4g.medium`).

### 2. Canonical Routing & Ingress Architecture
- **AWS Load Balancer Controller Ingress**: Deploys an internet-facing Application Load Balancer with IP-mode target group binding directly to Pod ENIs, eliminating NodePort NAT latency.
- **Phase 4 Canonical Namespace Preservation**: Immutably routes `/api/v1/*` to `lms-backend-service` and default `/*` to `lms-frontend-service`. Generic `:id` path parameters remain strictly prohibited across all 21 approved endpoints.

### 3. Workload Topology & Isolation
- **Stateless Modular Compute**: Exactly two containerized workloads: `lms-backend` (Node.js 20 LTS Express API) and `lms-frontend` (React 18+ static SPA on NGINX). Zero unauthorized microservices introduced.
- **Namespace Hierarchy**: Hard logical separation across `kube-system` (controllers), `lms-core` (application workloads), and `lms-monitoring` (telemetry agents).

### 4. Zero-Trust Security & Pod Hardening
- **Pod Security Standards (`restricted`)**: Enforces non-root execution (`runAsNonRoot: true`), read-only root filesystems (`readOnlyRootFilesystem: true`), dropped Linux capabilities (`drop: ["ALL"]`), and default seccomp profiles.
- **Default-Deny NetworkPolicies**: Blocks unauthorized pod-to-pod east-west traffic; permits ingress strictly from the ALB and egress strictly to CoreDNS, MongoDB Atlas, and AWS STS/Secrets Manager.

### 5. Secrets Management via Secrets Store CSI Driver
- **Zero Static Credentials**: Workloads authenticate to AWS using IAM Roles for Service Accounts (IRSA) via EKS OIDC federation.
- **In-Memory Mounting**: Secrets Store CSI Driver retrieves database connection URIs, JWT signing secrets, and session keys dynamically from AWS Secrets Manager, mounting them as ephemeral `tmpfs` in-memory volumes at `/mnt/secrets-store`.

### 6. Observability & Zero-Downtime Operations
- **Rolling Update Strategy**: Configured with `maxSurge: 25%` and `maxUnavailable: 0` alongside dedicated startup, liveness, and readiness health probes.
- **CloudWatch Integration**: Structured JSON logging to stdout automatically scrubbed of sensitive data and shipped to CloudWatch Logs via ADOT / Fluent Bit.

---

## Documents in This Section
- **[`KUBERNETES_EKS_ARCHITECTURE.md`](KUBERNETES_EKS_ARCHITECTURE.md)**: Primary Authoritative Specification (55 sections, 10 ADRs, 10 Mermaid architecture diagrams, and cross-phase traceability matrices).

---

## Phase Status Summary
```text
CURRENT STATUS: PERMANENTLY BASELINE LOCKED AND APPROVED
UPSTREAM PHASES 0-9: PERMANENTLY BASELINE LOCKED AND APPROVED
NEXT PHASE: PHASE 11 — CI/CD ARCHITECTURE
IMPLEMENTATION STATUS: STRICTLY PROHIBITED (GATED UNTIL PHASE 14)
MANIFEST IMPLEMENTATION: STRICTLY PROHIBITED (GATED UNTIL PHASE 14)
```
