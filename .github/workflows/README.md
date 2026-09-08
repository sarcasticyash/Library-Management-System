# GitHub Actions Workflows

## Overview
This directory contains automated CI/CD workflows for the Library Management System monorepo.

## Workflows (Planned)
- `ci.yml`: Triggered on pull requests to `main` and `develop`. Executes linting, typechecking, security scanning (Trivy), unit tests, and integration tests for both `apps/frontend` and `apps/backend`.
- `build-push-ecr.yml`: Triggered on merge to `main` or release tag creation. Builds multi-stage Docker images, scans images for vulnerabilities, and pushes tagged images to Amazon ECR.
- `deploy-eks.yml`: Triggered post image push. Deploys updated manifests to Amazon EKS using AWS IAM OIDC authentication, runs database migrations/checks, and executes rollout status verification with automated rollback upon failure.
