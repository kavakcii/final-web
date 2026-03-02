import https from 'https';

export interface TefasFundData {
    FONKODU: string;
    FONUNVAN: string;
    SONPORTFOYDEGERI: number;
    SONPAYADEDI: number;
    TARIH: string;
}

// Shared helper for TEFAS HTTPS requests (Handles Legacy TLS)
function tefasRequest(url: string, payload: any): Promise<any> {
    const postData = new URLSearchParams(payload).toString();
    return new Promise((resolve, reject) => {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Referer': 'https://www.tefas.gov.tr/',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Content-Length': Buffer.byteLength(postData).toString()
            },
            rejectUnauthorized: false,
            ciphers: 'DEFAULT@SECLEVEL=1',
            minVersion: 'TLSv1' as any,
            secureOptions: (require('constants') as any).SSL_OP_LEGACY_SERVER_CONNECT
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

        req.on('error', (e) => resolve(null));
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
    const targetDate = new Date(date);
    const day = targetDate.getDay();
    if (day === 0) targetDate.setDate(targetDate.getDate() - 2);
    else if (day === 6) targetDate.setDate(targetDate.getDate() - 1);

    const dateStr = formatDate(targetDate);
    const payload = {
        "calismatipi": "2", "fontip": "YAT", "sfontur": "", "kurucukod": "", "fongrup": "",
        "bastarih": dateStr, "bittarih": dateStr, "fonturkod": "", "fonunvantip": "",
        "strperiod": "1,1,1,1,1,1,1", "islemdurum": ""
    };

    const resYAT = await tefasRequest('https://www.tefas.gov.tr/api/DB/BindComparisonFundSizes', payload);
    let results = resYAT?.data || [];

    // Also fetch EMK for pension funds
    payload.fontip = 'EMK';
    const resEMK = await tefasRequest('https://www.tefas.gov.tr/api/DB/BindComparisonFundSizes', payload);
    if (resEMK?.data) results = [...results, ...resEMK.data];

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
