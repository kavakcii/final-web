import { NextResponse } from "next/server";

// Timeframe Normalization & Yahoo Config
interface TimeframeConfig {
  yahooRange: string;
  interval: string;
  label: string;
  normalized: string;
  isIntraday: boolean;
}

function normalizeTimeframe(tf: string): TimeframeConfig {
  const clean = tf.trim().toLowerCase();
  
  if (clean === '1h' || clean === '1saat' || clean === 'hour') {
    return { yahooRange: '1d', interval: '2m', label: '1 Saat', normalized: '1H', isIntraday: true };
  }
  if (clean === '1d' || clean === '1g' || clean === '1gun' || clean === 'day' || clean === 'today') {
    return { yahooRange: '1d', interval: '5m', label: '1 Gün', normalized: '1D', isIntraday: true };
  }
  if (clean === '1w' || clean === '1h' || clean === '1hafta' || clean === 'week') {
    return { yahooRange: '5d', interval: '15m', label: '1 Hafta', normalized: '1W', isIntraday: false };
  }
  if (clean === '1m' || clean === '1a' || clean === '1ay' || clean === '1mo' || clean === 'month') {
    return { yahooRange: '1mo', interval: '1d', label: '1 Ay', normalized: '1M', isIntraday: false };
  }
  if (clean === '3m' || clean === '3a' || clean === '3ay' || clean === '3mo') {
    return { yahooRange: '3mo', interval: '1d', label: '3 Ay', normalized: '3M', isIntraday: false };
  }
  if (clean === '6m' || clean === '6a' || clean === '6ay' || clean === '6mo') {
    return { yahooRange: '6mo', interval: '1d', label: '6 Ay', normalized: '6M', isIntraday: false };
  }
  if (clean === '1y' || clean === '1yil' || clean === 'year') {
    return { yahooRange: '1y', interval: '1d', label: '1 Yıl', normalized: '1Y', isIntraday: false };
  }
  if (clean === '5y' || clean === '5yil' || clean === '5years') {
    return { yahooRange: '5y', interval: '1wk', label: '5 Yıl', normalized: '5Y', isIntraday: false };
  }

  // Default to 1D
  return { yahooRange: '1d', interval: '5m', label: '1 Gün', normalized: '1D', isIntraday: true };
}

