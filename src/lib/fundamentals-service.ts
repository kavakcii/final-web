/**
 * FinAI Fundamentals Service - Stage 5B
 * Resilient Historical Financial Repository, Multi-Period Statements, Quality Engine, & Adapter Orchestrator
 */

import { 
  FinancialPeriodData, 
  ValidatedFinancialData,
  HistoricalDividendRecord
} from '@/types/financials';
import { getSectorCategory, normalizeSymbol } from '@/lib/sector-categorizer';
import { validateFinancialData } from '@/lib/financial-validator';
import { calculateTTM } from '@/lib/ttm-calculator';
import { YahooFinanceAdapter } from '@/lib/adapters/yahoo-finance.adapter';
import { TradingViewAdapter } from '@/lib/adapters/tradingview.adapter';
import { supabase } from '@/lib/supabase';

// In-memory server cache (10 minutes TTL for active fundamentals)
const fundamentalsCache = new Map<string, { data: ValidatedFinancialData; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

const yahooAdapter = new YahooFinanceAdapter();
const tradingViewAdapter = new TradingViewAdapter();

/**
 * Persists normalized statements and provenance to Supabase historical archive asynchronously (non-blocking)
 */
async function persistToSupabaseArchive(data: ValidatedFinancialData, provenance: any[] = []): Promise<void> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      return; // Skip if Supabase is not configured
    }

    const cleanSymbol = data.normalizedSymbol;
    const now = new Date().toISOString();

    // 1. Persist Raw Provenance Payloads
    for (const prov of provenance) {
      try {
        await supabase.from('raw_source_payloads').insert({
          source: prov.source,
          source_url: prov.sourceUrl || null,
          symbol: cleanSymbol,
          endpoint: prov.endpoint,
          response_hash: prov.responseHash,
          http_status: prov.httpStatus || 200,
          fetched_at: prov.fetchedAt || now,
          raw_payload: prov.rawPayload
        });
      } catch (e) {}
    }

    // 2. Persist Normalized Periods (Quarterly & Annual)
    const allPeriods = [
      ...data.quarters.map(q => ({ ...q, periodType: 'QUARTERLY' })),
      ...data.annuals.map(a => ({ ...a, periodType: 'ANNUAL' }))
    ];

    for (const item of allPeriods) {
      const p = item.period;
      const is = item.incomeStatement;
      const bs = item.balanceSheet;
      const cf = item.cashFlowStatement;
      const ps = item.perShare;

      try {
        await supabase.from('financial_statement_periods').upsert({
          symbol: cleanSymbol,
          company_name: data.companyName,
          period_type: p.periodType,
          period_start: p.startDate || null,
          period_end: p.endDate,
          fiscal_year: p.year,
          fiscal_quarter: p.quarter,
          report_date: p.endDate,
          statement_type: 'CONSOLIDATED',
          consolidation_type: 'CONSOLIDATED',
          currency: p.currency || 'TRY',
          source_currency: p.sourceCurrency || p.currency || 'TRY',
          reported_currency: p.reportedCurrency || p.currency || 'TRY',
          source: data.quality.sourceMetadata.source || 'Yahoo Finance BIST Gateway',
          validation_status: data.quality.validationStatus || 'VALID',
          quality_score: data.quality.completenessScore,
          is_restated: p.isRestated || false,
          is_current: true,
          version: p.version || 1,
          
          // Flow Items
          revenue: is.revenue,
          cost_of_revenue: is.costOfRevenue,
          gross_profit: is.grossProfit,
          operating_income: is.operatingIncome,
          ebitda: is.ebitda,
          pretax_income: is.pretaxIncome,
          tax_expense: is.taxExpense,
          net_income: is.netIncome,
          net_income_to_parent: is.netIncomeToParent,

          // Balance Sheet Items
          cash_and_equivalents: bs.cashAndEquivalents,
          total_current_assets: bs.currentAssets,
          total_assets: bs.totalAssets,
          current_liabilities: bs.currentLiabilities,
          total_liabilities: bs.totalLiabilities,
          total_equity: bs.totalEquity,
          parent_equity: bs.parentEquity,
          financial_debt: bs.financialDebt,
          net_debt: bs.netDebt,

          // Cash Flow Items
          operating_cash_flow: cf.operatingCashFlow,
          investing_cash_flow: cf.investingCashFlow,
          financing_cash_flow: cf.financingCashFlow,
          capital_expenditures: cf.capitalExpenditures,
          free_cash_flow: cf.freeCashFlow,
          dividends_paid: cf.dividendsPaid,
          net_change_in_cash: cf.netChangeInCash,

          // Per Share Items
          weighted_average_shares: ps.weightedAverageShares,
          diluted_weighted_average_shares: ps.weightedAverageShares,
          total_shares: ps.totalShares,
          circulating_shares: ps.circulatingShares,
          free_float_shares: ps.freeFloatShares,
          eps: ps.basicEPS,
          diluted_eps: ps.dilutedEPS,
          bvps: ps.bookValuePerShare,
          paid_in_capital: ps.paidInCapital,

          // Raw Details
          income_statement_details: is,
          balance_sheet_details: bs,
          cash_flow_details: cf,
          per_share_details: ps,

          fetched_at: data.quality.sourceMetadata.fetchedAt,
          last_verified_at: data.quality.sourceMetadata.verifiedAt,
          updated_at: now
        }, { onConflict: 'symbol,period_type,period_end,statement_type,version' });
      } catch (e) {}
    }

    // 3. Persist Historical Dividends
    if (data.dividends && data.dividends.length > 0) {
      for (const div of data.dividends) {
        try {
          await supabase.from('historical_dividends').upsert({
            symbol: cleanSymbol,
            company_name: data.companyName,
            ex_date: div.exDate,
            record_date: div.recordDate || null,
            payment_date: div.paymentDate || null,
            announcement_date: div.announcementDate || null,
            gross_amount: div.grossAmount,
            net_amount: div.netAmount || null,
            currency: div.currency || 'TRY',
            source: div.source || 'Yahoo Finance Events API',
            source_url: div.sourceUrl || null,
            validation_status: div.validationStatus || 'VALID',
            is_current: true,
            version: 1,
            fetched_at: now,
            last_verified_at: now,
            updated_at: now
          }, { onConflict: 'symbol,ex_date,source,version' });
        } catch (e) {}
      }
    }
  } catch (err: any) {
    console.warn(`[FundamentalsService] Supabase archive write error for ${data.symbol}:`, err?.message || err);
  }
}

