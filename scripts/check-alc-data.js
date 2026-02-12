// const { fetchTefasData } = require('../src/lib/tefas');
const https = require('https');

// Mock fetchTefasData dependencies since we are running in a script
// We can just use the check-tefas logic here directly to be sure

async function getCookies() {
    return new Promise((resolve) => {
        const req = https.get('https://www.tefas.gov.tr/FonKarsilastirma.aspx', {
            rejectUnauthorized: false,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        }, (res) => {
            const cookies = res.headers['set-cookie'];
            resolve(cookies ? cookies.map(c => c.split(';')[0]).join('; ') : '');
        });
        req.on('error', () => resolve(''));
    });
}

async function checkALC() {
    console.log("Checking ALC...");
    const cookieHeader = await getCookies();
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

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Referer': 'https://www.tefas.gov.tr/FonKarsilastirma.aspx',
            'X-Requested-With': 'XMLHttpRequest',
            'Cookie': cookieHeader,
            'Content-Length': Buffer.byteLength(postData)
        },
        rejectUnauthorized: false
    };

    const req = https.request('https://www.tefas.gov.tr/api/DB/BindComparisonFundSizes', options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log("Response Length:", data.length);
                try {
                    const json = JSON.parse(data);
                    console.log("Total Funds Found:", json.data.length);
                    const alc = json.data.find(f => f.FONKODU === 'ALC');
                    console.log("ALC Data:", alc);
                } catch (e) {
                    console.error("Parse Error:", e);
                }
            });
        });
    req.write(postData);
    req.end();
}

checkALC();
