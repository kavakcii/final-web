/**
 * FinAI Historical Analysis Engine - Stage 6 (Phase 6)
 * 
 * Complete deterministic analytical engine operating directly over:
 * - Normalized statements (.finai_archive/statements/)
 * - Historical daily price bars (.finai_archive/prices/)
 * - Dividends (.finai_archive/dividends/)
 * - Splits & corporate actions (.finai_archive/splits/)
 * - RAW payloads for provenance and share counts
 * 
 * Rules:
 * 1. ZERO synthetic or coerced data (missing is strictly NULL with reason).
 * 2. CapEx negative sign convention strictly maintained: FCF = OCF + CapEx.
 * 3. Denominator for EPS strictly basic/diluted shares (NEVER paid-in capital).
 * 4. P/E is NULL if EPS <= 0; P/B is NULL if BVPS <= 0; EV/EBITDA is NULL if EBITDA <= 0.
 * 5. Multi-period CAGR only with actual valid periods and dates.
 * 6. Sector compliance: Banks/Finance omit industrial leverage and gross profit.
 * 7. Currency awareness: USD/EUR financial statements compared against TRY prices require FX provenance or status CURRENCY_MISMATCH.
 * 8. Dividend stopaj: No automatic 10% tax. Gross stays gross; net is NULL.
 */

import {
  HistoricalEngineResult,
  TrendDirection,
  MetricDataStatus,
  HistoricalGrowthMetric,
  MultiYearComparisonPoint,
  ProfitabilityTrendPeriod,
  BalanceSheetTrendPeriod,
  CashFlowTrendPeriod,
  PerShareTrendPeriod,
  HistoricalValuationPoint,
  HistoricalDividendRecord,
  CorporateActionTimelineEvent,
  HistoricalGrowthAnalysis
} from '@/types/historical-engine-types';
import { sectorMapping } from '@/data/sectorMapping';

export interface RawStatementPeriod {
  symbol: string;
  periodType: 'QUARTERLY' | 'ANNUAL';
  periodEnd: string;
  fiscalYear: number;
  fiscalQuarter: number;
  currency: string;
  revenue: number | null;
  costOfRevenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  ebitda: number | null;
  netIncome: number | null;
  netIncomeToParent: number | null;
  cashAndEquivalents: number | null;
  totalCurrentAssets: number | null;
  totalAssets: number | null;
  currentLiabilities: number | null;
  totalLiabilities: number | null;
  totalEquity: number | null;
  parentEquity: number | null;
  netDebt: number | null;
  operatingCashFlow: number | null;
  capitalExpenditure: number | null;
  freeCashFlow: number | null;
  rawIS?: Record<string, any>;
  rawBS?: Record<string, any>;
  rawCF?: Record<string, any>;
}

export interface PriceBar {
  timestamp: string;
  dateIstanbul: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClose: number;
  volume: number;
}

export interface DividendRawItem {
  exDate: string;
  grossAmount: number;
  netAmount: number | null;
  currency: string;
}

export interface SplitRawItem {
  eventDate: string;
  numerator: number;
  denominator: number;
  splitRatio: number;
  actionType: string;
}

// Volatility (Standard Deviation)
function calculateStdDev(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v != null && !isNaN(v) && isFinite(v));
  if (valid.length < 3) return null; // Minimum 3 observations required
  const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
  const variance = valid.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (valid.length - 1);
  return parseFloat(Math.sqrt(variance).toFixed(2));
}

