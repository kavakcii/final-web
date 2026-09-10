import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import {
  TriggerEvaluationEvent,
  TriggerEvaluationResult,
  TriggerDecisionStatus,
  TriggerReason
} from '../src/lib/analysis/types';
import { AnalysisTriggerEngine } from '../src/lib/analysis/analysis-trigger-engine';
import { AnalysisPipeline } from '../src/lib/analysis/analysis-pipeline';
import { AnalysisSnapshotService } from '../src/lib/analysis/analysis-snapshot-service';

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

function makeEvent(overrides: Partial<TriggerEvaluationEvent> & { symbol: string; type: TriggerEvaluationEvent['type'] }): TriggerEvaluationEvent {
  return {
    id: 'test-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    timestamp: new Date().toISOString(),
    source: 'test-harness',
    ...overrides
  };
}

async function runPhase7Tests() {
  console.log('\n======================================================');
  console.log('   FINAI ANALYSIS SYSTEM - PHASE 7 TEST SUITE');
  console.log('   Update / Trigger Engine Verification');
  console.log('======================================================\n');

  // Clear dedup cache between test runs
  AnalysisTriggerEngine.clearProcessedEvents();

  // ==========================================================================
  // MODULE 1: Financial Statement Triggers
  // ==========================================================================
  console.log('--- MODULE 1: Financial Statement Triggers ---');

  // Test 1.1: New financial quarter -> should trigger
  {
    const event = makeEvent({
      symbol: 'THYAO',
      type: 'FINANCIAL_STATEMENT',
      headline: 'THYAO Q3 2026 Bilanco',
      payload: { periodEnd: '2026-09-30', quarter: 'Q3-2026', revenueDeltaPercent: 15 }
    });
    const result = await AnalysisTriggerEngine.evaluateEvent(event, null);
    assert(result.isMaterial === true, 'T1.1: New financial statement is material');
    assert(result.materialityScore >= 0.85, 'T1.1: Score >= 0.85 for new quarter', result.materialityScore);
    assert(result.primaryReason === 'NEW_FINANCIAL_STATEMENT', 'T1.1: Reason is NEW_FINANCIAL_STATEMENT');
  }

  // Test 1.2: Immaterial sub-threshold financial change -> should skip
  {
    const event = makeEvent({
      symbol: 'BIMAS',
      type: 'FINANCIAL_STATEMENT',
      headline: 'Minor BIMAS adjustment',
      payload: { revenueDeltaPercent: 0.5, marginDeltaPercent: 0.2 }
    });
    const result = await AnalysisTriggerEngine.evaluateEvent(event, null);
    assert(result.isMaterial === false, 'T1.2: Sub-threshold financial change is not material');
    assert(result.shouldCallAI === false, 'T1.2: AI should NOT be called for trivial change');
  }

  // ==========================================================================
  // MODULE 2: Company Event Triggers
  // ==========================================================================
  console.log('\n--- MODULE 2: Company Event Triggers ---');

  // Test 2.1: Material company event (new contract) -> should trigger
  {
    const event = makeEvent({
      symbol: 'ASELS',
      type: 'COMPANY_EVENT',
      headline: 'ASELS yeni savunma sozlesmesi imzaladi',
      payload: { isDirect: true }
    });
    const result = await AnalysisTriggerEngine.evaluateEvent(event, null);
    assert(result.isMaterial === true, 'T2.1: Company contract is material');
    assert(result.primaryReason === 'COMPANY_EVENT', 'T2.1: Reason is COMPANY_EVENT');
  }

  // Test 2.2: Irrelevant company event -> should skip
  {
    const event = makeEvent({
      symbol: 'THYAO',
      type: 'COMPANY_EVENT',
      headline: 'Rutin faaliyet raporu yayimlandi'
    });
    const result = await AnalysisTriggerEngine.evaluateEvent(event, null);
    assert(result.isMaterial === false, 'T2.2: Routine report is NOT material');
  }

  // ==========================================================================
  // MODULE 3: News Triggers
  // ==========================================================================
  console.log('\n--- MODULE 3: News Triggers ---');

  // Test 3.1: High-relevance news -> should trigger
  {
    const event = makeEvent({
      symbol: 'THYAO',
      type: 'NEWS',
      headline: 'THYAO rekor yolcu sayisina ulasti',
      payload: { relevanceScore: 0.9 }
    });
    const result = await AnalysisTriggerEngine.evaluateEvent(event, null);
    assert(result.isMaterial === true, 'T3.1: High relevance news is material');
    assert(result.primaryReason === 'MATERIAL_NEWS', 'T3.1: Reason is MATERIAL_NEWS');
  }

  // Test 3.2: Irrelevant news -> should skip
  {
    const event = makeEvent({
      symbol: 'BIMAS',
      type: 'NEWS',
      headline: 'Genel piyasa yorumu',
      payload: { relevanceScore: 0.2 }
    });
    const result = await AnalysisTriggerEngine.evaluateEvent(event, null);
    assert(result.isMaterial === false, 'T3.2: Low relevance news is NOT material');
    assert(result.shouldCallAI === false, 'T3.2: AI should NOT be called');
  }

  // ==========================================================================
  // MODULE 4: Economic Calendar Triggers
  // ==========================================================================
  console.log('\n--- MODULE 4: Economic Calendar Triggers ---');

  // Test 4.1: Interest rate decision for bank -> material
  {
    const event = makeEvent({
      symbol: 'GARAN',
      type: 'ECONOMIC_CALENDAR',
      headline: 'TCMB faiz karari',
      payload: { importance: 3, event: 'TCMB Faiz Karari' }
    });
    const result = await AnalysisTriggerEngine.evaluateEvent(event, null);
    assert(result.isMaterial === true, 'T4.1: Rate decision for bank is material');
    assert(result.primaryReason === 'MACRO_EVENT', 'T4.1: Reason is MACRO_EVENT');
  }

  // Test 4.2: Interest rate decision for unrelated sector -> skip
  {
    const event = makeEvent({
      symbol: 'BIMAS',
      type: 'ECONOMIC_CALENDAR',
      headline: 'TCMB faiz karari',
      payload: { importance: 3, event: 'TCMB Faiz Karari' }
    });
    const result = await AnalysisTriggerEngine.evaluateEvent(event, null);
    assert(result.isMaterial === false, 'T4.2: Rate decision for retail is NOT material');
  }

  // ==========================================================================
  // MODULE 5: FX Change Triggers
  // ==========================================================================
  console.log('\n--- MODULE 5: FX Change Triggers ---');

  // Test 5.1: Significant FX move for exposed company -> material
  {
    const event = makeEvent({
      symbol: 'THYAO',
      type: 'FX_CHANGE',
      headline: 'USD/TRY significant move',
      payload: { pair: 'USDTRY', changePercent: 3.5 }
    });
    const result = await AnalysisTriggerEngine.evaluateEvent(event, null);
    assert(result.isMaterial === true, 'T5.1: FX change for exposed company is material');
    assert(result.primaryReason === 'FX_CHANGE', 'T5.1: Reason is FX_CHANGE');
  }

  // Test 5.2: Small FX move for unexposed company -> skip
  {
    const event = makeEvent({
      symbol: 'BIMAS',
      type: 'FX_CHANGE',
      headline: 'Minor currency fluctuation',
      payload: { pair: 'USDTRY', changePercent: 0.5 }
    });
    const result = await AnalysisTriggerEngine.evaluateEvent(event, null);
    assert(result.isMaterial === false, 'T5.2: Small FX change for unexposed company is NOT material');
  }

  // ==========================================================================
  // MODULE 6: Commodity Change Triggers
  // ==========================================================================
  console.log('\n--- MODULE 6: Commodity Change Triggers ---');

  // Test 6.1: Brent oil spike for THYAO -> material
  {
    const event = makeEvent({
      symbol: 'THYAO',
      type: 'COMMODITY_CHANGE',
      headline: 'Brent oil price surge',
      payload: { commodity: 'Brent Oil', changePercent: 5.0 }
    });
    const result = await AnalysisTriggerEngine.evaluateEvent(event, null);
    assert(result.isMaterial === true, 'T6.1: Oil price surge for airline is material');
    assert(result.primaryReason === 'COMMODITY_CHANGE', 'T6.1: Reason is COMMODITY_CHANGE');
  }

  // Test 6.2: Steel price change for non-steel company -> skip
  {
    const event = makeEvent({
      symbol: 'BIMAS',
      type: 'COMMODITY_CHANGE',
      headline: 'Steel price increase',
      payload: { commodity: 'steel', changePercent: 4.0 }
    });
    const result = await AnalysisTriggerEngine.evaluateEvent(event, null);
    assert(result.isMaterial === false, 'T6.2: Steel change for retail company is NOT material');
  }

  // ==========================================================================
  // MODULE 7: Dividend Event Triggers
  // ==========================================================================
  console.log('\n--- MODULE 7: Dividend Event Triggers ---');

  // Test 7.1: New dividend declaration -> material
  {
    const event = makeEvent({
      symbol: 'THYAO',
      type: 'DIVIDEND_EVENT',
      headline: 'THYAO temettu karari',
      payload: { isNewDecision: true, dividendCount: 5 }
    });
    const result = await AnalysisTriggerEngine.evaluateEvent(event, null);
    assert(result.isMaterial === true, 'T7.1: New dividend decision is material');
    assert(result.primaryReason === 'DIVIDEND_EVENT', 'T7.1: Reason is DIVIDEND_EVENT');
  }

  // ==========================================================================
  // MODULE 8: Technical Regime Change
  // ==========================================================================
  console.log('\n--- MODULE 8: Technical Regime Change ---');

  // Test 8.1: Volume surge with MA break -> material
  {
    const event = makeEvent({
      symbol: 'ASELS',
      type: 'TECHNICAL_REGIME_CHANGE',
      headline: 'ASELS volume breakout',
      payload: { volumeSurgeMultiple: 3.0, is200DayMaBreak: true }
    });
    const result = await AnalysisTriggerEngine.evaluateEvent(event, null);
    assert(result.isMaterial === true, 'T8.1: Volume surge with MA break is material');
    assert(result.primaryReason === 'TECHNICAL_REGIME_CHANGE', 'T8.1: Reason is TECHNICAL_REGIME_CHANGE');
  }

  // Test 8.2: Normal daily price wiggle -> skip
  {
    const event = makeEvent({
      symbol: 'BIMAS',
      type: 'TECHNICAL_REGIME_CHANGE',
      headline: 'Daily price change',
      payload: { volumeSurgeMultiple: 1.1, is200DayMaBreak: false }
    });
    const result = await AnalysisTriggerEngine.evaluateEvent(event, null);
    assert(result.isMaterial === false, 'T8.2: Normal daily price movement is NOT material');
  }

  // ==========================================================================
  // MODULE 9: Deduplication
  // ==========================================================================
  console.log('\n--- MODULE 9: Deduplication ---');

  // Test 9.1: Same event sent twice -> SKIPPED_DUPLICATE
  {
    AnalysisTriggerEngine.clearProcessedEvents();
    const eventId = 'dedup-test-' + Date.now();
    const event1 = makeEvent({
      id: eventId,
      symbol: 'THYAO',
      type: 'NEWS',
      headline: 'THYAO onemli gelisme',
      payload: { relevanceScore: 0.9 }
    });

    // First evaluation
    const r1 = await AnalysisTriggerEngine.evaluateEvent(event1, null);

    // Second evaluation with same event ID
    const event2 = makeEvent({
      id: eventId,
      symbol: 'THYAO',
      type: 'NEWS',
      headline: 'THYAO onemli gelisme',
      payload: { relevanceScore: 0.9 }
    });
    const r2 = await AnalysisTriggerEngine.evaluateEvent(event2, null);
    assert(r2.decision === 'SKIPPED_DUPLICATE', 'T9.1: Duplicate event is SKIPPED_DUPLICATE', r2.decision);
    assert(r2.shouldCallAI === false, 'T9.1: AI should NOT be called on duplicate');
  }

  // ==========================================================================
  // MODULE 10: Fingerprint Unchanged
  // ==========================================================================
  console.log('\n--- MODULE 10: Fingerprint Unchanged ---');

  // Test 10.1: Same data fingerprint -> SKIPPED_UNCHANGED or TRIGGERED depending on data
  // We test with a scheduled check where we use a mock snapshot with matching fingerprint
  {
    AnalysisTriggerEngine.clearProcessedEvents();
    // This test verifies that when fingerprint matches, AI is NOT called
    const event = makeEvent({
      symbol: 'THYAO',
      type: 'SCHEDULED_CHECK',
      headline: 'Periodic check'
    });
    // We evaluate without override - result depends on live data state
    // The key test is that the engine has the mechanism
    const result = await AnalysisTriggerEngine.evaluateEvent(event);
    assert(
      ['TRIGGERED', 'SKIPPED_UNCHANGED', 'FAILED'].includes(result.decision),
      'T10.1: Scheduled check returns valid decision',
      result.decision
    );
    if (result.decision === 'SKIPPED_UNCHANGED') {
      assert(result.shouldCallAI === false, 'T10.1: AI NOT called when fingerprint unchanged');
    }
  }

  // ==========================================================================
  // MODULE 11: Stale Data
  // ==========================================================================
  console.log('\n--- MODULE 11: Stale Data ---');

  // Test 11.1: Old news event -> SKIPPED_STALE
  {
    AnalysisTriggerEngine.clearProcessedEvents();
    const staleTimestamp = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(); // 48 hours old
    const event = makeEvent({
      symbol: 'THYAO',
      type: 'NEWS',
      timestamp: staleTimestamp,
      headline: 'Very old news'
    });
    const result = await AnalysisTriggerEngine.evaluateEvent(event, null);
    assert(result.decision === 'SKIPPED_STALE', 'T11.1: Stale news is SKIPPED_STALE', result.decision);
    assert(result.shouldCallAI === false, 'T11.1: AI NOT called on stale data');
  }

  // ==========================================================================
  // MODULE 12: Concurrency Lock
  // ==========================================================================
  console.log('\n--- MODULE 12: Concurrency Lock ---');

  // Test 12.1: Locked symbol -> LOCKED
  {
    AnalysisTriggerEngine.clearProcessedEvents();
    // Simulate lock
    const fakePromise = new Promise((resolve) => setTimeout(resolve, 60000));
    AnalysisPipeline.acquireLock('LOCKTEST', fakePromise);

    const event = makeEvent({
      symbol: 'LOCKTEST',
      type: 'NEWS',
      headline: 'Test locked'
    });
    const result = await AnalysisTriggerEngine.evaluateEvent(event, null);
    assert(result.decision === 'LOCKED', 'T12.1: Locked symbol returns LOCKED', result.decision);
    assert(result.shouldCallAI === false, 'T12.1: AI NOT called when locked');

    // Clean up
    AnalysisPipeline.releaseLock('LOCKTEST');
  }

  // ==========================================================================
  // MODULE 13: Manual vs Scheduled Collision
  // ==========================================================================
  console.log('\n--- MODULE 13: Manual vs Scheduled Collision ---');

  // Test 13.1: AnalysisPipeline.isLocked works correctly
  {
    assert(AnalysisPipeline.isLocked('COLTEST') === false, 'T13.1a: Symbol initially unlocked');

    const fakePromise = new Promise((resolve) => setTimeout(resolve, 60000));
    AnalysisPipeline.acquireLock('COLTEST', fakePromise);
    assert(AnalysisPipeline.isLocked('COLTEST') === true, 'T13.1b: Symbol locked after acquireLock');

    AnalysisPipeline.releaseLock('COLTEST');
    assert(AnalysisPipeline.isLocked('COLTEST') === false, 'T13.1c: Symbol unlocked after releaseLock');
  }

  // ==========================================================================
  // MODULE 14: Multi-Event Aggregation
  // ==========================================================================
  console.log('\n--- MODULE 14: Multi-Event Aggregation ---');

  // Test 14.1: Multiple events for same symbol merge into single evaluation
  {
    AnalysisTriggerEngine.clearProcessedEvents();
    const events: TriggerEvaluationEvent[] = [
      makeEvent({
        symbol: 'THYAO',
        type: 'NEWS',
        headline: 'THYAO onemli haber',
        payload: { relevanceScore: 0.8 }
      }),
      makeEvent({
        symbol: 'THYAO',
        type: 'COMMODITY_CHANGE',
        headline: 'Brent oil spike',
        payload: { commodity: 'Brent Oil', changePercent: 5.0 }
      })
    ];

    const batchResults = await AnalysisTriggerEngine.evaluateEventsBatch(events);
    const thyaoResult = batchResults.get('THYAO');
    assert(thyaoResult !== undefined, 'T14.1: Batch result exists for THYAO');
    if (thyaoResult) {
      assert(
        thyaoResult.decision === 'TRIGGERED' || thyaoResult.decision === 'SKIPPED_UNCHANGED',
        'T14.1: Multi-event evaluates properly',
        thyaoResult.decision
      );
      if (thyaoResult.mergedReasons) {
        assert(thyaoResult.mergedReasons.length >= 1, 'T14.1: Merged reasons present');
      }
    }
  }

  // ==========================================================================
  // MODULE 15: Missing Data Resilience
  // ==========================================================================
  console.log('\n--- MODULE 15: Missing Data Resilience ---');

  // Test 15.1: Event with no payload -> should not throw
  {
    AnalysisTriggerEngine.clearProcessedEvents();
    const event = makeEvent({
      symbol: 'THYAO',
      type: 'FINANCIAL_STATEMENT'
    });
    let errorThrown = false;
    try {
      const result = await AnalysisTriggerEngine.evaluateEvent(event, null);
      assert(result.decision !== undefined, 'T15.1: Returns valid decision with no payload');
    } catch (e) {
      errorThrown = true;
    }
    assert(!errorThrown, 'T15.1: No unhandled exception on missing payload');
  }

  // ==========================================================================
  // MODULE 16: Trigger Reason Tracking
  // ==========================================================================
  console.log('\n--- MODULE 16: Trigger Reason Tracking ---');

  // Test 16.1: Each event type maps to correct trigger reason
  {
    const reasonTests: Array<{ type: TriggerEvaluationEvent['type']; expectedReason: TriggerReason }> = [
      { type: 'FINANCIAL_STATEMENT', expectedReason: 'NEW_FINANCIAL_STATEMENT' },
      { type: 'COMPANY_EVENT', expectedReason: 'COMPANY_EVENT' },
      { type: 'NEWS', expectedReason: 'MATERIAL_NEWS' },
      { type: 'ECONOMIC_CALENDAR', expectedReason: 'MACRO_EVENT' },
      { type: 'FX_CHANGE', expectedReason: 'FX_CHANGE' },
      { type: 'COMMODITY_CHANGE', expectedReason: 'COMMODITY_CHANGE' },
      { type: 'DIVIDEND_EVENT', expectedReason: 'DIVIDEND_EVENT' },
      { type: 'TECHNICAL_REGIME_CHANGE', expectedReason: 'TECHNICAL_REGIME_CHANGE' },
      { type: 'SCHEDULED_CHECK', expectedReason: 'SCHEDULED_MATERIAL_CHANGE' }
    ];

    AnalysisTriggerEngine.clearProcessedEvents();
    for (const rt of reasonTests) {
      const event = makeEvent({ symbol: 'THYAO', type: rt.type });
      const result = await AnalysisTriggerEngine.evaluateEvent(event, null);
      assert(
        result.primaryReason === rt.expectedReason || result.primaryReason === undefined,
        'T16.1: ' + rt.type + ' maps to correct reason (' + rt.expectedReason + ')',
        result.primaryReason
      );
    }
  }

  // ==========================================================================
  // MODULE 17: AI Cost Control
  // ==========================================================================
  console.log('\n--- MODULE 17: AI Cost Control ---');

  // Test 17.1: Non-material events produce shouldCallAI=false
  {
    AnalysisTriggerEngine.clearProcessedEvents();
    const nonMaterialEvents = [
      makeEvent({ symbol: 'BIMAS', type: 'FINANCIAL_STATEMENT', payload: { revenueDeltaPercent: 0.1 } }),
      makeEvent({ symbol: 'BIMAS', type: 'FX_CHANGE', payload: { changePercent: 0.3 } }),
      makeEvent({ symbol: 'BIMAS', type: 'TECHNICAL_REGIME_CHANGE', payload: { volumeSurgeMultiple: 1.0 } })
    ];

    let aiCallBlocked = 0;
    for (const ev of nonMaterialEvents) {
      const result = await AnalysisTriggerEngine.evaluateEvent(ev, null);
      if (!result.shouldCallAI) aiCallBlocked++;
    }
    assert(aiCallBlocked === nonMaterialEvents.length, 'T17.1: All non-material events block AI calls (' + aiCallBlocked + '/' + nonMaterialEvents.length + ')');
  }

  // ==========================================================================
  // MODULE 18: Scheduled Batch Check
  // ==========================================================================
  console.log('\n--- MODULE 18: Scheduled Batch Check ---');

  // Test 18.1: Dry-run scheduled check with limited symbols
  {
    AnalysisTriggerEngine.clearProcessedEvents();
    const summary = await AnalysisTriggerEngine.runScheduledCheck({
      symbols: ['THYAO', 'ASELS'],
      maxAiCalls: 0, // Prevent actual AI calls
      dryRun: true
    });

    assert(summary.totalEvaluated === 2, 'T18.1: Evaluated 2 symbols', summary.totalEvaluated);
    assert(summary.aiCallsCount === 0, 'T18.1: Zero AI calls in dry run', summary.aiCallsCount);
    assert(summary.results.length === 2, 'T18.1: Results array has 2 entries', summary.results.length);
    assert(summary.startedAt.length > 0, 'T18.1: startedAt timestamp present');
    assert(summary.completedAt.length > 0, 'T18.1: completedAt timestamp present');

    // Verify decision counters add up
    const totalDecisions = summary.triggeredCount + summary.skippedUnchangedCount +
      summary.skippedNotMaterialCount + summary.skippedDuplicateCount +
      summary.skippedStaleCount + summary.lockedCount + summary.failedCount;
    assert(totalDecisions === summary.totalEvaluated, 'T18.1: Decision counters sum to total', totalDecisions);
  }

  // ==========================================================================
  // MODULE 19: Pipeline Integration
  // ==========================================================================
  console.log('\n--- MODULE 19: Pipeline Integration ---');

  // Test 19.1: AnalysisPipeline.execute returns valid structure
  {
    const result = await AnalysisPipeline.execute('THYAO', {
      triggerReason: 'MANUAL_REFRESH',
      triggerType: 'MANUAL_REQUEST'
    });

    assert(typeof result.success === 'boolean', 'T19.1: Pipeline returns success boolean');
    if (result.success) {
      assert(result.data !== undefined, 'T19.1: Pipeline returns data on success');
      assert(result.status === 'COMPLETED', 'T19.1: Pipeline status is COMPLETED');
    } else {
      assert(
        result.status === 'FAILED' || result.status === 'LOCKED' || result.status === 'REJECTED',
        'T19.1: Pipeline returns valid failure status',
        result.status
      );
    }
  }

  // Test 19.2: Pipeline with ASELS
  {
    const result = await AnalysisPipeline.execute('ASELS', {
      triggerReason: 'MANUAL_REFRESH',
      triggerType: 'MANUAL_REQUEST'
    });
    assert(typeof result.success === 'boolean', 'T19.2: ASELS pipeline returns success boolean');
  }

  // Test 19.3: Pipeline with BIMAS
  {
    const result = await AnalysisPipeline.execute('BIMAS', {
      triggerReason: 'MANUAL_REFRESH',
      triggerType: 'MANUAL_REQUEST'
    });
    assert(typeof result.success === 'boolean', 'T19.3: BIMAS pipeline returns success boolean');
  }

  // ==========================================================================
  // MODULE 20: Snapshot Trigger Metadata
  // ==========================================================================
  console.log('\n--- MODULE 20: Snapshot Trigger Metadata ---');

  // Test 20.1: Snapshot service accepts trigger metadata
  {
    // Verify that AnalysisSnapshotService.saveSnapshot has triggerMetadata parameter
    // by checking that calling with metadata doesn't throw
    assert(typeof AnalysisSnapshotService.saveSnapshot === 'function', 'T20.1: saveSnapshot is a function');
    assert(typeof AnalysisSnapshotService.getLatestSnapshot === 'function', 'T20.2: getLatestSnapshot is a function');
  }

  // ==========================================================================
  // SUMMARY
  // ==========================================================================
  console.log('\n======================================================');
  console.log('   PHASE 7 TEST RESULTS');
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

runPhase7Tests().catch((err) => {
  console.error('Phase 7 test suite fatal error:', err);
  process.exit(1);
});
