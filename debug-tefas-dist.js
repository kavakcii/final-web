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

    // Payload for Distribution (Varlık Dağılımı)
    // Note: Usually requires fonkod for specific fund? Or it returns for all?
    // Let's try for a specific fund first via BindFundInfo (if exists) or BindComparisonFundDistribution
    
    // Actually, "FonKarsilastirma" page has "Fon Varlık Dağılımı" tab.
    // Endpoint: BindComparisonFundSizes might be distribution?
    // Let's try BindComparisonFundSizes again with the cookie fix.
    
    const endpoints = [
        'BindComparisonFundSizes', // Distribution?
        //'BindComparisonFundDistribution' // Guessing name
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

        const req = https.request(url, { ...options, rejectUnauthorized: false }, (res) => {
            console.log(`${ep} Status: ${res.statusCode}`);
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                 if(res.statusCode === 200) console.log(data.substring(0, 200));
            });
        });
        req.on('error', e => console.log(e.message));
        req.write(postData);
        req.end();
    }
}
run();
