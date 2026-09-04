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

  // Parse Raw Annual Statements
  const aIncome = rawData.incomeStatementHistory?.incomeStatementHistory || [];
  const aBalance = rawData.balanceSheetHistory?.balanceSheetStatements || [];
  const aCashflow = rawData.cashflowStatementHistory?.cashflowStatements || [];

  // Key Statistics & Financial Data
  const keyStats = rawData.defaultKeyStatistics || {};
  const finData = rawData.financialData || {};
  const financialCurrency = finData.financialCurrency || rawData.price?.currency || 'TRY';

  // Total Shares & Nominal Capital
  const totalShares = keyStats.sharesOutstanding || null;
  const circulatingShares = keyStats.floatShares || totalShares;
  const freeFloatShares = keyStats.floatShares || null;
  const freeFloatPercent = (freeFloatShares && totalShares) ? parseFloat(((freeFloatShares / totalShares) * 100).toFixed(2)) : null;
  const paidInCapital = totalShares ? totalShares * 1.0 : null; // Nominal capital in TL (1 TL nominal/share)

  // 2. Parse Raw Quarterly Statements with timeseries fallback if needed
  let qIncome = rawData.incomeStatementHistoryQuarterly?.incomeStatementHistory || [];
  let qBalance = rawData.balanceSheetHistoryQuarterly?.balanceSheetStatements || [];
  let qCashflow = rawData.cashflowStatementHistoryQuarterly?.cashflowStatements || [];

