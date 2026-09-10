/**
 * FinAi Analysis Trigger & Update Engine
 * 
 * Determines IF, WHY, and WHEN an analysis should be updated.
 * 
 * Core Principles:
 * 1. Hybrid Architecture: Event-driven triggers + Periodic scheduled checks.
 * 2. Strict AI Cost Control: Zero Gemini calls if fingerprint unchanged, event immaterial,
 *    event already processed, or data stale.
 * 3. Concurrency Protection: In-flight execution locks per symbol.
 * 4. Multi-Event Aggregation: Multiple simultaneous triggers merge into a single reason.
 * 5. Deterministic Materiality: Evaluates directness, magnitude, relevance, and persistence.
 */

import {
  TriggerType,
  TriggerReason,
  TriggerDecisionStatus,
  TriggerEvaluationEvent,
  TriggerEvaluationResult,
  ScheduledUpdateBatchSummary,
  AnalysisSnapshotRecord,
  AssembledDataPackage
} from './types';
import { AnalysisOrchestrator } from './analysis-orchestrator';
import { AnalysisSnapshotService } from './analysis-snapshot-service';
import { AnalysisPipeline } from './analysis-pipeline';

// Source-specific Time-To-Live (TTL) thresholds in milliseconds
const FRESHNESS_THRESHOLDS: Record<string, number> = {
  PRICE: 2 * 60 * 60 * 1000,             // 2 hours
  NEWS: 30 * 60 * 1000,                  // 30 minutes
  FINANCIAL_STATEMENT: 90 * 24 * 60 * 60 * 1000, // 90 days (quarterly)
  ECONOMIC_CALENDAR: 4 * 60 * 60 * 1000, // 4 hours around events
  DIVIDEND_EVENT: 7 * 24 * 60 * 60 * 1000,       // 7 days
  COMPANY_EVENT: 24 * 60 * 60 * 1000,    // 24 hours
  COMMODITY_CHANGE: 60 * 60 * 1000,      // 1 hour
  FX_CHANGE: 60 * 60 * 1000,             // 1 hour
  TECHNICAL_REGIME_CHANGE: 4 * 60 * 60 * 1000, // 4 hours
  SCHEDULED_CHECK: 365 * 24 * 60 * 60 * 1000,  // 1 year (effectively no TTL)
  MANUAL_REQUEST: 365 * 24 * 60 * 60 * 1000    // 1 year (effectively no TTL)
};

export class AnalysisTriggerEngine {
  // Deduplication cache: stores event signatures with timestamps
  private static processedEvents = new Map<string, number>();
  private static readonly EVENT_DEDUP_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  // Pilot symbols for scheduled checks
  public static readonly DEFAULT_PILOT_SYMBOLS = [
    'THYAO', 'ASELS', 'BIMAS', 'EREGL', 'TUPRS', 'GARAN', 'SISE', 'KCHOL'
  ];

