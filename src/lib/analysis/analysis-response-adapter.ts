/**
 * FinAi Analysis System - Phase 6
 * Analysis Response Adapter
 * 
 * Transforms internal multi-phase engine results (Data Package, Impact Engine,
 * AI Analysis, Guardrail, Snapshot) into a clean, strictly typed, and
 * presentation-ready response for the UI.
 */

import {
  AssembledDataPackage,
  ImpactEngineResult,
  AIAnalysisResult,
  FinAiAnalysisResponse,
  UIFactorDetail,
  UIUpcomingEvent,
  ImpactTransmissionChannel,
  StandardProvenanceItem,
  ProvenanceAuditPackage
} from './types';

export class AnalysisResponseAdapter {
  private static readonly CHANNEL_TITLES_TR: Record<ImpactTransmissionChannel, string> = {
    REVENUE: 'Hasılat & Satış Talebi',
    GROSS_MARGIN: 'Brüt Kârlılık & Girdi Maliyetleri',
    OPERATING_PROFIT: 'Faaliyet Kârı (FAVÖK)',
    FINANCING_COST: 'Finansman Maliyeti & Borç Yükü',
    FX_GAIN_LOSS: 'Döviz Pozisyonu & Kur Hassasiyeti',
    TAX: 'Vergi & Yatırım Teşvikleri',
    ONE_OFF: 'Tek Seferlik Gelir/Giderler',
    NET_INCOME: 'Net Kârlılık & Dönem Sonucu',
    CASH_FLOW: 'Nakit Akımı & İşletme Sermayesi',
    BALANCE_SHEET: 'Bilanço Sağlığı & Varlıklar',
    CAPITAL_STRUCTURE: 'Sermaye Yapısı & Özkaynaklar',
    SECTOR_COMPETITION: 'Sektörel Rekabet & Pazar Payı',
    VALUATION_MULTIPLE: 'Çarpan Değerlemesi & Akran Durumu',
    MARKET_SENTIMENT: 'Piyasa Algısı & Kurumsal Eylemler'
  };

