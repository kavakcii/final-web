
const cheerio = require('cheerio');

async function fetchAllFunds() {
    try {
        console.log('Fetching TEFAS funds list via API...');
        
        const url = 'https://www.tefas.gov.tr/api/DB/BindComparisonFundReturns';
        
        // Get today's date in YYYY-MM-DD format (or DD.MM.YYYY depending on API)
        // TEFAS usually expects a specific format. Let's try standard ISO or check online.
        // Usually, the API accepts standard Form Data or JSON.
        // Let's try a standard payload seen in browser devtools for this endpoint.
        
        const payload = {
            "calismatipi": "2",
            "fontip": "YAT",
            "sfontur": "",
            "kurucukod": "",
            "fongrup": "",
            "bastarih": "2024-01-01", // just a dummy date, usually it returns latest
            "bittarih": "2024-01-01",
            "fonturkod": "",
            "fonunvantip": "",
            "strperiod": "1,1,1,1,1,1,1",
            "islemdurum": ""
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Referer': 'https://www.tefas.gov.tr/FonKarsilastirma.aspx',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            body: new URLSearchParams(payload).toString()
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('API Response received.');
        
        if (data && data.data && Array.isArray(data.data)) {
            console.log(`Total Funds Found: ${data.data.length}`);
            console.log('First 3 funds:', data.data.slice(0, 3));
        } else {
            console.log('Data format unexpected:', JSON.stringify(data).substring(0, 200));
        }
        
    } catch (error) {
        console.error('Error fetching TEFAS list:', error.message);
    }
}

fetchAllFunds();
