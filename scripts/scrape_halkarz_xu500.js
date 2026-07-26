const fs = require('fs');
const path = require('path');
const https = require('https');

function fetchPage(page) {
  return new Promise((resolve) => {
    const url = page === 1 ? 'https://halkarz.com/bist-endeks/xu500/' : `https://halkarz.com/bist-endeks/xu500/page/${page}/`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

async function run() {
  console.log("Scraping halkarz.com BIST 500 pages...");
  const stockMap = {};

  for (let p = 1; p <= 25; p++) {
    console.log(`Fetching page ${p}...`);
    const html = await fetchPage(p);
    
    // Regex for il-bist-kod and company name
    // Example: <h2 class="il-bist-kod">\n ATATR</h2>...title="Ata Turizm..."
    const matches = html.matchAll(/<h2 class="il-bist-kod">\s*([A-Z0-9]+)\s*<\/h2>[\s\S]*?title="([^"]+)"/g);
    let count = 0;
    for (const match of matches) {
      const code = match[1].trim();
      const name = match[2].trim();
      if (code && name && !stockMap[code]) {
        stockMap[code] = name;
        count++;
      }
    }
    console.log(`Page ${p} parsed: found ${count} stocks.`);
  }

  console.log(`TOTAL UNIQUE STOCKS EXTRACTED FROM HALKARZ XU500: ${Object.keys(stockMap).length}`);

  const outputPath = path.join(__dirname, 'halkarz_xu500_data.json');
  fs.writeFileSync(outputPath, JSON.stringify(stockMap, null, 2), 'utf-8');
  console.log(`Saved scraped data to ${outputPath}`);
}

run();
