const puppeteer = require('puppeteer');
const fs = require('fs');

async function run() {
    const log = (msg) => {
        console.log(msg);
        fs.appendFileSync('scraper-details.log', msg + '\n');
    };

    log("Starting Detailed Fund Scraper...");
    
    try {
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        page.setDefaultNavigationTimeout(60000);
        
        const fundUrl = 'https://www.kap.org.tr/tr/fon-bilgileri/genel/mac-marmara-capital-portfoy-hisse-senedi-tl-fonu-hisse-senedi-yogun-fon';
        log("Navigating to: " + fundUrl);
        
        await page.goto(fundUrl, { waitUntil: 'domcontentloaded' });
        log("Page loaded.");
        
        // Wait for hydration
        await new Promise(r => setTimeout(r, 5000));
        
        // Find and click Bildirimler
        const clicked = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('a, div.v-tab')); // trying v-tab class if vue
            const tab = elements.find(el => el.innerText && el.innerText.includes('Bildirimler'));
            if (tab) {
                tab.click();
                return true;
            }
            return false;
        });
        
        if (clicked) {
            log("Clicked 'Bildirimler'. Waiting 10s for AJAX...");
            await new Promise(r => setTimeout(r, 10000));
            
            // Save full text to analyze
            const content = await page.content();
            fs.writeFileSync('kap-page.html', content);
            log("Saved page HTML to kap-page.html");
            
            const bodyText = await page.evaluate(() => document.body.innerText);
            fs.writeFileSync('kap-text.txt', bodyText);
            log("Saved text to kap-text.txt");
            
            // Look for specific report
            if (bodyText.includes('Portföy Dağılım Raporu')) {
                log("FOUND: 'Portföy Dağılım Raporu' is present in text!");
                
                // Try to find the link
                const links = await page.evaluate(() => {
                    return Array.from(document.querySelectorAll('a'))
                        .filter(a => a.innerText.includes('Portföy Dağılım Raporu') || a.href.includes('bildirim'))
                        .map(a => ({ text: a.innerText, href: a.href }));
                });
                
                log("Potential links found: " + links.length);
                const reportLink = links.find(l => l.text.includes('Portföy Dağılım Raporu'));
                
                if (reportLink) {
                    log("Report Link: " + reportLink.href);
                } else {
                    log("Text found but no direct link match. Dumping all links to log...");
                    links.slice(0, 10).forEach(l => log(l.text + " -> " + l.href));
                }
            } else {
                log("NOT FOUND: 'Portföy Dağılım Raporu' text not in body.");
            }
            
        } else {
            log("Could not find 'Bildirimler' tab to click.");
        }
        
        await browser.close();
        log("Browser closed.");
        
    } catch (error) {
        log("Error: " + error.message);
        log(error.stack);
    }
}

run();