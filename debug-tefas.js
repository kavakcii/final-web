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
                console.log('Status Code:', res.statusCode);
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    console.log('Raw Data Preview:', data.substring(0, 200));
                    reject(new Error('Failed to parse JSON'));
                }
            });
        });
        req.on('error', (e) => reject(e));
        if (body) req.write(body);
        req.end();
    });
}

async function run() {
    const url = 'https://www.tefas.gov.tr/api/DB/BindComparisonFundReturns';
    
    // Logic from route.ts
    let targetDate = new Date();
    // Simulate the environment date: 2026-02-10
    // But wait, the system time on the machine running this script IS the environment time.
    // So new Date() will match what the route sees.
    
    if (targetDate.getFullYear() > 2025) {
         targetDate.setFullYear(2025);
    }
    const day = targetDate.getDay();
    if (day === 0) targetDate.setDate(targetDate.getDate() - 2);
    else if (day === 6) targetDate.setDate(targetDate.getDate() - 1);

    const dayStr = String(targetDate.getDate()).padStart(2, '0');
    const monthStr = String(targetDate.getMonth() + 1).padStart(2, '0');
    const yearStr = targetDate.getFullYear();
    const dateStr = `${dayStr}.${monthStr}.${yearStr}`;
    
    console.log(`Target Date: ${dateStr}`);

    const payload = {
        "calismatipi": "1",
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
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    try {
        // Step 1: Get Cookies
        console.log('Fetching initial cookies...');
        const initialRes = await new Promise((resolve, reject) => {
            const req = https.get('https://www.tefas.gov.tr/FonKarsilastirma.aspx', {
                rejectUnauthorized: false,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            }, (res) => {
                resolve(res);
            });
            req.on('error', reject);
        });

        const cookies = initialRes.headers['set-cookie'];
        console.log('Cookies received:', cookies);
        
        let cookieHeader = '';
        if (cookies) {
            cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');
        }
        console.log('Using Cookie Header:', cookieHeader);

        // Step 2: POST with Cookies
        options.headers['Cookie'] = cookieHeader;
        
        const response = await fetchWithNodeHttps(url, options, postData);
        console.log('Response Keys:', Object.keys(response));
        if (response.data) {
            console.log('response.data length:', response.data.length);
            if (response.data.length > 0) {
                console.log('First item keys:', Object.keys(response.data[0]));
            }
        } else {
            console.log('response.data is undefined!');
            console.log('Full response preview:', JSON.stringify(response).substring(0, 500));
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

run();
