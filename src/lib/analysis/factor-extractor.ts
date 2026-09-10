/**
 * FinAi Analysis Factor Extractor
 * 
 * Transforms assembled quantitative data, news, and macro events into structured
 * qualitative factor units following the causal chain:
 * 
 * Data → Event → Impact Channel → Sector/Company → Financial Result → Potential Impact
 * 
 * Each factor captures:
 * - factorType: FINANCIAL | VALUATION | SECTOR | NEWS | MACRO_CALENDAR | FX_COMMODITY | CORPORATE_ACTION
 * - relevance: DIRECT_COMPANY | SECTOR | MACRO | MARKET
 * - impactDirection: positive | negative | neutral | unknown
 * - magnitude: high | medium | low | unknown
 * - freshness: REALTIME | RECENT | HISTORICAL | STALE
 * - persistence: TRANSITORY | PERSISTENT | STRUCTURAL
 * - sourceReliability: 0 - 100
 */

import {
  AnalysisFactor,
  CompanyMarketContext,
  StatementsPackage,
  SectorContextPackage,
  CorporateActionsPackage,
  FxCommodityExposurePackage
} from './types';
import { HistoricalEngineResult } from '@/types/historical-engine-types';
import { EnrichedNewsItem } from '@/app/api/news/route';
import { CatalogCalendarEvent } from '@/lib/calendar-catalog';

