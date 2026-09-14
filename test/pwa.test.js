import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

test('PWA Manifest: Proper scope, standalone display, and valid icons for GitHub Pages subpath', () => {
  const manifestPath = path.resolve('public/manifest.json');
  assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist in public directory');

  const content = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.strictEqual(content.display, 'standalone', 'Manifest display must be standalone');
  assert.strictEqual(content.start_url, './', 'start_url must be relative for /app/ subpath compatibility');
  assert.strictEqual(content.scope, './', 'scope must be relative for /app/ subpath compatibility');
  assert.strictEqual(content.theme_color, '#0284c7', 'Theme color should match brand cyan-600');

  assert.ok(Array.isArray(content.icons) && content.icons.length >= 2, 'Manifest must provide at least 192x192 and 512x512 icons');
  const has192 = content.icons.some((i) => i.sizes === '192x192');
  const has512 = content.icons.some((i) => i.sizes === '512x512');
  assert.ok(has192 && has512, 'Must include both 192x192 and 512x512 icons');
});

test('Service Worker: Precache shell, strict Supabase/Turnstile bypass, and Push support', () => {
  const swPath = path.resolve('public/sw.js');
  assert.ok(fs.existsSync(swPath), 'public/sw.js must exist');

  const swContent = fs.readFileSync(swPath, 'utf8');
  assert.ok(swContent.includes('CACHE_VERSION'), 'Service worker must be versioned');
  assert.ok(swContent.includes('supabase'), 'Must strictly bypass cache for Supabase endpoints');
  assert.ok(swContent.includes('cloudflare'), 'Must strictly bypass cache for Cloudflare Turnstile');
  assert.ok(swContent.includes('SKIP_WAITING'), 'Must support user-controlled SKIP_WAITING message');
  assert.ok(swContent.includes('addEventListener(\'push\''), 'Must implement push event listener');
  assert.ok(swContent.includes('addEventListener(\'notificationclick\''), 'Must implement notificationclick event listener');
});

test('Index HTML: Viewport fit cover and Apple Mobile Web App meta tags', () => {
  const indexPath = path.resolve('index.html');
  const indexContent = fs.readFileSync(indexPath, 'utf8');

  assert.ok(indexContent.includes('viewport-fit=cover'), 'Viewport must include viewport-fit=cover for edge-to-edge mobile UI');
  assert.ok(indexContent.includes('apple-mobile-web-app-capable'), 'Must declare apple-mobile-web-app-capable for iOS PWA');
  assert.ok(indexContent.includes('apple-mobile-web-app-status-bar-style'), 'Must declare status bar style');
  assert.ok(indexContent.includes('href="./manifest.json"'), 'Manifest link must be relative');
});

test('Database Schema: push_subscriptions table and notification read timestamps', () => {
  const schemaPath = path.resolve('supabase_schema.sql');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');

  assert.ok(schemaContent.includes('public.push_subscriptions'), 'Must define public.push_subscriptions table');
  assert.ok(schemaContent.includes('read_at TIMESTAMPTZ'), 'Must include read_at timestamp in notifications');
  assert.ok(schemaContent.includes('ENABLE ROW LEVEL SECURITY'), 'Must enable RLS on push_subscriptions');
});
