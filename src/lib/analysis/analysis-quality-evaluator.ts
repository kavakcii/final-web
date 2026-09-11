/**
 * FinAi Analysis Quality Evaluator & Calibration Engine - Phase 10
 * 
 * Provides deterministic evaluation of the final analytical output:
 * 1. Grounding & Evidence Check: Does factor -> evidence -> source hold?
 * 2. Causal Consistency: Verifies Data -> Event -> Channel -> Company -> Financial Result chain.
 * 3. Factor Deduplication & Grouping: Merges factors with identical event/data/channel.
 * 4. Impact Balance Alignment: Checks that narrative matches qualitative impact balance (POZİTİF, NEGATİF, DENGELİ/NÖTR).
 * 5. Missing / Degraded Data Handling: Prevents definitive conclusions under missing/stale/conflict data.
 * 6. Zero Numeric Scores: Produces strictly qualitative decisions (PASS, WARN, REJECT).
 */

import {
  AIAnalysisResult,
  AssembledDataPackage,
  EvaluatedImpactFactor,
  ImpactEngineResult,
  QualityEvaluationResult,
  QualityDecision,
  QualityIssue,
  FactorDeduplicationReport,
  CausalChainValidationReport
} from './types';

export class AnalysisQualityEvaluator {
  public static readonly VERSION = '1.0.0-phase10';

  /**
   * Main entry point: Performs deterministic quality evaluation and factor grouping.
   */
  public static evaluateQuality(
    analysis: AIAnalysisResult,
    dataPackage: AssembledDataPackage,
    impact: ImpactEngineResult
  ): {
    qualityResult: QualityEvaluationResult;
    deduplicatedFactors: EvaluatedImpactFactor[];
    calibratedAnalysis: AIAnalysisResult;
  } {
    const issues: QualityIssue[] = [];
    const warnings: string[] = [];

    // 1. Causal Chain Verification
    const causalReport = this.verifyCausalChains(analysis, dataPackage, issues, warnings);

    // 2. Factor Deduplication & Grouping
    const { deduplicatedFactors, deduplicationReport } = this.deduplicateFactors(
      impact.evaluatedFactors || []
    );

    // 3. Impact Balance Alignment Check
    this.checkImpactBalanceAlignment(analysis, impact, issues, warnings);

    // 4. Missing / Degraded Data Assertion Audit
    const degradedNotice = this.auditDegradedDataClaims(analysis, dataPackage, issues, warnings);

    // 5. Evidence & Source Matching Audit
    this.auditEvidenceAndSources(analysis, dataPackage, issues, warnings);

    // 6. Prohibited Recommendation / Price Target Patterns
    this.auditProhibitedContent(analysis, issues);

    // Determine final qualitative decision (strictly PASS, WARN, REJECT - NO numeric score)
    const hasCritical = issues.some(i => i.severity === 'CRITICAL');
    const hasWarning = issues.some(i => i.severity === 'WARNING') || warnings.length > 0;

    let decision: QualityDecision = 'PASS';
    if (hasCritical) {
      decision = 'REJECT';
    } else if (hasWarning) {
      decision = 'WARN';
    }

    const qualityResult: QualityEvaluationResult = {
      evaluatorVersion: this.VERSION,
      evaluatedAt: new Date().toISOString(),
      decision,
      isPublishable: decision !== 'REJECT',
      issues,
      warnings,
      causalChainReport: causalReport,
      deduplicationReport,
      degradedDataNotice: degradedNotice
    };

    // Return calibrated analysis
    const calibratedAnalysis: AIAnalysisResult = {
      ...analysis,
      qualityEvaluation: qualityResult
    } as any;

    return {
      qualityResult,
      deduplicatedFactors,
      calibratedAnalysis
    };
  }

