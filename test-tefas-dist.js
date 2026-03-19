const https = require('https');

async function getCookies() {
    return new Promise((resolve) => {
        https.get('https://www.tefas.gov.tr/FonAnaliz.aspx', { rejectUnauthorized: false }, (res) => {
            const cookies = res.headers['set-cookie'];
            resolve(cookies ? cookies.map(c => c.split(';')[0]).join('; ') : '');
        });
    });
}

function tefasRequest(url, payload, cookies) {
    const postData = new URLSearchParams(payload).toString();
    return new Promise((resolve) => {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Referer': 'https://www.tefas.gov.tr/FonAnaliz.aspx',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Cookie': cookies,
                'Content-Length': Buffer.byteLength(postData).toString()
            },
            rejectUnauthorized: false,
            ciphers: 'DEFAULT@SECLEVEL=1',
            minVersion: 'TLSv1',
            secureOptions: require('constants').SSL_OP_LEGACY_SERVER_CONNECT
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

async function testDist() {
    const cookies = await getCookies();
    const payload = {
        "fonkod": "IPJ"
    };

    console.log("Testing BindFundAssetDistribution for IPJ...");
    const res = await tefasRequest('https://www.tefas.gov.tr/api/DB/BindFundAssetDistribution', payload, cookies);
    console.log("Distribution Response:", JSON.stringify(res).substring(0, 1000));

    // Also testing if we can get detailed info about what stocks they hold.
    // Usually that's not easily available via TEFAS API directly in a simple way, 
    // it often requires scraping the KAP reports or using a more specific API.
    // However, TEFAS shows "Hisse Senedi" as a category.
}

testDist();
