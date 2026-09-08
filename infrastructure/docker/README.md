# Docker Infrastructure Directory

## Overview
This directory houses all base Dockerfiles, local orchestration manifests (`docker-compose.yml`), and container image hardening guidelines for both local development and CI/CD container artifact production.

## Contents (Planned)
```text
infrastructure/docker/
├── Dockerfile.frontend          # Multi-stage production build for React + Nginx
├── Dockerfile.backend           # Multi-stage production build for Node.js LTS (non-root)
├── docker-compose.dev.yml       # Local development stack (Frontend, Backend, Mongo Express)
├── docker-compose.prod.yml      # Local production verification stack
└── .dockerignore                # Root container build ignore file
```