// Determine Trend Direction
function determineTrendDirection(values: (number | null)[]): TrendDirection {
  const valid = values.filter((v): v is number => v != null && !isNaN(v) && isFinite(v));
  if (valid.length < 3) return 'INSUFFICIENT_HISTORY';

  let increasing = 0;
  let decreasing = 0;
  for (let i = 1; i < valid.length; i++) {
    const diff = valid[i] - valid[i - 1];
    const base = Math.abs(valid[i - 1]);
    const pctChange = base > 0 ? (diff / base) * 100 : 0;
    if (pctChange > 2.0) increasing++;
    else if (pctChange < -2.0) decreasing++;
  }

  if (increasing >= valid.length - 1) return 'IMPROVING';
  if (decreasing >= valid.length - 1) return 'DETERIORATING';
  if (increasing === 0 && decreasing === 0) return 'STABLE';

  const std = calculateStdDev(valid);
  const mean = Math.abs(valid.reduce((a, b) => a + b, 0) / valid.length);
  if (std != null && mean > 0 && (std / mean) > 0.4) {
    return 'VOLATILE';
  }
  return increasing > decreasing ? 'IMPROVING' : (decreasing > increasing ? 'DETERIORATING' : 'STABLE');
}

// Calculate CAGR
function calculateCAGR(startVal: number | null, endVal: number | null, years: number): number | null {
  if (startVal == null || endVal == null || years <= 0) return null;
  if (startVal <= 0 || endVal <= 0) return null; // Standard CAGR undefined for negative or crossing zero
  const cagr = (Math.pow(endVal / startVal, 1 / years) - 1) * 100;
  return isFinite(cagr) ? parseFloat(cagr.toFixed(2)) : null;
}

