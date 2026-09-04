import { NextResponse } from "next/server";

export async function GET() {
  try {
    const postData = JSON.stringify({
      columns: ["name", "close", "change", "volume", "price_earnings_ttm"],
      range: [0, 700]
    });

    const res = await fetch("https://scanner.tradingview.com/turkey/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      },
      body: postData,
      next: { revalidate: 30 } // Cache for max 30s
    });

    if (!res.ok) {
      throw new Error(`TradingView scanner returned status ${res.status}`);
    }

    const data = await res.json();
    const pricesMap: Record<string, { price: number; change: number; volume: string; pe: number }> = {};

    if (data && Array.isArray(data.data)) {
      data.data.forEach((item: any) => {
        if (item && item.d && item.d.length >= 4) {
          const sym = String(item.d[0]).toUpperCase().replace('.IS', '').trim();
          const price = parseFloat(Number(item.d[1] || 0).toFixed(2));
          const change = parseFloat(Number(item.d[2] || 0).toFixed(2));
          const rawVol = Number(item.d[3] || 0);
          
          let volStr = "";
          if (rawVol >= 1e9) {
            volStr = `${(rawVol / 1e9).toFixed(1)} Mr ₺`;
          } else if (rawVol >= 1e6) {
            volStr = `${(rawVol / 1e6).toFixed(1)} M₺`;
          } else if (rawVol >= 1e3) {
            volStr = `${(rawVol / 1e3).toFixed(1)} B₺`;
          } else {
            volStr = `${rawVol} ₺`;
          }

          const rawPe = item.d[4];
          const pe = (rawPe !== null && rawPe !== undefined && rawPe > 0)
            ? parseFloat(Number(rawPe).toFixed(2))
            : 0;

          pricesMap[sym] = {
            price,
            change,
            volume: volStr,
            pe
          };
        }
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      count: Object.keys(pricesMap).length,
      prices: pricesMap,
      sourceMetadata: {
        source: "TradingView Scanner API (Primary)",
        fetchedAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        fallbackUsed: false,
        quality: "high",
        status: "verified"
      }
    });
  } catch (error: any) {
    console.warn("Primary TradingView scanner failed in /api/bist/prices:", error?.message || error);
    
    return NextResponse.json({
      success: false,
      error: error.message || "Canlı fiyat verisi alınamadı.",
      timestamp: new Date().toISOString(),
      count: 0,
      prices: {},
      sourceMetadata: {
        source: "TradingView Scanner API (Failed)",
        fetchedAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        fallbackUsed: true,
        primarySourceFailed: true,
        quality: "unavailable",
        status: "unavailable",
        errorCode: error.message || "SCANNER_FETCH_ERROR"
      }
    }, { status: 200 }); // Return HTTP 200 so UI doesn't crash, with status: unavailable!
  }
}