  /**
   * 1. Causal Chain Verification
   * Checks VERİ -> OLAY -> AKTARIM KANALI -> ŞİRKET -> FİNANSAL SONUÇ
   */
  private static verifyCausalChains(
    analysis: AIAnalysisResult,
    dataPackage: AssembledDataPackage,
    issues: QualityIssue[],
    warnings: string[]
  ): CausalChainValidationReport {
    const factors = analysis.keyFactors || [];
    let validCount = 0;
    let brokenCount = 0;
    const details: CausalChainValidationReport['details'] = [];

    for (const factor of factors) {
      const hasTrigger = Boolean(factor.title && factor.title.trim().length > 3);
      const hasChannel = Boolean(factor.transmissionChannel && factor.transmissionChannel.trim().length > 0);
      const expl = factor.causalExplanation || '';
      
      // Financial implication must have descriptive depth and mention financial effect
      const hasFinancialImplication = expl.length >= 15 && (
        expl.includes('marj') ||
        expl.includes('kâr') ||
        expl.includes('maliyet') ||
        expl.includes('gelir') ||
        expl.includes('nakit') ||
        expl.includes('finansman') ||
        expl.includes('gider') ||
        expl.includes('baskı') ||
        expl.includes('katkı') ||
        expl.includes('etki') ||
        expl.includes('denge')
      );

      const isComplete = hasTrigger && hasChannel && hasFinancialImplication;

      if (isComplete) {
        validCount++;
      } else {
        brokenCount++;
        warnings.push(`Eksik nedensel zincir: "${factor.title}" faktörünün finansal aktarımı tam detaylandırılmamış.`);
        issues.push({
          code: 'BROKEN_CAUSAL_CHAIN',
          severity: 'WARNING',
          message: `Nedensel zincir yetersiz: "${factor.title}". Veri -> Aktarım Kanalı -> Finansal Sonuç bağı güçlendirilmelidir.`,
          factorId: factor.title,
          channel: factor.transmissionChannel
        });
      }

      details.push({
        factorTitle: factor.title,
        hasTrigger,
        hasChannel,
        hasFinancialImplication,
        isComplete
      });
    }

    return {
      totalFactorsChecked: factors.length,
      validChainsCount: validCount,
      brokenChainsCount: brokenCount,
      details
    };
  }

  /**
   * 2. Factor Deduplication & Grouping
   * Merges factors with identical event/data/channel into clean, cohesive items.
   */
  public static deduplicateFactors(
    factors: EvaluatedImpactFactor[]
  ): {
    deduplicatedFactors: EvaluatedImpactFactor[];
    deduplicationReport: FactorDeduplicationReport;
  } {
    const originalCount = factors.length;
    const groups = new Map<string, EvaluatedImpactFactor[]>();

    for (const factor of factors) {
      const channel = factor.financialImpact?.primaryChannel || 'UNKNOWN';
      const eventKey = (factor.causeEffectChain?.event || factor.title || '')
        .toLowerCase()
        .replace(/[^a-z0-9ğüşıöç]/gi, ' ')
        .split(' ')
        .filter(w => w.length > 3)
        .slice(0, 3)
        .join('_') || 'general';

      const compositeKey = `${channel}::${eventKey}::${factor.impactDirection}`;

      if (!groups.has(compositeKey)) {
        groups.set(compositeKey, []);
      }
      groups.get(compositeKey)!.push(factor);
    }

    const deduplicatedFactors: EvaluatedImpactFactor[] = [];
    const groupedDetails: FactorDeduplicationReport['groupedFactors'] = [];

    for (const [key, groupList] of groups.entries()) {
      if (groupList.length === 1) {
        deduplicatedFactors.push(groupList[0]);
      } else {
        // Merge identical factors: pick the highest weight one as primary
        const sorted = [...groupList].sort((a, b) => (b.relativeWeightScore || 0) - (a.relativeWeightScore || 0));
        const primary = { ...sorted[0] };

        // Combine explanations if distinct
        const combinedExplanations = Array.from(
          new Set(sorted.map(s => s.explanation).filter(Boolean))
        ).join(' Ayrıca ');
        if (combinedExplanations.length > primary.explanation.length) {
          primary.explanation = combinedExplanations;
        }

        deduplicatedFactors.push(primary);

        groupedDetails.push({
          eventKey: key,
          channel: primary.financialImpact?.primaryChannel || 'UNKNOWN',
          mergedCount: groupList.length,
          survivingTitle: primary.title
        });
      }
    }

    return {
      deduplicatedFactors,
      deduplicationReport: {
        originalFactorCount: originalCount,
        deduplicatedFactorCount: deduplicatedFactors.length,
        groupedFactors: groupedDetails
      }
    };
  }

