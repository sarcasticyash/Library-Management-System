# ==============================================================================
# Cloud-Native Library Management System (LMS) - Frontend Dockerfile
# Multi-Stage Production Build with Nginx Alpine
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build & Static Asset Generation
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root monorepo package manifests
COPY package.json package-lock.json* ./
COPY apps/frontend/package.json ./apps/frontend/

# Install workspace dependencies
RUN npm install

# Copy frontend source code and build configs
COPY apps/frontend/ ./apps/frontend/

# Set production build environment variable for Vite
ENV VITE_API_BASE_URL=/api/v1

# Build production SPA static bundle
RUN npm run build --workspace=apps/frontend

# ------------------------------------------------------------------------------
# Stage 2: Production Nginx Server
# ------------------------------------------------------------------------------
FROM nginx:1.25-alpine AS runner

# Copy custom Nginx configuration
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy production static assets from builder stage
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Define container healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost/ || exit 1

# Expose HTTP port
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