/**
 * Main Entry Point: Fetches Multi-Period Stock Fundamentals, Statements, & Dividends
 */
export async function fetchStockFundamentals(rawSymbol: string): Promise<ValidatedFinancialData> {
  const cleanSymbol = normalizeSymbol(rawSymbol);
  const cacheKey = cleanSymbol;
  const now = Date.now();

  // 1. Check In-Memory Server Cache
  const cached = fundamentalsCache.get(cacheKey);
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  // 2. Fetch via Primary Source Adapter (Yahoo Finance)
  const sectorInfo = getSectorCategory(cleanSymbol);
  let adapterStatements: any = null;
  let primarySourceFailed = false;

  try {
    adapterStatements = await yahooAdapter.getFinancialStatements(cleanSymbol);
  } catch (e: any) {
    primarySourceFailed = true;
    console.warn(`[FundamentalsService] Primary source failed for ${cleanSymbol}:`, e?.message || e);
  }

  // If primary adapter returned statements
  if (adapterStatements && (adapterStatements.quarters.length > 0 || adapterStatements.annuals.length > 0)) {
    const quarters: FinancialPeriodData[] = adapterStatements.quarters;
    const annuals: FinancialPeriodData[] = adapterStatements.annuals;
    const dividends: HistoricalDividendRecord[] = adapterStatements.dividends || [];
    const companyName = adapterStatements.metadata.companyName;

    // Calculate TTM over 4 discrete quarters
    let ttm = calculateTTM(quarters);

    // Cross-check with TradingView Scanner for live valuation & completeness check
    if (!ttm || !ttm.isVerified || ttm.incomeStatementTTM.revenue == null) {
      const tvSnapshot = await tradingViewAdapter.getCurrentSnapshot(cleanSymbol);
      if (tvSnapshot && tvSnapshot.ttmRevenue != null) {
        const fallbackBs = {
          cashAndEquivalents: ttm?.latestBalanceSheetSnapshot?.cashAndEquivalents ?? null,
          financialDebt: ttm?.latestBalanceSheetSnapshot?.financialDebt ?? tvSnapshot.totalDebt ?? null,
          shortTermDebt: ttm?.latestBalanceSheetSnapshot?.shortTermDebt ?? null,
          longTermDebt: ttm?.latestBalanceSheetSnapshot?.longTermDebt ?? null,
          totalAssets: ttm?.latestBalanceSheetSnapshot?.totalAssets ?? tvSnapshot.totalAssets ?? null,
          totalLiabilities: ttm?.latestBalanceSheetSnapshot?.totalLiabilities ?? null,
          totalEquity: ttm?.latestBalanceSheetSnapshot?.totalEquity ?? null,
          currentAssets: ttm?.latestBalanceSheetSnapshot?.currentAssets ?? null,
          currentLiabilities: ttm?.latestBalanceSheetSnapshot?.currentLiabilities ?? null,
          inventories: ttm?.latestBalanceSheetSnapshot?.inventories ?? null,
          receivables: ttm?.latestBalanceSheetSnapshot?.receivables ?? null,
          netDebt: ttm?.latestBalanceSheetSnapshot?.netDebt ?? null
        };

        const fallbackIncome = {
          revenue: ttm?.incomeStatementTTM?.revenue ?? tvSnapshot.ttmRevenue ?? null,
          costOfRevenue: ttm?.incomeStatementTTM?.costOfRevenue ?? null,
          grossProfit: ttm?.incomeStatementTTM?.grossProfit ?? null,
          operatingIncome: ttm?.incomeStatementTTM?.operatingIncome ?? null,
          ebitda: ttm?.incomeStatementTTM?.ebitda ?? null,
          pretaxIncome: ttm?.incomeStatementTTM?.pretaxIncome ?? null,
          taxExpense: ttm?.incomeStatementTTM?.taxExpense ?? null,
          netIncome: ttm?.incomeStatementTTM?.netIncome ?? tvSnapshot.ttmNetIncome ?? null,
          netIncomeToParent: ttm?.incomeStatementTTM?.netIncomeToParent ?? tvSnapshot.ttmNetIncome ?? null
        };

        ttm = {
          isVerified: quarters.length >= 4,
          periodsUsed: ttm?.periodsUsed || quarters.slice(0, 4).map(q => q.period),
          incomeStatementTTM: fallbackIncome,
          cashFlowTTM: ttm?.cashFlowTTM || {
            operatingCashFlow: null,
            capitalExpenditures: null,
            freeCashFlow: null
          },
          latestBalanceSheetSnapshot: fallbackBs,
          warnings: [
            ...(ttm?.warnings || []),
            ...(quarters.length < 4 ? ['Son 4 çeyreklik geçmiş tamamlanmadığı için TTM göstergeleri kısmi hesaplanmıştır.'] : [])
          ]
        };
      }
    }

    // Run Full Quality Validation Pipeline
    const quality = validateFinancialData(
      cleanSymbol,
      sectorInfo,
      quarters,
      annuals,
      'Yahoo Finance BIST Gateway',
      false,
      undefined,
      false
    );

    const payload: ValidatedFinancialData = {
      symbol: cleanSymbol,
      normalizedSymbol: cleanSymbol,
      companyName,
      sectorInfo,
      quality,
      ttm,
      quarters,
      annuals,
      dividends,
      lastUpdated: new Date().toISOString()
    };

    // Store in In-Memory Server Cache
    fundamentalsCache.set(cacheKey, { data: payload, timestamp: now });

    // Persist to Supabase Archive (non-blocking)
    persistToSupabaseArchive(payload, adapterStatements.provenance);

    return payload;
  }

  // Fallback: If primary source failed, try TradingView for basic profile (NEVER INVENT HISTORICAL SERIES)
  const tvSnapshot = await tradingViewAdapter.getCurrentSnapshot(cleanSymbol);
  const companyName = `${cleanSymbol} Sanayi ve Ticaret A.Ş.`;

  const emptyQuality = validateFinancialData(
    cleanSymbol,
    sectorInfo,
    [],
    [],
    tvSnapshot ? 'TradingView Scanner API (Fallback)' : 'FinAI Primary Data Gateway',
    tvSnapshot != null,
    tvSnapshot ? 'Primary source failed. Resolved current market snapshot via TradingView Scanner.' : 'All financial data sources returned empty.',
    primarySourceFailed
  );

  const fallbackPayload: ValidatedFinancialData = {
    symbol: cleanSymbol,
    normalizedSymbol: cleanSymbol,
    companyName,
    sectorInfo,
    quality: emptyQuality,
    ttm: tvSnapshot && tvSnapshot.ttmRevenue != null ? {
      isVerified: false,
      periodsUsed: [],
      incomeStatementTTM: {
        revenue: tvSnapshot.ttmRevenue,
        grossProfit: null,
        operatingIncome: null,
        ebitda: null,
        netIncome: tvSnapshot.ttmNetIncome
      },
      cashFlowTTM: {
        operatingCashFlow: null,
        capitalExpenditures: null,
        freeCashFlow: null
      },
      latestBalanceSheetSnapshot: {
        cashAndEquivalents: null,
        financialDebt: tvSnapshot.totalDebt,
        shortTermDebt: null,
        longTermDebt: null,
        totalAssets: tvSnapshot.totalAssets,
        totalLiabilities: null,
        totalEquity: null,
        currentAssets: null,
        currentLiabilities: null,
        inventories: null,
        receivables: null,
        netDebt: null
      },
      warnings: ['Tarihsel çeyreklik veriler bulunamadığı için TTM göstergesi salt anlık piyasa tarayıcısından alınmıştır.']
    } : null,
    quarters: [],
    annuals: [],
    dividends: [],
    lastUpdated: new Date().toISOString()
  };

  fundamentalsCache.set(cacheKey, { data: fallbackPayload, timestamp: now });
  return fallbackPayload;
}
