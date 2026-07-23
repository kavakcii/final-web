export interface LivePriceData {
  symbol: string;
  regularMarketPrice: number;
  shortName: string;
  currency: string;
}

let cacheData: Record<string, LivePriceData> = {};
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 Saniye Canlı Yenileme

export async function fetchLiveCommoditiesAndCrypto(): Promise<Record<string, LivePriceData>> {
  const now = Date.now();
  if (now - lastFetchTime < CACHE_TTL_MS && Object.keys(cacheData).length > 0) {
    return cacheData;
  }

  const newPrices: Record<string, LivePriceData> = {};

  // 1. Binance Public Ticker API (BTC, ETH, USDTRY - API Keysiz / Ücretsiz)
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbols=["BTCUSDT","ETHUSDT","BTCTRY","ETHTRY","USDTTRY"]', {
      next: { revalidate: 60 },
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        data.forEach((item: { symbol: string; price: string }) => {
          const price = parseFloat(item.price);
          if (item.symbol === 'BTCTRY') {
            newPrices['BTC'] = { symbol: 'BTC', regularMarketPrice: price, shortName: 'Bitcoin', currency: 'TRY' };
            newPrices['BTC-TRY'] = { symbol: 'BTC-TRY', regularMarketPrice: price, shortName: 'Bitcoin (TRY)', currency: 'TRY' };
          }
          if (item.symbol === 'BTCUSDT' && !newPrices['BTC']) {
            newPrices['BTC'] = { symbol: 'BTC', regularMarketPrice: price, shortName: 'Bitcoin', currency: 'USD' };
            newPrices['BTC-USD'] = { symbol: 'BTC-USD', regularMarketPrice: price, shortName: 'Bitcoin (USD)', currency: 'USD' };
          }
          if (item.symbol === 'ETHTRY') {
            newPrices['ETH'] = { symbol: 'ETH', regularMarketPrice: price, shortName: 'Ethereum', currency: 'TRY' };
            newPrices['ETH-TRY'] = { symbol: 'ETH-TRY', regularMarketPrice: price, shortName: 'Ethereum (TRY)', currency: 'TRY' };
          }
          if (item.symbol === 'ETHUSDT' && !newPrices['ETH']) {
            newPrices['ETH'] = { symbol: 'ETH', regularMarketPrice: price, shortName: 'Ethereum', currency: 'USD' };
            newPrices['ETH-USD'] = { symbol: 'ETH-USD', regularMarketPrice: price, shortName: 'Ethereum (USD)', currency: 'USD' };
          }
          if (item.symbol === 'USDTTRY') {
            newPrices['USDTRY'] = { symbol: 'USDTRY', regularMarketPrice: price, shortName: 'Amerikan Doları', currency: 'TRY' };
            newPrices['USD'] = { symbol: 'USD', regularMarketPrice: price, shortName: 'Amerikan Doları', currency: 'TRY' };
            newPrices['USDT'] = { symbol: 'USDT', regularMarketPrice: price, shortName: 'Tether USD', currency: 'TRY' };
          }
        });
      }
    }
  } catch (e) {
    console.error('Binance Live Price Error:', e);
  }

  // 2. Truncgil Public Finans API (Gram Altın & Dolar - API Keysiz / Ücretsiz)
  try {
    const res = await fetch('https://finans.truncgil.com/today.json', {
      next: { revalidate: 60 },
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
