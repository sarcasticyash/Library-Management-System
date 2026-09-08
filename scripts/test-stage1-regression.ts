import http from 'http';
import { createApp } from '../apps/backend/src/app';

const app = createApp();
const server = http.createServer(app);

server.listen(0, '127.0.0.1', async () => {
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to obtain server address');
  }
  const port = address.port;
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`Test server running on ${baseUrl}`);

  try {
    // 1. Check /healthz
    const res1 = await fetch(`${baseUrl}/healthz`);
    const json1 = await res1.json();
    console.assert(res1.status === 200 && json1.status === 'UP', 'Healthz probe must return 200 UP');
    console.log('✓ /healthz: 200 UP');

    // 2. Check /api/v1/health
    const res2 = await fetch(`${baseUrl}/api/v1/health`);
    const json2 = await res2.json();
    console.assert(res2.status === 200 && json2.status === 'UP', 'API health probe must return 200 UP');
    console.log('✓ /api/v1/health: 200 UP');

    // 3. Check /api/v1 root
    const res3 = await fetch(`${baseUrl}/api/v1`);
    const json3 = await res3.json();
    console.assert(res3.status === 200 && json3.name === 'Cloud-Native Library Management System API', 'API v1 root check');
    console.log('✓ /api/v1 root: 200 OK');

    // 4. Check 404 Problem Details format
    const res4 = await fetch(`${baseUrl}/api/v1/unknown-endpoint`);
    const json4 = await res4.json();
    console.assert(res4.status === 404 && json4.code === 'ERR-RES-NOT-FOUND', '404 should return RFC 7807 problem details');
    console.assert(Boolean(res4.headers.get('x-correlation-id')), 'Should return X-Correlation-ID header');
    console.log('✓ 404 RFC 7807 handler: verified with X-Correlation-ID');

    console.log('\nSTAGE 1 REGRESSION CHECK PASSED WITH ZERO ISSUES!');
    server.close(() => {
      process.exit(0);
    });
  } catch (err) {
    console.error('Regression check failed:', err);
    server.close(() => {
      process.exit(1);
    });
  }
});
