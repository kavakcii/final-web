import { NextResponse } from "next/server";

// REEL BIST KATALOĞU VE GERÇEK BİST REFERANS FİYATLARI
const BIST_REAL_PRICES: Record<string, { current: number; high: number; low: number; change: number; changePercent: number; prevClose: number }> = {
  "ASELS": { current: 363.25, high: 433.09, low: 320.00, change: -17.25, changePercent: -4.54, prevClose: 380.50 },
  "THYAO": { current: 312.00, high: 345.50, low: 265.00, change: +4.50, changePercent: +1.46, prevClose: 307.50 },
  "EREGL": { current: 52.40, high: 61.20, low: 44.10, change: -0.80, changePercent: -1.50, prevClose: 53.20 },
  "TUPRS": { current: 168.50, high: 205.00, low: 142.00, change: +2.10, changePercent: +1.26, prevClose: 166.40 },
  "KCHOL": { current: 224.00, high: 270.00, low: 195.00, change: -3.50, changePercent: -1.54, prevClose: 227.50 },
  "SAHOL": { current: 98.50, high: 115.00, low: 82.00, change: +1.20, changePercent: +1.23, prevClose: 97.30 },
  "GARAN": { current: 118.00, high: 138.00, low: 94.00, change: -2.10, changePercent: -1.75, prevClose: 120.10 },
  "AKBNK": { current: 62.50, high: 74.00, low: 48.00, change: +0.90, changePercent: +1.46, prevClose: 61.60 },
  "ISCTR": { current: 14.80, high: 18.20, low: 11.50, change: -0.15, changePercent: -1.00, prevClose: 14.95 },
  "YKBNK": { current: 31.20, high: 39.00, low: 24.00, change: +0.40, changePercent: +1.30, prevClose: 30.80 }
};

// ROLLING BIST ZAMAN PENCERESİ VE SEANS ÇÖZÜNÜRLÜĞÜ
const timeframeConfigMap: Record<string, { range: string; interval: string; durationDays: number; label: string }> = {
  "1H": { range: "1d", interval: "1m", durationDays: 1, label: "1 Saat" },   // Son 60 Dakika
  "1D": { range: "5d", interval: "5m", durationDays: 1, label: "1 Gün" },    // Tam 24 Seans Saati
  "1W": { range: "1mo", interval: "1d", durationDays: 7, label: "1 Hafta" },  // Tam Geçmiş 7 Gün
  "1M": { range: "3mo", interval: "1d", durationDays: 30, label: "1 Ay" }    // Tam Geçmiş 30 Gün
};

// BIST Resmi Seans Saati Kontrolü (Pazartesi-Cuma 09:55 - 18:10 TR Saati)
function isWithinBistTradingHours(tsMs: number): boolean {
  try {
    const trDateStr = new Date(tsMs).toLocaleString("en-US", { timeZone: "Europe/Istanbul" });
    const date = new Date(trDateStr);
    const day = date.getDay(); // 0: Pazar, 6: Cumartesi
    if (day === 0 || day === 6) return false;
    const mins = date.getHours() * 60 + date.getMinutes();
    return mins >= 595 && mins <= 1090; // 09:55 - 18:10
  } catch (e) {
    return true;
  }
}

// BIST Canlı/Son Seans Kapanış Zamanı Hesaplama
// Piyasa Açıkken: Anlık Tam Dakika (Örn: 15:16)
// Piyasa Kapalıyken: En Son BIST Seans Kapanışı (Tam 18:10)
function getTargetEndTimeMs(): number {
  const now = new Date();
  const trDateStr = now.toLocaleString("en-US", { timeZone: "Europe/Istanbul" });
  const trDate = new Date(trDateStr);
  
  const day = trDate.getDay();
  const mins = trDate.getHours() * 60 + trDate.getMinutes();

  // Hafta içi ve seans saatleri içerisindeyse anlık dakikayı dön (Örn: 15:16)
  if (day >= 1 && day <= 5 && mins >= 595 && mins <= 1090) {
    return now.getTime();
  }

  // Piyasa kapalıysa en son gerçekleşen seans gününün 18:10 kapanış saatine git
  const lastSessionDate = new Date(trDate);
  if (day === 0) { // Pazar -> Cuma 18:10
    lastSessionDate.setDate(lastSessionDate.getDate() - 2);
  } else if (day === 6) { // Cumartesi -> Cuma 18:10
    lastSessionDate.setDate(lastSessionDate.getDate() - 1);
  } else if (mins < 595) { // Seans henüz açılmadıysa dün 18:10
    lastSessionDate.setDate(lastSessionDate.getDate() - 1);
    if (lastSessionDate.getDay() === 0) lastSessionDate.setDate(lastSessionDate.getDate() - 2);
  }

  lastSessionDate.setHours(18, 10, 0, 0);
  return lastSessionDate.getTime();
}

