# Kubernetes Manifests and Helm Charts

## Overview
This directory contains Kubernetes deployment specifications, Helm charts, and environment overlays (dev, staging, prod) targeting Amazon EKS.

## Contents (Planned)
```text
infrastructure/kubernetes/
├── base/
│   ├── namespace.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── ingress.yaml                  # AWS ALB Ingress configuration
│   ├── hpa-backend.yaml              # HorizontalPodAutoscaler for backend
│   ├── hpa-frontend.yaml             # HorizontalPodAutoscaler for frontend
│   ├── pdb.yaml                      # PodDisruptionBudgets
│   └── network-policy.yaml           # Pod-to-Pod network isolation
└── overlays/
    ├── dev/
    │   ├── kustomization.yaml
    │   └── configmap-patch.yaml
    ├── staging/
    │   ├── kustomization.yaml
    │   └── configmap-patch.yaml
    └── prod/
        ├── kustomization.yaml
        └── alb-ingress-patch.yaml    # Production ACM certificate ARN & route53 aliases
```
