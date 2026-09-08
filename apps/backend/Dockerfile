# ==============================================================================
# Cloud-Native Library Management System (LMS) - Backend Dockerfile
# Multi-Stage Production Build
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build & Compilation
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (bcrypt)
RUN apk add --no-cache python3 make g++

# Copy root monorepo package manifests
COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/

# Install all workspace dependencies
RUN npm install

# Copy backend application source code and configurations
COPY apps/backend/ ./apps/backend/

# Compile TypeScript to production JavaScript bundle
RUN npm run build --workspace=apps/backend

# ------------------------------------------------------------------------------
# Stage 2: Production Minimal Runtime
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production \
    PORT=3000

# Create unprivileged system group and user
RUN addgroup -S -g 1001 nodejs && \
    adduser -S -u 1001 lms -G nodejs

# Copy package manifests for production dependency resolution
COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/

# Install only production dependencies
RUN npm install --omit=dev --workspace=apps/backend && \
    npm cache clean --force

# Copy compiled JavaScript output from builder stage
COPY --from=builder --chown=lms:nodejs /app/apps/backend/dist ./apps/backend/dist

# Define container healthcheck targeting the Kubernetes/Docker liveness probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:3000/healthz || exit 1

# Expose backend service port
EXPOSE 3000

# Drop root privileges
USER lms

# Start the production HTTP server
CMD ["node", "apps/backend/dist/server.js"]
