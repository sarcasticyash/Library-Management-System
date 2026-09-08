# 07 - DevOps, Infrastructure & CI/CD Documentation

## Overview
This directory details the DevOps principles, container workflows, Kubernetes orchestration manifests, AWS landing zone setup, and CI/CD pipelines.

Refer to Sections 11, 12, 13, and 14 of the [Master Architecture Document](../02-architecture/MASTER_ARCHITECTURE.md) for full architectural details.

## Operational Pillars
- **Infrastructure as Code**: Terraform for modular, reproducible AWS VPC, EKS, IAM, and ECR management.
- **Continuous Integration**: GitHub Actions performing linting, typechecking, security audits, unit tests, and multi-stage container builds.
- **Continuous Deployment**: Automated deployment promotion across dev, staging, and production environments with automated health validation.