  /**
   * Evaluates an individual event to determine if an analysis update should be triggered
   */
  public static async evaluateEvent(
    event: TriggerEvaluationEvent,
    overridePreviousSnapshot?: AnalysisSnapshotRecord | null
  ): Promise<TriggerEvaluationResult> {
    const symbol = event.symbol.toUpperCase().replace(/\.IS$/, '').trim();
    const evaluatedAt = new Date().toISOString();

    // 1. Concurrency Check: Is an update already running for this symbol?
    if (AnalysisPipeline.isLocked(symbol)) {
      return {
        symbol,
        decision: 'LOCKED',
        isMaterial: false,
        materialityScore: 0,
        materialityExplanation: symbol + ' icin su anda bir analiz guncellemesi calisiyor.',
        shouldCallAI: false,
        fingerprintChanged: false,
        evaluatedAt
      };
    }

    // 2. Deduplication Check: Has this exact event already been processed?
    const eventKey = symbol + ':' + event.type + ':' + event.id;
    if (this.isEventDuplicate(eventKey)) {
      return {
        symbol,
        decision: 'SKIPPED_DUPLICATE',
        isMaterial: false,
        materialityScore: 0,
        materialityExplanation: 'Bu olay daha once islendi (' + event.id + '). Mukerrer analiz onlendi.',
        shouldCallAI: false,
        fingerprintChanged: false,
        evaluatedAt
      };
    }

    // 3. Stale / Invalid Data Check
    const freshnessCheck = this.validateEventFreshness(event);
    if (!freshnessCheck.valid) {
      return {
        symbol,
        decision: 'SKIPPED_STALE',
        isMaterial: false,
        materialityScore: 0,
        materialityExplanation: freshnessCheck.reason,
        shouldCallAI: false,
        fingerprintChanged: false,
        evaluatedAt
      };
    }

    // 4. Retrieve latest snapshot to compare against
    const previousSnapshot = overridePreviousSnapshot !== undefined
      ? overridePreviousSnapshot
      : await AnalysisSnapshotService.getLatestSnapshot(symbol);

    // 5. Deterministic Materiality Evaluation
    const materiality = this.evaluateMateriality(event, symbol, previousSnapshot);
    if (!materiality.isMaterial) {
      return {
        symbol,
        decision: 'SKIPPED_NOT_MATERIAL',
        primaryReason: materiality.reason,
        isMaterial: false,
        materialityScore: materiality.score,
        materialityExplanation: materiality.explanation,
        shouldCallAI: false,
        previousFingerprint: previousSnapshot?.fingerprint,
        fingerprintChanged: false,
        evaluatedAt
      };
    }

    // 6. Cheap Deterministic Check & Fingerprint Comparison
    // Assemble new data package to verify if the fingerprint actually changes
    const assembly = await AnalysisOrchestrator.assembleSymbolData(symbol);
    if (!assembly.success || !assembly.dataPackage) {
      return {
        symbol,
        decision: 'FAILED',
        isMaterial: true,
        materialityScore: materiality.score,
        materialityExplanation: materiality.explanation,
        shouldCallAI: false,
        fingerprintChanged: false,
        evaluatedAt,
        error: assembly.error || (symbol + ' verileri toplanamadi.')
      };
    }

    const newPackage = assembly.dataPackage;
    const newFingerprint = newPackage.fingerprint;
    const previousFingerprint = previousSnapshot?.fingerprint;

    // 7. Fingerprint Equality Guard: If fingerprint is identical, skip AI analysis!
    if (previousFingerprint && previousFingerprint === newFingerprint) {
      // Mark event as processed to avoid repeating
      this.markEventProcessed(eventKey);

      return {
        symbol,
        decision: 'SKIPPED_UNCHANGED',
        primaryReason: materiality.reason,
        isMaterial: true,
        materialityScore: materiality.score,
        materialityExplanation: 'Olay finansal olarak anlamli kabul edildi ancak veri parmak izinde degisiklik tespit edilmedi. AI cagrisi yapilmadi.',
        shouldCallAI: false,
        previousFingerprint,
        newFingerprint,
        fingerprintChanged: false,
        evaluatedAt
      };
    }

    // 8. Materiality confirmed AND fingerprint changed -> TRIGGERED!
    this.markEventProcessed(eventKey);

    return {
      symbol,
      decision: 'TRIGGERED',
      primaryReason: materiality.reason,
      isMaterial: true,
      materialityScore: materiality.score,
      materialityExplanation: materiality.explanation,
      shouldCallAI: true,
      previousFingerprint,
      newFingerprint,
      fingerprintChanged: true,
      diffSummary: [materiality.explanation],
      evaluatedAt
    };
  }