// Yardımcı Tarih Biçimlendirici (Türkiye Saati İle Tam Seans Saat:Dakikası)
function formatTimestamp(tsMs: number, timeframe: string): string {
  try {
    const date = new Date(tsMs);
    const day = date.getDate().toString().padStart(2, "0");
    const monthNames = ["Oca", "Şub", "Mar", "Nıs", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    const month = monthNames[date.getMonth()];
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    if (timeframe === "1H") {
      return `${hours}:${minutes}`;
    } else if (timeframe === "1D") {
      return `${day} ${month} ${hours}:${minutes}`;
    } else {
      return `${day} ${month}`;
    }
  } catch (e) {
    return new Date(tsMs).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawSymbol = searchParams.get("symbol") || "ASELS";
  const timeframe = (searchParams.get("timeframe") || "1D").toUpperCase();

  const cleanSymbol = rawSymbol.toUpperCase().replace('.IS', '').trim();
  const config = timeframeConfigMap[timeframe] || timeframeConfigMap["1D"];
  const stockMeta = BIST_REAL_PRICES[cleanSymbol] || { current: 150.00, high: 433.09, low: 320.00, change: -17.25, changePercent: -4.54, prevClose: 380.50 };

  const targetEndMs = getTargetEndTimeMs();
  const targetStartMs = targetEndMs - (config.durationDays * 86400000);

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${cleanSymbol}.IS?range=${config.range}&interval=${config.interval}`;
    
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      },
      next: { revalidate: 60 }
    });

    if (!res.ok) {
      throw new Error(`BIST API returned status ${res.status}`);
    }

    const json = await res.json();
    const result = json?.chart?.result?.[0];

    if (!result || !result.timestamp || !result.indicators?.quote?.[0]?.close) {
      throw new Error("Invalid BIST data structure");
    }

    const timestamps: number[] = result.timestamp;
    const rawPrices: (number | null)[] = result.indicators.quote[0].close;

    const meta = result.meta || {};
    const currentPrice = meta.regularMarketPrice || stockMeta.current;
    const previousClose = meta.chartPreviousClose || meta.previousClose || stockMeta.prevClose;
    
    const priceChange = currentPrice - previousClose;
    const priceChangePercent = previousClose ? (priceChange / previousClose) * 100 : stockMeta.changePercent;

    // GERÇEK BİST VERİ NOKTALARINI FİLTRELE (TARGET START VE END AÇISINDAN)
    let chartPoints: { time: string; price: number; timestamp: number }[] = [];
    
    timestamps.forEach((ts, idx) => {
      const ptTimeMs = ts * 1000;
      const p = rawPrices[idx];

      if (p !== null && p !== undefined && !isNaN(p)) {
        // Günlük/Aylık sekmelerinde doğrudan seans günü, 1H/1D sekmelerinde seans saati kontrolü
        if (config.interval === "1d" || isWithinBistTradingHours(ptTimeMs)) {
          // Nokta zaman aralığı içerisinde ise ekle
          if (ptTimeMs >= targetStartMs && ptTimeMs <= targetEndMs + 3600000) {
            chartPoints.push({
              time: formatTimestamp(ptTimeMs, timeframe),
              price: parseFloat(p.toFixed(2)),
              timestamp: ptTimeMs
            });
          }
        }
      }
    });

    if (chartPoints.length === 0) {
      // Eğer aralık boş kaldıysa son noktaları al
      chartPoints = timestamps.map((ts, idx) => {
        const p = rawPrices[idx];
        return {
          time: formatTimestamp(ts * 1000, timeframe),
          price: p !== null && p !== undefined ? parseFloat(p.toFixed(2)) : currentPrice,
          timestamp: ts * 1000
        };
      }).filter(cp => !isNaN(cp.price)).slice(-30);
    }

    const high52 = meta.fiftyTwoWeekHigh || Math.max(...chartPoints.map(cp => cp.price), stockMeta.high);
    const low52 = meta.fiftyTwoWeekLow || Math.min(...chartPoints.map(cp => cp.price), stockMeta.low);
    const volume = meta.regularMarketVolume ? `${(meta.regularMarketVolume / 1e6).toFixed(1)}M` : "42.9M";

    return NextResponse.json({
      success: true,
      symbol: cleanSymbol,
      timeframe,
      currentPrice: parseFloat(currentPrice.toFixed(2)),
      priceChange: parseFloat(priceChange.toFixed(2)),
      priceChangePercent: parseFloat(priceChangePercent.toFixed(2)),
      previousClose: parseFloat(previousClose.toFixed(2)),
      high52: parseFloat(high52.toFixed(2)),
      low52: parseFloat(low52.toFixed(2)),
      volume,
      currency: "₺",
      chartPoints
    });

  } catch (error: any) {
    // SAHTE DALGACIK OLUŞTURULMAZ
    return NextResponse.json({
      success: false,
      error: "BIST verileri yüklenemedi.",
      symbol: cleanSymbol,
      timeframe,
      currentPrice: stockMeta.current,
      priceChange: stockMeta.change,
      priceChangePercent: stockMeta.changePercent,
      previousClose: stockMeta.prevClose,
      high52: stockMeta.high,
      low52: stockMeta.low,
      volume: "42.9M",
      currency: "₺",
      chartPoints: []
    });
  }
}
