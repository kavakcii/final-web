import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { fetchTefasData } from '@/lib/tefas';

const yahooFinance = new YahooFinance();
// yahooFinance.suppressNotices(['yahooSurvey']);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');

    if (!symbolsParam) {
        return NextResponse.json({ error: 'Symbols parameter is required' }, { status: 400 });
    }

    const symbols = symbolsParam.split(',');
    const results: any[] = [];

    // 1. Identify potential TEFAS funds (3 letters)
    const potentialFunds = symbols.filter(s => s.trim().length === 3 && !s.includes('.'));
    const otherSymbols = symbols.filter(s => !potentialFunds.includes(s));

    // 2. Fetch Yahoo Finance for others
    if (otherSymbols.length > 0) {
        const symbolsToFetch = new Set<string>();
        otherSymbols.forEach(s => {
            const cleanSymbol = s.toUpperCase().trim();
            symbolsToFetch.add(cleanSymbol);
            if (!cleanSymbol.includes('.') && cleanSymbol.length >= 4) {
                symbolsToFetch.add(`${cleanSymbol}.IS`);
            }
        });

        try {
            const yahooResults = await yahooFinance.quote(Array.from(symbolsToFetch));
            results.push(...yahooResults);
        } catch (error) {
            console.error('Yahoo Finance Error:', error);
        }
    }

    // 3. Fetch TEFAS for potential funds
    if (potentialFunds.length > 0) {
        const tefasData = await fetchTefasData(new Date());

        potentialFunds.forEach(code => {
            const fund = tefasData.find((f: any) => f.FONKODU === code.toUpperCase());
            if (fund && fund.SONPORTFOYDEGERI && fund.SONPAYADEDI) {
                const price = fund.SONPORTFOYDEGERI / fund.SONPAYADEDI;
                results.push({
                    symbol: code.toUpperCase(),
                    regularMarketPrice: price,
                    shortName: fund.FONUNVAN,
                    currency: 'TRY'
                });
            }
        });
    }

    return NextResponse.json({ results });
}
