
const puppeteer = require('puppeteer');

async function run() {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log("Navigating to TEFAS...");
    try {
        await page.goto('https://www.tefas.gov.tr/FonKarsilastirma.aspx', { waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log("Page loaded. Executing fetch...");

        const result = await page.evaluate(async () => {
            try {
                const dateStr = "10.02.2025"; 
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

                const response = await fetch('/api/DB/BindComparisonFundReturns', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: new URLSearchParams(payload).toString()
                });

                if (!response.ok) return { error: response.statusText, status: response.status };
                return await response.json();
            } catch (e) {
                return { error: e.toString() };
            }
        });

        if (result.error) {
            console.log("Fetch Error:", result);
        } else {
            console.log("Success!");
            console.log(`Data count: ${result.data ? result.data.length : 'No data'}`);
        }
        
    } catch (error) {
        console.error("Script Error:", error);
    } finally {
        await browser.close();
        console.log("Browser closed.");
    }
}

run();
