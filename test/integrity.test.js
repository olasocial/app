import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('CI/CD and Runtime: Node.js 22 LTS compatibility', () => {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  assert.ok(packageJson.engines, 'package.json should specify engines');
  assert.match(packageJson.engines.node, /22/, 'Engine must target Node 22');
});

test('Super Admin Configuration: casinoconquistado@gmail.com is designated primary admin', () => {
  const supabaseClient = fs.readFileSync('./src/services/supabaseClient.ts', 'utf8');
  assert.ok(
    supabaseClient.includes('casinoconquistado@gmail.com'),
    'supabaseClient must reference casinoconquistado@gmail.com as ADMIN_PRIMARY_EMAIL'
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
    schemaSql.includes('casinoconquistado@gmail.com'),
    'SQL schema must have trigger for casinoconquistado@gmail.com'
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
