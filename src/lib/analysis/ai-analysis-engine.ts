/**
 * FinAi AI Analysis Engine - Phase 4
 * 
 * Controlled, deterministic-first AI service that feeds verified analytical packages
 * and causal impact factors into Google Gemini to produce educational, narrative,
 * investment-advice-free financial analysis.
 * 
 * Key Principles:
 * 1. No Raw Data Dumps: AI receives strictly prepared context with verified causal chains.
 * 2. Caching: Identical snapshot fingerprints avoid redundant Gemini calls.
 * 3. Prohibited Advice Guard: Strictly rejects Buy/Sell/Hold, price targets, or certainty claims.
 * 4. Resilient Fallback: If Gemini fails (timeout, rate limit, parse error), gracefully
 *    provides deterministic structured synthesis derived from the Impact Engine.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  AssembledDataPackage,
  AIAnalysisResult,
  AIAnalysisContext,
  ImpactEngineResult,
  EvaluatedImpactFactor,
  ImpactBalanceRating
} from './types';
import { FinancialImpactEngine } from './impact-engine';
import { AnalysisSnapshotService } from './analysis-snapshot-service';
import {
  FINAI_ANALYSIS_SYSTEM_PROMPT,
  FINAI_SYSTEM_PROMPT_VERSION
} from './prompts/finai-system-prompt';
import { AIAnalysisGuardrail } from './ai-analysis-guardrail';

export interface AIAnalysisOptions {
  forceRefresh?: boolean;
  modelName?: string;
  timeoutMs?: number;
}

export class AIAnalysisEngine {
  public static readonly VERSION = '1.0.0-phase4';
  public static readonly DEFAULT_MODELS = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-flash-latest'
  ];

  // In-memory cache for fast sub-millisecond retrieval by snapshot fingerprint
  private static memoryCache = new Map<string, AIAnalysisResult>();

  /**
   * Primary entry point: Produces a structured FinAi analysis for an AssembledDataPackage
   */
  public static async analyze(
    dataPackage: AssembledDataPackage,
    options: AIAnalysisOptions = {}
  ): Promise<AIAnalysisResult> {
    const symbol = dataPackage.symbol.toUpperCase();
    const fingerprint = dataPackage.fingerprint;
    const forceRefresh = options.forceRefresh ?? false;

    // 1. Check in-memory cache
    if (!forceRefresh && this.memoryCache.has(fingerprint)) {
      const cached = this.memoryCache.get(fingerprint)!;
      return { ...cached, isCached: true };
    }

    // 2. Ensure Phase 3 Impact Engine results exist
    let impactResult = dataPackage.impactAnalysis;
    if (!impactResult) {
      impactResult = FinancialImpactEngine.evaluate(dataPackage);
      dataPackage.impactAnalysis = impactResult;
    }

    // 3. Build filtered, strictly verified AI Context (NO raw data dump)
    const aiContext = AIContextBuilder.buildContext(dataPackage, impactResult);

    // 4. Check for Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[AIAnalysisEngine] GEMINI_API_KEY not found. Using deterministic fallback synthesis.');
      const fallback = this.generateDeterministicFallback(dataPackage, impactResult, 'NO_API_KEY');
      fallback.guardrailReport = AIAnalysisGuardrail.audit(fallback, dataPackage, aiContext);
      this.memoryCache.set(fingerprint, fallback);
      await this.persistToSupabaseAsync(dataPackage, fallback);
      return fallback;
    }

    // 5. Call Gemini with fallback model chain & timeout
    try {
      const aiResult = await this.callGeminiWithFallback(aiContext, apiKey, options);

      // 6. Prohibited Advice Guardrail & Compliance Sanitization
      this.enforceComplianceGuardrail(aiResult);

      // 7. Phase 5: Independent AI Analysis Guardrail Audit
      const auditReport = AIAnalysisGuardrail.audit(aiResult, dataPackage, aiContext);
      aiResult.guardrailReport = auditReport;

      // 8. If Guardrail rejects output, trigger Deterministic Fallback safely
      if (auditReport.decision === 'REJECT') {
        const violationSummary = auditReport.violations.map(v => `${v.code}: ${v.message}`).join(' | ');
        console.warn(`[AIAnalysisEngine] AI analysis for ${symbol} REJECTED by Guardrail: ${violationSummary}. Switching to deterministic fallback.`);
        const fallback = this.generateDeterministicFallback(dataPackage, impactResult, `GUARDRAIL_REJECT: ${violationSummary}`);
        const fallbackAudit = AIAnalysisGuardrail.audit(fallback, dataPackage, aiContext);
        fallback.guardrailReport = fallbackAudit;
        this.memoryCache.set(fingerprint, fallback);
        await this.persistToSupabaseAsync(dataPackage, fallback);
        return fallback;
      }

      // 9. Store in memory cache
      this.memoryCache.set(fingerprint, aiResult);

      // 10. Persist into Supabase snapshot (status: ANALYZED)
      await this.persistToSupabaseAsync(dataPackage, aiResult);

      return aiResult;
    } catch (err: any) {
      console.error(`[AIAnalysisEngine] Gemini analysis failed for ${symbol}: ${err.message}. Falling back to deterministic analysis.`);
      const fallbackResult = this.generateDeterministicFallback(dataPackage, impactResult, err.message);
      fallbackResult.guardrailReport = AIAnalysisGuardrail.audit(fallbackResult, dataPackage, aiContext);
      this.memoryCache.set(fingerprint, fallbackResult);
      await this.persistToSupabaseAsync(dataPackage, fallbackResult);
      return fallbackResult;
    }
  }


  /**
   * Calls Gemini across the model fallback chain with strict timeout control
   */
  private static async callGeminiWithFallback(
    context: AIAnalysisContext,
    apiKey: string,
    options: AIAnalysisOptions
  ): Promise<AIAnalysisResult> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelsToTry = options.modelName ? [options.modelName, ...this.DEFAULT_MODELS] : this.DEFAULT_MODELS;
    const timeoutMs = options.timeoutMs ?? 30000;

    let lastError: Error | null = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: FINAI_ANALYSIS_SYSTEM_PROMPT,
          generationConfig: {
            temperature: 0.2, // Low temperature for high factual consistency
            topP: 0.8,
            maxOutputTokens: 2500,
            responseMimeType: 'application/json'
          }
        });

        const promptText = `Aşağıda Borsa İstanbul'da işlem gören ${context.symbol} (${context.companyName}) için doğrulanmış finansal veriler, aktarım kanalları ve nedensellik zincirleri yer almaktadır.\n\n` +
          `Lütfen System Prompt'taki katı kurallara (Bilanço Şelalesi, Etki Dengesi, Kesin Yön/Tavsiye Yasağı, Çelişkili Faktörler, Eğiticilik Notu) uyarak sadece istenen JSON şemasında analiz üret:\n\n` +
          JSON.stringify(context, null, 2);

        // Run with timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Gemini request timed out after ${timeoutMs}ms`)), timeoutMs);
        });

        const generatePromise = model.generateContent(promptText);
        const result = await Promise.race([generatePromise, timeoutPromise]);
        const responseText = result.response.text();

        // Parse and validate structured output
        const parsed = this.parseAndValidateResponse(responseText, context, modelName);
        return parsed;

      } catch (err: any) {
        lastError = err;
        console.warn(`[AIAnalysisEngine] Model ${modelName} failed (${err.message}). Trying fallback if available...`);
        // If 429 Quota or Model not found, proceed to next model in chain
        continue;
      }
    }

    throw lastError || new Error('All Gemini models in fallback chain failed.');
  }

  /**
   * Parses JSON response, validates required fields, and maps to AIAnalysisResult
   */
  private static parseAndValidateResponse(
    responseText: string,
    context: AIAnalysisContext,
    modelName: string
  ): AIAnalysisResult {
    let cleanJson = responseText.trim();

    // Strip markdown code block wrappers if present
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const data = JSON.parse(cleanJson);

    // Validate and coerce ImpactBalance
    let impactBalance: ImpactBalanceRating = 'Nötr';
    if (data.impactBalance === 'Pozitif' || data.impactBalance === 'Positive') {
      impactBalance = 'Pozitif';
    } else if (data.impactBalance === 'Negatif' || data.impactBalance === 'Negative') {
      impactBalance = 'Negatif';
    }

    return {
      symbol: context.symbol,
      companyName: context.companyName,
      generatedAt: new Date().toISOString(),
      modelUsed: modelName,
      promptVersion: FINAI_SYSTEM_PROMPT_VERSION,
      snapshotFingerprint: (context as any).snapshotFingerprint || 'LIVE',
      generalOverview: data.generalOverview || `${context.companyName} için finansal ve sektörel görünüm analizi.`,
      impactBalance,
      impactBalanceReasoning: data.impactBalanceReasoning || 'Baskın faktörler ve maliyet dengesi üzerinden değerlendirilmiştir.',
      keyFactors: Array.isArray(data.keyFactors) ? data.keyFactors : [],
      detailedCommentary: data.detailedCommentary || data.generalOverview || '',
      scenarios: {
        baseline: data.scenarios?.baseline || 'Mevcut operasyonel performansın devamı öngörülmektedir.',
        optimistic: data.scenarios?.optimistic || 'Maliyetlerin hafiflemesi kârlılık marjlarını destekleyebilir.',
        cautious: data.scenarios?.cautious || 'Finansman maliyetleri ve dışsal dalgalanmalar izlenmelidir.'
      },
      watchItems: Array.isArray(data.watchItems) ? data.watchItems : ['Bilanço nakit akım tablosu', 'Sektörel maliyet gelişmeleri'],
      educationalTakeaway: data.educationalTakeaway || 'Şirket analizlerinde operasyonel kârlılık ile finansman giderleri mutlaka birbirinden ayrı değerlendirilmelidir.',
      dataUncertainties: Array.isArray(data.dataUncertainties) ? data.dataUncertainties : context.unavailableDataPoints,
      sourceReferences: Array.isArray(data.sourceReferences) && data.sourceReferences.length > 0 
        ? data.sourceReferences 
        : [{ source: 'KAP & Finansal Tablolar', details: 'Doğrulanmış Kamuyu Aydınlatma Platformu verileri' }],
      isCached: false,
      rawResponse: process.env.NODE_ENV === 'development' ? cleanJson : undefined
    };
  }

  /**
   * Deterministic Fallback: Generates a high-quality, fully structured analysis
   * directly from the Impact Engine synthesis when Gemini is unavailable.
   */
  public static generateDeterministicFallback(
    pkg: AssembledDataPackage,
    impact: ImpactEngineResult,
    reason: string
  ): AIAnalysisResult {
    const symbol = pkg.symbol;
    const synth = impact.synthesisSummary;

    let balance: ImpactBalanceRating = 'Nötr';
    if (impact.dominantDrivers.length > impact.counterDrivers.length && impact.dominantDrivers.length > 0) {
      balance = 'Pozitif';
    } else if (impact.counterDrivers.length > impact.dominantDrivers.length && impact.counterDrivers.length > 0) {
      balance = 'Negatif';
    }

    const keyFactors = impact.evaluatedFactors.slice(0, 5).map(f => ({
      title: f.title,
      transmissionChannel: f.financialImpact.primaryChannel,
      direction: f.impactDirection === 'unknown' ? 'neutral' : f.impactDirection,
      causalExplanation: f.causeEffectChain.financialImplication,
      source: f.source
    }));

    return {
      symbol,
      companyName: pkg.companyName,
      generatedAt: new Date().toISOString(),
      modelUsed: `deterministic-fallback (${reason})`,
      promptVersion: FINAI_SYSTEM_PROMPT_VERSION,
      snapshotFingerprint: pkg.fingerprint,
      generalOverview: `${pkg.companyName} (${symbol}), ${pkg.sector} sektöründe faaliyet göstermekte olup mevcut finansal verileri ${balance.toLowerCase()} bir görünüm sergilemektedir.`,
      impactBalance: balance,
      impactBalanceReasoning: synth.primaryTension || `${synth.dominantForcesSummary} ile ${synth.counterForcesSummary} arasındaki denge.`,
      keyFactors,
      detailedCommentary: `FinAi Deterministik Analiz Özeti:\n\n` +
        `1. İtici Güçler: ${synth.dominantForcesSummary}\n` +
        `2. Baskı Unsurları: ${synth.counterForcesSummary}\n` +
        (synth.primaryTension ? `3. Temel Finansal Gerilim: ${synth.primaryTension}\n` : '') +
        `Bu değerlendirme, doğrulanmış bilanço kalemleri, sektörel akran medyanları ve kurumsal eylemlerin deterministik etki motoru analizine dayanmaktadır.`,
      scenarios: {
        baseline: 'Mevcut operasyonel kârlılık ve maliyet yapısının cari dengede devam etmesi.',
        optimistic: 'Maliyet baskılarının azalması ve sektör talebinin güçlü kalması halinde marjların desteklenmesi.',
        cautious: 'Finansman giderleri veya makro faktörlerin kârlılık marjlarını baskılaması riski.'
      },
      watchItems: [
        'Bir sonraki dönem bilanço ve nakit akım tablosu',
        'Operasyonel marjlar ile finansman giderleri arasındaki denge',
        'Sektörel maliyet ve döviz kuru hassasiyetleri'
      ],
      educationalTakeaway: 'Finansal analizde kâr rakamı tek başına yeterli bir gösterge değildir; kârın ne kadarının operasyonel faaliyetlerden, ne kadarının nakit olarak üretildiği birlikte incelenmelidir.',
      dataUncertainties: (pkg.dataQuality?.notes && pkg.dataQuality.notes.length > 0) ? pkg.dataQuality.notes : ['Eksik veri bulunmamaktadır.'],
      sourceReferences: (() => {
        if (pkg.standardProvenance && pkg.standardProvenance.length > 0) {
          return pkg.standardProvenance
            .filter(p => p.sourceStatus === 'VERIFIED')
            .map(p => ({
              source: p.sourceName,
              details: p.notes?.[0] || `${p.provider} (${p.tierLabelTr})`,
              url: p.url
            }));
        }
        return [
          { source: 'KAP & Finansal Tablolar', details: 'Doğrulanmış BIST Mali Veritabanı' },
          { source: 'Sektör Karşılaştırma Motoru', details: `${pkg.sector} akran medyanları` }
        ];
      })(),
      isCached: false
    };
  }

  /**
   * Safety Compliance Guardrail: Checks for prohibited investment advice terms
   */
  private static enforceComplianceGuardrail(result: AIAnalysisResult): void {
    const fullText = `${result.generalOverview} ${result.detailedCommentary} ${result.impactBalanceReasoning}`.toLowerCase();

    const prohibitedPatterns = [
      /\b(kesinlikle al|hedef fiyat:?\s*\d|portföyünüze ekleyin|kesin yükselecek|kesin düşecek|derhal sat)\b/i,
      /\b(yatırım tavsiyesidir|alım fırsatıdır|satış tavsiyesidir)\b/i
    ];

    for (const pattern of prohibitedPatterns) {
      if (pattern.test(fullText)) {
        console.warn(`[AIAnalysisEngine] Compliance warning: Detected prohibited pattern matching ${pattern}. Sanitizing result.`);
        result.detailedCommentary = result.detailedCommentary.replace(pattern, '[analitik bağlamda izlenmelidir]');
        result.generalOverview = result.generalOverview.replace(pattern, '[koşullu değerlendirme]');
      }
    }
  }

  /**
   * Asynchronously updates the snapshot status to ANALYZED in Supabase
   */
  private static async persistToSupabaseAsync(pkg: AssembledDataPackage, aiResult: AIAnalysisResult): Promise<void> {
    try {
      await AnalysisSnapshotService.attachAIAnalysis(
        pkg.fingerprint,
        aiResult,
        aiResult.guardrailReport?.decision,
        aiResult.guardrailReport
      );
    } catch (e: any) {
      console.warn(`[AIAnalysisEngine] Failed to persist AI analysis to Supabase: ${e.message}`);
    }
  }

  /**
   * Clears the in-memory cache (primarily for unit testing)
   */
  public static clearCache(): void {
    this.memoryCache.clear();
  }
}

