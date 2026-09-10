/**
 * FinAi Analysis System - Phase 4 AI Analysis Engine & FinAi System Prompt Test Suite
 * 
 * Verifies AI Context Builder, FinAi System Prompt constraints, Compliance Guardrails,
 * Deterministic Fallback Generator, Deduplication Caching, and End-to-End BIST Integration.
 */

import fs from 'node:fs';
import path from 'node:path';

// Load .env.local manually for full production credentials
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

import { AIAnalysisEngine, AIContextBuilder } from '../src/lib/analysis/ai-analysis-engine';
import { FinancialImpactEngine } from '../src/lib/analysis/impact-engine';
import { AnalysisOrchestrator } from '../src/lib/analysis/analysis-orchestrator';
import { AnalysisSnapshotService } from '../src/lib/analysis/analysis-snapshot-service';
import { FINAI_ANALYSIS_SYSTEM_PROMPT, FINAI_SYSTEM_PROMPT_VERSION } from '../src/lib/analysis/prompts/finai-system-prompt';
import {
  AssembledDataPackage,
  ImpactEngineResult,
  AIAnalysisResult,
  AIAnalysisContext
} from '../src/lib/analysis/types';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    testsPassed++;
  } else {
    console.error(`❌ [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
    testsFailed++;
  }
}

// Controlled Mock Data Package
function createMockDataPackage(overrides?: Partial<AssembledDataPackage>): AssembledDataPackage {
  return {
    symbol: 'KCHOL',
    companyName: 'Koç Holding A.Ş.',
    sector: 'Holding',
    orchestratorVersion: '1.0.0-phase4',
    assembledAt: new Date().toISOString(),
    fingerprint: 'mock_kchol_fingerprint_' + Math.random().toString(36).substring(7),
    companyProfile: { companyName: 'Koç Holding A.Ş.', sector: 'Holding' },
    marketData: {
      currentPrice: 215.4,
      changePercent: 1.8,
      high52w: 245.0,
      low52w: 130.0,
      volume: 45000000,
      lastTradeDate: '2026-09-10',
      marketCap: 546000000000,
      currency: 'TRY',
      isMarketOpen: true,
      priceSource: 'BIST',
      priceTimestamp: new Date().toISOString()
    },
    statements: {
      latestQuarter: {
        periodEnd: '2026-06-30',
        currency: 'TRY',
        isRestated: false,
        financialMetrics: {
          revenue: 350000000000,
          grossProfit: 75000000000,
          operatingIncome: 45000000000,
          netIncome: 32000000000,
          grossMargin: 21.4,
          operatingMargin: 12.8,
          netMargin: 9.1
        },
        yoyGrowth: {
          revenueGrowth: 42.5,
          operatingIncomeGrowth: 38.0,
          netIncomeGrowth: 28.5
        }
      },
      latestAnnual: {
        periodEnd: '2025-12-31',
        currency: 'TRY',
        isRestated: false,
        financialMetrics: {
          revenue: 1100000000000,
          grossProfit: 230000000000,
          operatingIncome: 140000000000,
          netIncome: 95000000000,
          grossMargin: 20.9,
          operatingMargin: 12.7,
          netMargin: 8.6
        }
      },
      allQuartersCount: 8,
      allAnnualsCount: 4,
      quarters: [],
      annuals: []
    },
    historicalAnalysis: {
      symbol: 'KCHOL',
      lastUpdated: new Date().toISOString(),
      coverage: { quartersCount: 8, annualsCount: 4, hasRestatements: false },
      trends: {
        revenueCagr4y: 52.3,
        netIncomeCagr4y: 44.1,
        marginTrends: { grossMarginTrend: 'STABLE', operatingMarginTrend: 'EXPANDING', netMarginTrend: 'STABLE' },
        profitabilityQuality: { fcfToNetIncomeRatio: 0.85, accrualsQuality: 'HIGH', qualityGrade: 'STRONG' },
        balanceSheetTrajectory: { leverageTrend: 'STABLE', workingCapitalTrend: 'HEALTHY' }
      },
      seasonality: { isSeasonal: false, strongestQuarter: 'Q4', weakestQuarter: 'Q1' },
      macroStress: { fxVulnerability: 'LOW', interestRateVulnerability: 'MEDIUM', inflationPassThrough: 'HIGH' },
      flags: []
    },
    sectorComparison: {
      symbol: 'KCHOL',
      sector: 'Holding',
      companiesInSectorCount: 8,
      multiples: {
        pe: 5.8,
        sectorAvgPe: 7.2,
        pb: 1.4,
        sectorAvgPb: 1.8,
        evEbitda: 4.9,
        sectorAvgEvEbitda: 6.5
      },
      margins: {
        grossMargin: 21.4,
        sectorAvgGrossMargin: 19.5,
        operatingMargin: 12.8,
        sectorAvgOperatingMargin: 11.2,
        netMargin: 9.1,
        sectorAvgNetMargin: 7.8
      },
      growth: {
        revenueGrowthYoY: 42.5,
        sectorAvgRevenueGrowthYoY: 35.0,
        netIncomeGrowthYoY: 28.5,
        sectorAvgNetIncomeGrowthYoY: 22.0
      },
      percentileRanks: { peRank: 75, pbRank: 70, grossMarginRank: 80, roeRank: 82 }
    },
    corporateActions: {
      historicalDividendsCount: 15,
      latestDividend: {
        grossDividend: 8.5,
        netDividend: 7.65,
        paymentDate: '2026-04-15',
        dividendYield: 4.2
      },
      hasRecentSplit: false,
      hasRecentCapitalIncrease: false
    },
    newsImpact: {
      overallSentiment: 'POSITIVE',
      overallScore: 72,
      evaluatedNewsCount: 4,
      highImpactNewsCount: 2,
      keyThemes: ['Yatırım Kararı', 'İhracat Artışı']
    },
    relevantNews: [
      {
        id: 'news-1',
        title: 'Koç Holding yeni yeşil enerji yatırımını açıkladı',
        summary: 'Holding yenilenebilir enerji kapasitesini 500 MW artıracak.',
        pubDate: '2026-09-08',
        source: 'KAP Bildirimi',
        sentiment: 'POSITIVE',
        relevanceScore: 92,
        matchedCompanies: ['KCHOL']
      },
      {
        id: 'news-2',
        title: 'Moody\'s Türkiye bankacılık ve holding görünümünü revize etti',
        summary: 'Kredi derecelendirme kuruluşu görünümü pozitife çevirdi.',
        pubDate: '2026-09-05',
        source: 'Matriks',
        sentiment: 'POSITIVE',
        relevanceScore: 84,
        matchedCompanies: ['KCHOL', 'GARAN']
      }
    ],
    relevantCalendarEvents: [
      {
        id: 'cal-1',
        country: 'TR',
        event: 'TCMB Politika Faizi Kararı',
        date: '2026-09-24',
        dateFormatted: '24 Eylül 2026',
        importance: 'HIGH',
        relevanceScore: 88,
        category: 'MONETARY_POLICY'
      }
    ],
    earningsCalendar: {
      expectedDate: '2026-11-05',
      daysLeft: 56,
      source: 'KAP'
    },
    fxCommodityExposure: {
      usdExposure: 'BALANCED',
      eurExposure: 'NET_EXPORTER',
      oilExposure: 'HIGH_POSITIVE',
      goldExposure: 'NEUTRAL',
      summary: 'İhracat ve döviz gelirleri kur riskine karşı doğal hedge sağlamaktadır.'
    },
    kapContext: {
      recentDisclosuresCount: 3,
      materialEvents: [
        {
          disclosureId: 'kap-1',
          title: 'Yeni İştirak Edinimi',
          date: '2026-09-01',
          urgency: 'HIGH'
        }
      ]
    },
    dataQuality: {
      score: 94,
      status: 'VALID',
      hasProfile: true,
      hasPrices: true,
      hasStatements: true,
      hasRatios: true,
      notes: []
    },
    dataFreshness: {
      assembledAt: new Date().toISOString(),
      priceDate: '2026-09-10',
      financialPeriodEnd: '2026-06-30',
      newsLatestDate: '2026-09-08',
      macroEventLatestDate: '2026-09-05',
      isStale: false,
      staleReasons: []
    },
    provenance: {
      price: { source: 'BIST Direct Feed', timestamp: new Date().toISOString() },
      financials: { source: 'KAP / Kamuyu Aydınlatma Platformu', timestamp: new Date().toISOString() }
    },
    conflicts: [],
    ...overrides
  } as unknown as AssembledDataPackage;
}

async function runPhase4Tests() {
  console.log('\n======================================================');
  console.log('   FINAI ANALYSIS SYSTEM - PHASE 4 TEST SUITE');
  console.log('   AI Analysis Engine & FinAi System Prompt Verification');
  console.log('======================================================\n');

  // ==========================================================================
  // MODULE 1: System Prompt Constants & Versioning
  // ==========================================================================
  console.log('--- MODULE 1: System Prompt Specifications ---');

  assert(
    typeof FINAI_ANALYSIS_SYSTEM_PROMPT === 'string' && FINAI_ANALYSIS_SYSTEM_PROMPT.length > 1000,
    'System prompt is loaded and sufficiently comprehensive (>1000 chars)'
  );

  assert(
    FINAI_SYSTEM_PROMPT_VERSION === '1.0.0',
    `System prompt version matches '1.0.0' (got: ${FINAI_SYSTEM_PROMPT_VERSION})`
  );

  // Prohibited words check in System Prompt
  const hasStrictProhibitions = 
    FINAI_ANALYSIS_SYSTEM_PROMPT.includes('YATIRIM TAVSİYESİ') &&
    FINAI_ANALYSIS_SYSTEM_PROMPT.includes('KESİNLİKLE') &&
    FINAI_ANALYSIS_SYSTEM_PROMPT.includes('DİYALEKTİK GERİLİM');
  assert(hasStrictProhibitions, 'System prompt enforces SPK compliance and Dialectic Tension preservation');

  const forbidsHealthScore =
    FINAI_ANALYSIS_SYSTEM_PROMPT.includes('Health Score') &&
    FINAI_ANALYSIS_SYSTEM_PROMPT.includes('tek bir bileşik');
  assert(forbidsHealthScore, 'System prompt strictly forbids single composite health scores');

  // ==========================================================================
  // MODULE 2: AI Context Builder
  // ==========================================================================
  console.log('\n--- MODULE 2: AI Context Builder Structure ---');

  const mockPkg = createMockDataPackage();
  const impactResult = FinancialImpactEngine.evaluate(mockPkg);

  const context = AIContextBuilder.buildContext(mockPkg, impactResult);

  assert(context.symbol === 'KCHOL', 'Context contains correct symbol');
  assert(context.companyName === 'Koç Holding A.Ş.', 'Context contains company name');
  assert(context.sector === 'Holding', 'Context contains sector');
  assert(context.priceContext.price === 215.4, 'Context contains price context (215.4 ₺)');
  
  // Verify waterfall summary is concise and not a massive raw dump
  assert(
    context.waterfallSummary !== undefined,
    'Context contains concise waterfallSummary'
  );
  assert(
    Array.isArray(context.sectorComparisons),
    'Context contains structured sector comparisons'
  );
  assert(
    Array.isArray(context.dominantPositiveDrivers),
    'Context contains dominant positive drivers'
  );
  assert(
    Array.isArray(context.counterNegativeDrivers),
    'Context contains counter negative drivers'
  );
  assert(
    Array.isArray(context.conflictingTensions),
    'Context contains dialectic conflicting tensions'
  );

  // Verify missing data handling (when fields are missing or empty)
  const incompletePkg = createMockDataPackage({
    historicalTrends: undefined as any,
    corporateActions: undefined as any
  });
  const incompleteImpact = FinancialImpactEngine.evaluate(incompletePkg);
  const incompleteContext = AIContextBuilder.buildContext(incompletePkg, incompleteImpact);

  assert(
    Array.isArray(incompleteContext.unavailableDataPoints),
    'Context tracks unavailableDataPoints array'
  );
  assert(
    incompleteContext.unavailableDataPoints.length > 0,
    `Context records missing data points (${incompleteContext.unavailableDataPoints.join(', ')})`
  );

  // ==========================================================================
  // MODULE 3: Deterministic Fallback Generator
  // ==========================================================================
  console.log('\n--- MODULE 3: Deterministic Fallback Generator ---');

  const fallbackResult = AIAnalysisEngine.generateDeterministicFallback(mockPkg, impactResult, 'TEST_MANUAL');

  assert(fallbackResult.symbol === 'KCHOL', 'Fallback result has matching symbol');
  assert(fallbackResult.modelUsed.includes('deterministic-fallback'), 'Model reflects deterministic-fallback');
  assert(typeof fallbackResult.generalOverview === 'string' && fallbackResult.generalOverview.length > 30, 'General overview is populated');
  assert(
    fallbackResult.impactBalance === 'Pozitif' || fallbackResult.impactBalance === 'Negatif' || fallbackResult.impactBalance === 'Nötr',
    `Impact balance is compliant ('Pozitif'|'Negatif'|'Nötr') -> got: ${fallbackResult.impactBalance}`
  );
  assert(Array.isArray(fallbackResult.keyFactors) && fallbackResult.keyFactors.length > 0, 'Key factors are populated');
  assert(typeof fallbackResult.detailedCommentary === 'string' && fallbackResult.detailedCommentary.length > 50, 'Detailed commentary is populated');
  assert(
    Boolean(fallbackResult.scenarios.baseline && fallbackResult.scenarios.optimistic && fallbackResult.scenarios.cautious),
    'Scenarios (baseline, optimistic, cautious) are fully structured'
  );
  assert(Array.isArray(fallbackResult.watchItems) && fallbackResult.watchItems.length > 0, 'Watch items are populated');
  assert(typeof fallbackResult.educationalTakeaway === 'string' && fallbackResult.educationalTakeaway.length > 20, 'Educational takeaway is populated');
  assert(Array.isArray(fallbackResult.sourceReferences) && fallbackResult.sourceReferences.length > 0, 'Source references are populated with provenance');

  // Verify NO banned phrases in fallback output
  const fallbackStr = JSON.stringify(fallbackResult).toLowerCase();
  assert(!fallbackStr.includes('kesinlikle al'), 'Fallback contains NO "kesinlikle al"');
  assert(!fallbackStr.includes('hedef fiyat:'), 'Fallback contains NO "hedef fiyat"');
  assert(!fallbackStr.includes('health score:'), 'Fallback contains NO composite "Health Score"');

  // ==========================================================================
  // MODULE 4: Compliance Guardrail Sanitizer
  // ==========================================================================
  console.log('\n--- MODULE 4: Compliance Guardrail Sanitizer ---');

  // Fabricate non-compliant output to test guardrail
  const nonCompliantAnalysis: AIAnalysisResult = {
    symbol: 'KCHOL',
    companyName: 'Koç Holding A.Ş.',
    generatedAt: new Date().toISOString(),
    modelUsed: 'mock-test',
    promptVersion: '1.0.0',
    snapshotFingerprint: 'mock_fingerprint',
    isCached: false,
    generalOverview: 'Hisse için kesinlikle al tavsiyesi veriyoruz.',
    impactBalance: 'Pozitif',
    impactBalanceReasoning: 'Hedef fiyat 350 TL seviyesindedir.',
    keyFactors: [
      {
        title: 'Yatırım',
        transmissionChannel: 'REVENUE',
        direction: 'positive',
        causalExplanation: 'Yatırım operasyonları büyütüyor.',
        source: 'KAP'
      }
    ],
    detailedCommentary: 'Büyüme güçlü, mutlaka portföyünüze ekleyin. Genel alım fırsatıdır.',
    scenarios: {
      baseline: 'Mevcut seyir.',
      optimistic: 'Güçlü talep.',
      cautious: 'Maliyet baskısı.'
    },
    watchItems: ['İşletme sermayesi'],
    educationalTakeaway: 'Nakit akımının önemi.',
    dataUncertainties: [],
    sourceReferences: [{ source: 'KAP', details: 'Kamuyu Aydınlatma Platformu' }]
  };

  (AIAnalysisEngine as any).enforceComplianceGuardrail(nonCompliantAnalysis);

  assert(
    !nonCompliantAnalysis.generalOverview.includes('kesinlikle al'),
    'Guardrail strips "kesinlikle al" phrase'
  );
  assert(
    !nonCompliantAnalysis.detailedCommentary.includes('portföyünüze ekleyin'),
    'Guardrail strips "portföyünüze ekleyin" phrase'
  );
  assert(
    !nonCompliantAnalysis.detailedCommentary.includes('alım fırsatıdır'),
    'Guardrail strips "alım fırsatıdır" phrase'
  );

  // ==========================================================================
  // MODULE 5: Fingerprint Caching & Snapshot Integration
  // ==========================================================================
  console.log('\n--- MODULE 5: Fingerprint Caching & Snapshot Storage ---');

  AIAnalysisEngine.clearCache();

  // Test caching: First call analyzes (or fallbacks), second call with identical fingerprint must return cached
  const testPkg = createMockDataPackage();
  const testImpact = FinancialImpactEngine.evaluate(testPkg);
  testPkg.impactAnalysis = testImpact;

  // First call
  const analysis1 = await AIAnalysisEngine.analyze(testPkg, { timeoutMs: 15000 });
  assert(Boolean(analysis1 && analysis1.symbol === 'KCHOL'), 'First analysis call succeeded');
  assert(analysis1.isCached === false, 'First analysis call has isCached = false');

  // Second call with same fingerprint
  const analysis2 = await AIAnalysisEngine.analyze(testPkg, { timeoutMs: 15000 });
  assert(Boolean(analysis2 && analysis2.symbol === 'KCHOL'), 'Second analysis call succeeded');
  assert(analysis2.isCached === true, 'Second call with identical fingerprint returned from CACHE (isCached = true)');
  assert(analysis2.snapshotFingerprint === testPkg.fingerprint, 'Cached result fingerprint matches original');

  // Test snapshot attachment
  const saveSnapshotResult = await AnalysisSnapshotService.saveSnapshot(testPkg, testImpact.evaluatedFactors);
  assert(saveSnapshotResult.success, 'AnalysisSnapshotService saved snapshot record');

  const attached = await AnalysisSnapshotService.attachAIAnalysis(testPkg.fingerprint, analysis1);
  assert(attached === true, 'AnalysisSnapshotService successfully attached AI Analysis to snapshot');

  const latestSnapshot = await AnalysisSnapshotService.getLatestSnapshot('KCHOL');
  assert(latestSnapshot !== null, 'Retrieved latest snapshot for KCHOL');
  if (latestSnapshot) {
    assert(latestSnapshot.status === 'ANALYZED', `Snapshot status updated to 'ANALYZED' (got: ${latestSnapshot.status})`);
    assert(Boolean(latestSnapshot.ai_analysis), 'Snapshot record holds attached ai_analysis object');
  }

  // ==========================================================================
  // MODULE 6: Real BIST Symbol Integration Test (THYAO)
  // ==========================================================================
  console.log('\n--- MODULE 6: Real BIST Symbol End-to-End Test (THYAO) ---');

  try {
    console.log('   Assembling real BIST data for THYAO via AnalysisOrchestrator...');
    const thyaoAssembly = await AnalysisOrchestrator.assembleSymbolData('THYAO');
    assert(thyaoAssembly.success === true, 'Real data package assembly succeeded for THYAO');
    const realDataPackage = thyaoAssembly.dataPackage!;
    assert(Boolean(realDataPackage && realDataPackage.symbol === 'THYAO'), 'Real data package assembled for THYAO');
    assert(Boolean(realDataPackage.marketData?.currentPrice), `THYAO current price present: ${realDataPackage.marketData?.currentPrice} ₺`);

    console.log('   Evaluating impact via FinancialImpactEngine...');
    const realImpact = FinancialImpactEngine.evaluate(realDataPackage);
    assert(realImpact.evaluatedFactors.length > 0, `THYAO impact evaluated (${realImpact.evaluatedFactors.length} factors)`);
    const netBalance = realImpact.dominantDrivers.length >= realImpact.counterDrivers.length ? 'Pozitif' : 'Negatif';
    assert(Boolean(netBalance), `THYAO net impact balance computed: ${netBalance} (${realImpact.dominantDrivers.length} dominant vs ${realImpact.counterDrivers.length} counter)`);

    console.log('   Running AI Analysis Engine for THYAO (Live Gemini with Fallback)...');
    const realAnalysis = await AIAnalysisEngine.analyze(realDataPackage, { timeoutMs: 25000 });
    
    assert(realAnalysis.symbol === 'THYAO', 'AI Analysis symbol matches THYAO');
    assert(Boolean(realAnalysis.modelUsed), `AI Model used: ${realAnalysis.modelUsed}`);
    assert(Boolean(realAnalysis.generalOverview && realAnalysis.generalOverview.length > 30), 'THYAO general overview generated');
    assert(realAnalysis.keyFactors.length > 0, `THYAO key factors generated (${realAnalysis.keyFactors.length} factors)`);
    assert(Boolean(realAnalysis.scenarios.baseline), 'THYAO baseline scenario generated');
    assert(Boolean(realAnalysis.scenarios.optimistic), 'THYAO optimistic scenario generated');
    assert(Boolean(realAnalysis.scenarios.cautious), 'THYAO cautious scenario generated');
    assert(
      realAnalysis.impactBalance === 'Pozitif' || realAnalysis.impactBalance === 'Negatif' || realAnalysis.impactBalance === 'Nötr',
      `THYAO impact balance valid: ${realAnalysis.impactBalance}`
    );
    
    console.log('\n   [THYAO AI Analysis Summary]');
    console.log('   Model:', realAnalysis.modelUsed);
    console.log('   Balance:', realAnalysis.impactBalance);
    console.log('   Overview:', realAnalysis.generalOverview.substring(0, 140) + '...');
    console.log('   Key Factors Count:', realAnalysis.keyFactors.length);
    console.log('   Source References Count:', realAnalysis.sourceReferences.length);
  } catch (err: any) {
    console.error('Real symbol test encountered error:', err.message);
    assert(false, 'Real BIST symbol test failed', err.message);
  }


  // ==========================================================================
  // SUMMARY
  // ==========================================================================
  console.log('\n======================================================');
  console.log(`TOTAL TESTS: ${testsPassed + testsFailed}`);
  console.log(`PASSED: ${testsPassed}`);
  console.log(`FAILED: ${testsFailed}`);
  console.log('======================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase4Tests().catch(err => {
  console.error('Unhandled test suite error:', err);
  process.exit(1);
});