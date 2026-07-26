const https = require('https');

const postData = JSON.stringify({
  columns: ["name", "close", "change", "volume", "price_earnings_ttm"],
  range: [0, 500]
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
      console.log(`TRADINGVIEW RESULT: totalCount=${json.totalCount}, data length=${json.data ? json.data.length : 0}`);
      if (json.data && json.data.length > 0) {
        console.log("Sample 3 stock quotes:", json.data.slice(0, 3));
      }
    } catch (e) {
      console.error("Error parsing JSON:", e.message);
    }
  });
});

req.on('error', (e) => console.error(e));
req.write(postData);
req.end();
