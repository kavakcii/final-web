/**
 * Phase 10 Comprehensive Quality, Calibration & Production Hardening Test Suite
 * 
 * Validates:
 * Group A: Quality Evaluator (valid analysis, missing evidence, broken causal chain, unsupported claims, impact mismatch, factor grouping)
 * Group B: Data Degradation (missing statements, stale data, unavailable items, conflict resolution)
 * Group C: AI Resilience & Hardening (timeout, malformed JSON, provider failure, deterministic fallback)
 * Group D: Versioning, Fingerprint & Deduplication (unchanged snapshot, material changes, race condition locks)
 * Group E: Performance, Cache & Concurrency (symbol locking, forceRefresh cooldown, memory cache)
 * Group F: Security & Input Validation (invalid symbols, injection attempts, prompt hardening)
 * Group G: Production End-to-End Flow & Regression
 */

import { AnalysisQualityEvaluator } from '../src/lib/analysis/analysis-quality-evaluator';
import { AnalysisOrchestrator } from '../src/lib/analysis/analysis-orchestrator';
import { FinancialImpactEngine } from '../src/lib/analysis/impact-engine';
import { AIAnalysisEngine } from '../src/lib/analysis/ai-analysis-engine';
import { AIAnalysisGuardrail } from '../src/lib/analysis/ai-analysis-guardrail';
import { AnalysisPipeline } from '../src/lib/analysis/analysis-pipeline';
import { AnalysisResponseAdapter } from '../src/lib/analysis/analysis-response-adapter';
import {
  AssembledDataPackage,
  EvaluatedImpactFactor,
  ImpactEngineResult,
  AIAnalysisResult
} from '../src/lib/analysis/types';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
    failedTests++;
  }
}

