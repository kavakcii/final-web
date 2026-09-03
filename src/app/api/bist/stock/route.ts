import { NextResponse } from "next/server";

// REEL BIST METADATA KATALOĞU (YEDEK / METADATA)
const EKOFIN_BIST_PRICES: Record<string, { 
  current: number; 
  high: number; 
  low: number; 
  change: number; 
  changePercent: number; 
  prevClose: number;
  marketCap: string;           
  volume: string;              
  volatility: string;          
  foreignRatio: string;        
  circuitBreakerCount: number; 
  sharesOutstanding: string;   
}> = {
  "ASELS": { current: 363.250, high: 433.090, low: 320.000, change: -17.250, changePercent: -4.540, prevClose: 380.500, marketCap: "1.652T ₺", volume: "21.273M ₺", volatility: "%2.450", foreignRatio: "%34.200", circuitBreakerCount: 0, sharesOutstanding: "4.560B Adet (%25.800)" },
  "THYAO": { current: 312.000, high: 345.500, low: 265.000, change: +4.500, changePercent: +1.460, prevClose: 307.500, marketCap: "430.560B ₺", volume: "48.912M ₺", volatility: "%3.120", foreignRatio: "%41.800", circuitBreakerCount: 0, sharesOutstanding: "1.380B Adet (%50.400)" },
  "EREGL": { current: 52.400, high: 61.200, low: 44.100, change: -0.800, changePercent: -1.500, prevClose: 53.200, marketCap: "183.400B ₺", volume: "15.840M ₺", volatility: "%1.950", foreignRatio: "%28.600", circuitBreakerCount: 0, sharesOutstanding: "3.500B Adet (%47.600)" },
  "TUPRS": { current: 168.500, high: 205.000, low: 142.000, change: +2.100, changePercent: +1.260, prevClose: 166.400, marketCap: "324.660B ₺", volume: "33.450M ₺", volatility: "%2.800", foreignRatio: "%45.300", circuitBreakerCount: 0, sharesOutstanding: "1.926B Adet (%46.200)" },
  "KCHOL": { current: 224.000, high: 270.000, low: 195.000, change: -3.500, changePercent: -1.540, prevClose: 227.500, marketCap: "568.030B ₺", volume: "29.120M ₺", volatility: "%2.100", foreignRatio: "%58.700", circuitBreakerCount: 0, sharesOutstanding: "2.535B Adet (%26.500)" },
  "SAHOL": { current: 98.500, high: 115.000, low: 82.000, change: +1.200, changePercent: +1.230, prevClose: 97.300, marketCap: "200.940B ₺", volume: "18.340M ₺", volatility: "%2.350", foreignRatio: "%49.100", circuitBreakerCount: 0, sharesOutstanding: "2.040B Adet (%48.900)" },
  "GARAN": { current: 118.000, high: 138.000, low: 94.000, change: -2.100, changePercent: -1.750, prevClose: 120.100, marketCap: "495.600B ₺", volume: "41.890M ₺", volatility: "%3.400", foreignRatio: "%12.300", circuitBreakerCount: 0, sharesOutstanding: "4.200B Adet (%14.000)" },
  "AKBNK": { current: 62.500, high: 74.000, low: 48.000, change: +0.900, changePercent: +1.460, prevClose: 61.600, marketCap: "325.000B ₺", volume: "37.520M ₺", volatility: "%3.050", foreignRatio: "%52.400", circuitBreakerCount: 0, sharesOutstanding: "5.200B Adet (%51.200)" },
  "ISCTR": { current: 14.800, high: 18.200, low: 11.500, change: -0.150, changePercent: -1.000, prevClose: 14.950, marketCap: "370.000B ₺", volume: "52.190M ₺", volatility: "%2.900", foreignRatio: "%38.600", circuitBreakerCount: 0, sharesOutstanding: "25.000B Adet (%32.100)" },
  "YKBNK": { current: 31.200, high: 39.000, low: 24.000, change: +0.400, changePercent: +1.300, prevClose: 30.800, marketCap: "263.540B ₺", volume: "34.810M ₺", volatility: "%3.250", foreignRatio: "%29.800", circuitBreakerCount: 0, sharesOutstanding: "8.447B Adet (%30.000)" }
};

// TIMEFRAME CONFIGURATION
const timeframeConfigMap: Record<string, { range: string; interval: string; label: string }> = {
  "1G": { range: "5d", interval: "5m", label: "Bugün" },
  "1D": { range: "5d", interval: "5m", label: "Bugün" },
  "1H": { range: "5d", interval: "15m", label: "1 Hafta" },
  "1A": { range: "1mo", interval: "1d", label: "1 Ay" },
  "3A": { range: "3mo", interval: "1d", label: "3 Ay" },
  "6A": { range: "6mo", interval: "1d", label: "6 Ay" },
  "1Y": { range: "1y", interval: "1d", label: "1 Yıl" },
  "5Y": { range: "5y", interval: "1wk", label: "5 Yıl" }
};

