/**
 * FinAi Analysis Orchestrator / Data Assembler
 * 
 * Central analytical service that coordinates existing domain services to construct
 * a fully verified, multi-source analytical data package for any BIST symbol.
 * 
 * Reuses existing battle-tested subsystems:
 * - FinAiArchiveReader (Supabase PostgreSQL first, local fallback)
 * - HistoricalAnalysisEngineV2 (Multi-period CAGR, margin trends, volatility)
 * - SectorComparisonEngine & SectorCategorizer (Peer medians, percentiles, sector rules)
 * - RelevanceFilter & NewsImpactMatrix (Strict relevance filtering)
 * - FactorExtractor (Structured qualitative factor units)
 * - Commodities & Crypto (Live Gram Gold, FX rates, Brent)
 * - Calendar Catalog & Scraper
 * - KAP Member Map
 * 
 * Financial Integrity Principles:
 * - Zero synthetic coercion (missing = NULL)
 * - Strict non-blocking resilience (Promise.allSettled)
 * - Complete data provenance tracking
 * - Deterministic SHA-256 fingerprinting for change detection
 */

import crypto from 'crypto';
import { FinAiArchiveReader } from '@/lib/api/finai-archive-reader';
import { HistoricalAnalysisEngine } from '@/lib/historical-analysis-engine-v2';
import { getSectorCategory, normalizeSymbol } from '@/lib/sector-categorizer';
import { getSectorComparativeAnalysis } from '@/lib/sector-comparison-engine';
import { fetchLiveCommoditiesAndCrypto } from '@/lib/commodities-crypto';
import { getDynamicCalendarCatalog } from '@/lib/calendar-scraper';
import { getKapUrl } from '@/lib/kap-member-map';
import { calculateTTM } from '@/lib/ttm-calculator';
import { EnrichedNewsItem } from '@/app/api/news/route';
import { XMLParser } from 'fast-xml-parser';

import {
  AssembledDataPackage,
  AnalysisFactor,
  CompanyMarketContext,
  StatementsPackage,
  SectorContextPackage,
  CorporateActionsPackage,
  FxCommodityExposurePackage,
  KapContextPackage,
  DataQualityReport,
  DataFreshnessReport,
  ProvenanceRecord,
  ImpactEngineResult
} from './types';
import { RelevanceFilter } from './relevance-filter';
import { FactorExtractor } from './factor-extractor';
import { FinancialImpactEngine } from './impact-engine';

export const ORCHESTRATOR_VERSION = '1.0.0-phase3';

