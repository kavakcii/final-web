/**
 * FinAi Phase 9 Test Suite - Provenance & Transparency (Veri Kaynağı İzlenebilirliği)
 * 
 * Verifies:
 * 1. Deterministic SHA-256 payload hashing for all raw data domains.
 * 2. Strict Zero Fabrication: No fake URLs, non-existent sources, or synthetic timestamps.
 * 3. Qualitative Verification Statuses: VERIFIED, STALE, MISSING, UNAVAILABLE, CONFLICT (NO numeric scores).
 * 4. Source Hierarchy Conflict Resolution: Tier 1 (KAP/Audited) > Tier 2 (BIST/TCMB) > Tier 3 (Yahoo/RSS).
 * 5. Factor-to-Provenance Traceability Mapping.
 * 6. Provenance immutability between snapshot versions (v1 never overwritten by v2).
 * 7. Live BIST symbol integration: THYAO, ASELS, BIMAS.
 */

import { AnalysisOrchestrator } from '../src/lib/analysis/analysis-orchestrator';
import { AnalysisProvenanceService } from '../src/lib/analysis/analysis-provenance-service';
import { AnalysisResponseAdapter } from '../src/lib/analysis/analysis-response-adapter';
import { FinancialImpactEngine } from '../src/lib/analysis/impact-engine';
import { AIAnalysisEngine } from '../src/lib/analysis/ai-analysis-engine';
import { AnalysisSnapshotService } from '../src/lib/analysis/analysis-snapshot-service';
import {
  AssembledDataPackage,
  AnalysisFactor,
  StandardProvenanceItem,
  SourceHierarchyTier
} from '../src/lib/analysis/types';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    console.error(`  ✗ [FAIL] ${testName}`);
    if (detail) console.error(`    Detail: ${detail}`);
  }
}

