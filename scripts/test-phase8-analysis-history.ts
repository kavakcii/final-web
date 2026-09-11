import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { NextRequest } from 'next/server';
import {
  AnalysisSnapshotService,
  AnalysisChangeDiffEngine,
  AnalysisPipeline,
  AssembledDataPackage,
  AnalysisFactor
} from '../src/lib/analysis';
import { GET as historyGET } from '../src/app/api/finai/analysis/history/route';
import { GET as detailGET } from '../src/app/api/finai/analysis/history/[snapshotId]/route';
import { GET as compareGET, POST as comparePOST } from '../src/app/api/finai/analysis/compare/route';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string, details?: any): void {
  if (condition) {
    console.log('  \u2705 [PASS] ' + message);
    testsPassed++;
  } else {
    console.error('  \u274C [FAIL] ' + message);
    if (details) console.error('     Details:', details);
    testsFailed++;
  }
}

function createMockPackage(symbol: string, fingerprint: string, overrides: Partial<AssembledDataPackage> = {}): AssembledDataPackage {
  return {
    symbol,
    companyName: `${symbol} Sanayi ve Ticaret A.Ş.`,
    sector: 'Havacılık',
    orchestratorVersion: '1.0.0',
    assembledAt: new Date().toISOString(),
    fingerprint,
    companyProfile: { companyName: `${symbol} A.Ş.` },
    marketData: {
      currentPrice: 300,
      changePercent: 1.5,
      high52w: 350,
      low52w: 200,
      volume: 1000000,
      lastTradeDate: '2026-09-10',
      marketCap: 50000000000
    } as any,
    statements: {
      latestQuarter: {
        periodEnd: '2026-06-30',
        revenue: 100000000,
        grossProfit: 30000000,
        operatingIncome: 20000000,
        netIncome: 15000000
      },
      quarterly: []
    } as any,
    historicalTrends: null,
    sectorContext: {
      peers: [],
      sectorAverages: {} as any
    } as any,
    relevantNews: [
      { id: 'news-1', title: `${symbol} yeni hat açılışı`, pubDate: '2026-09-10', relevanceScore: 0.9 }
    ] as any,
    relevantCalendarEvents: [],
    corporateActions: {
      historicalDividendsCount: 2
    } as any,
    earningsCalendar: { expectedDate: null, daysLeft: null, source: 'API' },
    fxCommodityExposure: {} as any,
    kapContext: {} as any,
    dataQuality: { completenessScore: 90, flags: [] } as any,
    dataFreshness: { overallFreshness: 'RECENT', sourceAges: {} } as any,
    provenance: { price: { source: 'BIST', timestamp: '2026-09-10' } } as any,
    conflicts: [],
    ...overrides
  };
}

function createMockFactors(): AnalysisFactor[] {
  return [
    {
      id: 'factor-profitability',
      factorType: 'FINANCIAL',
      title: 'Yüksek Faaliyet Kârlılığı',
      explanation: 'Güçlü marjlar nakit akışını destekliyor.',
      relevance: 'DIRECT_COMPANY',
      impactDirection: 'positive',
      magnitude: 'high',
      freshness: 'RECENT',
      persistence: 'PERSISTENT',
      sourceReliability: 95,
      source: 'Finansal Tablolar'
    },
    {
      id: 'factor-debt',
      factorType: 'FINANCIAL',
      title: 'Finansman Yükü',
      explanation: 'Kısa vadeli borç faiz giderlerini artırıyor.',
      relevance: 'DIRECT_COMPANY',
      impactDirection: 'negative',
      magnitude: 'medium',
      freshness: 'RECENT',
      persistence: 'PERSISTENT',
      sourceReliability: 90,
      source: 'Dipnotlar'
    }
  ];
}

