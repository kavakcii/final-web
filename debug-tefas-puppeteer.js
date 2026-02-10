const puppeteer = require('puppeteer');

async function run() {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        dumpio: true
    });
    const page = await browser.newPage();

    try {
        console.log('Navigating to TEFAS...');
        
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        
        await page.goto('https://www.tefas.gov.tr/FonKarsilastirma.aspx', { 
            waitUntil: 'domcontentloaded',
            timeout: 60000 
        });

        console.log('Page loaded. Checking tabs...');
        
        // Setup request interception to catch the API call
        await page.setRequestInterception(true);
        page.on('request', request => {
            if (request.url().includes('BindComparison')) {
                console.log('API Request Detected:', request.url());
                console.log('Post Data:', request.postData());
            }
            request.continue();
        });
        
        page.on('response', async response => {
             if (response.url().includes('BindComparison')) {
                 console.log('API Response Received:', response.url());
                 try {
                     const json = await response.json();
                     if (json.data && json.data.length > 0) {
                         console.log('First item keys:', Object.keys(json.data[0]));
                     }
                 } catch (e) { console.log('Could not parse JSON'); }
             }
        });

        // Click on "Fon Büyüklükleri" tab
        // Inspecting TEFAS source (mental model): tabs are usually in a list
        // Let's try to find the link by text
        const clicked = await page.evaluate(async () => {
            const tabs = Array.from(document.querySelectorAll('.main-indicators .indicators-nav-item, .nav-tabs li a'));
            const target = tabs.find(t => t.innerText.includes('Fon Büyüklükleri'));
            if (target) {
                target.click();
                return true;
            }
            return false;
        });

        if (clicked) {
            console.log('Clicked "Fon Büyüklükleri" tab. Waiting for network...');
            await new Promise(r => setTimeout(r, 5000)); // Wait for request
        } else {
            console.log('Could not find "Fon Büyüklükleri" tab.');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
    }
}

run();
