const https = require('https');

function getChartData(symbol, range, interval) {
  return new Promise((resolve) => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.IS?range=${range}&interval=${interval}`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const result = json.chart.result[0];
          const timestamps = result.timestamp;
          const prices = result.indicators.quote[0].close;
          resolve({ timestamps, prices, meta: result.meta });
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function run() {
  console.log("Testing chart data fetch for ASELS.IS...");
  const res = await getChartData("ASELS", "1d", "5m");
  if (res) {
    console.log("Success! Data points count:", res.prices ? res.prices.length : 0);
    console.log("Meta:", res.meta.regularMarketPrice, res.meta.chartPreviousClose);
  } else {
    console.log("Failed to fetch from Yahoo Finance.");
  }
}

run();