async function runPhase8Tests() {
  console.log('\n======================================================');
  console.log('   FINAI ANALYSIS SYSTEM - PHASE 8 TEST SUITE');
  console.log('   Analysis History, Versioning & Change Diff Engine');
  console.log('======================================================\n');

  // Clear in-memory store for clean deterministic testing
  AnalysisSnapshotService.clearInMemoryStore();

  const TEST_SYM = 'T' + Date.now().toString(36).slice(-4).toUpperCase();

  // ==========================================================================
  // MODULE 1: Versioning & Chain Linking (v1 -> v2 -> v3)
  // ==========================================================================
  console.log(`--- MODULE 1: Versioning & Chain Linking (${TEST_SYM}) ---`);

  let snap1Id: string = '';
  let snap2Id: string = '';

  // Test 1.1: First snapshot -> v1, previous_snapshot_id: null
  {
    const pkg1 = createMockPackage(TEST_SYM, `fp-v1-${TEST_SYM}`, {
      marketData: { currentPrice: 100, changePercent: 0 } as any
    });
    const factors1 = createMockFactors();

    const res1 = await AnalysisSnapshotService.saveSnapshot(pkg1, factors1, {
      updateReason: 'INITIAL_ANALYSIS',
      triggerType: 'MANUAL_REQUEST'
    });

    assert(res1.success === true, 'T1.1: First snapshot saved successfully');
    assert(res1.isDuplicate === false, 'T1.1: First snapshot is not duplicate');
    assert(res1.snapshot.version === 1, 'T1.1: First snapshot version is 1', res1.snapshot.version);
    assert(res1.snapshot.previous_snapshot_id === null, 'T1.1: First snapshot previous_snapshot_id is null');
    assert(res1.richDiff !== undefined, 'T1.1: Rich diff generated for initial snapshot');
    assert(res1.richDiff?.baseSnapshotId === null, 'T1.1: Initial rich diff base is null');

    snap1Id = res1.snapshot.id;
  }

  // Test 1.2: Second snapshot with new fingerprint -> v2, linked to v1
  {
    const pkg2 = createMockPackage(TEST_SYM, `fp-v2-${TEST_SYM}`, {
      marketData: { currentPrice: 110, changePercent: 10 } as any,
      statements: {
        latestQuarter: {
          periodEnd: '2026-09-30', // New quarter!
          revenue: 120000000,
          grossProfit: 35000000,
          operatingIncome: 25000000,
          netIncome: 18000000
        }
      } as any
    });
    const factors2 = createMockFactors();

    const res2 = await AnalysisSnapshotService.saveSnapshot(pkg2, factors2, {
      updateReason: 'NEW_FINANCIAL_STATEMENT',
      triggerType: 'FINANCIAL_STATEMENT'
    });

    assert(res2.success === true, 'T1.2: Second snapshot saved successfully');
    assert(res2.isDuplicate === false, 'T1.2: Second snapshot is not duplicate');
    assert(res2.snapshot.version === 2, 'T1.2: Second snapshot version is 2', res2.snapshot.version);
    assert(res2.snapshot.previous_snapshot_id === snap1Id, 'T1.2: v2 links to v1 id', res2.snapshot.previous_snapshot_id);
    assert(res2.richDiff?.baseSnapshotId === snap1Id, 'T1.2: Rich diff base is v1 id');
    assert(res2.richDiff?.targetVersion === 2, 'T1.2: Rich diff target version is 2');

    snap2Id = res2.snapshot.id;
  }

  // Test 1.3: Third snapshot with new fingerprint -> v3, linked to v2
  {
    const pkg3 = createMockPackage(TEST_SYM, `fp-v3-${TEST_SYM}`, {
      marketData: { currentPrice: 115, changePercent: 4.5 } as any
    });
    const factors3 = createMockFactors();

    const res3 = await AnalysisSnapshotService.saveSnapshot(pkg3, factors3, {
      updateReason: 'MATERIAL_NEWS',
      triggerType: 'NEWS'
    });

    assert(res3.snapshot.version === 3, 'T1.3: Third snapshot version is 3', res3.snapshot.version);
    assert(res3.snapshot.previous_snapshot_id === snap2Id, 'T1.3: v3 links to v2 id', res3.snapshot.previous_snapshot_id);
  }

  // ==========================================================================
  // MODULE 2: Deduplication & Immutability
  // ==========================================================================
  console.log('\n--- MODULE 2: Deduplication & Immutability ---');

  // Test 2.1: Same fingerprint does not increment version
  {
    const pkgRepeat = createMockPackage(TEST_SYM, `fp-v3-${TEST_SYM}`);
    const factorsRepeat = createMockFactors();

    const resRepeat = await AnalysisSnapshotService.saveSnapshot(pkgRepeat, factorsRepeat);
    assert(resRepeat.isDuplicate === true, 'T2.1: Same fingerprint identified as duplicate');
    assert(resRepeat.snapshot.version === 3, 'T2.1: Version remains 3 (not incremented to 4)', resRepeat.snapshot.version);
  }

  // Test 2.2: Historical snapshots remain immutable
  {
    const snap1 = await AnalysisSnapshotService.getSnapshotById(snap1Id);
    assert(snap1 !== null, 'T2.2: v1 is retrievable by ID');
    assert(snap1?.version === 1, 'T2.2: v1 version remains 1');
    assert(snap1?.fingerprint === `fp-v1-${TEST_SYM}`, 'T2.2: v1 fingerprint not overwritten');

    const snap2 = await AnalysisSnapshotService.getSnapshotById(snap2Id);
    assert(snap2 !== null, 'T2.2: v2 is retrievable by ID');
    assert(snap2?.version === 2, 'T2.2: v2 version remains 2');
    assert(snap2?.previous_snapshot_id === snap1Id, 'T2.2: v2 previous link intact');
  }

  // ==========================================================================
  // MODULE 3: Factor State Machine (ADDED, REMOVED, CHANGED, UNCHANGED)
  // ==========================================================================
  console.log('\n--- MODULE 3: Factor State Machine ---');

  {
    const prevSnap = (await AnalysisSnapshotService.getSnapshotById(snap1Id))!;

    // Current factors:
    // 1. factor-profitability: direction changed from positive -> neutral (CHANGED)
    // 2. factor-debt: UNCHANGED
    // 3. factor-fx: newly ADDED
    // (Note: none removed in this set, we'll test removed right after)
    const currentFactors: AnalysisFactor[] = [
      {
        id: 'factor-profitability',
        factorType: 'FINANCIAL',
        title: 'Yüksek Faaliyet Kârlılığı',
        explanation: 'Marjlar yavaşladı.',
        relevance: 'DIRECT_COMPANY',
        impactDirection: 'neutral', // CHANGED direction
        magnitude: 'medium',
        freshness: 'RECENT',
        persistence: 'PERSISTENT',
        sourceReliability: 95,
        source: 'Finansal Tablolar'
      },
      {
        id: 'factor-debt',
        factorType: 'FINANCIAL',
        title: 'Finansman Yükü',
        explanation: 'Kısa vadeli borç faiz giderlerini artırıyor.',
        relevance: 'DIRECT_COMPANY',
        impactDirection: 'negative', // UNCHANGED
        magnitude: 'medium',
        freshness: 'RECENT',
        persistence: 'PERSISTENT',
        sourceReliability: 90,
        source: 'Dipnotlar'
      },
      {
        id: 'factor-fx',
        factorType: 'FX_COMMODITY',
        title: 'Döviz Pozisyon Fazlası',
        explanation: 'Yükselen kur net kârı destekliyor.',
        relevance: 'DIRECT_COMPANY',
        impactDirection: 'positive', // ADDED
        magnitude: 'high',
        freshness: 'RECENT',
        persistence: 'TRANSITORY',
        sourceReliability: 90,
        source: 'Bilanço Dipnotu'
      }
    ];

    const currentPkg = createMockPackage(TEST_SYM, 'fp-factor-diff-test');
    const diffResult = AnalysisChangeDiffEngine.computeDiff(prevSnap, currentPkg, currentFactors);

    // Verify ADDED
    const addedItem = diffResult.factorChanges.added.find(f => f.factorId === 'factor-fx');
    assert(addedItem !== undefined, 'T3.1: New factor marked as ADDED');
    assert(addedItem?.changeType === 'ADDED', 'T3.1: ChangeType is ADDED');

    // Verify CHANGED
    const changedItem = diffResult.factorChanges.changed.find(f => f.factorId === 'factor-profitability');
    assert(changedItem !== undefined, 'T3.2: Modified factor marked as CHANGED');
    assert(changedItem?.directionChanged === true, 'T3.2: directionChanged flag is true');
    assert(changedItem?.previousDirection === 'positive', 'T3.2: Previous direction was positive');
    assert(changedItem?.currentDirection === 'neutral', 'T3.2: Current direction is neutral');

    // Verify UNCHANGED
    const unchangedItem = diffResult.factorChanges.unchanged.find(f => f.factorId === 'factor-debt');
    assert(unchangedItem !== undefined, 'T3.3: Constant factor marked as UNCHANGED');
    assert(unchangedItem?.changeType === 'UNCHANGED', 'T3.3: ChangeType is UNCHANGED');

    // Verify REMOVED: compare current factors against previous that omitted factor-profitability
    const removedPkgFactors: AnalysisFactor[] = [currentFactors[1]]; // only factor-debt
    const diffRemoved = AnalysisChangeDiffEngine.computeDiff(prevSnap, currentPkg, removedPkgFactors);
    const removedItem = diffRemoved.factorChanges.removed.find(f => f.factorId === 'factor-profitability');
    assert(removedItem !== undefined, 'T3.4: Omitted factor marked as REMOVED');
    assert(removedItem?.changeType === 'REMOVED', 'T3.4: ChangeType is REMOVED');
  }

  // ==========================================================================
  // MODULE 4: Qualitative Impact Balance Shift (NO numerical scores)
  // ==========================================================================
  console.log('\n--- MODULE 4: Qualitative Impact Balance Shift ---');

  {
    const prevSnap = (await AnalysisSnapshotService.getSnapshotById(snap1Id))!;
    prevSnap.ai_analysis = { impactBalance: 'Pozitif' } as any;

    const currentPkg = createMockPackage(TEST_SYM, 'fp-balance-test');
    // Factors with 2 negative, 0 positive -> should shift to Negatif
    const negFactors: AnalysisFactor[] = [
      {
        id: 'f-neg-1',
        factorType: 'FINANCIAL',
        title: 'Maliyet Artışı',
        explanation: 'Enflasyonist maliyet baskısı',
        relevance: 'DIRECT_COMPANY',
        impactDirection: 'negative',
        magnitude: 'high',
        freshness: 'RECENT',
        persistence: 'PERSISTENT',
        sourceReliability: 90,
        source: 'Bilanço'
      },
      {
        id: 'f-neg-2',
        factorType: 'FINANCIAL',
        title: 'Talep Daralması',
        explanation: 'İç piyasa talebinde gerileme',
        relevance: 'DIRECT_COMPANY',
        impactDirection: 'negative',
        magnitude: 'medium',
        freshness: 'RECENT',
        persistence: 'PERSISTENT',
        sourceReliability: 90,
        source: 'Sektör Verisi'
      }
    ];

    const diff = AnalysisChangeDiffEngine.computeDiff(prevSnap, currentPkg, negFactors, {
      currentImpactBalance: 'Negatif'
    });

    assert(diff.impactBalanceShift.hasShifted === true, 'T4.1: Impact balance shift detected');
    assert(diff.impactBalanceShift.previousBalance === 'Pozitif', 'T4.1: Previous balance was Pozitif');
    assert(diff.impactBalanceShift.currentBalance === 'Negatif', 'T4.1: Current balance is Negatif');
    assert(!JSON.stringify(diff.impactBalanceShift).includes('score'), 'T4.2: NO numerical score in impactBalanceShift');
  }

  // ==========================================================================
  // MODULE 5: "Ne Değişti? Neden Değişti?" Causal Narrative
  // ==========================================================================
  console.log('\n--- MODULE 5: Causal Narrative Generation ---');

  {
    const prevSnap = (await AnalysisSnapshotService.getSnapshotById(snap1Id))!;
    const currentPkg = createMockPackage(TEST_SYM, 'fp-narrative-test', {
      statements: {
        latestQuarter: {
          periodEnd: '2026-09-30',
          revenue: 140000000,
          grossProfit: 45000000,
          operatingIncome: 30000000,
          netIncome: 22000000
        }
      } as any,
      relevantNews: [
        { id: 'news-new-1', title: 'Stratejik fabrika yatırımı onaylandı', pubDate: '2026-09-11' }
      ] as any
    });
    const factors = createMockFactors();

    const diff = AnalysisChangeDiffEngine.computeDiff(prevSnap, currentPkg, factors);
    const narrative = diff.causalNarrative;

    assert(Boolean(narrative.whatChanged), 'T5.1: "whatChanged" narrative is populated');
    assert(Boolean(narrative.whyItChanged), 'T5.2: "whyItChanged" narrative is populated');
    assert(Boolean(narrative.implicationForAnalysis), 'T5.3: "implicationForAnalysis" narrative is populated');
    assert(narrative.keyDriversSummary.length > 0, 'T5.4: Key drivers summary populated');
    assert(narrative.whatChanged.includes('2026-09-30') || narrative.whatChanged.includes('tablo'), 'T5.5: whatChanged reflects new financial period');
  }

  // ==========================================================================
  // MODULE 6: History and Detail APIs
  // ==========================================================================
  console.log('\n--- MODULE 6: History & Detail APIs ---');

  // Test 6.1: History API GET
  {
    const req = new NextRequest(`http://localhost:3000/api/finai/analysis/history?symbol=${TEST_SYM}&limit=10`);
    const res = await historyGET(req);
    assert(res.status === 200, 'T6.1: History API returns 200 OK');

    const json = await res.json();
    assert(json.success === true, 'T6.1: Response success is true');
    assert(json.symbol === TEST_SYM, 'T6.1: Response symbol matches');
    assert(json.totalSnapshots >= 3, 'T6.1: Total snapshots >= 3', json.totalSnapshots);
    assert(json.snapshots[0].version === 3, 'T6.1: Latest snapshot is v3 (first in list)');
    assert(json.snapshots[1].version === 2, 'T6.1: Second snapshot is v2');
    assert(json.snapshots[2].version === 1, 'T6.1: Third snapshot is v1');
  }

  // Test 6.2: History API invalid symbol -> 400
  {
    const req = new NextRequest('http://localhost:3000/api/finai/analysis/history?symbol=INVALID_TOO_LONG_123');
    const res = await historyGET(req);
    assert(res.status === 400, 'T6.2: Malformed symbol returns 400');
  }

  // Test 6.3: Snapshot Detail API GET
  {
    const req = new NextRequest(`http://localhost:3000/api/finai/analysis/history/${snap2Id}`);
    const res = await detailGET(req, { params: Promise.resolve({ snapshotId: snap2Id }) });
    assert(res.status === 200, 'T6.3: Detail API returns 200 OK');

    const json = await res.json();
    assert(json.success === true, 'T6.3: Response success is true');
    assert(json.snapshot.id === snap2Id, 'T6.3: Detail returns exact requested snapshot');
    assert(json.snapshot.version === 2, 'T6.3: Snapshot version is 2');
    assert(json.snapshot.previousSnapshotId === snap1Id, 'T6.3: Detail contains previousSnapshotId');
    assert(json.changeDiff !== null, 'T6.3: Detail contains changeDiff');
  }

  // Test 6.4: Snapshot Detail API non-existent ID -> 404
  {
    const req = new NextRequest('http://localhost:3000/api/finai/analysis/history/non-existent-id');
    const res = await detailGET(req, { params: Promise.resolve({ snapshotId: 'non-existent-id' }) });
    assert(res.status === 404, 'T6.4: Missing snapshot ID returns 404');
  }

  // ==========================================================================
  // MODULE 7: Snapshot Compare API
  // ==========================================================================
  console.log('\n--- MODULE 7: Snapshot Compare API ---');

  // Test 7.1: Compare API via GET
  {
    const req = new NextRequest(`http://localhost:3000/api/finai/analysis/compare?baseId=${snap1Id}&targetId=${snap2Id}`);
    const res = await compareGET(req);
    assert(res.status === 200, 'T7.1: Compare GET returns 200 OK');

    const json = await res.json();
    assert(json.success === true, 'T7.1: Compare success is true');
    assert(json.comparison.baseSnapshotId === snap1Id, 'T7.1: baseSnapshotId matches');
    assert(json.comparison.targetSnapshotId === snap2Id, 'T7.1: targetSnapshotId matches');
    assert(json.comparison.baseVersion === 1, 'T7.1: baseVersion is 1');
    assert(json.comparison.targetVersion === 2, 'T7.1: targetVersion is 2');
  }

  // Test 7.2: Compare API via POST
  {
    const req = new NextRequest('http://localhost:3000/api/finai/analysis/compare', {
      method: 'POST',
      body: JSON.stringify({ baseId: snap1Id, targetId: snap2Id })
    });
    const res = await comparePOST(req);
    assert(res.status === 200, 'T7.2: Compare POST returns 200 OK');
    const json = await res.json();
    assert(json.success === true && json.comparison !== undefined, 'T7.2: Compare POST payload valid');
  }

  // ==========================================================================
  // MODULE 8: Production Symbols Pipeline & Versioning (THYAO, ASELS, BIMAS)
  // ==========================================================================
  console.log('\n--- MODULE 8: Production BIST Symbols End-to-End ---');

  for (const sym of ['THYAO', 'ASELS', 'BIMAS']) {
    const pipeResult = await AnalysisPipeline.execute(sym, {
      forceRefresh: false,
      triggerReason: 'PHASE8_VERIFICATION',
      triggerType: 'MANUAL_REQUEST'
    });

    if (!pipeResult.success) {
      console.error(`T8.${sym} FAILED:`, pipeResult.error, pipeResult.status);
    }
    assert(pipeResult.success === true, `T8.${sym}: Pipeline execution success for ${sym}`);
    assert(pipeResult.version !== undefined && pipeResult.version >= 1, `T8.${sym}: Has version >= 1 (${pipeResult.version})`);
    assert(pipeResult.snapshotId !== undefined, `T8.${sym}: Snapshot ID returned`);

    // Verify history query for real symbol
    const history = await AnalysisSnapshotService.getSnapshotHistory(sym, { limit: 5 });
    assert(history.snapshots.length >= 1, `T8.${sym}: Snapshot history has at least 1 record for ${sym}`);
    if (history.snapshots.length >= 1) {
      assert(history.snapshots[0].version !== undefined, `T8.${sym}: History item has version property`);
    }
  }

  // ==========================================================================
  // SUMMARY
  // ==========================================================================
  console.log('\n======================================================');
  console.log('   PHASE 8 TEST RESULTS');
  console.log('======================================================');
  console.log('   Passed: ' + testsPassed);
  console.log('   Failed: ' + testsFailed);
  console.log('   Total:  ' + (testsPassed + testsFailed));
  console.log('   Rate:   ' + (testsPassed + testsFailed > 0 ? ((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1) : 0) + '%');
  console.log('======================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runPhase8Tests().catch((err) => {
  console.error('Phase 8 test suite fatal error:', err);
  process.exit(1);
});
