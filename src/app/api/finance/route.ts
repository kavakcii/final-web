import { NextResponse } from 'next/server';
import { fetchTefasData } from '@/lib/tefas';

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

    // 1. Resolve symbols to fetch from Yahoo Finance (Add .IS for BIST stocks)
    const symbolsToFetch = new Set<string>();
    rawSymbols.forEach(s => {
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

    // 2. Fetch TEFAS funds fallback for any missing fund symbols
    const missingSymbols = rawSymbols.filter(s => !results.some(r => r.symbol === s || r.symbol === `${s}.IS`));
    if (missingSymbols.length > 0) {
        try {
            const tefasData = await fetchTefasData(new Date());
            missingSymbols.forEach(code => {
                const fund = tefasData.find((f: any) => f.FONKODU === code);
                if (fund && fund.SONPORTFOYDEGERI && fund.SONPAYADEDI) {
                    const price = fund.SONPORTFOYDEGERI / fund.SONPAYADEDI;
                    results.push({
                        symbol: code,
                        regularMarketPrice: price,
                        shortName: fund.FONUNVAN,
                        currency: 'TRY'
                    });
                }
            });
        } catch (e) {
            console.error('TEFAS fetch error:', e);
        }
    }

    return NextResponse.json({ results });
}
