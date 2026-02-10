const puppeteer = require('puppeteer');
const fs = require('fs');

async function run() {
    const log = (msg) => {
        console.log(msg);
        fs.appendFileSync('scraper-search-sniff.log', msg + '\n');
    };

    log("Starting KAP Search Sniffer...");
    
    try {
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Log requests
        await page.setRequestInterception(true);
        page.on('request', request => {
            if (['xhr', 'fetch', 'script'].includes(request.resourceType())) {
                // Only log interesting ones
                if (request.url().includes('api') || request.url().includes('search') || request.url().includes('json')) {
                    log("Request: " + request.url());
                }
            }
            request.continue();
        });

        page.on('response', async response => {
             const url = response.url();
             if ((url.includes('api') || url.includes('json')) && response.request().resourceType() === 'xhr') {
                 try {
                     const text = await response.text();
                     if (text.includes('MAC') || text.includes('MARMARA')) {
                         log("!!! MATCH FOUND IN RESPONSE: " + url);
                         log("Response Snippet: " + text.substring(0, 200));
                     }
                 } catch (e) {}
             }
        });

        log("Navigating to KAP...");
        await page.goto('https://www.kap.org.tr', { waitUntil: 'domcontentloaded' });
        
        const searchInputSelector = '#all-search';
        await page.waitForSelector(searchInputSelector);
        
        log("Typing 'MAC'...");
        await page.type(searchInputSelector, 'MAC');
        
        await new Promise(r => setTimeout(r, 5000));
        
        await browser.close();
        log("Browser closed.");
        
    } catch (error) {
        log("Error: " + error.message);
        log(error.stack);
    }
}

run();