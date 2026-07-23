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

  // 1. Binance Public Ticker API (BTC, ETH, USDTRY - Canlı TL ve USD Fiyatları)
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbols=["BTCUSDT","ETHUSDT","BTCTRY","ETHTRY","USDTTRY"]', {
      next: { revalidate: 30 },
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        let usdtTryPrice = 47.2;
        const usdtItem = data.find((i: any) => i.symbol === 'USDTTRY');
        if (usdtItem) {
          usdtTryPrice = parseFloat(usdtItem.price);
          newPrices['USDTRY'] = { symbol: 'USDTRY', regularMarketPrice: usdtTryPrice, shortName: 'Amerikan Doları', currency: 'TRY' };
          newPrices['USD'] = { symbol: 'USD', regularMarketPrice: usdtTryPrice, shortName: 'Amerikan Doları', currency: 'TRY' };
          newPrices['USDT'] = { symbol: 'USDT', regularMarketPrice: usdtTryPrice, shortName: 'Tether USD', currency: 'TRY' };
        }

        data.forEach((item: { symbol: string; price: string }) => {
          const price = parseFloat(item.price);
          
          if (item.symbol === 'BTCTRY') {
            // BTC sembolüne canlı TÜRK LİRASI (TRY) fiyatını atıyoruz
            newPrices['BTC'] = { symbol: 'BTC', regularMarketPrice: price, shortName: 'Bitcoin (BTC)', currency: 'TRY' };
            newPrices['BTC-TRY'] = { symbol: 'BTC-TRY', regularMarketPrice: price, shortName: 'Bitcoin (TRY)', currency: 'TRY' };
            newPrices['BITCOIN'] = { symbol: 'BITCOIN', regularMarketPrice: price, shortName: 'Bitcoin', currency: 'TRY' };
          }
          if (item.symbol === 'BTCUSDT') {
            newPrices['BTC-USD'] = { symbol: 'BTC-USD', regularMarketPrice: price, shortName: 'Bitcoin (USD)', currency: 'USD' };
            newPrices['BTCUSD'] = { symbol: 'BTCUSD', regularMarketPrice: price, shortName: 'Bitcoin (USD)', currency: 'USD' };
            // Eğer BTCTRY henüz eklenmediyse hesaplanmış TL fiyatını yedek koy
            if (!newPrices['BTC']) {
              const calcTry = price * usdtTryPrice;
              newPrices['BTC'] = { symbol: 'BTC', regularMarketPrice: calcTry, shortName: 'Bitcoin (BTC)', currency: 'TRY' };
            }
          }

          if (item.symbol === 'ETHTRY') {
            // ETH sembolüne canlı TÜRK LİRASI (TRY) fiyatını atıyoruz
            newPrices['ETH'] = { symbol: 'ETH', regularMarketPrice: price, shortName: 'Ethereum (ETH)', currency: 'TRY' };
            newPrices['ETH-TRY'] = { symbol: 'ETH-TRY', regularMarketPrice: price, shortName: 'Ethereum (TRY)', currency: 'TRY' };
            newPrices['ETHEREUM'] = { symbol: 'ETHEREUM', regularMarketPrice: price, shortName: 'Ethereum', currency: 'TRY' };
          }
          if (item.symbol === 'ETHUSDT') {
            newPrices['ETH-USD'] = { symbol: 'ETH-USD', regularMarketPrice: price, shortName: 'Ethereum (USD)', currency: 'USD' };
            newPrices['ETHUSD'] = { symbol: 'ETHUSD', regularMarketPrice: price, shortName: 'Ethereum (USD)', currency: 'USD' };
            if (!newPrices['ETH']) {
              const calcTry = price * usdtTryPrice;
              newPrices['ETH'] = { symbol: 'ETH', regularMarketPrice: calcTry, shortName: 'Ethereum (ETH)', currency: 'TRY' };
            }
          }
        });
      }
    }
  } catch (e) {
    console.error('Binance Live Price Error:', e);
  }

  // 2. Truncgil Public Finans API (Gram Altın & Gram Gümüş & Dolar)
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
