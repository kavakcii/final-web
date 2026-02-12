// Standalone test script


const https = require('https');

function getTefasCookies() {
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

async function checkFund(code) {
    console.log(`Checking fund: ${code}...`);
    try {
        const cookieHeader = await getTefasCookies();
        const targetDate = new Date();
        // Adjust for weekend
        const day = targetDate.getDay();
        if (day === 0) targetDate.setDate(targetDate.getDate() - 2);
        else if (day === 6) targetDate.setDate(targetDate.getDate() - 1);

        const dateStr = `${String(targetDate.getDate()).padStart(2, '0')}.${String(targetDate.getMonth() + 1).padStart(2, '0')}.${targetDate.getFullYear()}`;
        console.log("Date used:", dateStr);

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
                'Content-Length': Buffer.byteLength(postData).toString()
            },
            rejectUnauthorized: false,
             // Legacy SSL options might be needed for TEFAS
             ciphers: 'DEFAULT@SECLEVEL=1',
             minVersion: 'TLSv1',
             secureOptions: require('constants').SSL_OP_LEGACY_SERVER_CONNECT
        };

        const req = https.request('https://www.tefas.gov.tr/api/DB/BindComparisonFundSizes', options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const funds = json.data || [];
                    const found = funds.find(f => f.FONKODU === code);
                    if (found) {
                        console.log("FOUND!");
                        console.log("Code:", found.FONKODU);
                        console.log("Name:", found.FONUNVAN);
                    } else {
                        console.log("Fund not found in today's list.");
                    }
                } catch (e) {
                    console.error('Parse Error:', e);
                }
            });
        });
        
        req.write(postData);
        req.end();

    } catch (e) {
        console.error("Error:", e);
    }
}

checkFund("YLE");