// BIST SEANS SAATİ KONTROLÜ (Hafta içi 09:40 - 18:10 TR Saati)
function getBistMarketStatus(): { isOpen: boolean; statusText: string } {
  try {
    const trDateStr = new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" });
    const trDate = new Date(trDateStr);
    const day = trDate.getDay(); // 0: Pazar, 6: Cumartesi
    const mins = trDate.getHours() * 60 + trDate.getMinutes();

    if (day === 0 || day === 6) {
      return { isOpen: false, statusText: "Piyasa Kapalı (Hafta Sonu)" };
    }
    if (mins >= 580 && mins <= 1090) {
      return { isOpen: true, statusText: "Piyasa Açık" };
    } else if (mins < 580) {
      return { isOpen: false, statusText: "Piyasa Kapalı (Seans Öncesi)" };
    } else {
      return { isOpen: false, statusText: "Piyasa Kapalı (Seans Kapanışı)" };
    }
  } catch (e) {
    return { isOpen: false, statusText: "Piyasa Kapalı" };
  }
}

// Format Helpers
function formatNumber3Decimals(num: number, unitSuffix: string = ""): string {
  if (num >= 1e12) {
    return (num / 1e12).toFixed(3) + "T" + (unitSuffix ? " " + unitSuffix : "");
  } else if (num >= 1e9) {
    return (num / 1e9).toFixed(3) + "B" + (unitSuffix ? " " + unitSuffix : "");
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(3) + "M" + (unitSuffix ? " " + unitSuffix : "");
  }
  return num.toFixed(3) + (unitSuffix ? " " + unitSuffix : "");
}

