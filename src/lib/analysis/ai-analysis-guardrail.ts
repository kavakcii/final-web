/**
 * FinAi Analysis Guardrail & Quality Control Engine - Phase 5
 * 
 * An independent, deterministic verification layer that validates AI-generated
 * analyses against strictly grounded context, financial truth, SPK regulations,
 * source provenance, and causal logic before publishing.
 * 
 * Decisions:
 * - PASS: Fully grounded, compliant, and coherent. Ready for publishing.
 * - WARN: Minor non-critical inconsistencies detected. Publishable with recorded audit warning.
 * - REJECT: Critical violation (hallucinated figures, investment advice, target price, fake source).
 *   Must NOT be published; triggers deterministic Impact Engine fallback.
 */

import {
  AIAnalysisResult,
  AssembledDataPackage,
  AIAnalysisContext,
  QualityAuditReport,
  GuardrailDecision,
  GuardrailViolation,
  ValidatedClaim,
  ImpactTransmissionChannel
} from './types';

export class AIAnalysisGuardrail {
  public static readonly VERSION = '1.0.0';

  private static readonly VALID_TRANSMISSION_CHANNELS: ImpactTransmissionChannel[] = [
    'REVENUE',
    'GROSS_MARGIN',
    'OPERATING_PROFIT',
    'FINANCING_COST',
    'FX_GAIN_LOSS',
    'TAX',
    'ONE_OFF',
    'NET_INCOME',
    'CASH_FLOW',
    'BALANCE_SHEET',
    'CAPITAL_STRUCTURE',
    'SECTOR_COMPETITION',
    'VALUATION_MULTIPLE',
    'MARKET_SENTIMENT'
  ];

  /**
   * Main entry point: Performs independent multi-dimensional audit of an AI analysis
   */
  public static audit(
    analysis: AIAnalysisResult,
    dataPackage: AssembledDataPackage,
    context?: AIAnalysisContext
  ): QualityAuditReport {
    const checkedAt = new Date().toISOString();
    const violations: GuardrailViolation[] = [];
    const warnings: string[] = [];
    const validatedClaims: ValidatedClaim[] = [];
    const unverifiedClaims: string[] = [];
    const sourceMismatches: string[] = [];
    const complianceViolations: string[] = [];
    const dataConsistencyIssues: string[] = [];

    // 1. Schema / Structural Integrity Validation
    this.validateSchema(analysis, violations);

    // 2. Regulatory & Investment Advice Compliance Validation
    this.validateCompliance(analysis, violations, complianceViolations);

    // 3. Hallucination & Data Grounding Validation
    this.validateDataGrounding(analysis, dataPackage, context, violations, validatedClaims, unverifiedClaims);

    // 4. Source & Provenance Matching Validation
    this.validateSources(analysis, dataPackage, violations, sourceMismatches);

    // 5. Causality & Transmission Channel Validation
    this.validateCausality(analysis, violations);

    // 6. Balance Sheet Waterfall & Narrative Coherence
    this.validateWaterfall(analysis, dataConsistencyIssues);

    // 7. Impact Balance & Dialectic Alignment
    this.validateImpactBalance(analysis, dataPackage, violations, warnings);

    // 8. Unavailable & Stale Data Integrity
    if (context) {
      this.validateUnavailableData(analysis, context, violations);
    }

    // Determine Final Decision
    const hasCritical = violations.some(v => v.severity === 'CRITICAL');
    const hasWarning = violations.some(v => v.severity === 'WARNING') || warnings.length > 0;

    let decision: GuardrailDecision = 'PASS';
    if (hasCritical) {
      decision = 'REJECT';
    } else if (hasWarning) {
      decision = 'WARN';
    }

    return {
      guardrailVersion: this.VERSION,
      checkedAt,
      decision,
      isPublishable: decision !== 'REJECT',
      violations,
      warnings,
      validatedClaims,
      unverifiedClaims,
      sourceMismatches,
      complianceViolations,
      dataConsistencyIssues,
      auditedSymbol: analysis.symbol || dataPackage.symbol,
      dataFingerprint: analysis.snapshotFingerprint || dataPackage.fingerprint
    };
  }

