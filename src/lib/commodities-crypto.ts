export interface LivePriceData {
  symbol: string;
  regularMarketPrice: number;
  shortName: string;
  currency: string;
}

let cacheData: Record<string, LivePriceData> = {};
let lastFetchTime = 0;
const CACHE_TTL_MS = 30 * 1000; // 30 Saniye Canlı Yenileme

export async function fetchLiveCommoditiesAndCrypto(): Promise<Record<string, LivePriceData>> {
  const now = Date.now();
  if (now - lastFetchTime < CACHE_TTL_MS && Object.keys(cacheData).length > 0) {
    return cacheData;
  }

  const newPrices: Record<string, LivePriceData> = {};

  // 1. BTCTürk Public API (Vercel Sunucu Engelsiz Canlı BTC-TRY & ETH-TRY)
  try {
    const res = await fetch('https://api.btcturk.com/api/v2/ticker', {
      next: { revalidate: 30 },
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    if (res.ok) {
      const json = await res.json();
      if (json && Array.isArray(json.data)) {
        json.data.forEach((item: { pair: string; last: number }) => {
          if (item.pair === 'BTCTRY') {
            const btcPrice = Number(item.last);
            newPrices['BTC'] = { symbol: 'BTC', regularMarketPrice: btcPrice, shortName: 'Bitcoin (BTC)', currency: 'TRY' };
            newPrices['BTC-TRY'] = { symbol: 'BTC-TRY', regularMarketPrice: btcPrice, shortName: 'Bitcoin (TRY)', currency: 'TRY' };
            newPrices['BITCOIN'] = { symbol: 'BITCOIN', regularMarketPrice: btcPrice, shortName: 'Bitcoin', currency: 'TRY' };
          }
          if (item.pair === 'ETHTRY') {
            const ethPrice = Number(item.last);
            newPrices['ETH'] = { symbol: 'ETH', regularMarketPrice: ethPrice, shortName: 'Ethereum (ETH)', currency: 'TRY' };
            newPrices['ETH-TRY'] = { symbol: 'ETH-TRY', regularMarketPrice: ethPrice, shortName: 'Ethereum (TRY)', currency: 'TRY' };
            newPrices['ETHEREUM'] = { symbol: 'ETHEREUM', regularMarketPrice: ethPrice, shortName: 'Ethereum', currency: 'TRY' };
          }
          if (item.pair === 'USDTTRY') {
            const usdtPrice = Number(item.last);
            newPrices['USDTRY'] = { symbol: 'USDTRY', regularMarketPrice: usdtPrice, shortName: 'Amerikan Doları', currency: 'TRY' };
            newPrices['USD'] = { symbol: 'USD', regularMarketPrice: usdtPrice, shortName: 'Amerikan Doları', currency: 'TRY' };
            newPrices['USDT'] = { symbol: 'USDT', regularMarketPrice: usdtPrice, shortName: 'Tether USD', currency: 'TRY' };
          }
        });
      }
    }
  } catch (e) {
    console.error('BTCTurk Live Fetch Error:', e);
  }

  // 2. Coinbase Public API (Yedek Canlı BTC-TRY & ETH-TRY)
  if (!newPrices['BTC']) {
    try {
      const res = await fetch('https://api.coinbase.com/v2/prices/BTC-TRY/spot', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data?.amount) {
          const btcPrice = parseFloat(json.data.amount);
          newPrices['BTC'] = { symbol: 'BTC', regularMarketPrice: btcPrice, shortName: 'Bitcoin (BTC)', currency: 'TRY' };
          newPrices['BTC-TRY'] = { symbol: 'BTC-TRY', regularMarketPrice: btcPrice, shortName: 'Bitcoin (TRY)', currency: 'TRY' };
        }
      }
    } catch (e) {
      console.error('Coinbase BTC Fetch Error:', e);
    }
  }

  if (!newPrices['ETH']) {
    try {
      const res = await fetch('https://api.coinbase.com/v2/prices/ETH-TRY/spot', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data?.amount) {
          const ethPrice = parseFloat(json.data.amount);
          newPrices['ETH'] = { symbol: 'ETH', regularMarketPrice: ethPrice, shortName: 'Ethereum (ETH)', currency: 'TRY' };
          newPrices['ETH-TRY'] = { symbol: 'ETH-TRY', regularMarketPrice: ethPrice, shortName: 'Ethereum (TRY)', currency: 'TRY' };
        }
      }
    } catch (e) {
      console.error('Coinbase ETH Fetch Error:', e);
    }
  }

  // 3. TradingEconomics BTCTRY Scraping (Yedeklama)
  if (!newPrices['BTC']) {
    try {
      const res = await fetch('https://tr.tradingeconomics.com/btctry:cur', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      if (res.ok) {
        const html = await res.text();
        const match = html.match(/id="market_last"[^>]*>([\d\.,]+)/i) || html.match(/<b id="price">([\d\.,]+)/i);
        if (match && match[1]) {
          const btcPrice = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
          newPrices['BTC'] = { symbol: 'BTC', regularMarketPrice: btcPrice, shortName: 'Bitcoin (BTC)', currency: 'TRY' };
        }
      }
    } catch (e) {
      console.error('TradingEconomics Fetch Error:', e);
    }
  }

  // 4. Truncgil Public Finans API (Gram Altın & Gram Gümüş & Dolar)
  try {
    const res = await fetch('https://finans.truncgil.com/today.json', {
      next: { revalidate: 30 },
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data['gram-altin']) {
        const goldStr = data['gram-altin']['Satış']?.replace(/\./g, '').replace(',', '.');
        if (goldStr) {
          const goldPrice = parseFloat(goldStr);
          newPrices['ALTIN'] = { symbol: 'ALTIN', regularMarketPrice: goldPrice, shortName: 'Gram Altın', currency: 'TRY' };
          newPrices['GA'] = { symbol: 'GA', regularMarketPrice: goldPrice, shortName: 'Gram Altın', currency: 'TRY' };
        }
      }
      if (data && data['gumus']) {
        const silverStr = data['gumus']['Satış']?.replace(/\./g, '').replace(',', '.');
        if (silverStr) {
          const silverPrice = parseFloat(silverStr);
          newPrices['GUMUS'] = { symbol: 'GUMUS', regularMarketPrice: silverPrice, shortName: 'Gram Gümüş', currency: 'TRY' };
        }
      }
      if (data && data['USD'] && !newPrices['USDTRY']) {
        const usdStr = data['USD']['Satış']?.replace(/\./g, '').replace(',', '.');
        if (usdStr) {
          const usdPrice = parseFloat(usdStr);
          newPrices['USDTRY'] = { symbol: 'USDTRY', regularMarketPrice: usdPrice, shortName: 'Amerikan Doları', currency: 'TRY' };
          newPrices['USD'] = { symbol: 'USD', regularMarketPrice: usdPrice, shortName: 'Amerikan Doları', currency: 'TRY' };
        }
      }
    }
  } catch (e) {
    console.error('Truncgil Live Price Error:', e);
  }

  if (Object.keys(newPrices).length > 0) {
    cacheData = newPrices;
    lastFetchTime = now;
  }

  return cacheData;
}