  /**
   * Evaluates a batch of events, merging multiple simultaneous triggers for the same symbol
   */
  public static async evaluateEventsBatch(
    events: TriggerEvaluationEvent[]
  ): Promise<Map<string, TriggerEvaluationResult>> {
    const results = new Map<string, TriggerEvaluationResult>();

    // Group events by symbol
    const symbolEventsMap = new Map<string, TriggerEvaluationEvent[]>();
    for (const ev of events) {
      const sym = ev.symbol.toUpperCase().trim();
      const list = symbolEventsMap.get(sym) || [];
      list.push(ev);
      symbolEventsMap.set(sym, list);
    }

    // Evaluate each symbol group
    for (const [sym, symbolEvents] of symbolEventsMap.entries()) {
      if (symbolEvents.length === 1) {
        const singleResult = await this.evaluateEvent(symbolEvents[0]);
        results.set(sym, singleResult);
        continue;
      }

      // Multiple events for the same symbol: evaluate each and merge
      const candidateResults: TriggerEvaluationResult[] = [];
      for (const ev of symbolEvents) {
        candidateResults.push(await this.evaluateEvent(ev));
      }

      // Check if at least one event triggered
      const triggeredList = candidateResults.filter(r => r.decision === 'TRIGGERED');
      if (triggeredList.length > 0) {
        // Merge reasons and explanations
        const mergedReasons: TriggerReason[] = Array.from(
          new Set(triggeredList.map(t => t.primaryReason).filter(Boolean) as TriggerReason[])
        );
        const mergedExplanations = triggeredList.map(t => t.materialityExplanation).join('; ');
        const highestScore = Math.max(...triggeredList.map(t => t.materialityScore));

        results.set(sym, {
          symbol: sym,
          decision: 'TRIGGERED',
          primaryReason: mergedReasons[0] || 'SCHEDULED_MATERIAL_CHANGE',
          mergedReasons,
          isMaterial: true,
          materialityScore: highestScore,
          materialityExplanation: 'Coklu olay birlestirildi: ' + mergedExplanations,
          shouldCallAI: true,
          previousFingerprint: triggeredList[0].previousFingerprint,
          newFingerprint: triggeredList[0].newFingerprint,
          fingerprintChanged: true,
          diffSummary: triggeredList.flatMap(t => t.diffSummary || []),
          evaluatedAt: new Date().toISOString()
        });
      } else {
        // Choose most representative skipped status
        const first = candidateResults[0];
        results.set(sym, first);
      }
    }

    return results;
  }

  /**
   * Executes an analysis update if the evaluation result was TRIGGERED
   */
  public static async triggerAnalysisUpdate(result: TriggerEvaluationResult) {
    if (result.decision !== 'TRIGGERED') {
      return {
        success: false,
        skipped: true,
        decision: result.decision,
        reason: result.materialityExplanation
      };
    }

    return await AnalysisPipeline.execute(result.symbol, {
      forceRefresh: false,
      triggerReason: result.primaryReason || 'SCHEDULED_MATERIAL_CHANGE',
      previousFingerprint: result.previousFingerprint
    });
  }

