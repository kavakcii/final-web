const cheerio = require('cheerio');

async function testSource(url, name) {
    try {
        console.log(`\n--- Testing ${name} ---`);
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
        const html = await res.text();
        const $ = cheerio.load(html);
        
        console.log(`Title: ${$('title').text()}`);
        console.log(`Tables found: ${$('table').length}`);
        
        $('table tr').each((i, el) => {
            if (i < 5) console.log($(el).text().replace(/\s+/g, ' ').trim());
        });
    } catch (e) {
        console.error(`${name} failed:`, e.message);
    }
}

async function run() {
    await testSource('https://www.getmidas.com/temettu-veren-hisseler/', 'Midas');
}

run();
