const https = require('https');

async function checkEndpoints() {
    console.log('Fetching cookies...');
    const cookieHeader = await new Promise((resolve) => {
        https.get('https://www.tefas.gov.tr/FonKarsilastirma.aspx', { rejectUnauthorized: false }, (res) => {
            const c = res.headers['set-cookie'];
            resolve(c ? c.map(x => x.split(';')[0]).join('; ') : '');
        });
    });

    const endpoints = [
        'BindComparisonFundAssetDistribution',
        'BindComparisonFundAllocation',
        'BindComparisonFundSubjectDistribution', // Sektörel
        'BindComparisonDistribution',
        'BindIndeces'
    ];

    const targetDate = new Date();
    // Weekday check
    if(targetDate.getDay() === 0) targetDate.setDate(targetDate.getDate()-2);
    if(targetDate.getDay() === 6) targetDate.setDate(targetDate.getDate()-1);
    
    const dateStr = `${String(targetDate.getDate()).padStart(2, '0')}.${String(targetDate.getMonth() + 1).padStart(2, '0')}.${targetDate.getFullYear()}`;

    const payload = {
        "calismatipi": "2",
        "fontip": "YAT",
        "bastarih": dateStr,
        "bittarih": dateStr,
        "strperiod": "1,1,1,1,1,1,1"
    };
    const postData = new URLSearchParams(payload).toString();

    for (const ep of endpoints) {
        console.log(`Checking ${ep}...`);
        const req = https.request(`https://www.tefas.gov.tr/api/DB/${ep}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Cookie': cookieHeader,
                'Content-Length': Buffer.byteLength(postData)
            },
            rejectUnauthorized: false
        }, (res) => {
            console.log(`${ep}: ${res.statusCode}`);
            if (res.statusCode === 200) {
                let d = '';
                res.on('data', c => d+=c);
                res.on('end', () => console.log(`${ep} Length: ${d.length}`));
            }
        });
        req.write(postData);
        req.end();
    }
}

checkEndpoints();
