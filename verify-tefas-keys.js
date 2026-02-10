
const https = require('https');

function fetchOneFund() {
    const payload = {
        "calismatipi": "2",
        "fontip": "YAT",
        "sfontur": "",
        "kurucukod": "",
        "fongrup": "",
        "bastarih": "10.02.2025",
        "bittarih": "10.02.2025",
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
            'User-Agent': 'Mozilla/5.0',
            'Content-Length': Buffer.byteLength(postData)
        },
        rejectUnauthorized: false
    };

    const req = https.request('https://www.tefas.gov.tr/api/DB/BindComparisonFundReturns', options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (json.data && json.data.length > 0) {
                    const fund = json.data[0];
                    console.log('Available keys:', Object.keys(fund));
                    console.log('GETIRI3Y:', fund.GETIRI3Y);
                    console.log('GETIRI5Y:', fund.GETIRI5Y);
                } else {
                    console.log('No data found');
                }
            } catch (e) {
                console.error(e);
            }
        });
    });

    req.write(postData);
    req.end();
}

fetchOneFund();
