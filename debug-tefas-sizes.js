const https = require('https');

function fetchWithNodeHttps(url, options, body) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, {
            ...options,
            rejectUnauthorized: false,
            // Try to fix socket hang up with TLS options
            ciphers: 'DEFAULT@SECLEVEL=1', // Allow weaker ciphers
            minVersion: 'TLSv1',
            secureOptions: require('constants').SSL_OP_LEGACY_SERVER_CONNECT
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log('Status Code:', res.statusCode);
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
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
    const url = 'https://www.tefas.gov.tr/api/DB/BindComparisonFundSizes';
    
    // Date Logic
    let targetDate = new Date();
    if (targetDate.getFullYear() > 2025) targetDate.setFullYear(2025);
    const day = targetDate.getDay();
    if (day === 0) targetDate.setDate(targetDate.getDate() - 2);
    else if (day === 6) targetDate.setDate(targetDate.getDate() - 1);

    const dayStr = String(targetDate.getDate()).padStart(2, '0');
    const monthStr = String(targetDate.getMonth() + 1).padStart(2, '0');
    const yearStr = targetDate.getFullYear();
    const dateStr = `${dayStr}.${monthStr}.${yearStr}`;
    
    console.log(`Target Date: ${dateStr}`);

    // Get Cookies First
    console.log('Fetching initial cookies...');
    const cookieHeader = await new Promise((resolve, reject) => {
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
        req.on('error', reject);
    });

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
        console.log('Sending request to BindComparisonFundSizes...');
        const response = await fetchWithNodeHttps(url, options, postData);
        if (response.data && response.data.length > 0) {
            console.log('First item keys:', Object.keys(response.data[0]));
            console.log('First item sample:', response.data[0]);
        } else {
            console.log('No data returned or empty.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

run();
