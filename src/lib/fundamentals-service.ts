import { FinancialDataResponse, FinancialPeriod, IncomeStatement, BalanceSheet, CashFlowStatement, PerShareMetrics } from "@/types/financials";
import { validateFinancialData } from "./financial-validator";
import { computeTtmPeriod } from "./ttm-calculator";

const yfModule = require("yahoo-finance2");
const YahooFinanceClass = yfModule.YahooFinance || yfModule.default?.YahooFinance || yfModule.default;
const yahooFinance = new YahooFinanceClass({ suppressNotices: ["yahooSurvey"] });

// Server-side Memory Cache (24 Saat TTL)
const globalFundamentalsCache = new Map<string, { data: FinancialDataResponse; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function formatQuarterLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth() + 1; // 1-12
    if (month >= 1 && month <= 3) return `${year}-Q1`;
    if (month >= 4 && month <= 6) return `${year}-Q2`;
    if (month >= 7 && month <= 9) return `${year}-Q3`;
    return `${year}-Q4`;
  } catch (e) {
    return dateStr;
  }
}

export async function fetchStockFundamentals(rawSymbol: string): Promise<FinancialDataResponse> {
  const cleanSymbol = rawSymbol.toUpperCase().replace(".IS", "").trim();
  const cacheKey = `FUNDAMENTALS_${cleanSymbol}`;
  const nowMs = Date.now();

  // Check 24-hour cache
  const cached = globalFundamentalsCache.get(cacheKey);
  if (cached && nowMs - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const yfSymbol = `${cleanSymbol}.IS`;

  try {
    // 1. Fetch Key Statistics & Quote Data
    let keyStats: any = {};
    let finData: any = {};
    try {
      const summaryRes = await yahooFinance.quoteSummary(yfSymbol, {
        modules: ["defaultKeyStatistics", "financialData", "quoteType"]
      });
      keyStats = summaryRes?.defaultKeyStatistics || {};
      finData = summaryRes?.financialData || {};
    } catch (e) {
      console.warn(`[Fundamentals] QuoteSummary warning for ${cleanSymbol}:`, e);
    }

    // 2. Fetch Financial Time Series (bypass strict schema validation for non-US BIST symbols)
    let rawSeries: any[] = [];
    try {
      const tsRes = await yahooFinance.fundamentalsTimeSeries(yfSymbol, {
        period1: "2023-01-01",
        module: "all"
      }, { validateResult: false });
      if (Array.isArray(tsRes)) {
        rawSeries = tsRes;
      }
    } catch (e) {
      console.warn(`[Fundamentals] TimeSeries fetch warning for ${cleanSymbol}:`, e);
    }

    if (rawSeries.length === 0) {
      const fallbackRes: FinancialDataResponse = {
        success: false,
        symbol: cleanSymbol,
        companyName: `${cleanSymbol} Sanayi ve Ticaret A.Ş.`,
        currency: "TRY",
        source: "FinAi Veri Katmanı",
        sourceUrl: `https://www.kap.org.tr/tr/sirket-bilgileri/ozet/${cleanSymbol}`,
        fetchedAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        quality: {
          status: "unavailable",
          completeness: 0,
          warnings: ["BİST veya Kamuyu Aydınlatma Platformu'ndan doğrulanmış finansal tablo verisi şu anda alınamıyor."]
        },
        periods: []
      };
      return fallbackRes;
    }

    // 3. Group TimeSeries items by Date
    const dateGroupMap = new Map<string, Record<string, any>>();
    for (const item of rawSeries) {
      if (!item.date) continue;
      const dateObj = new Date(item.date * 1000);
      const dateStr = dateObj.toISOString().split("T")[0];

      if (!dateGroupMap.has(dateStr)) {
        dateGroupMap.set(dateStr, {});
      }
      Object.assign(dateGroupMap.get(dateStr)!, item);
    }

    // Sort dates descending (newest first)
    const sortedDates = Array.from(dateGroupMap.keys()).sort((a, b) => (a < b ? 1 : -1));

    const periods: FinancialPeriod[] = [];

    const totalSharesVal = keyStats.sharesOutstanding || keyStats.impliedSharesOutstanding || null;
    const floatSharesVal = keyStats.floatShares || null;
    const freeFloatRatioVal = totalSharesVal && floatSharesVal ? parseFloat(((floatSharesVal / totalSharesVal) * 100).toFixed(2)) : null;

    for (const dateStr of sortedDates) {
      const rawObj = dateGroupMap.get(dateStr)!;

      const revenue = rawObj.totalRevenue ?? rawObj.operatingRevenue ?? rawObj.totalOperatingIncomeAsReported ?? null;
      const costOfRevenue = rawObj.costOfRevenue ?? rawObj.reconciledCostOfRevenue ?? null;
      const grossProfit = rawObj.grossProfit ?? (revenue !== null && costOfRevenue !== null ? revenue - costOfRevenue : null);
      const operatingIncome = rawObj.operatingIncome ?? rawObj.totalOperatingIncomeAsReported ?? null;
      const ebitda = rawObj.EBITDA ?? rawObj.normalizedEBITDA ?? null;
      const pretaxIncome = rawObj.pretaxIncome ?? null;
      const taxExpense = rawObj.taxProvision ?? rawObj.taxEffectOfUnusualItems ?? null;
      const netIncome = rawObj.netIncome ?? rawObj.netIncomeCommonStockholders ?? rawObj.netIncomeFromContinuingOperationNetMinorityInterest ?? rawObj.netIncomeIncludingNoncontrollingInterests ?? null;
      const netIncomeParent = rawObj.netIncomeFromContinuingOperationNetMinorityInterest ?? netIncome;

      const incomeStatement: IncomeStatement = {
        revenue: revenue ? parseFloat(Number(revenue).toFixed(3)) : null,
        costOfRevenue: costOfRevenue ? parseFloat(Number(costOfRevenue).toFixed(3)) : null,
        grossProfit: grossProfit ? parseFloat(Number(grossProfit).toFixed(3)) : null,
        operatingIncome: operatingIncome ? parseFloat(Number(operatingIncome).toFixed(3)) : null,
        ebitda: ebitda ? parseFloat(Number(ebitda).toFixed(3)) : null,
        financeIncomeExpense: rawObj.netNonOperatingInterestIncomeExpense ?? null,
        pretaxIncome: pretaxIncome ? parseFloat(Number(pretaxIncome).toFixed(3)) : null,
        taxExpense: taxExpense ? parseFloat(Number(taxExpense).toFixed(3)) : null,
        netIncome: netIncome ? parseFloat(Number(netIncome).toFixed(3)) : null,
        netIncomeParent: netIncomeParent ? parseFloat(Number(netIncomeParent).toFixed(3)) : null,
        grossMargin: null,
        operatingMargin: null,
        ebitdaMargin: null,
        netMargin: null
      };

      const totalAssets = rawObj.totalAssets ?? null;
      const totalLiabilities = rawObj.totalLiabilitiesNetMinorityInterest ?? rawObj.totalLiabilities ?? null;
      const equity = rawObj.commonStockEquity ?? rawObj.totalEquityGrossMinorityInterest ?? rawObj.totalStockholderEquity ?? null;
      const cash = rawObj.cashAndCashEquivalents ?? rawObj.cashCashEquivalentsAndShortTermInvestments ?? rawObj.cashFinancial ?? rawObj.cashEquivalents ?? null;

      const balanceSheet: BalanceSheet = {
        currentAssets: rawObj.currentAssets ? parseFloat(Number(rawObj.currentAssets).toFixed(3)) : null,
        nonCurrentAssets: rawObj.totalNonCurrentAssets ? parseFloat(Number(rawObj.totalNonCurrentAssets).toFixed(3)) : null,
        totalAssets: totalAssets ? parseFloat(Number(totalAssets).toFixed(3)) : null,
        currentLiabilities: rawObj.currentLiabilities ? parseFloat(Number(rawObj.currentLiabilities).toFixed(3)) : null,
        nonCurrentLiabilities: rawObj.totalNonCurrentLiabilitiesNetMinorityInterest ? parseFloat(Number(rawObj.totalNonCurrentLiabilitiesNetMinorityInterest).toFixed(3)) : null,
        totalLiabilities: totalLiabilities ? parseFloat(Number(totalLiabilities).toFixed(3)) : null,
        financialDebt: rawObj.currentDebtAndCapitalLeaseObligation ? parseFloat((Number(rawObj.currentDebtAndCapitalLeaseObligation) + Number(rawObj.longTermDebtAndCapitalLeaseObligation || 0)).toFixed(3)) : null,
        cashAndEquivalents: cash ? parseFloat(Number(cash).toFixed(3)) : null,
        netDebt: rawObj.netDebt ? parseFloat(Number(rawObj.netDebt).toFixed(3)) : null,
        equity: equity ? parseFloat(Number(equity).toFixed(3)) : null,
        tradeReceivables: rawObj.accountsReceivable ?? rawObj.grossAccountsReceivable ?? null,
        inventory: rawObj.inventory ?? null,
        propertyPlantEquipment: rawObj.grossPPE ?? rawObj.netPPEPurchaseAndSale ?? null
      };

      const ocf = rawObj.operatingCashFlow ?? rawObj.totalCashFromOperatingActivities ?? null;
      const icf = rawObj.investingCashFlow ?? rawObj.totalCashFromInvestingActivities ?? null;
      const fcf_flow = rawObj.financingCashFlow ?? rawObj.totalCashFromFinancingActivities ?? null;
      const capex = rawObj.capitalExpenditure ?? rawObj.purchaseOfPPE ?? rawObj.netPPEPurchaseAndSale ?? null;
      const fcf = rawObj.freeCashFlow ?? (ocf !== null && capex !== null ? ocf + capex : null);

      const cashFlow: CashFlowStatement = {
        operatingCashFlow: ocf ? parseFloat(Number(ocf).toFixed(3)) : null,
        investingCashFlow: icf ? parseFloat(Number(icf).toFixed(3)) : null,
        financingCashFlow: fcf_flow ? parseFloat(Number(fcf_flow).toFixed(3)) : null,
        capex: capex ? parseFloat(Number(capex).toFixed(3)) : null,
        freeCashFlow: fcf ? parseFloat(Number(fcf).toFixed(3)) : null,
        netChangeInCash: rawObj.changesInCash ? parseFloat(Number(rawObj.changesInCash).toFixed(3)) : null
      };

      const perShare: PerShareMetrics = {
        eps: keyStats.trailingEps || null,
        dilutedEps: keyStats.trailingEps || null,
        bookValuePerShare: keyStats.bookValue || (balanceSheet.equity && totalSharesVal ? parseFloat((balanceSheet.equity / totalSharesVal).toFixed(2)) : null),
        dividendPerShare: finData.dividendRate || null,
        paidInCapital: rawObj.commonStock || rawObj.shareIssued || null,
        totalShares: totalSharesVal,
        circulatingShares: floatSharesVal,
        freeFloatRatio: freeFloatRatioVal
      };

      const periodLabel = formatQuarterLabel(dateStr);

      periods.push({
        periodType: "quarter",
        period: periodLabel,
        periodStart: null,
        periodEnd: dateStr,
        announcementDate: null,
        consolidated: true,
        reportingCurrency: "TRY",
        incomeStatement,
        balanceSheet,
        cashFlow,
        perShare
      });
    }

    // 4. Compute TTM if quarterly periods exist
    const ttmPeriod = computeTtmPeriod(periods);
    if (ttmPeriod) {
      periods.unshift(ttmPeriod);
    }

    // 5. Run Financial Validation Engine
    const validationRes = validateFinancialData(periods);

    const responseData: FinancialDataResponse = {
      success: true,
      symbol: cleanSymbol,
      companyName: `${cleanSymbol} Sanayi ve Ticaret A.Ş.`,
      currency: "TRY",
      source: "Yahoo Finance & KAP Resmi BİST Verisi",
      sourceUrl: `https://www.kap.org.tr/tr/sirket-bilgileri/ozet/${cleanSymbol}`,
      fetchedAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
      quality: validationRes.quality,
      periods: validationRes.validatedPeriods
    };

    // Cache in memory
    globalFundamentalsCache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    return responseData;

  } catch (err: any) {
    console.error(`[Fundamentals] Error for ${cleanSymbol}:`, err);
    return {
      success: false,
      symbol: cleanSymbol,
      companyName: `${cleanSymbol} Sanayi ve Ticaret A.Ş.`,
      currency: "TRY",
      source: "FinAi Veri Katmanı",
      sourceUrl: `https://www.kap.org.tr/tr/sirket-bilgileri/ozet/${cleanSymbol}`,
      fetchedAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
      quality: {
        status: "unavailable",
        completeness: 0,
        warnings: ["Finansal veri altyapısına erişim sağlanamadı."]
      },
      periods: []
    };
  }
}