  /**
   * 3. Impact Balance Alignment Check
   * Checks that AI narrative aligns with the deterministic impact balance.
   */
  private static checkImpactBalanceAlignment(
    analysis: AIAnalysisResult,
    impact: ImpactEngineResult,
    issues: QualityIssue[],
    warnings: string[]
  ): void {
    const aiBalance = analysis.impactBalance;

    // Calculate deterministic balance
    let deterministicBalance: 'Pozitif' | 'Negatif' | 'Nötr' = 'Nötr';
    if (impact.dominantDrivers.length > impact.counterDrivers.length && impact.dominantDrivers.length > 0) {
      deterministicBalance = 'Pozitif';
    } else if (impact.counterDrivers.length > impact.dominantDrivers.length && impact.counterDrivers.length > 0) {
      deterministicBalance = 'Negatif';
    }

    // Direct opposite assertion (e.g. deterministic Pozitif vs AI Negatif)
    if (
      (deterministicBalance === 'Pozitif' && aiBalance === 'Negatif') ||
      (deterministicBalance === 'Negatif' && aiBalance === 'Pozitif')
    ) {
      issues.push({
        code: 'IMPACT_BALANCE_MISMATCH',
        severity: 'CRITICAL',
        message: `Deterministik etki dengesi (${deterministicBalance}) ile AI etki dengesi (${aiBalance}) taban tabana zıt.`
      });
    } else if (deterministicBalance !== aiBalance) {
      warnings.push(`Etki dengesi nüansı: Deterministik motor '${deterministicBalance}' iken AI '${aiBalance}' değerlendirdi.`);
      issues.push({
        code: 'IMPACT_BALANCE_MISMATCH',
        severity: 'WARNING',
        message: `Hafif etki dengesi uyumsuzluğu: Motor=${deterministicBalance}, AI=${aiBalance}.`
      });
    }
  }

  /**
   * 4. Missing / Degraded Data Assertion Audit
   * Prevents definitive conclusions under missing or stale data.
   */
  private static auditDegradedDataClaims(
    analysis: AIAnalysisResult,
    dataPackage: AssembledDataPackage,
    issues: QualityIssue[],
    warnings: string[]
  ): string | undefined {
    const text = `${analysis.generalOverview} ${analysis.detailedCommentary}`.toLowerCase();
    const missingItems: string[] = [];

    // Financial statements missing
    if (!dataPackage.statements || !dataPackage.statements.latestQuarter) {
      missingItems.push('Bilanço ve mali tablolar eksik');
      if (text.includes('kârlılığı kesinleşti') || text.includes('mali yapısı kusursuz')) {
        issues.push({
          code: 'DEGRADED_DATA_ASSERTION',
          severity: 'CRITICAL',
          message: 'Mali tablo verisi eksikken kesin kârlılık veya bilanço hükmü kurulmuş.'
        });
      }
    }

    // Relevant news missing
    if (!dataPackage.relevantNews || dataPackage.relevantNews.length === 0) {
      missingItems.push('Güncel haber akışı bulunmuyor');
    }

    // Macro calendar missing
    if (!dataPackage.relevantCalendarEvents || dataPackage.relevantCalendarEvents.length === 0) {
      missingItems.push('Makro takvim verisi eksik');
    }

    // Check for unsupported FX leaps (e.g. "Kur yükseldi -> şirket kesin batar/uçar" without company FX exposure data)
    if (text.includes('döviz') || text.includes('kur artışı')) {
      const hasCompanyFxExposure = Boolean(
        dataPackage.historicalTrends?.metricDirections?.['netForeignCurrencyExposure'] ||
        (dataPackage.statements?.latestQuarter as any)?.netForeignCurrencyPosition != null
      );
      if (!hasCompanyFxExposure && (text.includes('ağır zarar') || text.includes('yüksek kur kazancı'))) {
        warnings.push('Şirketin döviz pozisyon verisi olmadan kur etkisi hakkında kesin hüküm kurulamaz.');
        issues.push({
          code: 'UNSUPPORTED_SPECULATION',
          severity: 'WARNING',
          message: 'Döviz pozisyon tablosu olmaksızın kur etkisi üzerinde spekülatif hüküm tespit edildi.'
        });
      }
    }

    if (missingItems.length > 0) {
      return `Analiz şu veri kısıtları altında üretilmiştir: ${missingItems.join(', ')}.`;
    }
    return undefined;
  }

