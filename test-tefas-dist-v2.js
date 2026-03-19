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
                    resolve({ raw: data.substring(0, 100), error: e.message });
                }
            });
        });

        req.on('error', (e) => resolve({ error: e.message }));
        req.write(postData);
        req.end();
    });
}

async function testDist() {
    const cookies = await getCookies();
    // Some funds need date in payload
    const payload = {
        "fonkod": "IPJ"
    };

    console.log("Testing BindFundAssetDistribution for IPJ (No Date)...");
    const res1 = await tefasRequest('https://www.tefas.gov.tr/api/DB/BindFundAssetDistribution', payload, cookies);
    console.log("No Date Response:", JSON.stringify(res1));

    const payloadWithDate = {
        "fonkod": "IPJ",
        "tarih": "02.03.2026"
    };
    console.log("Testing BindFundAssetDistribution for IPJ (With Date 02.03.2026)...");
    const res2 = await tefasRequest('https://www.tefas.gov.tr/api/DB/BindFundAssetDistribution', payloadWithDate, cookies);
    console.log("With Date Response:", JSON.stringify(res2));
}

testDist();
