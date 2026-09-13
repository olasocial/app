import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('CI/CD and Runtime: Node.js 22 LTS compatibility', () => {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  assert.ok(packageJson.engines, 'package.json should specify engines');
  assert.match(packageJson.engines.node, /22/, 'Engine must target Node 22');
});

test('Super Admin Configuration: v19629049@gmail.com is designated primary admin', () => {
  const supabaseClient = fs.readFileSync('./src/services/supabaseClient.ts', 'utf8');
  assert.ok(
    supabaseClient.includes('v19629049@gmail.com'),
    'supabaseClient must reference v19629049@gmail.com as ADMIN_PRIMARY_EMAIL'
  );
  const authContext = fs.readFileSync('./src/context/AuthContext.tsx', 'utf8');
  assert.ok(
    authContext.includes('SUPER_ADMIN'),
    'AuthContext must designate SUPER_ADMIN role'
  );
});

test('Database Schema: SQL schema includes immutable admin triggers and RLS', () => {
  const schemaSql = fs.readFileSync('./supabase_schema.sql', 'utf8');
  assert.ok(
    schemaSql.includes('v19629049@gmail.com'),
    'SQL schema must have trigger for v19629049@gmail.com'
  );
  assert.ok(
    schemaSql.includes('ROW LEVEL SECURITY'),
    'SQL schema must enforce Row Level Security'
  );
  assert.ok(
    schemaSql.includes('protect_super_admin'),
    'SQL schema must have protect_super_admin trigger'
  );
});

test('Security & Verification: Cloudflare Turnstile bot protection present', () => {
  const turnstileService = fs.readFileSync('./src/services/turnstileService.ts', 'utf8');
  assert.ok(
    turnstileService.includes('TURNSTILE'),
    'Turnstile service must be present'
  );
  const turnstileWidget = fs.readFileSync('./src/components/TurnstileWidget.tsx', 'utf8');
  assert.ok(
    turnstileWidget.includes('turnstile'),
    'TurnstileWidget component must exist'
  );
});

test('Codebase Cleanliness: Zero Math.random mock simulation in core context', () => {
  const olaContext = fs.readFileSync('./src/context/OlaSocialContext.tsx', 'utf8');
  assert.strictEqual(
    olaContext.includes('Math.random() *'),
    false,
    'OlaSocialContext should not have random mock number simulations'
  );
});

test('Supabase Connection: Production project URL and publishable key configured', () => {
  const supabaseClient = fs.readFileSync('./src/services/supabaseClient.ts', 'utf8');
  assert.ok(
    supabaseClient.includes('https://ocyjnplyywvctqikjrrh.supabase.co'),
    'supabaseClient must target production Supabase project https://ocyjnplyywvctqikjrrh.supabase.co'
  );
  assert.ok(
    supabaseClient.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'),
    'supabaseClient must use the real Supabase anon key'
  );
});

test('Security Audit: Zero service_role or Turnstile secret keys exposed in client code', () => {
  const srcFiles = fs.readdirSync('./src', { recursive: true });
  for (const file of srcFiles) {
    const fullPath = path.join('./src', file);
    if (fs.statSync(fullPath).isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.strictEqual(
        content.includes('service_role'),
        false,
        `File ${fullPath} must not contain service_role`
      );
      assert.strictEqual(
        content.includes('TURNSTILE_SECRET_KEY'),
        false,
        `File ${fullPath} must not contain TURNSTILE_SECRET_KEY`
      );
    }
  }
});

test('OAuth Path Handling: Redirect preserves GitHub Pages base path', () => {
  const authContext = fs.readFileSync('./src/context/AuthContext.tsx', 'utf8');
  assert.ok(
    authContext.includes('pathname'),
    'AuthContext must use pathname in redirectTo for subpath hosting (/app/)'
  );
});

test('Database Hardening: is_admin uses search_path and prevents privilege escalation', () => {
  const schema = fs.readFileSync('./supabase_schema.sql', 'utf8');
  assert.ok(
    schema.includes('SET search_path = public, pg_temp'),
    'is_admin and security definer functions must set search_path'
  );
  assert.ok(
    schema.includes('prevent_profile_privilege_escalation'),
    'Schema must have a privilege escalation prevention trigger on profiles'
  );
  assert.ok(
    schema.includes('Audit logs insert controlled'),
    'Audit logs must not have unrestricted WITH CHECK (true) insertion'
  );
});


