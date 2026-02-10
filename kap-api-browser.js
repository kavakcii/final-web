const puppeteer = require('puppeteer');
const fs = require('fs');

async function run() {
    const log = (msg) => {
        console.log(msg);
        fs.appendFileSync('scraper-api.log', msg + '\n');
    };

    log("Starting KAP API Scraper (Browser Context)...");
    
    try {
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        log("Navigating to KAP Home...");
        await page.goto('https://www.kap.org.tr', { waitUntil: 'domcontentloaded' });
        
        log("Injecting fetch script...");
        
        const result = await page.evaluate(async () => {
            try {
                // Try member-disclosure endpoint
                const response = await fetch('/tr/api/member-disclosure', {
                    headers: {
                        'Accept': 'application/json, text/plain, */*'
                    }
                });
                
                if (!response.ok) {
                    return { error: `Status ${response.status}: ${response.statusText}` };
                }
                
                const text = await response.text();
                try {
                    return { json: JSON.parse(text) };
                } catch (e) {
                    return { text: text.substring(0, 500) }; // Return first 500 chars if not JSON
                }
            } catch (err) {
                return { error: err.toString() };
            }
        });
        
        log("API Result:");
        if (result.error) {
            log("Error: " + result.error);
        } else if (result.json) {
            log("Success! Received JSON.");
            log("Item count: " + (Array.isArray(result.json) ? result.json.length : 'Not an array'));
            
            // Save to file
            fs.writeFileSync('kap-members-browser.json', JSON.stringify(result.json, null, 2));
            log("Saved to kap-members-browser.json");
            
            // Search for MAC
            const jsonStr = JSON.stringify(result.json);
            if (jsonStr.includes('MAC') || jsonStr.includes('MARMARA')) {
                log("Found 'MAC'/'MARMARA' in response!");
            } else {
                log("'MAC'/'MARMARA' not found in response.");
            }
        } else {
            log("Received text: " + result.text);
        }

        // Try another endpoint if first one failed or was empty
        if (!result.json || (Array.isArray(result.json) && result.json.length === 0)) {
            log("Trying /tr/api/bistCompanies ...");
            const res2 = await page.evaluate(async () => {
                const r = await fetch('/tr/api/bistCompanies');
                return r.ok ? r.json() : { error: r.status };
            });
            log("BIST Companies Result: " + (Array.isArray(res2) ? res2.length : JSON.stringify(res2)));
        }
        
        await browser.close();
        log("Browser closed.");
        
    } catch (error) {
        log("Error: " + error.message);
        log(error.stack);
    }
}

run();