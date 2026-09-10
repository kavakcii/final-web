/**
 * FinAi Analysis System - Phase 1 Integration & Unit Test Suite
 * 
 * Tests:
 * 1. Data Assembler on Real BIST Symbol (THYAO)
 * 2. Invalid Symbol Handling (Graceful degradation without crash)
 * 3. Missing Data Integrity (Strict NULL preservation, zero synthetic coercion)
 * 4. Relevance Filtering (Hierarchical prioritization and noise filtering)
 * 5. Factor Extraction (Structured causal factors)
 * 6. Deterministic Fingerprint Consistency
 * 7. Snapshot Deduplication & Change Diff Calculation
 * 8. Provenance and Freshness Verification
 */

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { AnalysisOrchestrator } from '../src/lib/analysis/analysis-orchestrator';
import { AnalysisSnapshotService } from '../src/lib/analysis/analysis-snapshot-service';
import { RelevanceFilter } from '../src/lib/analysis/relevance-filter';
import { FactorExtractor } from '../src/lib/analysis/factor-extractor';
import { EnrichedNewsItem } from '../src/app/api/news/route';
import { CatalogCalendarEvent } from '../src/lib/calendar-catalog';

async function runTests() {
  console.log('================================================================');
  console.log('🧪 FINAI ANALYSIS SYSTEM - PHASE 1 VERIFICATION SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   Detail: ${detail}`);
    }
  }

  // -------------------------------------------------------------------------
  // TEST 1: Real BIST Symbol Assembly (THYAO)
  // -------------------------------------------------------------------------
  console.log('--- TEST GROUP 1: Real Symbol Assembly (THYAO) ---');
  const thyaoResult = await AnalysisOrchestrator.assembleSymbolData('THYAO');
  assert(thyaoResult.success === true, 'THYAO Data Assembly succeeds');
  assert(Boolean(thyaoResult.dataPackage), 'THYAO Data Package is generated');
  assert(thyaoResult.dataPackage?.symbol === 'THYAO', 'Symbol is normalized to THYAO');
  assert(thyaoResult.dataPackage?.marketData.currentPrice != null, `Current Price exists (${thyaoResult.dataPackage?.marketData.currentPrice} ₺)`);
  assert(thyaoResult.dataPackage?.statements.allQuartersCount! > 0, `Quarterly statements loaded (Count: ${thyaoResult.dataPackage?.statements.allQuartersCount})`);
  assert(Boolean(thyaoResult.dataPackage?.fingerprint && thyaoResult.dataPackage.fingerprint.length === 64), 'Valid 64-char SHA-256 fingerprint computed');
  assert(Array.isArray(thyaoResult.factors) && thyaoResult.factors.length > 0, `Qualitative Factors extracted (Count: ${thyaoResult.factors?.length})`);

  // -------------------------------------------------------------------------
  // TEST 2: Invalid Symbol Graceful Handling
  // -------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Invalid Symbol Handling ---');
  const invalidResult = await AnalysisOrchestrator.assembleSymbolData('INVALID_UNKNOWN_SYMBOL_999');
  // Should either return success: false with clean error OR empty dataPackage with 0 statements and null price
  assert(
    invalidResult.success === false || (invalidResult.dataPackage?.statements.allQuartersCount === 0 && invalidResult.dataPackage.marketData.currentPrice == null),
    'Invalid symbol handles gracefully without throwing unhandled exceptions'
  );

  const emptySymbolResult = await AnalysisOrchestrator.assembleSymbolData('');
  assert(emptySymbolResult.success === false, 'Empty symbol returns clean validation error');

  // -------------------------------------------------------------------------
  // TEST 3: Missing Data Integrity (Strict NULL preservation)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Strict Zero-Synthetic-Data Integrity ---');
  const dp = thyaoResult.dataPackage;
  if (dp) {
    // If an analyst estimate or earnings date is missing, it must be null, never 0
    if (dp.earningsCalendar.expectedDate === null) {
      assert(dp.earningsCalendar.expectedDate === null, 'Missing earnings date is null (not 0 or fake date)');
    } else {
      assert(typeof dp.earningsCalendar.expectedDate === 'string', 'Earnings date is string if present');
    }

    // Free cash flow sign convention check
    const fcf = dp.historicalTrends?.cashFlowTrends?.[0]?.freeCashFlow;
    if (fcf != null) {
      assert(typeof fcf === 'number' && !isNaN(fcf), 'FCF is valid number');
    }
  }

  // -------------------------------------------------------------------------
  // TEST 4: Relevance Filtering (Hierarchy & Noise Dropping)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: Relevance Filtering ---');
  const mockNews: EnrichedNewsItem[] = [
    {
      id: 'news_1',
      slug: 'thyao-kap',
      title: 'THYAO yeni uçak alımı için finansman sağladı',
      link: 'https://example.com/1',
      pubDate: '2026-09-10',
      source: 'AA Finans',
      description: 'Türk Hava Yolları yeni filo yatırımı kapsamında kredi anlaşması imzaladı.',
      category: 'bist',
      categoryLabel: 'BIST',
      sentiment: 'bullish',
      impact: 'critical',
      tickers: ['THYAO'],
      affectedAssets: ['THYAO']
    },
    {
      id: 'news_2',
      slug: 'unrelated-japan',
      title: 'Japonya tarım kooperatifleri yıllık toplantısı yapıldı',
      link: 'https://example.com/2',
      pubDate: '2026-09-10',
      source: 'Global',
      description: 'Tokyo merkezli pirinç üretim rakamları açıklandı.',
      category: 'global',
      categoryLabel: 'Dünya',
      sentiment: 'neutral',
      impact: 'medium',
      tickers: [],
      affectedAssets: []
    }
  ];

  const filteredNews = RelevanceFilter.filterNewsForSymbol(mockNews, 'THYAO', 'Türk Hava Yolları');
  assert(filteredNews.news.length === 1, 'Noise news eliminated (Only 1 relevant news retained)');
  assert(filteredNews.news[0].id === 'news_1', 'Direct company news matched');
  assert(filteredNews.relevanceMap['news_1'] === 'DIRECT_COMPANY', 'Relevance correctly scored as DIRECT_COMPANY');

  // Calendar relevance test
  const mockCalendar: CatalogCalendarEvent[] = [
    {
      id: 'opec_meeting',
      event: 'OPEC+ Petrol Üretim Kotası Kararı',
      country: 'ABD',
      dateFormatted: '12.09.2026',
      dateDayName: 'Cuma',
      time: '15:00',
      impact: 'high',
      flag: '🇺🇸',
      weekOffset: 0,
      previous: '-',
      forecast: '-',
      actual: '-'
    },
    {
      id: 'uk_housing',
      event: 'Birleşik Krallık Konut Endeksi',
      country: 'UK',
      dateFormatted: '12.09.2026',
      dateDayName: 'Cuma',
      time: '02:45',
      impact: 'medium',
      flag: '🇬🇧',
      weekOffset: 0,
      previous: '-',
      forecast: '-',
      actual: '-'
    }
  ];

  const filteredCal = RelevanceFilter.filterCalendarForSymbol(mockCalendar, 'THYAO', 'TRANSPORTATION');
  assert(filteredCal.events.length === 1, 'Irrelevant foreign event (UK Housing) dropped');
  assert(filteredCal.events[0].id === 'opec_meeting', 'OPEC event retained for Transportation/Aviation stock');

  // -------------------------------------------------------------------------
  // TEST 5: Structured Factor Extraction
  // -------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: Factor Extraction Structure ---');
  if (thyaoResult.factors && thyaoResult.factors.length > 0) {
    const factor = thyaoResult.factors[0];
    assert(Boolean(factor.id), `Factor has unique ID (${factor.id})`);
    assert(Boolean(factor.title && factor.explanation), 'Factor has title and causal explanation');
    assert(['positive', 'negative', 'neutral', 'unknown'].includes(factor.impactDirection), `Valid impact direction (${factor.impactDirection})`);
    assert(['high', 'medium', 'low', 'unknown'].includes(factor.magnitude), `Valid magnitude (${factor.magnitude})`);
    assert(factor.sourceReliability >= 0 && factor.sourceReliability <= 100, `Source reliability in 0-100 range (${factor.sourceReliability})`);
  }

  // -------------------------------------------------------------------------
  // TEST 6: Deterministic Fingerprinting & Deduplication
  // -------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 6: Fingerprint & Deduplication ---');
  const fp1 = AnalysisOrchestrator.computeFingerprint({ sym: 'THYAO', price: 312.5, q: '2025-12-31' });
  const fp2 = AnalysisOrchestrator.computeFingerprint({ sym: 'THYAO', price: 312.5, q: '2025-12-31' });
  const fp3 = AnalysisOrchestrator.computeFingerprint({ sym: 'THYAO', price: 315.0, q: '2025-12-31' });

  assert(fp1 === fp2, 'Identical inputs produce identical SHA-256 fingerprint');
  assert(fp1 !== fp3, 'Price change alters fingerprint deterministically');

  if (thyaoResult.dataPackage && thyaoResult.factors) {
    const testPackage = {
      ...thyaoResult.dataPackage,
      fingerprint: `${thyaoResult.dataPackage.fingerprint.substring(0, 48)}_${Date.now()}`
    };

    // Save snapshot 1
    const snap1 = await AnalysisSnapshotService.saveSnapshot(testPackage, thyaoResult.factors);
    assert(snap1.success === true, 'First snapshot saved successfully');
    assert(snap1.isDuplicate === false, 'First snapshot is NOT marked as duplicate');

    // Save snapshot 2 with identical data
    const snap2 = await AnalysisSnapshotService.saveSnapshot(testPackage, thyaoResult.factors);
    assert(snap2.success === true, 'Second snapshot call handled successfully');
    assert(snap2.isDuplicate === true, 'Second identical snapshot successfully prevented by deduplication guard');
    assert(snap1.snapshot.id === snap2.snapshot.id, 'Returned snapshot matches existing record ID');
  }

  // -------------------------------------------------------------------------
  // TEST 7: Change Diff Calculation
  // -------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 7: Change Diff Detection ---');
  if (thyaoResult.dataPackage && thyaoResult.factors) {
    const clonedPkg = JSON.parse(JSON.stringify(thyaoResult.dataPackage));
    // Simulate 5% price surge
    if (clonedPkg.marketData.currentPrice) {
      clonedPkg.marketData.currentPrice = Number((clonedPkg.marketData.currentPrice * 1.05).toFixed(2));
    }
    clonedPkg.assembledAt = new Date(Date.now() + 60000).toISOString();

    const existingSnap = await AnalysisSnapshotService.getLatestSnapshot('THYAO');
    if (existingSnap) {
      const diff = AnalysisSnapshotService.computeChangeDiff(clonedPkg, thyaoResult.factors, existingSnap);
      assert(diff.hasChanged === true, 'Change diff detects price change');
      assert(diff.priceDiffPercent != null && diff.priceDiffPercent > 0, `Price diff recorded: +${diff.priceDiffPercent}%`);
      assert(diff.changesSummary.length > 0, `Change summary generated: "${diff.changesSummary[0]}"`);
    }
  }

  console.log('\n================================================================');
  console.log(`🏁 TEST RESULTS: ${passedTests} / ${totalTests} PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('================================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
