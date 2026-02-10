const puppeteer = require('puppeteer');

async function run() {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    try {
        console.log('Navigating to Fintables...');
        await page.goto('https://fintables.com/fonlar/MAC', { waitUntil: 'networkidle2' });

        console.log('Page loaded. Searching for stock data...');
        
        // Look for common stock codes in the body
        const content = await page.content();
        if (content.includes('THYAO') || content.includes('TUPRS')) {
            console.log('Found stock codes!');
            
            // Try to extract the holdings table
            const holdings = await page.evaluate(() => {
                // This selector is a guess, looking for tables or lists
                // We'll search for rows containing percentage signs
                const rows = Array.from(document.querySelectorAll('tr, li, div'));
                const results = [];
                
                rows.forEach(row => {
                    const text = row.innerText;
                    if (text.includes('%') && (text.includes('THYAO') || text.includes('MGROS'))) {
                        results.push(text.trim().replace(/\n/g, ' '));
                    }
                });
                // Filter duplicates and return top 5
                return [...new Set(results)].slice(0, 5);
            });
            
            console.log('Extracted Holdings:', holdings);
        } else {
            console.log('Stock codes NOT found in rendered content.');
            console.log('Title:', await page.title());
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
    }
}
run();
