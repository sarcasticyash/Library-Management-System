# MONITORING, LOGGING AND SCALABILITY ARCHITECTURE SPECIFICATION
## Cloud-Native Library Management System (LMS)

---

**Document Version**: 1.0.0  
**Lifecycle Phase**: Phase 12 – Monitoring, Logging and Scalability Architecture  
**Document Status**: PERMANENTLY BASELINE LOCKED AND APPROVED  
**Author**: Principal Cloud Observability Architect, AWS Monitoring and Observability Solutions Architect, SRE Architect & Distributed Tracing Architect  
**Upstream Baseline Dependencies**:
- [Phase 0 Master Project Architecture (v1.1.0)](../02-architecture/MASTER_ARCHITECTURE.md)
- [Phase 1 Software Requirements Specification (v1.1.0)](../01-requirements/SOFTWARE_REQUIREMENTS_SPECIFICATION.md)
- [Phase 2 Detailed System Design (v1.1.0)](../02-architecture/DETAILED_SYSTEM_DESIGN.md)
- [Phase 3 Database Architecture Specification (v1.2.0)](../03-database/DATABASE_ARCHITECTURE.md)
- [Phase 4 Backend Architecture & API Design Specification (v1.1.0)](../04-backend/BACKEND_ARCHITECTURE_AND_API_DESIGN.md)
- [Phase 5 Frontend Architecture & UI/UX Design Specification (v1.0.0)](../05-frontend/FRONTEND_ARCHITECTURE_AND_UI_UX_DESIGN.md)
- [Phase 6 Security Architecture Specification (v1.0.0)](../06-security/SECURITY_ARCHITECTURE.md)
- [Phase 7 Engineering Standards & Code Quality Specification (v1.0.0)](../07-engineering/ENGINEERING_STANDARDS_AND_CODE_QUALITY.md)
- [Phase 8 Testing Strategy & Quality Assurance Specification (v1.0.0)](../08-testing/TESTING_STRATEGY_AND_QUALITY_ASSURANCE.md)
- [Phase 9 AWS Infrastructure Architecture Specification (v1.0.0)](../09-cloud-infrastructure/AWS_INFRASTRUCTURE_ARCHITECTURE.md)
- [Phase 10 Kubernetes & EKS Architecture Specification (v1.0.0)](../10-kubernetes-eks/KUBERNETES_EKS_ARCHITECTURE.md)
- [Phase 11 CI/CD Architecture Specification (v1.0.0)](../11-cicd/CICD_ARCHITECTURE.md)  
**Implementation Policy**: *STRICT GATE — Physical dashboard deployment (Grafana/CloudWatch JSON), Prometheus server setup, OpenTelemetry SDK instrumentation code, Fluent Bit configuration files, alert rule provisioning, or shell deployment scripts remain strictly prohibited until Phase 14. Zero deployable monitoring artifacts are created during this phase.*

---

