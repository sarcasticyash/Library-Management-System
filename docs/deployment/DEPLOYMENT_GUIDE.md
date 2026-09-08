# Cloud-Native Library Management System (LMS)
# Production Deployment, DevOps & Operations Guide

## 1. Architecture Overview

The Cloud-Native Library Management System (LMS) is structured as a production-hardened monorepo consisting of:
- **Backend API (`apps/backend`)**: Node.js 20 / Express application implementing Clean Architecture, RFC 7807 problem details error handling, Helmet security headers, rate/size limits, Winston structured logging, and dual-token authentication.
- **Frontend SPA (`apps/frontend`)**: React 18 / Vite Single Page Application styled with Vanilla CSS design tokens, state management via TanStack Query v5, in-memory JWT storage, and Nginx Alpine for production serving with SPA routing fallbacks.
- **Database (`mongo`)**: MongoDB 7.0+ document database utilizing Multi-Document ACID Transactions and partial unique compound indexing.

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                         │
└──────────────┬───────────────────────────────┬──────────────┘
               │ (Port 80)                     │ (Port 80 /api/v1/*)
               ▼                               ▼
    ┌──────────────────────┐        ┌──────────────────────┐
    │  Frontend Container  │        │   Backend Container  │
    │    (Nginx Alpine)    │───────▶│    (Node 20 Alpine)  │
    │  Static SPA Assets   │        │ Express REST API v1  │
    └──────────────────────┘        └──────────┬───────────┘
                                               │
                                               ▼
                                    ┌──────────────────────┐
                                    │  Database Container  │
                                    │    (MongoDB 7.0)     │
                                    │  Persistent Volumes  │
                                    └──────────────────────┘
```

---

## 2. Local Development Setup

### Prerequisites
- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **MongoDB**: Local MongoDB community edition running on `localhost:27017` OR Docker

### Quickstart Commands
```bash
# 1. Clone repository and install dependencies
git clone https://github.com/cloud-native-lms/library-management-system.git
cd "Library managment system"
npm install

# 2. Configure environment variables
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# 3. Start development servers concurrently
npm run backend:dev    # Terminal 1: Backend on http://localhost:3000
npm run frontend:dev   # Terminal 2: Frontend Vite HMR on http://localhost:5173
```

---

## 3. Environment Variable Configuration

All configuration is driven strictly through environment variables. **Never commit real secrets to source control.**

### Backend Configuration Variables (`apps/backend/.env`)

| Variable | Required | Default (Dev) | Description |
|---|---|---|---|
| `NODE_ENV` | Yes | `development` | Operating mode: `development`, `test`, `production`. When set to `production`, stack traces and internal error details are automatically suppressed. |
| `PORT` | Yes | `3000` | HTTP listening port for Express backend. |
| `MONGODB_URI` | Yes | `mongodb://localhost:27017/lms_db` | Connection string for MongoDB database. For transactions in production, a replica set connection is required (e.g. `?replicaSet=rs0`). |
| `CORS_ORIGIN` | Yes | `http://localhost:5173` | Allowed origins for Cross-Origin Resource Sharing. Multiple origins can be comma-delimited: `http://localhost,http://localhost:80,http://localhost:5173`. |
| `JWT_SECRET` | Yes | *dev fallback* | Cryptographic secret for signing short-lived access tokens (minimum 32 characters). |
| `JWT_EXPIRES_IN` | Yes | `15m` | Lifetime duration of JWT access token. |
| `JWT_REFRESH_SECRET` | Yes | *dev fallback* | Cryptographic secret for signing single-use refresh tokens. |
| `JWT_REFRESH_EXPIRES_IN` | Yes | `7d` | Lifetime duration of refresh tokens. |
| `BCRYPT_SALT_ROUNDS` | Yes | `12` | Cost factor for password hashing (minimum 12 in production per NFR-SEC-01). |
| `LOG_LEVEL` | No | `info` | Logging verbosity: `error`, `warn`, `info`, `http`, `debug`. |

### Frontend Configuration Variables (`apps/frontend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | Yes | `/api/v1` | Base URL for REST API requests. When deployed with Nginx or Vite dev server proxy, `/api/v1` routes transparently to the backend. |

### Generating Secure Production Secrets
Run the following commands in your shell to generate cryptographically strong 256-bit secrets:
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 4. Running with Docker Compose

The complete full-stack environment can be spun up with a single command using Docker Compose:

```bash
# Build images and start services in background
docker compose up -d --build

# Inspect service logs
docker compose logs -f

# Check container health statuses
docker compose ps

# Teardown services and keep persistent database volumes
docker compose down

# Teardown services AND delete volumes (complete reset)
docker compose down -v
```

### Accessing Running Services
- **Frontend SPA**: `http://localhost` (or `http://localhost:80`)
- **Backend API**: `http://localhost:3000/api/v1`
- **Backend Liveness Probe**: `http://localhost:3000/healthz`
- **Backend Readiness Probe**: `http://localhost:3000/api/v1/health`
- **MongoDB**: `localhost:27017`

---

## 5. Production Deployment Architecture

### Container Security Features
- **Multi-Stage Builds**: Builder stages discard devDependencies, build tooling, and source TypeScript files, keeping final images lightweight (<150MB).
- **Non-Root Execution**: Backend runs under unprivileged user `lms` (UID 1001, GID 1001).
- **Native Healthchecks**: Built-in `HEALTHCHECK` instructions enable container orchestrators (Docker Swarm, Kubernetes, AWS ECS) to monitor pod vitality automatically.
- **Nginx Hardening**: Nginx Alpine serves the frontend with `X-Frame-Options DENY`, `X-Content-Type-Options nosniff`, `Referrer-Policy strict-origin-when-cross-origin`, and gzip compression.

### Kubernetes / AWS EKS Deployment Best Practices
1. **Liveness Probe**: Point to `GET /healthz` (returns 200 UP immediately as long as Node event loop is unblocked).
2. **Readiness Probe**: Point to `GET /api/v1/health` (evaluates MongoDB connection state and system memory before routing traffic).
3. **Graceful Shutdown**: When Kubernetes terminates a pod (`SIGTERM`), the backend pauses incoming connections, drains active in-flight requests, disconnects MongoDB cleanly, and exits within 10 seconds.

---

## 6. Running Tests & Quality Gates

The monorepo enforces zero-compromise quality gates:

```bash
# 1. Typecheck and linting
npm run backend:build
npm run backend:lint
npm run frontend:build
npm run frontend:lint
npm run format:check

# 2. Automated unit test suites
npm run test:unit       # 168 backend unit tests
npm run frontend:test   # 32 frontend component & integration tests

# 3. Stage 1 through 9 end-to-end regression suites
npx tsx scripts/test-stage1-regression.ts
npx tsx scripts/test-stage2.ts
npx tsx scripts/test-stage3.ts
npx tsx scripts/test-stage4.ts
npx tsx scripts/test-stage5.ts
npx tsx scripts/test-stage8.ts
npx tsx scripts/test-stage9.ts
```

---

## 7. Troubleshooting Common Issues

### Issue 1: `CORS error: Request has been blocked by CORS policy`
- **Cause**: Browser origin does not match the configured `CORS_ORIGIN` on the backend.
- **Solution**: Set `CORS_ORIGIN` to include the client origin, e.g. `CORS_ORIGIN="http://localhost,http://localhost:80,http://localhost:5173"`.

### Issue 2: `MongoServerError: This MongoDB deployment does not support retryable writes`
- **Cause**: MongoDB is running as a standalone instance rather than a replica set. Multi-Document ACID Transactions require replica set support.
- **Solution**: In production, connect to MongoDB Atlas or initialize replica set on local instance via `rs.initiate()`.

### Issue 3: `404 Not Found on browser page refresh in production`
- **Cause**: Direct requests to SPA routes (e.g. `/books`, `/admin/dashboard`) look for physical files on the server when Nginx is not configured with fallback routing.
- **Solution**: Verify that `apps/frontend/nginx.conf` contains `try_files $uri $uri/ /index.html;`.

### Issue 4: `Port 3000 or 5173 already in use`
- **Cause**: Another process or background development server is bound to the port.
- **Solution**: Terminate the existing process via task manager or assign alternate port via `PORT=3001`.
