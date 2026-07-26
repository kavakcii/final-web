const https = require('https');

const postData = JSON.stringify({
  filter: [{ field: "type", operator: "equal", value: "stock" }],
  options: { active_symbols_only: true },
  symbols: { query: { types: ["stock"] } },
  columns: ["name", "close", "change", "volume", "market_cap_basic", "price_earnings_ttm"],
  sort: { sortBy: "market_cap_basic", sortOrder: "desc" },
  range: [0, 500]
});

const req = https.request('https://scanner.tradingview.com/turkey/scan', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(body);
      console.log(`TRADINGVIEW RETURNED ${json.totalCount} BIST STOCKS!`);
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
