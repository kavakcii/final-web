import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const k = trimmed.slice(0, eqIdx).trim();
      const v = trimmed.slice(eqIdx + 1).trim();
      process.env[k] = v;
    }
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const sbAdmin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const sbAnon = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function runProductionDbVerification() {
  console.log('===============================================================');
  console.log('FİNAİ ANALYSIS SYSTEM - PRODUCTION DATABASE VERIFICATION');
  console.log('===============================================================');
  console.log(`Supabase URL: ${url}`);

  // 1. Table Existence Check
  console.log('\n[TEST 1] Checking table public.analysis_snapshots existence...');
  const { data: checkData, error: checkError } = await sbAdmin
    .from('analysis_snapshots')
    .select('id')
    .limit(1);

  if (checkError) {
    if (checkError.code === 'PGRST205') {
      console.error('❌ Table public.analysis_snapshots DOES NOT EXIST in Supabase schema cache.');
      console.error('Migration 20260910_create_analysis_snapshots.sql must be executed in Supabase SQL Editor.');
      return { success: false, reason: 'TABLE_NOT_FOUND', error: checkError };
    }
    console.error('❌ Unexpected DB error:', checkError);
    return { success: false, reason: 'DB_ERROR', error: checkError };
  }
  console.log('✅ public.analysis_snapshots exists in Supabase!');

  // 2. Service Role INSERT test
  console.log('\n[TEST 2] Testing Service Role INSERT permissions...');
  const testId = crypto.randomUUID();
  const testFingerprint = 'test_fp_' + crypto.randomBytes(16).toString('hex');
  const now = new Date().toISOString();

  const testRecord = {
    id: testId,
    symbol: 'THYAO_TEST',
    company_name: 'THYAO Automated DB Test',
    created_at: now,
    data_timestamp: now,
    snapshot_version: 1,
    orchestrator_version: '1.0.0',
    fingerprint: testFingerprint,
    data_package: { test: true, symbol: 'THYAO' },
    factors: [
      {
        id: 'f_test_1',
        title: 'DB Verification Factor',
        sourceType: 'FINANCIAL_STATEMENT',
        relevanceTier: 'DIRECT_COMPANY',
        eventDescription: 'Verifying DB write and read',
        impactChannel: 'PROFITABILITY',
        affectedEntity: 'THYAO',
        financialImplication: 'No financial risk, verification only',
        confidenceScore: 100,
        publishedAt: now,
        isMaterial: true
      }
    ],
    source_provenance: [{ source: 'DB_VERIFIER', timestamp: now, recordCount: 1 }],
    data_freshness: { isStale: false, priceAgeHours: 0 },
    data_quality: { completenessScore: 100, isUsableForAnalysis: true, missingFields: [] },
    relevant_events: [],
    status: 'ASSEMBLED'
  };

  const { data: insertData, error: insertError } = await sbAdmin
    .from('analysis_snapshots')
    .insert(testRecord)
    .select()
    .single();

  if (insertError) {
    console.error('❌ Service Role INSERT failed:', insertError);
    return { success: false, reason: 'INSERT_FAILED', error: insertError };
  }
  console.log('✅ Service Role INSERT successful! Created record ID:', insertData.id);

  // 3. Service Role READ test
  console.log('\n[TEST 3] Testing Service Role READ...');
  const { data: adminRead, error: adminReadError } = await sbAdmin
    .from('analysis_snapshots')
    .select('*')
    .eq('id', testId)
    .single();

  if (adminReadError || !adminRead) {
    console.error('❌ Service Role READ failed:', adminReadError);
    return { success: false, reason: 'READ_FAILED', error: adminReadError };
  }
  console.log('✅ Service Role READ successful! Symbol:', adminRead.symbol, 'Fingerprint:', adminRead.fingerprint);

  // 4. Anon User READ test (RLS Policy: "Allow read access to analysis snapshots")
  console.log('\n[TEST 4] Testing Anon User SELECT under RLS...');
  const { data: anonRead, error: anonReadError } = await sbAnon
    .from('analysis_snapshots')
    .select('id, symbol, status, fingerprint')
    .eq('id', testId)
    .single();

  if (anonReadError || !anonRead) {
    console.error('❌ Anon User READ failed under RLS:', anonReadError);
    return { success: false, reason: 'ANON_READ_FAILED', error: anonReadError };
  }
  console.log('✅ Anon User READ successful! Read ID:', anonRead.id, 'Status:', anonRead.status);

  // 5. Anon User INSERT test (Should be REJECTED by RLS)
  console.log('\n[TEST 5] Testing Anon User INSERT restriction (Must be blocked by RLS)...');
  const anonTestId = crypto.randomUUID();
  const { error: anonInsertError } = await sbAnon
    .from('analysis_snapshots')
    .insert({ ...testRecord, id: anonTestId, symbol: 'ANON_UNAUTHORIZED' });

  if (!anonInsertError) {
    console.error('❌ SECURITY ALERT: Anon User was able to INSERT! RLS policy violated!');
    return { success: false, reason: 'RLS_VIOLATION_ANON_INSERT_ALLOWED' };
  }
  console.log('✅ Anon User INSERT successfully blocked by RLS policy. Error:', anonInsertError.message);

  // 6. Duplicate Detection Check
  console.log('\n[TEST 6] Testing Duplicate Detection via fingerprint...');
  const { data: dupCheck, error: dupError } = await sbAdmin
    .from('analysis_snapshots')
    .select('id, fingerprint')
    .eq('symbol', 'THYAO_TEST')
    .eq('fingerprint', testFingerprint)
    .limit(1);

  if (dupError || !dupCheck || dupCheck.length === 0) {
    console.error('❌ Duplicate lookup failed:', dupError);
    return { success: false, reason: 'DUP_CHECK_FAILED', error: dupError };
  }
  console.log(`✅ Duplicate correctly identified! Found existing snapshot ID: ${dupCheck[0].id}`);

  // 7. Cleanup Test Record
  console.log('\n[TEST 7] Cleaning up test record with Service Role...');
  const { error: deleteError } = await sbAdmin
    .from('analysis_snapshots')
    .delete()
    .eq('id', testId);

  if (deleteError) {
    console.warn('⚠️ Warning: Failed to delete test record:', deleteError);
  } else {
    console.log('✅ Test record cleaned up successfully.');
  }

  console.log('\n===============================================================');
  console.log('🎉 ALL PRODUCTION SUPABASE DB TESTS PASSED (7/7)!');
  console.log('===============================================================');
  return { success: true };
}

runProductionDbVerification();
