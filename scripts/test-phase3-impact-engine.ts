/**
 * FinAi Analysis System - Phase 3 Impact Engine Test Suite
 * 
 * Verifies deterministic financial impact assessment, causal chains, multi-criteria
 * weighting, conflict tension resolution, and real BIST symbol integration.
 */

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { FinancialImpactEngine } from '../src/lib/analysis/impact-engine';
import { AnalysisOrchestrator } from '../src/lib/analysis/analysis-orchestrator';
import {
  AssembledDataPackage,
  EvaluatedImpactFactor,
  ImpactTransmissionChannel
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

// Mock AssembledDataPackage Builder for Controlled Scenario Tests
function createMockPackage(overrides?: Partial<AssembledDataPackage>): AssembledDataPackage {
  return {
    symbol: 'TESTX',
    companyName: 'Test Holding A.Ş.',
    sector: 'Havacılık',
    orchestratorVersion: '1.0.0-phase3',
    assembledAt: new Date().toISOString(),
    fingerprint: 'mock_sha256_hash',
    companyProfile: { companyName: 'Test Holding A.Ş.', sector: 'Ulaştırma' },
    marketData: {
      currentPrice: 320,
      changePercent: 1.5,
      high52w: 350,
      low52w: 200,
      volume: 15000000,
      lastTradeDate: '2026-09-10',
      marketCap: 440000000000,
      currency: 'TRY',
      isMarketOpen: true,
      priceSource: 'BIST',
      priceTimestamp: new Date().toISOString()
    },
    statements: {
      latestQuarter: { periodEnd: '2026-06-30', currency: 'TRY', isRestated: false },
      latestAnnual: { periodEnd: '2025-12-31', currency: 'TRY', isRestated: false },
      allQuartersCount: 8,
      allAnnualsCount: 4,
      quarters: [],
      annuals: [],
      ttm: null,
      currency: 'TRY',
      isRestated: false,
      validationStatus: 'VALID'
    },
    historicalTrends: {
      symbol: 'TESTX',
      growthAnalysis: {
        metrics: {
          revenue: {
            metricName: 'revenue',
            cagr3Y: 45.2,
            latestYoY: { yoyGrowthRate: 32.5, currentPeriod: '2026 Q2', priorPeriod: '2025 Q2' },
            trendDirection: 'ACCELERATING'
          },
          ebitda: {
            metricName: 'ebitda',
            cagr3Y: 40.0,
            latestYoY: { yoyGrowthRate: 28.0, currentPeriod: '2026 Q2', priorPeriod: '2025 Q2' },
            trendDirection: 'IMPROVING'
          }
        },
        revenueCagr3Y: 45.2,
        netIncomeCagr3Y: 25.0
      },
      metricDirections: {
        grossMargin: 'DETERIORATING',
        debtToAssets: 'DETERIORATING'
      },
      cashFlowTrends: [
        {
          period: '2026 Q2',
          operatingCashFlow: 12000000000,
          freeCashFlow: -2500000000 // Negative FCF due to CapEx
        }
      ]
    } as any,
    sectorContext: {
      category: 'INDUSTRIAL',
      sectorName: 'Ulaştırma',
      peersCount: 12,
      unsupportedMetrics: [],
      comparisons: [
        {
          metric: 'netMargin',
          key: 'netMargin',
          name: 'Net Kâr Marjı',
          unit: '%',
          formatType: 'percent',
          companyValue: 0.165, // 16.5%
          formattedCompanyValue: '%16.5',
          sectorMedian: 0.120, // 12.0%
          formattedSectorMedian: '%12.0',
          difference: 0.045, // +4.5% higher
          formattedDifference: '+%4.5',
          percentile: 78,
          sampleSize: 12,
          validCompanyCount: 12,
          status: 'available',
          reason: '',
          positionText: 'Sektör medyanının üzerinde',
          educationalNote: '',
          sector: 'INDUSTRIAL',
          p25: 0.08,
          formattedP25: '%8.0',
          p75: 0.15,
          formattedP75: '%15.0'
        }
      ]
    },
    relevantNews: [
      {
        id: 'news_1',
        title: 'OPEC petrol üretim kesintisini uzattı, petrol fiyatları yükselişte',
        description: 'Ham petrol fiyatları küresel arz kısıtlamalarıyla 85 dolar üzerine çıktı.',
        link: 'https://bloomberg.com/opec-cut',
        source: 'Bloomberg HT',
        pubDate: '2026-09-09T10:00:00Z',
        sentiment: 'bearish',
        impact: 'critical',
        slug: 'opec-kesinti',
        category: 'COMMODITIES',
        categoryLabel: 'Emtia',
        tickers: ['THYAO'],
        affectedAssets: ['THYAO']
      } as any
    ],
    relevantCalendarEvents: [
      {
        id: 'cal_1',
        event: 'TCMB Bir Hafta Vadeli Repo Faiz Oranı Kararı',
        country: 'TR',
        flag: '🇹🇷',
        dateFormatted: '15.09.2026',
        dateDayName: 'Perşembe',
        time: '14:00',
        forecast: '%45,00',
        previous: '%45,00',
        actual: '',
        impact: 'critical',
        weekOffset: 1
      }
    ],
    corporateActions: {
      historicalDividendsCount: 8,
      latestDividends: [{ exDate: '2026-04-15', grossAmount: 12.5 }],
      historicalSplitsCount: 2,
      splits: [],
      upcomingDividends: []
    },
    earningsCalendar: { expectedDate: null, daysLeft: null, source: 'HalkArz' },
    fxCommodityExposure: {
      usdTry: 38.5,
      eurTry: 42.1,
      goldGram: 3100,
      brentPetrol: 86.5,
      exposureType: 'FX_SENSITIVE',
      exposureNotes: ['Havacılık yakıt giderleri döviz ve petrol duyarlıdır.']
    },
    kapContext: {
      hasExactProfile: true,
      kapProfileUrl: 'https://www.kap.org.tr/tr/sirket-bilgileri/genel/TESTX',
      kapDisclosuresUrl: 'https://www.kap.org.tr/tr/bist-sirketler',
      source: 'KAP_MEMBER_REGISTRY'
    },
    dataQuality: {
      score: 95,
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
      newsLatestDate: '2026-09-09',
      macroEventLatestDate: '2026-09-15',
      isStale: false,
      staleReasons: []
    },
    provenance: {},
    conflicts: [],
    ...overrides
  };
}

async function runAllTests() {
  console.log('================================================================');
  console.log('FİNAİ ANALYSIS SYSTEM - PHASE 3 IMPACT ENGINE TEST SUITE');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // TEST GROUP 1: FINANCIAL WATERFALL EVALUATION
  // --------------------------------------------------------------------------
  console.log('--- TEST GROUP 1: Financial Waterfall Evaluation ---');
  const mockPkg = createMockPackage();
  const res1 = FinancialImpactEngine.evaluate(mockPkg);

  const revFactor = res1.evaluatedFactors.find(f => f.financialImpact.primaryChannel === 'REVENUE');
  assert(revFactor !== undefined, 'Revenue factor generated from top-line growth');
  assert(revFactor?.impactDirection === 'positive', 'Strong revenue growth (+32.5%) marked as positive direction');
  assert(revFactor?.financialImpact.isOperational === true, 'Revenue is operational');
  assert(revFactor?.causeEffectChain.transmissionChannel === 'REVENUE', 'Causal transmission channel is REVENUE');

  const grossMarginFactor = res1.evaluatedFactors.find(f => f.financialImpact.primaryChannel === 'GROSS_MARGIN');
  assert(grossMarginFactor !== undefined, 'Gross margin factor generated');
  assert(grossMarginFactor?.impactDirection === 'negative', 'Deteriorating gross margin correctly evaluated as negative');

  const opProfitFactor = res1.evaluatedFactors.find(f => f.financialImpact.primaryChannel === 'OPERATING_PROFIT');
  assert(opProfitFactor !== undefined, 'Operating profit / EBITDA factor generated');
  assert(opProfitFactor?.impactDirection === 'positive', 'EBITDA expansion (+28%) evaluated as positive');

  const finCostFactor = res1.evaluatedFactors.find(f => f.financialImpact.primaryChannel === 'FINANCING_COST');
  assert(finCostFactor !== undefined, 'Financing cost / debt burden factor generated');
  assert(finCostFactor?.impactDirection === 'negative', 'Rising leverage evaluated as negative financing cost factor');

  const cashFlowFactor = res1.evaluatedFactors.find(f => f.financialImpact.primaryChannel === 'CASH_FLOW');
  assert(cashFlowFactor !== undefined, 'Cash flow / FCF factor generated');
  assert(cashFlowFactor?.metricValue === -2500000000, 'Exact negative FCF value preserved without synthetic alteration');

  // --------------------------------------------------------------------------
  // TEST GROUP 2: CONFLICTING FORCES & TENSION RESOLUTION (No +1/-1 cancellation)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Conflicting Forces & Tension Resolution ---');
  assert(res1.conflicts.length >= 1, 'At least one dialectic conflict detected (Operating strength vs Financing burden)');
  const opVsFinConflict = res1.conflicts.find(c => c.id.includes('OP_VS_FIN'));
  assert(opVsFinConflict !== undefined, 'OPERATING_VS_FINANCING conflict identified');
  assert(opVsFinConflict?.positiveFactor.impactDirection === 'positive', 'Positive operating factor preserved');
  assert(opVsFinConflict?.negativeFactor.impactDirection === 'negative', 'Negative financing factor preserved');
  assert(opVsFinConflict?.dialecticSummary.length! > 20, 'Dialectic tension summary generated');
  assert(opVsFinConflict?.relativeResolution.length! > 20, 'Relative multi-criteria resolution generated');

  // Verify factors are flagged as conflicted
  assert(opProfitFactor?.isConflicted === true, 'Operating profit factor flagged as conflicted');
  assert(finCostFactor?.isConflicted === true, 'Financing cost factor flagged as conflicted');

  // --------------------------------------------------------------------------
  // TEST GROUP 3: NEWS CAUSAL TRANSMISSION (news-impact-matrix)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: News Causal Transmission ---');
  const newsFactor = res1.evaluatedFactors.find(f => f.factorType === 'NEWS');
  assert(newsFactor !== undefined, 'News factor generated from relevant news item');
  assert(newsFactor?.financialImpact.primaryChannel === 'GROSS_MARGIN', 'OPEC news correctly mapped to GROSS_MARGIN transmission channel');
  assert(newsFactor?.impactDirection === 'negative', 'Bearish OPEC oil news evaluated as negative impact');
  assert(newsFactor?.sourceReliability === 90, 'Bloomberg HT source reliability assigned 90 score');

  // --------------------------------------------------------------------------
  // TEST GROUP 4: MACRO & ECONOMIC CALENDAR EVALUATION
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: Macro & Economic Calendar Transmission ---');
  const macroFactor = res1.evaluatedFactors.find(f => f.factorType === 'MACRO_CALENDAR');
  assert(macroFactor !== undefined, 'Macro factor generated from economic calendar');
  assert(macroFactor?.financialImpact.primaryChannel === 'FINANCING_COST', 'TCMB interest rate event mapped to FINANCING_COST');
  assert(macroFactor?.relevance === 'MACRO', 'Directness correctly tagged as MACRO');
  assert(macroFactor?.persistence === 'STRUCTURAL', 'Monetary policy tagged as STRUCTURAL persistence');

  // --------------------------------------------------------------------------
  // TEST GROUP 5: COMMODITY & FX SENSITIVITY
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: Commodity & FX Sensitivity ---');
  const oilCommodityFactor = res1.evaluatedFactors.find(f => f.id.includes('COMMODITY_OIL'));
  assert(oilCommodityFactor !== undefined, 'Oil commodity sensitivity evaluated');
  assert(oilCommodityFactor?.financialImpact.primaryChannel === 'GROSS_MARGIN', 'Oil linked to GROSS_MARGIN for airline');
  assert(oilCommodityFactor?.impactDirection === 'negative', 'Oil at 86.5 $/bbl evaluated as cost headwind (negative)');

  const fxFactor = res1.evaluatedFactors.find(f => f.id.includes('FX_EXPOSURE'));
  assert(fxFactor !== undefined, 'FX exposure factor evaluated');
  assert(fxFactor?.financialImpact.primaryChannel === 'FX_GAIN_LOSS', 'FX mapped to FX_GAIN_LOSS transmission channel');

  // --------------------------------------------------------------------------
  // TEST GROUP 6: SECTOR COMPARATIVE POSITIONING
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 6: Sector Comparative Positioning ---');
  const sectorFactor = res1.evaluatedFactors.find(f => f.factorType === 'SECTOR');
  assert(sectorFactor !== undefined, 'Sector comparative factor generated');
  assert(sectorFactor?.impactDirection === 'positive', 'Company outperforming sector net margin (+4.5%) evaluated as positive');
  assert(sectorFactor?.benchmarkValue === 0.12, 'Sector median benchmark (12%) cleanly attached');

  // --------------------------------------------------------------------------
  // TEST GROUP 7: DIVIDEND CAPACITY & CAPITAL RETURN
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 7: Dividend Capacity & Capital Return ---');
  const divFactor = res1.evaluatedFactors.find(f => f.id.includes('DIVIDEND_CAPACITY'));
  assert(divFactor !== undefined, 'Dividend capacity factor generated');
  assert(divFactor?.impactDirection === 'positive', 'Historical dividend payer evaluated as positive capital structure factor');
  assert(divFactor?.financialImpact.primaryChannel === 'CAPITAL_STRUCTURE', 'Dividend mapped to CAPITAL_STRUCTURE channel');

  // --------------------------------------------------------------------------
  // TEST GROUP 8: TECHNICAL SUPPORTIVE CONTEXT (No price prediction)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 8: Technical Supportive Context ---');
  const techFactor = res1.evaluatedFactors.find(f => f.id.includes('TECHNICAL_52W'));
  assert(techFactor !== undefined, 'Technical 52-week position factor generated');
  assert(Boolean(techFactor?.causeEffectChain.netAssessment.includes('tek başına yön tayin etmez')), 'Explicitly asserts that technicals do NOT predict future direction');
  assert(techFactor?.persistence === 'TRANSITORY', 'Technicals classified as TRANSITORY');

  // --------------------------------------------------------------------------
  // TEST GROUP 9: DETERMINISTIC MULTI-CRITERIA WEIGHTING MATRIX
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 9: Multi-Criteria Weighting Matrix ---');
  const directWeight = FinancialImpactEngine.computeMultiCriteriaWeight({
    relevance: 'DIRECT_COMPANY',
    magnitude: 'high',
    persistence: 'STRUCTURAL',
    freshness: 'REALTIME',
    sourceReliability: 95
  });

  const macroWeight = FinancialImpactEngine.computeMultiCriteriaWeight({
    relevance: 'MARKET',
    magnitude: 'low',
    persistence: 'TRANSITORY',
    freshness: 'STALE',
    sourceReliability: 70
  });

  assert(directWeight > macroWeight, `Direct high-conviction factor (${directWeight}) outweighs indirect stale factor (${macroWeight})`);
  assert(directWeight >= 90, `Direct structural factor reaches high weight (${directWeight} >= 90)`);
  assert(macroWeight <= 40, `Stale market factor has low weight (${macroWeight} <= 40)`);

  // --------------------------------------------------------------------------
  // TEST GROUP 10: MISSING DATA INTEGRITY (Zero Synthetic Data)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 10: Missing Data Integrity ---');
  const emptyPkg = createMockPackage({
    historicalTrends: null,
    sectorContext: { category: 'INDUSTRIAL', sectorName: 'Bilinmeyen', peersCount: 0, unsupportedMetrics: [], comparisons: [] },
    relevantNews: [],
    relevantCalendarEvents: [],
    fxCommodityExposure: { usdTry: null, eurTry: null, goldGram: null, brentPetrol: null, exposureType: 'DOMESTIC_TL', exposureNotes: [] },
    corporateActions: { historicalDividendsCount: 0, latestDividends: [], historicalSplitsCount: 0, splits: [], upcomingDividends: [] }
  });

  const emptyRes = FinancialImpactEngine.evaluate(emptyPkg);
  assert(emptyRes.evaluatedFactors.length > 0, 'Gracefully handles empty packages without crashing');
  assert(emptyRes.dominantDrivers !== undefined, 'Dominant drivers array exists even with empty data');
  assert(emptyRes.counterDrivers !== undefined, 'Counter drivers array exists even with empty data');
  assert(emptyRes.synthesisSummary.dataCompletenessRating === 'HIGH', 'Quality rating respects data quality object');

  // --------------------------------------------------------------------------
  // TEST GROUP 11: DRIVER SEGREGATION & SYNTHESIS SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 11: Driver Segregation & Synthesis Summary ---');
  assert(res1.dominantDrivers.length > 0, 'Dominant drivers list populated with high-weight positive factors');
  assert(res1.counterDrivers.length > 0, 'Counter drivers list populated with high-weight negative factors');
  assert(res1.synthesisSummary.dominantForcesSummary.length > 0, 'Dominant forces narrative summary generated');
  assert(res1.synthesisSummary.counterForcesSummary.length > 0, 'Counter forces narrative summary generated');
  assert(res1.synthesisSummary.primaryTension !== null, 'Primary dialectic tension identified in summary');

  // --------------------------------------------------------------------------
  // TEST GROUP 12: REAL BIST SYMBOL (THYAO) END-TO-END INTEGRATION
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 12: Real BIST Symbol (THYAO) Orchestrator Integration ---');
  const thyaoResult = await AnalysisOrchestrator.assembleSymbolData('THYAO');
  if (!thyaoResult.success) {
    console.error('THYAO assembly failed with error:', thyaoResult.error);
  }
  assert(thyaoResult.success === true, 'THYAO assembly succeeds', thyaoResult.error);
  assert(thyaoResult.impactAnalysis !== undefined, 'THYAO impactAnalysis generated in orchestrator');

  const thyaoImpact = thyaoResult.impactAnalysis!;
  assert(thyaoImpact.symbol === 'THYAO', 'Impact analysis symbol is THYAO');
  assert(thyaoImpact.evaluatedFactors.length >= 5, `THYAO has multiple evaluated factors (Found: ${thyaoImpact.evaluatedFactors.length})`);
  assert(thyaoImpact.dominantDrivers.length >= 1, `THYAO has dominant drivers (Count: ${thyaoImpact.dominantDrivers.length})`);
  assert(thyaoImpact.synthesisSummary.directCompanyFactorsCount >= 3, `THYAO has direct company factors (Count: ${thyaoImpact.synthesisSummary.directCompanyFactorsCount})`);

  console.log('\n================================================================');
  console.log(`🏁 TEST RESULTS: ${testsPassed} / ${testsPassed + testsFailed} PASSED (${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%)`);
  console.log('================================================================');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
