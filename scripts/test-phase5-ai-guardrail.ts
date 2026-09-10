/**
 * FinAi Analysis System - Phase 5 AI Guardrail & Quality Control Test Suite
 * 
 * Verifies Schema Validation, SPK Compliance, Hallucination & Data Grounding,
 * Source Provenance, Causality Transmission Channels, Dialectic Balance,
 * Unavailable Data Respect, Fallback Audit, and Real BIST Symbols (THYAO, ASELS, BIMAS).
 */

import fs from 'node:fs';
import path from 'node:path';

// Load .env.local for production credentials
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

import { AIAnalysisGuardrail } from '../src/lib/analysis/ai-analysis-guardrail';
import { AIAnalysisEngine, AIContextBuilder } from '../src/lib/analysis/ai-analysis-engine';
import { FinancialImpactEngine } from '../src/lib/analysis/impact-engine';
import { AnalysisOrchestrator } from '../src/lib/analysis/analysis-orchestrator';
import { AnalysisSnapshotService } from '../src/lib/analysis/analysis-snapshot-service';
import {
  AssembledDataPackage,
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

// Helper: Mock Data Package Builder
function createMockPackage(overrides?: Partial<AssembledDataPackage>): AssembledDataPackage {
  return {
    symbol: 'KCHOL',
    companyName: 'Koç Holding A.Ş.',
    sector: 'Holding',
    orchestratorVersion: '1.0.0-phase5',
    assembledAt: new Date().toISOString(),
    fingerprint: 'mock_kchol_p5_fp_' + Math.random().toString(36).substring(7),
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
    historicalTrends: {
      coverage: { quarterCount: 8, annualCount: 4, statementType: 'CONSOLIDATED' },
      growthAnalysis: {
        cagr: { revenueCagr3Y: 45.2, netIncomeCagr3Y: 35.1 },
        metrics: {}
      },
      metricDirections: {
        grossMargin: 'EXPANDING',
        operatingMargin: 'EXPANDING',
        debtToAssets: 'STABLE'
      },
      cashFlowTrends: [
        {
          period: '2026 Q2',
          operatingCashFlow: 35000000000,
          freeCashFlow: 18000000000
        }
      ]
    } as any,
    sectorContext: {
      category: 'INDUSTRIAL',
      sectorName: 'Holding',
      peersCount: 8,
      unsupportedMetrics: [],
      comparisons: [
        {
          key: 'netMargin',
          name: 'Net Kâr Marjı',
          unit: '%',
          formatType: 'percent',
          companyValue: 9.1,
          formattedCompanyValue: '%9.1',
          sectorMedian: 7.8,
          formattedSectorMedian: '%7.8',
          difference: 1.3,
          formattedDifference: '+%1.3',
          percentile: 75,
          sampleSize: 8,
          validCompanyCount: 8,
          status: 'available'
        }
      ]
    },
    corporateActions: {
      historicalDividendsCount: 15,
      latestDividends: [
        {
          grossDividend: 8.5,
          netDividend: 7.65,
          paymentDate: '2026-04-15',
          recordDate: '2026-04-14',
          exDividendDate: '2026-04-14',
          currency: 'TRY'
        }
      ]
    },
    relevantNews: [
      {
        id: 'news-kchol-1',
        title: 'Koç Holding yeni yeşil enerji yatırımını açıkladı',
        summary: 'Kapasite artırılacak.',
        pubDate: '2026-09-08',
        source: 'KAP Bildirimi',
        sentiment: 'bullish',
        relevanceScore: 90
      }
    ],
    relevantCalendarEvents: [
      {
        id: 'cal-kchol-1',
        country: 'TR',
        event: 'TCMB Faiz Kararı',
        dateFormatted: '24 Eylül 2026',
        importance: 'HIGH',
        relevanceScore: 85,
        category: 'MONETARY_POLICY'
      }
    ],
    earningsCalendar: {
      expectedDate: '2026-11-05',
      daysLeft: 56,
      source: 'KAP'
    },
    fxCommodityExposure: {
      exposureType: 'BALANCED',
      usdTry: 34.2,
      brentPetrol: 82.5,
      exposureNotes: ['Doğal hedge']
    },
    kapContext: {
      hasExactProfile: true,
      kapProfileUrl: 'https://www.kap.org.tr/tr/sirket-bilgileri/genel/123-koc-holding-a-s',
      kapDisclosuresUrl: 'https://www.kap.org.tr/tr/sirket-bildirimleri/123',
      source: 'KAP_MEMBER_REGISTRY'
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
      price: { source: 'BIST Direct Feed', fetchedAt: new Date().toISOString(), isFallback: false, provider: 'BIST', reliabilityScore: 100 },
      financials: { source: 'KAP / Kamuyu Aydınlatma Platformu', fetchedAt: new Date().toISOString(), isFallback: false, provider: 'KAP', reliabilityScore: 98 }
    },
    conflicts: [],
    ...overrides
  } as unknown as AssembledDataPackage;
}

// Helper: Clean Valid AI Analysis
function createValidAnalysis(overrides?: Partial<AIAnalysisResult>): AIAnalysisResult {
  return {
    symbol: 'KCHOL',
    companyName: 'Koç Holding A.Ş.',
    generatedAt: new Date().toISOString(),
    modelUsed: 'gemini-1.5-flash',
    promptVersion: '1.0.0',
    snapshotFingerprint: 'mock_kchol_p5_fp_valid',
    isCached: false,
    generalOverview: 'Koç Holding (KCHOL), Holding sektöründe faaliyet göstermekte olup mevcut finansal verileri güçlü operasyonel kârlılık sergilemektedir. Cari piyasa fiyatı 215.40 ₺ seviyesindedir.',
    impactBalance: 'Pozitif',
    impactBalanceReasoning: 'Büyüyen hasılat (%42.5 artış) ve genişleyen faaliyet marjları, finansman maliyetlerinin yarattığı baskıya rağmen net kâr kalitesini desteklemektedir.',
    keyFactors: [
      {
        title: 'Operasyonel Büyüme ve Hasılat Artışı',
        transmissionChannel: 'REVENUE',
        direction: 'positive',
        causalExplanation: 'Grup şirketlerinin artan ihracat ve iç pazar satış hacmi hasılatı %42.5 artırarak kârlılığı desteklemiştir.',
        source: 'KAP / Finansal Tablolar'
      },
      {
        title: 'Finansman Maliyetleri ve Faiz Baskısı',
        transmissionChannel: 'FINANCING_COST',
        direction: 'negative',
        causalExplanation: 'Yüksek politika faizi ortamında kısa vadeli borçlanma giderleri net kâr marjı üzerinde kısmi baskı oluşturmaktadır.',
        source: 'TCMB & Mali Tablolar'
      }
    ],
    detailedCommentary: 'Şirketin son çeyrek sonuçlarında hasılat gelişimi ile brüt kâr marjı (%21.4) arasındaki uyum çekirdek iş gücünü teyit etmektedir. Faaliyet kârı güçlü seyrederken serbest nakit akımı pozitif bölgede kalarak kârın nakde dönüşüm kalitesini desteklemektedir.',
    scenarios: {
      baseline: 'Mevcut operasyonel performansın ve brüt kârlılık marjlarının cari dengede sürdürülmesi.',
      optimistic: 'Maliyet baskılarının hafiflemesi ve ihracat talebinin güçlenmesi durumunda kârlılık marjları desteklenebilir.',
      cautious: 'Finansman giderlerinin artması veya makro dalgalanmalar kâr marjları üzerinde baskı yaratabilir.'
    },
    watchItems: [
      'Gelecek çeyrek işletme sermayesi ve nakit akım dinamikleri',
      'TCMB faiz patikası ve borçlanma giderleri'
    ],
    educationalTakeaway: 'Finansal analizde kâr rakamı tek başına yeterli bir gösterge değildir; kârın ne kadarının operasyonel faaliyetlerden, ne kadarının nakit olarak üretildiği birlikte incelenmelidir.',
    dataUncertainties: ['Eksik veri bulunmamaktadır.'],
    sourceReferences: [
      { source: 'Kamuyu Aydınlatma Platformu (KAP)', details: '2026 Q2 Konsolide Mali Tablolar' },
      { source: 'Borsa İstanbul (BIST)', details: 'Güncel Fiyat ve Hacim Verileri' }
    ],
    ...overrides
  };
}

async function runPhase5Tests() {
  console.log('\n======================================================');
  console.log('   FINAI ANALYSIS SYSTEM - PHASE 5 TEST SUITE');
  console.log('   AI Guardrail & Quality Control Verification');
  console.log('======================================================\n');

  const pkg = createMockPackage();
  const impact = FinancialImpactEngine.evaluate(pkg);
  const context = AIContextBuilder.buildContext(pkg, impact);

  // ==========================================================================
  // MODULE 1: Valid AI Analysis -> PASS
  // ==========================================================================
  console.log('--- MODULE 1: Baseline Valid AI Analysis ---');

  const validAnalysis = createValidAnalysis();
  const validReport = AIAnalysisGuardrail.audit(validAnalysis, pkg, context);

  assert(validReport.decision === 'PASS', `Valid analysis gets PASS decision (got: ${validReport.decision})`);
  assert(validReport.isPublishable === true, 'isPublishable is true');
  assert(validReport.violations.length === 0, `Violations count is 0 (got: ${validReport.violations.length})`);
  assert(validReport.guardrailVersion === '1.0.0', 'Guardrail version is 1.0.0');
  assert(validReport.validatedClaims.length > 0, `Validated claims detected (${validReport.validatedClaims.length} claims verified against context)`);

  // ==========================================================================
  // MODULE 2: Schema & Structure Validation -> REJECT
  // ==========================================================================
  console.log('\n--- MODULE 2: Schema / Structural Breaches ---');

  // Case A: Missing required field
  const missingFieldAnalysis = createValidAnalysis({ generalOverview: '' });
  const schemaReportA = AIAnalysisGuardrail.audit(missingFieldAnalysis, pkg, context);
  assert(schemaReportA.decision === 'REJECT', 'Missing required field triggers REJECT');
  assert(schemaReportA.violations.some(v => v.code === 'SCHEMA_INVALID'), 'Violations include SCHEMA_INVALID');

  // Case B: Invalid impactBalance enum
  const badEnumAnalysis = createValidAnalysis({ impactBalance: 'ÇOK_İYİ' as any });
  const schemaReportB = AIAnalysisGuardrail.audit(badEnumAnalysis, pkg, context);
  assert(schemaReportB.decision === 'REJECT', 'Invalid impactBalance enum triggers REJECT');

  // Case C: Missing scenarios
  const badScenariosAnalysis = createValidAnalysis({ scenarios: { baseline: '', optimistic: '', cautious: '' } });
  const schemaReportC = AIAnalysisGuardrail.audit(badScenariosAnalysis, pkg, context);
  assert(schemaReportC.decision === 'REJECT', 'Empty scenarios trigger REJECT');

  // ==========================================================================
  // MODULE 3: SPK Investment Advice & Target Price -> REJECT
  // ==========================================================================
  console.log('\n--- MODULE 3: SPK Regulatory Compliance & Advice Breaches ---');

  // Case A: Direct Buy advice
  const buyAdviceAnalysis = createValidAnalysis({
    detailedCommentary: 'Hisse için kesinlikle al tavsiyesi veriyoruz. Portföyünüze ekleyin.'
  });
  const adviceReport = AIAnalysisGuardrail.audit(buyAdviceAnalysis, pkg, context);
  assert(adviceReport.decision === 'REJECT', 'Direct buy advice triggers REJECT');
  assert(adviceReport.violations.some(v => v.code === 'INVESTMENT_ADVICE'), 'Violation code is INVESTMENT_ADVICE');
  assert(adviceReport.complianceViolations.length > 0, 'Compliance violations list populated');

  // Case B: Target Price
  const targetPriceAnalysis = createValidAnalysis({
    generalOverview: 'Hissede 12 aylık hedef fiyat 350 TL seviyesinde bulunmaktadır.'
  });
  const targetReport = AIAnalysisGuardrail.audit(targetPriceAnalysis, pkg, context);
  assert(targetReport.decision === 'REJECT', 'Specific target price triggers REJECT');
  assert(targetReport.violations.some(v => v.code === 'TARGET_PRICE'), 'Violation code is TARGET_PRICE');

  // Case C: Absolute Guarantee / Certainty
  const certaintyAnalysis = createValidAnalysis({
    detailedCommentary: 'Yatırımcılara garanti getiri sağlayacaktır, kesinlikle yükselecek bir yapıdadır.'
  });
  const certReport = AIAnalysisGuardrail.audit(certaintyAnalysis, pkg, context);
  assert(certReport.decision === 'REJECT', 'Absolute return guarantee triggers REJECT');
  assert(certReport.violations.some(v => v.code === 'UNGROUNDED_CERTAINTY'), 'Violation code is UNGROUNDED_CERTAINTY');

  // Case D: Composite Score
  const scoreAnalysis = createValidAnalysis({
    detailedCommentary: 'Şirketin FinAi Sağlık Skoru: 95/100 olarak hesaplanmıştır.'
  });
  const scoreReport = AIAnalysisGuardrail.audit(scoreAnalysis, pkg, context);
  assert(scoreReport.decision === 'REJECT', 'Prohibited health score triggers REJECT');

  // ==========================================================================
  // MODULE 4: Hallucination & Data Grounding -> REJECT
  // ==========================================================================
  console.log('\n--- MODULE 4: Hallucination & Data Grounding ---');

  // Context current price is 215.4 TL. AI hallucinates an entirely fabricated price "999 TL".
  const hallucinatedPriceAnalysis = createValidAnalysis({
    generalOverview: 'Şirketin hisse fiyatı şu anda 999 TL seviyesinde seyretmektedir.'
  });
  const hallReport = AIAnalysisGuardrail.audit(hallucinatedPriceAnalysis, pkg, context);
  assert(hallReport.decision === 'REJECT', 'Hallucinated price claim triggers REJECT');
  assert(hallReport.violations.some(v => v.code === 'HALLUCINATED_DATA'), 'Violation code is HALLUCINATED_DATA');

  // ==========================================================================
  // MODULE 5: Source & Provenance Matching -> REJECT
  // ==========================================================================
  console.log('\n--- MODULE 5: Source & URL Verification ---');

  // Case A: Fabricated URL
  const fakeUrlAnalysis = createValidAnalysis({
    sourceReferences: [
      { source: 'İçeriden Bilgi', details: 'Özel Haber', url: 'https://fake-insider-leaks.com/secret' }
    ]
  });
  const urlReport = AIAnalysisGuardrail.audit(fakeUrlAnalysis, pkg, context);
  assert(urlReport.decision === 'REJECT', 'Fabricated source URL triggers REJECT');
  assert(urlReport.violations.some(v => v.code === 'SOURCE_MISMATCH'), 'Violation code is SOURCE_MISMATCH');

  // Case B: Completely Unknown / Unofficial Source
  const fakeSourceAnalysis = createValidAnalysis({
    sourceReferences: [
      { source: 'Telegram Grubu Tüyoları', details: 'Bilinmeyen kanal' }
    ]
  });
  const srcReport = AIAnalysisGuardrail.audit(fakeSourceAnalysis, pkg, context);
  assert(srcReport.decision === 'REJECT', 'Unverified/fake source name triggers REJECT');

  // ==========================================================================
  // MODULE 6: Causality & Transmission Channels -> PASS / WARN
  // ==========================================================================
  console.log('\n--- MODULE 6: Causality & Transmission Channels ---');

  // Case A: Invalid transmission channel enum -> WARN
  const invalidChannelAnalysis = createValidAnalysis({
    keyFactors: [
      {
        title: 'Geçersiz Kanal Faktörü',
        transmissionChannel: 'BOGUS_CHANNEL' as any,
        direction: 'neutral',
        causalExplanation: 'Açıklama mevcut ancak kanal tipi finansal şemada tanımlı değil.',
        source: 'KAP'
      }
    ]
  });
  const chanReport = AIAnalysisGuardrail.audit(invalidChannelAnalysis, pkg, context);
  assert(chanReport.violations.some(v => v.code === 'CAUSALITY_VIOLATION'), 'Invalid transmission channel flagged as CAUSALITY_VIOLATION');
  assert(chanReport.decision === 'WARN', 'Causality channel warning results in WARN (not crash)');

  // ==========================================================================
  // MODULE 7: Impact Balance Contradiction -> WARN
  // ==========================================================================
  console.log('\n--- MODULE 7: Impact Balance & Dialectic Alignment ---');

  // Marked 'Pozitif' but all factors are negative
  const contradictoryAnalysis = createValidAnalysis({
    impactBalance: 'Pozitif',
    keyFactors: [
      {
        title: 'Baskı 1',
        transmissionChannel: 'FINANCING_COST',
        direction: 'negative',
        causalExplanation: 'Yüksek faiz giderleri net kârı baskılamaktadır.',
        source: 'KAP'
      },
      {
        title: 'Baskı 2',
        transmissionChannel: 'GROSS_MARGIN',
        direction: 'negative',
        causalExplanation: 'Girdi maliyetleri marjları daraltmaktadır.',
        source: 'KAP'
      }
    ]
  });
  const balanceReport = AIAnalysisGuardrail.audit(contradictoryAnalysis, pkg, context);
  assert(balanceReport.violations.some(v => v.code === 'IMPACT_BALANCE_CONTRADICTION'), 'Contradiction flagged as IMPACT_BALANCE_CONTRADICTION');
  assert(balanceReport.decision === 'WARN', 'Impact balance contradiction results in WARN');

  // ==========================================================================
  // MODULE 8: Unavailable Data Integrity -> REJECT
  // ==========================================================================
  console.log('\n--- MODULE 8: Unavailable Data Respect ---');

  const unavailableContext: AIAnalysisContext = {
    ...context,
    unavailableDataPoints: ['Serbest nakit akımı (FCF) verisi']
  };

  const fcfBreachAnalysis = createValidAnalysis({
    detailedCommentary: 'Şirketin serbest nakit akımı pozitiftir ve rekor seviyeye ulaşmıştır.'
  });
  const unavailReport = AIAnalysisGuardrail.audit(fcfBreachAnalysis, pkg, unavailableContext);
  assert(unavailReport.decision === 'REJECT', 'Stating unavailable metric as factual triggers REJECT');
  assert(unavailReport.violations.some(v => v.code === 'UNAVAILABLE_DATA_USED'), 'Violation code is UNAVAILABLE_DATA_USED');

  // ==========================================================================
  // MODULE 9: Deterministic Fallback Audit -> PASS
  // ==========================================================================
  console.log('\n--- MODULE 9: Deterministic Fallback Quality Audit ---');

  const fallback = AIAnalysisEngine.generateDeterministicFallback(pkg, impact, 'TEST_FALLBACK');
  const fallbackAudit = AIAnalysisGuardrail.audit(fallback, pkg, context);

  assert(fallbackAudit.decision === 'PASS', `Deterministic fallback analysis receives PASS (got: ${fallbackAudit.decision})`);
  assert(fallbackAudit.isPublishable === true, 'Fallback analysis is publishable');
  assert(fallbackAudit.violations.length === 0, `Fallback analysis has 0 violations (got: ${fallbackAudit.violations.length})`);

  // ==========================================================================
  // MODULE 10: Snapshot Integration with Guardrail
  // ==========================================================================
  console.log('\n--- MODULE 10: Snapshot Integration ---');

  const snapshotPkg = createMockPackage();
  const snapshotImpact = FinancialImpactEngine.evaluate(snapshotPkg);
  snapshotPkg.impactAnalysis = snapshotImpact;
  await AnalysisSnapshotService.saveSnapshot(snapshotPkg, snapshotImpact.evaluatedFactors);

  const analyzed = await AIAnalysisEngine.analyze(snapshotPkg, { timeoutMs: 15000 });
  assert(analyzed.guardrailReport !== undefined, 'Analyzed result has attached guardrailReport');
  assert(
    analyzed.guardrailReport?.decision === 'PASS' || analyzed.guardrailReport?.decision === 'WARN',
    `Analyzed result guardrail decision is publishable (${analyzed.guardrailReport?.decision})`
  );

  const latestSnap = await AnalysisSnapshotService.getLatestSnapshot('KCHOL');
  assert(latestSnap !== null, 'Snapshot retrieved for KCHOL');
  if (latestSnap) {
    assert(latestSnap.status === 'ANALYZED', `Snapshot status is ANALYZED (got: ${latestSnap.status})`);
    assert(latestSnap.guardrail_status !== undefined, `Snapshot guardrail_status recorded: ${latestSnap.guardrail_status}`);
  }

  // ==========================================================================
  // MODULE 11: Real BIST Symbols End-to-End Audits (THYAO, ASELS, BIMAS)
  // ==========================================================================
  console.log('\n--- MODULE 11: Real BIST Symbols End-to-End Audits ---');

  const realSymbols = ['THYAO', 'ASELS', 'BIMAS'];

  for (const sym of realSymbols) {
    console.log(`\n   >>> Auditing Real BIST Symbol: ${sym} <<<`);
    try {
      const assembly = await AnalysisOrchestrator.assembleSymbolData(sym);
      assert(assembly.success === true, `${sym} data assembled successfully`);
      const realPkg = assembly.dataPackage!;
      assert(Boolean(realPkg.marketData?.currentPrice), `${sym} current price present: ${realPkg.marketData?.currentPrice} ₺`);

      const realImpact = FinancialImpactEngine.evaluate(realPkg);
      realPkg.impactAnalysis = realImpact;
      assert(realImpact.evaluatedFactors.length > 0, `${sym} impact evaluated (${realImpact.evaluatedFactors.length} factors)`);

      const realAiResult = await AIAnalysisEngine.analyze(realPkg, { timeoutMs: 25000 });
      assert(Boolean(realAiResult && realAiResult.symbol === sym), `${sym} AI Analysis produced`);

      const report = realAiResult.guardrailReport;
      assert(report !== undefined, `${sym} Guardrail audit report attached`);
      assert(
        report?.decision === 'PASS' || report?.decision === 'WARN',
        `${sym} Guardrail decision is publishable: ${report?.decision} (Violations: ${report?.violations.length}, Warnings: ${report?.warnings.length})`
      );
      assert(report?.isPublishable === true, `${sym} analysis isPublishable = true`);

      console.log(`   [${sym} Guardrail Audit Summary]`);
      console.log(`   - Decision: ${report?.decision}`);
      console.log(`   - Model Used: ${realAiResult.modelUsed}`);
      console.log(`   - Impact Balance: ${realAiResult.impactBalance}`);
      console.log(`   - Validated Claims Count: ${report?.validatedClaims.length}`);
      console.log(`   - Source References Count: ${realAiResult.sourceReferences.length}`);
      if (report?.violations && report.violations.length > 0) {
        console.log(`   - Audit Violations:`, report.violations.map(v => `${v.code}: ${v.message}`));
      }
      if (report?.warnings && report.warnings.length > 0) {
        console.log(`   - Audit Warnings: ${report.warnings.join('; ')}`);
      }
    } catch (err: any) {
      console.error(`Error during real symbol audit for ${sym}:`, err.message);
      assert(false, `Real BIST audit failed for ${sym}`, err.message);
    }
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

runPhase5Tests().catch(err => {
  console.error('Unhandled Phase 5 test error:', err);
  process.exit(1);
});