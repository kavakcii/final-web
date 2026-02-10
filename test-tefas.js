
const https = require('https');

function getCookies(callback) {
    const options = {
        hostname: 'www.tefas.gov.tr',
        port: 443,
        path: '/',
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
        const cookies = res.headers['set-cookie'];
        callback(cookies);
    });
    
    req.on('error', (e) => {
        console.error(`Cookie fetch error: ${e.message}`);
    });
    
    req.end();
}

function postTefas(dateStr, cookies) {
    const data = new URLSearchParams({
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
    }).toString();

    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Referer': 'https://www.tefas.gov.tr/FonKarsilastirma.aspx',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': 'https://www.tefas.gov.tr',
        'Content-Length': data.length
    };

    if (cookies) {
        headers['Cookie'] = cookies.map(c => c.split(';')[0]).join('; ');
    }

    const options = {
        hostname: 'www.tefas.gov.tr',
        port: 443,
        path: '/api/DB/BindComparisonFundReturns',
        method: 'POST',
        headers: headers,
        rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log(`Date: ${dateStr}, Status: ${res.statusCode}`);
            try {
                const json = JSON.parse(body);
                console.log(`Data count: ${json.data ? json.data.length : 'No data field'}`);
            } catch (e) {
                console.log('Body is not JSON:', body.substring(0, 100));
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
    });

    req.write(data);
    req.end();
}

getCookies((cookies) => {
    console.log("Cookies:", cookies);
    // Use a known past valid date. If today is 2026 in system, let's use 2025.
    postTefas('10.02.2025', cookies); 
});
