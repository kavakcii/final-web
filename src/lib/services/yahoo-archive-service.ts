/**
 * FinAI Phase 3 Historical Archive Storage Service
 * Unified, idempotent persistence layer for:
 * 1. symbol_mappings
 * 2. raw_source_payloads / raw_yahoo_payloads
 * 3. financial_statement_periods
 * 4. historical_prices
 * 5. dividend_events
 * 6. split_events
 * 7. company_profiles
 * 8. ownership_snapshots
 * 9. analyst_estimates
 * 
 * Supports dual-write: Supabase (when tables are active) + Local Persistent JSON Archive (fail-safe audit)
 */

import { supabase } from '@/lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

const LOCAL_ARCHIVE_DIR = path.join(process.cwd(), '.finai_archive');

// Ensure local archive directories exist
function ensureDirs() {
  if (!fs.existsSync(LOCAL_ARCHIVE_DIR)) {
    fs.mkdirSync(LOCAL_ARCHIVE_DIR, { recursive: true });
  }
  const subdirs = ['raw_payloads', 'statements', 'prices', 'dividends', 'splits', 'profiles', 'ownership', 'estimates', 'mappings'];
  for (const s of subdirs) {
    const p = path.join(LOCAL_ARCHIVE_DIR, s);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  }
}

export class Phase3ArchiveService {
  constructor() {
    ensureDirs();
  }

  /**
   * 1. Save Symbol Mapping
   */
  async saveSymbolMapping(mapping: {
    finaiSymbol: string;
    yahooSymbol: string;
    companyName: string;
    sectorCategory: string;
    yahooSector?: string;
    yahooIndustry?: string;
  }): Promise<void> {
    // Local JSON
    const localFile = path.join(LOCAL_ARCHIVE_DIR, 'mappings', `${mapping.finaiSymbol}.json`);
    fs.writeFileSync(localFile, JSON.stringify(mapping, null, 2), 'utf-8');

    // Supabase
    try {
      await supabase.from('symbol_mappings').upsert({
        finai_symbol: mapping.finaiSymbol,
        yahoo_symbol: mapping.yahooSymbol,
        company_name: mapping.companyName,
        sector_category: mapping.sectorCategory,
        yahoo_sector: mapping.yahooSector || null,
        yahoo_industry: mapping.yahooIndustry || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'finai_symbol' });
    } catch (e) {}
  }

  /**
   * 2. Save Raw Yahoo Payload (Idempotent by hash)
   */
  async saveRawPayload(record: {
    symbol: string;
    source: string;
    endpoint: string;
    responseHash: string;
    httpStatus?: number;
    rawPayload: any;
  }): Promise<void> {
    const localFile = path.join(LOCAL_ARCHIVE_DIR, 'raw_payloads', `${record.symbol}_${record.endpoint}_${record.responseHash.slice(0, 8)}.json`);
    if (!fs.existsSync(localFile)) {
      fs.writeFileSync(localFile, JSON.stringify(record, null, 2), 'utf-8');
    }

    try {
      await supabase.from('raw_source_payloads').insert({
        source: record.source,
        symbol: record.symbol,
        endpoint: record.endpoint,
        response_hash: record.responseHash,
        http_status: record.httpStatus || 200,
        raw_payload: record.rawPayload
      });
    } catch (e) {}
  }

  /**
   * 3. Save Financial Statement Periods
   */
  async saveFinancialPeriods(symbol: string, periods: any[]): Promise<number> {
    const localFile = path.join(LOCAL_ARCHIVE_DIR, 'statements', `${symbol}_statements.json`);
    fs.writeFileSync(localFile, JSON.stringify(periods, null, 2), 'utf-8');

    let insertedCount = 0;
    for (const p of periods) {
      try {
        const { error } = await supabase.from('financial_statement_periods').upsert({
          symbol: p.symbol,
          period_type: p.periodType,
          period_start: p.periodStart || null,
          period_end: p.periodEnd,
          fiscal_year: p.fiscalYear,
          fiscal_quarter: p.fiscalQuarter,
          report_date: p.reportDate || p.periodEnd,
          statement_type: 'CONSOLIDATED',
          currency: p.currency || 'TRY',
          reported_currency: p.reportedCurrency || p.currency || 'TRY',
          source: 'YAHOO_FINANCE_TIMESERIES',
          validation_status: p.validationStatus || 'VALID',
          version: 1,
          is_current: true,

          // Fast columns
          revenue: p.revenue,
          cost_of_revenue: p.costOfRevenue,
          gross_profit: p.grossProfit,
          operating_income: p.operatingIncome,
          ebitda: p.ebitda,
          net_income: p.netIncome,
          net_income_to_parent: p.netIncomeToParent,

          cash_and_equivalents: p.cashAndEquivalents,
          total_current_assets: p.totalCurrentAssets,
          total_assets: p.totalAssets,
          current_liabilities: p.currentLiabilities,
          total_liabilities: p.totalLiabilities,
          total_equity: p.totalEquity,
          parent_equity: p.parentEquity,
          net_debt: p.netDebt,

          operating_cash_flow: p.operatingCashFlow,
          capital_expenditures: p.capitalExpenditure,
          free_cash_flow: p.freeCashFlow,

          weighted_average_shares: p.weightedAverageShares,
          total_shares: p.totalShares,
          eps: p.eps,
          bvps: p.bvps,

          // Full details JSONB
          income_statement_details: p.rawIS,
          balance_sheet_details: p.rawBS,
          cash_flow_details: p.rawCF
        }, { onConflict: 'symbol,period_type,period_end,statement_type,version' });

        if (!error) insertedCount++;
      } catch (e) {}
    }
    return insertedCount;
  }

