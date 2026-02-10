const https = require('https');

function fetchWithNodeHttps(url, options, body) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, {
            ...options,
            rejectUnauthorized: false
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                     // resolve({ error: `Status ${res.statusCode}` });
                     // Don't fail, just return status
                }
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
    // 1. Get Cookies
    console.log('Fetching cookies...');
    const cookieHeader = await new Promise((resolve, reject) => {
        const req = https.get('https://www.tefas.gov.tr/FonKarsilastirma.aspx', {
            rejectUnauthorized: false,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        }, (res) => {
            const cookies = res.headers['set-cookie'];
            resolve(cookies ? cookies.map(c => c.split(';')[0]).join('; ') : '');
        });
        req.on('error', reject);
    });
    console.log('Cookies:', cookieHeader.substring(0, 50) + '...');

    const targetDate = new Date();
    if (targetDate.getFullYear() > 2025) targetDate.setFullYear(2025);
    // Adjust to weekday if needed, but TEFAS usually handles it or returns empty
    const day = targetDate.getDay();
    if (day === 0) targetDate.setDate(targetDate.getDate() - 2);
    else if (day === 6) targetDate.setDate(targetDate.getDate() - 1);
    
    const dayStr = String(targetDate.getDate()).padStart(2, '0');
    const monthStr = String(targetDate.getMonth() + 1).padStart(2, '0');
    const yearStr = targetDate.getFullYear();
    const dateStr = `${dayStr}.${monthStr}.${yearStr}`;
    
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
    const postData = new URLSearchParams(payload).toString();

    const endpoints = [
        'BindComparisonFundSizes', // Fon Büyüklükleri
        'BindComparisonFundInfo',  // Temel Veriler?
        'BindComparisonFundStats', // İstatistik?
        'BindComparisonFundManagementFees', // Yönetim Ücreti?
    ];

    for (const ep of endpoints) {
        const url = `https://www.tefas.gov.tr/api/DB/${ep}`;
        console.log(`Testing ${ep}...`);
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Referer': 'https://www.tefas.gov.tr/FonKarsilastirma.aspx',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Origin': 'https://www.tefas.gov.tr',
                'Cookie': cookieHeader,
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        try {
            const res = await fetchWithNodeHttps(url, options, postData);
            console.log(`Status: ${res.status}`);
            if (res.data && res.data.data && res.data.data.length > 0) {
                console.log(`Keys:`, Object.keys(res.data.data[0]));
            } else if (res.data) {
                console.log('Response data:', JSON.stringify(res.data).substring(0, 100));
            } else {
                console.log('Raw:', res.raw);
            }
        } catch (e) {
            console.log(`Error: ${e.message}`);
        }
        console.log('---');
    }
}

run();
