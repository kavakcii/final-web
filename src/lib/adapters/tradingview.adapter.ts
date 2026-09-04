/**
 * FinAI TradingView Source Adapter - Stage 5B
 * Scanner API Integration for Live Multiples & TTM Cross-Check
 * NOTE: Used strictly for CURRENT snapshot validation and valuation cross-checks.
 * Never fabricates or hallucinates historical financial statement series.
 */

import { getSectorCategory } from '@/lib/sector-categorizer';
import { SectorInfo } from '@/types/financials';

export interface TradingViewCurrentSnapshot {
  symbol: string;
  price: number | null;
  peRatio: number | null;
  pbRatio: number | null;
  evToEbitda: number | null;
  roe: number | null;
  dividendYield: number | null;
  ttmRevenue: number | null;
  ttmNetIncome: number | null;
  totalAssets: number | null;
  totalDebt: number | null;
  marketCap: number | null;
  source: string;
  fetchedAt: string;
}

export class TradingViewAdapter {
  readonly sourceName = 'TradingView Scanner API';
  private static cachedSnapshots = new Map<string, { data: TradingViewCurrentSnapshot; timestamp: number }>();
  private static CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

  async getCurrentSnapshot(cleanSymbol: string): Promise<TradingViewCurrentSnapshot | null> {
    const now = Date.now();
    const cached = TradingViewAdapter.cachedSnapshots.get(cleanSymbol);
    if (cached && (now - cached.timestamp < TradingViewAdapter.CACHE_TTL_MS)) {
      return cached.data;
    }

    try {
      const payload = {
        filter: [
          { left: 'name', operation: 'equal', right: cleanSymbol }
        ],
        symbols: { tickers: [`BIST:${cleanSymbol}`], query: { types: [] } },
        columns: [
          'name',
          'close',
          'price_earnings_ttm',
          'price_book_ratio',
          'enterprise_value_ebitda_ttm',
          'return_on_equity_fq',
          'dividend_yield_recent',
          'total_revenue_ttm',
          'net_income_ttm',
          'total_assets_fq',
          'total_debt_fq',
          'market_cap_basic'
        ],
        sort: { sortBy: 'market_cap_basic', sortOrder: 'desc' },
        range: [0, 1]
      };

      const res = await fetch('https://scanner.tradingview.com/turkey/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) return null;

      const data = await res.json();
      const row = data?.data?.[0]?.d;
      if (!row || row.length === 0) return null;

      const snapshot: TradingViewCurrentSnapshot = {
        symbol: cleanSymbol,
        price: row[1] ?? null,
        peRatio: row[2] ?? null,
        pbRatio: row[3] ?? null,
        evToEbitda: row[4] ?? null,
        roe: row[5] ? parseFloat((row[5] * 100).toFixed(2)) : null,
        dividendYield: row[6] ? parseFloat((row[6] * 100).toFixed(2)) : null,
        ttmRevenue: row[7] ?? null,
        ttmNetIncome: row[8] ?? null,
        totalAssets: row[9] ?? null,
        totalDebt: row[10] ?? null,
        marketCap: row[11] ?? null,
        source: this.sourceName,
        fetchedAt: new Date().toISOString()
      };

      TradingViewAdapter.cachedSnapshots.set(cleanSymbol, { data: snapshot, timestamp: now });
      return snapshot;
    } catch (e: any) {
      console.warn(`[TradingViewAdapter] Failed to fetch current snapshot for ${cleanSymbol}:`, e?.message || e);
      return null;
    }
  }
}
