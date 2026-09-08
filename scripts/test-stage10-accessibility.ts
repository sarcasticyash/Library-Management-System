/**
 * Cloud-Native Library Management System (LMS)
 * Stage 10 Automated Accessibility & WCAG 2.2 AA Verification Suite
 *
 * Verifies critical frontend accessibility requirements:
 * 1. WCAG 2.2 AA visible focus indicators (:focus-visible)
 * 2. Keyboard navigation & Skip link to #main-content
 * 3. Form input label association (htmlFor, aria-invalid, aria-describedby, role="alert")
 * 4. Modal dialog accessibility (role="dialog", aria-modal, aria-labelledby, escape key, focus management)
 * 5. Error message accessibility (role="alert", aria-live="assertive")
 * 6. Color contrast ratio calculations across dark slate design tokens
 * 7. Keyboard navigation shortcut keys
 */

import fs from 'fs';
import path from 'path';

// Helper: Compute relative luminance per WCAG 2.2
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * (rs ?? 0) + 0.7152 * (gs ?? 0) + 0.0722 * (bs ?? 0);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace('#', '').trim();
  const num = parseInt(cleaned, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

async function runAccessibilitySuite(): Promise<void> {
  console.log('================================================================');
  console.log('  STAGE 10: AUTOMATED ACCESSIBILITY & WCAG 2.2 AA AUDIT');
  console.log('================================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, description: string): void {
    if (condition) {
      console.log(`  ✓ PASS: ${description}`);
      passedTests++;
    } else {
      console.error(`  ✗ FAIL: ${description}`);
      failedTests++;
    }
  }

  const workspaceRoot = path.resolve(__dirname, '..');
  const frontendSrc = path.join(workspaceRoot, 'apps', 'frontend', 'src');

  // --- 1. WCAG 2.2 AA Visible Focus Indicators ---
  console.log('--- 1. Visible Focus Indicators ---');
  const indexCss = fs.readFileSync(path.join(frontendSrc, 'styles', 'index.css'), 'utf-8');
  assert(indexCss.includes(':focus-visible'), 'CSS contains explicit :focus-visible ruleset');
  assert(
    indexCss.includes('outline:') && indexCss.includes('outline-offset:'),
    'Focus visible rule defines distinct outline and outline-offset',
  );

  // --- 2. Keyboard Navigation & Skip Link ---
  console.log('\n--- 2. Keyboard Navigation & Skip Link ---');
  const appLayoutTsx = fs.readFileSync(
    path.join(frontendSrc, 'components', 'layout', 'AppLayout.tsx'),
    'utf-8',
  );
  assert(
    appLayoutTsx.includes('href="#main-content"') && appLayoutTsx.includes('className="skip-link"'),
    'AppLayout contains WCAG skip-link targeting #main-content',
  );
  assert(
    appLayoutTsx.includes('id="main-content"') && appLayoutTsx.includes('tabIndex={-1}'),
    'Main content container specifies id="main-content" with tabIndex={-1} for focus retention',
  );

  const catalogPageTsx = fs.readFileSync(
    path.join(frontendSrc, 'pages', 'public', 'CatalogPage.tsx'),
    'utf-8',
  );
  assert(
    catalogPageTsx.includes("e.key === '/'") && catalogPageTsx.includes('focus()'),
    'Catalog page supports keyboard shortcut ("/" key) to focus search bar',
  );

  // --- 3. Form Input Label Association & Validation States ---
  console.log('\n--- 3. Form Labels & Input Accessibility ---');
  const inputTsx = fs.readFileSync(
    path.join(frontendSrc, 'components', 'common', 'Input.tsx'),
    'utf-8',
  );
  assert(
    inputTsx.includes('htmlFor={inputId}') && inputTsx.includes('id={inputId}'),
    'Input component binds <label htmlFor> to <input id>',
  );
  assert(
    inputTsx.includes('aria-invalid={!!error}'),
    'Input component applies aria-invalid based on validation state',
  );
  assert(
    inputTsx.includes('aria-describedby='),
    'Input component applies aria-describedby pointing to error descriptor',
  );
  assert(
    inputTsx.includes('role="alert"'),
    'Input error messages declare role="alert" for immediate screen reader announcement',
  );

  // --- 4. Modal Dialog Accessibility ---
  console.log('\n--- 4. Modal Dialog Accessibility ---');
  const modalTsx = fs.readFileSync(
    path.join(frontendSrc, 'components', 'common', 'Modal.tsx'),
    'utf-8',
  );
  assert(modalTsx.includes('role="dialog"'), 'Modal declares role="dialog"');
  assert(modalTsx.includes('aria-modal="true"'), 'Modal declares aria-modal="true"');
  assert(modalTsx.includes('aria-labelledby='), 'Modal binds aria-labelledby to dialog title');
  assert(modalTsx.includes('aria-label="Close dialog"'), 'Modal close button has descriptive aria-label');
  assert(modalTsx.includes("e.key === 'Escape'"), 'Modal supports keyboard dismissal via Escape key');
  assert(
    modalTsx.includes('focus()'),
    'Modal manages focus upon opening for keyboard navigation',
  );

  // --- 5. Error Message Accessibility ---
  console.log('\n--- 5. Error Message Accessibility ---');
  const errorAlertTsx = fs.readFileSync(
    path.join(frontendSrc, 'components', 'ui', 'ErrorAlert.tsx'),
    'utf-8',
  );
  assert(errorAlertTsx.includes('role="alert"'), 'ErrorAlert declares role="alert"');
  assert(
    errorAlertTsx.includes('aria-live="assertive"'),
    'ErrorAlert declares aria-live="assertive" for high-priority announcements',
  );
  assert(
    errorAlertTsx.includes('AlertCircle'),
    'ErrorAlert includes visual icon non-reliant on color alone',
  );

  // --- 6. Color Contrast Ratios (WCAG 2.2 AA / AAA) ---
  console.log('\n--- 6. Color Contrast Analysis (Design Tokens) ---');
  // Design Tokens: Canvas: #0b1120, Text Primary: #f8fafc, Text Secondary: #94a3b8, Primary 400: #38bdf8, Danger 400: #f87171
  const bgCanvas = '#0b1120';
  const textPrimary = '#f8fafc';
  const textSecondary = '#94a3b8';
  const primaryAccent = '#38bdf8';
  const dangerAccent = '#f87171';
  const buttonTextDark = '#0f172a';

  const ratioPrimary = getContrastRatio(textPrimary, bgCanvas);
  const ratioSecondary = getContrastRatio(textSecondary, bgCanvas);
  const ratioAccent = getContrastRatio(primaryAccent, bgCanvas);
  const ratioDanger = getContrastRatio(dangerAccent, bgCanvas);
  const ratioButton = getContrastRatio(buttonTextDark, primaryAccent);

  console.log(`    Primary Text (${textPrimary} on ${bgCanvas}): ${ratioPrimary.toFixed(2)}:1`);
  assert(ratioPrimary >= 7.0, 'Primary text contrast exceeds WCAG AAA standard (>= 7.0:1)');

  console.log(`    Secondary Text (${textSecondary} on ${bgCanvas}): ${ratioSecondary.toFixed(2)}:1`);
  assert(ratioSecondary >= 4.5, 'Secondary text contrast exceeds WCAG AA standard (>= 4.5:1)');

  console.log(`    Primary Accent (${primaryAccent} on ${bgCanvas}): ${ratioAccent.toFixed(2)}:1`);
  assert(ratioAccent >= 4.5, 'Primary accent contrast exceeds WCAG AA standard (>= 4.5:1)');

  console.log(`    Danger Accent (${dangerAccent} on ${bgCanvas}): ${ratioDanger.toFixed(2)}:1`);
  assert(ratioDanger >= 4.5, 'Danger accent contrast exceeds WCAG AA standard (>= 4.5:1)');

  console.log(`    Button Primary Text (${buttonTextDark} on ${primaryAccent}): ${ratioButton.toFixed(2)}:1`);
  assert(ratioButton >= 7.0, 'Button primary text contrast exceeds WCAG AAA standard (>= 7.0:1)');

  console.log('\n================================================================');
  console.log(`  STAGE 10 ACCESSIBILITY AUDIT: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAccessibilitySuite().catch((err) => {
  console.error('Fatal error in accessibility audit suite:', err);
  process.exit(1);
});