  /**
   * 1. Schema / Structural Validation
   */
  private static validateSchema(analysis: AIAnalysisResult, violations: GuardrailViolation[]): void {
    if (!analysis) {
      violations.push({
        code: 'SCHEMA_INVALID',
        message: 'Analiz nesnesi boş veya tanımsız.',
        severity: 'CRITICAL'
      });
      return;
    }

    const requiredStringFields: (keyof AIAnalysisResult)[] = [
      'symbol',
      'companyName',
      'generalOverview',
      'impactBalanceReasoning',
      'detailedCommentary',
      'educationalTakeaway'
    ];

    for (const field of requiredStringFields) {
      const val = analysis[field];
      if (typeof val !== 'string' || val.trim().length === 0) {
        violations.push({
          code: 'SCHEMA_INVALID',
          message: `Zorunlu alan eksik veya geçersiz metin: ${String(field)}`,
          field: String(field),
          severity: 'CRITICAL'
        });
      }
    }

    // Impact Balance Enum Check
    const validBalances = ['Pozitif', 'Negatif', 'Nötr'];
    if (!validBalances.includes(analysis.impactBalance)) {
      violations.push({
        code: 'SCHEMA_INVALID',
        message: `Geçersiz impactBalance değeri: "${analysis.impactBalance}". Yalnızca 'Pozitif', 'Negatif', 'Nötr' kabul edilir.`,
        field: 'impactBalance',
        severity: 'CRITICAL'
      });
    }

    // Scenarios Validation
    if (
      !analysis.scenarios ||
      typeof analysis.scenarios.baseline !== 'string' ||
      typeof analysis.scenarios.optimistic !== 'string' ||
      typeof analysis.scenarios.cautious !== 'string' ||
      !analysis.scenarios.baseline.trim() ||
      !analysis.scenarios.optimistic.trim() ||
      !analysis.scenarios.cautious.trim()
    ) {
      violations.push({
        code: 'SCHEMA_INVALID',
        message: 'Senaryo yapısı eksik (baseline, optimistic veya cautious alanı boş).',
        field: 'scenarios',
        severity: 'CRITICAL'
      });
    }

    // Key Factors Validation
    if (!Array.isArray(analysis.keyFactors) || analysis.keyFactors.length === 0) {
      violations.push({
        code: 'SCHEMA_INVALID',
        message: 'En az 1 adet ana etki faktörü (keyFactors) bulunmalıdır.',
        field: 'keyFactors',
        severity: 'CRITICAL'
      });
    } else {
      for (let i = 0; i < analysis.keyFactors.length; i++) {
        const factor = analysis.keyFactors[i];
        if (!factor.title || !factor.transmissionChannel || !factor.causalExplanation) {
          violations.push({
            code: 'SCHEMA_INVALID',
            message: `Faktör #${i + 1} eksik alan içeriyor (title, transmissionChannel veya causalExplanation).`,
            field: `keyFactors[${i}]`,
            severity: 'CRITICAL'
          });
        }
      }
    }

    // Source References Validation
    if (!Array.isArray(analysis.sourceReferences) || analysis.sourceReferences.length === 0) {
      violations.push({
        code: 'SCHEMA_INVALID',
        message: 'Analiz doğrulanmış en az 1 kaynak referansı içermelidir.',
        field: 'sourceReferences',
        severity: 'CRITICAL'
      });
    }
  }

