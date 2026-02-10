const https = require('https');

async function run() {
    console.log('Fetching cookies...');
    const cookieHeader = await new Promise((resolve, reject) => {
        const req = https.get('https://www.tefas.gov.tr/FonKarsilastirma.aspx', {
            rejectUnauthorized: false,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        }, (res) => {
            const cookies = res.headers['set-cookie'];
            resolve(cookies ? cookies.map(c => c.split(';')[0]).join('; ') : '');
        });
        req.on('error', reject);
    });

    const targetDate = new Date();
    if (targetDate.getFullYear() > 2025) targetDate.setFullYear(2025);
    const dateStr = `${String(targetDate.getDate()).padStart(2, '0')}.${String(targetDate.getMonth() + 1).padStart(2, '0')}.${targetDate.getFullYear()}`;

    // Test these endpoints
    const endpoints = [
        'BindComparisonFundAssetDistribution',
        'BindComparisonFundSizes', // Already checked, didn't seem to have breakdown
        'BindComparisonFundProfile'
    ];

    for (const ep of endpoints) {
        const url = `https://www.tefas.gov.tr/api/DB/${ep}`;
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

        console.log(`Testing ${ep}...`);
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Referer': 'https://www.tefas.gov.tr/FonKarsilastirma.aspx',
                'X-Requested-With': 'XMLHttpRequest',
                'Cookie': cookieHeader,
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(url, {
             ...options, 
             rejectUnauthorized: false,
             ciphers: 'DEFAULT@SECLEVEL=1', // Fix for ECONNRESET
             minVersion: 'TLSv1',
             secureOptions: require('constants').SSL_OP_LEGACY_SERVER_CONNECT
        }, (res) => {
            console.log(`${ep} Status: ${res.statusCode}`);
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                 if(res.statusCode === 200) {
                     try {
                        const json = JSON.parse(data);
                        if (json.data && json.data.length > 0) {
                            console.log(`${ep} Keys:`, Object.keys(json.data[0]));
                        } else {
                            console.log(`${ep} Empty data or error.`);
                        }
                     } catch(e) { console.log('Parse error'); }
                 }
            });
        });
        req.on('error', e => console.log(e.message));
        req.write(postData);
        req.end();
    }
}
run();
