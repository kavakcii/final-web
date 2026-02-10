import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();
// yahooFinance.suppressNotices(['yahooSurvey']);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ results: [] });
    }

    try {
        // We specifically want to prioritize TEFAS funds and BIST stocks
        // TEFAS funds are often not well-indexed in standard Yahoo search unless exact code is known,
        // but BIST stocks are.
        // For TEFAS funds, we might need a local fallback or specific mapping if Yahoo misses them.
        // However, Yahoo Finance DOES contain many Turkish funds (e.g. TCD.IS, MAC.IS).
        
        const result = await yahooFinance.search(query, {
            newsCount: 0,
            quotesCount: 60 // Increased count to find Turkish assets among global results
        });

        // Filter function for reusability
        const filterTurkishAssets = (q: any) => {
             // Ensure the asset is valid and exists on Yahoo Finance
             if (!q || !q.symbol) return false;
             if (q.isYahooFinance === false) return false;

             // STRICT FILTER: Only allow Turkish assets (BIST Stocks & TEFAS Funds)
             // Criteria:
             // 1. Symbol ends with '.IS' (Standard for BIST and many Turkish funds on Yahoo)
             // 2. Exchange is 'IST' (Istanbul Stock Exchange)
             const symbol = q.symbol.toUpperCase();
             const isTurkishAsset = symbol.endsWith('.IS') || q.exchange === 'IST';
             
             // Type Filter: Only EQUITY, MUTUALFUND, ETF (exclude CURRENCY, CRYPTO, etc. unless user wants them?)
             // User said: "yabancı fon ve hisse senetleri çıkar sadece türkler olsun" -> Only Turkish Stocks and Funds.
             const allowedTypes = ['EQUITY', 'MUTUALFUND', 'ETF', 'INDEX']; 
             const isAllowedType = allowedTypes.includes(q.quoteType);

             return isTurkishAsset && isAllowedType;
        };

        let quotes = result.quotes.filter(filterTurkishAssets);

        // Fallback: If no Turkish assets found and query is short (potential TEFAS code or Stock symbol),
        // try searching explicitly with .IS suffix to find the Turkish equivalent.
        // E.g. User types "MAC" -> Yahoo returns US stock "MAC". We want "MAC.IS".
        if (quotes.length === 0 && query.length >= 3 && query.length <= 5) {
             try {
                const resultIS = await yahooFinance.search(`${query}.IS`, {
                    newsCount: 0,
                    quotesCount: 5 // We only need the top matches for the specific code
                });
                const quotesIS = resultIS.quotes.filter(filterTurkishAssets);
                quotes = [...quotes, ...quotesIS];
             } catch (e) {
                 // Ignore fallback error
             }
        }

        // SYNTHETIC FALLBACK FOR TEFAS FUNDS (When Yahoo fails completely)
        // If we still have 0 results, and the query is exactly 3 letters (common for TEFAS funds like ALC, MAC, TCD),
        // we create a "Synthetic" result so the user can at least select it.
        if (quotes.length === 0 && query.length === 3) {
            const code = query.toUpperCase();
            quotes.push({
                symbol: code,
                shortname: `${code} - TEFAS Yatırım Fonu`,
                longname: `TEFAS Yatırım Fonu (${code})`,
                exchange: 'TEFAS',
                quoteType: 'MUTUALFUND',
                typeDisp: 'Fund',
                isSynthetic: true
            });
        }

        quotes = quotes.sort((a: any, b: any) => {
                // Priority Logic:
                // 1. Exact match to query (case insensitive)
                // 2. Contains '.IS' (Turkish market)
                // 3. Exchange is IST
                
                const qUpper = query.toUpperCase();
                const aSym = a.symbol.toUpperCase();
                const bSym = b.symbol.toUpperCase();

                // Exact match priority
                if (aSym === qUpper || aSym === `${qUpper}.IS`) return -1;
                if (bSym === qUpper || bSym === `${qUpper}.IS`) return 1;

                // Turkish assets priority
                const aIsTR = a.symbol.endsWith('.IS') || a.exchange === 'IST';
                const bIsTR = b.symbol.endsWith('.IS') || b.exchange === 'IST';
                
                if (aIsTR && !bIsTR) return -1;
                if (!aIsTR && bIsTR) return 1;
                
                return 0;
            });

        return NextResponse.json({ results: quotes });
    } catch (error: any) {
        console.error('Search API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
    }
}
