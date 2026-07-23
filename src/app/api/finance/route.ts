import { NextResponse } from 'next/server';
import { fetchTefasData, fetchTefasHistory } from '@/lib/tefas';
import { TEFAS_CATALOG } from '@/lib/asset-catalog';

const yfModule = require('yahoo-finance2');
const YahooFinanceClass = yfModule.YahooFinance || yfModule.default?.YahooFinance || yfModule.default;
const yahooFinance = new YahooFinanceClass({ suppressNotices: ['yahooSurvey'] });

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');

    if (!symbolsParam) {
        return NextResponse.json({ error: 'Symbols parameter is required' }, { status: 400 });
    }

    const rawSymbols = symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    const results: any[] = [];

    // Map of known TEFAS fund symbols for fast lookup
    const tefasCatalogMap = new Map(TEFAS_CATALOG.map(f => [f.symbol.toUpperCase(), f.name]));

    const fundSymbols: string[] = [];
    const stockSymbols: string[] = [];

    rawSymbols.forEach(s => {
        const baseSymbol = s.replace('.IS', '');
        // If symbol is in TEFAS_CATALOG or looks like a 3-letter TEFAS fund code (and doesn't end with .IS explicitly unless registered)
        if (tefasCatalogMap.has(baseSymbol) || tefasCatalogMap.has(s) || (s.length === 3 && !s.includes('.'))) {
            fundSymbols.push(baseSymbol);
        } else {
            stockSymbols.push(s);
        }
    });

    // 1. Fetch Stock Quotes from Yahoo Finance (Only for non-TEFAS assets)
    const symbolsToFetch = new Set<string>();
    stockSymbols.forEach(s => {
        if (!s.includes('.')) {
            symbolsToFetch.add(`${s}.IS`);
        }
        symbolsToFetch.add(s);
    });

    if (symbolsToFetch.size > 0) {
        try {
            const symbolsArray = Array.from(symbolsToFetch);
            const yahooResults = await yahooFinance.quote(symbolsArray);
            
            const list = Array.isArray(yahooResults) ? yahooResults : (yahooResults ? [yahooResults] : []);

            // 3-Month High/Low Historical Data
            const d = new Date();
            d.setMonth(d.getMonth() - 3);
            const period1 = d.toISOString().split('T')[0];

            await Promise.all(list.map(async (r: any) => {
                if (r && r.symbol) {
                    try {
                        const hist = await yahooFinance.historical(r.symbol, { period1, interval: '1d' });
                        if (hist && hist.length > 0) {
                            const highs = hist.map((h: any) => h.high).filter((x: any) => x != null);
                            const lows = hist.map((h: any) => h.low).filter((x: any) => x != null);
                            if (highs.length > 0) r.threeMonthHigh = Math.max(...highs);
                            if (lows.length > 0) r.threeMonthLow = Math.min(...lows);
                        }
                    } catch (e) {
                        // Silent fallback
                    }
                }
            }));

            results.push(...list);
        } catch (error) {
            console.error('Yahoo Finance Error:', error);
        }
    }

    // 2. Fetch Live & Real Prices for TEFAS Funds
    if (fundSymbols.length > 0) {
        try {
            const tefasData = await fetchTefasData(new Date());
            
            for (const code of fundSymbols) {
                let price = 0;
                let fundName = tefasCatalogMap.get(code) || `${code} Yatırım Fonu`;

                const fund = tefasData.find((f: any) => f.FONKODU === code);
                if (fund) {
                    if (fund.FONUNVAN) fundName = fund.FONUNVAN;
                    if (fund.FIYAT) {
                        price = Number(fund.FIYAT);
                    } else if (fund.SONPORTFOYDEGERI && fund.SONPAYADEDI) {
                        price = fund.SONPORTFOYDEGERI / fund.SONPAYADEDI;
                    }
                }

                // Fallback to history endpoint if bulk list didn't return price
                if (price === 0) {
                    try {
                        const history = await fetchTefasHistory(code, 1);
                        if (history && history.length > 0) {
                            price = history[history.length - 1].price;
                        }
                    } catch (hErr) {
                        // Ignore history error
                    }
                }

                if (price > 0) {
                    results.push({
                        symbol: code,
                        regularMarketPrice: price,
                        shortName: fundName,
                        currency: 'TRY'
                    });
                }
            }
        } catch (e) {
            console.error('TEFAS fetch error:', e);
        }
    }

    return NextResponse.json({ results });
}