  /**
   * 2. Regulatory & Compliance Validation (SPK investment advice & prohibited words)
   */
  private static validateCompliance(
    analysis: AIAnalysisResult,
    violations: GuardrailViolation[],
    complianceViolations: string[]
  ): void {
    const fullText = `
      ${analysis.generalOverview || ''}
      ${analysis.impactBalanceReasoning || ''}
      ${analysis.detailedCommentary || ''}
      ${analysis.scenarios?.baseline || ''}
      ${analysis.scenarios?.optimistic || ''}
      ${analysis.scenarios?.cautious || ''}
      ${(analysis.keyFactors || []).map(f => `${f.title} ${f.causalExplanation}`).join(' ')}
    `.toLowerCase();

    // 1. Buy / Sell / Hold Advice Prohibitions
    const advicePatterns: { pattern: RegExp; desc: string }[] = [
      { pattern: /\b(al tavsiyesi|sat tavsiyesi|tut tavsiyesi|al sinyali|sat sinyali)\b/i, desc: 'Doğrudan Al/Sat/Tut tavsiyesi' },
      { pattern: /\b(kesinlikle al|kesinlikle sat|mutlaka al|mutlaka sat)\b/i, desc: 'Kesin alım veya satım ısrarı' },
      { pattern: /\b(portföye ekleyin|portföyünüze ekleyin|portföye dahil edilmeli|portföyden çıkartın|derhal satın)\b/i, desc: 'Portföy eylem yönlendirmesi' },
      { pattern: /\b(alım fırsatıdır|satış fırsatıdır|kaçırılmayacak fırsat)\b/i, desc: 'Yönlendirici alım/satım fırsatı vurgusu' },
      { pattern: /\b(yatırım tavsiyesidir|yatırım danışmanlığı kapsamındadır)\b/i, desc: 'Yetkisiz yatırım tavsiyesi iddiası' }
    ];

    for (const { pattern, desc } of advicePatterns) {
      if (pattern.test(fullText)) {
        const match = fullText.match(pattern)?.[0] || desc;
        violations.push({
          code: 'INVESTMENT_ADVICE',
          message: `SPK mevzuat ihlali tespit edildi: "${match}" (${desc}).`,
          snippet: match,
          severity: 'CRITICAL'
        });
        complianceViolations.push(`Tavsiye İhlali: ${match}`);
      }
    }

    // 2. Target Price Prohibitions (excludes calendar years like 2024-2035)
    const targetPricePatterns = [
      /\b(?:hedef\s*fiyat|hedef\s*değer|hedef\s*seviye):?\s*(?!(?:202[0-9]|203[0-9])\b)(\d+(?:[.,]\d+)?)/i,
      /\b(\d+[\.,]?\d*\s*tl\s*hedef|hedefimiz\s*\d+\s*tl)/i,
      /\b12\s*aylık\s*hedef\s*fiyat:?\s*(?!(?:202[0-9]|203[0-9])\b)(\d+(?:[.,]\d+)?)/i
    ];

    for (const pattern of targetPricePatterns) {
      if (pattern.test(fullText)) {
        const match = fullText.match(pattern)?.[0] || 'Hedef Fiyat';
        violations.push({
          code: 'TARGET_PRICE',
          message: `Hedef fiyat veya kesin seviye tahmini tespit edildi: "${match}".`,
          snippet: match,
          severity: 'CRITICAL'
        });
        complianceViolations.push(`Hedef Fiyat İhlali: ${match}`);
      }
    }

    // 3. Absolute Guarantee / Certainty Prohibitions
    const certaintyPatterns = [
      /\b(garanti getiri|garantili kazanç|kesin kazanç|kesinlikle yükselecek|kesinlikle düşecek|kaçınılmaz yükseliş|kaçınılmaz düşüş)\b/i,
      /\b(yükseliş garanti|düşüş garanti|kesin artış|kesin azalış)\b/i
    ];

    for (const pattern of certaintyPatterns) {
      if (pattern.test(fullText)) {
        const match = fullText.match(pattern)?.[0] || 'Kesinlik İfadesi';
        violations.push({
          code: 'UNGROUNDED_CERTAINTY',
          message: `Finansal piyasaların belirsizlik doğasına aykırı kesinlik ifadesi: "${match}".`,
          snippet: match,
          severity: 'CRITICAL'
        });
        complianceViolations.push(`Kesinlik İhlali: ${match}`);
      }
    }

    // 4. Prohibited Health Score / Numerical Investment Rating
    const scorePatterns = [
      /\b(sağlık skoru:?\s*\d+|health score:?\s*\d+|finansal puan:?\s*\d+|yatırım puanı:?\s*\d+|genel puan:?\s*\d+\s*\/\s*100)\b/i
    ];

    for (const pattern of scorePatterns) {
      if (pattern.test(fullText)) {
        const match = fullText.match(pattern)?.[0] || 'Bileşik Skor';
        violations.push({
          code: 'INVESTMENT_ADVICE',
          message: `Yasaklı bileşik sayısal puan/skor kullanımı tespit edildi: "${match}".`,
          snippet: match,
          severity: 'CRITICAL'
        });
        complianceViolations.push(`Sayısal Skor İhlali: ${match}`);
      }
    }
  }