  /**
   * Scheduled periodic check runner: Evaluates symbols deterministically with strict AI budget limit
   */
  public static async runScheduledCheck(options: {
    symbols?: string[];
    batchSize?: number;
    maxAiCalls?: number;
    dryRun?: boolean;
  } = {}): Promise<ScheduledUpdateBatchSummary> {
    const startedAt = new Date().toISOString();
    const symbols = options.symbols || this.DEFAULT_PILOT_SYMBOLS;
    const batchSize = Math.min(options.batchSize || symbols.length, 20);
    const maxAiCalls = options.maxAiCalls ?? 3; // Strict AI cost budget cap
    const dryRun = options.dryRun ?? false;

    const targets = symbols.slice(0, batchSize);
    const results: TriggerEvaluationResult[] = [];
    let aiCallsCount = 0;

    let triggeredCount = 0;
    let skippedUnchangedCount = 0;
    let skippedNotMaterialCount = 0;
    let skippedDuplicateCount = 0;
    let skippedStaleCount = 0;
    let lockedCount = 0;
    let failedCount = 0;

    for (const sym of targets) {
      // 1. Fetch latest snapshot
      const previousSnapshot = await AnalysisSnapshotService.getLatestSnapshot(sym);

      // 2. Synthesize a scheduled check event
      const checkEvent: TriggerEvaluationEvent = {
        id: 'sched-' + sym + '-' + new Date().toISOString().slice(0, 13),
        type: 'SCHEDULED_CHECK',
        symbol: sym,
        timestamp: new Date().toISOString(),
        source: 'FinAi Scheduled Check Engine'
      };

      // 3. Evaluate event deterministically
      const evaluation = await this.evaluateEvent(checkEvent, previousSnapshot);
      results.push(evaluation);

      switch (evaluation.decision) {
        case 'TRIGGERED':
          triggeredCount++;
          // Enforce AI budget cap: Only call AI if within allowed limit and not dryRun
          if (!dryRun && aiCallsCount < maxAiCalls) {
            aiCallsCount++;
            await this.triggerAnalysisUpdate(evaluation);
          }
          break;
        case 'SKIPPED_UNCHANGED':
          skippedUnchangedCount++;
          break;
        case 'SKIPPED_NOT_MATERIAL':
          skippedNotMaterialCount++;
          break;
        case 'SKIPPED_DUPLICATE':
          skippedDuplicateCount++;
          break;
        case 'SKIPPED_STALE':
          skippedStaleCount++;
          break;
        case 'LOCKED':
          lockedCount++;
          break;
        case 'FAILED':
          failedCount++;
          break;
      }
    }

    return {
      startedAt,
      completedAt: new Date().toISOString(),
      totalEvaluated: targets.length,
      triggeredCount,
      skippedUnchangedCount,
      skippedNotMaterialCount,
      skippedDuplicateCount,
      skippedStaleCount,
      lockedCount,
      failedCount,
      aiCallsCount,
      results
    };
  }

  // ==========================================================================
  // DETERMINISTIC MATERIALITY EVALUATION HELPERS
  // ==========================================================================

  private static evaluateMateriality(
    event: TriggerEvaluationEvent,
    symbol: string,
    previousSnapshot: AnalysisSnapshotRecord | null
  ): { isMaterial: boolean; score: number; reason: TriggerReason; explanation: string } {
    switch (event.type) {
      case 'FINANCIAL_STATEMENT':
        return this.evalFinancialStatement(event, previousSnapshot);

      case 'COMPANY_EVENT':
        return this.evalCompanyEvent(event, symbol);

      case 'NEWS':
        return this.evalNews(event, symbol);

      case 'ECONOMIC_CALENDAR':
        return this.evalEconomicCalendar(event, symbol);

      case 'FX_CHANGE':
        return this.evalFxChange(event, symbol);

      case 'COMMODITY_CHANGE':
        return this.evalCommodityChange(event, symbol);

      case 'DIVIDEND_EVENT':
        return this.evalDividendEvent(event, previousSnapshot);

      case 'TECHNICAL_REGIME_CHANGE':
        return this.evalTechnicalRegime(event);

      case 'SCHEDULED_CHECK':
      case 'MANUAL_REQUEST':
      default:
        // Scheduled check relies on downstream data package comparison
        return {
          isMaterial: true,
          score: 0.7,
          reason: 'SCHEDULED_MATERIAL_CHANGE',
          explanation: 'Periyodik analiz guncellik kontrolu.'
        };
    }
  }