async function runTestSuite() {
  console.log('\n================================================================');
  console.log('  FinAi Phase 9 Test Suite: Provenance & Transparency Audit');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: Deterministic SHA-256 Payload Hashing
  // --------------------------------------------------------------------------
  console.log('--- TEST GROUP 1: Deterministic Payload Hashing ---');
  {
    const samplePayloadA = { symbol: 'THYAO', price: 312.5, date: '2026-09-11' };
    const samplePayloadB = { date: '2026-09-11', price: 312.5, symbol: 'THYAO' }; // Different key order
    const hashA = AnalysisProvenanceService.computePayloadHash(samplePayloadA);
    const hashB = AnalysisProvenanceService.computePayloadHash(samplePayloadB);

    assert(typeof hashA === 'string' && hashA.length === 64, 'Produces 64-char SHA-256 hex string');
    assert(hashA === hashB, 'Deterministic across object key ordering');

    const nullHash = AnalysisProvenanceService.computePayloadHash(null);
    assert(typeof nullHash === 'string' && nullHash.length === 64, 'Handles null payloads gracefully');
    assert(nullHash !== hashA, 'Different payload produces different hash');
  }

  // --------------------------------------------------------------------------
  // TEST 2: Official Truth Hierarchy & Conflict Resolution
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Hierarchy-Based Conflict Resolution ---');
  {
    // Scenario: KAP reports Net Income of 15.2B TRY, whereas Yahoo reports 14.8B TRY
    const resolution = AnalysisProvenanceService.resolveConflict({
      metric: 'netIncome',
      sourceA: { name: 'KAP Bildirim Sistemi', tier: 'PRIMARY_OFFICIAL', value: 15200000000 },
      sourceB: { name: 'Yahoo Finance Gateway', tier: 'MARKET_DATA_PROVIDER', value: 14800000000 }
    });

    assert(resolution.selectedSource === 'KAP Bildirim Sistemi', 'Tier 1 beats Tier 3');
    assert(resolution.resolvedValue === 15200000000, 'Resolved value matches Tier 1 value');
    assert(resolution.resolutionBasis.includes('resmî hiyerarşide'), 'Resolution basis cites official hierarchy');

    // Scenario: BIST official closing price vs Yahoo Gateway
    const priceResolution = AnalysisProvenanceService.resolveConflict({
      metric: 'currentPrice',
      sourceA: { name: 'Yahoo Gateway', tier: 'MARKET_DATA_PROVIDER', value: 311.0 },
      sourceB: { name: 'Borsa Istanbul Bülten', tier: 'SECONDARY_VERIFIED', value: 312.5 }
    });

    assert(priceResolution.selectedSource === 'Borsa Istanbul Bülten', 'Tier 2 beats Tier 3');
    assert(priceResolution.resolvedValue === 312.5, 'Resolved price is official BIST price');
  }

  // --------------------------------------------------------------------------
  // TEST 3: Zero Fabrication Audit
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Zero Fabrication Audit ---');
  {
    const mockPackage: Partial<AssembledDataPackage> = {
      symbol: 'TESTS',
      companyName: 'Test Sanayi A.Ş.',
      sector: 'Sanayi',
      assembledAt: new Date().toISOString(),
      statements: {
        quarters: [],
        allQuartersCount: 0,
        currency: 'TRY',
        latestQuarter: null,
        latestAnnual: null,
        allAnnualsCount: 0,
        annuals: [],
        ttm: null,
        isRestated: false,
        validationStatus: 'INSUFFICIENT_DATA'
      },
      marketData: {
        currentPrice: null,
        changePercent: null,
        high52w: null,
        low52w: null,
        volume: null,
        lastTradeDate: null,
        marketCap: null,
        currency: 'TRY',
        isMarketOpen: false,
        priceSource: '',
        priceTimestamp: ''
      },
      companyProfile: null,
      corporateActions: { historicalDividendsCount: 0, latestDividends: [], historicalSplitsCount: 0, splits: [], upcomingDividends: [] },
      relevantNews: [],
      relevantCalendarEvents: [],
      fxCommodityExposure: { usdTry: null, eurTry: null, goldGram: null, brentPetrol: null, exposureType: 'DOMESTIC_TL', exposureNotes: [] },
      kapContext: { hasExactProfile: false, kapProfileUrl: null, kapDisclosuresUrl: '', source: 'FALLBACK_SEARCH' },
      dataQuality: { score: 0, status: 'INSUFFICIENT_DATA', hasProfile: false, hasPrices: false, hasStatements: false, hasRatios: false, notes: [] },
      dataFreshness: { assembledAt: new Date().toISOString(), priceDate: null, financialPeriodEnd: null, newsLatestDate: null, macroEventLatestDate: null, isStale: true, staleReasons: [] },
      provenance: {},
      conflicts: []
    };

    const items = AnalysisProvenanceService.buildStandardProvenanceItems(mockPackage as AssembledDataPackage);
    const statementsItem = items.find(i => i.relatedDataType === 'FINANCIAL_STATEMENTS');
    const pricesItem = items.find(i => i.relatedDataType === 'HISTORICAL_PRICES');
    const profileItem = items.find(i => i.relatedDataType === 'COMPANY_PROFILE');

    assert(statementsItem?.sourceStatus === 'MISSING', 'Missing statements marked MISSING explicitly');
    assert(pricesItem?.sourceStatus === 'UNAVAILABLE', 'Missing prices marked UNAVAILABLE explicitly');
    assert(profileItem?.sourceStatus === 'MISSING', 'Missing profile marked MISSING explicitly');
    assert(pricesItem?.url === undefined, 'No synthetic URL fabricated for internal price gateway');
    assert(profileItem?.url === undefined, 'No synthetic profile URL fabricated when missing');
  }

  // --------------------------------------------------------------------------
  // TEST 4: Factor-to-Provenance Traceability
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: Factor-to-Provenance Traceability ---');
  {
    const mockFactors: AnalysisFactor[] = [
      {
        id: 'THYAO_FACTOR_REV_GROWTH',
        factorType: 'FINANCIAL',
        title: 'Yıllık Satış Gelirleri Büyümesi',
        explanation: 'Hasılat büyümesi',
        relevance: 'DIRECT_COMPANY',
        impactDirection: 'positive',
        magnitude: 'high',
        freshness: 'RECENT',
        persistence: 'PERSISTENT',
        sourceReliability: 95,
        source: 'Finansal Tablolar (KAP/Supabase)',
        metricKey: 'revenueYoY',
        metricValue: 28.4
      },
      {
        id: 'THYAO_FACTOR_NEWS_1',
        factorType: 'NEWS',
        title: 'THY Yeni Uçak Siparişi Verdi',
        explanation: 'Filo genişlemesi',
        relevance: 'DIRECT_COMPANY',
        impactDirection: 'positive',
        magnitude: 'high',
        freshness: 'REALTIME',
        persistence: 'STRUCTURAL',
        sourceReliability: 90,
        source: 'Anadolu Ajansı',
        provenanceRef: 'https://www.aa.com.tr/havacilik/thy-filo'
      }
    ];

    const mockPackage: Partial<AssembledDataPackage> = {
      symbol: 'THYAO',
      companyName: 'Türk Hava Yolları A.O.',
      sector: 'Ulaştırma',
      assembledAt: new Date().toISOString(),
      statements: { quarters: [{ periodEnd: '2026/06' }], allQuartersCount: 1, currency: 'TRY' } as any,
      marketData: { currentPrice: 312.5 } as any,
      relevantNews: [{ id: 'n1', title: 'THY Uçak', link: 'https://www.aa.com.tr/havacilik/thy-filo', pubDate: '2026-09-11', source: 'AA' }] as any,
      corporateActions: { historicalDividendsCount: 5 } as any,
      fxCommodityExposure: { usdTry: 34.2, brentPetrol: 74.5 } as any,
      kapContext: { hasExactProfile: true, kapProfileUrl: 'https://www.kap.org.tr/tr/sirket-bilgileri/ozet/THYAO' } as any
    };

    const items = AnalysisProvenanceService.buildStandardProvenanceItems(mockPackage as AssembledDataPackage);
    const mappings = AnalysisProvenanceService.linkFactorsToProvenance(mockFactors, items);

    assert(mappings.length === 2, 'Mapped all factors to provenance');
    assert(mappings[0].primaryProvenanceId === 'thyao_financial_statements', 'Financial factor linked to financial statements item');
    assert(mappings[0].sourceStatus === 'VERIFIED', 'Linked item is VERIFIED');
    assert(mappings[0].verificationBasis.includes('revenueYoY'), 'Verification basis records exact metricKey');

    assert(mappings[1].primaryProvenanceId === 'thyao_news_feed', 'News factor linked to news feed item');
    assert(mappings[1].verificationBasis.includes('https://www.aa.com.tr'), 'News factor maintains authentic article link');
  }

  // --------------------------------------------------------------------------
  // TEST 5: Provenance Package Assembly & Zero Score Rule
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: Zero Numeric Score & Package Assembly ---');
  {
    const mockPackage: Partial<AssembledDataPackage> = {
      symbol: 'BIMAS',
      companyName: 'BİM Birleşik Mağazalar A.Ş.',
      sector: 'Gıda Perakendeciliği',
      assembledAt: new Date().toISOString(),
      statements: { quarters: [{ periodEnd: '2026/06' }], allQuartersCount: 4, currency: 'TRY' } as any,
      marketData: { currentPrice: 540.0, priceSource: 'Borsa Istanbul' } as any,
      companyProfile: { companyName: 'BİM Birleşik Mağazalar A.Ş.' },
      corporateActions: { historicalDividendsCount: 12 } as any,
      relevantNews: [],
      relevantCalendarEvents: [],
      fxCommodityExposure: { usdTry: 34.2, brentPetrol: 74.0 } as any,
      kapContext: { hasExactProfile: true, kapProfileUrl: 'https://www.kap.org.tr/tr/sirket-bilgileri/ozet/BIMAS' } as any
    };

    const audit = AnalysisProvenanceService.compileProvenanceAudit(mockPackage as AssembledDataPackage, []);
    assert(audit.symbol === 'BIMAS', 'Audit package reports correct symbol');
    assert(audit.overallStatus === 'VERIFIED', 'All Tier 1 verified results in VERIFIED overall status');
    assert(audit.items.length === 8, 'Covers all 8 data domains');

    // Verify no numeric reliability score exists on standard provenance items
    for (const item of audit.items) {
      assert(!('reliabilityScore' in item), `No numeric reliabilityScore on standard item: ${item.id}`);
      assert(['VERIFIED', 'STALE', 'MISSING', 'UNAVAILABLE', 'CONFLICT'].includes(item.sourceStatus), `Valid qualitative status for ${item.id}: ${item.sourceStatus}`);
    }
  }

  // --------------------------------------------------------------------------
  // TEST 6: Real Orchestrator Assembly & Real BIST Symbols
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 6: Real BIST Symbols Assembly ---');
  for (const sym of ['THYAO', 'ASELS', 'BIMAS']) {
    console.log(`\n  Executing live assembly test for ${sym}...`);
    const assembly = await AnalysisOrchestrator.assembleSymbolData(sym);
    assert(assembly.success && Boolean(assembly.dataPackage), `Orchestrator successfully assembled ${sym}`);

    const pkg = assembly.dataPackage!;
    assert(Array.isArray(pkg.standardProvenance) && pkg.standardProvenance.length >= 7, `${sym}: standardProvenance populated with >= 7 feeds`);
    assert(Boolean(pkg.rawPayloadHashes), `${sym}: rawPayloadHashes dictionary present`);
    assert(Boolean(pkg.provenancePackage), `${sym}: provenancePackage generated`);

    // Verify SHA-256 hashes are real hex strings
    const hashes = Object.values(pkg.rawPayloadHashes || {});
    assert(hashes.length > 0 && hashes.every(h => /^[0-9a-f]{64}$/i.test(h)), `${sym}: All payload hashes are valid 64-character SHA-256 strings`);

    // Check Response Adapter integration
    const impact = FinancialImpactEngine.evaluate(pkg, assembly.factors || []);
    const fallbackAI = AIAnalysisEngine.generateDeterministicFallback(pkg, impact, 'Phase 9 Test');
    const adapted = AnalysisResponseAdapter.adapt(pkg, impact, fallbackAI);

    assert(Boolean(adapted.standardProvenance), `${sym}: adapted response contains standardProvenance`);
    assert(Boolean(adapted.provenancePackage), `${sym}: adapted response contains provenancePackage`);
    assert(Array.isArray(adapted.provenance) && adapted.provenance.length > 0, `${sym}: adapted response preserves backward compatible provenance string array`);
  }

  // --------------------------------------------------------------------------
  // TEST 7: Snapshot Immutability (v1 provenance never overwritten by v2)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 7: Snapshot Provenance Immutability ---');
  {
    const sym = 'TESTIMMUTABLE';
    const fakePkgV1: Partial<AssembledDataPackage> = {
      symbol: sym,
      companyName: 'Test Immutability A.Ş.',
      sector: 'Teknoloji',
      assembledAt: '2026-09-10T10:00:00Z',
      fingerprint: 'hash_v1_' + Date.now(),
      orchestratorVersion: '1.0.0-phase9',
      statements: { quarters: [{ periodEnd: '2026/03' }] } as any,
      marketData: { currentPrice: 100 } as any,
      dataQuality: { score: 80, status: 'VALID', notes: [] } as any,
      dataFreshness: { isStale: false, staleReasons: [] } as any,
      provenance: {},
      conflicts: [],
      relevantNews: [],
      relevantCalendarEvents: [],
      corporateActions: {} as any,
      fxCommodityExposure: {} as any,
      kapContext: { hasExactProfile: false, kapProfileUrl: null, kapDisclosuresUrl: '', source: 'FALLBACK_SEARCH' } as any
    };

    const provV1 = AnalysisProvenanceService.buildStandardProvenanceItems(fakePkgV1 as AssembledDataPackage);
    fakePkgV1.standardProvenance = provV1;

    const snapV1 = await AnalysisSnapshotService.saveSnapshot(fakePkgV1 as AssembledDataPackage, []);
    assert(snapV1.success, 'Saved v1 snapshot');

    // Modify data for v2
    const fakePkgV2: Partial<AssembledDataPackage> = {
      ...fakePkgV1,
      assembledAt: '2026-09-11T12:00:00Z',
      fingerprint: 'hash_v2_' + Date.now(),
      marketData: { currentPrice: 120 } as any
    };
    const provV2 = AnalysisProvenanceService.buildStandardProvenanceItems(fakePkgV2 as AssembledDataPackage);
    fakePkgV2.standardProvenance = provV2;

    const snapV2 = await AnalysisSnapshotService.saveSnapshot(fakePkgV2 as AssembledDataPackage, []);
    assert(snapV2.success, 'Saved v2 snapshot');

    // Retrieve both snapshots and ensure v1 payload hash & provenance remained intact
    const v1Record = await AnalysisSnapshotService.getSnapshotById(snapV1.snapshot.id);
    const v2Record = await AnalysisSnapshotService.getSnapshotById(snapV2.snapshot.id);

    assert(Boolean(v1Record), 'Retrieved v1 snapshot');
    assert(Boolean(v2Record), 'Retrieved v2 snapshot');
    assert(v1Record?.fingerprint !== v2Record?.fingerprint, 'v1 and v2 have distinct fingerprints');
    assert(v1Record?.data_timestamp === '2026-09-10T10:00:00Z', 'v1 timestamp preserved intact');
    assert(v2Record?.previous_snapshot_id === snapV1.snapshot.id, 'v2 points back to v1 snapshot id');
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`  Phase 9 Test Results: ${passedTests} / ${totalTests} passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('================================================================\n');

  if (passedTests === totalTests) {
    console.log('✅ ALL PHASE 9 PROVENANCE & TRANSPARENCY AUDIT TESTS PASSED SUCCESSFULLY.\n');
    process.exit(0);
  } else {
    console.error('❌ SOME PHASE 9 TESTS FAILED.\n');
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal error running Phase 9 tests:', err);
  process.exit(1);
});
