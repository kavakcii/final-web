const puppeteer = require('puppeteer');

async function run() {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        console.log('Navigating to TEFAS...');
        await page.goto('https://www.tefas.gov.tr/FonKarsilastirma.aspx', { 
            waitUntil: 'domcontentloaded',
            timeout: 60000 
        });

        // Get all tab texts to find the correct selector
        const tabs = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a')).map(a => ({
                text: a.innerText.trim(),
                id: a.id,
                class: a.className
            })).filter(t => t.text.length > 0);
        });
        
        console.log('Found links:', tabs.filter(t => t.text.includes('Büyüklük') || t.text.includes('Temel') || t.text.includes('Fiyat')));

        // Try to click "Temel Veriler" (Basic Data) which usually has Price
        const targetTab = tabs.find(t => t.text === 'Temel Veriler');
        
        if (targetTab) {
            console.log(`Clicking tab: ${targetTab.text} (ID: ${targetTab.id})`);
            // Click using the ID if available, or evaluate xpath
            if (targetTab.id) {
                await page.click(`#${targetTab.id}`);
            } else {
                 // Fallback
            }
            
            // Wait for table to update
            await new Promise(r => setTimeout(r, 5000));
        }

        // Now scrape the table headers to see what we have
        const headers = await page.evaluate(() => {
             const ths = document.querySelectorAll('table thead th');
             return Array.from(ths).map(th => th.innerText.trim());
        });
        console.log('Table Headers:', headers);

        // Scrape first row
        const firstRow = await page.evaluate(() => {
            const tr = document.querySelector('table tbody tr');
            if (!tr) return null;
            return Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
        });
        console.log('First Row:', firstRow);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
    }
}

run();