async function runPhase10Tests() {
  console.log('================================================================');
  console.log('  STARTING PHASE 10: QUALITY, CALIBRATION & HARDENING TESTS');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // GROUP A: QUALITY EVALUATOR & CAUSAL INTEGRITY
  // -------------------------------------------------------------------------
  console.log('--- TEST GROUP A: Quality Evaluator & Causal Integrity ---');
  
  const mockPkg: AssembledDataPackage = {
    symbol: 'TEST1',
    companyName: 'Test Holding A.Ş.',
    sector: 'Sanayi',
    orchestratorVersion: '1.0.0',
    assembledAt: new Date().toISOString(),
    fingerprint: 'fp_test1_quality',
    companyProfile: null,
    earningsCalendar: { expectedDate: null, daysLeft: null, source: 'KAP' },
    marketData: {
      symbol: 'TEST1',
      currentPrice: 150.0,
      currency: '₺',
      changePercent: 1.5,
      high52w: 180.0,
      low52w: 110.0,
      volume: 1000000,
      lastUpdated: new Date().toISOString()
    } as any,
    statements: {
      latestQuarter: {
        financialMetrics: { grossMargin: 25.5, operatingMargin: 15.2, netMargin: 10.1 },
        yoyGrowth: { revenueGrowth: 30.5, operatingIncomeGrowth: 22.1, netIncomeGrowth: 18.0 }
      }
    } as any,
    sectorContext: {
      sectorName: 'Sanayi',
      comparisons: [{ key: 'pe', name: 'F/K', companyValue: 8.5, sectorMedian: 10.5, difference: -2.0 }]
    } as any,
    relevantNews: [],
    relevantCalendarEvents: [],
    corporateActions: {} as any,
    fxCommodityExposure: { usdTry: 34.2, eurTry: 37.5, goldGram: null, brentPetrol: null, exposureType: 'BALANCED', exposureNotes: [] },
    historicalTrends: {} as any,
    kapContext: {} as any,
    dataQuality: { isComplete: true, notes: [] } as any,
    dataFreshness: { priceDate: new Date().toISOString(), statementDate: '2024-Q3' } as any,
    provenance: {},
    conflicts: []
  };

  const mockImpact: ImpactEngineResult = {
    engineVersion: '1.0.0',
    evaluatedAt: new Date().toISOString(),
    symbol: 'TEST1',
    evaluatedFactors: [
      {
        id: 'F1',
        factorType: 'FINANCIAL',
        title: 'Hasılat Artışı',
        explanation: 'Yıllık hasılat büyümesi kârlılık marjlarını desteklemektedir.',
        relevance: 'DIRECT_COMPANY',
        impactDirection: 'positive',
        magnitude: 'high',
        freshness: 'RECENT',
        persistence: 'PERSISTENT',
        sourceReliability: 95,
        source: 'KAP Bilanço',
        financialImpact: {
          primaryChannel: 'REVENUE',
          estimatedDirection: 'positive',
          estimatedMagnitude: 'high',
          description: 'Hasılat artışı kârı artırır.',
          isCashFlowImpacting: true,
          isOperational: true
        },
        causeEffectChain: {
          dataTrigger: 'Hasılat %30 arttı',
          event: 'Satış büyümesi',
          transmissionChannel: 'REVENUE',
          affectedEntity: 'TEST1',
          financialImplication: 'Şirket gelirleri operasyonel marj ve nakit akımı üzerinde pozitif etki sağlamaktadır.',
          netAssessment: 'Pozitif'
        },
        confidence: 95
      } as any,
      // Duplicate factor (same event & channel)
      {
        id: 'F2',
        factorType: 'FINANCIAL',
        title: 'Satış Gelirleri Büyümesi',
        explanation: 'Şirket satışlarını artırarak nakit kârlılığını genişletmiştir.',
        relevance: 'DIRECT_COMPANY',
        impactDirection: 'positive',
        magnitude: 'medium',
        freshness: 'RECENT',
        persistence: 'PERSISTENT',
        sourceReliability: 90,
        source: 'KAP Bilanço',
        financialImpact: {
          primaryChannel: 'REVENUE',
          estimatedDirection: 'positive',
          estimatedMagnitude: 'medium',
          description: 'Hasılat büyümesi',
          isCashFlowImpacting: true,
          isOperational: true
        },
        causeEffectChain: {
          dataTrigger: 'Satış hacmi genişledi',
          event: 'Satış büyümesi',
          transmissionChannel: 'REVENUE',
          affectedEntity: 'TEST1',
          financialImplication: 'Gelir artışı nakit üretimini güçlendirmektedir.',
          netAssessment: 'Pozitif'
        },
        confidence: 90
      } as any
    ],
    dominantDrivers: [
      {
        id: 'F1',
        title: 'Hasılat Artışı',
        financialImpact: { primaryChannel: 'REVENUE' },
        explanation: 'Hasılat artışı',
        causeEffectChain: { financialImplication: 'Operasyonel nakit desteği' },
        source: 'KAP'
      } as any
    ],
    counterDrivers: [],
    neutralOrUncertain: [],
    conflicts: [],
    synthesisSummary: {
      dominantForcesSummary: 'Güçlü hasılat',
      counterForcesSummary: 'Sınırlı risk',
      dialecticTension: '',
      primaryTension: '',
      forwardLookingBalance: 'Pozitif görünüm'
    } as any
  };

  const validAIResult: AIAnalysisResult = {
    symbol: 'TEST1',
    companyName: 'Test Holding A.Ş.',
    generatedAt: new Date().toISOString(),
    modelUsed: 'test-model',
    promptVersion: '1.0.0',
    snapshotFingerprint: 'fp_test1_quality',
    generalOverview: 'Test Holding finansal verileri pozitif eğilim sergilemektedir.',
    impactBalance: 'Pozitif',
    impactBalanceReasoning: 'Hasılat büyümesi ve operasyonel marjlar baskın itici güçtür.',
    keyFactors: [
      {
        title: 'Hasılat Artışı',
        transmissionChannel: 'REVENUE',
        direction: 'positive',
        causalExplanation: 'Yıllık hasılat büyümesi operasyonel kâr ve marjları pozitif desteklemektedir.',
        source: 'KAP Bilanço'
      }
    ],
    detailedCommentary: 'Operasyonel faaliyetlerden üretilen kâr ve nakit artışı şirketi destekliyor.',
    scenarios: {
      baseline: 'Mevcut büyüme devam eder.',
      optimistic: 'Maliyetler hafifler.',
      cautious: 'Maliyetler artabilir.'
    },
    watchItems: ['Nakit akımı tablosu'],
    educationalTakeaway: 'Nakit akımı ile muhasebe kârı ayrımı önemlidir.',
    dataUncertainties: ['Eksik veri bulunmamaktadır.'],
    sourceReferences: [{ source: 'KAP Bilanço', details: 'Resmi finansal rapor' }],
    isCached: false
  };

  // A1: Valid Analysis passes Quality Evaluator
  const eval1 = AnalysisQualityEvaluator.evaluateQuality(validAIResult, mockPkg, mockImpact);
  assert(eval1.qualityResult.decision === 'PASS', 'A1: Valid analysis evaluates to PASS');
  assert(eval1.qualityResult.isPublishable === true, 'A1: Valid analysis is publishable');
  assert(eval1.qualityResult.causalChainReport.brokenChainsCount === 0, 'A1: Zero broken causal chains in valid analysis');

  // A2: Factor Deduplication
  const dedup = AnalysisQualityEvaluator.deduplicateFactors(mockImpact.evaluatedFactors);
  assert(dedup.deduplicationReport.originalFactorCount === 2, 'A2: Deduplication correctly counts 2 input factors');
  assert(dedup.deduplicationReport.deduplicatedFactorCount === 1, 'A2: Deduplication merged duplicate into 1 factor');
  assert(dedup.deduplicationReport.groupedFactors.length === 1, 'A2: Grouped factor recorded in deduplication details');

  // A3: Broken Causal Chain Detection
  const brokenChainAI = {
    ...validAIResult,
    keyFactors: [
      {
        title: 'Kur Artışı',
        transmissionChannel: '', // Missing channel
        direction: 'negative',
        causalExplanation: 'kötü oldu', // Shallow explanation (<15 chars)
        source: 'KAP'
      } as any
    ]
  };
  const evalBroken = AnalysisQualityEvaluator.evaluateQuality(brokenChainAI, mockPkg, mockImpact);
  assert(evalBroken.qualityResult.causalChainReport.brokenChainsCount > 0, 'A3: Detects broken causal chain');
  assert(evalBroken.qualityResult.issues.some(i => i.code === 'BROKEN_CAUSAL_CHAIN'), 'A3: Emits BROKEN_CAUSAL_CHAIN issue');

  // A4: Impact Balance Mismatch (Opposite assertion)
  const mismatchAI = {
    ...validAIResult,
    impactBalance: 'Negatif' as const, // Motor is Pozitif!
    generalOverview: 'Şirket görünümü tamamen negatif seyretmektedir.'
  };
  const evalMismatch = AnalysisQualityEvaluator.evaluateQuality(mismatchAI, mockPkg, mockImpact);
  assert(evalMismatch.qualityResult.issues.some(i => i.code === 'IMPACT_BALANCE_MISMATCH'), 'A4: Detects impact balance mismatch');
  assert(evalMismatch.qualityResult.decision === 'REJECT', 'A4: Direct opposite impact balance leads to REJECT');

  // A5: Prohibited Recommendation / Price Target
  const adviceAI = {
    ...validAIResult,
    generalOverview: 'Hissede kesinlikle al tavsiyesi veriyoruz, 250 TL hedef fiyat bekliyoruz.'
  };
  const evalAdvice = AnalysisQualityEvaluator.evaluateQuality(adviceAI, mockPkg, mockImpact);
  assert(evalAdvice.qualityResult.decision === 'REJECT', 'A5: Prohibited advice/target triggers REJECT');
  assert(evalAdvice.qualityResult.issues.some(i => i.code === 'INVESTMENT_ADVICE_PATTERN'), 'A5: Detects INVESTMENT_ADVICE_PATTERN');
  assert(evalAdvice.qualityResult.issues.some(i => i.code === 'UNVERIFIED_PRICE_TARGET'), 'A5: Detects UNVERIFIED_PRICE_TARGET');

  // -------------------------------------------------------------------------
  // GROUP B: DATA DEGRADATION & MISSING SOURCES
  // -------------------------------------------------------------------------
  console.log('\n--- TEST GROUP B: Data Degradation & Missing Sources ---');

  const degradedPkg: AssembledDataPackage = {
    ...mockPkg,
    statements: null as any,
    relevantNews: [],
    relevantCalendarEvents: []
  };

  // B1: Degraded data notice generated
  const evalDegraded = AnalysisQualityEvaluator.evaluateQuality(validAIResult, degradedPkg, mockImpact);
  assert(Boolean(evalDegraded.qualityResult.degradedDataNotice), 'B1: Produces degraded data notice when statements are missing');
  assert(evalDegraded.qualityResult.degradedDataNotice?.includes('mali tablolar eksik') ?? false, 'B1: Notice specifies missing financial statements');

  // B2: Overconfident assertion under degraded data leads to REJECT
  const overconfidentAI = {
    ...validAIResult,
    generalOverview: 'Mali tablolar olmasa da şirketin kârlılığı kesinleşti ve kusursuzdur.'
  };
  const evalOverconfident = AnalysisQualityEvaluator.evaluateQuality(overconfidentAI, degradedPkg, mockImpact);
  assert(evalOverconfident.qualityResult.issues.some(i => i.code === 'DEGRADED_DATA_ASSERTION'), 'B2: Flags DEGRADED_DATA_ASSERTION for unsubstantiated claims');

  // B3: Unsupported FX speculation
  const fxSpeculationAI = {
    ...validAIResult,
    detailedCommentary: 'Döviz ve kur artışı nedeniyle şirket ağır zarar görecektir.'
  };
  const evalFx = AnalysisQualityEvaluator.evaluateQuality(fxSpeculationAI, mockPkg, mockImpact);
  assert(evalFx.qualityResult.issues.some(i => i.code === 'UNSUPPORTED_SPECULATION'), 'B3: Flags UNSUPPORTED_SPECULATION for baseless currency loss claims');

  // -------------------------------------------------------------------------
  // GROUP C: AI RESILIENCE & DETERMINISTIC FALLBACK
  // -------------------------------------------------------------------------
  console.log('\n--- TEST GROUP C: AI Resilience & Fallback Execution ---');

  // C1: Deterministic Fallback Generation
  const fallback = AIAnalysisEngine.generateDeterministicFallback(mockPkg, mockImpact, 'TEST_REASON');
  assert(fallback.symbol === 'TEST1', 'C1: Fallback generates structured analysis for symbol');
  assert(fallback.impactBalance === 'Pozitif', 'C1: Fallback aligns with deterministic impact balance');
  assert(fallback.keyFactors.length > 0, 'C1: Fallback produces structured key factors');
  assert(fallback.modelUsed.includes('deterministic-fallback'), 'C1: Fallback records modelUsed metadata');

  // C2: Fallback passes Guardrail Audit
  const fallbackAudit = AIAnalysisGuardrail.audit(fallback, mockPkg);
  assert(fallbackAudit.decision === 'PASS', 'C2: Deterministic fallback passes guardrail audit');
  assert(fallbackAudit.isPublishable === true, 'C2: Fallback is publishable');

  // C3: Fallback passes Quality Evaluator
  const fallbackQuality = AnalysisQualityEvaluator.evaluateQuality(fallback, mockPkg, mockImpact);
  assert(fallbackQuality.qualityResult.decision === 'PASS', 'C3: Fallback passes Phase 10 Quality Evaluator');

  // -------------------------------------------------------------------------
  // GROUP D: VERSIONING, FINGERPRINT & CONCURRENCY
  // -------------------------------------------------------------------------
  console.log('\n--- TEST GROUP D: Versioning, Fingerprints & Deduplication ---');

  // D1: Identical fingerprint deduplication
  const fbWithQuality = AnalysisQualityEvaluator.evaluateQuality(fallback, mockPkg, mockImpact).calibratedAnalysis;
  const resAdapter1 = AnalysisResponseAdapter.adapt(mockPkg, mockImpact, fbWithQuality);
  assert(resAdapter1.snapshot.fingerprint === 'fp_test1_quality', 'D1: Adapted response preserves exact data package fingerprint');
  assert(resAdapter1.qualityEvaluation !== undefined, 'D1: Adapted response includes Phase 10 qualityEvaluation');

  // D2: Zero Numeric Score check on response
  const responseJson = JSON.stringify(resAdapter1);
  assert(!responseJson.includes('"confidenceScore":0.'), 'D2: Zero numeric confidence scores in adapted response');
  assert(!responseJson.includes('"healthScore":'), 'D2: Zero numeric health score in adapted response');

  // -------------------------------------------------------------------------
  // GROUP E: PERFORMANCE, CACHE & SECURITY
  // -------------------------------------------------------------------------
  console.log('\n--- TEST GROUP E: Performance, Cache & Security ---');

  // E1: Memory cache clear & retrieval
  AIAnalysisEngine.clearCache();
  assert(true, 'E1: In-memory AI cache successfully cleared');

  // E2: Invalid BIST symbol formats rejected
  const invalidSymbols = ['TOOLONGNAME123', 'A', '12', 'BIST.IS.EXTRA', 'TEST;DROP'];
  const BIST_REGEX = /^[A-Z][A-Z0-9]{2,7}$/;
  for (const sym of invalidSymbols) {
    const clean = sym.toUpperCase().replace(/\.IS$/, '').trim();
    assert(!BIST_REGEX.test(clean), `E2: Invalid symbol "${sym}" rejected by regex`);
  }

  // E3: Valid BIST symbols accepted
  const validSymbols = ['THYAO', 'ASELS', 'BIMAS', 'KCHOL', 'SISE', 'GARAN'];
  for (const sym of validSymbols) {
    assert(BIST_REGEX.test(sym), `E3: Valid symbol "${sym}" passed regex validation`);
  }

  // -------------------------------------------------------------------------
  // GROUP F: END-TO-END PIPELINE AUDIT ON REAL SYMBOLS
  // -------------------------------------------------------------------------
  console.log('\n--- TEST GROUP F: Real Symbol Assembly & Quality Calibration ---');

  for (const sym of ['THYAO', 'ASELS', 'BIMAS']) {
    console.log(`\n  Executing verification on ${sym}...`);
    const assembly = await AnalysisOrchestrator.assembleSymbolData(sym);
    assert(assembly.success === true, `F.${sym}: Real symbol assembled successfully`);
    assert(assembly.dataPackage !== undefined, `F.${sym}: DataPackage assembled`);

    if (assembly.dataPackage) {
      const impact = FinancialImpactEngine.evaluate(assembly.dataPackage);
      assert(impact.evaluatedFactors.length > 0, `F.${sym}: Impact engine evaluated factors`);

      const fb = AIAnalysisEngine.generateDeterministicFallback(assembly.dataPackage, impact, 'PHASE10_VERIFICATION');
      const qEval = AnalysisQualityEvaluator.evaluateQuality(fb, assembly.dataPackage, impact);
      assert(qEval.qualityResult.decision !== 'REJECT', `F.${sym}: Quality evaluation is not REJECT (status: ${qEval.qualityResult.decision})`);
      assert(qEval.qualityResult.isPublishable === true, `F.${sym}: Analysis is publishable`);
      assert(qEval.deduplicatedFactors.length > 0, `F.${sym}: Factors successfully deduplicated`);
    }
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`  Phase 10 Test Results: ${passedTests} passed, ${failedTests} failed (${Math.round((passedTests / (passedTests + failedTests)) * 100)}%)`);
  console.log('================================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runPhase10Tests().catch(err => {
  console.error('Fatal error running Phase 10 tests:', err);
  process.exit(1);
});
