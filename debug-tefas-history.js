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

    const targetDate = new Date();
    if (targetDate.getFullYear() > 2025) targetDate.setFullYear(2025);
    const endDateStr = `${String(targetDate.getDate()).padStart(2, '0')}.${String(targetDate.getMonth() + 1).padStart(2, '0')}.${targetDate.getFullYear()}`;
    
    // Go back 1 month
    targetDate.setMonth(targetDate.getMonth() - 1);
    const startDateStr = `${String(targetDate.getDate()).padStart(2, '0')}.${String(targetDate.getMonth() + 1).padStart(2, '0')}.${targetDate.getFullYear()}`;

    const payload = {
        "fontip": "YAT",
        "fonkod": "MAC",
        "bastarih": startDateStr,
        "bittarih": endDateStr
    };
    const postData = new URLSearchParams(payload).toString();

    const url = 'https://www.tefas.gov.tr/api/DB/BindHistoryInfo';
    console.log(`Testing ${url} for MAC...`);
        
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Referer': 'https://www.tefas.gov.tr/TarihselVeriler.aspx', // Note: Different Referer!
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
            console.log(`Keys:`, Object.keys(res.data.data[0]));
            console.log(`Latest Entry:`, res.data.data[res.data.data.length - 1]);
        } else {
            console.log('Response data:', JSON.stringify(res.data).substring(0, 100));
        }
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
}

run();
