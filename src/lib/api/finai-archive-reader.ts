/**
 * FinAI Archive Reader Service (FAZ 10: Supabase-First Production Data Layer)
 * 
 * Priority:
 * 1. Supabase PostgreSQL (Production Primary Data Layer)
 * 2. Local .finai_archive/ (Development / Resiliency Fallback)
 * 3. NULL / Empty (Never fake, never synthetic, never 0-coerced)
 */

import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const ARCHIVE_ROOT = path.join(process.cwd(), '.finai_archive');

// Lazily initialized server-side Supabase client
let _supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (_supabaseClient) return _supabaseClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _supabaseClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return _supabaseClient;
}

export class FinAiArchiveReader {
  public static getRoot(): string {
    return ARCHIVE_ROOT;
  }

  /**
   * Safe file system reader for local development/fallback
   */
  public static readJsonSafe<T>(subDir: string, filename: string): T | null {
    try {
      const safeFilename = path.basename(filename);
      const safeSubDir = path.basename(subDir);
      const fullPath = path.join(ARCHIVE_ROOT, safeSubDir, safeFilename);

      if (!fs.existsSync(fullPath)) return null;
      const content = fs.readFileSync(fullPath, 'utf-8');
      return JSON.parse(content) as T;
    } catch {
      return null;
    }
  }