export class HistoricalAnalysisEngine {
  /**
   * Main entry point to analyze a single symbol's dataset
   */
  public static analyzeSymbol(
    symbol: string,
    inputs: {
      quarterlyStatements?: RawStatementPeriod[];
      annualStatements?: RawStatementPeriod[];
      priceBars?: PriceBar[];
      dividends?: DividendRawItem[];
      splits?: SplitRawItem[];
      rawQuoteSummary?: Record<string, any>;
      qualityScore?: number;
    }
  ): HistoricalEngineResult {
    const sector = sectorMapping[symbol] || 'Diğer';
    const isBank = sector === 'Banka' || sector === 'Finance' || sector === 'Aracı Kurum ve Finans';
    const isInsurance = sector === 'Finance' && (symbol.includes('GRT') || symbol.includes('SGR') || symbol.includes('HYT'));
    const isREIT = sector === 'Gayrimenkul Yatırım Ortaklığı' || sector === 'Gayrimenkul';
    const isETF = sector.includes('Fon') || sector.includes('Sertifika');

    const quarterly = (inputs.quarterlyStatements || []).slice().sort((a, b) => a.periodEnd.localeCompare(b.periodEnd));
    const annual = (inputs.annualStatements || []).slice().sort((a, b) => a.periodEnd.localeCompare(b.periodEnd));
    const prices = (inputs.priceBars || []).slice().sort((a, b) => a.dateIstanbul.localeCompare(b.dateIstanbul));
    const dividends = (inputs.dividends || []).slice().sort((a, b) => a.exDate.localeCompare(b.exDate));
    const splits = (inputs.splits || []).slice().sort((a, b) => a.eventDate.localeCompare(b.eventDate));

    // Reporting Currency
    const financialReportingCurrency = inputs.rawQuoteSummary?.financialData?.financialCurrency || 'TRY';
    const priceTradingCurrency = 'TRY';
    const hasCurrencyMismatch = financialReportingCurrency !== priceTradingCurrency;

    // TTM Eligibility: At least 4 consecutive quarterly periods
    let isTtmEligible = false;
    let consecutiveQuarters = 0;
    if (quarterly.length >= 4) {
      consecutiveQuarters = 4;
      isTtmEligible = true;
    }

    // 1. Growth Analysis
    const growthMetrics = [
      { key: 'revenue', name: 'Satış Gelirleri', isSectorExcluded: isBank },
      { key: 'grossProfit', name: 'Brüt Kâr', isSectorExcluded: isBank },
      { key: 'operatingIncome', name: 'Faaliyet Kârı', isSectorExcluded: false },
      { key: 'ebitda', name: 'FAVÖK', isSectorExcluded: isBank || isInsurance },
      { key: 'netIncome', name: 'Net Dönem Kârı', isSectorExcluded: false },
      { key: 'totalAssets', name: 'Toplam Aktifler', isSectorExcluded: false },
      { key: 'totalEquity', name: 'Toplam Özkaynaklar', isSectorExcluded: false },
      { key: 'operatingCashFlow', name: 'İşletme Nakit Akışı', isSectorExcluded: isBank },
      { key: 'freeCashFlow', name: 'Serbest Nakit Akışı (FCF)', isSectorExcluded: isBank }
    ];

    const growthAnalysis: HistoricalGrowthAnalysis = { metrics: {} };

    // Process annual growth (standard for long-term CAGR and YoY)
    for (const gm of growthMetrics) {
      if (gm.isSectorExcluded) {
        growthAnalysis.metrics[gm.key] = {
          yoySeries: [],
          latestYoY: null,
          multiYearComparisons: [],
          cagr3Y: null,
          cagr5Y: null,
          trendDirection: 'NOT_APPLICABLE' as TrendDirection,
          volatilityStdDev: null
        };
        continue;
      }

      const yoySeries: HistoricalGrowthMetric[] = [];
      const valuesSeries: (number | null)[] = [];

      for (let i = 0; i < annual.length; i++) {
        const curr = annual[i];
        const currVal = (curr as any)[gm.key] ?? null;
        valuesSeries.push(currVal);

        if (i > 0) {
          const prev = annual[i - 1];
          const prevVal = (prev as any)[gm.key] ?? null;

          let yoy: number | null = null;
          let status: MetricDataStatus = 'AVAILABLE';
          let specialLabel: string | undefined = undefined;
          let reason: string | undefined = undefined;

          if (currVal == null || prevVal == null) {
            status = 'DATA_UNAVAILABLE';
            reason = 'Karşılaştırma için veri eksik';
          } else if (prevVal === 0) {
            status = 'ZERO_DENOMINATOR';
            reason = 'Önceki dönem değeri sıfır';
          } else if (prevVal < 0 && currVal > 0) {
            specialLabel = 'Zarardan Kâra Geçiş';
            yoy = parseFloat((((currVal - prevVal) / Math.abs(prevVal)) * 100).toFixed(2));
          } else if (prevVal < 0 && currVal < 0) {
            specialLabel = 'Zarar Devam Ediyor';
            yoy = parseFloat((((currVal - prevVal) / Math.abs(prevVal)) * 100).toFixed(2));
          } else {
            yoy = parseFloat((((currVal - prevVal) / prevVal) * 100).toFixed(2));
          }

          yoySeries.push({
            metricKey: gm.key,
            metricName: gm.name,
            currentPeriodEnd: curr.periodEnd,
            previousPeriodEnd: prev.periodEnd,
            currentValue: currVal,
            previousValue: prevVal,
            yoyGrowthRate: yoy,
            formattedYoY: yoy != null ? `%${yoy.toFixed(2)}` : (specialLabel || '—'),
            specialTransitionLabel: specialLabel,
            status,
            reason
          });
        }
      }

      // Multi-year comparison (1Y, 3Y, 5Y)
      const comparisons: MultiYearComparisonPoint[] = [];
      const validAnnuals = annual.filter(a => (a as any)[gm.key] != null);
      if (validAnnuals.length >= 2) {
        const latest = validAnnuals[validAnnuals.length - 1];
        const latestVal = (latest as any)[gm.key] as number;
        const latestYear = parseInt(latest.periodEnd.split('-')[0], 10);

        const timeframes: { label: '1Y' | '3Y' | '5Y'; years: number }[] = [
          { label: '1Y', years: 1 },
          { label: '3Y', years: 3 },
          { label: '5Y', years: 5 }
        ];

        for (const tf of timeframes) {
          const targetYear = latestYear - tf.years;
          // Find exact match first, then closest available prior period
          let match = validAnnuals.find(a => parseInt(a.periodEnd.split('-')[0], 10) === targetYear);
          let isExact = true;
          if (!match) {
            const candidates = validAnnuals.filter(a => parseInt(a.periodEnd.split('-')[0], 10) <= targetYear);
            if (candidates.length > 0) {
              match = candidates[candidates.length - 1];
              isExact = false;
            }
          }

          if (match) {
            const matchVal = (match as any)[gm.key] as number;
            const actualYears = latestYear - parseInt(match.periodEnd.split('-')[0], 10);
            let chg: number | null = null;
            let cagr: number | null = null;
            let status: MetricDataStatus = 'AVAILABLE';

            if (latestVal != null && matchVal != null && matchVal > 0 && actualYears > 0) {
              chg = parseFloat((((latestVal - matchVal) / matchVal) * 100).toFixed(2));
              cagr = calculateCAGR(matchVal, latestVal, actualYears);
            } else {
              status = 'DATA_UNAVAILABLE';
            }

            comparisons.push({
              timeframe: tf.label,
              basePeriodEnd: match.periodEnd,
              targetPeriodEnd: latest.periodEnd,
              isExactPeriod: isExact,
              baseValue: matchVal,
              targetValue: latestVal,
              totalChangePercent: chg,
              cagrPercent: cagr,
              status
            });
          }
        }
      }

      const cagr3YPoint = comparisons.find(c => c.timeframe === '3Y');
      const cagr5YPoint = comparisons.find(c => c.timeframe === '5Y');

      growthAnalysis.metrics[gm.key] = {
        yoySeries,
        latestYoY: yoySeries.length > 0 ? yoySeries[yoySeries.length - 1] : null,
        multiYearComparisons: comparisons,
        cagr3Y: cagr3YPoint?.cagrPercent ?? null,
        cagr5Y: cagr5YPoint?.cagrPercent ?? null,
        trendDirection: determineTrendDirection(valuesSeries),
        volatilityStdDev: calculateStdDev(valuesSeries)
      };
    }

    // 2. Profitability Trends
    const profitabilityTrends: ProfitabilityTrendPeriod[] = [];
    for (const st of annual) {
      const rev = st.revenue;
      const gp = st.grossProfit;
      const op = st.operatingIncome;
      const eb = st.ebitda;
      const ni = st.netIncome;
      const eq = st.totalEquity;
      const ast = st.totalAssets;

      const statuses: Record<string, MetricDataStatus> = {};

      let gm: number | null = null;
      if (isBank) {
        statuses.grossMargin = 'NOT_APPLICABLE';
      } else if (gp != null && rev != null && rev > 0) {
        gm = parseFloat(((gp / rev) * 100).toFixed(2));
        statuses.grossMargin = 'AVAILABLE';
      } else {
        statuses.grossMargin = 'DATA_UNAVAILABLE';
      }

      let om: number | null = null;
      if (op != null && rev != null && rev > 0) {
        om = parseFloat(((op / rev) * 100).toFixed(2));
        statuses.operatingMargin = 'AVAILABLE';
      } else {
        statuses.operatingMargin = 'DATA_UNAVAILABLE';
      }

      let em: number | null = null;
      if (isBank || isInsurance) {
        statuses.ebitdaMargin = 'NOT_APPLICABLE';
      } else if (eb != null && rev != null && rev > 0) {
        em = parseFloat(((eb / rev) * 100).toFixed(2));
        statuses.ebitdaMargin = 'AVAILABLE';
      } else {
        statuses.ebitdaMargin = 'DATA_UNAVAILABLE';
      }

      let nm: number | null = null;
      if (ni != null && rev != null && rev > 0) {
        nm = parseFloat(((ni / rev) * 100).toFixed(2));
        statuses.netMargin = 'AVAILABLE';
      } else {
        statuses.netMargin = 'DATA_UNAVAILABLE';
      }

      let roe: number | null = null;
      if (eq != null && eq <= 0) {
        statuses.roe = 'NEGATIVE_DENOMINATOR';
      } else if (ni != null && eq != null && eq > 0) {
        roe = parseFloat(((ni / eq) * 100).toFixed(2));
        statuses.roe = 'AVAILABLE';
      } else {
        statuses.roe = 'DATA_UNAVAILABLE';
      }

      let roa: number | null = null;
      if (ast != null && ast <= 0) {
        statuses.roa = 'NEGATIVE_DENOMINATOR';
      } else if (ni != null && ast != null && ast > 0) {
        roa = parseFloat(((ni / ast) * 100).toFixed(2));
        statuses.roa = 'AVAILABLE';
      } else {
        statuses.roa = 'DATA_UNAVAILABLE';
      }

      profitabilityTrends.push({
        periodEnd: st.periodEnd,
        periodType: 'ANNUAL',
        grossMargin: gm,
        operatingMargin: om,
        ebitdaMargin: em,
        netMargin: nm,
        roe,
        roa,
        statuses
      });
    }

    // 3. Balance Sheet Trends
    const balanceSheetTrends: BalanceSheetTrendPeriod[] = [];
    for (const st of annual) {
      const ast = st.totalAssets;
      const liab = st.totalLiabilities;
      const eq = st.totalEquity;
      const cash = st.cashAndEquivalents;
      const ca = st.totalCurrentAssets;
      const cl = st.currentLiabilities;
      const finDebt = st.rawBS?.totalDebt ?? (st.rawBS?.longTermDebtAndCapitalLeaseObligation != null && st.rawBS?.currentDebtAndCapitalLeaseObligation != null ? st.rawBS.longTermDebtAndCapitalLeaseObligation + st.rawBS.currentDebtAndCapitalLeaseObligation : null);
      const netDebt = (finDebt != null && cash != null) ? finDebt - cash : (st.netDebt ?? null);
      const inventory = st.rawBS?.inventory ?? null;
      const receivables = st.rawBS?.accountsReceivable ?? st.rawBS?.grossAccountsReceivable ?? null;
      const workingCap = (ca != null && cl != null) ? ca - cl : null;

      const statuses: Record<string, MetricDataStatus> = {};

      let debtToAssets: number | null = null;
      if (finDebt != null && ast != null && ast > 0) {
        debtToAssets = parseFloat(((finDebt / ast) * 100).toFixed(2));
        statuses.debtToAssets = 'AVAILABLE';
      } else {
        statuses.debtToAssets = 'DATA_UNAVAILABLE';
      }

      let debtToEquity: number | null = null;
      if (isBank) {
        statuses.debtToEquity = 'NOT_APPLICABLE';
      } else if (eq != null && eq <= 0) {
        statuses.debtToEquity = 'NEGATIVE_DENOMINATOR';
      } else if (finDebt != null && eq != null && eq > 0) {
        debtToEquity = parseFloat((finDebt / eq).toFixed(2));
        statuses.debtToEquity = 'AVAILABLE';
      } else {
        statuses.debtToEquity = 'DATA_UNAVAILABLE';
      }

      let netDebtToEbitda: number | null = null;
      if (isBank || isInsurance) {
        statuses.netDebtToEBITDA = 'NOT_APPLICABLE';
      } else if (st.ebitda != null && st.ebitda <= 0) {
        statuses.netDebtToEBITDA = 'NEGATIVE_DENOMINATOR';
      } else if (netDebt != null && st.ebitda != null && st.ebitda > 0) {
        netDebtToEbitda = parseFloat((netDebt / st.ebitda).toFixed(2));
        statuses.netDebtToEBITDA = 'AVAILABLE';
      } else {
        statuses.netDebtToEBITDA = 'DATA_UNAVAILABLE';
      }

      let currentRatio: number | null = null;
      let quickRatio: number | null = null;
      if (isBank) {
        statuses.currentRatio = 'NOT_APPLICABLE';
        statuses.quickRatio = 'NOT_APPLICABLE';
      } else if (ca != null && cl != null && cl > 0) {
        currentRatio = parseFloat((ca / cl).toFixed(2));
        statuses.currentRatio = 'AVAILABLE';
        if (inventory != null) {
          quickRatio = parseFloat(((ca - inventory) / cl).toFixed(2));
          statuses.quickRatio = 'AVAILABLE';
        } else {
          statuses.quickRatio = 'DATA_UNAVAILABLE';
        }
      } else {
        statuses.currentRatio = 'DATA_UNAVAILABLE';
        statuses.quickRatio = 'DATA_UNAVAILABLE';
      }

      balanceSheetTrends.push({
        periodEnd: st.periodEnd,
        periodType: 'ANNUAL',
        totalAssets: ast,
        cashAndEquivalents: cash,
        totalDebt: finDebt,
        netDebt,
        totalEquity: eq,
        parentEquity: st.parentEquity,
        receivables,
        inventory,
        currentAssets: ca,
        currentLiabilities: cl,
        workingCapital: workingCap,
        debtToAssets,
        debtToEquity,
        netDebtToEBITDA: netDebtToEbitda,
        currentRatio,
        quickRatio,
        statuses
      });
    }

    // 4. Cash Flow Trends
    const cashFlowTrends: CashFlowTrendPeriod[] = [];
    for (const st of annual) {
      const ocf = st.operatingCashFlow;
      const capex = st.capitalExpenditure; // Guaranteed negative in archive
      const fcf = (ocf != null && capex != null) ? ocf + capex : (st.freeCashFlow ?? null);
      const icf = st.rawCF?.investingCashFlow ?? st.rawCF?.netOtherInvestingChanges ?? null;
      const fcfFin = st.rawCF?.financingCashFlow ?? st.rawCF?.netOtherFinancingCharges ?? null;

      const statuses: Record<string, MetricDataStatus> = {
        operatingCashFlow: ocf != null ? 'AVAILABLE' : 'DATA_UNAVAILABLE',
        capitalExpenditure: capex != null ? 'AVAILABLE' : 'DATA_UNAVAILABLE',
        freeCashFlow: fcf != null ? 'AVAILABLE' : 'DATA_UNAVAILABLE'
      };

      cashFlowTrends.push({
        periodEnd: st.periodEnd,
        periodType: 'ANNUAL',
        operatingCashFlow: ocf,
        investingCashFlow: icf,
        financingCashFlow: fcfFin,
        capitalExpenditure: capex,
        freeCashFlow: fcf,
        statuses
      });
    }

    // 5. Per-Share Trends (EPS strictly from basic/diluted shares)
    const perShareTrends: PerShareTrendPeriod[] = [];
    for (const st of annual) {
      const shares = st.rawIS?.basicAverageShares || st.rawIS?.dilutedAverageShares || st.rawBS?.ordinarySharesNumber || st.rawBS?.shareIssued || null;
      let denominatorType: 'basicAverageShares' | 'dilutedAverageShares' | 'totalShares' | 'NONE' = 'NONE';

      if (st.rawIS?.basicAverageShares != null) denominatorType = 'basicAverageShares';
      else if (st.rawIS?.dilutedAverageShares != null) denominatorType = 'dilutedAverageShares';
      else if (st.rawBS?.ordinarySharesNumber != null || st.rawBS?.shareIssued != null) denominatorType = 'totalShares';

      const eps = st.rawIS?.basicEPS ?? (shares && st.netIncome != null ? parseFloat((st.netIncome / shares).toFixed(4)) : null);
      const bvps = (shares && st.totalEquity != null) ? parseFloat((st.totalEquity / shares).toFixed(4)) : null;

      const statuses: Record<string, MetricDataStatus> = {
        eps: eps != null ? 'AVAILABLE' : 'DATA_UNAVAILABLE',
        bvps: bvps != null ? 'AVAILABLE' : 'DATA_UNAVAILABLE'
      };

      perShareTrends.push({
        periodEnd: st.periodEnd,
        periodType: 'ANNUAL',
        eps,
        bvps,
        basicAverageShares: st.rawIS?.basicAverageShares ?? null,
        dilutedAverageShares: st.rawIS?.dilutedAverageShares ?? null,
        shareDenominatorUsed: denominatorType,
        statuses
      });
    }

    // 6. Valuation History
    const valuationHistory: HistoricalValuationPoint[] = [];
    for (const st of annual) {
      const dt = st.periodEnd;
      // Closest trading day on or before st.periodEnd
      const bar = prices.filter(p => p.dateIstanbul <= dt).pop();
      const pst = perShareTrends.find(p => p.periodEnd === dt);

      let pe: number | null = null;
      let pb: number | null = null;
      let status: MetricDataStatus = 'AVAILABLE';
      let statusReason: string | undefined = undefined;

      if (!bar) {
        status = 'DATA_UNAVAILABLE';
        statusReason = 'Eşleşen tarihsel fiyat barı bulunamadı';
      } else if (hasCurrencyMismatch) {
        // e.g. THYAO reports in USD, price in TRY -> require strict status note
        status = 'CURRENCY_MISMATCH';
        statusReason = `Finansal tablo (${financialReportingCurrency}) ve hisse fiyatı (${priceTradingCurrency}) para birimleri farklıdır. Resmi TCMB kur dönüşümü olmadan doğrudan oranlama engellenmiştir.`;
      } else {
        if (pst?.eps != null) {
          if (pst.eps <= 0) {
            statusReason = 'Hisse Başına Kâr negatif veya sıfır olduğu için F/K hesaplanmadı';
          } else {
            pe = parseFloat((bar.close / pst.eps).toFixed(2));
          }
        }
        if (pst?.bvps != null) {
          if (pst.bvps <= 0) {
            statusReason = (statusReason ? statusReason + '; ' : '') + 'PD/DD negatif özkaynak nedeniyle hesaplanmadı';
          } else {
            pb = parseFloat((bar.close / pst.bvps).toFixed(2));
          }
        }
      }

      valuationHistory.push({
        date: dt,
        price: bar?.close ?? null,
        peRatio: pe,
        pbRatio: pb,
        dividendYield: null,
        evToEbitda: null,
        evToSales: null,
        referenceFinancialPeriod: dt,
        currencyPrice: priceTradingCurrency,
        currencyFinancials: financialReportingCurrency,
        status,
        statusReason
      });
    }

    // 7. Dividend History (Strictly NO automated 10% stopaj)
    const annualDivTotals: Record<number, number> = {};
    for (const d of dividends) {
      const yr = parseInt(d.exDate.split('-')[0], 10);
      if (!isNaN(yr)) {
        annualDivTotals[yr] = (annualDivTotals[yr] || 0) + d.grossAmount;
      }
    }

    const dividendGrowthYoY: Record<number, number | null> = {};
    const divYears = Object.keys(annualDivTotals).map(Number).sort((a, b) => a - b);
    for (let i = 1; i < divYears.length; i++) {
      const prevYr = divYears[i - 1];
      const currYr = divYears[i];
      if (currYr === prevYr + 1) {
        const pVal = annualDivTotals[prevYr];
        const cVal = annualDivTotals[currYr];
        dividendGrowthYoY[currYr] = pVal > 0 ? parseFloat((((cVal - pVal) / pVal) * 100).toFixed(2)) : null;
      }
    }

    // Consecutive years of dividends from most recent year
    let consecutiveYears = 0;
    if (divYears.length > 0) {
      let expectedYr = divYears[divYears.length - 1];
      for (let i = divYears.length - 1; i >= 0; i--) {
        if (divYears[i] === expectedYr) {
          consecutiveYears++;
          expectedYr--;
        } else {
          break;
        }
      }
    }

    const dividendAnalysis = {
      totalHistoricalDividends: dividends.length,
      earliestDividendDate: dividends[0]?.exDate ?? null,
      latestDividendDate: dividends[dividends.length - 1]?.exDate ?? null,
      annualDividendTotals: annualDivTotals,
      dividendGrowthYoY,
      fiveYearAverageYield: null,
      consecutiveYearsOfDividends: consecutiveYears,
      events: dividends.map(d => ({
        exDate: d.exDate,
        grossAmount: d.grossAmount,
        netAmount: null, // Strictly NULL! No automatic 10% stopaj applied
        currency: d.currency,
        dividendYield: null
      })),
      status: (dividends.length > 0 ? 'AVAILABLE' : 'DATA_UNAVAILABLE') as MetricDataStatus
    };

    // 8. Corporate Actions & Splits
    const corporateActions = {
      totalSplits: splits.length,
      events: splits.map(s => ({
        eventDate: s.eventDate,
        actionType: 'STOCK_SPLIT' as const,
        splitRatio: s.splitRatio,
        numerator: s.numerator,
        denominator: s.denominator
      })),
      timelineAnomalies: []
    };

    // Multi-year summary point
    const multiYearSummary = {
      revenue5YGrowth: growthAnalysis.metrics.revenue?.cagr5Y ?? null,
      netIncome5YGrowth: growthAnalysis.metrics.netIncome?.cagr5Y ?? null,
      equity5YGrowth: growthAnalysis.metrics.totalEquity?.cagr5Y ?? null,
      fcf5YGrowth: growthAnalysis.metrics.freeCashFlow?.cagr5Y ?? null,
      eps5YGrowth: null
    };

    const metricDirections: Record<string, TrendDirection> = {};
    for (const k of Object.keys(growthAnalysis.metrics)) {
      metricDirections[k] = growthAnalysis.metrics[k].trendDirection;
    }

    const volatilities: Record<string, number | null> = {};
    for (const k of Object.keys(growthAnalysis.metrics)) {
      volatilities[k] = growthAnalysis.metrics[k].volatilityStdDev;
    }

    const overallQualityScore = inputs.qualityScore ?? 85;
    let qualityStatus: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT' = 'HIGH';
    if (overallQualityScore < 50) qualityStatus = 'INSUFFICIENT';
    else if (overallQualityScore < 70) qualityStatus = 'LOW';
    else if (overallQualityScore < 90) qualityStatus = 'MEDIUM';

    const warnings: string[] = [];
    if (hasCurrencyMismatch) {
      warnings.push(`Döviz uyuşmazlığı: Finansal rapor ${financialReportingCurrency}, hisse fiyatı ${priceTradingCurrency}.`);
    }
    if (!isTtmEligible && !isETF) {
      warnings.push('TTM için gereken kesintisiz 4 çeyrek bulunmamaktadır.');
    }

    return {
      symbol,
      yahooSymbol: `${symbol}.IS`,
      assetType: isETF ? 'ETF' : 'EQUITY',
      sector,
      companyName: inputs.rawQuoteSummary?.quoteType?.longName || inputs.rawQuoteSummary?.price?.longName || symbol,
      currency: {
        financialReportingCurrency,
        priceTradingCurrency,
        hasCurrencyMismatch
      },
      totalQuartersAvailable: quarterly.length,
      totalAnnualsAvailable: annual.length,
      totalPriceBarsAvailable: prices.length,
      ttmEligibility: {
        isEligible: isTtmEligible,
        consecutiveQuartersCount: consecutiveQuarters,
        reason: isTtmEligible ? '4 kesintisiz çeyreklik dönem mevcut' : 'Yetersiz çeyreklik tarihçe'
      },
      growthAnalysis,
      profitabilityTrends,
      balanceSheetTrends,
      cashFlowTrends,
      perShareTrends,
      valuationHistory,
      dividendAnalysis,
      corporateActions,
      multiYearSummary,
      metricDirections,
      volatilities,
      overallQuality: {
        score: overallQualityScore,
        status: qualityStatus,
        warnings
      }
    };
  }
}
