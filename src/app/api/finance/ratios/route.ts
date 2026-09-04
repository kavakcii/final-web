import { NextResponse } from 'next/server';
import { fetchStockFundamentals } from '@/lib/fundamentals-service';
import { calculateFinancialRatios } from '@/lib/financial-ratio-engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbolParam = searchParams.get('symbol');

    if (!symbolParam) {
      return NextResponse.json(
        { error: 'Symbol parameter is required (e.g. ?symbol=THYAO)' },
        { status: 400 }
      );
    }

    const cleanSymbol = symbolParam.toUpperCase().replace(/\.IS$/, '').trim();

    // 1. Fetch Fundamentals Data Layer
    const fundamentals = await fetchStockFundamentals(cleanSymbol);

    // 2. Fetch Live Price for Valuation Metrics
    let livePrice: number | null = null;
    try {
      const priceRes = await fetch(`https://scanner.tradingview.com/turkey/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columns: ['name', 'close'],
          range: [0, 700]
        }),
        next: { revalidate: 30 }
      });
      if (priceRes.ok) {
        const priceJson = await priceRes.json();
        const found = (priceJson?.data || []).find((item: any) => {
          const raw = String(item.d[0] || '').toUpperCase().trim();
          const sym = raw.replace(/^BIST:/, '').replace(/\.IS$/, '').trim();
          return sym === cleanSymbol || raw === cleanSymbol;
        });
        if (found && found.d && found.d[1] != null && !isNaN(found.d[1])) {
          livePrice = Number(found.d[1]);
        }
      }
    } catch (e) {
      console.warn(`Live price lookup failed for ${cleanSymbol} in ratio route:`, e);
    }

    if (livePrice == null) {
      try {
        const yfRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${cleanSymbol}.IS?range=1d&interval=1d`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        if (yfRes.ok) {
          const yfJson = await yfRes.json();
          const close = yfJson?.chart?.result?.[0]?.meta?.regularMarketPrice;
          if (close != null && !isNaN(close) && close > 0) {
            livePrice = Number(close);
          }
        }
      } catch (e) {
        console.warn(`Yahoo live price lookup fallback failed for ${cleanSymbol}:`, e);
      }
    }

    // 3. Calculate Financial Ratios via Engine
    const ratioResults = calculateFinancialRatios(fundamentals, livePrice);

    return NextResponse.json({
      success: true,
      data: ratioResults
    });
  } catch (error: any) {
    console.error('Error in /api/finance/ratios:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to calculate financial ratios' },
      { status: 500 }
    );
  }
}