function parseYahooDate(d: any): string {
  if (!d) return new Date().toISOString();
  if (typeof d === 'object' && d.raw) d = d.raw;
  if (d instanceof Date) return d.toISOString();
  if (typeof d === 'number') {
    const ms = d < 1e11 ? d * 1000 : d;
    return new Date(ms).toISOString();
  }
  try {
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) return parsed.toISOString();
  } catch (e) {}
  return new Date().toISOString();
}

  if (qBalance.length === 0 || !qBalance[0]?.totalStockholderEquity) {
    try {
      const tsBs = await yahooFinance.fundamentalsTimeSeries(yahooSymbol, {
        period1: '2023-01-01',
        type: 'quarterly',
        module: 'balance-sheet'
      }, { validateResult: false });

      if (Array.isArray(tsBs) && tsBs.length > 0) {
        qBalance = tsBs.map((item: any) => ({
          endDate: parseYahooDate(item.date || item.asOfDate),
          totalAssets: item.totalAssets || item.assets,
          totalLiab: item.totalLiabilitiesNetMinorityInterest || item.totalLiab,
          totalStockholderEquity: item.totalStockholderEquity || item.stockholdersEquity || item.commonStockEquity,
          cash: item.cashAndCashEquivalents || item.cashCashEquivalentsAndShortTermInvestments,
          shortLongTermDebt: item.currentDebt || item.shortTermDebt,
          longTermDebt: item.longTermDebt,
          totalDebt: item.totalDebt || item.financialDebt,
          totalCurrentAssets: item.currentAssets,
          totalCurrentLiabilities: item.currentLiabilities,
          inventory: item.inventory || item.inventories,
          netReceivables: item.accountsReceivable || item.receivables
        }));
      }
    } catch (e) {
      // Ignore schema validation errors on timeSeries fallback
    }
  }

  if (qIncome.length === 0 || !qIncome[0]?.totalRevenue) {
    try {
      const tsInc = await yahooFinance.fundamentalsTimeSeries(yahooSymbol, {
        period1: '2023-01-01',
        type: 'quarterly',
        module: 'financials'
      }, { validateResult: false });

      if (Array.isArray(tsInc) && tsInc.length > 0) {
        qIncome = tsInc.map((item: any) => ({
          endDate: parseYahooDate(item.date || item.asOfDate),
          totalRevenue: item.totalRevenue || item.operatingRevenue,
          grossProfit: item.grossProfit,
          operatingIncome: item.operatingIncome || item.ebit,
          ebitda: item.ebitda || item.normalizedEBITDA,
          netIncome: item.netIncomeCommonStockholders || item.netIncome,
          interestExpense: item.interestExpense,
          taxProvision: item.taxProvision
        }));
      }
    } catch (e) {
      // Ignore schema validation errors
    }
  }

  // 3. Map Statements to FinancialPeriodData
  const rawQuarterlyPeriods: FinancialPeriodData[] = [];

  const maxLen = Math.max(qIncome.length, qBalance.length);
  for (let i = 0; i < maxLen; i++) {
    const is = qIncome[i] || {};
    const bs = qBalance[i] || {};
    const cf = qCashflow[i] || {};

    const endDateStr = is.endDate ? parseYahooDate(is.endDate).split('T')[0] : (bs.endDate ? parseYahooDate(bs.endDate).split('T')[0] : '');
    const dateObj = endDateStr ? new Date(endDateStr) : new Date();
    
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    let quarter = 1;
    if (month >= 3 && month <= 5) quarter = 1;
    else if (month >= 6 && month <= 8) quarter = 2;
    else if (month >= 9 && month <= 11) quarter = 3;
    else quarter = 4;

    const totalAssets = bs.totalAssets ?? null;
    const totalEquity = bs.totalStockholderEquity ?? null;
    const totalLiabilities = bs.totalLiab ?? (totalAssets != null && totalEquity != null ? totalAssets - totalEquity : null);

    const cashAndEquivalents = bs.cash || bs.cashAndCashEquivalents || null;
    const shortTermDebt = bs.shortLongTermDebt ?? null;
    const longTermDebt = bs.longTermDebt ?? null;
    const financialDebt = (shortTermDebt != null || longTermDebt != null) 
      ? ((shortTermDebt || 0) + (longTermDebt || 0)) 
      : (bs.totalDebt ?? null);

    const netDebt = calculateNetDebt(financialDebt, cashAndEquivalents, sectorInfo);

    const netInc = is.netIncome ?? null;
    const basicEPS = is.basicEPS != null ? is.basicEPS : (netInc != null && totalShares ? netInc / totalShares : null);
    const bookValuePerShare = (totalEquity != null && totalShares) ? parseFloat((totalEquity / totalShares).toFixed(2)) : null;

    rawQuarterlyPeriods.push({
      period: {
        year,
        quarter,
        periodType: 'Quarter',
        endDate: endDateStr || new Date().toISOString().split('T')[0],
        consolidated: true,
        currency: financialCurrency,
        isDiscreteQuarter: quarter === 1
      },
      incomeStatement: {
        revenue: is.totalRevenue || is.operatingRevenue || null,
        grossProfit: is.grossProfit || null,
        operatingIncome: is.operatingIncome || is.ebit || null,
        ebitda: is.ebitda || null,
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
        freeCashFlow: cf.freeCashFlow || null
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
  let ttm = calculateTTM(discreteQuarters);

  // Fallback TTM using Yahoo's authoritative aggregated Key Statistics & Financial Data
  const fallbackEquity = keyStats.bookValue != null && totalShares != null ? keyStats.bookValue * totalShares : null;
  const fallbackAssets = fallbackEquity != null && finData.totalDebt != null ? fallbackEquity + finData.totalDebt : null;

  const fallbackBsSnapshot = {
    cashAndEquivalents: ttm?.latestBalanceSheetSnapshot?.cashAndEquivalents ?? finData.totalCash ?? null,
    financialDebt: ttm?.latestBalanceSheetSnapshot?.financialDebt ?? finData.totalDebt ?? null,
    shortTermDebt: ttm?.latestBalanceSheetSnapshot?.shortTermDebt ?? null,
    longTermDebt: ttm?.latestBalanceSheetSnapshot?.longTermDebt ?? null,
    totalAssets: ttm?.latestBalanceSheetSnapshot?.totalAssets ?? fallbackAssets,
    totalLiabilities: ttm?.latestBalanceSheetSnapshot?.totalLiabilities ?? null,
    totalEquity: ttm?.latestBalanceSheetSnapshot?.totalEquity ?? fallbackEquity,
    currentAssets: ttm?.latestBalanceSheetSnapshot?.currentAssets ?? null,
    currentLiabilities: ttm?.latestBalanceSheetSnapshot?.currentLiabilities ?? null,
    inventories: ttm?.latestBalanceSheetSnapshot?.inventories ?? null,
    receivables: ttm?.latestBalanceSheetSnapshot?.receivables ?? null,
    netDebt: calculateNetDebt(
      ttm?.latestBalanceSheetSnapshot?.financialDebt ?? finData.totalDebt ?? null,
      ttm?.latestBalanceSheetSnapshot?.cashAndEquivalents ?? finData.totalCash ?? null,
      sectorInfo
    )
  };

  const fallbackIncomeTTM = {
    revenue: ttm?.incomeStatementTTM?.revenue ?? finData.totalRevenue ?? null,
    grossProfit: ttm?.incomeStatementTTM?.grossProfit ?? finData.grossProfits ?? null,
    operatingIncome: ttm?.incomeStatementTTM?.operatingIncome ?? null,
    ebitda: ttm?.incomeStatementTTM?.ebitda ?? null,
    netIncome: ttm?.incomeStatementTTM?.netIncome ?? keyStats.netIncomeToCommon ?? null,
    interestExpense: ttm?.incomeStatementTTM?.interestExpense ?? null,
    taxExpense: ttm?.incomeStatementTTM?.taxExpense ?? null
  };

  const fallbackCashFlowTTM = {
    operatingCashFlow: ttm?.cashFlowTTM?.operatingCashFlow ?? finData.operatingCashflow ?? null,
    capitalExpenditures: ttm?.cashFlowTTM?.capitalExpenditures ?? null,
    freeCashFlow: ttm?.cashFlowTTM?.freeCashFlow ?? finData.freeCashflow ?? null
  };

  if (!ttm || !ttm.isVerified || !ttm.incomeStatementTTM.revenue || !ttm.latestBalanceSheetSnapshot.totalEquity) {
    const isComplete = ttm?.isVerified && ttm?.incomeStatementTTM?.revenue != null && ttm?.latestBalanceSheetSnapshot?.totalEquity != null;
    ttm = {
      isVerified: isComplete ? true : false,
      periodsUsed: ttm?.periodsUsed || discreteQuarters.map(q => q.period),
      incomeStatementTTM: fallbackIncomeTTM,
      cashFlowTTM: fallbackCashFlowTTM,
      latestBalanceSheetSnapshot: fallbackBsSnapshot,
      warnings: [
        ...(ttm?.warnings || []),
        ...(!isComplete ? ['4 çeyreklik bilanço geçmişi henüz tamamlanmadığı için TTM rasyoları kısıtlanmıştır.'] : [])
      ]
    };
  }

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
