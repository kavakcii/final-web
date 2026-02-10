
const https = require('https');

function getCookies() {
    return new Promise((resolve, reject) => {
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
        req.on('error', (e) => reject(e));
    });
}

async function fetchTefasData(endpoint) {
    try {
        const cookieHeader = await getCookies();
        console.log(`Got cookies for ${endpoint}:`, cookieHeader.substring(0, 20) + '...');

        const payload = {
            "calismatipi": "2",
            "fontip": "YAT",
            "sfontur": "",
            "kurucukod": "",
            "fongrup": "",
            "bastarih": "07.02.2025",
            "bittarih": "07.02.2025",
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
                'Cookie': cookieHeader,
                'Content-Length': Buffer.byteLength(postData)
            },
            rejectUnauthorized: false,
            ciphers: 'DEFAULT@SECLEVEL=1',
            minVersion: 'TLSv1',
            secureOptions: require('constants').SSL_OP_LEGACY_SERVER_CONNECT
        };

        console.log(`Fetching ${endpoint}...`);
        const req = https.request(`https://www.tefas.gov.tr/api/DB/${endpoint}`, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.data && json.data.length > 0) {
                        const fund = json.data[0];
                        console.log(`\n--- ${endpoint} Sample Keys ---`);
                        console.log(Object.keys(fund).join(', '));
                        console.log('FONGETIRI:', fund.FONGETIRI);
                    } else {
                        console.log(`\n--- ${endpoint} --- No data found`);
                    }
                } catch (e) {
                    console.error(`Error parsing ${endpoint}:`, e.message);
                    console.log('Response:', data.substring(0, 200));
                }
            });
        });

        req.on('error', (e) => console.error(`Request error ${endpoint}:`, e));
        req.write(postData);
        req.end();

    } catch (e) {
        console.error('Cookie error:', e);
    }
}

fetchTefasData('BindComparisonFundSizes');
fetchTefasData('BindComparisonFundReturns');