  /**
   * 4. Save Historical Daily Prices
   */
  async saveHistoricalPrices(symbol: string, prices: any[]): Promise<number> {
    const localFile = path.join(LOCAL_ARCHIVE_DIR, 'prices', `${symbol}_daily_prices.json`);
    fs.writeFileSync(localFile, JSON.stringify(prices, null, 2), 'utf-8');

    // Batch upsert to Supabase in chunks of 500
    let inserted = 0;
    const chunkSize = 500;
    for (let i = 0; i < prices.length; i += chunkSize) {
      const chunk = prices.slice(i, i + chunkSize).map(p => ({
        symbol,
        interval: '1d',
        timestamp: p.timestamp,
        date_istanbul: p.dateIstanbul,
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
        adjusted_close: p.adjustedClose,
        volume: p.volume,
        source: 'YAHOO_CHART'
      }));

      try {
        const { error } = await supabase.from('historical_prices').upsert(chunk, { onConflict: 'symbol,interval,timestamp' });
        if (!error) inserted += chunk.length;
      } catch (e) {}
    }
    return inserted;
  }

  /**
   * 5. Save Dividends
   */
  async saveDividends(symbol: string, dividends: any[]): Promise<number> {
    const localFile = path.join(LOCAL_ARCHIVE_DIR, 'dividends', `${symbol}_dividends.json`);
    fs.writeFileSync(localFile, JSON.stringify(dividends, null, 2), 'utf-8');

    let inserted = 0;
    for (const d of dividends) {
      try {
        const { error } = await supabase.from('historical_dividends').upsert({
          symbol,
          ex_date: d.exDate,
          gross_amount: d.grossAmount,
          net_amount: d.netAmount || null,
          currency: d.currency || 'TRY',
          source: 'YAHOO_CHART_DIV',
          validation_status: 'VALID',
          is_current: true,
          version: 1
        }, { onConflict: 'symbol,ex_date,source,version' });
        if (!error) inserted++;
      } catch (e) {}
    }
    return inserted;
  }

  /**
   * 6. Save Splits
   */
  async saveSplits(symbol: string, splits: any[]): Promise<number> {
    const localFile = path.join(LOCAL_ARCHIVE_DIR, 'splits', `${symbol}_splits.json`);
    fs.writeFileSync(localFile, JSON.stringify(splits, null, 2), 'utf-8');

    let inserted = 0;
    for (const s of splits) {
      try {
        const { error } = await supabase.from('split_events').upsert({
          symbol,
          event_date: s.eventDate,
          numerator: s.numerator,
          denominator: s.denominator,
          split_ratio: s.splitRatio,
          action_type: s.actionType || 'STOCK_SPLIT',
          source: 'YAHOO_CHART_SPLIT'
        }, { onConflict: 'symbol,event_date,numerator,denominator' });
        if (!error) inserted++;
      } catch (e) {}
    }
    return inserted;
  }

  /**
   * 7. Save Company Profile
   */
  async saveProfile(symbol: string, profile: any): Promise<void> {
    const localFile = path.join(LOCAL_ARCHIVE_DIR, 'profiles', `${symbol}_profile.json`);
    fs.writeFileSync(localFile, JSON.stringify(profile, null, 2), 'utf-8');

    try {
      await supabase.from('company_profiles').upsert({
        symbol,
        company_name: profile.companyName,
        sector: profile.sector,
        industry: profile.industry,
        country: profile.country || 'Turkey',
        city: profile.city,
        address: profile.address,
        employee_count: profile.employeeCount,
        website_url: profile.websiteUrl,
        business_summary: profile.businessSummary,
        executives: profile.executives,
        updated_at: new Date().toISOString()
      }, { onConflict: 'symbol' });
    } catch (e) {}
  }

  /**
   * 8. Save Ownership
   */
  async saveOwnership(symbol: string, ownership: any): Promise<void> {
    const localFile = path.join(LOCAL_ARCHIVE_DIR, 'ownership', `${symbol}_ownership.json`);
    fs.writeFileSync(localFile, JSON.stringify(ownership, null, 2), 'utf-8');

    try {
      await supabase.from('ownership_snapshots').upsert({
        symbol,
        insiders_held_percent: ownership.insidersPercentHeld,
        institutions_held_percent: ownership.institutionsPercentHeld,
        institutions_float_percent: ownership.institutionsFloatPercentHeld,
        institutions_count: ownership.institutionsCount,
        top_institutions: ownership.topInstitutions || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'symbol' });
    } catch (e) {}
  }

  /**
   * 9. Save Analyst Estimates
   */
  async saveEstimates(symbol: string, estimates: any): Promise<void> {
    const localFile = path.join(LOCAL_ARCHIVE_DIR, 'estimates', `${symbol}_estimates.json`);
    fs.writeFileSync(localFile, JSON.stringify(estimates, null, 2), 'utf-8');

    try {
      await supabase.from('analyst_estimates').upsert({
        symbol,
        target_mean_price: estimates.targetMeanPrice,
        target_median_price: estimates.targetMedianPrice,
        target_high_price: estimates.targetHighPrice,
        target_low_price: estimates.targetLowPrice,
        number_of_analysts: estimates.numberOfAnalysts,
        recommendation_key: estimates.recommendationKey,
        recommendation_trend: estimates.recommendationTrend,
        earnings_forecasts: estimates.earningsForecasts,
        updated_at: new Date().toISOString()
      }, { onConflict: 'symbol' });
    } catch (e) {}
  }
}
