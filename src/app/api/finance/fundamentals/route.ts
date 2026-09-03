import { NextResponse } from "next/server";
import { fetchStockFundamentals } from "@/lib/fundamentals-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawSymbol = searchParams.get("symbol");
  const periodFilter = searchParams.get("period")?.toLowerCase();

  if (!rawSymbol) {
    return NextResponse.json(
      {
        success: false,
        error: "Symbol parametresi zorunludur (örneğin: ?symbol=THYAO)",
        quality: {
          status: "unavailable",
          completeness: 0,
          warnings: ["Geçersiz istek: Sembol belirtilmedi."]
        },
        periods: []
      },
      { status: 400 }
    );
  }

  const cleanSymbol = rawSymbol.toUpperCase().replace(".IS", "").trim();

  try {
    const data = await fetchStockFundamentals(cleanSymbol);

    // Optional period filtering
    if (periodFilter && periodFilter !== "all" && data.periods.length > 0) {
      const filteredPeriods = data.periods.filter(p => p.periodType === periodFilter);
      return NextResponse.json({
        ...data,
        periods: filteredPeriods
      });
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error(`[API /api/finance/fundamentals] Error for ${cleanSymbol}:`, error);
    return NextResponse.json(
      {
        success: false,
        symbol: cleanSymbol,
        error: "Finansal veriler işlenirken sunucu hatası oluştu.",
        quality: {
          status: "unavailable",
          completeness: 0,
          warnings: ["Sunucu tarafında işlem hatası."]
        },
        periods: []
      },
      { status: 500 }
    );
  }
}
