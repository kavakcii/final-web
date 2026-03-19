import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { fetchTefasData } from '@/lib/tefas';

let yahooFinance = YahooFinance as any;
if (typeof yahooFinance === 'function' || (yahooFinance?.prototype && yahooFinance?.prototype?.search)) {
    try {
        yahooFinance = new yahooFinance();
    } catch (e) {
        console.warn("Using YahooFinance as instance");
    }
}

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
            const symbolsArray = Array.from(symbolsToFetch);
            const yahooResults = await yahooFinance.quote(symbolsArray);
            
            // 3 Aylık Zirve/Dip (3-Month High/Low) Hesaplama
            const d = new Date();
            d.setMonth(d.getMonth() - 3);
            const period1 = d.toISOString().split('T')[0];

            await Promise.all(yahooResults.map(async (r: any) => {
                try {
                    const hist = await yahooFinance.historical(r.symbol, { period1, interval: '1d' });
                    if (hist && hist.length > 0) {
                        const highs = hist.map((h:any) => h.high).filter((x:any) => x != null);
                        const lows = hist.map((h:any) => h.low).filter((x:any) => x != null);
                        if(highs.length > 0) r.threeMonthHigh = Math.max(...highs);
                        if(lows.length > 0) r.threeMonthLow = Math.min(...lows);
                    }
                } catch (e) {
                    // Sessizce geç, API limitine takılırsa 52 hafta verisi ui'da fallback olabilir
                }
            }));

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