  /**
   * Adapts raw pipeline outputs into the public FinAiAnalysisResponse format
   */
  public static adapt(
    pkg: AssembledDataPackage,
    impact: ImpactEngineResult,
    aiResult: AIAnalysisResult
  ): FinAiAnalysisResponse {
    const mkt = pkg.marketData;

    // 1. Channel Title Resolver
    const getChannelTitle = (ch: ImpactTransmissionChannel): string => {
      return this.CHANNEL_TITLES_TR[ch] || 'Operasyonel & Finansal Etki';
    };

    // 2. Map Evaluated Factors to UI Details
    const mapFactor = (f: any): UIFactorDetail => {
      const chain: string[] = [];
      if (f.causeEffectChain?.directTransmission) chain.push(f.causeEffectChain.directTransmission);
      if (f.causeEffectChain?.financialImplication) chain.push(f.causeEffectChain.financialImplication);

      return {
        id: f.id,
        title: f.title,
        channel: f.financialImpact.primaryChannel,
        channelTitleTr: getChannelTitle(f.financialImpact.primaryChannel),
        direction: f.impactDirection === 'unknown' ? 'neutral' : f.impactDirection,
        magnitude: f.magnitude,
        causalExplanation: f.causeEffectChain?.financialImplication || f.explanation || f.title,
        causeEffectChain: chain.length > 0 ? chain : undefined,
        source: f.source,
        sourceUrl: f.sourceUrl,
        reliabilityScore: f.sourceReliability,
        verified: true,
        sourceStatus: f.sourceStatus || 'VERIFIED',
        primaryProvenanceId: f.primaryProvenanceId,
        verificationBasis: f.verificationBasis
      };
    };

    const positiveFactors: UIFactorDetail[] = [];
    const negativeFactors: UIFactorDetail[] = [];
    const neutralFactors: UIFactorDetail[] = [];

    for (const factor of impact.evaluatedFactors) {
      const uiFactor = mapFactor(factor);
      if (uiFactor.direction === 'positive') {
        positiveFactors.push(uiFactor);
      } else if (uiFactor.direction === 'negative') {
        negativeFactors.push(uiFactor);
      } else {
        neutralFactors.push(uiFactor);
      }
    }

    const allFactors = [...positiveFactors, ...negativeFactors, ...neutralFactors];

    // 3. Map Upcoming Events (Real calendar & corporate data only)
    const upcomingEvents: UIUpcomingEvent[] = [];

    // Macro calendar events (High priority & company-relevant only)
    for (const evt of pkg.relevantCalendarEvents || []) {
      upcomingEvents.push({
        title: `${evt.country} - ${evt.event}`,
        category: 'CALENDAR',
        date: evt.time || 'Yaklaşan Dönem',
        impactChannel: 'Finansman Maliyeti & Enflasyon',
        impact: 'Sektörel faiz ve talep dinamiklerini etkileyebilecek makro gösterge.',
        source: 'Ekonomik Takvim',
        relevanceExplanation: `Sektörel faiz ve talep dinamiklerini etkileyebilecek makro gösterge.`
      });
    }

    // Dividends / Corporate actions
    if (pkg.corporateActions?.upcomingDividends && pkg.corporateActions.upcomingDividends.length > 0) {
      for (const div of pkg.corporateActions.upcomingDividends) {
        upcomingEvents.push({
          title: `Nakit Temettü Dağıtımı (${div.netAmountPerShare} ₺ / Pay)`,
          category: 'DIVIDEND',
          date: div.paymentDate || 'Belirlenen Tarih',
          impactChannel: 'Nakit Akımı & Sermaye Dağıtımı',
          impact: 'Şirketin onaylanmış nakit kâr payı dağıtım takvimi.',
          source: 'KAP Temettü',
          relevanceExplanation: `Şirketin onaylanmış nakit kâr payı dağıtım takvimi.`
        });
      }
    }

    // Peer comparison summary
    const peerComparison = pkg.sectorContext ? {
      summary: `${pkg.symbol}, ${pkg.sector} sektöründeki benzer ölçekli şirketler arasında operasyonel göstergeleriyle karşılaştırılmaktadır.`,
      metrics: (pkg.sectorContext.comparisons || []).slice(0, 5).map((m: any) => ({
        name: m.metricName || m.metric || 'Metrik',
        companyValue: m.companyValue ?? null,
        sectorAvg: m.sectorAverage ?? m.sectorAvg ?? null
      }))
    } : undefined;

    // 4. Synthesize 4 Core Narrative Dimensions (Fluid prose, zero fragmentation)
    const synth = impact.synthesisSummary;
    const whatIsHappening = aiResult.generalOverview || 
      `${pkg.companyName} (${pkg.symbol}), ${pkg.sector} sektöründeki operasyonlarını sürdürürken mevcut finansal tablolarında belirgin bir dönemsel dinamizm sergilemektedir.`;

    const whyItMatters = `Operasyonel faaliyetlerden üretilen nakit gücü ve hasılat büyümesi, şirketin sermaye maliyetini karşılama kapasitesini doğrudan belirlemektedir. ${synth.dominantForcesSummary}`;

    const factorsAtPlay = `${synth.dominantForcesSummary} ${synth.counterForcesSummary} ${synth.primaryTension ? `Bununla birlikte, ${synth.primaryTension}` : ''}`.trim();

    const whatCouldChange = `Temel senaryoda ${aiResult.scenarios.baseline.toLowerCase()} Öte yandan, ${aiResult.scenarios.cautious.toLowerCase()} Olası iyileşme kanallarında ise ${aiResult.scenarios.optimistic.toLowerCase()}`;

    // 5. Build Final Response Object
    return {
      success: true,
      symbol: pkg.symbol,
      companyName: pkg.companyName,
      sector: pkg.sector,

      currentPrice: mkt.currentPrice,
      currency: mkt.currency || '₺',
      priceDate: pkg.dataFreshness?.priceDate || new Date().toISOString(),
      changePercent: mkt.changePercent ?? undefined,
      high52w: mkt.high52w ?? undefined,
      low52w: mkt.low52w ?? undefined,

      impactBalance: aiResult.impactBalance,
      impactBalanceReasoning: aiResult.impactBalanceReasoning,

      generalOverview: aiResult.generalOverview,
      detailedCommentary: aiResult.detailedCommentary,
      educationalTakeaway: aiResult.educationalTakeaway,

      narrativeSections: {
        whatIsHappening,
        whyItMatters,
        factorsAtPlay,
        whatCouldChange
      },

      positiveFactors,
      negativeFactors,
      neutralFactors,
      allFactors,

      conflictingTensions: impact.conflicts.map(c => ({
        category: c.category,
        summary: c.dialecticSummary,
        resolution: c.relativeResolution
      })),

      scenarios: aiResult.scenarios,
      watchItems: aiResult.watchItems,
      upcomingEvents: upcomingEvents.slice(0, 5),

      peerComparison,

      dataQualityRating: pkg.dataQuality?.status || 'VALID',
      confidenceScore: undefined,
      dataFreshnessNotes: pkg.dataFreshness?.staleReasons || [],
      unavailableDataPoints: aiResult.dataUncertainties || [],
      snapshotAgeMinutes: 0,

      sourceReferences: aiResult.sourceReferences || [],
      provenance: (() => {
        const sources = new Set<string>();
        if (pkg.standardProvenance && pkg.standardProvenance.length > 0) {
          pkg.standardProvenance.forEach(p => {
            if (p.sourceName) sources.add(p.sourceName);
          });
        } else if (pkg.provenance) {
          Object.values(pkg.provenance).forEach(p => {
            if (p.provider) sources.add(p.provider);
            else if (p.source) sources.add(p.source);
          });
        }
        if (aiResult.sourceReferences && Array.isArray(aiResult.sourceReferences)) {
          aiResult.sourceReferences.forEach(s => {
            if (s.source) sources.add(s.source);
          });
        }
        if (pkg.kapContext?.hasExactProfile) {
          sources.add('KAP Kamuyu Aydınlatma Platformu');
        }
        return Array.from(sources);
      })(),
      standardProvenance: pkg.standardProvenance,
      provenancePackage: pkg.provenancePackage,

      guardrail: {
        decision: aiResult.guardrailReport?.decision || 'PASS',
        isPublishable: aiResult.guardrailReport?.isPublishable ?? true,
        violationsCount: aiResult.guardrailReport?.violations?.length || 0,
        warningsCount: aiResult.guardrailReport?.warnings?.length || 0,
        warnings: aiResult.guardrailReport?.warnings || [],
        validatedClaimsCount: aiResult.guardrailReport?.validatedClaims?.length || 0
      },

      qualityEvaluation: (aiResult as any).qualityEvaluation,

      snapshot: {
        fingerprint: pkg.fingerprint,
        status: 'ANALYZED',
        generatedAt: aiResult.generatedAt,
        modelUsed: aiResult.modelUsed,
        isCached: aiResult.isCached
      }
    };
  }
}
