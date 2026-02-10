const puppeteer = require('puppeteer');
const fs = require('fs');

async function run() {
    const log = (msg) => {
        console.log(msg);
        fs.appendFileSync('scraper-direct.log', msg + '\n');
    };

    log("Starting Direct Fund Scraper...");
    
    try {
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Disable timeout
        page.setDefaultNavigationTimeout(60000); // 60 seconds
        
        const fundUrl = 'https://www.kap.org.tr/tr/fon-bilgileri/genel/mac-marmara-capital-portfoy-hisse-senedi-tl-fonu-hisse-senedi-yogun-fon';
        log("Navigating to: " + fundUrl);
        
        await page.goto(fundUrl, { waitUntil: 'domcontentloaded' });
        log("Page loaded (DOM Content Loaded).");
        
        // Wait a bit for dynamic content
        await new Promise(r => setTimeout(r, 5000));
        
        // Take screenshot
        await page.screenshot({ path: 'fund-page-initial.png' });
        log("Initial screenshot saved.");
        
        // Check for 'Bildirimler' tab
        // It's usually a tab with text "Bildirimler"
        log("Searching for 'Bildirimler' tab...");
        
        // Use evaluate to find and click
        const clicked = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('a, div, span, li'));
            const tab = elements.find(el => el.textContent.trim() === 'Bildirimler');
            if (tab) {
                tab.click();
                return true;
            }
            return false;
        });
        
        if (clicked) {
            log("Clicked 'Bildirimler'. Waiting for data...");
            await new Promise(r => setTimeout(r, 5000));
            
            await page.screenshot({ path: 'fund-notifications.png' });
            log("Notifications screenshot saved.");
            
            // Scrape notifications
            const notifications = await page.evaluate(() => {
                // Notifications are usually in a table or list
                // Try to find rows containing dates and titles
                const rows = Array.from(document.querySelectorAll('.disclosure-row, tr, .w-row')); 
                return rows.map(r => r.innerText).filter(t => t.includes('Rapor'));
            });
            
            log("Found " + notifications.length + " potential report rows.");
            if (notifications.length > 0) {
                log("First 5 rows:");
                notifications.slice(0, 5).forEach(n => log("- " + n.replace(/\n/g, ' ')));
            } else {
                // Dump body text to see what's there
                const bodyText = await page.evaluate(() => document.body.innerText);
                log("Body text snippet: " + bodyText.substring(0, 200));
            }
            
        } else {
            log("'Bildirimler' tab not found.");
            // Log available tabs
            const tabs = await page.evaluate(() => {
                 const elements = Array.from(document.querySelectorAll('.tab, .nav-item, a'));
                 return elements.map(e => e.innerText).slice(0, 20);
            });
            log("Visible tabs/links: " + JSON.stringify(tabs));
        }
        
        await browser.close();
        log("Browser closed.");
        
    } catch (error) {
        log("Error: " + error.message);
        log(error.stack);
    }
}

run();