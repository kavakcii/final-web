const https = require('https');

const postData = JSON.stringify({
  columns: ["name", "price_earnings_ttm", "close"],
  range: [0, 700]
});

const req = https.request('https://scanner.tradingview.com/turkey/scan', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'User-Agent': 'Mozilla/5.0'
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(body);
      console.log(`Fetched F/K ratios for ${json.data ? json.data.length : 0} BIST stocks.`);
      if (json.data && json.data.length > 0) {
        const peMap = {};
        json.data.forEach(item => {
          if (item && item.d) {
            const sym = item.d[0];
            const pe = item.d[1];
            if (pe !== null && pe !== undefined) {
              peMap[sym] = parseFloat(pe.toFixed(2));
            }
          }
        });
        console.log("Sample 10 F/K (P/E) Ratios:", Object.entries(peMap).slice(0, 10));
      }
    } catch (e) {
      console.error(e);
    }
  });
});

req.on('error', (e) => console.error(e));
req.write(postData);
req.end();
