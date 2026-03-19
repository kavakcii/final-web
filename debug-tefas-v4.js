const https = require('https');

function fetchWithNodeHttps(url, options, body) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, {
            ...options,
            rejectUnauthorized: false,
            ciphers: 'DEFAULT@SECLEVEL=1',
            minVersion: 'TLSv1',
            secureOptions: require('constants').SSL_OP_LEGACY_SERVER_CONNECT
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: data.substring(0, 100) });
                }
            });
        });
        req.on('error', (e) => reject(e));
        if (body) req.write(body);
        req.end();
    });
}

async function run() {
    console.log('Fetching cookies...');
    const cookieHeader = await new Promise((resolve, reject) => {
        const req = https.get('https://www.tefas.gov.tr/FonKarsilastirma.aspx', {
            rejectUnauthorized: false,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        }, (res) => {
            const cookies = res.headers['set-cookie'];
            resolve(cookies ? cookies.map(c => c.split(';')[0]).join('; ') : '');
        });
        req.on('error', reject);
    });

    const dateStr = "02.03.2026"; 
    const payload = {
        "calismatipi": "2", "fontip": "YAT", "sfontur": "", "kurucukod": "", "fongrup": "",
        "bastarih": dateStr, "bittarih": dateStr, "fonturkod": "", "fonunvantip": "",
        "strperiod": "1,1,1,1,1,1,1", "islemdurum": ""
    };
    const postData = new URLSearchParams(payload).toString();

    const url = 'https://www.tefas.gov.tr/api/DB/BindComparisonFundSizes';
    console.log(`Testing ${url} with security options for ${dateStr}...`);
        
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Referer': 'https://www.tefas.gov.tr/FonKarsilastirma.aspx',
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Origin': 'https://www.tefas.gov.tr',
            'Cookie': cookieHeader,
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    try {
        const res = await fetchWithNodeHttps(url, options, postData);
        console.log(`Status: ${res.status}`);
        if (res.data && res.data.data && res.data.data.length > 0) {
            console.log(`Found ${res.data.data.length} funds!`);
            console.log(`First item keys:`, Object.keys(res.data.data[0]));
            if (res.data.data[0].FONKODU === 'IPJ') {
                 console.log('IPJ Data:', res.data.data[0]);
            }
        } else {
            console.log('Response data empty or error:', JSON.stringify(res.data).substring(0, 100));
        }
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
}

run();