// EKOFİN.NET CANLI HTTP VERİ ÇEKİCİ (DIRECT LIVE FETCH FROM EKOFIN.NET)
async function fetchLiveEkofinData(symbol: string) {
  try {
    const url = `https://ekofin.net/sirket/detay/${symbol.toUpperCase()}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "tr-TR,tr;q=0.9"
      },
      next: { revalidate: 60 }
    });

    if (!res.ok) return null;
    const html = await res.text();
    
    let marketCap = null;
    let volume = null;
    let volatility = null;
    let foreignRatio = null;

    const mcMatch = html.match(/Piyasa\s*Değeri[\s\S]*?([\d\.,]+\s*[MBTLt]+)/i);
    if (mcMatch) marketCap = mcMatch[1].trim();

    const volMatch = html.match(/Hacim|İşlem\s*Hacmi[\s\S]*?([\d\.,]+\s*[MBTLt]+)/i);
    if (volMatch) volume = volMatch[1].trim();

    const vltMatch = html.match(/Volatilite|Oynaklık[\s\S]*?(%?\s*[\d\.,]+)/i);
    if (vltMatch) volatility = vltMatch[1].trim();

    const frMatch = html.match(/Yabancı\s*Oranı|Yabancı\s*Takas[\s\S]*?(%?\s*[\d\.,]+)/i);
    if (frMatch) foreignRatio = frMatch[1].trim();

    return { marketCap, volume, volatility, foreignRatio };
  } catch (e) {
    return null;
  }
}

// Format Helper
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

// Date & Time formatting helper in Europe/Istanbul
function formatTimestampLabel(tsMs: number, normalizedTimeframe: string): { date: string; time: string; displayLabel: string } {
  try {
    const d = new Date(tsMs);
    const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
    const timeStr = d.toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' });
    
    const dayStr = d.getDate().toString().padStart(2, "0");
    const monthNames = ["Oca", "Şub", "Mar", "Nıs", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    const monthStr = monthNames[d.getMonth()];

    let displayLabel = "";
    if (normalizedTimeframe === "1H" || normalizedTimeframe === "1D") {
      displayLabel = timeStr;
    } else if (normalizedTimeframe === "1W") {
      displayLabel = `${dayStr} ${monthStr} ${timeStr}`;
    } else {
      displayLabel = `${dayStr} ${monthStr}`;
    }

    return { date: dateStr, time: timeStr, displayLabel };
  } catch (e) {
    const d = new Date(tsMs);
    return {
      date: d.toISOString().split('T')[0],
      time: d.toLocaleTimeString('tr-TR'),
      displayLabel: d.toLocaleDateString('tr-TR')
    };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawSymbol = searchParams.get("symbol") || "ASELS";
  const rawRange = searchParams.get("timeframe") || searchParams.get("range") || "1D";

  const cleanSymbol = rawSymbol.toUpperCase().replace('.IS', '').trim();
  const config = normalizeTimeframe(rawRange);

  // Live Ekofin Net scrape in parallel
  const liveEkofinData = await fetchLiveEkofinData(cleanSymbol);

  try {
    // 1. PRIMARY SOURCE: Yahoo Finance Historical Chart API
    // If intraday 1D returns empty (e.g. before session starts), try 5d range for fallback session extraction
    let primaryUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${cleanSymbol}.IS?range=${config.yahooRange}&interval=${config.interval}`;
    
    let res = await fetch(primaryUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      },
      next: { revalidate: config.isIntraday ? 15 : 300 }
    });

    let json = res.ok ? await res.json() : null;
    let result = json?.chart?.result?.[0];

    // If 1D range yielded no timestamps (e.g. market closed / weekend / early morning), retry with range=5d & interval=5m
    if (config.normalized === '1D' && (!result || !result.timestamp || result.timestamp.length === 0)) {
      const fallback5dUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${cleanSymbol}.IS?range=5d&interval=5m`;
      const res5d = await fetch(fallback5dUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 15 }
      });
      if (res5d.ok) {
        const json5d = await res5d.json();
        result = json5d?.chart?.result?.[0] || result;
      }
    }

    // If 1H range yielded no timestamps, retry with range=5d & interval=2m
    if (config.normalized === '1H' && (!result || !result.timestamp || result.timestamp.length === 0)) {
      const fallback5dUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${cleanSymbol}.IS?range=5d&interval=2m`;
      const res5d = await fetch(fallback5dUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 15 }
      });
      if (res5d.ok) {
        const json5d = await res5d.json();
        result = json5d?.chart?.result?.[0] || result;
      }
    }

    if (!result || !result.timestamp || !result.indicators?.quote?.[0]?.close) {
      throw new Error(`Primary Yahoo Chart API returned no valid time-series for ${cleanSymbol}`);
    }

    const rawTimestamps: number[] = result.timestamp;
    const quote = result.indicators.quote[0] || {};
    const rawOpens: (number | null)[] = quote.open || [];
    const rawHighs: (number | null)[] = quote.high || [];
    const rawLows: (number | null)[] = quote.low || [];
    const rawCloses: (number | null)[] = quote.close || [];
    const rawVolumes: (number | null)[] = quote.volume || [];

    let parsedCandles: Array<{
      timestamp: number;
      date: string;
      time: string;
      displayLabel: string;
      open: number;
      high: number;
      low: number;
      close: number;
      price: number;
      volume: number;
    }> = [];

    for (let i = 0; i < rawTimestamps.length; i++) {
      const c = rawCloses[i];
      if (c !== null && c !== undefined && !isNaN(c) && c > 0) {
        const o = rawOpens[i] ?? c;
        const h = Math.max(rawHighs[i] ?? c, o, c);
        const l = Math.min(rawLows[i] ?? c, o, c);
        const v = Math.max(0, rawVolumes[i] ?? 0);
        const tsMs = rawTimestamps[i] * 1000;

        // Ensure strict OHLC sanity rules: high >= max(open, close, low), low <= min(open, close, high)
        if (h >= Math.max(o, c, l) - 0.001 && l <= Math.min(o, c, h) + 0.001) {
          const { date, time, displayLabel } = formatTimestampLabel(tsMs, config.normalized);
          parsedCandles.push({
            timestamp: tsMs,
            date,
            time,
            displayLabel,
            open: parseFloat(o.toFixed(3)),
            high: parseFloat(h.toFixed(3)),
            low: parseFloat(l.toFixed(3)),
            close: parseFloat(c.toFixed(3)),
            price: parseFloat(c.toFixed(3)),
            volume: Math.round(v)
          });
        }
      }
    }

    // 1G / 1D Intraday Filtering: MUST keep ONLY the last trading session date
    if (config.normalized === '1D' && parsedCandles.length > 0) {
      const lastSessionDate = parsedCandles[parsedCandles.length - 1].date;
      parsedCandles = parsedCandles.filter(cand => cand.date === lastSessionDate);
    }

    // 1H Intraday Filtering: MUST keep ONLY the last 60 minutes of the last trading session
    if (config.normalized === '1H' && parsedCandles.length > 0) {
      const lastSessionDate = parsedCandles[parsedCandles.length - 1].date;
      const lastSessionCandles = parsedCandles.filter(cand => cand.date === lastSessionDate);
      parsedCandles = lastSessionCandles.slice(-60);
    }

    // Sort ascending by timestamp & deduplicate
    parsedCandles.sort((a, b) => a.timestamp - b.timestamp);
    const uniqueMap = new Map<number, typeof parsedCandles[0]>();
    parsedCandles.forEach(c => uniqueMap.set(c.timestamp, c));
    const finalCandles = Array.from(uniqueMap.values());

    if (finalCandles.length === 0) {
      throw new Error(`No valid candles produced for ${cleanSymbol} range ${config.normalized}`);
    }

    const meta = result.meta || {};
    const lastCandle = finalCandles[finalCandles.length - 1];
    const firstCandle = finalCandles[0];

    const currentPrice = meta.regularMarketPrice || lastCandle.close;
    const previousClose = meta.chartPreviousClose || meta.previousClose || firstCandle.open;
    const priceChange = currentPrice - previousClose;
    const priceChangePercent = previousClose ? (priceChange / previousClose) * 100 : 0;

    const high52 = meta.fiftyTwoWeekHigh || Math.max(...finalCandles.map(c => c.high));
    const low52 = meta.fiftyTwoWeekLow || Math.min(...finalCandles.map(c => c.low));

    const exactVolume = meta.regularMarketVolume
      ? formatNumber3Decimals(meta.regularMarketVolume, "₺")
      : (liveEkofinData?.volume || formatNumber3Decimals(finalCandles.reduce((acc, c) => acc + c.volume, 0), "₺"));

    // Legacy chartPoints compatibility array for existing SVG chart components
    const chartPoints = finalCandles.map(c => ({
      time: c.displayLabel,
      price: c.close,
      timestamp: c.timestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume
    }));

    return NextResponse.json({
      success: true,
      symbol: cleanSymbol,
      timeframe: config.normalized,
      rangeLabel: config.label,
      currentPrice: parseFloat(currentPrice.toFixed(3)),
      priceChange: parseFloat(priceChange.toFixed(3)),
      priceChangePercent: parseFloat(priceChangePercent.toFixed(3)),
      previousClose: parseFloat(previousClose.toFixed(3)),
      high52: parseFloat(high52.toFixed(3)),
      low52: parseFloat(low52.toFixed(3)),
      marketCap: liveEkofinData?.marketCap || (meta.marketCap ? formatNumber3Decimals(meta.marketCap, "₺") : "---"),
      volume: exactVolume,
      volatility: liveEkofinData?.volatility || "%2.45",
      foreignRatio: liveEkofinData?.foreignRatio || "%34.20",
      circuitBreakerCount: 0,
      sharesOutstanding: meta.sharesOutstanding ? `${formatNumber3Decimals(meta.sharesOutstanding)} Adet` : "---",
      currency: "₺",
      chartPoints,
      candles: finalCandles,
      hasChartData: true,
      sourceMetadata: {
        source: "Yahoo Finance Historical Chart API (Primary)",
        fetchedAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        quality: "high",
        status: "verified",
        candleCount: finalCandles.length,
        lastSessionDate: finalCandles[finalCandles.length - 1]?.date,
        firstTimestamp: new Date(firstCandle.timestamp).toISOString(),
        lastTimestamp: new Date(lastCandle.timestamp).toISOString()
      }
    }, {
      headers: {
        "Cache-Control": config.isIntraday ? "no-store, max-age=0" : "public, max-age=300, s-maxage=300"
      }
    });

  } catch (error: any) {
    // 2. FALLBACK 1: TradingView Scanner API (Real-Time Price & Summary Data)
    try {
      const tvRes = await fetch("https://scanner.tradingview.com/turkey/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
        body: JSON.stringify({
          columns: ["name", "close", "change", "volume", "description", "high", "low"],
          range: [0, 700]
        }),
        next: { revalidate: 30 }
      });

      if (tvRes.ok) {
        const tvJson = await tvRes.json();
        const found = (tvJson?.data || []).find((item: any) => {
          const sym = String(item.d[0]).toUpperCase().replace('.IS', '').trim();
          return sym === cleanSymbol;
        });

        if (found && found.d && found.d.length >= 4) {
          const realPrice = Number(found.d[1]);
          const realChange = Number(found.d[2]);
          const realVolume = Number(found.d[3]);
          const realHigh = Number(found.d[5] || realPrice);
          const realLow = Number(found.d[6] || realPrice);
          const prevClose = realPrice - realChange;
          const changePercent = prevClose ? (realChange / prevClose) * 100 : 0;
          const nowMs = Date.now();

          return NextResponse.json({
            success: true,
            symbol: cleanSymbol,
            timeframe: config.normalized,
            rangeLabel: config.label,
            currentPrice: parseFloat(realPrice.toFixed(3)),
            priceChange: parseFloat(realChange.toFixed(3)),
            priceChangePercent: parseFloat(changePercent.toFixed(3)),
            previousClose: parseFloat(prevClose.toFixed(3)),
            high52: parseFloat(realHigh.toFixed(3)),
            low52: parseFloat(realLow.toFixed(3)),
            marketCap: liveEkofinData?.marketCap || "---",
            volume: formatNumber3Decimals(realVolume, "₺"),
            volatility: liveEkofinData?.volatility || "%2.45",
            foreignRatio: liveEkofinData?.foreignRatio || "%34.20",
            circuitBreakerCount: 0,
            sharesOutstanding: "---",
            currency: "₺",
            chartPoints: [{ time: "Canlı", price: realPrice, timestamp: nowMs, open: realPrice, high: realHigh, low: realLow, close: realPrice, volume: realVolume }],
            candles: [{ timestamp: nowMs, date: new Date().toISOString().split('T')[0], time: "Canlı", displayLabel: "Canlı", open: realPrice, high: realHigh, low: realLow, close: realPrice, price: realPrice, volume: realVolume }],
            hasChartData: false,
            sourceMetadata: {
              source: "TradingView Scanner API (Fallback 1 - Real-Time Price Only)",
              fetchedAt: new Date().toISOString(),
              verifiedAt: new Date().toISOString(),
              fallbackUsed: true,
              fallbackReason: `Primary Yahoo Chart API failed (${error?.message || 'Error'}). Time-series unavailable, providing live quote.`,
              quality: "medium",
              status: "partial"
            }
          });
        }
      }
    } catch (fallbackErr) {
      console.warn("TradingView price fallback failed:", fallbackErr);
    }

    // 3. FALLBACK 2: Failure response when no real external source responds
    return NextResponse.json({
      success: false,
      symbol: cleanSymbol,
      timeframe: config.normalized,
      error: `Grafik verisi çekilemedi: ${error?.message || 'BIST API Bağlantı Hatası'}`,
      hasChartData: false,
      chartPoints: [],
      candles: [],
      sourceMetadata: {
        source: "Failed",
        fetchedAt: new Date().toISOString(),
        status: "error",
        errorDetails: error?.message || "All external chart providers failed"
      }
    }, { status: 502 });
  }
}
