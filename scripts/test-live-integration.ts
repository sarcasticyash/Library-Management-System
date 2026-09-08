/**
 * Cloud-Native Library Management System (LMS)
 * Live Frontend SPA & Proxy End-to-End Functional Test Suite
 *
 * Verifies live execution against http://localhost:5173:
 * 1. SPA Routing & Fallback on 12 critical deep URLs
 * 2. Reverse Proxy forwarding /api/v1 to http://localhost:3000
 * 3. Complete 9-step Patron user flow through frontend proxy
 * 4. Complete 9-step Admin governance flow through frontend proxy
 */

import axios from 'axios';

let passed = 0;
let failed = 0;

function assert(cond: boolean, desc: string) {
  if (cond) {
    passed++;
    console.log(`  ✓ PASS: ${desc}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${desc}`);
  }
}

async function runLiveProxyVerification() {
  console.log('================================================================');
  console.log('  LIVE FRONTEND SPA & PROXY FUNCTIONAL VERIFICATION');
  console.log('  Base URL: http://localhost:5173');
  console.log('================================================================\n');

  const frontendBase = 'http://localhost:5173';
  const apiBase = `${frontendBase}/api/v1`;

  // ==========================================================================
  // SECTION 1: SPA Deep Routing & Fallback Verification
  // ==========================================================================
  console.log('--- 1. SPA Deep Route Direct Refresh Verification ---');
  const spaRoutes = [
    '/',
    '/catalog',
    '/books/000000000000000000000001',
    '/login',
    '/register',
    '/active-loans',
    '/history',
    '/profile',
    '/admin/dashboard',
    '/admin/books',
    '/admin/users',
    '/admin/circulation',
    '/admin/audit-logs',
  ];

  for (const route of spaRoutes) {
    try {
      const res = await axios.get(`${frontendBase}${route}`, {
        headers: { Accept: 'text/html' },
      });
      const isHtml = typeof res.data === 'string' && res.data.includes('<div id="root"></div>');
      assert(res.status === 200 && isHtml, `SPA Direct Refresh: ${route} returns 200 with index.html`);
    } catch (err) {
      assert(false, `SPA Direct Refresh: ${route} failed with ${(err as Error).message}`);
    }
  }

  // ==========================================================================
  // SECTION 2: API Reverse Proxy Connectivity
  // ==========================================================================
  console.log('\n--- 2. Frontend-to-Backend Reverse Proxy Connectivity ---');
  try {
    const healthRes = await axios.get(`${apiBase}/health`);
    assert(healthRes.status === 200, 'Frontend proxy forwards GET /api/v1/health successfully');
    assert(healthRes.data.status === 'UP', 'Backend health reports status: UP through frontend');
  } catch (err) {
    assert(false, `Reverse proxy health check failed: ${(err as Error).message}`);
  }

  // ==========================================================================
  // SECTION 3: Complete Patron Journey via Frontend
  // ==========================================================================
  console.log('\n--- 3. Live Patron User Journey via Frontend Proxy ---');
  const patronClient = axios.create({ baseURL: apiBase, withCredentials: true });

  // 3.1 Self Registration
  const randomEmail = `patron.${Date.now()}@test.com`;
  const regRes = await patronClient.post('/auth/register', {
    email: randomEmail,
    password: 'Password123!Secure',
    firstName: 'Live',
    lastName: 'Patron',
  });
  assert(regRes.status === 201, 'Patron self-registration succeeded (201 Created)');
  assert(regRes.data.email === randomEmail, 'Registered user email matches');

  // 3.2 Login with seeded patron
  const loginRes = await patronClient.post('/auth/login', {
    email: 'patron@lms.local',
    password: 'Patron123!Secure',
  });
  assert(loginRes.status === 200, 'Patron login succeeded (200 OK)');
  const patronToken = loginRes.data.accessToken;
  assert(typeof patronToken === 'string' && patronToken.length > 20, 'Bearer access token received');
  patronClient.defaults.headers.common['Authorization'] = `Bearer ${patronToken}`;

  // 3.3 Catalog Search & Filter
  const searchRes = await patronClient.get('/books?q=Clean&genre=Technology');
  assert(searchRes.status === 200, 'Catalog search returned 200 OK');
  assert(Array.isArray(searchRes.data.data) && searchRes.data.data.length >= 1, 'Search results include matching title');

  // 3.4 View Book Detail
  const bookId = '000000000000000000000002'; // Clean Architecture
  const detailRes = await patronClient.get(`/books/${bookId}`);
  assert(detailRes.status === 200, 'Book details retrieved successfully');
  assert(detailRes.data.title.includes('Clean Architecture'), 'Book title matches expected metadata');

  // 3.5 Borrow Book
  const borrowRes = await patronClient.post('/borrowings', { bookId });
  assert(borrowRes.status === 201, 'Book checkout successful (201 Created)');
  const newLoanId = borrowRes.data.id;

  // 3.6 Active Loans Oversight
  const activeRes = await patronClient.get('/borrowings/my-active');
  assert(activeRes.status === 200, 'Active loans query returned 200 OK');
  assert(activeRes.data.totalActiveLoans >= 1, 'Active loan quota incremented');

  // 3.7 Return Book
  const returnRes = await patronClient.post(`/borrowings/${newLoanId}/return`);
  assert(returnRes.status === 200, 'Book return completed (200 OK)');
  assert(returnRes.data.status === 'RETURNED', 'Loan status updated to RETURNED');

  // 3.8 Borrow another book for admin override testing
  const overrideTargetRes = await patronClient.post('/borrowings', {
    bookId: '000000000000000000000003', // Site Reliability Engineering
  });
  const overrideLoanId = overrideTargetRes.data.id;

  // 3.9 Borrowing History
  const histRes = await patronClient.get('/borrowings/my-history?page=1&limit=10');
  assert(histRes.status === 200, 'Borrowing history retrieved');
  assert(Array.isArray(histRes.data.data) && histRes.data.data.length >= 1, 'History contains returned transaction');

  // 3.10 Patron Logout
  const logoutRes = await patronClient.post('/auth/logout');
  assert(logoutRes.status === 204, 'Patron logout successful (204 No Content)');

  // ==========================================================================
  // SECTION 4: Complete Administrator Journey via Frontend
  // ==========================================================================
  console.log('\n--- 4. Live Administrator Governance Journey via Frontend Proxy ---');
  const adminClient = axios.create({ baseURL: apiBase, withCredentials: true });

  // 4.1 Admin Login
  const adminLoginRes = await adminClient.post('/auth/login', {
    email: 'admin@lms.local',
    password: 'Admin123!Secure',
  });
  assert(adminLoginRes.status === 200, 'Administrator login succeeded');
  const adminToken = adminLoginRes.data.accessToken;
  adminClient.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;

  // 4.2 Dashboard KPIs
  const kpiRes = await adminClient.get('/admin/dashboard/kpis');
  assert(kpiRes.status === 200, 'Executive KPIs retrieved');
  assert(kpiRes.data.catalog.totalTitles >= 5, 'KPI reports catalog titles >= 5');
  assert(kpiRes.data.users.totalRegisteredUsers >= 2, 'KPI reports registered users >= 2');

  // 4.3 Administrative Book Creation
  const newBookIsbn = `978${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  const createBookRes = await adminClient.post('/admin/books', {
    title: 'Cloud Native Go',
    author: 'Matthew Titmus',
    isbn: newBookIsbn,
    genre: 'Technology',
    description: 'Building reliable services in Go for cloud environments.',
    publisher: "O'Reilly Media",
    publicationYear: 2021,
    totalCopies: 6,
    location: { aisle: 'D1', shelf: 'S2' },
  });
  assert(createBookRes.status === 201, 'Admin title creation succeeded');
  const createdBookId = createBookRes.data.id;

  // 4.4 Book Inventory Update
  const updateBookRes = await adminClient.put(`/admin/books/${createdBookId}`, {
    totalCopies: 8,
  });
  assert(updateBookRes.status === 200, 'Admin inventory update succeeded');
  assert(updateBookRes.data.totalCopies === 8, 'Total copies updated to 8');

  // 4.5 System Circulation Oversight
  const adminCircRes = await adminClient.get('/admin/borrowings?page=1&limit=10');
  assert(adminCircRes.status === 200, 'System borrowings log retrieved');

  // 4.6 Return Override
  const overrideRes = await adminClient.post(`/admin/borrowings/${overrideLoanId}/return-override`, {
    adminRemarks: 'Administrative early return override during manual QA audit.',
  });
  assert(overrideRes.status === 200, 'Return override succeeded');
  assert(overrideRes.data.status === 'RETURNED', 'Override transitioned loan to RETURNED');

  // 4.7 User Management: Suspend and Reactivate
  const suspendRes = await adminClient.patch('/admin/users/000000000000000000000002/status', {
    status: 'SUSPENDED',
    reason: 'Account temporarily suspended during manual QA security verification.',
  });
  assert(suspendRes.status === 200, 'Admin suspended patron account');
  assert(suspendRes.data.status === 'SUSPENDED', 'Patron status is SUSPENDED');

  const reactivateRes = await adminClient.patch('/admin/users/000000000000000000000002/status', {
    status: 'ACTIVE',
    reason: 'Account reinstated following completion of QA security verification.',
  });
  assert(reactivateRes.status === 200, 'Admin reactivated patron account');
  assert(reactivateRes.data.status === 'ACTIVE', 'Patron status restored to ACTIVE');

  // 4.8 Audit Ledger Stream
  const auditRes = await adminClient.get('/admin/audit-logs?page=1&limit=10');
  assert(auditRes.status === 200, 'Audit log stream retrieved');
  assert(Array.isArray(auditRes.data.data) && auditRes.data.data.length >= 1, 'Audit log contains immutable events');

  // 4.9 Admin Logout
  const adminLogoutRes = await adminClient.post('/auth/logout');
  assert(adminLogoutRes.status === 204, 'Admin logout cleanly completed');

  console.log('\n================================================================');
  console.log(`  LIVE PROXY INTEGRATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runLiveProxyVerification().catch((err) => {
  console.error('Fatal failure in live proxy verification:', err);
  process.exit(1);
});
