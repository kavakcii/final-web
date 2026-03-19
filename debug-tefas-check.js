const https = require('https');

function tefasRequest(url, payload) {
    const postData = new URLSearchParams(payload).toString();
    return new Promise((resolve) => {
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
                    console.error('Parse error:', e, data.substring(0, 100));
                    resolve(null);
                }
            });
        });

        req.on('error', (e) => {
            console.error('Request error:', e);
            resolve(null)
        });
        req.write(postData);
        req.end();
    });
}

async function test() {
    const dateStr = "03.03.2026";
    const payload = {
        "calismatipi": "2", "fontip": "YAT", "sfontur": "", "kurucukod": "", "fongrup": "",
        "bastarih": dateStr, "bittarih": dateStr, "fonturkod": "", "fonunvantip": "",
        "strperiod": "1,1,1,1,1,1,1", "islemdurum": ""
    };

    console.log(`Testing with date: ${dateStr}`);
    const res = await tefasRequest('https://www.tefas.gov.tr/api/DB/BindComparisonFundSizes', payload);
    if (res && res.data) {
        console.log(`Found ${res.data.length} funds for ${dateStr}`);
        if (res.data.length > 0) {
            console.log("Sample:", res.data[0]);
        }
    } else {
        console.log(`No data for ${dateStr}, trying 02.03.2026`);
        payload.bastarih = "02.03.2026";
        payload.bittarih = "02.03.2026";
        const res2 = await tefasRequest('https://www.tefas.gov.tr/api/DB/BindComparisonFundSizes', payload);
        if (res2 && res2.data) {
            console.log(`Found ${res2.data.length} funds for 02.03.2026`);
        } else {
            console.log("Still no data.");
        }
    }
}

test();
