#!/usr/bin/env node
// Run from repo root: node inject-auth-guard.js
// Injects auth guard into all protected pages (skips login.html, index.html)

const fs = require('fs');
const path = require('path');

const PROTECTED_PAGES = [
  'dashboard.html',
  'intake.html',
  'module1.html',
  'module2.html',
  'module3.html',
  'module4.html',
  'module5.html',
  'module6.html',
  'module7.html',
  'module8.html',
  'cce.html',
  'personality-assessment.html',
  'sales-roleplay.html',
  'self-advocacy.html',
];

const AUTH_GUARD = `  <!-- AUTH GUARD -->
  <script>
    (async function() {
      try {
        const res = await fetch('/api/verify');
        if (!res.ok) throw new Error('not authenticated');
        const data = await res.json();
        if (!data.authenticated) throw new Error('not authenticated');
        window.BU_USER = { name: data.name, email: data.email };
      } catch(e) {
        window.location.href = '/login.html';
      }
    })();
  </script>`;

let injected = 0;
let skipped = 0;

for (const file of PROTECTED_PAGES) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Not found: ${file}`);
    skipped++;
    continue;
  }

  let html = fs.readFileSync(filePath, 'utf8');

  // Skip if already injected
  if (html.includes('AUTH GUARD')) {
    console.log(`⏭️  Already has auth guard: ${file}`);
    skipped++;
    continue;
  }

  // Inject right after <head>
  if (html.includes('<head>')) {
    html = html.replace('<head>', `<head>\n${AUTH_GUARD}`);
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✅ Injected: ${file}`);
    injected++;
  } else {
    console.log(`⚠️  No <head> tag found: ${file}`);
    skipped++;
  }
}

console.log(`\nDone: ${injected} injected, ${skipped} skipped`);
