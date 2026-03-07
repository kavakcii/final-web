import https from 'https';

export interface TefasFundData {
    FONKODU: string;
    FONUNVAN: string;
    SONPORTFOYDEGERI: number;
    SONPAYADEDI: number;
    TARIH: string;
    FONTURACIKLAMA?: string;
    KURUCUKODU?: string;
}

// Shared helper to get session cookies from TEFAS
let cachedCookies = '';
let lastCookieTime = 0;

async function getTefasCookies(): Promise<string> {
    const now = Date.now();
    if (cachedCookies && (now - lastCookieTime < 300000)) {
        return cachedCookies;
    }
    return new Promise((resolve) => {
        const req = https.get('https://www.tefas.gov.tr/FonKarsilastirma.aspx', {
            rejectUnauthorized: false,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        }, (res) => {
            const cookies = res.headers['set-cookie'];
            const cookieStr = cookies ? cookies.map(c => c.split(';')[0]).join('; ') : '';
            cachedCookies = cookieStr;
            lastCookieTime = Date.now();
            resolve(cookieStr);
        });
        req.on('error', () => resolve(''));
        req.end();
    });
}

// Shared helper for TEFAS HTTPS requests (Handles Legacy TLS and Cookies)
async function tefasRequest(url: string, payload: any): Promise<any> {
    const cookieHeader = await getTefasCookies();
    const postData = new URLSearchParams(payload).toString();

    return new Promise((resolve) => {
        const getLegacySslOption = () => {
            try {
                const crypto = require('crypto');
                return crypto.constants?.SSL_OP_LEGACY_SERVER_CONNECT || 0x4;
            } catch (e) {
                try {
                    return require('constants')?.SSL_OP_LEGACY_SERVER_CONNECT || 0x4;
                } catch (e2) {
                    return 0x4;
                }
            }
        };

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Referer': 'https://www.tefas.gov.tr/FonKarsilastirma.aspx',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Origin': 'https://www.tefas.gov.tr',
                'Cookie': cookieHeader,
                'Content-Length': Buffer.byteLength(postData).toString()
            },
            rejectUnauthorized: false,
            ciphers: 'DEFAULT@SECLEVEL=1',
            minVersion: 'TLSv1' as any,
            secureOptions: getLegacySslOption()
        };

        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    resolve(null);
                }
            });
        });

        req.on('error', () => resolve(null));
        req.write(postData);
        req.end();
    });
}

function formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

export async function fetchTefasData(date: Date): Promise<TefasFundData[]> {
    let attempts = 0;
    const maxAttempts = 5;
    let results: TefasFundData[] = [];
    let targetDate = new Date(date);

    while (attempts < maxAttempts && results.length === 0) {
        // Adjust for weekend
        const day = targetDate.getDay();
        if (day === 0) targetDate.setDate(targetDate.getDate() - 2); // Sunday -> Friday
        else if (day === 6) targetDate.setDate(targetDate.getDate() - 1); // Saturday -> Friday

        const dateStr = formatDate(targetDate);
        const payload = {
            "calismatipi": "2", "fontip": "YAT", "sfontur": "", "kurucukod": "", "fongrup": "",
            "bastarih": dateStr, "bittarih": dateStr, "fonturkod": "", "fonunvantip": "",
            "strperiod": "1,1,1,1,1,1,1", "islemdurum": ""
        };

        const resYAT = await tefasRequest('https://www.tefas.gov.tr/api/DB/BindComparisonFundSizes', payload);
        if (resYAT?.data) {
            results = [...results, ...resYAT.data];
        }

        payload.fontip = 'EMK';
        const resEMK = await tefasRequest('https://www.tefas.gov.tr/api/DB/BindComparisonFundSizes', payload);
        if (resEMK?.data) {
            results = [...results, ...resEMK.data];
        }

        if (results.length === 0) {
            targetDate.setDate(targetDate.getDate() - 1);
            attempts++;
        }
    }
    return results;
}

export async function fetchTefasHistory(fundCode: string, months: number = 4) {
    const end = formatDate(new Date());
    const start = formatDate(new Date(new Date().setMonth(new Date().getMonth() - months)));

    const fetchByType = async (type: string) => {
        const payload = {
            fontip: type, sfontur: '', fonkod: fundCode.toUpperCase(),
            bastarih: start, bittarih: end, fonuser: '', encutf: '', parabirimi: ''
        };
        const res = await tefasRequest('https://www.tefas.gov.tr/api/DB/BindHistoryInfo', payload);
        return res?.data || res;
    };

    let historyData = await fetchByType('YAT');
    if (!historyData || !Array.isArray(historyData) || historyData.length === 0) {
        historyData = await fetchByType('EMK');
    }

    if (Array.isArray(historyData) && historyData.length > 0) {
        return historyData.map((item: any) => {
            const dateStr = item.TARIH || item.TAR;
            let isoDate = dateStr;
            if (dateStr && dateStr.includes('.')) {
                const parts = dateStr.split('.');
                isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            return { date: isoDate, price: parseFloat(item.FIYAT) };
        }).sort((a, b) => a.date.localeCompare(b.date));
    }
    return null;
}

export async function fetchTefasComposition(fundCode: string) {
    let targetDate = new Date();
    let results = null;
    let attempts = 0;

    while (attempts < 5 && !results) {
        const dateStr = formatDate(targetDate);
        const payload = {
            fonkod: fundCode.toUpperCase(),
            bastarih: dateStr,
            bittarih: dateStr
        };
        const res = await tefasRequest('https://www.tefas.gov.tr/api/DB/BindFundCompositionHistory', payload);
        if (res?.data && res.data.length > 0) {
            results = res.data;
        } else {
            targetDate.setDate(targetDate.getDate() - 1);
            attempts++;
        }
    }
    return results;
}