  /**
   * 3. Hallucination & Data Grounding Validation
   * Cross-references numbers in the narrative with the verified data package
   */
  private static validateDataGrounding(
    analysis: AIAnalysisResult,
    dataPackage: AssembledDataPackage,
    context: AIAnalysisContext | undefined,
    violations: GuardrailViolation[],
    validatedClaims: ValidatedClaim[],
    unverifiedClaims: string[]
  ): void {
    // Collect all grounded numbers from dataPackage and context
    const groundedNumbers = new Set<number>();
    const groundedStrings = new Set<string>();

    const addNum = (n: number | null | undefined) => {
      if (n != null && !isNaN(n) && isFinite(n)) {
        groundedNumbers.add(Number(n.toFixed(2)));
        groundedNumbers.add(Math.round(n));
        groundedNumbers.add(Math.floor(n));
      }
    };

    // Market data
    const mkt = dataPackage.marketData;
    if (mkt) {
      addNum(mkt.currentPrice);
      addNum(mkt.changePercent);
      addNum(mkt.high52w);
      addNum(mkt.low52w);
    }

    // Statements
    const qMetrics = dataPackage.statements?.latestQuarter?.financialMetrics;
    if (qMetrics) {
      addNum(qMetrics.grossMargin);
      addNum(qMetrics.operatingMargin);
      addNum(qMetrics.netMargin);
    }
    const qGrowth = dataPackage.statements?.latestQuarter?.yoyGrowth;
    if (qGrowth) {
      addNum(qGrowth.revenueGrowth);
      addNum(qGrowth.operatingIncomeGrowth);
      addNum(qGrowth.netIncomeGrowth);
    }

    // Sector comparisons
    if (dataPackage.sectorContext?.comparisons) {
      for (const comp of dataPackage.sectorContext.comparisons) {
        addNum(comp.companyValue);
        addNum(comp.sectorMedian);
        addNum(comp.difference);
      }
    }

    // Corporate actions
    if (dataPackage.corporateActions?.latestDividends?.[0]) {
      const div = dataPackage.corporateActions.latestDividends[0];
      addNum(div.grossDividend);
      addNum(div.netDividend);
    }

    // Extract numbers with percentage or currency signs from narrative text
    const textToInspect = `${analysis.generalOverview} ${analysis.detailedCommentary} ${analysis.impactBalanceReasoning}`;
    
    // Pattern for percentages: e.g. %21.4, %42, 21.4%
    const percentageRegex = /(?:%\s*(\d+[.,]?\d*)|(\d+[.,]?\d*)\s*%)/g;
    let pMatch;
    while ((pMatch = percentageRegex.exec(textToInspect)) !== null) {
      const rawVal = (pMatch[1] || pMatch[2]).replace(',', '.');
      const numVal = parseFloat(rawVal);
      if (!isNaN(numVal) && numVal > 0) {
        // Check if grounded in context
        const isMatched = Array.from(groundedNumbers).some(gn => Math.abs(gn - numVal) <= 0.5);
        if (isMatched) {
          validatedClaims.push({
            claimText: pMatch[0],
            category: 'FINANCIAL_METRIC',
            groundedValue: numVal,
            sourceContext: 'Mali Tablolar & Büyüme Oranları'
          });
        } else {
          // If the number is large and not grounded, note as unverified
          if (numVal > 1.0) {
            unverifiedClaims.push(`Teyit Edilmemiş Yüzde İddiası: ${pMatch[0]}`);
          }
        }
      }
    }

    // Pattern for specific price assertions: e.g. "350 TL", "215.40 ₺"
    const priceRegex = /(\d+[.,]?\d*)\s*(?:tl|₺|lira)/gi;
    let priceMatch;
    while ((priceMatch = priceRegex.exec(textToInspect)) !== null) {
      const rawPrice = priceMatch[1].replace(',', '.');
      const numPrice = parseFloat(rawPrice);
      if (!isNaN(numPrice)) {
        const isMatched = Array.from(groundedNumbers).some(gn => Math.abs(gn - numPrice) <= 1.0);
        if (isMatched) {
          validatedClaims.push({
            claimText: priceMatch[0],
            category: 'PRICE',
            groundedValue: numPrice,
            sourceContext: 'BIST Piyasa Verisi'
          });
        } else {
          // Check if it's a fabricated price claim
          if (mkt?.currentPrice && Math.abs(mkt.currentPrice - numPrice) > 5.0) {
            violations.push({
              code: 'HALLUCINATED_DATA',
              message: `Context dışı fiyat/seviye iddiası tespit edildi: "${priceMatch[0]}" (Mevcut fiyat: ${mkt.currentPrice} ₺).`,
              snippet: priceMatch[0],
              severity: 'CRITICAL'
            });
          }
        }
      }
    }
  }

