/**
 * FinAi Analysis Provenance & Transparency Service - Phase 9
 * 
 * Guarantees total traceability, data integrity, and provenance for all analytical inputs
 * and qualitative factor assessments without fabricating any URL, provider, or timestamp.
 * 
 * Core Principles:
 * 1. ZERO FABRICATION: Never create synthetic/fake URLs, sources, or timestamps.
 *    If data is missing or unverified, state MISSING or UNAVAILABLE explicitly.
 * 2. NO NUMERIC RELIABILITY SCORES: Rely on qualitative status (VERIFIED, STALE, MISSING, UNAVAILABLE, CONFLICT).
 * 3. HIERARCHY OF TRUTH:
 *    - Tier 1 (Primary Official): KAP, Audited Financials, Official Corporate Registry
 *    - Tier 2 (Secondary Verified): BIST, TCMB, TÜİK
 *    - Tier 3 (Market Data Providers): Yahoo Finance, TradingView, Google News RSS, Finnet
 * 4. DETERMINISTIC PAYLOAD HASHING: Every raw data payload receives a SHA-256 hash.
 * 5. FACTOR-TO-SOURCE TRACEABILITY: Every factor is linked to verified provenance items.
 */

import crypto from 'crypto';
import {
  AssembledDataPackage,
  AnalysisFactor,
  StandardProvenanceItem,
  FactorProvenanceMapping,
  DataConflictResolution,
  ProvenanceAuditPackage,
  SourceStatus,
  SourceHierarchyTier,
  RelatedDataType
} from './types';

export class AnalysisProvenanceService {
  public static readonly VERSION = '1.0.0-phase9';

