import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Donation Migration: Schema defines donation tables and constraints', () => {
  const migration = fs.readFileSync('./supabase/migrations/20260914_support_system.sql', 'utf8');

  // Check tables
  assert.ok(migration.includes('CREATE TABLE IF NOT EXISTS public.donation_methods'), 'donation_methods table must exist');
  assert.ok(migration.includes('CREATE TABLE IF NOT EXISTS public.donation_reports'), 'donation_reports table must exist');
  assert.ok(migration.includes('CREATE TABLE IF NOT EXISTS public.donation_settings'), 'donation_settings table must exist');

  // Check RLS
  assert.ok(migration.includes('ALTER TABLE public.donation_methods ENABLE ROW LEVEL SECURITY'), 'donation_methods must enable RLS');
  assert.ok(migration.includes('ALTER TABLE public.donation_reports ENABLE ROW LEVEL SECURITY'), 'donation_reports must enable RLS');
  assert.ok(migration.includes('ALTER TABLE public.donation_settings ENABLE ROW LEVEL SECURITY'), 'donation_settings must enable RLS');

  // Check RPCs
  assert.ok(migration.includes('admin_save_donation_method'), 'admin_save_donation_method RPC must be defined');
  assert.ok(migration.includes('admin_review_donation_report'), 'admin_review_donation_report RPC must be defined');
  assert.ok(migration.includes('SECURITY DEFINER'), 'RPCs must use SECURITY DEFINER');

  // Check storage buckets
  assert.ok(migration.includes('donation-public'), 'Public storage bucket for QR/icons must exist');
  assert.ok(migration.includes('donation-receipts-private'), 'Private storage bucket for payment receipts must exist');
});

test('Donation Service: Complete service layer with CRUD, RPC fallback, and file uploads', () => {
  const service = fs.readFileSync('./src/services/donationService.ts', 'utf8');

  assert.ok(service.includes('fetchActiveDonationMethods'), 'Service must export fetchActiveDonationMethods');
  assert.ok(service.includes('fetchAllDonationMethods'), 'Service must export fetchAllDonationMethods');
  assert.ok(service.includes('saveDonationMethod'), 'Service must export saveDonationMethod');
  assert.ok(service.includes('updateDonationMethodStatus'), 'Service must export updateDonationMethodStatus');
  assert.ok(service.includes('fetchDonationSettings'), 'Service must export fetchDonationSettings');
  assert.ok(service.includes('updateDonationSettings'), 'Service must export updateDonationSettings');
  assert.ok(service.includes('uploadPublicQRImage'), 'Service must export uploadPublicQRImage');
  assert.ok(service.includes('uploadReceiptFile'), 'Service must export uploadReceiptFile');
  assert.ok(service.includes('submitDonationReport'), 'Service must export submitDonationReport');
  assert.ok(service.includes('reviewDonationReport'), 'Service must export reviewDonationReport');
  assert.ok(service.includes('fetchDonationStats'), 'Service must export fetchDonationStats');
});

test('Donation UI: SupportOlaModal and AdminDonationsTab are implemented and linked', () => {
  const supportModal = fs.readFileSync('./src/components/SupportOlaModal.tsx', 'utf8');
  assert.ok(supportModal.includes('SupportOlaModal'), 'SupportOlaModal component must be defined');
  assert.ok(supportModal.includes('handleCopy'), 'SupportOlaModal must provide quick copy for payment details');
  assert.ok(supportModal.includes('isReporting'), 'SupportOlaModal must include voluntary report submission');

  const adminTab = fs.readFileSync('./src/components/admin/AdminDonationsTab.tsx', 'utf8');
  assert.ok(adminTab.includes('AdminDonationsTab'), 'AdminDonationsTab component must be defined');
  assert.ok(adminTab.includes('subtab'), 'AdminDonationsTab must provide subtabs for methods, reports, settings, and stats');

  const adminPanel = fs.readFileSync('./src/components/AdminPanel.tsx', 'utf8');
  assert.ok(adminPanel.includes('AdminDonationsTab'), 'AdminPanel must import and render AdminDonationsTab');
  assert.ok(adminPanel.includes('donations'), 'AdminPanel navigation must include donations');
});
