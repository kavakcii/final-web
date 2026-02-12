const puppeteer = require('puppeteer');

async function scrapeFoneria(code) {
    console.log(`Launching browser for Foneria: ${code}`);
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        console.log("Browser launched.");
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Try home first to check connectivity
        console.log("Checking home...");
        await page.goto('https://www.foneria.com.tr/', { waitUntil: 'domcontentloaded', timeout: 10000 });
        console.log("Home loaded.");

        // Try direct URL
        const url = `https://www.foneria.com.tr/yatirim-fonu/${code.toLowerCase()}`;
        console.log(`Navigating to: ${url}`);
        
        // Allow some redirects
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        
        console.log(`Current URL: ${page.url()}`);
        const title = await page.title();
        console.log(`Page Title: ${title}`);

        // Check if 404
        const content = await page.content();
        if (content.includes('404') || content.includes('Bulunamadı')) {
             console.log('Page seems to be 404/Not Found.');
        } else {
             console.log('Page loaded successfully (presumably).');
             // Look for Asset Distribution
             const text = await page.evaluate(() => document.body.innerText);
             if (text.includes('Varlık Dağılımı')) {
                 console.log('Found "Varlık Dağılımı" in text!');
             } else {
                 console.log('"Varlık Dağılımı" NOT found in text.');
             }
        }

    } catch (error) {
        console.error('Puppeteer Error:', error);
    } finally {
        if (browser) await browser.close();
    }
}

scrapeFoneria('YLE');