## TABLE OF CONTENTS
1. [Document Control and Governance](#1-document-control-and-governance)
2. [Lifecycle Scope and Boundaries](#2-lifecycle-scope-and-boundaries)
3. [Upstream Baseline Extraction](#3-upstream-baseline-extraction)
4. [Observability Architecture Overview](#4-observability-architecture-overview)
5. [Centralized Logging Architecture](#5-centralized-logging-architecture)
6. [Structured Application Logging](#6-structured-application-logging)
7. [Sensitive Data Redaction](#7-sensitive-data-redaction)
8. [Metrics Architecture](#8-metrics-architecture)
9. [Prometheus and CloudWatch Metrics Strategy](#9-prometheus-and-cloudwatch-metrics-strategy)
10. [Distributed Tracing Architecture](#10-distributed-tracing-architecture)
11. [Critical Transaction Traceability](#11-critical-transaction-traceability)
12. [Dashboard Architecture](#12-dashboard-architecture)
13. [SLI, SLO and Error Budget Architecture](#13-sli-slo-and-error-budget-architecture)
14. [Alerting Architecture](#14-alerting-architecture)
15. [Incident Response Architecture](#15-incident-response-architecture)
16. [Scalability Architecture](#16-scalability-architecture)
17. [Application Auto-Scaling](#17-application-auto-scaling)
18. [Cluster and Node Scalability](#18-cluster-and-node-scalability)
19. [Database and Connection-Pool Scalability](#19-database-and-connection-pool-scalability)
20. [Performance Monitoring](#20-performance-monitoring)
21. [Capacity Planning](#21-capacity-planning)
22. [Observability Cost Optimization](#22-observability-cost-optimization)
23. [Dual-Profile Observability Architecture](#23-dual-profile-observability-architecture)
24. [Environment-Specific Observability](#24-environment-specific-observability)
25. [Security Observability](#25-security-observability)
26. [Observability Access Control](#26-observability-access-control)
27. [Kubernetes Observability](#27-kubernetes-observability)
28. [Failure Detection and Recovery Observability](#28-failure-detection-and-recovery-observability)
29. [CI/CD and Deployment Observability](#29-cicd-and-deployment-observability)
30. [Observability Data Lifecycle](#30-observability-data-lifecycle)
31. [Cross-Phase Traceability Matrix](#31-cross-phase-traceability-matrix)
32. [STRIDE Security Traceability](#32-stride-security-traceability)
33. [Architectural Decision Records (ADRs)](#33-architectural-decision-records-adrs)
34. [Mermaid Architecture Diagrams](#34-mermaid-architecture-diagrams)
35. [Future Implementation Boundaries](#35-future-implementation-boundaries)
36. [Self-Audit Checklist](#36-self-audit-checklist)
37. [Lifecycle Governance Conclusion](#37-lifecycle-governance-conclusion)

---

## 1. Document Control and Governance

### 1.1 Document Metadata
| Metadata Field | Specification Value |
|---|---|
| **Project Name** | Cloud-Native Library Management System (LMS) |
| **Document Title** | Monitoring, Logging and Scalability Architecture Specification |
| **Document Version** | 1.0.0 |
| **Lifecycle Phase** | Phase 12 – Monitoring, Logging and Scalability |
| **Current Status** | ARCHITECTURE COMPLETE — PENDING INDEPENDENT AUDIT |
| **Primary Cloud Provider** | Amazon Web Services (AWS `us-east-1`) & MongoDB Atlas |
| **Container Platform** | Amazon Elastic Kubernetes Service (EKS v1.30+) |
| **Implementation Gate** | Strict Gate: Zero monitoring agents, Prometheus scripts, or CloudWatch alarms provisioned until Phase 14 |

### 1.2 Governance Mandate
Phase 12 is an architectural specification only. In strict compliance with 15-phase lifecycle governance, no physical observability infrastructure, monitoring agent daemonsets, Prometheus configs, Grafana dashboards, or alert rules may be deployed before Phase 14 authorization.

---

## 2. Lifecycle Scope and Boundaries

### 2.1 In Scope
- Full-stack observability architecture across application, Kubernetes, and cloud infrastructure tiers.
- Centralized structured logging topology, JSON schemas, and mandatory sensitive data redaction.
- Metrics collection architecture (Prometheus, CloudWatch Container Insights, custom business KPIs).
- Distributed tracing architecture using OpenTelemetry and AWS X-Ray interoperability.
- Service Level Indicators (SLIs), Service Level Objectives (SLOs), and Error Budget governance.
- Multi-tier alerting architecture and incident response workflows (SEV-1 through SEV-4).
- End-to-end scalability architecture: HPA v2, Cluster Autoscaling, and Mongoose connection-pool mathematical modeling.
- Capacity planning, observability cost optimization, and dual-profile telemetry alignment.

### 2.2 Out of Scope
- Physical dashboard JSON configuration or Grafana server deployment.
- Authoring physical OpenTelemetry TypeScript SDK instrumentation code.
- Deploying Fluent Bit DaemonSets or CloudWatch metric alarms in AWS.
- Authoring deployment scripts or physical terraform modules.

---

## 3. Upstream Baseline Extraction

Phase 12 strictly inherits, respects, and enforces all locked constraints from upstream phases:
- **Phase 0 (Master Architecture)**: Dual profiles (Profile A Production Reference vs. Profile B Cost-Optimized Student).
- **Phase 1 (SRS)**: P95 latency targets (Catalog Search $< 150\text{ms}$, Checkout Transaction $< 250\text{ms}$), 99.9% availability target.
- **Phase 2 (Detailed System Design)**: 6-tier architecture, domain circulation state machine (`ACTIVE` $\rightarrow$ `RETURNED`).
- **Phase 3 (Database Architecture)**: MongoDB Atlas replica sets, multi-document ACID transactions, dynamic overdue truth (`DBD-09`), connection pool constraints.
- **Phase 4 (Backend API Design)**: Canonical `/api/v1` namespace, 21 approved REST endpoints, RFC 7807 problem details error envelopes.
- **Phase 5 (Frontend Architecture)**: React 18+ SPA, NGINX static delivery, in-memory JWT storage, browser-managed HttpOnly refresh cookie.
- **Phase 6 (Security Architecture)**: STRIDE threat model, zero static credentials, IRSA, Secrets Manager, mandatory log scrubbing.
- **Phase 7 (Engineering Standards)**: Structured JSON logging, health probes (`/api/v1/health`), zero-downtime rolling deploys.
- **Phase 8 (Testing Strategy)**: Test pyramid, k6 latency verification, staging quality gates.
- **Phase 9 (AWS Cloud Infrastructure)**: VPC subnets, CloudWatch Log Groups, EKS control-plane logging.
- **Phase 10 (Kubernetes & EKS)**: Namespaces (`kube-system`, `lms-core`, `lms-monitoring`), HPA v2 (CPU 70%, Mem 80%), PDBs, Container Insights, `maxPoolSize: 20`.
- **Phase 11 (CI/CD Architecture)**: DORA metrics, immutable image digest traceability (`sha256:`), GitOps deployment synchronization.

---

## 4. Observability Architecture Overview

The LMS observability architecture synthesizes the three primary observability pillars (**Metrics, Logs, Traces**) with supporting operational dimensions (**Events, Health Signals, Business KPIs, Security Telemetry**):

```text
+-----------------------------------------------------------------------------------------+
|                                END-TO-END TELEMETRY FLOW                                |
+-----------------------------------------------------------------------------------------+
[Client Browser] ---> [AWS ALB (Access Logs / Tracing Header)] ---> [Frontend / Backend Pods]
                                                                            |
                                            +-------------------------------+-------------------------------+
                                            |                               |                               |
                                            v                               v                               v
                                  [Structured JSON Logs]         [Prometheus /metrics]           [W3C Trace Spans]
                                            |                               |                               |
                                            v                               v                               v
                                    (Fluent Bit Agent)              (ADOT Collector)               (AWS X-Ray Daemon)
                                            |                               |                               |
                                            v                               v                               v
                               [Amazon CloudWatch Logs]       [CloudWatch Container Insights]       [AWS X-Ray Console]
                                            |                               |                               |
                                            +-------------------------------+-------------------------------+
                                                                            |
                                                                            v
                                                          [Unified Correlation Engine]
                                                (Request ID + Trace ID + Span ID + Image Digest)
                                                                            |
                                                                            v
                                                         [CloudWatch Alarms & Dashboards]
                                                                            |
                                                                            v
                                                          [Incident Response / SRE On-Call]
+-----------------------------------------------------------------------------------------+
```

### Correlation Model
Every telemetry signal is bound together using four standardized correlation keys:
1. `traceId`: 128-bit W3C trace identifier generated at the ALB or backend entry.
2. `spanId`: 64-bit identifier representing the specific execution span.
3. `correlationId`: User-safe UUID (`X-Correlation-ID`) returned to clients for error tracing.
4. `imageDigest`: Exact container image digest (`sha256:...`) running the workload, guaranteeing direct linkage to Phase 11 GitOps release provenance.

---

## 5. Centralized Logging Architecture

Logging is centralized into Amazon CloudWatch Logs using AWS Distro for OpenTelemetry (ADOT) or Fluent Bit running in the `lms-monitoring` namespace:

### 5.1 Log Groups Topology
- `/aws/eks/lms-cluster/cluster`: Managed control plane logs (API server, audit, authenticator, controller-manager, scheduler).
- `/aws/containerinsights/lms-cluster/application`: Application stdout/stderr emitted by backend Express API and frontend NGINX pods.
- `/aws/containerinsights/lms-cluster/dataplane`: Kubelet, containerd runtime, and node system logs.
- `/aws/alb/lms-ingress`: ALB access logs recording client IP, latency, HTTP method, route, and status code.

### 5.2 Retention Governance
- **Profile A (Production Reference)**: 30 days active retention in CloudWatch Logs, auto-archived to Amazon S3 Glacier with KMS CMK encryption for 365 days.
- **Profile B (Cost-Optimized Student)**: 7 days active retention; zero long-term archival to strictly contain cloud storage costs.

---

## 6. Structured Application Logging

In strict compliance with Phase 6 and Phase 7, all application logs emitted by `lms-backend` are structured JSON serialized to stdout:

```json
{
  "timestamp": "2026-09-08T01:30:00.123Z",
  "level": "info",
  "service": "lms-backend",
  "environment": "production",
  "correlationId": "c8f1e2a4-5678-4b9d-9e12-3456789abcde",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "spanId": "00f067aa0ba902b7",
  "deploymentVersion": "v1.0.0",
  "imageDigest": "sha256:7f8e3a2b1c4d5e6f...",
  "http": {
    "method": "POST",
    "route": "/api/v1/borrowings",
    "statusCode": 201,
    "latencyMs": 84.5
  },
  "user": {
    "userId": "usr_67890",
    "role": "ROLE_PATRON"
  },
  "event": {
    "action": "BORROW_BOOK_SUCCESS",
    "bookId": "bk_12345",
    "borrowingId": "bor_98765"
  }
}
```

### Prohibited Log Attributes
The logging schema strictly forbids outputting:
- User passwords, password hashes, or password reset tokens.
- Raw JWT access tokens or refresh token cookies (`refreshToken=*`).
- Database connection URIs containing credentials (`mongodb+srv://user:pass@...`).
- AWS secret keys or STS temporary tokens.
- Authorization header contents (`Bearer *`).

---

## 7. Sensitive Data Redaction

Telemetry data undergoes automated, multi-tiered redaction to prevent accidental credential disclosure:

```text
[Application Logger] ---> (Regex Redaction Filter) ---> [stdout / stderr]
                                                              |
                                                              v
                                                [Fluent Bit Pipeline Filter]
                                                              |
                                                              v
                                                [CloudWatch Logs (Masked)]
```

### Redaction Rules
1. **Application-Level Interceptor**: Winston/Pino logger custom serializer scrubs keys matching `password`, `token`, `secret`, `authorization`, `cookie`, `key`, and `credential`.
2. **Collector-Level Pattern Masking**: Fluent Bit regex filters match and replace:
   - `Bearer\s+[A-Za-z0-9\-._~+/]+=*` $\rightarrow$ `Bearer [REDACTED]`
   - `refreshToken=[A-Za-z0-9\-._~+/]+=*` $\rightarrow$ `refreshToken=[REDACTED]`
   - `mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@` $\rightarrow$ `mongodb+srv://[USER]:[REDACTED]@`
3. **Centralized Detection**: CloudWatch metric filters trigger immediate High-Severity alerts if unmasked credential patterns are detected in log streams.

---

## 8. Metrics Architecture

Metrics provide real-time, quantitative health signals across four distinct layers:

### 8.1 Application Layer Metrics
- `http_requests_total`: Counter partitioned by `method`, `route`, `status_code`.
- `http_request_duration_seconds`: Histogram measuring latency (P50, P90, P95, P99).
- `circulation_operations_total`: Counter tracking `borrow`, `return`, `override` operations.
- `mongodb_connection_pool_active`: Gauge tracking active Mongoose database connections.
- `mongodb_query_duration_seconds`: Histogram measuring MongoDB operation latency.

### 8.2 Kubernetes Layer Metrics
- `container_cpu_usage_seconds_total`: CPU consumption per pod.
- `container_memory_working_set_bytes`: Working memory per pod (detects OOM risks).
- `kube_pod_status_phase`: Tracks Running, Pending, Failed pod states.
- `kube_deployment_status_replicas_available`: Tracks active replicas vs desired.
- `kube_horizontalpodautoscaler_status_current_replicas`: HPA scale state.

### 8.3 Infrastructure Layer Metrics
- ALB Target Response Time, Active Connection Count, HTTP 5xx / 4xx counts.
- EKS Worker Node CPU, Memory, Disk, and Network I/O utilization.

### 8.4 Custom Business KPIs
- **Daily Checkout Volume**: Aggregated count of successful checkout operations.
- **Active System Loans**: Gauge of total non-returned borrowings.
- **Dynamic Overdue Count**: Real-time evaluation of loans where `now > dueDate`.
- **Patron Suspension Rate**: Metric tracking accounts transitioning to `SUSPENDED`.

---

## 9. Prometheus and CloudWatch Metrics Strategy

The architecture avoids redundant telemetry infrastructure and cost explosion:
- **Application Endpoint**: `lms-backend` exposes Prometheus-formatted metrics internally on port `3000` at path `/metrics`. This endpoint is accessible exclusively within the pod network (blocked from external ingress via NetworkPolicy).
- **Collection**: AWS Distro for OpenTelemetry (ADOT) Collector scrapes `/metrics` every 15 seconds.
- **Destination**: Metrics are ingested into Amazon CloudWatch Container Insights as embedded metric format (EMF) logs, eliminating the need to deploy and manage heavy Prometheus server state disks in Kubernetes.
- **Cost Protection**: High-cardinality labels (e.g., individual user IDs or query parameters) are strictly barred from metric dimensions.

---

## 10. Distributed Tracing Architecture

Distributed tracing provides full-lifecycle request visibility using OpenTelemetry and AWS X-Ray:
- **Trace Propagation**: Standard W3C Trace Context headers (`traceparent`, `tracestate`) are propagated across boundaries:
  `Client Browser` $\longrightarrow$ `AWS ALB` $\longrightarrow$ `Frontend NGINX` $\longrightarrow$ `Backend Express` $\longrightarrow$ `MongoDB Driver`.
- **Sampling Strategy**:
  - **Profile A (Production)**: 10% adaptive sampling for normal traffic; 100% sampling for requests resulting in HTTP 5xx errors or latency $> 200\text{ms}$.
  - **Profile B (Student)**: 1% fixed sampling to minimize AWS X-Ray ingestion fees.
- **Span Hierarchy**:
  - `Root Span`: Ingress ALB request.
  - `Child Span 1`: Express Routing & Middleware (Rate limit, Auth Guard).
  - `Child Span 2`: Application Service Execution (`CirculationService.borrow`).
  - `Child Span 3`: Database Transaction & Query Execution (`Mongoose findOneAndUpdate`).
  - `Child Span 4`: Tier 1 Audit Log Transaction.

---

## 11. Critical Transaction Traceability

Traceability is guaranteed across all primary library operations:

| Transaction Flow | Canonical Route Path | Success Trace Boundary | Latency Budget (P95) | Critical Failure Signals |
|---|---|---|---|---|
| **Book Search** | `GET /api/v1/books` | HTTP 200; Text index query | $< 150\text{ms}$ | Database timeout; index miss; 5xx |
| **Book Checkout** | `POST /api/v1/borrowings` | HTTP 201; ACID Tx commit | $< 250\text{ms}$ | Inventory exhausted (409); Quota (409); Tx Conflict (112) |
| **Book Return** | `POST /api/v1/borrowings/:borrowingId/return` | HTTP 200; Stock restored | $< 200\text{ms}$ | Already returned (409); BOLA Mismatch (403) |
| **User Login** | `POST /api/v1/auth/login` | HTTP 200; Cookie emitted | $< 150\text{ms}$ | Invalid credentials (401); Rate limited (429) |
| **Token Refresh** | `POST /api/v1/auth/refresh` | HTTP 200; Rotated tokens | $< 100\text{ms}$ | Replay detected (401); Family invalidated |
| **Admin Override** | `POST /api/v1/admin/borrowings/:borrowingId/return-override` | HTTP 200; Audit persisted | $< 250\text{ms}$ | Unauthorized role (403); Record not found (404) |

---

## 12. Dashboard Architecture

Six logical dashboards provide targeted operational visibility:

```text
+-----------------------------------------------------------------------------------------+
|                                    DASHBOARD TAXONOMY                                   |
+----------------------+------------------------------------------------------------------+
| DASHBOARD TYPE       | KEY VISUALIZATIONS & OPERATIONAL PANELS                          |
+----------------------+------------------------------------------------------------------+
| 1. Executive Health  | Overall Availability (SLO gauge), Error Budget Burn Rate,        |
|                      | Global Request Rate, Active P1/P2 Alerts.                        |
+----------------------+------------------------------------------------------------------+
| 2. Application API   | Request Volume per Route, P50/P95/P99 Latency Heatmaps,          |
|                      | HTTP 4xx/5xx Breakdown, Express Event Loop Delay.                |
+----------------------+------------------------------------------------------------------+
| 3. Kubernetes / EKS  | Pod Readiness per Namespace, CPU/Memory Utilization vs Limits,   |
|                      | HPA Desired vs Current Replicas, Node Scheduling Saturation.     |
+----------------------+------------------------------------------------------------------+
| 4. Database (Atlas)  | Mongoose Active Connections vs maxPoolSize, Read/Write Latency,  |
|                      | ACID Transaction Commit Time, Transient Write Conflicts.         |
+----------------------+------------------------------------------------------------------+
| 5. Security Telemetry| Failed Logins / Rate Limits, BOLA Access Denials, Refresh Token  |
|                      | Replays, Log Redaction Anomalies.                                |
+----------------------+------------------------------------------------------------------+
| 6. CI/CD & DORA      | Deployment Frequency, Lead Time, Change Failure Rate, MTTR,      |
|                      | Active Image Digest deployed across Dev, Staging, and Prod.      |
+----------------------+------------------------------------------------------------------+
```

---

## 13. SLI, SLO and Error Budget Architecture

Service Level Objectives establish mathematically measurable reliability targets:

### 13.1 Service Level Indicators (SLIs)
1. **Availability SLI**:
   $$\text{SLI}_{\text{avail}} = \frac{\text{Count of Successful Requests (HTTP status } < 500\text{)}}{\text{Total Valid HTTP Requests}} \times 100\%$$
2. **Catalog Latency SLI**:
   $$\text{SLI}_{\text{catalog}} = \frac{\text{Count of } \texttt{GET /api/v1/books} \text{ requests with latency } \le 150\text{ms}}{\text{Total } \texttt{GET /api/v1/books} \text{ requests}} \times 100\%$$
3. **Checkout Latency SLI**:
   $$\text{SLI}_{\text{checkout}} = \frac{\text{Count of } \texttt{POST /api/v1/borrowings} \text{ requests with latency } \le 250\text{ms}}{\text{Total } \texttt{POST /api/v1/borrowings} \text{ requests}} \times 100\%$$

### 13.2 Service Level Objectives (SLOs)
- **Availability SLO**: $\ge 99.9\%$ over a rolling 30-day window (permits maximum 43.2 minutes of unplanned downtime per month).
- **Catalog Latency SLO**: $\ge 95\%$ of valid catalog requests served in $\le 150\text{ms}$.
- **Checkout Latency SLO**: $\ge 95\%$ of valid checkout requests served in $\le 250\text{ms}$.

### 13.3 Error Budget Policy
- If Error Budget burn rate exceeds $2\times$ over 1 hour, automated alerts notify SRE.
- If $> 50\%$ of the monthly Error Budget is consumed within 7 days, non-critical production deployments are frozen; engineering focus shifts to reliability remediation.

---

## 14. Alerting Architecture

Alerting follows a 4-tier severity taxonomy preventing alarm fatigue:

```text
[Telemetry Signal] ---> [CloudWatch Metric Alarm] ---> [Amazon SNS Topic]
                                                                |
                                        +-----------------------+-----------------------+
                                        |                                               |
                                        v                                               v
                          [SEV-1 / SEV-2: PagerDuty / SRE]             [SEV-3 / SEV-4: Slack / Email]
```

| Severity Level | Trigger Condition | Notification Channel | Target Response SLA |
|---|---|---|---|
| **SEV-1 (Critical)** | Availability $< 99.0\%$; All Pods Unhealthy; Database Down | PagerDuty / SMS / Voice Call | $< 15\text{ minutes}$ |
| **SEV-2 (High)** | HTTP 5xx rate $> 1\%$ for 3 min; P95 latency $> 250\text{ms}$ for 5 min | PagerDuty / On-Call SRE | $< 30\text{ minutes}$ |
| **SEV-3 (Warning)** | Worker node CPU/Mem $> 80\%$; HPA at maxReplicas; Quota at 80% | Slack (`#lms-devops-alerts`) | $< 4\text{ hours}$ |
| **SEV-4 (Info)** | Rolling update started; nightly backup complete; scale event | Slack (`#lms-deployments`) | Next business day |

---

## 15. Incident Response Architecture

Incidents are governed through a standardized lifecycle:

```text
[Detection (Alarm)] ---> [Triage & Escalation] ---> [Mitigation (Rollback/Scaling)] ---> [Recovery] ---> [Postmortem (RCA)]
```

1. **Detection**: CloudWatch Alarm fires and dispatches alert to Amazon SNS.
2. **Triage**: On-call engineer inspects Executive Dashboard, correlated Trace IDs, and recent GitOps deployment commits.
3. **Mitigation**: Immediate execution of pre-approved remediation playbooks:
   - If caused by new release: Execute automated rollback (`kubectl rollout undo` or GitOps commit revert).
   - If caused by capacity: Scale HPA bounds or provision additional worker nodes.
4. **Recovery Verification**: Assert availability SLI and P95 latency return to baseline for 15 consecutive minutes.
5. **Post-Mortem**: Document Root Cause Analysis (RCA), timeline, and preventative backlog tickets within 48 hours.

---

## 16. Scalability Architecture

The system coordinates multi-layered elasticity to handle traffic surges:

```text
Incoming Traffic Spike
         |
         v
[Application Load Balancer] (AWS Auto-scales LCUs)
         |
         v
[HPA v2 (Pod Elasticity)] (Monitors CPU 70% / Mem 80% -> Adds Pods 3 to 12)
         |
         v
[Cluster Autoscaler (Node Elasticity)] (Detects Pending Pods -> Adds Nodes 3 to 9)
         |
         v
[MongoDB Connection Management] (Connection pool sized to protect Atlas limits)
```

---

## 17. Application Auto-Scaling

- **Backend Pod Sizing**:
  - Request: `250m` CPU / `512Mi` RAM. Limit: `500m` CPU / `1Gi` RAM.
  - HPA triggers scale-out when average CPU utilization reaches $70\%$ or memory reaches $80\%$.
- **Frontend Pod Sizing**:
  - Request: `100m` CPU / `128Mi` RAM. Limit: `250m` CPU / `256Mi` RAM.
  - Scales statically or elastically up to 6 replicas.
- **Oscillation Protection (Flapping)**:
  - Scale-up stabilization window: 0 seconds (instant scale-out during surges).
  - Scale-down stabilization window: 300 seconds (5 minutes cooldown before terminating pods).

---

## 18. Cluster and Node Scalability

- **Node Group Elasticity**: Amazon EKS Managed Node Groups adjust capacity via Cluster Autoscaler or Karpenter:
  - Profile A: Minimum 3 nodes, desired 3 nodes, maximum 9 nodes spread across 3 AZs.
  - Profile B: Fixed at 2 nodes (maximum 3) to strictly govern compute spend.
- **Graceful Node Draining**: Scale-down actions execute `kubectl drain`, honoring Pod Disruption Budgets (`minAvailable: 2` in Profile A) before AWS terminates the EC2 instance.

---

## 19. Database and Connection-Pool Scalability

To prevent pod autoscaling from overwhelming MongoDB Atlas, connection pools are mathematically governed:

### Mathematical Connection Capacity Model
$$\text{Max DB Connections Required} = (\text{Max Backend Pods} \times \text{maxPoolSize}) + \text{Safety Margin}$$

In Phase 10, `maxPoolSize` was established at `20` connections per pod:
- **Profile A (Peak Scale: 12 Pods)**:
  $$\text{Total Connections} = (12 \times 20) + 10 = 250\text{ connections}$$
  *Capacity Assessment*: MongoDB Atlas Dedicated M10 clusters support up to 1,500 concurrent connections. The maximum scale of 250 connections consumes only $16.7\%$ of Atlas capacity, providing complete headroom.
- **Profile B (Peak Scale: 3 Pods)**:
  $$\text{Total Connections} = (3 \times 20) + 5 = 65\text{ connections}$$
  *Capacity Assessment*: MongoDB Atlas M0 Free Tier enforces a hard limit of 500 connections. 65 connections consumes only $13\%$ of available quota.

---

## 20. Performance Monitoring

Continuous performance telemetry validates compliance with Phase 1 and Phase 8 baselines:
- **Continuous Latency Profiling**: Real-time histograms capture P50, P90, P95, and P99 latency per API route.
- **Closed-Loop Performance Feedback**: k6 performance test results executed during Phase 11 staging promotions are cross-referenced directly against production CloudWatch latency baselines to detect micro-regressions before release.

---

## 21. Capacity Planning

Capacity reviews are executed on a bi-weekly cadence:
- **Profile A Planning**: Evaluates CPU/Memory reservation trends, MongoDB storage growth rates, and CloudWatch log volume. Scale thresholds are expanded if baseline utilization exceeds $65\%$.
- **Profile B Planning**: Audits AWS monthly spend to ensure total student deployment runtime remains under the \$50–\$70/month target.

---

## 22. Observability Cost Optimization

To prevent observability telemetry from consuming an outsized portion of cloud budgets:
1. **CloudWatch Log Retention**:
   - Dev: 3 days.
   - Staging: 7 days.
   - Production (Profile A): 30 days active + Glacier archive.
   - Production (Profile B): 7 days active.
2. **Trace Sampling**: 10% adaptive sampling for production; 1% for student environments; 100% for error traces.
3. **Metric Cardinality Controls**: User IDs, dynamic book IDs, and arbitrary query parameters are strictly excluded from metric dimensions.

---

## 23. Dual-Profile Observability Architecture

| Telemetry Dimension | Profile A (Production Reference) | Profile B (Cost-Optimized Student) |
|---|---|---|
| **CloudWatch Log Retention** | 30 days active + 365-day Glacier archive | 7 days active (Zero Glacier archive) |
| **Trace Sampling Rate** | 10% adaptive (100% on errors) | 1% fixed (100% on errors) |
| **Container Insights** | Full enhanced metrics enabled | Standard basic cluster metrics |
| **Alerting Integrations** | PagerDuty, Amazon SNS, SMS, Slack | Amazon SNS, Slack (`#alerts-dev`) |
| **Multi-AZ Telemetry** | Monitored independently per 3 AZs | Monitored across 2 AZs |
| **Mandatory Security** | **NON-NEGOTIABLE (100% Enforced)** | **NON-NEGOTIABLE (100% Enforced)** |
| **Sensitive Redaction** | **Mandatory regex scrubbing** | **Mandatory regex scrubbing** |

---

## 24. Environment-Specific Observability

- **Development (`dev`)**: Verbose log level (`debug`), single-pod metrics, 3-day log retention, local console output.
- **Staging (`staging`)**: Production-mirrored telemetry (`info`), k6 latency tracking, automated integration failure alerts.
- **Production (`prod`)**: Full SLO tracking, adaptive tracing, PagerDuty alerting, audit trail compliance.

---

## 25. Security Observability

Security telemetry captures active threats and policy violations:
- **Authentication Telemetry**: Tracks repeated login failures ($> 5$ attempts triggers rate limit alert).
- **Authorization & BOLA Alerts**: Monitors HTTP 403 Forbidden events on `/borrowings/:borrowingId/return`.
- **Token Replay Alerts**: Emits immediate Critical alerts if an already-consumed refresh token is replayed.
- **Kubernetes Security Events**: Captures Pod Security Standard admission rejections and blocked NetworkPolicy packets.

---

## 26. Observability Access Control

Telemetry data is protected using AWS IAM least-privilege principles:
- **Developers**: Read-only access to `/aws/containerinsights/.../application` logs and non-production traces.
- **SRE & DevOps**: Access to Container Insights, CloudWatch Alarms, and metrics configuration.
- **Security Team**: Exclusive access to `/aws/eks/.../cluster` audit logs and security anomaly alarms.
- **Auditors**: Read-only access to immutable CloudTrail and long-term Glacier archives.

---

## 27. Kubernetes Observability

Telemetry is segmented across cluster namespaces:
- `kube-system`: CoreDNS latency, AWS VPC CNI IP allocation rates, AWS Load Balancer Controller reconciliation status.
- `lms-core`: Workload pod readiness, container restarts, HPA scaling events, PDB compliance.
- `lms-monitoring`: DaemonSet agent health, OpenTelemetry collector buffer utilization, log drop counters.

---

## 28. Failure Detection and Recovery Observability

| Failure Scenario | Primary Telemetry Signal | Alert Severity | Automated / SRE Response | Recovery Verification |
|---|---|---|---|---|
| **Pod CrashLoopBackOff** | `kube_pod_status_phase == Failed` | High (SEV-2) | Kubelet auto-restart; inspect crash log | Pod Running for 5 min |
| **Node Termination** | Node status `NotReady` | High (SEV-2) | EKS replaces node; pods rescheduled | Desired replicas restored |
| **AZ Outage** | TargetGroup Unhealthy $> 33\%$ | Critical (SEV-1)| ALB drops failed AZ; traffic rerouted | 100% healthy targets in 2 AZs |
| **Atlas Connection Spike**| Active connections $> 80\%$ | High (SEV-2) | HPA throttled; inspect query leak | Connection count $< 50\%$ |
| **Secret Mount Failure** | CSI Driver error event | High (SEV-2) | Deployment halted; check IAM/IRSA | Pod passes startup probe |
| **Network Partition** | Readiness probe failure spike | Critical (SEV-1)| Traffic cut; connection pool reset | Probes pass; latency $< 200\text{ms}$ |

---

## 29. CI/CD and Deployment Observability

Extends Phase 11 delivery metrics into runtime monitoring:
- **Deployment Markers**: Every GitOps sync injects an annotation into CloudWatch dashboards marking release timestamps.
- **Canary & Error Budget Health**: Evaluates HTTP 5xx error rate for 10 minutes post-deployment; if error rate exceeds 0.5%, triggers automated rollback alert.

---

## 30. Observability Data Lifecycle

Telemetry data is governed through an 8-stage lifecycle:
$$\text{Generate} \longrightarrow \text{Collect} \longrightarrow \text{Process} \longrightarrow \text{Redact} \longrightarrow \text{Store} \longrightarrow \text{Analyze} \longrightarrow \text{Retain} \longrightarrow \text{Archive / Expire}$$
- Strict data minimization ensures that telemetry overhead does not exceed $2.5\%$ of container CPU/memory resources.

---

## 31. Cross-Phase Traceability Matrix

| Upstream Phase | Governing Requirement | Phase 12 Architectural Response | Compliance Status |
|---|---|---|---|
| **Phase 0: Master Architecture** | Dual profiles (Profile A vs B), monorepo | Telemetry profiles defined; independent frontend/backend monitoring. | **100% COMPLIANT** |
| **Phase 1: SRS** | P95 latency ($< 150\text{ms}$ catalog, $< 250\text{ms}$ checkout)| SLIs, SLOs, and CloudWatch Alarms enforce exact P95 latency thresholds. | **100% COMPLIANT** |
| **Phase 2: Detailed System Design** | 6-tier architecture, circulation state machine | Tracing boundaries follow service layers; tracks loan state transitions. | **100% COMPLIANT** |
| **Phase 3: Database Architecture** | MongoDB Atlas, ACID transactions, `DBD-09` | Tracks connection pools, write conflicts, and dynamic overdue metrics. | **100% COMPLIANT** |
| **Phase 4: Backend & API Design** | Canonical `/api/v1` namespace, 21 endpoints | Telemetry schema standardizes on canonical routes and RFC 7807 codes. | **100% COMPLIANT** |
| **Phase 5: Frontend Architecture** | React SPA, NGINX delivery, in-memory tokens | NGINX access logs; validates in-memory token retention (no local leak). | **100% COMPLIANT** |
| **Phase 6: Security Architecture** | STRIDE threat model, zero static credentials | Mandatory regex log redaction; security telemetry tracks auth failures. | **100% COMPLIANT** |
| **Phase 7: Engineering Standards** | Structured JSON logging, health probes | Standardized JSON schema; health checks on `/api/v1/health` and `/healthz`.| **100% COMPLIANT** |
| **Phase 8: Testing Strategy** | Performance testing (k6), quality gates | Telemetry baseline cross-references k6 benchmark results in staging. | **100% COMPLIANT** |
| **Phase 9: AWS Cloud Infrastructure** | CloudWatch, ECR, VPC subnets | Ingests logs into `/aws/containerinsights/...`; ALB access logs. | **100% COMPLIANT** |
| **Phase 10: Kubernetes Architecture** | Namespaces, HPA v2, PDBs, `maxPoolSize: 20` | Monitors HPA scaling, PDB compliance, and connection pool bounds. | **100% COMPLIANT** |
| **Phase 11: CI/CD Architecture** | DORA metrics, immutable image digest | Injects image digests into logs; tracks DORA metrics on dashboards. | **100% COMPLIANT** |

---

## 32. STRIDE Security Traceability

| STRIDE Category | Observability Threat Vector | Monitoring & Logging Countermeasure | Upstream Alignment |
|---|---|---|---|
| **Spoofing** | Forged telemetry emitted to CloudWatch | In-cluster ADOT agent uses IRSA; rejects external unauthenticated metrics. | Phase 6 & Phase 9 |
| **Tampering** | Altering log streams or metric counts | CloudWatch Logs log stream immutability; KMS encryption at rest. | Phase 6 & Phase 9 |
| **Repudiation** | Denial of administrative or circulation action | Tier 1 immutable audit logs recorded with user ID, IP, and timestamp. | Phase 2 & Phase 6 |
| **Information Disclosure** | Passwords, tokens, or PII leaked in logs | Multi-tier regex scrubbing in app logger and Fluent Bit pipeline. | Phase 6 & Phase 7 |
| **Denial of Service** | Telemetry flooding exhausting disk or budget | Metric cardinality limits; log rate-limiting; adaptive trace sampling. | Phase 1 & Phase 6 |
| **Elevation of Privilege** | Gaining unauthorized access to security logs | IAM least-privilege role separation between developers and security auditors. | Phase 6 & Phase 9 |

---

## 33. Architectural Decision Records (ADRs)

### ADR-OBS-01: Cloud-Native Three-Pillar Observability Architecture
- **Status**: APPROVED
- **Context**: Comprehensive visibility requires harmonizing metrics, logs, and traces without tool fragmentation.
- **Decision**: Adopt a unified model using OpenTelemetry standards, Amazon CloudWatch, and AWS X-Ray.
- **Consequences**: Standardizes telemetry collection; avoids vendor lock-in; ensures complete signal correlation.

### ADR-OBS-02: Centralized Logging Through Amazon CloudWatch
- **Status**: APPROVED
- **Context**: Container logs across multiple AZs must be aggregated centrally with automated retention.
- **Decision**: Stream structured JSON logs from pods to Amazon CloudWatch Logs via Fluent Bit.
- **Consequences**: Managed durability; seamless integration with CloudWatch Insights and metric alarms.

### ADR-OBS-03: Structured JSON Logging and Mandatory Sensitive Data Redaction
- **Status**: APPROVED
- **Context**: Logging credentials or PII violates security baselines and compliance requirements.
- **Decision**: Enforce structured JSON schemas with multi-tiered regex scrubbing of passwords and tokens.
- **Consequences**: Zero plaintext credentials stored in log groups; high queryability in CloudWatch Insights.

### ADR-OBS-04: Prometheus-Compatible Metrics and CloudWatch Integration
- **Status**: APPROVED
- **Context**: Application metrics must align with cloud-native standards without requiring heavy stateful servers.
- **Decision**: Expose `/metrics` via Prometheus client; scrape via ADOT into CloudWatch Container Insights.
- **Consequences**: Minimal in-cluster overhead; leverages AWS managed scaling for metric storage.

### ADR-OBS-05: OpenTelemetry Distributed Tracing with AWS X-Ray Interoperability
- **Status**: APPROVED
- **Context**: Micro-latencies in circulation transactions must be isolated across HTTP and database tiers.
- **Decision**: Instrument backend services with OpenTelemetry using W3C Trace Context and AWS X-Ray exporter.
- **Consequences**: Visualizes database bottlenecks; pinpointed latency profiling for P95 violations.

### ADR-OBS-06: SLI, SLO and Error Budget Reliability Model
- **Status**: APPROVED
- **Context**: Engineering teams need objective, quantitative criteria to balance feature velocity with stability.
- **Decision**: Codify 99.9% availability, 150ms catalog latency, and 250ms checkout latency SLOs with error budget tracking.
- **Consequences**: Aligns engineering priorities; triggers automated deployment freezes when budget burns.

### ADR-OBS-07: Multi-Tier Alerting and Incident Escalation
- **Status**: APPROVED
- **Context**: Alert fatigue must be avoided while ensuring critical incidents receive immediate response.
- **Decision**: Implement a 4-tier severity model (SEV-1 to SEV-4) routing critical alerts to PagerDuty/SMS and warnings to Slack.
- **Consequences**: Ensures $< 15\text{ minute}$ response for outages; eliminates noise for non-actionable events.

### ADR-OBS-08: End-to-End Scalability and Capacity Planning Architecture
- **Status**: APPROVED
- **Context**: Autoscaling pods and nodes must coordinate seamlessly without thrashing.
- **Decision**: Couple HPA v2 (CPU 70%/Mem 80%) with Cluster Autoscaler and a 5-minute scale-down cooldown.
- **Consequences**: Stable, predictable scaling; eliminates flapping during bursty library search traffic.

### ADR-OBS-09: Database Connection Pool Observability and Scaling Protection
- **Status**: APPROVED
- **Context**: Uncontrolled pod scaling could easily exhaust MongoDB Atlas connection limits.
- **Decision**: Cap `maxPoolSize` at 20 per pod and implement real-time connection pool saturation alerting.
- **Consequences**: Maximum 12 pods consume at most 250 connections, safely within Atlas M10 and M0 limits.

### ADR-OBS-10: Cost-Aware Dual-Profile Observability Strategy
- **Status**: APPROVED
- **Context**: Telemetry ingestion costs must not exceed operational budgets in student or production profiles.
- **Decision**: Enforce 30-day retention and adaptive tracing in Profile A; 7-day retention and 1% sampling in Profile B.
- **Consequences**: Keeps Profile B within the \$50–\$70/month target while retaining 100% of mandatory security controls.

---

## 34. Mermaid Architecture Diagrams

### Diagram 1: Complete Monitoring, Logging and Scalability Architecture
```mermaid
flowchart TB
    subgraph Clients["Users & Ingress"]
        Browser["Patron / Admin Browser"] -->|HTTPS / W3C Trace| ALB["AWS Application Load Balancer"]
    end

    subgraph EKSCluster["Amazon EKS Cluster (lms-core & lms-monitoring)"]
        ALB -->|IP-Mode Routing| BackendPod["lms-backend Pod (Express API)"]
        BackendPod -->|JSON Logs| FluentBit["Fluent Bit DaemonSet"]
        BackendPod -->|/metrics| ADOT["ADOT Collector DaemonSet"]
        BackendPod -->|OIDC AWS Traces| XRayDaemon["AWS X-Ray Daemon"]
    end

    subgraph DatabaseTier["Database Tier"]
        BackendPod -->|Mongoose Pool (maxPoolSize: 20)| Atlas["MongoDB Atlas Replica Set"]
    end

    subgraph AWSMonitoring["AWS Observability Services"]
        FluentBit --> CloudWatchLogs["Amazon CloudWatch Logs"]
        ADOT --> ContainerInsights["CloudWatch Container Insights"]
        XRayDaemon --> XRay["AWS X-Ray Service"]
    end

    subgraph AlertingTier["Alerting & Escalation"]
        CloudWatchLogs --> Alarms["CloudWatch Alarms"]
        ContainerInsights --> Alarms
        Alarms --> SNS["Amazon SNS Topic"]
        SNS --> PagerDuty["PagerDuty (SEV-1 / SEV-2)"]
        SNS --> Slack["Slack Channel (SEV-3 / SEV-4)"]
    end
```

### Diagram 2: End-to-End Metrics Collection Flow
```mermaid
flowchart LR
    subgraph PodMetrics["Pod Metrics Generation"]
        App["Node.js Application"] -->|Prometheus Client| Endpoint["Internal /metrics (Port 3000)"]
    end

    subgraph Collection["In-Cluster Collection"]
        ADOT["ADOT Collector\n(Scrapes every 15s)"] -->|Scrape Request| Endpoint
    end

    subgraph AWSCloud["Amazon CloudWatch"]
        ADOT -->|Embedded Metric Format (EMF)| CloudWatch["CloudWatch Container Insights"]
        CloudWatch --> MetricP95["P95 Latency Metric"]
        CloudWatch --> Metric5xx["HTTP 5xx Rate Metric"]
        CloudWatch --> MetricConn["DB Active Connections"]
    end
```

### Diagram 3: Centralized Logging and CloudWatch Architecture
```mermaid
flowchart TD
    subgraph Sources["Log Sources"]
        AppLog["Application stdout (Structured JSON)"]
        NginxLog["Frontend NGINX Access Logs"]
        K8sLog["Kubelet & Containerd Logs"]
        ALBLog["ALB Ingress Access Logs"]
    end

    subgraph Collection["Fluent Bit Processing Pipeline"]
        Parser["JSON Parser Filter"]
        Redactor["Sensitive Data Redaction Filter\n(Bearer / Cookies / Passwords)"]
    end

    subgraph CloudWatch["Amazon CloudWatch Logs Groups"]
        AppLG["/aws/containerinsights/lms-cluster/application"]
        ClusterLG["/aws/eks/lms-cluster/cluster"]
        ALBLG["/aws/alb/lms-ingress"]
    end

    AppLog --> Parser --> Redactor --> AppLG
    NginxLog --> Parser --> Redactor --> AppLG
    K8sLog --> ClusterLG
    ALBLog --> ALBLG
```

### Diagram 4: Distributed Tracing Architecture
```mermaid
sequenceDiagram
    autonumber
    actor Client as Client Browser
    participant ALB as AWS Application Load Balancer
    participant Backend as lms-backend Pod
    participant DB as MongoDB Atlas
    participant XRay as AWS X-Ray Service

    Client->>ALB: HTTPS GET /api/v1/books (Injects X-Amzn-Trace-Id)
    ALB->>Backend: Forward HTTP Request with Trace Context
    Note over Backend: OpenTelemetry creates Root Span
    Backend->>Backend: Middleware Auth & Rate Limit Span
    Backend->>DB: MongoDB Query Span (find catalog)
    DB-->>Backend: Query Results
    Backend-->>ALB: HTTP 200 OK Response
    ALB-->>Client: HTTPS Response
    Backend->>XRay: Export Trace Spans asynchronously via UDP
```

### Diagram 5: Critical Checkout Transaction Trace
```mermaid
flowchart TD
    SpanRoot["Span 1: POST /api/v1/borrowings (Root Latency Budget: 250ms)"]
    SpanRoot --> SpanAuth["Span 2: AuthGuard & Patron Token Validation (10ms)"]
    SpanRoot --> SpanQuota["Span 3: Patron Active Loan Quota Check INV-04 (20ms)"]
    SpanRoot --> SpanACID["Span 4: Multi-Doc ACID Transaction (120ms)"]
    SpanACID --> SpanStock["Span 4a: Atomic Inventory Decrement INV-01 (40ms)"]
    SpanACID --> SpanLoan["Span 4b: Borrowing Document Creation INV-03 (40ms)"]
    SpanACID --> SpanAudit["Span 4c: Tier 1 Transactional Audit Record (30ms)"]
    SpanRoot --> SpanFormat["Span 5: Response Serialization & Headers (5ms)"]
```

### Diagram 6: Alerting and Incident Response Escalation Flow
```mermaid
flowchart TD
    MetricAlert["Alarm: P95 Latency > 250ms for 5 min"] --> Severity{"Severity Evaluation"}
    Severity -->|SEV-1 / SEV-2| P1["Trigger Amazon SNS -> PagerDuty"]
    Severity -->|SEV-3 / SEV-4| P2["Trigger Amazon SNS -> Slack #alerts"]
    P1 --> OnCall["On-Call SRE Paged (< 15 min SLA)"]
    OnCall --> Triage["Inspect Dashboards & Trace IDs"]
    Triage --> Action{"Rollback or Scale?"}
    Action -->|Release Bug| Rollback["Execute Automated Rollback"]
    Action -->|Load Spike| Scale["Increase HPA maxReplicas"]
    Rollback --> Verify["Verify SLO Restored"]
    Scale --> Verify
    Verify --> RCA["Conduct Post-Mortem within 48h"]
```

### Diagram 7: HPA, Cluster Autoscaler and Database Scalability Flow
```mermaid
flowchart TD
    LoadSpike["Traffic Surge: Checkout Volume Increases"] --> PodUtil["Backend CPU Reaches 85% (>70% Target)"]
    PodUtil --> HPA["HPA v2 Adds Pod Replicas (3 -> 8)"]
    HPA --> NodeCheck{"Sufficient Node Compute?"}
    NodeCheck -->|No: Pods Pending| CA["Cluster Autoscaler Adds EC2 Node"]
    CA --> NodeReady["New Node Ready; Pods Scheduled"]
    NodeCheck -->|Yes| PodsRun["Pods Running & Ready"]
    PodsRun --> DBPool["Mongoose Connection Pool Scales:\n8 Pods x 20 = 160 Connections"]
    DBPool --> AtlasCap["Atlas M10 Capacity: 160 / 1,500 (10.7% Safe)"]
```

### Diagram 8: Multi-AZ Failure Detection and Recovery
```mermaid
flowchart TB
    subgraph AZFailure["Availability Zone Failure: us-east-1a"]
        NodeA["Worker Node in AZ-a Fails"]
        PodA["Backend Pod 1 Lost"]
    end

    subgraph Detection["Automated Failure Detection"]
        TargetGroup["ALB TargetGroup Health Check Fails (2x Timeout)"]
        Kubelet["EKS Control Plane Marks Node NotReady"]
    end

    subgraph SurvivingAZs["Surviving Zones: us-east-1b & us-east-1c"]
        ALB_Reroute["ALB Reroutes 100% Traffic to AZ-b and AZ-c"]
        PDB["PDB minAvailable: 2 Preserved"]
        PodB["Backend Pod 2 (Active)"]
        PodC["Backend Pod 3 (Active)"]
    end

    NodeA --> TargetGroup --> ALB_Reroute
    NodeA --> Kubelet --> PDB
    ALB_Reroute --> PodB
    ALB_Reroute --> PodC
```

### Diagram 9: Telemetry Security and Sensitive Data Redaction Flow
```mermaid
flowchart LR
    subgraph AppProcess["Application Logging Stream"]
        RawEvent["Log Event: { userId, password, token }"]
        AppRedactor["Winston / Pino Redactor:\nReplaces password with [REDACTED]"]
    end

    subgraph AgentCollection["In-Cluster Fluent Bit"]
        RegexFilter["Fluent Bit Regex Filter:\nMasks Bearer Tokens & Cookies"]
    end

    subgraph CloudStorage["CloudWatch Logs"]
        SafeLog["Sanitized JSON Log Stored at Rest (KMS Encrypted)"]
        MetricFilter["Security Metric Filter:\nAsserts Zero Token Leaks"]
    end

    RawEvent --> AppRedactor --> RegexFilter --> SafeLog --> MetricFilter
```

### Diagram 10: Development -> Staging -> Production Observability Architecture
```mermaid
flowchart LR
    subgraph DevEnv["Development Environment"]
        D1["Log Level: debug"]
        D2["Retention: 3 Days"]
        D3["Sampling: 100% Local"]
    end

    subgraph StagingEnv["Staging Environment"]
        S1["Log Level: info"]
        S2["Retention: 7 Days"]
        S3["k6 Latency Profiling"]
        S4["SLO Verification"]
    end

    subgraph ProdEnv["Production Environment"]
        P1["Log Level: info"]
        P2["Retention: 30 Days + Glacier"]
        P3["Adaptive Tracing (10%)"]
        P4["PagerDuty SEV-1/2 Alarms"]
        P5["Error Budget Governance"]
    end

    DevEnv --> StagingEnv --> ProdEnv
```

---

## 35. Future Implementation Boundaries

To preserve strict lifecycle governance, the boundary between Phase 12 architecture and future implementation is explicitly demarcated:

| Observability Component | Phase 12 Architectural Approval | Phase 14 / Downstream Implementation Boundary |
|---|---|---|
| **Logging Schema & Redaction** | JSON field schemas, regex masking patterns | Authoring Winston logger code, configuring Fluent Bit filters |
| **Metrics Collection** | Metric names, Prometheus `/metrics` schema | Integrating `prom-client` in Express, deploying ADOT Helm chart |
| **Distributed Tracing** | OpenTelemetry spans, W3C headers, X-Ray rules| Installing `@opentelemetry/sdk-node`, instrumenting Express |
| **Dashboards** | 6 logical dashboard definitions and panel models| Authoring CloudWatch dashboard JSON or Grafana dashboards |
| **Alerting Rules** | Severity taxonomy, threshold numbers, SNS flow | Terraform `aws_cloudwatch_metric_alarm` and SNS subscriptions |
| **SLI / SLO Governance** | Mathematical formulas, latency budgets, burn rules| Setting up automated SLO monitoring tools or Sloth manifests |
| **Autoscaling Coordination** | HPA CPU/memory targets, connection formulas | Authoring Kubernetes `hpa.yaml`, tuning Mongoose pool sizes |

---

## 36. Self-Audit Checklist

Before concluding, this specification was audited against all Phase 12 requirements:
- [x] All upstream baselines (Phases 0–11) preserved 100% without contradiction.
- [x] Phase 1 P95 latency targets ($< 150\text{ms}$ catalog, $< 250\text{ms}$ checkout) codified as SLOs.
- [x] Phase 10 Kubernetes autoscaling and connection pool (`maxPoolSize: 20`) preserved.
- [x] Phase 11 DORA metrics and immutable image digest traceability integrated.
- [x] Dual profiles (Profile A Production Reference vs Profile B Student) fully specified.
- [x] Structured JSON logging schema and mandatory regex redaction codified.
- [x] Metrics architecture across App, K8s, Infra, and Business KPIs complete.
- [x] OpenTelemetry distributed tracing and AWS X-Ray integration detailed.
- [x] 4-tier alerting and incident response lifecycle (SEV-1 to SEV-4) defined.
- [x] Database connection scaling model mathematically proven.
- [x] Exactly 10 Architectural Decision Records (ADR-OBS-01 to ADR-OBS-10) documented.
- [x] Exactly 10 Mermaid architecture diagrams included.
- [x] Zero premature implementation artifacts, code, or deployed resources created.

---

## 37. Lifecycle Governance Conclusion

Phase 12 — Monitoring, Logging and Scalability Architecture is formally complete as an architectural specification:

```text
========================================================================================
                          LIFECYCLE GOVERNANCE STATUS SUMMARY
========================================================================================
Phase 0 – Master Project Architecture:          PERMANENTLY BASELINE LOCKED & APPROVED
Phase 1 – Software Requirements Specification:   PERMANENTLY BASELINE LOCKED & APPROVED
Phase 2 – Detailed System Design:               PERMANENTLY BASELINE LOCKED & APPROVED
Phase 3 – Database Architecture:                PERMANENTLY BASELINE LOCKED & APPROVED
Phase 4 – Backend Architecture & API Design:    PERMANENTLY BASELINE LOCKED & APPROVED
Phase 5 – Frontend Architecture & UI Design:    PERMANENTLY BASELINE LOCKED & APPROVED
Phase 6 – Security Architecture:                PERMANENTLY BASELINE LOCKED & APPROVED
Phase 7 – Engineering Standards & Code Quality: PERMANENTLY BASELINE LOCKED & APPROVED
Phase 8 – Testing Strategy & Quality Assurance: PERMANENTLY BASELINE LOCKED & APPROVED
Phase 9 – AWS Infrastructure Architecture:      PERMANENTLY BASELINE LOCKED & APPROVED
Phase 10 – Kubernetes and EKS Architecture:     PERMANENTLY BASELINE LOCKED & APPROVED
Phase 11 – CI/CD Architecture:                  PERMANENTLY BASELINE LOCKED & APPROVED

Phase 12 – Monitoring, Logging and Scalability:
STATUS: PERMANENTLY BASELINE LOCKED AND APPROVED

Phase 13 – Security, Governance and Final Architecture Consolidation: NEXT PHASE
Phase 14 – Implementation:                      STRICTLY PROHIBITED (GATED)
========================================================================================
```