export class FactorExtractor {
  public static extractFactors(params: {
    symbol: string;
    companyName: string;
    marketData: CompanyMarketContext;
    statements: StatementsPackage;
    historicalTrends: HistoricalEngineResult | null;
    sectorContext: SectorContextPackage;
    news: EnrichedNewsItem[];
    calendarEvents: CatalogCalendarEvent[];
    corporateActions: CorporateActionsPackage;
    fxExposure: FxCommodityExposurePackage;
  }): AnalysisFactor[] {
    const factors: AnalysisFactor[] = [];
    const { symbol, historicalTrends, sectorContext, news, calendarEvents, corporateActions, fxExposure } = params;

    // 1. FINANCIAL FACTORS: Growth & Profitability Trajectory
    if (historicalTrends) {
      const revGrowth = historicalTrends.growthAnalysis?.metrics?.['revenue'];
      if (revGrowth && revGrowth.latestYoY?.yoyGrowthRate != null) {
        const rate = revGrowth.latestYoY.yoyGrowthRate;
        factors.push({
          id: `${symbol}_FACTOR_REV_GROWTH`,
          factorType: 'FINANCIAL',
          title: 'Yıllık Satış Gelirleri Büyümesi',
          explanation: `Şirketin hasılatı bir önceki yılın aynı çeyreğine göre %${rate >= 0 ? '+' : ''}${rate.toFixed(1)} değişim gösterdi. Trend: ${revGrowth.trendDirection}.`,
          relevance: 'DIRECT_COMPANY',
          impactDirection: rate > 15 ? 'positive' : (rate < -5 ? 'negative' : 'neutral'),
          magnitude: Math.abs(rate) > 25 ? 'high' : 'medium',
          freshness: 'RECENT',
          persistence: 'PERSISTENT',
          sourceReliability: 95,
          source: 'Finansal Tablolar (KAP/Supabase)',
          metricKey: 'revenueYoY',
          metricValue: rate
        });
      }

      // Profitability Margin Trend from metricDirections
      const netMarginTrend = historicalTrends.metricDirections?.['netMargin'];
      if (netMarginTrend) {
        const isPos = netMarginTrend === 'IMPROVING';
        const isNeg = netMarginTrend === 'DETERIORATING';
        factors.push({
          id: `${symbol}_FACTOR_MARGIN_TREND`,
          factorType: 'FINANCIAL',
          title: 'Net Kâr Marjı Dinamiği',
          explanation: `Net kâr marjı geçmiş dönemlere kıyasla ${netMarginTrend === 'IMPROVING' ? 'iyileşme eğiliminde' : (netMarginTrend === 'DETERIORATING' ? 'baskılanma/daralma eğiliminde' : 'yatay/dengeli')} seyrediyor.`,
          relevance: 'DIRECT_COMPANY',
          impactDirection: isPos ? 'positive' : (isNeg ? 'negative' : 'neutral'),
          magnitude: netMarginTrend === 'VOLATILE' ? 'high' : 'medium',
          freshness: 'RECENT',
          persistence: 'PERSISTENT',
          sourceReliability: 95,
          source: 'Finansal Rasyo Motoru',
          metricKey: 'netMarginTrend',
          metricValue: netMarginTrend
        });
      }

      // Free Cash Flow Trajectory from cashFlowTrends
      const latestCF = historicalTrends.cashFlowTrends?.[0];
      if (latestCF && latestCF.freeCashFlow != null) {
        const fcf = latestCF.freeCashFlow;
        const isPositiveFCF = fcf > 0;
        factors.push({
          id: `${symbol}_FACTOR_FCF_STATUS`,
          factorType: 'FINANCIAL',
          title: 'Serbest Nakit Akışı (FCF) Üretimi',
          explanation: isPositiveFCF
            ? `Şirket operasyonel faaliyetlerinden yatırımlar düşüldükten sonra pozitif nakit üretmeyi sürdürmektedir (FCF: ${this.formatMoney(fcf)}).`
            : `Şirketin dönem serbest nakit akışı negatiftir (${this.formatMoney(fcf)}), net nakit çıkışı veya yoğun yatırım dönemi gözlenmektedir.`,
          relevance: 'DIRECT_COMPANY',
          impactDirection: isPositiveFCF ? 'positive' : 'negative',
          magnitude: 'high',
          freshness: 'RECENT',
          persistence: 'PERSISTENT',
          sourceReliability: 92,
          source: 'Nakit Akış Tablosu',
          metricKey: 'freeCashFlow',
          metricValue: fcf
        });
      }
    }

    // 2. VALUATION & SECTOR PEER FACTORS
    if (sectorContext && Array.isArray(sectorContext.comparisons)) {
      const peComp = sectorContext.comparisons.find(c => c.key === 'pe');
      if (peComp && peComp.companyValue != null && peComp.sectorMedian != null) {
        const diffPct = peComp.sectorMedian > 0 ? ((peComp.companyValue - peComp.sectorMedian) / peComp.sectorMedian) * 100 : 0;
        const isDiscounted = diffPct < -10;
        const isPremium = diffPct > 20;

        factors.push({
          id: `${symbol}_FACTOR_PE_VALUATION`,
          factorType: 'VALUATION',
          title: 'Fiyat/Kazanç (F/K) Sektörel Konumu',
          explanation: `Şirket F/K çarpanı (${peComp.companyValue.toFixed(1)}x), sektör medyanına (${peComp.sectorMedian.toFixed(1)}x) kıyasla ${isDiscounted ? `%${Math.abs(diffPct).toFixed(0)} iskontolu` : (isPremium ? `%${diffPct.toFixed(0)} primli` : 'sektörle paralel')} işlem görmektedir.`,
          relevance: 'SECTOR',
          impactDirection: isDiscounted ? 'positive' : (isPremium ? 'negative' : 'neutral'),
          magnitude: Math.abs(diffPct) > 30 ? 'high' : 'medium',
          freshness: 'RECENT',
          persistence: 'STRUCTURAL',
          sourceReliability: 90,
          source: 'Sektörel Kıyaslama Motoru',
          metricKey: 'peRatio',
          metricValue: peComp.companyValue,
          benchmarkValue: peComp.sectorMedian
        });
      }

      const pbComp = sectorContext.comparisons.find(c => c.key === 'pb');
      if (pbComp && pbComp.companyValue != null && pbComp.sectorMedian != null) {
        factors.push({
          id: `${symbol}_FACTOR_PB_VALUATION`,
          factorType: 'VALUATION',
          title: 'Piyasa Değeri / Defter Değeri (PD/DD)',
          explanation: `Şirketin PD/DD rasyosu ${pbComp.companyValue.toFixed(2)}x seviyesindedir (Sektör medyanı: ${pbComp.sectorMedian.toFixed(2)}x).`,
          relevance: 'SECTOR',
          impactDirection: pbComp.companyValue < pbComp.sectorMedian ? 'positive' : 'neutral',
          magnitude: 'medium',
          freshness: 'RECENT',
          persistence: 'STRUCTURAL',
          sourceReliability: 90,
          source: 'Sektörel Kıyaslama Motoru',
          metricKey: 'pbRatio',
          metricValue: pbComp.companyValue,
          benchmarkValue: pbComp.sectorMedian
        });
      }
    }

    // 3. CORPORATE ACTION FACTORS: Dividend Policy & Yield
    if (corporateActions && corporateActions.historicalDividendsCount > 0) {
      const latest = corporateActions.latestDividends?.[0];
      if (latest && latest.exDate) {
        factors.push({
          id: `${symbol}_FACTOR_DIVIDEND_HISTORY`,
          factorType: 'CORPORATE_ACTION',
          title: 'Düzenli Temettü Dağıtım Kültürü',
          explanation: `Şirketin kayıtlı ${corporateActions.historicalDividendsCount} temettü dağıtım geçmişi bulunmaktadır. Son temettü tarihi: ${latest.exDate}, hisse başına brüt tutar: ${latest.grossAmount} ₺.`,
          relevance: 'DIRECT_COMPANY',
          impactDirection: 'positive',
          magnitude: 'medium',
          freshness: 'RECENT',
          persistence: 'PERSISTENT',
          sourceReliability: 98,
          source: 'Temettü Arşivi (historical_dividends)',
          eventDate: latest.exDate,
          metricKey: 'dividendGross',
          metricValue: latest.grossAmount
        });
      }
    }

    // 4. NEWS & RECENT DEVELOPMENTS FACTORS
    if (Array.isArray(news) && news.length > 0) {
      const topNews = news.slice(0, 2);
      topNews.forEach((n, idx) => {
        const isBullish = n.sentiment === 'bullish';
        const isBearish = n.sentiment === 'bearish';

        factors.push({
          id: `${symbol}_FACTOR_NEWS_${idx + 1}`,
          factorType: 'NEWS',
          title: n.title,
          explanation: n.description || n.title,
          relevance: 'DIRECT_COMPANY',
          impactDirection: isBullish ? 'positive' : (isBearish ? 'negative' : 'neutral'),
          magnitude: n.impact === 'critical' ? 'high' : 'medium',
          freshness: 'REALTIME',
          persistence: 'TRANSITORY',
          sourceReliability: 85,
          source: n.source || 'Haber Akışı (RSS)',
          eventDate: n.pubDate,
          provenanceRef: n.link
        });
      });
    }

    // 5. MACRO CALENDAR & MONETARY POLICY FACTORS
    if (Array.isArray(calendarEvents) && calendarEvents.length > 0) {
      const highImpactEvents = calendarEvents.filter(e => e.impact === 'high' || /faiz|enflasyon|tcmb|fed/i.test(e.event)).slice(0, 2);
      highImpactEvents.forEach((evt, idx) => {
        factors.push({
          id: `${symbol}_FACTOR_MACRO_${idx + 1}`,
          factorType: 'MACRO_CALENDAR',
          title: `${evt.country} ${evt.event}`,
          explanation: `Gündemdeki bu makroekonomik gelişme (${evt.dateFormatted} ${evt.time}) sektörün fonlama maliyeti ve genel piyasa risk iştahını doğrudan etkileyebilir. Beklenti: ${evt.forecast || '-'}, Önceki: ${evt.previous || '-'}.`,
          relevance: 'MACRO',
          impactDirection: 'neutral',
          magnitude: 'high',
          freshness: 'RECENT',
          persistence: 'TRANSITORY',
          sourceReliability: 90,
          source: 'Ekonomik Takvim',
          eventDate: evt.dateFormatted
        });
      });
    }

    // 6. FX & COMMODITY SENSITIVITY FACTOR
    if (fxExposure && fxExposure.exposureNotes.length > 0) {
      factors.push({
        id: `${symbol}_FACTOR_FX_COMMODITY`,
        factorType: 'FX_COMMODITY',
        title: 'Döviz ve Emtia Maruziyeti',
        explanation: fxExposure.exposureNotes.join(' '),
        relevance: 'SECTOR',
        impactDirection: 'neutral',
        magnitude: fxExposure.exposureType === 'DOMESTIC_TL' ? 'low' : 'high',
        freshness: 'REALTIME',
        persistence: 'STRUCTURAL',
        sourceReliability: 90,
        source: 'Piyasa Verisi (Harem/Yahoo)',
        metadata: {
          usdTry: fxExposure.usdTry,
          brentPetrol: fxExposure.brentPetrol
        }
      });
    }

    return factors;
  }

  private static formatMoney(val: number): string {
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(2)} Milyar ₺`;
    if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)} Milyon ₺`;
    return `${sign}${abs.toLocaleString('tr-TR')} ₺`;
  }
}
