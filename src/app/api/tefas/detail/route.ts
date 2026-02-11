import { NextResponse } from 'next/server';
import https from 'https';

// Helper to handle HTTPS requests with legacy options
async function fetchTefasData(endpoint: string, payload: any, cookieHeader: string) {
    return new Promise((resolve, reject) => {
        const postData = new URLSearchParams(payload).toString();
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
            // TLS Legacy Options for TEFAS
            ciphers: 'DEFAULT@SECLEVEL=1',
            minVersion: 'TLSv1' as any,
            secureOptions: (require('constants') as any).SSL_OP_LEGACY_SERVER_CONNECT
        };

        const req = https.request(`https://www.tefas.gov.tr/api/DB/${endpoint}`, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

export async function POST(request: Request) {
    try {
        const { fundCode } = await request.json();

        // 1. Get Cookies
        const cookieHeader = await new Promise<string>((resolve) => {
            const req = https.get('https://www.tefas.gov.tr/FonKarsilastirma.aspx', {
                rejectUnauthorized: false,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            }, (res) => {
                const cookies = res.headers['set-cookie'];
                resolve(cookies ? cookies.map(c => c.split(';')[0]).join('; ') : '');
            });
            req.on('error', () => resolve(''));
        });

        // 2. Prepare Date (Use 2025 as fallback if needed, similar to logic)
        const targetDate = new Date();
        // Use a fixed recent date or today. TEFAS handles future dates by returning latest?
        // Let's use logic from debug script: if > 2025 set to 2025 (just in case of data gaps)
        // But for live data we should try today.
        // Actually, for "Sizes" (Prices), we want the LATEST.
        const dateStr = `${String(targetDate.getDate()).padStart(2, '0')}.${String(targetDate.getMonth() + 1).padStart(2, '0')}.${targetDate.getFullYear()}`;

        // 3. Fetch Data (BindComparisonFundSizes for Price/Size)
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

        // Note: BindComparisonFundSizes returns ALL funds. We need to filter.
        // It's heavy to fetch all every time for one fund, but TEFAS API doesn't seem to support single fund filter here easily?
        // Actually, we can try filtering by 'kurucukod' if we knew it, but we only have 'fundCode'.

        const data: any = await fetchTefasData('BindComparisonFundSizes', payload, cookieHeader);

        let fundData = null;
        if (data && data.data) {
            fundData = data.data.find((f: any) => f.FONKODU === fundCode);
        }

        if (!fundData) {
            // Fallback: Try fetching BindComparisonFundInfo?
            return NextResponse.json({ error: 'Fund not found or data empty' }, { status: 404 });
        }

        return NextResponse.json(fundData);

    } catch (error) {
        console.error('TEFAS Detail API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