  private static evalFinancialStatement(
    event: TriggerEvaluationEvent,
    previousSnapshot: AnalysisSnapshotRecord | null
  ) {
    const payload = event.payload || {};
    const newQuarter = payload.periodEnd || payload.quarter;
    const prevQuarter = previousSnapshot?.data_package?.statements?.latestQuarter?.periodEnd;

    // A: New financial period announced -> High Materiality
    if (newQuarter && prevQuarter && newQuarter !== prevQuarter) {
      return {
        isMaterial: true,
        score: 0.95,
        reason: 'NEW_FINANCIAL_STATEMENT' as TriggerReason,
        explanation: 'Yeni finansal donem tablosu aciklandi: ' + prevQuarter + ' -> ' + newQuarter + '.'
      };
    }

    // B: Material metrics delta (> 10% change in revenue or EBITDA)
    const revDelta = Math.abs(payload.revenueDeltaPercent || 0);
    const marginDelta = Math.abs(payload.marginDeltaPercent || 0);
    if (revDelta >= 10 || marginDelta >= 5) {
      return {
        isMaterial: true,
        score: 0.85,
        reason: 'NEW_FINANCIAL_STATEMENT' as TriggerReason,
        explanation: 'Finansal metriklerde belirgin sapma (Gelir: %' + revDelta.toFixed(1) + ', Marj: %' + marginDelta.toFixed(1) + ').'
      };
    }

    // C: Immaterial sub-1% or trivial adjustment -> Skip
    return {
      isMaterial: false,
      score: 0.2,
      reason: 'NEW_FINANCIAL_STATEMENT' as TriggerReason,
      explanation: 'Finansal verilerde analiz sonucunu degistirebilecek anlamli bir sapma tespit edilmedi.'
    };
  }

  private static evalCompanyEvent(event: TriggerEvaluationEvent, symbol: string) {
    const headline = (event.headline || (event.payload && event.payload.title) || '').toLowerCase();
    const materialKeywords = [
      'ihale', 'sozlesme', 'yatirim', 'pay alim', 'sermaye', 'birlesme',
      'devralma', 'ortaklik', 'fabrika', 'uretim kapasite', 'ruhsat'
    ];

    const hasKeyword = materialKeywords.some(k => headline.includes(k));
    const mentionsCompany = headline.includes(symbol.toLowerCase()) || Boolean(event.payload && event.payload.isDirect);

    if (hasKeyword && (mentionsCompany || !(event.payload && event.payload.otherSymbol))) {
      return {
        isMaterial: true,
        score: 0.85,
        reason: 'COMPANY_EVENT' as TriggerReason,
        explanation: 'Sirket faaliyet yapisini etkileyebilecek onemli sirket gelismesi (' + (event.headline || 'KAP Gelismesi') + ').'
      };
    }

    return {
      isMaterial: false,
      score: 0.25,
      reason: 'COMPANY_EVENT' as TriggerReason,
      explanation: 'Gelisme sirketin temel analiz varsayimlarini etkileyecek duzeyde bulunmadi.'
    };
  }

  private static evalNews(event: TriggerEvaluationEvent, symbol: string) {
    const headline = (event.headline || (event.payload && event.payload.title) || '').toLowerCase();
    const score = (event.payload && event.payload.relevanceScore != null)
      ? event.payload.relevanceScore
      : (headline.includes(symbol.toLowerCase()) ? 0.85 : 0.3);

    // Direct company relevance threshold: >= 0.6
    if (score >= 0.6) {
      return {
        isMaterial: true,
        score,
        reason: 'MATERIAL_NEWS' as TriggerReason,
        explanation: 'Yuksek korelasyonlu piyasa haberi dahil edildi (Skor: ' + score.toFixed(2) + ').'
      };
    }

    return {
      isMaterial: false,
      score,
      reason: 'MATERIAL_NEWS' as TriggerReason,
      explanation: 'Haber sirket ile dogrudan iliskili veya yeterince etkili bulunmadi (Alaka skoru: ' + score.toFixed(2) + ' < 0.60).'
    };
  }

