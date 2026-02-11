
const cheerio = require('cheerio');

async function testCalendar() {
    console.log("Testing Calendar Scraper...");
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        
        const url = 'https://bigpara.hurriyet.com.tr/piyasalar/ekonomik-takvim/';
        console.log(`Fetching: ${url}`);
        
        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            clearTimeout(timeout);

            if (!response.ok) {
                console.error(`Failed to fetch: ${response.status} ${response.statusText}`);
                return;
            }

            const html = await response.text();
            console.log(`Fetched HTML length: ${html.length}`);
            
            const tableIndex = html.indexOf('<div class="calendar-table"');
            if (tableIndex !== -1 || html.indexOf('<table') !== -1) {
                console.log("Found table/div.");
                // console.log(html.substring(tableIndex, tableIndex + 500));
            } else {
                console.log("No table found.");
            }
        } catch (err) {
            console.error("Fetch error:", err);
        }
    } catch (error) {
        console.error("Error scraping calendar:", error);
    }
}

testCalendar();