  /**
   * 4. Source & Provenance Matching Validation
   */
  private static validateSources(
    analysis: AIAnalysisResult,
    dataPackage: AssembledDataPackage,
    violations: GuardrailViolation[],
    sourceMismatches: string[]
  ): void {
    const verifiedSourcesKeywords = [
      'kap',
      'kamuyu aydınlatma platformu',
      'bist',
      'borsa istanbul',
      'finansal tablolar',
      'mali tablolar',
      'matriks',
      'tcmb',
      'merkez bankası',
      'sektör',
      'tradingview',
      'yahoo',
      'finnhub',
      'opec',
      'şirket bildirimi',
      'faaliyet raporu',
      'haber',
      'basın',
      'döviz',
      'emtia',
      'künye',
      'takvim',
      'ekonomi',
      'akran',
      'konsolide',
      'gösterge',
      'finansal rasyo',
      'kurumsal eylem',
      'temettü',
      'piyasa',
      'rasyo',
      'bilişim'
    ];

    // Check sourceReferences
    for (const ref of analysis.sourceReferences || []) {
      const srcName = (ref.source || '').toLowerCase();
      const isKnown = verifiedSourcesKeywords.some(kw => srcName.includes(kw));

      // Check for fabricated URLs (only official authorized domains or verified article URLs)
      if (ref.url) {
        try {
          const parsed = new URL(ref.url);
          const domain = parsed.hostname.toLowerCase();
          const allowedDomains = [
            'kap.org.tr',
            'borsaistanbul.com',
            'tcmb.gov.tr',
            'matriksdata.com',
            'finnhub.io',
            'google.com',
            'bloomberght.com',
            'aa.com.tr',
            'dunya.com',
            'trthaber.com',
            'reuters.com'
          ];
          if (!allowedDomains.some(ad => domain.includes(ad))) {
            violations.push({
              code: 'SOURCE_MISMATCH',
              message: `Yetkisiz veya uydurma kaynak URL'si tespit edildi: "${ref.url}".`,
              snippet: ref.url,
              severity: 'CRITICAL'
            });
            sourceMismatches.push(`Uydurma URL: ${ref.url}`);
          }
        } catch {
          // Malformed URL
          violations.push({
            code: 'SOURCE_MISMATCH',
            message: `Geçersiz URL formatı: "${ref.url}".`,
            snippet: ref.url,
            severity: 'CRITICAL'
          });
        }
      }

      if (!isKnown && srcName.trim().length > 0) {
        // Unknown source origin
        violations.push({
          code: 'SOURCE_MISMATCH',
          message: `Doğrulanmamış kaynak referansı: "${ref.source}".`,
          snippet: ref.source,
          severity: 'CRITICAL'
        });
        sourceMismatches.push(`Bilinmeyen Kaynak: ${ref.source}`);
      }
    }

    // Check keyFactors[].source
    for (const factor of analysis.keyFactors || []) {
      const fSource = (factor.source || '').toLowerCase();
      const isKnown = verifiedSourcesKeywords.some(kw => fSource.includes(kw));
      if (!isKnown && fSource.trim().length > 0) {
        sourceMismatches.push(`Faktör Kaynak Uyarısı: ${factor.source}`);
      }
    }
  }

