const puppeteer = require('puppeteer');

async function scrapeFundHoldings(fundCode) {
    console.log(`Searching KAP for fund: ${fundCode}`);
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        // 1. Go to KAP Home instead of direct search URL (to avoid 500)
        const homeUrl = 'https://www.kap.org.tr/tr/';
        console.log(`Navigating to: ${homeUrl}`);
        await page.goto(homeUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        console.log('Home loaded. Waiting for search button/input...');
        
        // The search logic on KAP usually involves clicking a search icon or typing in a box.
        // Let's look for the search input. 
        // Based on KAP site, there is a search icon or input at the top.
        
        // Wait for body
        await page.waitForSelector('body');
        
        // Try to find the search input directly (often hidden behind an icon)
        // Or the search page link
        
        // Let's try to type in the global search box if visible
        // Selector guess: input[type="text"], .search-input, etc.
        
        // Actually, let's try to inspect the page via evaluation
        const searchInput = await page.evaluate(() => {
            // KAP usually has an input with placeholder "Kod, Şirket, Fon Adı..."
            const inputs = Array.from(document.querySelectorAll('input'));
            const sInput = inputs.find(i => i.placeholder && i.placeholder.includes('Kod'));
            if (sInput) {
                sInput.focus();
                return true;
            }
            // Or look for a search button
            const searchBtn = document.querySelector('.search-icon, .icon-search');
            if (searchBtn) {
                searchBtn.click();
                return 'clicked_icon';
            }
            return false;
        });

        if (searchInput) {
            console.log('Search input found/activated. Typing code...');
            if (searchInput === 'clicked_icon') {
                await new Promise(r => setTimeout(r, 1000));
            }
            
            // Type the code
            await page.keyboard.type(fundCode, { delay: 100 });
            
            console.log('Typed code. Waiting for autocomplete results...');
            await new Promise(r => setTimeout(r, 2000));
            
            // Look for results in the dropdown
            // Selectors: .autocomplete-suggestions, .ui-menu-item, .search-results
            
            const resultLink = await page.evaluate((code) => {
                const items = Array.from(document.querySelectorAll('a, li, div'));
                // We look for something that contains the code and looks like a result
                // Prioritize items that have "Fon" in text or href
                const match = items.find(el => {
                    const txt = el.innerText || '';
                    return txt.includes(code) && (txt.includes('Fon') || txt.includes('FON'));
                });
                
                if (match) {
                    // If it's a link, return href
                    if (match.href) return match.href;
                    // If it's a div/li inside a link or clickable
                    const parentLink = match.closest('a');
                    if (parentLink) return parentLink.href;
                    
                    match.click();
                    return 'clicked';
                }
                return null;
            }, fundCode);
            
            if (resultLink) {
                console.log('Result found:', resultLink);
                if (resultLink !== 'clicked') {
                    await page.goto(resultLink, { waitUntil: 'domcontentloaded' });
                } else {
                    await page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {});
                }
            } else {
                console.log('No autocomplete result found. Pressing Enter...');
                await page.keyboard.press('Enter');
                await page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {});
            }
        } else {
            console.log('Could not interact with search. Trying direct search URL again with Referer...');
            // ... fallback logic
        }

        // Now we should be on the fund page or search results
        console.log('Current URL:', page.url());
        
        // Check if we are on a fund page
        if (page.url().includes('fon-bilgileri')) {
            console.log('On Fund Page!');
            // ... (rest of the logic: find report)
             // 4. Search for "Portföy Dağılım Raporu"
            console.log('Scanning for "Portföy Dağılım Raporu"...');
            await new Promise(r => setTimeout(r, 2000));
            
            const report = await findReport(page);
            if (report) {
                 console.log('Report Found:', report);
                 // ... get PDF
                 await page.goto(report.url, { waitUntil: 'domcontentloaded' });
                 const pdfUrl = await getPdfUrl(page);
                 if (pdfUrl) return { ...report, pdfUrl };
                 return report;
            } else {
                console.log('Report not found on page. Checking "Bildirimler"...');
                 // Click Bildirimler
                 // ...
                 return null;
            }
        } else {
            console.log('Not on fund page. Maybe search results?');
            // ... handle search results
            return null;
        }

    } catch (error) {
        console.error('KAP Scraper Error:', error);
        return null;
    } finally {
        await browser.close();
    }
}

async function findReport(page) {
    return await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a'));
        const reportLink = anchors.find(a => a.innerText && a.innerText.includes('Portföy Dağılım Raporu'));
        if (reportLink) return { title: reportLink.innerText.trim(), url: reportLink.href };
        return null;
    });
}

async function getPdfUrl(page) {
    return await page.evaluate(() => {
         const anchors = Array.from(document.querySelectorAll('a'));
         const pdf = anchors.find(a => (a.href && a.href.endsWith('.pdf')) || (a.innerText && a.innerText.includes('İndir')));
         return pdf ? pdf.href : null;
    });
}

const code = process.argv[2];
if (code) {
    scrapeFundHoldings(code).then(res => console.log(JSON.stringify(res, null, 2)));
} else {
    console.log('Usage: node kap-scraper.js <FUND_CODE>');
}
