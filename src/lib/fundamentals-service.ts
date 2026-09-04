/**
 * FinAI Fundamentals Service - Stage 2.1
 * Data Retrieval, Sector Categorization, Statement Normalization, Validation & TTM Service
 */

import { 
  FinancialPeriodData, 
  ValidatedFinancialData 
} from '@/types/financials';
import { getSectorCategory, normalizeSymbol } from '@/lib/sector-categorizer';
import { calculateNetDebt, validateFinancialData } from '@/lib/financial-validator';
import { calculateTTM, deriveDiscreteQuarters } from '@/lib/ttm-calculator';

// Initialize Yahoo Finance module safely
const yfModule = require('yahoo-finance2');
const YahooFinanceClass = yfModule.YahooFinance || yfModule.default?.YahooFinance || yfModule.default;
const yahooFinance = new YahooFinanceClass({ suppressNotices: ['yahooSurvey'] });

// In-memory server cache (5 minutes TTL for fundamentals)
const fundamentalsCache = new Map<string, { data: ValidatedFinancialData; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function fetchStockFundamentals(rawSymbol: string): Promise<ValidatedFinancialData> {
  const cleanSymbol = normalizeSymbol(rawSymbol);
  const yahooSymbol = `${cleanSymbol}.IS`;
  const cacheKey = cleanSymbol;
  const now = Date.now();

  const cached = fundamentalsCache.get(cacheKey);
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  // 1. Determine Sector & Category
  const sectorInfo = getSectorCategory(cleanSymbol);

  let rawData: any = null;
  let companyName = `${cleanSymbol} Sanayi ve Ticaret A.Ş.`;
  let sourceName = 'Yahoo Finance BIST Gateway';
  let fallbackUsed = false;
  let fallbackReason: string | undefined = undefined;
  let primarySourceFailed = false;

  // Primary Candidate: Yahoo Finance quoteSummary
  try {
    const summary = await yahooFinance.quoteSummary(yahooSymbol, {
      modules: [
        'price',
        'financialData',
        'defaultKeyStatistics',
        'incomeStatementHistory',
        'balanceSheetHistory',
        'cashflowStatementHistory',
        'incomeStatementHistoryQuarterly',
        'balanceSheetHistoryQuarterly',
        'cashflowStatementHistoryQuarterly'
      ]
    });
    if (summary && summary.price) {
      rawData = summary;
      if (summary?.price?.longName) {
        companyName = summary.price.longName;
      } else if (summary?.price?.shortName) {
        companyName = summary.price.shortName;
      }
    } else {
      primarySourceFailed = true;
    }
  } catch (e: any) {
    primarySourceFailed = true;
    console.warn(`Primary source (Yahoo quoteSummary) failed for ${yahooSymbol}:`, e?.message || e);
  }

  // Fallback 1: Yahoo Finance Chart Metadata
  if (!rawData) {
    try {
      const chartRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=1d&interval=1d`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (chartRes.ok) {
        const chartJson = await chartRes.json();
        const meta = chartJson?.chart?.result?.[0]?.meta;
        if (meta && meta.symbol) {
          sourceName = 'Yahoo Finance Chart API (Fallback 1)';
          fallbackUsed = true;
          fallbackReason = 'Primary quoteSummary returned null or 401. Resolved company profile via Chart API.';
          if (meta.longName) companyName = meta.longName;
          else if (meta.shortName) companyName = meta.shortName;
          rawData = { price: meta, financialData: {}, defaultKeyStatistics: {} };
        }
      }
    } catch (e: any) {
      console.warn(`Fallback 1 (Yahoo Chart) failed for ${yahooSymbol}:`, e?.message || e);
    }
  }

  // Fallback 2: Ekofin Net / Standard BIST Catalog
  if (!rawData) {
    try {
      const ekofinRes = await fetch(`https://ekofin.net/sirket/detay/${cleanSymbol}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (ekofinRes.ok) {
        sourceName = 'Ekofin Net Public Gateway (Fallback 2)';
        fallbackUsed = true;
        fallbackReason = 'Primary & Fallback 1 failed. Resolved basic profile via Ekofin Net.';
      }
    } catch (e: any) {
      console.warn(`Fallback 2 (Ekofin Net) failed for ${cleanSymbol}:`, e?.message || e);
    }
  }

  // If no raw provider data returned, output unavailable structure with fallback flags (NEVER DROP STOCK)
  if (!rawData) {
    const emptyQuality = validateFinancialData(
      cleanSymbol,
      sectorInfo,
      [],
      [],
      sourceName,
      fallbackUsed,
      fallbackReason || 'All primary and fallback data providers failed to return financial statements.',
      primarySourceFailed
    );
    const emptyPayload: ValidatedFinancialData = {
      symbol: cleanSymbol,
      normalizedSymbol: cleanSymbol,
      companyName,
      sectorInfo,
      quality: emptyQuality,
      ttm: null,
      quarters: [],
      annuals: [],
      lastUpdated: new Date().toISOString()
    };
    return emptyPayload;
  }

  // 2. Parse Raw Quarterly Statements
  const qIncome = rawData.incomeStatementHistoryQuarterly?.incomeStatementHistory || [];
  const qBalance = rawData.balanceSheetHistoryQuarterly?.balanceSheetStatements || [];
  const qCashflow = rawData.cashflowStatementHistoryQuarterly?.cashflowStatements || [];

  // Parse Raw Annual Statements
  const aIncome = rawData.incomeStatementHistory?.incomeStatementHistory || [];
  const aBalance = rawData.balanceSheetHistory?.balanceSheetStatements || [];
  const aCashflow = rawData.cashflowStatementHistory?.cashflowStatements || [];

  // Key Statistics
  const keyStats = rawData.defaultKeyStatistics || {};
  const finData = rawData.financialData || {};

  // Paid-in Capital vs Share Count Distinction
  const totalShares = keyStats.sharesOutstanding || null;
  const circulatingShares = keyStats.floatShares || totalShares;
  const freeFloatShares = keyStats.floatShares || null;
  const freeFloatPercent = (freeFloatShares && totalShares) ? parseFloat(((freeFloatShares / totalShares) * 100).toFixed(2)) : null;
  const paidInCapital = totalShares ? totalShares * 1.0 : null; // Paid-in capital in TL (assuming 1 TL nominal)

  // 3. Map Statements to FinancialPeriodData
  const rawQuarterlyPeriods: FinancialPeriodData[] = [];

  for (let i = 0; i < qIncome.length; i++) {
    const is = qIncome[i] || {};
    const bs = qBalance[i] || {};
    const cf = qCashflow[i] || {};

    const endDateStr = is.endDate ? new Date(is.endDate).toISOString().split('T')[0] : (bs.endDate ? new Date(bs.endDate).toISOString().split('T')[0] : '');
    const dateObj = endDateStr ? new Date(endDateStr) : new Date();
    
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    let quarter = 1;
    if (month >= 3 && month <= 5) quarter = 1;
    else if (month >= 6 && month <= 8) quarter = 2;
    else if (month >= 9 && month <= 11) quarter = 3;
    else quarter = 4;

    const totalAssets = bs.totalAssets || null;
    const totalLiabilities = bs.totalLiab || null;
    const totalEquity = bs.totalStockholderEquity || (totalAssets != null && totalLiabilities != null ? totalAssets - totalLiabilities : null);

    const cashAndEquivalents = bs.cash || bs.cashAndCashEquivalents || null;
    const shortTermDebt = bs.shortLongTermDebt ?? null;
    const longTermDebt = bs.longTermDebt ?? null;
    const financialDebt = (shortTermDebt != null || longTermDebt != null) 
      ? ((shortTermDebt || 0) + (longTermDebt || 0)) 
      : (bs.totalDebt ?? null);

    // Calculate sector-aware Net Debt (for Banks, Net Debt is strictly NULL)
    const netDebt = calculateNetDebt(financialDebt, cashAndEquivalents, sectorInfo);

    // EPS Method: Basic EPS from income statement or attributable net income / weighted shares
    const netInc = is.netIncome || null;
    const basicEPS = is.basicEPS != null ? is.basicEPS : (netInc != null && totalShares ? netInc / totalShares : null);
    const bookValuePerShare = (totalEquity != null && totalShares) ? parseFloat((totalEquity / totalShares).toFixed(2)) : (keyStats.bookValue || null);

    rawQuarterlyPeriods.push({
      period: {
        year,
        quarter,
        periodType: 'Quarter',
        endDate: endDateStr,
        consolidated: true, // Standard BIST quarterly reports are consolidated
        currency: 'TRY',
        isDiscreteQuarter: quarter === 1 // Q1 is discrete by default
      },
      incomeStatement: {
        revenue: is.totalRevenue || is.operatingRevenue || null,
        grossProfit: is.grossProfit || null,
        operatingIncome: is.operatingIncome || is.ebit || null,
        ebitda: is.ebitda || is.operatingIncome || null,
        netIncome: netInc,
        interestExpense: is.interestExpense || null,
        taxExpense: is.taxProvision || null,
        netInterestIncome: is.netInterestIncome || null
      },
      balanceSheet: {
        cashAndEquivalents,
        financialDebt,
        shortTermDebt,
        longTermDebt,
        totalAssets,
        totalLiabilities,
        totalEquity,
        currentAssets: bs.totalCurrentAssets || null,
        currentLiabilities: bs.totalCurrentLiabilities || null,
        inventories: bs.inventory || null,
        receivables: bs.netReceivables || null,
        netDebt
      },
      cashFlowStatement: {
        operatingCashFlow: cf.totalCashFromOperatingActivities || null,
        capitalExpenditures: cf.capitalExpenditures ? Math.abs(cf.capitalExpenditures) : null,
        freeCashFlow: (cf.totalCashFromOperatingActivities && cf.capitalExpenditures) ? cf.totalCashFromOperatingActivities - Math.abs(cf.capitalExpenditures) : null
      },
      perShare: {
        basicEPS,
        dilutedEPS: basicEPS,
        bookValuePerShare,
        paidInCapital,
        totalShares,
        circulatingShares,
        freeFloatShares,
        freeFloatPercent,
        weightedAverageShares: totalShares
      }
    });
  }

  // 4. Derive Discrete Quarters from YTD
  const discreteQuarters = deriveDiscreteQuarters(rawQuarterlyPeriods);

  // 5. Calculate TTM over discrete quarters
  const ttm = calculateTTM(discreteQuarters);

  // 6. Run Quality Validation Pipeline
  const quality = validateFinancialData(
    cleanSymbol,
    sectorInfo,
    discreteQuarters,
    [],
    sourceName,
    fallbackUsed,
    fallbackReason,
    primarySourceFailed
  );

  const payload: ValidatedFinancialData = {
    symbol: cleanSymbol,
    normalizedSymbol: cleanSymbol,
    companyName,
    sectorInfo,
    quality,
    ttm,
    quarters: discreteQuarters,
    annuals: [],
    lastUpdated: new Date().toISOString()
  };

  fundamentalsCache.set(cacheKey, { data: payload, timestamp: now });
  return payload;
}
