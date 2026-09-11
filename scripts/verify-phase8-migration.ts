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

const sbAdmin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function checkPhase8Schema() {
  console.log('===============================================================');
  console.log('FİNAİ PHASE 8 - PRODUCTION DATABASE MIGRATION VERIFICATION');
  console.log('===============================================================');
  console.log(`Supabase URL: ${url}`);

  // 1. Check if columns exist in public.analysis_snapshots
  console.log('\n[CHECK 1] Testing column selection on public.analysis_snapshots...');
  const { data: colsData, error: colsError } = await sbAdmin
    .from('analysis_snapshots')
    .select('id, symbol, version, previous_snapshot_id, change_diff, change_summary, update_reason, trigger_type')
    .limit(1);

  if (colsError) {
    console.error('❌ Phase 8 columns NOT found in Supabase schema:');
    console.error(`   Error Code: ${colsError.code}`);
    console.error(`   Message:    ${colsError.message}`);
    console.error(`   Details:    ${colsError.details}`);
    console.error(`   Hint:       ${colsError.hint}`);
    return {
      migrated: false,
      error: colsError
    };
  }

  console.log('✅ Phase 8 columns exist and are accessible in Supabase:');
  console.log('   - version');
  console.log('   - previous_snapshot_id');
  console.log('   - change_diff');
  console.log('   - change_summary');
  console.log('   - update_reason');
  console.log('   - trigger_type');

  // 2. Read/Write test with versioning & previous_snapshot_id
  console.log('\n[CHECK 2] Performing controlled read/write test for Phase 8 versioning...');
  const testSymbol = 'VERIFY_P8_' + crypto.randomBytes(3).toString('hex').toUpperCase();
  const id1 = crypto.randomUUID();
  const id2 = crypto.randomUUID();
  const fp1 = 'fp_verify_' + crypto.randomBytes(8).toString('hex');
  const fp2 = 'fp_verify_' + crypto.randomBytes(8).toString('hex');
  const now = new Date().toISOString();

  try {
    // Insert v1
    console.log(`   Inserting v1 test record (ID: ${id1}, symbol: ${testSymbol})...`);
    const recordV1 = {
      id: id1,
      symbol: testSymbol,
      company_name: 'Phase 8 Verification Corp',
      created_at: now,
      data_timestamp: now,
      snapshot_version: 1,
      version: 1,
      previous_snapshot_id: null,
      orchestrator_version: '1.0.0',
      fingerprint: fp1,
      data_package: { symbol: testSymbol, test: true },
      factors: [],
      source_provenance: {},
      data_freshness: { overallFreshness: 'RECENT' },
      data_quality: { completenessScore: 100 },
      relevant_events: [],
      status: 'ASSEMBLED',
      change_diff: { hasChanged: true, test: 'v1 diff' },
      change_summary: { whatChanged: 'v1 created', whyItChanged: 'initial test', implicationForAnalysis: 'none' },
      update_reason: 'INITIAL_ANALYSIS',
      trigger_type: 'MANUAL_REQUEST'
    };

    const { error: ins1Error } = await sbAdmin
      .from('analysis_snapshots')
      .insert(recordV1);

    if (ins1Error) {
      console.error('❌ Failed to insert v1 record:', ins1Error.message);
      return { migrated: false, error: ins1Error };
    }
    console.log('   ✅ v1 inserted successfully.');

    // Insert v2 referencing v1
    console.log(`   Inserting v2 test record (ID: ${id2}, previous_snapshot_id: ${id1})...`);
    const recordV2 = {
      id: id2,
      symbol: testSymbol,
      company_name: 'Phase 8 Verification Corp',
      created_at: new Date(Date.now() + 1000).toISOString(),
      data_timestamp: now,
      snapshot_version: 1,
      version: 2,
      previous_snapshot_id: id1,
      orchestrator_version: '1.0.0',
      fingerprint: fp2,
      data_package: { symbol: testSymbol, test: true, v: 2 },
      factors: [],
      source_provenance: {},
      data_freshness: { overallFreshness: 'RECENT' },
      data_quality: { completenessScore: 100 },
      relevant_events: [],
      status: 'ASSEMBLED',
      change_diff: { hasChanged: true, baseSnapshotId: id1, targetSnapshotId: id2, test: 'v2 diff' },
      change_summary: { whatChanged: 'v2 created', whyItChanged: 'linked to v1', implicationForAnalysis: 'diff working' },
      update_reason: 'NEW_FINANCIAL_STATEMENT',
      trigger_type: 'FINANCIAL_STATEMENT'
    };

    const { error: ins2Error } = await sbAdmin
      .from('analysis_snapshots')
      .insert(recordV2);

    if (ins2Error) {
      console.error('❌ Failed to insert v2 record with previous_snapshot_id FK:', ins2Error.message);
      return { migrated: false, error: ins2Error };
    }
    console.log('   ✅ v2 inserted successfully with foreign key linking to v1.');

    // Query both records back ordered by version DESC
    console.log('   Querying records back ordered by version DESC...');
    const { data: fetchRecords, error: fetchError } = await sbAdmin
      .from('analysis_snapshots')
      .select('id, symbol, version, previous_snapshot_id, change_diff, change_summary, update_reason, trigger_type')
      .eq('symbol', testSymbol)
      .order('version', { ascending: false });

    if (fetchError || !fetchRecords || fetchRecords.length !== 2) {
      console.error('❌ Failed to fetch test records back:', fetchError?.message || `Got ${fetchRecords?.length} records, expected 2`);
      return { migrated: false, error: fetchError };
    }

    const fetchedV2 = fetchRecords[0];
    const fetchedV1 = fetchRecords[1];

    console.log('   ✅ Fetched records successfully:');
    console.log(`      Record 1: Version ${fetchedV2.version}, PrevID: ${fetchedV2.previous_snapshot_id}`);
    console.log(`      Record 2: Version ${fetchedV1.version}, PrevID: ${fetchedV1.previous_snapshot_id}`);

    const versionChainValid = fetchedV2.version === 2 &&
      fetchedV1.version === 1 &&
      fetchedV2.previous_snapshot_id === id1 &&
      fetchedV1.previous_snapshot_id === null;

    if (!versionChainValid) {
      console.error('❌ Version chain validation failed!');
      return { migrated: false, error: 'Version chain mismatch' };
    }

    const jsonbValid = fetchedV2.change_diff?.test === 'v2 diff' &&
      fetchedV2.change_summary?.whatChanged === 'v2 created';

    if (!jsonbValid) {
      console.error('❌ JSONB column structure validation failed!');
      return { migrated: false, error: 'JSONB mismatch' };
    }

    console.log('   ✅ Version chain and JSONB structures verified 100%.');

    // 3. Cleanup test records
    console.log('\n[CHECK 3] Cleaning up verification test records...');
    const { error: del2Error } = await sbAdmin
      .from('analysis_snapshots')
      .delete()
      .eq('id', id2);

    const { error: del1Error } = await sbAdmin
      .from('analysis_snapshots')
      .delete()
      .eq('id', id1);

    if (del2Error || del1Error) {
      console.warn('⚠️ Warning cleaning up test records:', del2Error?.message || del1Error?.message);
    } else {
      console.log('✅ Cleanup complete. Production database remains clean.');
    }

    return { migrated: true };

  } catch (err: any) {
    console.error('❌ Unexpected error during read/write check:', err.message);
    return { migrated: false, error: err };
  }
}

checkPhase8Schema().then(result => {
  if (result.migrated) {
    console.log('\n===============================================================');
    console.log('🎉 RESULT: Phase 8 migration IS ACTIVELY APPLIED on production DB!');
    console.log('===============================================================\n');
    process.exit(0);
  } else {
    console.log('\n===============================================================');
    console.log('⚠️ RESULT: Phase 8 migration is NOT YET APPLIED on production DB.');
    console.log('===============================================================\n');
    process.exit(1);
  }
});
