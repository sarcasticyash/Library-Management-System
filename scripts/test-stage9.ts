/**
 * Cloud-Native Library Management System (LMS)
 * Stage 9 Automated DevOps, Containerization & Production Readiness Verification Suite
 *
 * Validates:
 * 1. Dockerfile containerization (multi-stage builds, non-root users, healthchecks)
 * 2. Nginx configuration (SPA routing fallback, gzip, security headers, reverse proxy)
 * 3. Docker Compose orchestration (services, persistent volumes, networks, healthchecks)
 * 4. Environment variable templates and secret leakage audit
 * 5. Backend production hardening (Helmet, CORS, size limits, graceful shutdown, health probes)
 * 6. Frontend production build artifacts
 * 7. GitHub Actions CI/CD workflow configuration
 * 8. Comprehensive deployment documentation
 */

import fs from 'fs';
import path from 'path';
import http from 'http';
import { AddressInfo } from 'net';
import { createApp } from '../apps/backend/src/app';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runStage9DevOpsSuite() {
  console.log('================================================================');
  console.log('  STAGE 9: DEVOPS, CONTAINERIZATION & PRODUCTION READINESS TEST');
  console.log('================================================================\n');

  const rootDir = path.resolve(__dirname, '..');

  // ==========================================================================
  // SECTION 1: Docker Containerization & Multi-Stage Builds
  // ==========================================================================
  console.log('--- 1. Docker Containerization & Multi-Stage Builds ---');

  const backendDockerfile = path.join(rootDir, 'apps/backend/Dockerfile');
  assert(fs.existsSync(backendDockerfile), '1.1 apps/backend/Dockerfile exists');

  const backendDockerContent = fs.readFileSync(backendDockerfile, 'utf-8');
  assert(backendDockerContent.includes('AS builder'), '1.1 Backend Dockerfile contains multi-stage AS builder');
  assert(backendDockerContent.includes('AS runner'), '1.1 Backend Dockerfile contains multi-stage AS runner');
  assert(backendDockerContent.includes('USER lms'), '1.1 Backend Dockerfile runs as unprivileged non-root user (lms)');
  assert(backendDockerContent.includes('HEALTHCHECK'), '1.1 Backend Dockerfile defines container HEALTHCHECK instruction');
  assert(backendDockerContent.includes('EXPOSE 3000'), '1.1 Backend Dockerfile exposes standard port 3000');

  const frontendDockerfile = path.join(rootDir, 'apps/frontend/Dockerfile');
  assert(fs.existsSync(frontendDockerfile), '1.2 apps/frontend/Dockerfile exists');

  const frontendDockerContent = fs.readFileSync(frontendDockerfile, 'utf-8');
  assert(frontendDockerContent.includes('AS builder'), '1.2 Frontend Dockerfile contains multi-stage AS builder');
  assert(frontendDockerContent.includes('AS runner'), '1.2 Frontend Dockerfile contains production AS runner');
  assert(frontendDockerContent.includes('nginx:'), '1.2 Frontend Dockerfile uses Nginx Alpine base image for runner');
  assert(frontendDockerContent.includes('HEALTHCHECK'), '1.2 Frontend Dockerfile defines container HEALTHCHECK instruction');
  assert(frontendDockerContent.includes('EXPOSE 80'), '1.2 Frontend Dockerfile exposes HTTP port 80');

  const nginxConf = path.join(rootDir, 'apps/frontend/nginx.conf');
  assert(fs.existsSync(nginxConf), '1.3 apps/frontend/nginx.conf exists');

  const nginxContent = fs.readFileSync(nginxConf, 'utf-8');
  assert(nginxContent.includes('try_files $uri $uri/ /index.html;'), '1.3 Nginx config implements SPA fallback routing');
  assert(nginxContent.includes('gzip on;'), '1.3 Nginx config enables Gzip compression');
  assert(nginxContent.includes('X-Frame-Options "DENY"'), '1.3 Nginx config applies X-Frame-Options security header');
  assert(nginxContent.includes('X-Content-Type-Options "nosniff"'), '1.3 Nginx config applies X-Content-Type-Options');
  assert(nginxContent.includes('proxy_pass http://backend:3000/api/v1/;'), '1.3 Nginx config proxies /api/v1/ to backend container');

  assert(fs.existsSync(path.join(rootDir, '.dockerignore')), '1.4 Root .dockerignore exists');
  assert(fs.existsSync(path.join(rootDir, 'apps/backend/.dockerignore')), '1.4 apps/backend/.dockerignore exists');
  assert(fs.existsSync(path.join(rootDir, 'apps/frontend/.dockerignore')), '1.4 apps/frontend/.dockerignore exists');

  // ==========================================================================
  // SECTION 2: Full-Stack Docker Compose Orchestration
  // ==========================================================================
  console.log('\n--- 2. Full-Stack Docker Compose Orchestration ---');

  const composePath = path.join(rootDir, 'docker-compose.yml');
  assert(fs.existsSync(composePath), '2.1 docker-compose.yml exists at monorepo root');

  const composeContent = fs.readFileSync(composePath, 'utf-8');
  assert(composeContent.includes('mongo:'), '2.1 docker-compose.yml declares mongo database service');
  assert(composeContent.includes('backend:'), '2.1 docker-compose.yml declares backend API service');
  assert(composeContent.includes('frontend:'), '2.1 docker-compose.yml declares frontend SPA service');
  assert(composeContent.includes('mongo_data:'), '2.2 docker-compose.yml configures persistent mongo_data volume');
  assert(composeContent.includes('lms-network:'), '2.2 docker-compose.yml defines dedicated bridge network');
  assert(composeContent.includes('condition: service_healthy'), '2.3 docker-compose.yml uses service_healthy dependency gating');

  // ==========================================================================
  // SECTION 3: Environment Configuration & Secret Leakage Prevention
  // ==========================================================================
  console.log('\n--- 3. Environment Configuration & Secret Leakage Prevention ---');

  assert(fs.existsSync(path.join(rootDir, '.env.example')), '3.1 Root .env.example exists');
  assert(fs.existsSync(path.join(rootDir, 'apps/backend/.env.example')), '3.1 apps/backend/.env.example exists');
  assert(fs.existsSync(path.join(rootDir, 'apps/frontend/.env.example')), '3.1 apps/frontend/.env.example exists');

  const gitignoreContent = fs.readFileSync(path.join(rootDir, '.gitignore'), 'utf-8');
  assert(gitignoreContent.includes('.env'), '3.2 .gitignore ignores local .env files');
  assert(gitignoreContent.includes('*.pem'), '3.2 .gitignore ignores cryptographic certificates and keys');

  // ==========================================================================
  // SECTION 4: Backend Production Hardening & Health Endpoints
  // ==========================================================================
  console.log('\n--- 4. Backend Production Hardening & Health Endpoints ---');

  const appSource = fs.readFileSync(path.join(rootDir, 'apps/backend/src/app.ts'), 'utf-8');
  assert(appSource.includes('helmet()'), '4.1 Helmet security headers middleware is active in app.ts');
  assert(appSource.includes('limit: \'100kb\''), '4.1 Request payload size limit (100kb) is enforced');
  assert(appSource.includes('cors('), '4.1 CORS middleware is configured');

  const serverSource = fs.readFileSync(path.join(rootDir, 'apps/backend/src/server.ts'), 'utf-8');
  assert(serverSource.includes('SIGTERM'), '4.2 SIGTERM graceful shutdown handler is registered in server.ts');
  assert(serverSource.includes('SIGINT'), '4.2 SIGINT graceful shutdown handler is registered in server.ts');
  assert(serverSource.includes('disconnectDatabase()'), '4.2 Graceful shutdown cleanly disconnects database');

  const errorMiddlewareSource = fs.readFileSync(
    path.join(rootDir, 'apps/backend/src/middleware/error.middleware.ts'),
    'utf-8',
  );
  assert(
    errorMiddlewareSource.includes('env.NODE_ENV === \'production\''),
    '4.3 Error middleware censors internal error details in production',
  );

  // Live HTTP Probe Testing over ephemeral server
  const testApp = createApp();
  const testServer = http.createServer(testApp);
  await new Promise<void>((resolve) => testServer.listen(0, '127.0.0.1', () => resolve()));
  const port = (testServer.address() as AddressInfo).port;
  const loopback = `http://127.0.0.1:${port}`;

  try {
    const livenessRes = await fetch(`${loopback}/healthz`);
    const livenessData = (await livenessRes.json()) as { status: string };
    assert(livenessRes.status === 200 && livenessData.status === 'UP', '4.4 /healthz liveness probe returns 200 UP');

    const readinessRes = await fetch(`${loopback}/api/v1/health`);
    const readinessData = (await readinessRes.json()) as { status: string; service: string };
    assert(readinessRes.status === 200 && readinessData.service === 'lms-backend', '4.4 /api/v1/health readiness probe returns 200 with service metadata');

    const apiRootRes = await fetch(`${loopback}/api/v1`);
    const apiRootData = (await apiRootRes.json()) as { status: string; name: string };
    assert(apiRootRes.status === 200 && apiRootData.name.includes('Library Management System'), '4.4 /api/v1 root metadata endpoint operational');
  } finally {
    testServer.close();
  }

  // ==========================================================================
  // SECTION 5: Frontend Production Build Verification
  // ==========================================================================
  console.log('\n--- 5. Frontend Production Build Verification ---');

  const frontendDist = path.join(rootDir, 'apps/frontend/dist');
  assert(fs.existsSync(frontendDist), '5.1 apps/frontend/dist output directory exists');

  const indexHtml = path.join(frontendDist, 'index.html');
  assert(fs.existsSync(indexHtml), '5.1 apps/frontend/dist/index.html production entry point exists');

  const assetsDir = path.join(frontendDist, 'assets');
  assert(fs.existsSync(assetsDir), '5.2 apps/frontend/dist/assets bundled assets directory exists');

  const assetFiles = fs.readdirSync(assetsDir);
  const hasHashedJs = assetFiles.some((f) => f.endsWith('.js') && f.includes('-'));
  const hasHashedCss = assetFiles.some((f) => f.endsWith('.css') && f.includes('-'));
  assert(hasHashedJs, '5.2 JavaScript bundle uses immutable content hashing');
  assert(hasHashedCss, '5.2 CSS bundle uses immutable content hashing');

  // ==========================================================================
  // SECTION 6: CI/CD Pipeline Configuration
  // ==========================================================================
  console.log('\n--- 6. CI/CD Pipeline Configuration ---');

  const ciWorkflow = path.join(rootDir, '.github/workflows/ci.yml');
  assert(fs.existsSync(ciWorkflow), '6.1 .github/workflows/ci.yml workflow file exists');

  const ciContent = fs.readFileSync(ciWorkflow, 'utf-8');
  assert(ciContent.includes('backend:lint'), '6.1 CI workflow executes backend linting');
  assert(ciContent.includes('backend:build'), '6.1 CI workflow executes backend compilation');
  assert(ciContent.includes('test:unit'), '6.1 CI workflow executes backend unit tests');
  assert(ciContent.includes('frontend:lint'), '6.1 CI workflow executes frontend linting');
  assert(ciContent.includes('frontend:build'), '6.1 CI workflow executes frontend production build');
  assert(ciContent.includes('frontend:test'), '6.1 CI workflow executes frontend tests');
  assert(ciContent.includes('format:check'), '6.1 CI workflow enforces Prettier code style');
  assert(ciContent.includes('test-stage8.ts'), '6.2 CI workflow executes Stage 8 loopback regression');
  assert(ciContent.includes('test-stage9.ts'), '6.2 CI workflow executes Stage 9 DevOps verification');

  // ==========================================================================
  // SECTION 7: Deployment Documentation
  // ==========================================================================
  console.log('\n--- 7. Deployment Documentation ---');

  const deployGuide = path.join(rootDir, 'docs/deployment/DEPLOYMENT_GUIDE.md');
  assert(fs.existsSync(deployGuide), '7.1 docs/deployment/DEPLOYMENT_GUIDE.md exists');

  const guideContent = fs.readFileSync(deployGuide, 'utf-8');
  assert(guideContent.includes('docker compose up'), '7.1 Deployment guide covers Docker Compose orchestration');
  assert(guideContent.includes('JWT_SECRET'), '7.1 Deployment guide documents environment variables and secrets');
  assert(guideContent.includes('Troubleshooting Common Issues'), '7.1 Deployment guide includes troubleshooting manual');

  const readmeContent = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf-8');
  assert(readmeContent.includes('DEPLOYMENT_GUIDE.md'), '7.2 Root README.md references the deployment guide');
  assert(readmeContent.includes('docker compose up'), '7.2 Root README.md includes quickstart command');

  console.log('\n================================================================');
  console.log(`  STAGE 9 VERIFICATION RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStage9DevOpsSuite().catch((err) => {
  console.error('Unhandled fatal error in Stage 9 verification suite:', err);
  process.exit(1);
});