/**
 * Helper class that compiles verified data into a structured context object for Gemini
 */
export class AIContextBuilder {
  public static buildContext(
    pkg: AssembledDataPackage,
    impact: ImpactEngineResult
  ): AIAnalysisContext {
    const mkt = pkg.marketData;
    const trends = pkg.historicalTrends;
    const unavailable: string[] = [];

    // 1. Waterfall Summary
    const revYoY = trends?.growthAnalysis?.metrics?.['revenue']?.latestYoY?.yoyGrowthRate ?? null;
    const grossMarginTrend = trends?.metricDirections?.['grossMargin'] ?? undefined;
    const ebitdaYoY = trends?.growthAnalysis?.metrics?.['ebitda']?.latestYoY?.yoyGrowthRate ?? null;
    const leverageTrend = trends?.metricDirections?.['debtToAssets'] ?? trends?.metricDirections?.['financialLeverage'] ?? undefined;
    const cfo = trends?.cashFlowTrends?.[0]?.operatingCashFlow ?? null;
    const fcf = trends?.cashFlowTrends?.[0]?.freeCashFlow ?? null;

    if (revYoY == null) unavailable.push('Yıllık hasılat büyüme verisi');
    if (fcf == null) unavailable.push('Serbest nakit akımı (FCF) verisi');
    if (!grossMarginTrend) unavailable.push('Brüt marj tarihsel eğilimi');

    // 2. Sector Comparisons
    const sectorComparisons = (pkg.sectorContext?.comparisons || []).slice(0, 4).map(c => ({
      metricName: c.name || c.key,
      companyValue: c.formattedCompanyValue || `${c.companyValue}`,
      sectorMedian: c.formattedSectorMedian || `${c.sectorMedian}`,
      difference: c.formattedDifference || `${c.difference}`,
      status: c.positionText || (c.difference != null && c.difference > 0 ? 'Sektör üzerinde' : 'Sektör altında')
    }));

    // 3. Dominant Positive Drivers (Top 3)
    const dominantPositiveDrivers = impact.dominantDrivers.slice(0, 3).map(d => ({
      title: d.title,
      channel: d.financialImpact.primaryChannel,
      explanation: d.explanation,
      causalChain: d.causeEffectChain.financialImplication,
      source: d.source
    }));

    // 4. Counter Negative Drivers (Top 3)
    const counterNegativeDrivers = impact.counterDrivers.slice(0, 3).map(d => ({
      title: d.title,
      channel: d.financialImpact.primaryChannel,
      explanation: d.explanation,
      causalChain: d.causeEffectChain.financialImplication,
      source: d.source
    }));

    // 5. Conflicting Tensions
    const conflictingTensions = impact.conflicts.map(c => ({
      category: c.category,
      summary: c.dialecticSummary,
      resolution: c.relativeResolution
    }));

    // 6. News Events
    const relevantNewsEvents = (pkg.relevantNews || []).slice(0, 2).map(n => ({
      title: n.title,
      channel: 'Piyasa Algısı / Operasyonel',
      direction: n.sentiment === 'bullish' ? 'positive' : (n.sentiment === 'bearish' ? 'negative' : 'neutral'),
      source: typeof n.source === 'string' ? n.source : ((n.source as any)?.name || 'Haber Akışı')
    }));

    // 7. Macro Transmissions
    const macroTransmissions = (pkg.relevantCalendarEvents || []).slice(0, 2).map(e => ({
      event: `${e.country} ${e.event}`,
      channel: 'FINANCING_COST',
      direction: 'neutral'
    }));

    // 8. Dividend Capacity
    const histCount = pkg.corporateActions?.historicalDividendsCount || 0;
    const dividendCapacity = {
      hasHistory: histCount > 0,
      count: histCount,
      description: histCount > 0
        ? `Şirketin ${histCount} adet kayıtlı temettü dağıtımı bulunmaktadır.`
        : 'Düzenli temettü dağıtım geçmişi bulunmamaktadır.'
    };

    // 9. Commodity & FX Exposure
    const exposure = pkg.fxCommodityExposure;
    const commodityFxExposure = {
      type: exposure?.exposureType || 'BALANCED',
      usdTry: exposure?.usdTry ?? null,
      brentPetrol: exposure?.brentPetrol ?? null,
      notes: exposure?.exposureNotes || []
    };

    // 10. KAP Status
    const kapStatus = {
      hasExactProfile: pkg.kapContext?.hasExactProfile ?? false,
      url: pkg.kapContext?.kapProfileUrl ?? null
    };

    // 11. Data Quality & Freshness
    const dataQualityAndFreshness = {
      rating: pkg.dataQuality?.status || 'VALID',
      priceDate: pkg.dataFreshness?.priceDate || null,
      financialPeriodEnd: pkg.dataFreshness?.financialPeriodEnd || null,
      staleReasons: pkg.dataFreshness?.staleReasons || []
    };

    return {
      symbol: pkg.symbol,
      companyName: pkg.companyName,
      sector: pkg.sector,
      priceContext: {
        price: mkt.currentPrice,
        currency: mkt.currency || 'TRY',
        changePercent: mkt.changePercent,
        high52w: mkt.high52w,
        low52w: mkt.low52w
      },
      waterfallSummary: {
        revenueYoY: revYoY,
        grossMarginTrend,
        ebitdaYoY,
        leverageTrend,
        operatingCashFlow: cfo,
        freeCashFlow: fcf
      },
      sectorComparisons,
      dominantPositiveDrivers,
      counterNegativeDrivers,
      conflictingTensions,
      relevantNewsEvents,
      macroTransmissions,
      dividendCapacity,
      commodityFxExposure,
      kapStatus,
      dataQualityAndFreshness,
      unavailableDataPoints: unavailable
    };
  }
}
