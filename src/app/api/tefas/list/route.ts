import { NextResponse } from 'next/server';
import https from 'https';

function getCookies(): Promise<string> {
    return new Promise((resolve, reject) => {
        const req = https.get('https://www.tefas.gov.tr/FonKarsilastirma.aspx', {
            rejectUnauthorized: false,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        }, (res) => {
            const cookies = res.headers['set-cookie'];
            if (cookies) {
                resolve(cookies.map(c => c.split(';')[0]).join('; '));
            } else {
                resolve('');
            }
        });
        req.on('error', (e) => reject(e));
    });
}

function fetchWithNodeHttps(url: string, options: any, body: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const req = https.request(url, {
            ...options,
            rejectUnauthorized: false
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error('Failed to parse JSON'));
                    }
                } else {
                    reject(new Error(`Status Code: ${res.statusCode}`));
                }
            });
        });
        req.on('error', (e) => reject(e));
        if (body) req.write(body);
        req.end();
    });
}

function formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

export async function GET() {
    try {
        const url = 'https://www.tefas.gov.tr/api/DB/BindComparisonFundReturns';

        // Date logic: Ensure we don't send future dates (2026)
        const targetDate = new Date();
        if (targetDate.getFullYear() > 2025) {
             // Fallback for wrong system date
             targetDate.setFullYear(2025);
        }
        
        // If it's weekend, go back to Friday? TEFAS might handle it, but safer to use a weekday.
        // Simple check: if Sat(6) or Sun(0), go back.
        const day = targetDate.getDay();
        if (day === 0) targetDate.setDate(targetDate.getDate() - 2);
        else if (day === 6) targetDate.setDate(targetDate.getDate() - 1);

        const dateStr = formatDate(targetDate);
        console.log(`Fetching TEFAS data for date: ${dateStr}`);

        // Get Cookies First
        const cookieHeader = await getCookies();
        console.log('Got cookies for TEFAS request');

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

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Referer': 'https://www.tefas.gov.tr/FonKarsilastirma.aspx',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Origin': 'https://www.tefas.gov.tr',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
                'Connection': 'keep-alive',
                'Host': 'www.tefas.gov.tr',
                'Cookie': cookieHeader,
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const data = await fetchWithNodeHttps(url, options, postData);

        // Return only necessary fields to minimize payload
        const funds = data.data.map((item: any) => ({
            code: item.FONKODU,
            title: item.FONUNVAN,
            category: item.FONTURACIKLAMA,
            price: item.FIYAT || 0,
            // Returns
            returnDay: item.FONGETIRI || 0, // Daily return often comes as FONGETIRI or similar, checking TEFAS standard
            return1m: item.GETIRI1A,
            return3m: item.GETIRI3A,
            return6m: item.GETIRI6A,
            return1y: item.GETIRI1Y,
            return3y: item.GETIRI3Y,
            return5y: item.GETIRI5Y,
        }));

        return NextResponse.json({ success: true, count: funds.length, data: funds });

    } catch (error: any) {
        console.error('TEFAS List API Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch funds', details: error.message }, { status: 500 });
    }
}