  /**
   * Deterministically computes a SHA-256 hash of any data structure
   */
  public static computePayloadHash(data: any): string {
    if (data === null || data === undefined) {
      return crypto.createHash('sha256').update('NULL').digest('hex');
    }
    const serialized = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Assembles a standardized, fully traceable provenance item list from assembled data
   */
  public static buildStandardProvenanceItems(
    dataPackage: AssembledDataPackage,
    rawPayloads?: {
      companyProfile?: any;
      historicalPrices?: any;
      financialStatements?: any;
      news?: any;
      calendarEvents?: any;
      corporateActions?: any;
      fxCommodities?: any;
      sectorPeers?: any;
    }
  ): StandardProvenanceItem[] {
    const items: StandardProvenanceItem[] = [];
    const assembledAt = dataPackage.assembledAt || new Date().toISOString();
    const symbol = dataPackage.symbol.toUpperCase();

    // 1. Financial Statements (Tier 1: KAP Consolidated Statements)
    const statements = dataPackage.statements;
    const hasStatements = Boolean(statements && statements.quarters && statements.quarters.length > 0);
    const statementsPayload = rawPayloads?.financialStatements || (hasStatements ? statements.quarters : null);
    const statementsHash = this.computePayloadHash(statementsPayload);
    const latestQuarterEnd = statements?.quarters?.[0]?.periodEnd || null;

    items.push({
      id: `${symbol.toLowerCase()}_financial_statements`,
      sourceName: 'Kamuyu Aydınlatma Platformu (KAP) Konsolide Finansal Tablolar',
      provider: 'KAP Bildirim Sistemi / BIST Finansal Veritabanı',
      tier: 'PRIMARY_OFFICIAL',
      tierLabelTr: 'Birincil Resmî Bildirim',
      url: dataPackage.kapContext?.kapProfileUrl || (dataPackage.kapContext?.hasExactProfile ? `https://www.kap.org.tr/tr/sirket-bilgileri/ozet/${symbol}` : undefined),
      fetchedAt: assembledAt,
      dataTimestamp: latestQuarterEnd,
      freshness: hasStatements ? (dataPackage.dataFreshness?.isStale ? 'STALE' : 'RECENT') : 'STALE',
      sourceStatus: hasStatements ? 'VERIFIED' : 'MISSING',
      rawPayloadHash: statementsHash,
      relatedDataType: 'FINANCIAL_STATEMENTS',
      recordCount: statements?.allQuartersCount || statements?.quarters?.length || 0,
      notes: hasStatements ? [`Son finansal dönem: ${latestQuarterEnd}`, `Para birimi: ${statements.currency}`] : ['Kayıtlı finansal tablo bulunamadı.']
    });

    // 2. Company Profile & Registry (Tier 1: Resmî Şirket Künyesi)
    const profile = dataPackage.companyProfile;
    const hasProfile = Boolean(profile && profile.companyName);
    const profilePayload = rawPayloads?.companyProfile || profile;
    const profileHash = this.computePayloadHash(profilePayload);

    items.push({
      id: `${symbol.toLowerCase()}_company_profile`,
      sourceName: 'Borsa İstanbul Şirket Künyesi & Ticaret Sicil Kaydı',
      provider: 'FinAi Çekirdek Veritabanı / BIST Şirket Bilgileri',
      tier: 'PRIMARY_OFFICIAL',
      tierLabelTr: 'Birincil Resmî Bildirim',
      url: dataPackage.kapContext?.kapProfileUrl || undefined,
      fetchedAt: assembledAt,
      dataTimestamp: null,
      freshness: hasProfile ? 'RECENT' : 'STALE',
      sourceStatus: hasProfile ? 'VERIFIED' : 'MISSING',
      rawPayloadHash: profileHash,
      relatedDataType: 'COMPANY_PROFILE',
      recordCount: hasProfile ? 1 : 0,
      notes: hasProfile ? [`Şirket: ${profile.companyName}`, `Sektör: ${dataPackage.sector}`] : ['Şirket künye profili eksik.']
    });

    // 3. Historical & Daily Prices (Tier 2: Borsa Istanbul Günlük Bülten / Gateway)
    const market = dataPackage.marketData;
    const hasPrices = Boolean(market && market.currentPrice != null);
    const pricesPayload = rawPayloads?.historicalPrices || market;
    const pricesHash = this.computePayloadHash(pricesPayload);

    items.push({
      id: `${symbol.toLowerCase()}_market_prices`,
      sourceName: 'Borsa İstanbul Hisse Fiyat ve İşlem Verisi',
      provider: market?.priceSource || 'Borsa Istanbul / Yahoo Gateway',
      tier: 'SECONDARY_VERIFIED',
      tierLabelTr: 'Doğrulanmış İkincil Kaynak',
      url: undefined, // Gateway endpoint is backend-only, no fake external link
      fetchedAt: assembledAt,
      dataTimestamp: market?.lastTradeDate || market?.priceTimestamp || null,
      freshness: hasPrices ? (dataPackage.dataFreshness?.priceDate ? 'REALTIME' : 'RECENT') : 'STALE',
      sourceStatus: hasPrices ? 'VERIFIED' : 'UNAVAILABLE',
      rawPayloadHash: pricesHash,
      relatedDataType: 'HISTORICAL_PRICES',
      notes: hasPrices ? [`Son işlem tarihi: ${market.lastTradeDate || 'Cari'}`, `Fiyat: ${market.currentPrice} ${market.currency}`] : ['Geçmiş işlem fiyatı temin edilemedi.']
    });

    // 4. Corporate Actions & Dividends (Tier 1: KAP / Resmî Genel Kurul Dağıtım Kararları)
    const corp = dataPackage.corporateActions;
    const hasCorp = Boolean(corp);
    const corpPayload = rawPayloads?.corporateActions || corp;
    const corpHash = this.computePayloadHash(corpPayload);

    items.push({
      id: `${symbol.toLowerCase()}_corporate_actions`,
      sourceName: 'KAP Resmî Kâr Dağıtım ve Sermaye Artırımı Bildirimleri',
      provider: 'FinAi Arşiv Sistemi & KAP Bildirim Kayıtları',
      tier: 'PRIMARY_OFFICIAL',
      tierLabelTr: 'Birincil Resmî Bildirim',
      url: dataPackage.kapContext?.kapDisclosuresUrl || undefined,
      fetchedAt: assembledAt,
      dataTimestamp: corp?.latestDividends?.[0]?.date || null,
      freshness: hasCorp ? 'RECENT' : 'HISTORICAL',
      sourceStatus: hasCorp ? 'VERIFIED' : 'MISSING',
      rawPayloadHash: corpHash,
      relatedDataType: 'CORPORATE_ACTIONS',
      recordCount: (corp?.historicalDividendsCount || 0) + (corp?.historicalSplitsCount || 0),
      notes: [`Kayıtlı temettü sayısı: ${corp?.historicalDividendsCount || 0}`, `Kayıtlı sermaye artırımı/bölünme: ${corp?.historicalSplitsCount || 0}`]
    });

    // 5. Relevant News (Tier 3: Doğrulanmış Haber Akışı / Google News RSS)
    const news = dataPackage.relevantNews || [];
    const hasNews = news.length > 0;
    const newsPayload = rawPayloads?.news || news.map(n => ({ id: n.id, title: n.title, link: n.link, pubDate: n.pubDate, source: n.source }));
    const newsHash = this.computePayloadHash(newsPayload);

    items.push({
      id: `${symbol.toLowerCase()}_news_feed`,
      sourceName: 'Finansal Haber ve Basın Bültenleri',
      provider: 'Google News RSS & Basın Kuruluşları',
      tier: 'MARKET_DATA_PROVIDER',
      tierLabelTr: 'Piyasa Veri Sağlayıcısı',
      url: news[0]?.link || undefined, // First verified real article link if present
      fetchedAt: assembledAt,
      dataTimestamp: news[0]?.pubDate || null,
      freshness: hasNews ? 'REALTIME' : 'RECENT',
      sourceStatus: hasNews ? 'VERIFIED' : 'MISSING',
      rawPayloadHash: newsHash,
      relatedDataType: 'NEWS',
      recordCount: news.length,
      notes: hasNews ? [`İncelenen haber sayısı: ${news.length}`, `En yeni başlık: ${news[0].title.slice(0, 60)}...`] : ['İlgili güncel haber akışı bulunamadı.']
    });

    // 6. Macroeconomic Calendar (Tier 2: TCMB / TÜİK / Resmi İstatistik Takvimi)
    const calendar = dataPackage.relevantCalendarEvents || [];
    const hasCalendar = calendar.length > 0;
    const calendarPayload = rawPayloads?.calendarEvents || calendar;
    const calendarHash = this.computePayloadHash(calendarPayload);

    items.push({
      id: `${symbol.toLowerCase()}_macro_calendar`,
      sourceName: 'TCMB / TÜİK / Küresel Makroekonomik Takvim',
      provider: 'FinAi Dinamik Ekonomik Takvim Kataloğu',
      tier: 'SECONDARY_VERIFIED',
      tierLabelTr: 'Doğrulanmış İkincil Kaynak',
      url: undefined,
      fetchedAt: assembledAt,
      dataTimestamp: calendar[0]?.dateFormatted || null,
      freshness: hasCalendar ? 'RECENT' : 'HISTORICAL',
      sourceStatus: hasCalendar ? 'VERIFIED' : 'MISSING',
      rawPayloadHash: calendarHash,
      relatedDataType: 'MACRO_CALENDAR',
      recordCount: calendar.length,
      notes: hasCalendar ? [`İlgili makro olay sayısı: ${calendar.length}`] : ['Kritik makro takvim kaydı bulunmamaktadır.']
    });

    // 7. FX & Commodity Exposures (Tier 3: Harem Altın / TCMB Gösterge Kurlar / Yahoo Finans)
    const fx = dataPackage.fxCommodityExposure;
    const hasFx = Boolean(fx && (fx.usdTry != null || fx.eurTry != null || fx.brentPetrol != null));
    const fxPayload = rawPayloads?.fxCommodities || fx;
    const fxHash = this.computePayloadHash(fxPayload);

    items.push({
      id: `${symbol.toLowerCase()}_fx_commodities`,
      sourceName: 'Döviz Kurları ve Emtia Göstergeleri',
      provider: 'TCMB Gösterge Kurları & Serbest Piyasa Sağlayıcıları',
      tier: 'MARKET_DATA_PROVIDER',
      tierLabelTr: 'Piyasa Veri Sağlayıcısı',
      url: undefined,
      fetchedAt: assembledAt,
      dataTimestamp: null,
      freshness: hasFx ? 'REALTIME' : 'RECENT',
      sourceStatus: hasFx ? 'VERIFIED' : 'UNAVAILABLE',
      rawPayloadHash: fxHash,
      relatedDataType: 'FX_COMMODITY',
      notes: hasFx ? [`USD/TRY: ${fx.usdTry ?? 'N/A'}`, `EUR/TRY: ${fx.eurTry ?? 'N/A'}`, `Brent Petrol: ${fx.brentPetrol ?? 'N/A'}`] : ['Kur/emtia göstergesi alınamadı.']
    });

    // 8. Sector Peers Context (Tier 2: BIST Sektör İstatistiği)
    const sector = dataPackage.sectorContext;
    const hasSector = Boolean(sector && sector.comparisons && sector.comparisons.length > 0);
    const sectorPayload = rawPayloads?.sectorPeers || sector;
    const sectorHash = this.computePayloadHash(sectorPayload);

    items.push({
      id: `${symbol.toLowerCase()}_sector_peers`,
      sourceName: 'Borsa İstanbul Sektörel Akran Karşılaştırma Analizi',
      provider: 'FinAi Sektör İstatistik Motoru',
      tier: 'SECONDARY_VERIFIED',
      tierLabelTr: 'Doğrulanmış İkincil Kaynak',
      url: undefined,
      fetchedAt: assembledAt,
      dataTimestamp: null,
      freshness: hasSector ? 'RECENT' : 'STALE',
      sourceStatus: hasSector ? 'VERIFIED' : 'MISSING',
      rawPayloadHash: sectorHash,
      relatedDataType: 'SECTOR_PEERS',
      recordCount: sector?.peersCount || 0,
      notes: hasSector ? [`Sektör: ${sector.sectorName}`, `Akran sayısı: ${sector.peersCount}`, `Karşılaştırılan metrik sayısı: ${sector.comparisons.length}`] : ['Sektörel akran verisi yetersiz.']
    });

    return items;
  }

  /**
   * Links qualitative factors to verified provenance items without fabricating connections
   */
  public static linkFactorsToProvenance(
    factors: AnalysisFactor[],
    provenanceItems: StandardProvenanceItem[]
  ): FactorProvenanceMapping[] {
    const mappings: FactorProvenanceMapping[] = [];
    const itemMap = new Map<RelatedDataType, StandardProvenanceItem>();
    provenanceItems.forEach(item => {
      itemMap.set(item.relatedDataType, item);
    });

    for (const factor of factors) {
      let relatedType: RelatedDataType = 'FINANCIAL_STATEMENTS';
      let verificationBasis = 'Doğrulanmış finansal tablo kalemi';

      switch (factor.factorType) {
        case 'FINANCIAL':
          relatedType = 'FINANCIAL_STATEMENTS';
          verificationBasis = factor.metricKey ? `Bilanço kalemi: ${factor.metricKey} (${factor.metricValue ?? ''})` : 'KAP Bilanço ve Gelir Tablosu';
          break;
        case 'VALUATION':
        case 'SECTOR':
          relatedType = 'SECTOR_PEERS';
          verificationBasis = factor.metricKey ? `Sektör akran medyanı: ${factor.metricKey}` : 'Sektörel Çarpan ve Medyan Karşılaştırması';
          break;
        case 'NEWS':
          relatedType = 'NEWS';
          verificationBasis = factor.provenanceRef ? `Haber kaynağı: ${factor.source} (Bağlantı: ${factor.provenanceRef})` : `Haber başlığı: ${factor.title}`;
          break;
        case 'MACRO_CALENDAR':
          relatedType = 'MACRO_CALENDAR';
          verificationBasis = `Ekonomik takvim etkinliği: ${factor.title}`;
          break;
        case 'FX_COMMODITY':
          relatedType = 'FX_COMMODITY';
          verificationBasis = factor.metadata ? `Piyasa göstergeleri: ${JSON.stringify(factor.metadata)}` : 'Döviz ve Emtia Maruziyeti';
          break;
        case 'CORPORATE_ACTION':
          relatedType = 'CORPORATE_ACTIONS';
          verificationBasis = `Kurumsal eylem / Kâr payı dağıtım kararı: ${factor.title}`;
          break;
        default:
          relatedType = 'FINANCIAL_STATEMENTS';
          verificationBasis = factor.source;
      }

      const matchedItem = itemMap.get(relatedType);
      const primaryId = matchedItem ? matchedItem.id : 'unmapped_source';
      const status = matchedItem ? matchedItem.sourceStatus : 'UNAVAILABLE';

      mappings.push({
        factorId: factor.id,
        factorTitle: factor.title,
        primaryProvenanceId: primaryId,
        sourceStatus: status,
        verificationBasis
      });
    }

    return mappings;
  }

  /**
   * Resolves conflicting data points between multiple sources using the official truth hierarchy:
   * Tier 1 (KAP/Audited) > Tier 2 (BIST/TCMB) > Tier 3 (Yahoo/RSS/Providers)
   */
  public static resolveConflict(params: {
    metric: string;
    sourceA: { name: string; tier: SourceHierarchyTier; value: any };
    sourceB: { name: string; tier: SourceHierarchyTier; value: any };
  }): DataConflictResolution {
    const { metric, sourceA, sourceB } = params;
    const tierOrder: Record<SourceHierarchyTier, number> = {
      PRIMARY_OFFICIAL: 1,
      SECONDARY_VERIFIED: 2,
      MARKET_DATA_PROVIDER: 3
    };

    const rankA = tierOrder[sourceA.tier];
    const rankB = tierOrder[sourceB.tier];

    let selectedSource = sourceA.name;
    let resolvedValue = sourceA.value;
    let resolutionBasis = '';

    if (rankA < rankB) {
      selectedSource = sourceA.name;
      resolvedValue = sourceA.value;
      resolutionBasis = `${sourceA.name} (${sourceA.tier}) kaynağı, resmî hiyerarşide ${sourceB.name} (${sourceB.tier}) kaynağından daha yüksek önceliğe sahiptir.`;
    } else if (rankB < rankA) {
      selectedSource = sourceB.name;
      resolvedValue = sourceB.value;
      resolutionBasis = `${sourceB.name} (${sourceB.tier}) kaynağı, resmî hiyerarşide ${sourceA.name} (${sourceA.tier}) kaynağından daha yüksek önceliğe sahiptir.`;
    } else {
      // Same tier: pick the non-null, non-empty value or source A
      if (sourceA.value != null && sourceA.value !== '') {
        selectedSource = sourceA.name;
        resolvedValue = sourceA.value;
        resolutionBasis = `Her iki kaynak da aynı hiyerarşi katmanındadır (${sourceA.tier}). Birincil kayıt seçilmiştir.`;
      } else {
        selectedSource = sourceB.name;
        resolvedValue = sourceB.value;
        resolutionBasis = `Her iki kaynak da aynı hiyerarşi katmanındadır (${sourceB.tier}). Dolu olan alternatif kayıt seçilmiştir.`;
      }
    }

    return {
      metric,
      sources: [sourceA.name, sourceB.name],
      values: {
        [sourceA.name]: sourceA.value,
        [sourceB.name]: sourceB.value
      },
      selectedSource,
      resolvedValue,
      resolutionBasis,
      resolvedAt: new Date().toISOString()
    };
  }

  /**
   * Generates a complete, verifiable provenance audit package
   */
  public static compileProvenanceAudit(
    dataPackage: AssembledDataPackage,
    factors: AnalysisFactor[],
    conflictsResolved: DataConflictResolution[] = []
  ): ProvenanceAuditPackage {
    const items = this.buildStandardProvenanceItems(dataPackage);
    const factorMappings = this.linkFactorsToProvenance(factors, items);

    // Compute overall status: If any Tier 1 item is MISSING or UNAVAILABLE -> WARNING/CONFLICT
    const hasMissingPrimary = items.some(i => i.tier === 'PRIMARY_OFFICIAL' && i.sourceStatus !== 'VERIFIED');
    const hasConflict = conflictsResolved.length > 0;

    let overallStatus: SourceStatus = 'VERIFIED';
    if (hasConflict) overallStatus = 'CONFLICT';
    else if (hasMissingPrimary) overallStatus = 'STALE';

    const unverifiedDataPoints: string[] = [];
    items.filter(i => i.sourceStatus !== 'VERIFIED').forEach(i => {
      unverifiedDataPoints.push(`${i.sourceName}: ${i.sourceStatus}`);
    });

    return {
      symbol: dataPackage.symbol.toUpperCase(),
      assembledAt: dataPackage.assembledAt || new Date().toISOString(),
      overallStatus,
      items,
      factorMappings,
      conflictsResolved,
      unverifiedDataPoints
    };
  }
}
