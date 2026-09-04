const fs = require('fs');

async function testSources() {
  console.log('--- Testing Primary & Fallback Sources for BIST Data ---');

  // Test 1: TradingView Scanner (Price Primary)
  try {
    const start = Date.now();
    const res = await fetch('https://scanner.tradingview.com/turkey/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({ columns: ['name', 'close', 'change', 'volume', 'description'], range: [0, 10] })
    });
    console.log(`TradingView Scanner: Status ${res.status}, Time: ${Date.now() - start}ms`);
    if (res.ok) {
      const data = await res.json();
      console.log(`TradingView Sample Count: ${data.data?.length}`);
    }
  } catch (e) {
    console.error('TradingView error:', e.message);
  }

  // Test 2: Yahoo Finance v8 Chart (Price Fallback 1)
  try {
    const start = Date.now();
    const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/THYAO.IS?range=1d&interval=5m', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    console.log(`Yahoo v8 Chart: Status ${res.status}, Time: ${Date.now() - start}ms`);
    if (res.ok) {
      const data = await res.json();
      const meta = data.chart?.result?.[0]?.meta;
      console.log(`Yahoo Sample Price (THYAO): ${meta?.regularMarketPrice}`);
    }
  } catch (e) {
    console.error('Yahoo v8 Chart error:', e.message);
  }

  // Test 3: Yahoo Finance quoteSummary (Fundamentals Primary)
  try {
    const start = Date.now();
    const res = await fetch('https://query2.finance.yahoo.com/v10/finance/quoteSummary/THYAO.IS?modules=financialData,price,incomeStatementHistoryQuarterly', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    console.log(`Yahoo v10 quoteSummary: Status ${res.status}, Time: ${Date.now() - start}ms`);
    if (res.ok) {
      const data = await res.json();
      const price = data.quoteSummary?.result?.[0]?.price;
      console.log(`Yahoo quoteSummary Company: ${price?.longName}, Symbol: ${price?.symbol}`);
    }
  } catch (e) {
    console.error('Yahoo v10 quoteSummary error:', e.message);
  }

  // Test 4: Ekofin Net (Company details fallback)
  try {
    const start = Date.now();
    const res = await fetch('https://ekofin.net/sirket/detay/THYAO', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    console.log(`Ekofin Net: Status ${res.status}, Time: ${Date.now() - start}ms`);
  } catch (e) {
    console.error('Ekofin error:', e.message);
  }

  // Test 5: Is Yatirim Public Financial API or Scraping
  try {
    const start = Date.now();
    const res = await fetch('https://www.isyatirim.com.tr/_layouts/15/IsYatirim.MaliTablolar/MaliTablo.aspx', {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    console.log(`IsYatirim: Status ${res.status}, Time: ${Date.now() - start}ms`);
  } catch (e) {
    console.error('IsYatirim error:', e.message);
  }
}

testSources().catch(console.error);