  /**
   * 1. Company Profile
   */
  public static async getProfile(symbol: string): Promise<any | null> {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('company_profiles')
          .select('*')
          .eq('symbol', symbol)
          .maybeSingle();

        if (!error && data) {
          return {
            companyName: data.company_name,
            sector: data.sector,
            industry: data.industry,
            country: data.country,
            city: data.city,
            address: data.address,
            employeeCount: data.employee_count,
            websiteUrl: data.website_url,
            businessSummary: data.business_summary,
            executives: data.executives || []
          };
        }
      } catch (err: any) {
        console.warn(`[FinAiArchiveReader] Supabase error in getProfile(${symbol}):`, err.message);
      }
    }
    // Fallback to local archive
    return this.readJsonSafe('profiles', `${symbol}_profile.json`);
  }

  /**
   * 2. Historical Daily Prices
   * Optionally filtered by limit or date range to optimize payload
   */
  public static async getPrices(symbol: string, limit?: number): Promise<any[] | null> {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const pageSize = 1000;
        let allRows: any[] = [];
        let from = 0;

        // If limit is specified and fits in single page
        if (limit && limit <= pageSize) {
          const { data, error } = await sb
            .from('historical_prices')
            .select('date_istanbul,open,high,low,close,adjusted_close,volume,timestamp')
            .eq('symbol', symbol)
            .order('date_istanbul', { ascending: false })
            .limit(limit);

          if (!error && data && data.length > 0) {
            return data.reverse().map(p => ({
              dateIstanbul: p.date_istanbul,
              date: p.date_istanbul,
              open: p.open != null ? Number(p.open) : null,
              high: p.high != null ? Number(p.high) : null,
              low: p.low != null ? Number(p.low) : null,
              close: p.close != null ? Number(p.close) : null,
              adjustedClose: p.adjusted_close != null ? Number(p.adjusted_close) : (p.close != null ? Number(p.close) : null),
              volume: p.volume != null ? Number(p.volume) : 0,
              timestamp: p.timestamp
            }));
          }
        } else {
          // Paginated scan for all or large ranges
          while (true) {
            const { data, error } = await sb
              .from('historical_prices')
              .select('date_istanbul,open,high,low,close,adjusted_close,volume,timestamp')
              .eq('symbol', symbol)
              .order('date_istanbul', { ascending: true })
              .range(from, from + pageSize - 1);

            if (error || !data || data.length === 0) break;
            allRows.push(...data);
            if (data.length < pageSize) break;
            from += pageSize;
          }

          if (allRows.length > 0) {
            return allRows.map(p => ({
              dateIstanbul: p.date_istanbul,
              date: p.date_istanbul,
              open: p.open != null ? Number(p.open) : null,
              high: p.high != null ? Number(p.high) : null,
              low: p.low != null ? Number(p.low) : null,
              close: p.close != null ? Number(p.close) : null,
              adjustedClose: p.adjusted_close != null ? Number(p.adjusted_close) : (p.close != null ? Number(p.close) : null),
              volume: p.volume != null ? Number(p.volume) : 0,
              timestamp: p.timestamp
            }));
          }
        }
      } catch (err: any) {
        console.warn(`[FinAiArchiveReader] Supabase error in getPrices(${symbol}):`, err.message);
      }
    }
    // Fallback to local archive
    return this.readJsonSafe('prices', `${symbol}_daily.json`);
  }

  /**
   * Helper to map DB statement rows to canonical FinAi statement format
   */
  private static mapStatementRows(rows: any[]): any[] {
    return rows.map(p => ({
      symbol: p.symbol,
      periodType: p.period_type,
      periodEnd: p.period_end,
      fiscalYear: p.fiscal_year,
      fiscalQuarter: p.fiscal_quarter,
      currency: p.currency || 'TRY',
      revenue: p.revenue != null ? Number(p.revenue) : null,
      costOfRevenue: p.cost_of_revenue != null ? Number(p.cost_of_revenue) : null,
      grossProfit: p.gross_profit != null ? Number(p.gross_profit) : null,
      operatingIncome: p.operating_income != null ? Number(p.operating_income) : null,
      ebitda: p.ebitda != null ? Number(p.ebitda) : null,
      netIncome: p.net_income != null ? Number(p.net_income) : null,
      netIncomeToParent: p.net_income_to_parent != null ? Number(p.net_income_to_parent) : null,
      cashAndEquivalents: p.cash_and_equivalents != null ? Number(p.cash_and_equivalents) : null,
      totalCurrentAssets: p.total_current_assets != null ? Number(p.total_current_assets) : null,
      totalAssets: p.total_assets != null ? Number(p.total_assets) : null,
      currentLiabilities: p.current_liabilities != null ? Number(p.current_liabilities) : null,
      totalLiabilities: p.total_liabilities != null ? Number(p.total_liabilities) : null,
      totalEquity: p.total_equity != null ? Number(p.total_equity) : null,
      parentEquity: p.parent_equity != null ? Number(p.parent_equity) : null,
      netDebt: p.net_debt != null ? Number(p.net_debt) : null,
      operatingCashFlow: p.operating_cash_flow != null ? Number(p.operating_cash_flow) : null,
      capitalExpenditure: p.capital_expenditures != null ? Number(p.capital_expenditures) : null,
      freeCashFlow: p.free_cash_flow != null ? Number(p.free_cash_flow) : null,
      rawIS: p.income_statement_details || {},
      rawBS: p.balance_sheet_details || {},
      rawCF: p.cash_flow_details || {}
    }));
  }

  /**
   * 3. Quarterly Statements
   */
  public static async getQuarterlyStatements(symbol: string): Promise<any[] | null> {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('financial_statement_periods')
          .select('*')
          .eq('symbol', symbol)
          .eq('period_type', 'QUARTERLY')
          .order('period_end', { ascending: false });

        if (!error && data && data.length > 0) {
          return this.mapStatementRows(data);
        }
      } catch (err: any) {
        console.warn(`[FinAiArchiveReader] Supabase error in getQuarterlyStatements(${symbol}):`, err.message);
      }
    }
    // Fallback to local archive
    return this.readJsonSafe('statements', `${symbol}_quarterly.json`);
  }

  /**
   * 4. Annual Statements
   */
  public static async getAnnualStatements(symbol: string): Promise<any[] | null> {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('financial_statement_periods')
          .select('*')
          .eq('symbol', symbol)
          .eq('period_type', 'ANNUAL')
          .order('period_end', { ascending: false });

        if (!error && data && data.length > 0) {
          return this.mapStatementRows(data);
        }
      } catch (err: any) {
        console.warn(`[FinAiArchiveReader] Supabase error in getAnnualStatements(${symbol}):`, err.message);
      }
    }
    // Fallback to local archive
    return this.readJsonSafe('statements', `${symbol}_annual.json`);
  }

  /**
   * 5. Dividends
   */
  public static async getDividends(symbol: string): Promise<any[] | null> {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('historical_dividends')
          .select('ex_date,gross_amount,net_amount,currency')
          .eq('symbol', symbol)
          .order('ex_date', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map(d => ({
            exDate: d.ex_date,
            grossAmount: Number(d.gross_amount),
            netAmount: d.net_amount != null ? Number(d.net_amount) : null,
            currency: d.currency || 'TRY'
          }));
        }
      } catch (err: any) {
        console.warn(`[FinAiArchiveReader] Supabase error in getDividends(${symbol}):`, err.message);
      }
    }
    // Fallback to local archive
    return this.readJsonSafe('dividends', `${symbol}_dividends.json`);
  }

  /**
   * 6. Splits
   */
  public static async getSplits(symbol: string): Promise<any[] | null> {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('split_events')
          .select('event_date,numerator,denominator,split_ratio,action_type')
          .eq('symbol', symbol)
          .order('event_date', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map(s => ({
            eventDate: s.event_date,
            numerator: Number(s.numerator),
            denominator: Number(s.denominator),
            splitRatio: s.split_ratio,
            actionType: s.action_type || 'STOCK_SPLIT'
          }));
        }
      } catch (err: any) {
        console.warn(`[FinAiArchiveReader] Supabase error in getSplits(${symbol}):`, err.message);
      }
    }
    // Fallback to local archive
    return this.readJsonSafe('splits', `${symbol}_splits.json`);
  }

  /**
   * 7. Ownership
   */
  public static async getOwnership(symbol: string): Promise<any | null> {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('ownership_snapshots')
          .select('*')
          .eq('symbol', symbol)
          .maybeSingle();

        if (!error && data) {
          return {
            insidersPercentHeld: data.insiders_held_percent != null ? Number(data.insiders_held_percent) : null,
            institutionsPercentHeld: data.institutions_held_percent != null ? Number(data.institutions_held_percent) : null,
            institutionsFloatPercentHeld: data.institutions_float_percent != null ? Number(data.institutions_float_percent) : null,
            institutionsCount: data.institutions_count,
            topInstitutions: data.top_institutions || []
          };
        }
      } catch (err: any) {
        console.warn(`[FinAiArchiveReader] Supabase error in getOwnership(${symbol}):`, err.message);
      }
    }
    // Fallback to local archive
    return this.readJsonSafe('ownership', `${symbol}_ownership.json`);
  }

  /**
   * 8. Analyst Estimates
   */
  public static async getEstimates(symbol: string): Promise<any | null> {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('analyst_estimates')
          .select('*')
          .eq('symbol', symbol)
          .maybeSingle();

        if (!error && data) {
          return {
            targetMeanPrice: data.target_mean_price != null ? Number(data.target_mean_price) : null,
            targetMedianPrice: data.target_median_price != null ? Number(data.target_median_price) : null,
            targetHighPrice: data.target_high_price != null ? Number(data.target_high_price) : null,
            targetLowPrice: data.target_low_price != null ? Number(data.target_low_price) : null,
            numberOfAnalysts: data.number_of_analysts,
            recommendationKey: data.recommendation_key,
            recommendationTrend: data.recommendation_trend || [],
            earningsForecasts: data.earnings_forecasts || []
          };
        }
      } catch (err: any) {
        console.warn(`[FinAiArchiveReader] Supabase error in getEstimates(${symbol}):`, err.message);
      }
    }
    // Fallback to local archive
    return this.readJsonSafe('estimates', `${symbol}_estimates.json`);
  }

  /**
   * 9. Raw Quote Summary
   */
  public static async getQuoteSummary(symbol: string): Promise<any | null> {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('raw_source_payloads')
          .select('raw_payload')
          .eq('symbol', symbol)
          .eq('endpoint', 'quoteSummary')
          .order('fetched_at', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0 && data[0].raw_payload) {
          return data[0].raw_payload;
        }
      } catch (err: any) {
        console.warn(`[FinAiArchiveReader] Supabase error in getQuoteSummary(${symbol}):`, err.message);
      }
    }
    // Fallback to local archive
    try {
      const rawDir = path.join(ARCHIVE_ROOT, 'raw_payloads');
      if (!fs.existsSync(rawDir)) return null;
      const files = fs.readdirSync(rawDir).filter(f => f.startsWith(`${symbol}_quoteSummary`));
      if (files.length === 0) return null;
      const content = fs.readFileSync(path.join(rawDir, files[0]), 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * 10. Quality Report
   */
  public static getQualityReport(): any | null {
    return this.readJsonSafe('reports', 'faz5_validation_audit_results.json');
  }
}