  /**
   * 5. Evidence & Source Matching Audit
   */
  private static auditEvidenceAndSources(
    analysis: AIAnalysisResult,
    dataPackage: AssembledDataPackage,
    issues: QualityIssue[],
    warnings: string[]
  ): void {
    const allowedSourceTerms = [
      'kap', 'kamuyu aydınlatma', 'bist', 'borsa istanbul', 'finansal tablo',
      'matriks', 'tcmb', 'sektör', 'tradingview', 'yahoo', 'finnhub', 'faaliyet raporu',
      'künye', 'takvim', 'akran', 'haber', 'basın', 'döviz', 'emtia'
    ];

    for (const ref of analysis.sourceReferences || []) {
      const sName = (ref.source || '').toLowerCase();
      const isAllowed = allowedSourceTerms.some(t => sName.includes(t));
      if (!isAllowed && sName.trim().length > 0) {
        issues.push({
          code: 'SOURCE_MISMATCH',
          severity: 'WARNING',
          message: `Doğrulanmamış kaynak: "${ref.source}".`,
          snippet: ref.source
        });
      }
    }
  }

  /**
   * 6. Prohibited Recommendation & Price Target Audit
   */
  private static auditProhibitedContent(
    analysis: AIAnalysisResult,
    issues: QualityIssue[]
  ): void {
    const fullText = `${analysis.generalOverview} ${analysis.detailedCommentary} ${analysis.impactBalanceReasoning}`.toLowerCase();

    // 1. Advice patterns
    const advicePatterns = [
      /\b(kesinlikle al|portföyünüze ekleyin|kesin yükselecek|kesin düşecek|derhal sat)\b/i,
      /\b(yatırım tavsiyesidir|alım fırsatıdır|satış tavsiyesidir)\b/i
    ];
    for (const p of advicePatterns) {
      const match = p.exec(fullText);
      if (match) {
        issues.push({
          code: 'INVESTMENT_ADVICE_PATTERN',
          severity: 'CRITICAL',
          message: `Yasaklı yatırım tavsiyesi ifadesi tespit edildi: "${match[0]}".`,
          snippet: match[0]
        });
      }
    }

    // 2. Price Target patterns
    const targetPriceRegex = /(?:(?:hedef\s*fiyat|fiyat\s*hedefi|hedefimiz|beklentimiz\s*fiyat)\s*(?:olarak)?\s*:?\s*(\d+[.,]?\d*)|\b(\d+[.,]?\d*)\s*(?:tl|₺)\s*(?:hedef|hedefimiz))/i;
    const tpMatch = targetPriceRegex.exec(fullText);
    if (tpMatch) {
      issues.push({
        code: 'UNVERIFIED_PRICE_TARGET',
        severity: 'CRITICAL',
        message: `Yasaklı hedef fiyat tahmini tespit edildi: "${tpMatch[0]}".`,
        snippet: tpMatch[0]
      });
    }
  }
}