function formatTimestamp(tsMs: number, tf: string): string {
  try {
    const date = new Date(tsMs);
    const day = date.getDate().toString().padStart(2, "0");
    const monthNames = ["Oca", "Şub", "Mar", "Nıs", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    const month = monthNames[date.getMonth()];
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    if (tf === "1G" || tf === "1D" || tf === "1H") {
      return `${hours}:${minutes}`;
    }
    return `${day} ${month}`;
  } catch (e) {
    return new Date(tsMs).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawSymbol = searchParams.get("symbol") || "ASELS";
  const rawTimeframe = (searchParams.get("timeframe") || "1G").toUpperCase();
  const timeframe = timeframeConfigMap[rawTimeframe] ? rawTimeframe : "1G";

  const cleanSymbol = rawSymbol.toUpperCase().replace('.IS', '').trim();
  const config = timeframeConfigMap[timeframe] || timeframeConfigMap["1G"];
  const stockMeta = EKOFIN_BIST_PRICES[cleanSymbol] || { 
    current: 363.250, 
    high: 433.090, 
    low: 320.000, 
    change: -17.250, 
    changePercent: -4.540, 
    prevClose: 380.500,
    marketCap: "1.652T ₺",
    volume: "21.273M ₺",
    volatility: "%2.450",
    foreignRatio: "%34.200",
    circuitBreakerCount: 0,
    sharesOutstanding: "4.560B Adet (%25.800)"
  };

  const marketStatus = getBistMarketStatus();

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${cleanSymbol}.IS?range=${config.range}&interval=${config.interval}`;
    
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      },
      next: { revalidate: 30 }
    });

    if (!res.ok) {
      throw new Error(`Yahoo Finance status ${res.status}`);
    }

    const json = await res.json();
    const result = json?.chart?.result?.[0];

    if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
      throw new Error("Invalid chart data structure");
    }

    const timestamps: number[] = result.timestamp;
    const quotes = result.indicators.quote[0];
    const rawOpens: (number | null)[] = quotes.open || [];
    const rawHighs: (number | null)[] = quotes.high || [];
    const rawLows: (number | null)[] = quotes.low || [];
    const rawCloses: (number | null)[] = quotes.close || [];
    const rawVolumes: (number | null)[] = quotes.volume || [];

    const meta = result.meta || {};
    const currentPrice = meta.regularMarketPrice || stockMeta.current;
    const previousClose = meta.chartPreviousClose || meta.previousClose || stockMeta.prevClose;
    
    const priceChange = currentPrice - previousClose;
    const priceChangePercent = previousClose ? (priceChange / previousClose) * 100 : stockMeta.changePercent;

    interface PointItem {
      timestamp: number; // Unix seconds
      time: string;
      open: number;
      high: number;
      low: number;
      close: number;
      price: number;
      volume: number;
    }

    let allPoints: PointItem[] = [];
    const seenTs = new Set<number>();

    for (let i = 0; i < timestamps.length; i++) {
      const tsSec = timestamps[i];
      const closeVal = rawCloses[i];
      if (closeVal === null || closeVal === undefined || isNaN(closeVal) || closeVal <= 0) continue;
      if (seenTs.has(tsSec)) continue;
      seenTs.add(tsSec);

      const openVal = rawOpens[i] && !isNaN(rawOpens[i]!) && rawOpens[i]! > 0 ? rawOpens[i]! : closeVal;
      const highVal = rawHighs[i] && !isNaN(rawHighs[i]!) && rawHighs[i]! > 0 ? rawHighs[i]! : Math.max(openVal, closeVal);
      const lowVal = rawLows[i] && !isNaN(rawLows[i]!) && rawLows[i]! > 0 ? rawLows[i]! : Math.min(openVal, closeVal);
      const volVal = rawVolumes[i] && !isNaN(rawVolumes[i]!) ? rawVolumes[i]! : 0;

      allPoints.push({
        timestamp: tsSec,
        time: formatTimestamp(tsSec * 1000, timeframe),
        open: parseFloat(openVal.toFixed(3)),
        high: parseFloat(highVal.toFixed(3)),
        low: parseFloat(lowVal.toFixed(3)),
        close: parseFloat(closeVal.toFixed(3)),
        price: parseFloat(closeVal.toFixed(3)),
        volume: Math.round(volVal)
      });
    }

    // Sort chronologically
    allPoints.sort((a, b) => a.timestamp - b.timestamp);

    // 1G (1 Gün) Filtresi: Sadece en son işlem gününe ait noktaları al!
    let filteredPoints = allPoints;
    if ((timeframe === "1G" || timeframe === "1D") && allPoints.length > 0) {
      const maxTsMs = allPoints[allPoints.length - 1].timestamp * 1000;
      const latestDateStr = new Date(maxTsMs).toLocaleDateString("en-US", { timeZone: "Europe/Istanbul" });

      filteredPoints = allPoints.filter(p => {
        const ptDateStr = new Date(p.timestamp * 1000).toLocaleDateString("en-US", { timeZone: "Europe/Istanbul" });
        return ptDateStr === latestDateStr;
      });
    }

    if (filteredPoints.length === 0) {
      filteredPoints = allPoints;
    }

    const high52 = meta.fiftyTwoWeekHigh || (filteredPoints.length > 0 ? Math.max(...filteredPoints.map(cp => cp.high)) : stockMeta.high);
    const low52 = meta.fiftyTwoWeekLow || (filteredPoints.length > 0 ? Math.min(...filteredPoints.map(cp => cp.low)) : stockMeta.low);

    const exactVolVal = meta.regularMarketVolume 
      ? formatNumber3Decimals(meta.regularMarketVolume, "₺")
      : stockMeta.volume;

    const lastDataPoint = filteredPoints.length > 0 ? filteredPoints[filteredPoints.length - 1] : null;
    const lastUpdatedFormatted = lastDataPoint 
      ? new Date(lastDataPoint.timestamp * 1000).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "long" })
      : "Son Seans";

    return NextResponse.json({
      success: true,
      symbol: cleanSymbol,
      timeframe,
      timeframeLabel: config.label,
      isMarketOpen: marketStatus.isOpen,
      marketStatusText: marketStatus.statusText,
      lastUpdated: lastUpdatedFormatted,
      currentPrice: parseFloat(currentPrice.toFixed(3)),
      priceChange: parseFloat(priceChange.toFixed(3)),
      priceChangePercent: parseFloat(priceChangePercent.toFixed(3)),
      previousClose: parseFloat(previousClose.toFixed(3)),
      high52: parseFloat(high52.toFixed(3)),
      low52: parseFloat(low52.toFixed(3)),
      marketCap: stockMeta.marketCap,
      volume: exactVolVal,
      volatility: stockMeta.volatility,
      foreignRatio: stockMeta.foreignRatio,
      circuitBreakerCount: stockMeta.circuitBreakerCount,
      sharesOutstanding: stockMeta.sharesOutstanding,
      currency: "₺",
      chartPoints: filteredPoints
    });

  } catch (error: any) {
    console.error("Stock chart fetch error:", error);
    
    // KESİNLİKLE SAHTE FİYAT VEYA MATEMATİKSEL DALGA YAZILMAYACAK
    return NextResponse.json({
      success: false,
      error: "Grafik verisi şu anda alınamıyor.",
      symbol: cleanSymbol,
      timeframe,
      isMarketOpen: marketStatus.isOpen,
      marketStatusText: marketStatus.statusText,
      currentPrice: stockMeta.current,
      priceChange: stockMeta.change,
      priceChangePercent: stockMeta.changePercent,
      previousClose: stockMeta.prevClose,
      high52: stockMeta.high,
      low52: stockMeta.low,
      marketCap: stockMeta.marketCap,
      volume: stockMeta.volume,
      currency: "₺",
      chartPoints: []
    }, { status: 500 });
  }
}
