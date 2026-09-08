# Infrastructure Automation Scripts

## Overview
This directory contains utility and automation scripts for environment bootstrapping, cluster maintenance, deployment verification, and database connectivity tests.

## Contents (Planned)
```text
infrastructure/scripts/
├── bootstrap-eks.sh            # EKS cluster bootstrap & addon installation (ALB controller, metrics-server)
├── setup-irsa.sh               # IAM Roles for Service Accounts association script
├── rotate-secrets.sh           # Secret rotation automation script for MongoDB Atlas / JWT keys
└── health-check.sh             # Cluster and service health evaluation script
```
