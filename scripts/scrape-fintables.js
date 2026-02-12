const puppeteer = require('puppeteer');

async function scrapeFintables(code) {
    console.log(`Launching browser for Fintables: ${code}`);
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const url = `https://fintables.com/fonlar/${code.toUpperCase()}`;
        console.log(`Navigating to: ${url}`);
        
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        console.log(`Title: ${await page.title()}`);

        // Look for "Varlık Dağılımı" or "Hisse Senetleri"
        // Fintables usually has a section.
        // Let's dump some text
        const text = await page.evaluate(() => document.body.innerText);
        if (text.includes('Varlık Dağılımı')) {
            console.log('Found "Varlık Dağılımı"!');
        }
        if (text.includes('Hisse Senedi Portföy Dağılımı') || text.includes('Portföy Dağılımı')) {
             console.log('Found "Portföy Dağılımı"!');
        }

        // Try to find specific stocks
        // Example: THYAO, GARAN
        const holdings = await page.evaluate(() => {
            // This is a guess. We need to inspect Fintables DOM.
            // Usually tables.
            const rows = Array.from(document.querySelectorAll('tr'));
            return rows.map(r => r.innerText).filter(t => t.includes('%'));
        });
        console.log('Potential holdings rows:', holdings.slice(0, 10));

    } catch (error) {
        console.error('Puppeteer Error:', error);
    } finally {
        if (browser) await browser.close();
    }
}

scrapeFintables('YLE');
