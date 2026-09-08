/**
 * Cloud-Native Library Management System (LMS)
 * Stage 10 Master Production Validation & Quality Assurance Runner
 *
 * Orchestrates:
 * 1. Security Verification Suite (14 vectors: Auth bypass, RBAC, JWT tampering/expiry, rate limit, etc.)
 * 2. API Performance Benchmark Suite (5 endpoints: p50/p95/p99 latency, RPS, 0% error rate)
 * 3. Accessibility & WCAG 2.2 AA Audit Suite (focus visible, skip-link, ARIA, color contrast)
 * 4. Full End-to-End Validation Suite (9-step Patron journey + 9-step Admin journey)
 */

import { spawnSync } from 'child_process';
import path from 'path';

interface SuiteResult {
  name: string;
  file: string;
  durationMs: number;
  success: boolean;
  exitCode: number | null;
}

const suites = [
  {
    name: 'Security Verification Suite (14 Attack & Control Vectors)',
    file: 'test-stage10-security.ts',
  },
  {
    name: 'API Performance Benchmark Suite (5 Key Endpoints Load Test)',
    file: 'test-stage10-performance.ts',
  },
  {
    name: 'Accessibility & WCAG 2.2 AA Compliance Audit',
    file: 'test-stage10-accessibility.ts',
  },
  {
    name: 'End-to-End Multi-Role User Journey Validation (18 Steps)',
    file: 'test-stage10-e2e.ts',
  },
];

async function runStage10Master() {
  console.log('################################################################');
  console.log('  STAGE 10: MASTER PRODUCTION VALIDATION & ASSURANCE RUNNER');
  console.log('################################################################\n');

  const rootDir = path.resolve(__dirname, '..');
  const results: SuiteResult[] = [];
  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

  for (let i = 0; i < suites.length; i++) {
    const suite = suites[i];
    const relScriptPath = `scripts/${suite.file}`;
    console.log(`\n>>> [${i + 1}/${suites.length}] Executing ${suite.name}...`);
    console.log(`    Target: ${suite.file}`);

    const startTime = Date.now();
    const child = spawnSync(npxCmd, ['tsx', relScriptPath], {
      stdio: 'inherit',
      cwd: rootDir,
      shell: true,
    });
    const durationMs = Date.now() - startTime;

    const success = child.status === 0;
    results.push({
      name: suite.name,
      file: suite.file,
      durationMs,
      success,
      exitCode: child.status,
    });

    if (!success) {
      console.error(`\n[ERROR] ${suite.name} exited with status ${child.status}`);
    }
  }

  // Consolidated Summary Report
  console.log('\n================================================================');
  console.log('  STAGE 10 CONSOLIDATED VALIDATION REPORT');
  console.log('================================================================');
  console.log(
    'Suite Name'.padEnd(58) +
      'Duration'.padEnd(12) +
      'Status'.padEnd(10),
  );
  console.log('--------------------------------------------------------------------------------');

  let allPassed = true;
  for (const res of results) {
    const statusStr = res.success ? '✓ PASSED' : '✗ FAILED';
    if (!res.success) allPassed = false;
    const durStr = `${(res.durationMs / 1000).toFixed(2)}s`;
    console.log(
      res.name.padEnd(58) +
        durStr.padEnd(12) +
        statusStr.padEnd(10),
    );
  }

  console.log('================================================================');
  if (allPassed) {
    console.log('🎉 ALL STAGE 10 PRODUCTION VALIDATION GATES PASSED SUCCESSFULLY!');
    console.log('================================================================\n');
    process.exit(0);
  } else {
    console.error('❌ ONE OR MORE STAGE 10 QUALITY GATES FAILED!');
    console.log('================================================================\n');
    process.exit(1);
  }
}

runStage10Master();