  private static evalEconomicCalendar(event: TriggerEvaluationEvent, symbol: string) {
    const eventName = (event.headline || (event.payload && event.payload.event) || '').toLowerCase();
    const importance = (event.payload && event.payload.importance != null) ? event.payload.importance : 3;

    // Macro relevance mapping
    const isRate = eventName.includes('faiz') || eventName.includes('ppk') || eventName.includes('tcmb');
    const isInflation = eventName.includes('tufe') || eventName.includes('enflasyon') || eventName.includes('ufe');
    const isTrade = eventName.includes('ihracat') || eventName.includes('cari denge');

    const isAviationOrSteel = ['THYAO', 'EREGL', 'TUPRS', 'KRDMD'].includes(symbol);
    const isBank = ['GARAN', 'AKBNK', 'ISCTR', 'YKBNK'].includes(symbol);
    const isRetail = ['BIMAS', 'MGROS', 'SOKM'].includes(symbol);

    if (importance >= 3) {
      if ((isRate && isBank) || (isInflation && isRetail) || (isTrade && isAviationOrSteel)) {
        return {
          isMaterial: true,
          score: 0.8,
          reason: 'MACRO_EVENT' as TriggerReason,
          explanation: 'Sirketin sektor ve bilanco yapisini dogrudan etkileyen makro gelisme (' + (event.headline || eventName) + ').'
        };
      }
    }

    return {
      isMaterial: false,
      score: 0.3,
      reason: 'MACRO_EVENT' as TriggerReason,
      explanation: 'Makro takvim olayi sirketin birincil aktarim kanallari icin oncelikli degil.'
    };
  }

  private static evalFxChange(event: TriggerEvaluationEvent, symbol: string) {
    const fxPair = (event.payload && event.payload.pair) || 'USDTRY';
    const changePercent = Math.abs((event.payload && event.payload.changePercent) || 0);

    // High FX exposed companies
    const highFxExposed = ['THYAO', 'EREGL', 'TUPRS', 'SISE', 'FROTO', 'ARCLK'].includes(symbol);

    if (changePercent >= 2.0 && highFxExposed) {
      return {
        isMaterial: true,
        score: 0.8,
        reason: 'FX_CHANGE' as TriggerReason,
        explanation: fxPair + ' kurunda belirgin hareket (%' + changePercent.toFixed(1) + ') sirketin doviz pozisyonunu etkiliyor.'
      };
    }

    return {
      isMaterial: false,
      score: 0.25,
      reason: 'FX_CHANGE' as TriggerReason,
      explanation: 'Kur degisimi (%' + changePercent.toFixed(1) + ') sirketin bilancosu icin tetikleme esigini asmadi.'
    };
  }

  private static evalCommodityChange(event: TriggerEvaluationEvent, symbol: string) {
    const commodity = ((event.payload && event.payload.commodity) || '').toLowerCase();
    const changePercent = Math.abs((event.payload && event.payload.changePercent) || 0);

    const isOil = commodity.includes('oil') || commodity.includes('petrol') || commodity.includes('brent');
    const isSteel = commodity.includes('steel') || commodity.includes('celik') || commodity.includes('iron');

    // Oil -> Aviation (THYAO) & Refineries (TUPRS)
    if (isOil && changePercent >= 2.5 && ['THYAO', 'TUPRS'].includes(symbol)) {
      return {
        isMaterial: true,
        score: 0.85,
        reason: 'COMMODITY_CHANGE' as TriggerReason,
        explanation: 'Brent petrol fiyatindaki %' + changePercent.toFixed(1) + ' hareket sirketin maliyet/gelir dengesini dogrudan etkiliyor.'
      };
    }

    // Steel -> EREGL
    if (isSteel && changePercent >= 2.5 && ['EREGL', 'KRDMD'].includes(symbol)) {
      return {
        isMaterial: true,
        score: 0.85,
        reason: 'COMMODITY_CHANGE' as TriggerReason,
        explanation: 'Celik/demir fiyatlarindaki %' + changePercent.toFixed(1) + ' degisim sirketin urun marjini dogrudan etkiliyor.'
      };
    }

    return {
      isMaterial: false,
      score: 0.2,
      reason: 'COMMODITY_CHANGE' as TriggerReason,
      explanation: 'Emtia hareketi (' + commodity + ') sirketin birincil maliyet ve gelir yapisiyla dogrudan iliskili degil.'
    };
  }