  /**
   * 5. Causality & Transmission Channel Validation
   */
  private static validateCausality(
    analysis: AIAnalysisResult,
    violations: GuardrailViolation[]
  ): void {
    for (const factor of analysis.keyFactors || []) {
      const channel = factor.transmissionChannel as ImpactTransmissionChannel;
      if (!this.VALID_TRANSMISSION_CHANNELS.includes(channel)) {
        violations.push({
          code: 'CAUSALITY_VIOLATION',
          message: `Geçersiz finansal aktarım kanalı: "${factor.transmissionChannel}".`,
          field: factor.title,
          severity: 'WARNING'
        });
      }

      // Check causal explanation structure: must have causal descriptive depth
      if (!factor.causalExplanation || factor.causalExplanation.length < 15) {
        violations.push({
          code: 'CAUSALITY_VIOLATION',
          message: `Faktör için nedensellik açıklaması yetersiz veya yüzeysel: "${factor.title}".`,
          field: factor.title,
          severity: 'WARNING'
        });
      }
    }
  }

  /**
   * 6. Balance Sheet Waterfall & Quality Coherence
   */
  private static validateWaterfall(
    analysis: AIAnalysisResult,
    dataConsistencyIssues: string[]
  ): void {
    const text = (analysis.detailedCommentary || '').toLowerCase();
    
    // Conflating accounting net profit with operating health without addressing cash flow divergence
    const assertsPureNetProfit = text.includes('kâr patlaması') || text.includes('olağanüstü kârlılık');
    const mentionsCashFlow = text.includes('nakit') || text.includes('işletme sermayesi') || text.includes('fcf');

    if (assertsPureNetProfit && !mentionsCashFlow) {
      dataConsistencyIssues.push('Bilanço şelalesinde net kâr ile nakit akımı ayrımı eksik bırakılmış.');
    }
  }

  /**
   * 7. Impact Balance & Dialectic Alignment Validation
   */
  private static validateImpactBalance(
    analysis: AIAnalysisResult,
    dataPackage: AssembledDataPackage,
    violations: GuardrailViolation[],
    warnings: string[]
  ): void {
    const factors = analysis.keyFactors || [];
    if (factors.length === 0) return;

    const positiveCount = factors.filter(f => f.direction === 'positive').length;
    const negativeCount = factors.filter(f => f.direction === 'negative').length;

    // Severe contradiction: Marked 'Pozitif' while 100% of factors are negative
    if (analysis.impactBalance === 'Pozitif' && positiveCount === 0 && negativeCount >= 2) {
      violations.push({
        code: 'IMPACT_BALANCE_CONTRADICTION',
        message: 'Etki Dengesi "Pozitif" olarak belirtilmiş ancak analiz edilen tüm ana faktörler negatif.',
        field: 'impactBalance',
        severity: 'WARNING'
      });
      warnings.push('Etki Dengesi (Pozitif) ile faktör yönleri (tamamı Negatif) çelişiyor.');
    }

    // Severe contradiction: Marked 'Negatif' while 100% of factors are positive
    if (analysis.impactBalance === 'Negatif' && negativeCount === 0 && positiveCount >= 2) {
      violations.push({
        code: 'IMPACT_BALANCE_CONTRADICTION',
        message: 'Etki Dengesi "Negatif" olarak belirtilmiş ancak analiz edilen tüm ana faktörler pozitif.',
        field: 'impactBalance',
        severity: 'WARNING'
      });
      warnings.push('Etki Dengesi (Negatif) ile faktör yönleri (tamamı Pozitif) çelişiyor.');
    }
  }

  /**
   * 8. Unavailable & Stale Data Integrity
   */
  private static validateUnavailableData(
    analysis: AIAnalysisResult,
    context: AIAnalysisContext,
    violations: GuardrailViolation[]
  ): void {
    const unavailable = context.unavailableDataPoints || [];
    if (unavailable.length === 0) return;

    const text = `${analysis.detailedCommentary} ${analysis.generalOverview}`.toLowerCase();

    for (const item of unavailable) {
      const lowerItem = item.toLowerCase();
      // If FCF is unavailable, AI should not declare a concrete factual FCF value
      if (lowerItem.includes('serbest nakit akımı') && text.includes('serbest nakit akımı pozitiftir')) {
        violations.push({
          code: 'UNAVAILABLE_DATA_USED',
          message: `Eksik veri ('${item}') bağlamda mevcut değil olarak işaretlenmesine rağmen kesin veri gibi kullanılmış.`,
          snippet: 'serbest nakit akımı pozitiftir',
          severity: 'CRITICAL'
        });
      }
    }
  }
}