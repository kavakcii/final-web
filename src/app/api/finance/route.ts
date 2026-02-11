import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import https from 'https';

const yahooFinance = new YahooFinance();
// yahooFinance.suppressNotices(['yahooSurvey']);

// TEFAS Helper Functions
function getTefasCookies(): Promise<string> {
    return new Promise((resolve) => {
        const req = https.get('https://www.tefas.gov.tr/FonKarsilastirma.aspx', {
            rejectUnauthorized: false,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        }, (res) => {
            const cookies = res.headers['set-cookie'];
            resolve(cookies ? cookies.map(c => c.split(';')[0]).join('; ') : '');
        });
        req.on('error', () => resolve(''));
    });
}

async function fetchTefasPrices(): Promise<any[]> {
    try {
        const cookieHeader = await getTefasCookies();

        // Date logic: Use last weekday
        let targetDate = new Date();
        const day = targetDate.getDay();
        if (day === 0) targetDate.setDate(targetDate.getDate() - 2); // Sunday -> Friday
        else if (day === 6) targetDate.setDate(targetDate.getDate() - 1); // Saturday -> Friday

        const dateStr = `${String(targetDate.getDate()).padStart(2, '0')}.${String(targetDate.getMonth() + 1).padStart(2, '0')}.${targetDate.getFullYear()}`;

        const payload = {
            "calismatipi": "2",
            "fontip": "YAT",
            "sfontur": "",
            "kurucukod": "",
            "fongrup": "",
            "bastarih": dateStr,
            "bittarih": dateStr,
            "fonturkod": "",
            "fonunvantip": "",
            "strperiod": "1,1,1,1,1,1,1",
            "islemdurum": ""
        };

        const postData = new URLSearchParams(payload as any).toString();

        return new Promise((resolve) => {
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Referer': 'https://www.tefas.gov.tr/FonKarsilastirma.aspx',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cookie': cookieHeader,
                    'Content-Length': Buffer.byteLength(postData).toString()
                },
                rejectUnauthorized: false,
                ciphers: 'DEFAULT@SECLEVEL=1',
                minVersion: 'TLSv1' as any,
                secureOptions: (require('constants') as any).SSL_OP_LEGACY_SERVER_CONNECT
            };

            const req = https.request('https://www.tefas.gov.tr/api/DB/BindComparisonFundSizes', options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        resolve(json.data || []);
                    } catch (e) {
                        console.error('TEFAS Parse Error:', e);
                        resolve([]);
                    }
                });
            });

            req.on('error', (e) => {
                console.error('TEFAS Request Error:', e);
                resolve([]);
            });
            req.write(postData);
            req.end();
        });
    } catch (e) {
        console.error('TEFAS General Error:', e);
        return [];
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
            const yahooResults = await yahooFinance.quote(Array.from(symbolsToFetch));
            results.push(...yahooResults);
        } catch (error) {
            console.error('Yahoo Finance Error:', error);
        }
    }

    // 3. Fetch TEFAS for potential funds
    if (potentialFunds.length > 0) {
        const tefasData = await fetchTefasPrices();

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