  private static evalDividendEvent(
    event: TriggerEvaluationEvent,
    previousSnapshot: AnalysisSnapshotRecord | null
  ) {
    const prevCount = (previousSnapshot?.data_package?.corporateActions as any)?.historicalDividendsCount || 0;
    const newCount = (event.payload && event.payload.dividendCount) || (prevCount + 1);

    if (newCount > prevCount || (event.payload && event.payload.isNewDecision)) {
      return {
        isMaterial: true,
        score: 0.8,
        reason: 'DIVIDEND_EVENT' as TriggerReason,
        explanation: 'Sirket yeni temettu dagitim veya genel kurul karari acikladi.'
      };
    }

    return {
      isMaterial: false,
      score: 0.2,
      reason: 'DIVIDEND_EVENT' as TriggerReason,
      explanation: 'Temettu verilerinde analizi degistirecek yeni bir karar bulunmuyor.'
    };
  }

  private static evalTechnicalRegime(event: TriggerEvaluationEvent) {
    const payload = event.payload || {};
    const volumeSurge = payload.volumeSurgeMultiple || 1.0;
    const isRegimeBreak = Boolean(payload.is200DayMaBreak || payload.isExtremeRsiBreakout);

    // Rule: Simple daily price movements are NEVER triggers on their own!
    if (isRegimeBreak || volumeSurge >= 2.5) {
      return {
        isMaterial: true,
        score: 0.75,
        reason: 'TECHNICAL_REGIME_CHANGE' as TriggerReason,
        explanation: 'Teknik rejim degisimi tespit edildi (Hacim artisi: ' + volumeSurge.toFixed(1) + 'x veya hareketli ortalama kirilimi).'
      };
    }

    return {
      isMaterial: false,
      score: 0.15,
      reason: 'TECHNICAL_REGIME_CHANGE' as TriggerReason,
      explanation: 'Rutin gunluk fiyat dalgalanmasi analiz guncellemesi icin yeterli degildir.'
    };
  }

  // ==========================================================================
  // DEDUPLICATION & FRESHNESS MANAGEMENT
  // ==========================================================================

  private static isEventDuplicate(eventKey: string): boolean {
    const lastSeen = this.processedEvents.get(eventKey);
    if (!lastSeen) return false;
    if (Date.now() - lastSeen > this.EVENT_DEDUP_TTL_MS) {
      this.processedEvents.delete(eventKey);
      return false;
    }
    return true;
  }

  private static markEventProcessed(eventKey: string): void {
    this.processedEvents.set(eventKey, Date.now());
  }

  /**
   * Clears the deduplication cache. Used by tests.
   */
  public static clearProcessedEvents(): void {
    this.processedEvents.clear();
  }

  private static validateEventFreshness(event: TriggerEvaluationEvent): { valid: boolean; reason: string } {
    if (!event.timestamp) {
      return { valid: true, reason: 'Tarih bilgisi yok, gecerli kabul edildi.' };
    }

    const eventTime = new Date(event.timestamp).getTime();
    if (isNaN(eventTime)) {
      return { valid: false, reason: 'Gecersiz olay zaman damgasi.' };
    }

    const ageMs = Date.now() - eventTime;
    const ttl = FRESHNESS_THRESHOLDS[event.type] || (24 * 60 * 60 * 1000);

    if (ageMs > ttl) {
      return {
        valid: false,
        reason: 'Veri zaman asimina ugramis (Yas: ' + Math.round(ageMs / 60000) + ' dk > TTL: ' + Math.round(ttl / 60000) + ' dk). Bayat veri nedeniyle analiz tetiklenmedi.'
      };
    }

    return { valid: true, reason: 'Veri taze.' };
  }
}
