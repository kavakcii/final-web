import https from 'https';

export interface TefasFundData {
    FONKODU: string;
    FONUNVAN: string;
    SONPORTFOYDEGERI: number;
    SONPAYADEDI: number;
    TARIH: string;
}

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

export async function fetchTefasData(date: Date): Promise<TefasFundData[]> {
    try {
        const cookieHeader = await getTefasCookies();

        // Adjust date if weekend
        const targetDate = new Date(date);
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
