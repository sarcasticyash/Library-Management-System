# 09 - AWS Infrastructure Architecture

[![AWS Architecture Spec](https://img.shields.io/badge/AWS_Infrastructure-v1.0.0_(Locked_and_Approved)-green)](AWS_INFRASTRUCTURE_ARCHITECTURE.md)
[![Current Phase](https://img.shields.io/badge/Current_Phase-Phase_9:_AWS_Infrastructure-green)](AWS_INFRASTRUCTURE_ARCHITECTURE.md)
[![Implementation Gate](https://img.shields.io/badge/Implementation-Gated_Until_Phase_14-red)](../../README.md#-lifecycle-governance--15-phase-roadmap)

---

## Overview
This directory contains the authoritative **AWS Cloud Infrastructure Architecture** for the **Cloud-Native Library Management System (LMS)**.

Phase 9 defines the enterprise-grade cloud topology, networking segmentation, container orchestration, managed database connectivity, ingress routing, secrets management, and observability frameworks governing how future implementation will be hosted on Amazon Web Services (AWS) and MongoDB Atlas.

In strict adherence to software lifecycle governance, **Phase 9 is an architectural design and specification phase only. Zero executable infrastructure files (`.tf`, `.yaml`, `.yml`), Kubernetes manifests, Helm charts, Dockerfiles, application source code, or physical AWS resources have been created or provisioned.**

👉 **[Read the Full AWS Infrastructure Architecture Specification](AWS_INFRASTRUCTURE_ARCHITECTURE.md)**

---

## Core Cloud Infrastructure Pillars

### 1. Dual Infrastructure Profiles
- **Profile A (Production Reference Architecture)**: Multi-AZ (3 AZs), multi-replica, 3x Managed NAT Gateways, MongoDB Atlas Dedicated (M10+) with private VPC Peering, multi-AZ Application Load Balancer, and 99.9% uptime target.
- **Profile B (Cost-Optimized Student Architecture)**: 2 AZs, 1 Managed NAT Gateway, 2x small EC2 worker nodes (`t3.medium` or `t4g.medium`), MongoDB Atlas M0 Free Tier with strict NAT Elastic IP allowlisting and TLS 1.3, designed for educational demonstration under a minimal hourly budget ($50–$70/month runtime).
- **Non-Negotiable Security**: Mandatory security controls (TLS 1.3, IAM least privilege, IRSA, Secrets Manager, pod security standards, private application subnets) remain 100% enforced across both profiles.

### 2. Robust Network Topology (VPC Architecture)
- **VPC CIDR `10.0.0.0/16`**: Formally partitioned across Availability Zones into Public Subnets (ALB, NAT Gateways), Private Application Subnets (EKS worker nodes and application pods), and Database Reserved space.
- **Strict Ingress Isolation**: Worker nodes and application pods have zero public IP addresses and cannot receive untrusted traffic directly from the internet.

### 3. Container Orchestration via Amazon EKS
- **Managed Control Plane**: Kubernetes 1.30+ managed across 3 AZs.
- **Fine-Grained Pod Identity (IRSA)**: Eliminates static AWS credentials inside containers by binding Kubernetes ServiceAccounts to IAM roles via EKS OIDC.
- **Pod Security Standards**: Enforces `restricted` profile (`runAsNonRoot`, read-only root filesystems, dropped Linux capabilities).

### 4. Application Load Balancer (ALB) & Canonical Namespace
- **Path Routing Preserving Phase 4**: Routes `/api/v1/*` to backend Express API services, `/api/v1/health` to health checks, and default `/*` to frontend static delivery.
- **Edge TLS Termination**: Automated TLS 1.3 termination via AWS Certificate Manager (ACM) with automatic HTTP-to-HTTPS 301 redirection.

### 5. Managed Database Connectivity (MongoDB Atlas)
- **Profile A**: Private AWS VPC Peering (`192.168.0.0/21` $\leftrightarrow$ `10.0.0.0/16`) ensuring database traffic never traverses the public internet.
- **Profile B**: Public egress via NAT Gateway Elastic IP strictly authorized on the Atlas Network Access List, encrypted with mandatory TLS 1.3.

### 6. Cloud Observability & Security Governance
- **Centralized CloudWatch Logs**: Control plane logs, container application stdout/stderr, and ALB access logs.
- **Automated Data Redaction**: Mandatory application-level scrubbing of passwords, authorization headers, and tokens before emission to CloudWatch.
- **STRIDE Mitigation Matrix**: Full infrastructure-level countermeasures addressing all 6 STRIDE threat categories.

---

## Documents in This Section
- **[`AWS_INFRASTRUCTURE_ARCHITECTURE.md`](AWS_INFRASTRUCTURE_ARCHITECTURE.md)**: Primary Authoritative Specification (23 sections, 8 ADRs, 7 Mermaid architecture diagrams, and cross-phase traceability matrices).

---

## Phase Status Summary
```text
CURRENT STATUS: PERMANENTLY BASELINE LOCKED AND APPROVED
UPSTREAM PHASES 0-8: PERMANENTLY BASELINE LOCKED AND APPROVED
NEXT PHASE: PHASE 10 — KUBERNETES AND EKS ARCHITECTURE
IMPLEMENTATION STATUS: STRICTLY PROHIBITED (GATED UNTIL PHASE 14)
INFRASTRUCTURE PROVISIONING: STRICTLY PROHIBITED (GATED UNTIL PHASE 14)
```