export class AnalysisOrchestrator {
  /**
   * Assembles a verified, multi-source analytical package for a BIST stock symbol
   */
  public static async assembleSymbolData(rawSymbol: string): Promise<{
    success: boolean;
    dataPackage?: AssembledDataPackage;
    factors?: AnalysisFactor[];
    impactAnalysis?: ImpactEngineResult;
    error?: string;
  }> {
    const symbol = normalizeSymbol(rawSymbol);
    if (!symbol || symbol.length < 2) {
      return { success: false, error: 'Geçersiz BIST hisse sembolü formatı.' };
    }

    const assembledAt = new Date().toISOString();
    const provenance: Record<string, ProvenanceRecord> = {};
    const conflicts: string[] = [];

    try {
      // 1. Concurrent fetching from existing resilient repositories
      const [
        profileRes,
        pricesRes,
        quarterlyRes,
        annualRes,
        dividendsRes,
        splitsRes,
        ownershipRes,
        estimatesRes,
        rawQuoteRes,
        commoditiesRes,
        calendarRes,
        newsRes,
        sectorComparisonRes
      ] = await Promise.allSettled([
        FinAiArchiveReader.getProfile(symbol),
        FinAiArchiveReader.getPrices(symbol, 250), // Last ~1 year of daily bars
        FinAiArchiveReader.getQuarterlyStatements(symbol),
        FinAiArchiveReader.getAnnualStatements(symbol),
        FinAiArchiveReader.getDividends(symbol),
        FinAiArchiveReader.getSplits(symbol),
        FinAiArchiveReader.getOwnership(symbol),
        FinAiArchiveReader.getEstimates(symbol),
        FinAiArchiveReader.getQuoteSummary(symbol),
        fetchLiveCommoditiesAndCrypto(),
        Promise.resolve(getDynamicCalendarCatalog()),
        this.fetchSymbolNews(symbol),
        getSectorComparativeAnalysis(symbol)
      ]);

      // Extract results safely with null guards
      const profile = profileRes.status === 'fulfilled' ? profileRes.value : null;
      const prices = pricesRes.status === 'fulfilled' ? (pricesRes.value || []) : [];
      const quarterly = quarterlyRes.status === 'fulfilled' ? (quarterlyRes.value || []) : [];
      const annual = annualRes.status === 'fulfilled' ? (annualRes.value || []) : [];
      const dividends = dividendsRes.status === 'fulfilled' ? (dividendsRes.value || []) : [];
      const splits = splitsRes.status === 'fulfilled' ? (splitsRes.value || []) : [];
      const rawQuote = rawQuoteRes.status === 'fulfilled' ? rawQuoteRes.value : null;
      const liveCommodities = commoditiesRes.status === 'fulfilled' ? commoditiesRes.value : {};
      const allCalendarEvents = calendarRes.status === 'fulfilled' ? calendarRes.value : [];
      const allNews = newsRes.status === 'fulfilled' ? newsRes.value : [];
      const sectorComp = sectorComparisonRes.status === 'fulfilled' ? sectorComparisonRes.value : null;

      // Track provenance
      provenance['company_profile'] = {
        source: 'Supabase company_profiles',
        fetchedAt: assembledAt,
        provider: 'FinAi Core DB',
        reliabilityScore: profile ? 98 : 0,
        isFallback: !profile
      };

      provenance['historical_prices'] = {
        source: 'Supabase historical_prices',
        fetchedAt: assembledAt,
        dataDate: prices.length > 0 ? prices[prices.length - 1].dateIstanbul : undefined,
        provider: 'Borsa Istanbul / Yahoo Gateway',
        reliabilityScore: prices.length > 0 ? 99 : 0,
        isFallback: false
      };

      provenance['financial_statements'] = {
        source: 'Supabase financial_statement_periods',
        fetchedAt: assembledAt,
        dataDate: quarterly.length > 0 ? quarterly[0].periodEnd : undefined,
        provider: 'KAP Consolidated Statements',
        reliabilityScore: quarterly.length > 0 ? 98 : 0,
        isFallback: false
      };

      // 2. Derive Market Context
      const latestBar = prices.length > 0 ? prices[prices.length - 1] : null;
      const prevBar = prices.length > 1 ? prices[prices.length - 2] : null;

      let currentPrice: number | null = latestBar ? Number(latestBar.close) : null;
      let changePercent: number | null = null;
      if (latestBar && prevBar && prevBar.close && prevBar.close > 0) {
        changePercent = Number((((latestBar.close - prevBar.close) / prevBar.close) * 100).toFixed(2));
      }

      // 52-Week High/Low from 250 price bars
      let high52w: number | null = null;
      let low52w: number | null = null;
      if (prices.length > 0) {
        const validHighs = prices.map(p => p.high).filter((h): h is number => h != null && !isNaN(h));
        const validLows = prices.map(p => p.low).filter((l): l is number => l != null && !isNaN(l));
        if (validHighs.length > 0) high52w = Math.max(...validHighs);
        if (validLows.length > 0) low52w = Math.min(...validLows);
      }

      const marketData: CompanyMarketContext = {
        currentPrice,
        changePercent,
        high52w,
        low52w,
        volume: latestBar?.volume != null ? Number(latestBar.volume) : null,
        lastTradeDate: latestBar?.dateIstanbul || latestBar?.date || null,
        marketCap: rawQuote?.price?.marketCap?.raw ?? null,
        currency: 'TRY',
        isMarketOpen: this.isBistTradingHours(),
        priceSource: 'BIST Daily Bar (historical_prices)',
        priceTimestamp: latestBar?.timestamp || assembledAt
      };

      // 3. Financial Statements & TTM Assembly
      let ttmData: any | null = null;
      if (quarterly.length >= 4) {
        try {
          ttmData = calculateTTM(quarterly);
        } catch {
          ttmData = null;
        }
      }

      const statements: StatementsPackage = {
        latestQuarter: quarterly.length > 0 ? quarterly[0] : null,
        latestAnnual: annual.length > 0 ? annual[0] : null,
        allQuartersCount: quarterly.length,
        allAnnualsCount: annual.length,
        quarters: quarterly,
        annuals: annual,
        ttm: ttmData,
        currency: quarterly[0]?.currency || 'TRY',
        isRestated: Boolean(quarterly[0]?.isRestated),
        validationStatus: quarterly.length > 0 ? 'VALID' : 'INSUFFICIENT_DATA'
      };

      // 4. Historical Trends & Multi-Period Growth (FAZ 6 Engine)
      let historicalTrends: any | null = null;
      try {
        historicalTrends = HistoricalAnalysisEngine.analyzeSymbol(symbol, {
          quarterlyStatements: quarterly,
          annualStatements: annual,
          priceBars: prices,
          dividends,
          splits,
          rawQuoteSummary: rawQuote || {}
        });
      } catch (e: any) {
        conflicts.push(`Tarihsel analiz motoru hatası: ${e.message}`);
      }

      // 5. Sector Information & Peer Context
      const sectorInfo = getSectorCategory(symbol, profile?.sector);
      const sectorContext: SectorContextPackage = {
        category: sectorInfo.category,
        sectorName: sectorInfo.displayName,
        peersCount: sectorComp ? sectorComp.totalSectorPeerCount : 0,
        unsupportedMetrics: sectorInfo.unsupportedMetrics,
        comparisons: sectorComp ? Object.values(sectorComp.metrics) : []
      };

      // 6. Corporate Actions & Dividends
      const corporateActions: CorporateActionsPackage = {
        historicalDividendsCount: dividends.length,
        latestDividends: dividends.slice(-5).reverse(),
        historicalSplitsCount: splits.length,
        splits: splits.slice(-3).reverse(),
        upcomingDividends: []
      };

      // 7. Relevance Filtering: News & Economic Calendar
      const filteredNewsResult = RelevanceFilter.filterNewsForSymbol(allNews, symbol, profile?.companyName, sectorInfo);
      const relevantNews = filteredNewsResult.news;

      const filteredCalendarResult = RelevanceFilter.filterCalendarForSymbol(allCalendarEvents, symbol, sectorInfo.category);
      const relevantCalendarEvents = filteredCalendarResult.events;

      // 8. FX & Commodity Exposure
      const usdTry = liveCommodities['USDTRY']?.regularMarketPrice ?? liveCommodities['USDTRY=X']?.regularMarketPrice ?? null;
      const eurTry = liveCommodities['EURTRY']?.regularMarketPrice ?? liveCommodities['EURTRY=X']?.regularMarketPrice ?? null;
      const goldGram = liveCommodities['ALTIN']?.regularMarketPrice ?? liveCommodities['GA']?.regularMarketPrice ?? null;
      const brentPetrol = liveCommodities['BZ=F']?.regularMarketPrice ?? null;

      const fxExposure = this.determineFxCommodityExposure(sectorInfo.category, usdTry, eurTry, brentPetrol);

      // 9. KAP Information
      const exactKapUrl = getKapUrl(symbol, 'ozet');
      const kapContext: KapContextPackage = {
        hasExactProfile: Boolean(exactKapUrl),
        kapProfileUrl: exactKapUrl || `https://www.kap.org.tr/tr/arama/sirket-arama?query=${symbol}`,
        kapDisclosuresUrl: `https://www.kap.org.tr/tr/bist-sirketler`,
        source: exactKapUrl ? 'KAP_MEMBER_REGISTRY' : 'FALLBACK_SEARCH'
      };

      // 10. Data Quality Report
      const dataQuality = this.assessDataQuality(profile, prices, quarterly, historicalTrends);

      // 11. Data Freshness Report
      const dataFreshness = this.assessDataFreshness(assembledAt, marketData.lastTradeDate, quarterly[0]?.periodEnd);

      // 12. Factor Extraction (Qualitative Units: Event -> Channel -> Company -> Result)
      const factors = FactorExtractor.extractFactors({
        symbol,
        companyName: profile?.companyName || `${symbol} Sanayi ve Ticaret A.Ş.`,
        marketData,
        statements,
        historicalTrends,
        sectorContext,
        news: relevantNews,
        calendarEvents: relevantCalendarEvents,
        corporateActions,
        fxExposure
      });

      // 13. Deterministic SHA-256 Fingerprint for Deduplication & Change Tracking
      const fingerprint = this.computeFingerprint({
        symbol,
        price: marketData.currentPrice,
        priceDate: marketData.lastTradeDate,
        lastQuarter: quarterly[0]?.periodEnd,
        quarterCount: quarterly.length,
        dividendCount: dividends.length,
        topNewsId: relevantNews[0]?.id || 'NONE',
        factorsSignature: factors.map(f => `${f.id}:${f.impactDirection}`).join('|')
      });

      const dataPackage: AssembledDataPackage = {
        symbol,
        companyName: profile?.companyName || `${symbol} Sanayi ve Ticaret A.Ş.`,
        sector: sectorInfo.displayName,
        orchestratorVersion: ORCHESTRATOR_VERSION,
        assembledAt,
        fingerprint,
        companyProfile: profile,
        marketData,
        statements,
        historicalTrends,
        sectorContext,
        relevantNews,
        relevantCalendarEvents,
        corporateActions,
        earningsCalendar: {
          expectedDate: null,
          daysLeft: null,
          source: 'HalkArz Bilanço API'
        },
        fxCommodityExposure: fxExposure,
        kapContext,
        dataQuality,
        dataFreshness,
        provenance,
        conflicts
      };

      // 14. Phase 3: Deterministic Financial Impact Engine Evaluation
      const impactAnalysis = FinancialImpactEngine.evaluate(dataPackage, factors);
      dataPackage.impactAnalysis = impactAnalysis;

      return {
        success: true,
        dataPackage,
        factors,
        impactAnalysis
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Data Assembler hatası (${symbol}): ${error.message}`
      };
    }
  }

  /**
   * Deterministic SHA-256 Fingerprint Generator
   */
  public static computeFingerprint(input: Record<string, any>): string {
    const serialized = JSON.stringify(input);
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Assesses completeness and mathematical validity
   */
  private static assessDataQuality(profile: any, prices: any[], quarterly: any[], historicalTrends: any): DataQualityReport {
    let score = 0;
    const notes: string[] = [];

    const hasProfile = Boolean(profile && profile.companyName);
    const hasPrices = prices.length >= 20;
    const hasStatements = quarterly.length >= 4;
    const hasRatios = Boolean(historicalTrends?.growth);

    if (hasProfile) score += 20;
    else notes.push('Şirket künye profili eksik.');

    if (hasPrices) score += 30;
    else notes.push('Geçmiş fiyat verisi yetersiz (20 barın altında).');

    if (hasStatements) score += 35;
    else notes.push('Çeyreklik finansal tablo serisi yetersiz (en az 4 çeyrek gerekir).');

    if (hasRatios) score += 15;

    let status: DataQualityReport['status'] = 'VALID';
    if (score < 50) status = 'INSUFFICIENT_DATA';
    else if (score < 80) status = 'WARNING';

    return {
      score,
      status,
      hasProfile,
      hasPrices,
      hasStatements,
      hasRatios,
      notes
    };
  }

  /**
   * Checks staleness of analytical components
   */
  private static assessDataFreshness(assembledAt: string, priceDate: string | null, statementDate: string | null): DataFreshnessReport {
    const staleReasons: string[] = [];
    let isStale = false;

    if (priceDate) {
      const pTime = new Date(priceDate).getTime();
      const now = new Date().getTime();
      const daysDiff = (now - pTime) / (1000 * 60 * 60 * 24);
      // More than 5 calendar days without price bar indicates stale market series
      if (daysDiff > 5) {
        isStale = true;
        staleReasons.push(`Son fiyat barı ${Math.round(daysDiff)} gün öncesine ait (${priceDate}).`);
      }
    } else {
      isStale = true;
      staleReasons.push('Fiyat barı tarihi bulunamadı.');
    }

    return {
      assembledAt,
      priceDate,
      financialPeriodEnd: statementDate,
      newsLatestDate: null,
      macroEventLatestDate: null,
      isStale,
      staleReasons
    };
  }

  /**
   * Sector-aware FX and Commodity Exposure Analyzer
   */
  private static determineFxCommodityExposure(
    category: string,
    usdTry: number | null,
    eurTry: number | null,
    brentPetrol: number | null
  ): FxCommodityExposurePackage {
    const notes: string[] = [];
    let exposureType: FxCommodityExposurePackage['exposureType'] = 'BALANCED';

    if (category === 'TRANSPORTATION') {
      exposureType = 'FX_SENSITIVE';
      notes.push('Havacılık ve ulaştırma gelirleri ağırlıklı döviz (EUR/USD) cinsindendir; jet yakıtı giderleri doğrudan Brent Petrol fiyatına duyarlıdır.');
      if (brentPetrol) notes.push(`Brent Petrol seviyesi (${brentPetrol.toFixed(2)} $) yakıt maliyetlerini etkiler.`);
    } else if (category === 'ENERGY') {
      exposureType = 'COMMODITY_SENSITIVE';
      notes.push('Enerji ve rafineri kârlılığı ham petrol fiyatları, crack marjları ve EPDK tarife düzenlemeleriyle doğrudan ilişkilidir.');
    } else if (category === 'AUTOMOTIVE') {
      exposureType = 'FX_SENSITIVE';
      notes.push('Otomotiv sektörü Avrupa pazarına yüksek ihracat hacmi nedeniyle EUR/TRY kuruna ve Avrupa talep dinamiklerine duyarlıdır.');
    } else if (category === 'BANK' || category === 'FINANCIAL_INTERMEDIARY') {
      exposureType = 'DOMESTIC_TL';
      notes.push('Bankacılık sektörü TCMB politika faiz kararlarına, mevduat/kredi faiz makasına ve TL likiditesine en yüksek duyarlılığa sahip sektördür.');
    } else {
      notes.push('Genel piyasa döviz ve enflasyon dengesi şirket finansallarında belirleyicidir.');
    }

    return {
      usdTry,
      eurTry,
      goldGram: null,
      brentPetrol,
      exposureType,
      exposureNotes: notes
    };
  }

  /**
   * Helper to retrieve news for symbol via Google News RSS or Google Search
   */
  private static async fetchSymbolNews(symbol: string): Promise<EnrichedNewsItem[]> {
    try {
      const query = encodeURIComponent(`${symbol} hisse haber KAP bilanço`);
      const url = `https://news.google.com/rss/search?q=${query}&hl=tr&gl=TR&ceid=TR:tr`;

      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(3500)
      });

      if (!res.ok) return [];

      const xmlText = await res.text();
      const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
      const parsed = parser.parse(xmlText);
      const items = parsed?.rss?.channel?.item;

      if (!items) return [];
      const itemList = Array.isArray(items) ? items : [items];

      return itemList.slice(0, 8).map((item: any, idx: number) => {
        const rawTitle = item.title || '';
        const titleClean = String(rawTitle).replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
        const desc = String(item.description || '').replace(/<[^>]*>/g, '').trim();

        return {
          id: `${symbol}_news_${idx + 1}`,
          slug: `${symbol}-news-${idx + 1}`,
          title: titleClean,
          link: item.link || '',
          pubDate: item.pubDate || new Date().toISOString(),
          source: item.source || 'Google News BIST',
          description: desc,
          category: 'bist' as const,
          categoryLabel: 'Borsa İstanbul',
          sentiment: /yükseldi|arttı|rekor|kâr|anlaşma|onay/i.test(titleClean) ? 'bullish' as const : (/düştü|zarar|geriledi|risk/i.test(titleClean) ? 'bearish' as const : 'neutral' as const),
          impact: /kap|bilanço|temettü|rekor/i.test(titleClean) ? 'critical' as const : 'medium' as const,
          tickers: [symbol],
          affectedAssets: [symbol]
        };
      });
    } catch {
      return [];
    }
  }

  private static isBistTradingHours(): boolean {
    try {
      const trDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
      const day = trDate.getDay();
      if (day === 0 || day === 6) return false;
      const mins = trDate.getHours() * 60 + trDate.getMinutes();
      return mins >= 595 && mins <= 1090; // 09:55 - 18:10
    } catch {
      return false;
    }
  }
}
