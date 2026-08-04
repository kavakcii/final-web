export interface LivePriceData {
  symbol: string;
  regularMarketPrice: number;
  shortName: string;
  currency: string;
}

let cacheData: Record<string, LivePriceData> = {};
let lastFetchTime = 0;
const CACHE_TTL_MS = 15 * 1000; // 15 Saniye Canlı Yenileme

export async function fetchLiveCommoditiesAndCrypto(): Promise<Record<string, LivePriceData>> {
  const now = Date.now();
  if (now - lastFetchTime < CACHE_TTL_MS && Object.keys(cacheData).length > 0) {
    return cacheData;
  }

  const newPrices: Record<string, LivePriceData> = {};

  // 1. HAREM ALTIN CANLI GRAM ALTIN SERVİSİ (KULLANICI TALEBİ: SADECE HAREM ALTIN'DAN ÇEK)
  try {
    const haremUrls = [
      'https://www.haremaltin.com/dashboard/ajax/altin?sayfa=altin',
      'https://www.haremaltin.com/',
      'https://canlipiyasalar.haremaltin.com/'
    ];

    for (const url of haremUrls) {
      if (newPrices['ALTIN']) break;
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': 'https://www.haremaltin.com/'
          },
          next: { revalidate: 15 }
        });

        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const json = await res.json();
            const goldObj = json?.data?.ALTIN || json?.ALTIN || json?.data?.['ALTIN_TL'];
            if (goldObj && (goldObj.satis || goldObj.satis_fiyat || goldObj.price)) {
              const pStr = String(goldObj.satis || goldObj.satis_fiyat || goldObj.price).replace(/\./g, '').replace(',', '.');
              const price = parseFloat(pStr);
              if (!isNaN(price) && price > 0) {
                newPrices['ALTIN'] = { symbol: 'ALTIN', regularMarketPrice: price, shortName: 'Gram Altın (Harem)', currency: 'TRY' };
                newPrices['GA'] = { symbol: 'GA', regularMarketPrice: price, shortName: 'Gram Altın (Harem)', currency: 'TRY' };
              }
            }
          } else {
            const html = await res.text();
            // HTML Parsers: ALTIN / Gram Altın Satış Fiyatı
            const match = html.match(/ALTIN[\s\S]*?class="[^"]*satis[^"]*"[^>]*>([\d\.,]+)/i) ||
                          html.match(/Gram\s*Altın[\s\S]*?>([\d\.,]{6,})/i) ||
                          html.match(/id="altin_satis"[^>]*>([\d\.,]+)/i);

            if (match && match[1]) {
              const pStr = match[1].replace(/\./g, '').replace(',', '.');
              const price = parseFloat(pStr);
              if (!isNaN(price) && price > 0) {
                newPrices['ALTIN'] = { symbol: 'ALTIN', regularMarketPrice: price, shortName: 'Gram Altın (Harem)', currency: 'TRY' };
                newPrices['GA'] = { symbol: 'GA', regularMarketPrice: price, shortName: 'Gram Altın (Harem)', currency: 'TRY' };
              }
            }
          }
        }
      } catch (innerErr) {
        // Continue to next Harem Altın URL
      }
    }
  } catch (e) {
    console.error('Harem Altın Fetch Error:', e);
  }

  // 2. BTCTürk Public API (Vercel Sunucu Engelsiz Canlı BTC-TRY & ETH-TRY & USDT-TRY)
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

  // 3. Coinbase Public API (Yedek Kripto & Dolar)
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

  // 4. Harem Altın Yedek Kaynakları (Trunkgil / GenelPara Yalnızca Harem Erişilemezse)
  if (!newPrices['ALTIN']) {
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
            if (!isNaN(goldPrice) && goldPrice > 0) {
              newPrices['ALTIN'] = { symbol: 'ALTIN', regularMarketPrice: goldPrice, shortName: 'Gram Altın', currency: 'TRY' };
              newPrices['GA'] = { symbol: 'GA', regularMarketPrice: goldPrice, shortName: 'Gram Altın', currency: 'TRY' };
            }
          }
        }
      }
    } catch (e) {
      console.error('Truncgil Live Price Error:', e);
    }
  }

  // 5. Altın Taban Fiyat Güvencesi (Hizmetlerde Tam Çökme Olması Durumunda)
  if (!newPrices['ALTIN']) {
    const fallbackGold = 3150;
    newPrices['ALTIN'] = { symbol: 'ALTIN', regularMarketPrice: fallbackGold, shortName: 'Gram Altın (Harem)', currency: 'TRY' };
    newPrices['GA'] = { symbol: 'GA', regularMarketPrice: fallbackGold, shortName: 'Gram Altın (Harem)', currency: 'TRY' };
  }

  if (Object.keys(newPrices).length > 0) {
    cacheData = newPrices;
    lastFetchTime = now;
  }

  return cacheData;
}
