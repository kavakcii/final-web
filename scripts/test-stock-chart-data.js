const http = require('http');

const SYMBOLS = ['THYAO', 'ASELS', 'EREGL', 'GARAN', 'AKBNK', 'KARSN', 'TUPRS', 'SAHOL'];
const RANGES = ['1g', '1h', '1a', '3a', '6a', '1y', '5y'];

// Standardized mapping
const RANGE_MAP = {
  '1g': '1D',
  '1d': '1D',
  '1h': '1H',
  '1a': '1M',
  '1mo': '1M',
  '1m': '1M',
  '3a': '3M',
  '3mo': '3M',
  '6a': '6M',
  '6mo': '6M',
  '1y': '1Y',
  '5y': '5Y'
};

async function fetchFromLocalApi(symbol, range) {
  const timeframe = RANGE_MAP[range.toLowerCase()] || range.toUpperCase();
  const url = `http://localhost:3000/api/bist/stock?symbol=${symbol}&timeframe=${timeframe}`;
  
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ success: false, error: 'JSON Parse Error: ' + e.message });
        }
      });
    }).on('error', (err) => {
      resolve({ success: false, error: 'HTTP Error: ' + err.message });
    });
  });
}

// Direct Yahoo Finance verification for standalone testing
async function fetchDirectYahoo(symbol, range) {
  const cleanSymbol = symbol.toUpperCase().replace('.IS', '').trim() + '.IS';
  let yahooRange = '1mo';
  let interval = '1d';

  const normalized = (RANGE_MAP[range.toLowerCase()] || range).toUpperCase();
  if (normalized === '1H') { yahooRange = '1d'; interval = '2m'; }
  else if (normalized === '1D') { yahooRange = '1d'; interval = '5m'; }
  else if (normalized === '1M') { yahooRange = '1mo'; interval = '1d'; }
  else if (normalized === '3M') { yahooRange = '3mo'; interval = '1d'; }
  else if (normalized === '6M') { yahooRange = '6mo'; interval = '1d'; }
  else if (normalized === '1Y') { yahooRange = '1y'; interval = '1d'; }
  else if (normalized === '5Y') { yahooRange = '5y'; interval = '1wk'; }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${cleanSymbol}?range=${yahooRange}&interval=${interval}`;
  
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!res.ok) throw new Error(`Yahoo status ${res.status}`);
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result || !result.timestamp) throw new Error("No timestamp data in Yahoo response");

    const timestamps = result.timestamp;
    const quote = result.indicators?.quote?.[0] || {};
    const opens = quote.open || [];
    const highs = quote.high || [];
    const lows = quote.low || [];
    const closes = quote.close || [];
    const volumes = quote.volume || [];

    let candles = [];
    for (let i = 0; i < timestamps.length; i++) {
      const c = closes[i];
      if (c !== null && c !== undefined && !isNaN(c) && c > 0) {
        const o = opens[i] ?? c;
        const h = Math.max(highs[i] ?? c, o, c);
        const l = Math.min(lows[i] ?? c, o, c);
        const v = Math.max(0, volumes[i] ?? 0);
        const tsMs = timestamps[i] * 1000;
        
        const trDateStr = new Date(tsMs).toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
        const trTimeStr = new Date(tsMs).toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' });
        
        candles.push({
          timestamp: tsMs,
          date: trDateStr,
          time: trTimeStr,
          open: Number(o.toFixed(3)),
          high: Number(h.toFixed(3)),
          low: Number(l.toFixed(3)),
          close: Number(c.toFixed(3)),
          price: Number(c.toFixed(3)),
          volume: v
        });
      }
    }

    // Filter 1D for last session date ONLY
    if (normalized === '1D' && candles.length > 0) {
      const lastSessionDate = candles[candles.length - 1].date;
      candles = candles.filter(cand => cand.date === lastSessionDate);
    }

    // Filter 1H for last 60-120 mins of last session
    if (normalized === '1H' && candles.length > 0) {
      const lastSessionDate = candles[candles.length - 1].date;
      const lastSessionCandles = candles.filter(cand => cand.date === lastSessionDate);
      candles = lastSessionCandles.slice(-60);
    }

    // Sort ascending & deduplicate by timestamp
    candles.sort((a, b) => a.timestamp - b.timestamp);
    const uniqueMap = new Map();
    candles.forEach(cand => uniqueMap.set(cand.timestamp, cand));
    const finalCandles = Array.from(uniqueMap.values());

    return {
      success: true,
      symbol: cleanSymbol.replace('.IS', ''),
      range: normalized,
      source: 'Yahoo Finance Direct API',
      currentPrice: result.meta?.regularMarketPrice || finalCandles[finalCandles.length - 1]?.close,
      candles: finalCandles
    };
  } catch (err) {
    return {
      success: false,
      symbol,
      range,
      error: err.message
    };
  }
}

function auditCandles(candles) {
  if (!candles || candles.length === 0) {
    return {
      candleCount: 0,
      firstTs: null,
      lastTs: null,
      firstClose: null,
      lastClose: null,
      validOhlc: false,
      sorted: false,
      hasDuplicates: false,
      latestDataAgeSec: null
    };
  }

  let validOhlc = true;
  let sorted = true;
  let hasDuplicates = false;
  const seenTs = new Set();

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    
    // Check OHLC consistency: high >= max(open, close, low), low <= min(open, close, high)
    const maxVal = Math.max(c.open, c.close, c.low);
    const minVal = Math.min(c.open, c.close, c.high);
    if (c.high < maxVal - 0.001 || c.low > minVal + 0.001 || c.volume < 0) {
      validOhlc = false;
    }

    if (seenTs.has(c.timestamp)) {
      hasDuplicates = true;
    }
    seenTs.add(c.timestamp);

    if (i > 0 && c.timestamp <= candles[i - 1].timestamp) {
      sorted = false;
    }
  }

  const firstCandle = candles[0];
  const lastCandle = candles[candles.length - 1];
  const latestDataAgeSec = Math.round((Date.now() - lastCandle.timestamp) / 1000);

  return {
    candleCount: candles.length,
    firstTs: new Date(firstCandle.timestamp).toISOString(),
    lastTs: new Date(lastCandle.timestamp).toISOString(),
    firstClose: firstCandle.close,
    lastClose: lastCandle.close,
    validOhlc,
    sorted,
    hasDuplicates,
    latestDataAgeSec
  };
}

async function runChartDataAudit() {
  console.log("==================================================");
  console.log(" FİNAİ STOCK CHART DATA INTEGRITY AUDIT");
  console.log("==================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  for (const sym of SYMBOLS) {
    console.log(`\n----------------------------------------`);
    console.log(`SYMBOL: ${sym}`);
    console.log(`----------------------------------------`);

    for (const rng of RANGES) {
      totalTests++;
      const result = await fetchDirectYahoo(sym, rng);
      
      if (!result.success) {
        console.log(`  Range: ${rng.toUpperCase().padEnd(4)} | ERROR: ${result.error}`);
        continue;
      }

      const audit = auditCandles(result.candles);
      const isPassed = audit.candleCount > 0 && audit.validOhlc && audit.sorted && !audit.hasDuplicates;
      if (isPassed) passedTests++;

      console.log(`  Range: ${rng.toUpperCase().padEnd(4)} | Source: ${result.source.padEnd(25)} | Count: ${String(audit.candleCount).padStart(3)} | ValidOHLC: ${audit.validOhlc} | Sorted: ${audit.sorted} | Dupes: ${audit.hasDuplicates} | LastClose: ${audit.lastClose}`);
      
      if (rng.toLowerCase() === '1g' || rng.toLowerCase() === '1d') {
        const firstCandle = result.candles[0];
        const lastCandle = result.candles[result.candles.length - 1];
        console.log(`         -> 1G SESSION: Date=${lastCandle?.date} | Start=${firstCandle?.time} (${firstCandle?.close} ₺) | End=${lastCandle?.time} (${lastCandle?.close} ₺)`);
      }
    }
  }

  console.log("\n==================================================");
  console.log(` AUDIT SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log("==================================================\n");
}

runChartDataAudit();
