import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { BIST_CATALOG, TEFAS_CATALOG } from '@/lib/asset-catalog';
import { sectorMapping } from '@/data/sectorMapping';

const yahooFinance = new YahooFinance();

function normalizeTr(text: string): string {
    return (text || '')
        .toLocaleLowerCase('tr-TR')
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .trim();
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
        return NextResponse.json({ results: [] });
    }

    const rawQuery = query.trim();
    const qUpper = rawQuery.toUpperCase();
    const qNorm = normalizeTr(rawQuery);

    try {
        const results: any[] = [];
        const seenSymbols = new Set<string>();

        // 1. FAST LOCAL BIST SEARCH (Case-Insensitive, Turkish Normalized, Sector Search)
        for (const stock of BIST_CATALOG) {
            const sym = stock.symbol.toUpperCase().replace(/\.IS$/, '');
            const symNorm = normalizeTr(sym);
            const nameNorm = normalizeTr(stock.name || '');
            const sector = sectorMapping[sym] || 'Borsa İstanbul';
            const sectorNorm = normalizeTr(sector);

            const isExactSymbol = sym === qUpper;
            const isPrefixSymbol = symNorm.startsWith(qNorm);
            const isSymbolMatch = symNorm.includes(qNorm);
            const isNameMatch = nameNorm.includes(qNorm);
            const isSectorMatch = sectorNorm.includes(qNorm);

            if (isExactSymbol || isPrefixSymbol || isSymbolMatch || isNameMatch || isSectorMatch) {
                seenSymbols.add(sym);
                let score = 0;
                if (isExactSymbol) score = 1000;
                else if (isPrefixSymbol) score = 500;
                else if (isSymbolMatch) score = 300;
                else if (isNameMatch) score = 200;
                else if (isSectorMatch) score = 100;

                results.push({
                    symbol: sym,
                    shortname: stock.name,
                    longname: stock.name,
                    sector: sector,
                    exchange: 'BIST',
                    quoteType: 'EQUITY',
                    typeDisp: 'Hisse Senedi',
                    url: `/varlik/${sym}`,
                    score
                });
            }
        }

        // 2. LOCAL TEFAS SEARCH (If query matches fund code or name)
        if (rawQuery.length >= 2) {
            for (const fund of TEFAS_CATALOG) {
                const fCode = fund.symbol.toUpperCase();
                const fCodeNorm = normalizeTr(fCode);
                const fNameNorm = normalizeTr(fund.name || '');

                const isExactCode = fCode === qUpper;
                const isCodeMatch = fCodeNorm.startsWith(qNorm);
                const isNameMatch = fNameNorm.includes(qNorm);

                if ((isExactCode || isCodeMatch || isNameMatch) && !seenSymbols.has(fCode)) {
                    seenSymbols.add(fCode);
                    results.push({
                        symbol: fCode,
                        shortname: fund.name,
                        longname: fund.name,
                        sector: 'Yatırım Fonu',
                        exchange: 'TEFAS',
                        quoteType: 'MUTUALFUND',
                        typeDisp: 'TEFAS Fonu',
                        url: `/varlik/${fCode}`,
                        score: isExactCode ? 900 : (isCodeMatch ? 400 : 150)
                    });
                }
            }
        }

        // 3. YAHOO SEARCH FALLBACK IF FEW RESULTS
        if (results.length < 5) {
            try {
                const yahooRes = await yahooFinance.search(rawQuery, {
                    newsCount: 0,
                    quotesCount: 20
                });

                if (yahooRes?.quotes) {
                    for (const rawQuote of yahooRes.quotes) {
                        const q = rawQuote as any;
                        if (!q?.symbol || typeof q.symbol !== 'string') continue;
                        const rawSym = q.symbol.toUpperCase();
                        const cleanSym = rawSym.replace(/\.IS$/, '');
                        if (seenSymbols.has(cleanSym)) continue;

                        const isTurkish = rawSym.endsWith('.IS') || q.exchange === 'IST';
                        if (isTurkish && ['EQUITY', 'MUTUALFUND', 'ETF'].includes(q.quoteType as string)) {
                            seenSymbols.add(cleanSym);
                            const sector = sectorMapping[cleanSym] || (q.quoteType === 'MUTUALFUND' ? 'Yatırım Fonu' : 'Borsa İstanbul');
                            results.push({
                                symbol: cleanSym,
                                shortname: q.shortname || cleanSym,
                                longname: q.longname || q.shortname || cleanSym,
                                sector: sector,
                                exchange: 'BIST',
                                quoteType: q.quoteType,
                                typeDisp: q.quoteType === 'MUTUALFUND' ? 'Yatırım Fonu' : 'Hisse Senedi',
                                url: `/varlik/${cleanSym}`,
                                score: cleanSym === qUpper ? 800 : 50
                            });
                        }
                    }
                }
            } catch (e) {
                // Ignore Yahoo search errors gracefully
            }
        }

        // Sort by priority score and limit
        const sorted = results.sort((a, b) => b.score - a.score).slice(0, 10);
        return NextResponse.json({ results: sorted });
    } catch (error: any) {
        console.error('Search API Error:', error);
        return NextResponse.json({ results: [] });
    }
}
