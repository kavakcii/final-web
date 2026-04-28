import { NextResponse } from "next/server";
import { fetchMultipleStocks } from "@/lib/stocks";
import { fetchTefasData } from "@/lib/tefas";
import { STOCK_SECTORS, FUND_SECTORS } from "@/lib/constants/assets-mapping";

export async function POST(req: Request) {
  try {
    const { sector, type } = await req.json();

    if (!sector) {
      return NextResponse.json({ error: "Sektör belirtilmedi" }, { status: 400 });
    }

    if (type === "hisse") {
      const mapping = (STOCK_SECTORS as Record<string, string[]>)[sector];
      if (!mapping) {
        return NextResponse.json({ success: true, data: [] });
      }
      const stocks = await fetchMultipleStocks(mapping);
      return NextResponse.json({ success: true, data: stocks });
    } else {
      const mapping = (FUND_SECTORS as Record<string, string[]>)[sector];
      if (!mapping) {
        return NextResponse.json({ success: true, data: [] });
      }
      
      const allFunds = await fetchTefasData(new Date());
      const filteredFunds = allFunds.filter(f => mapping.includes(f.FONKODU));
      
      const { fetchTefasHistory } = await import("@/lib/tefas");
      
      const formattedFunds = await Promise.all(filteredFunds.map(async f => {
        const history = await fetchTefasHistory(f.FONKODU, 1);
        const changePercent = history && history.length > 1 
            ? ((history[history.length-1].price / history[0].price) - 1) * 100 
            : 0;

        return {
          symbol: f.FONKODU,
          name: f.FONUNVAN,
          category: f.FONTURACIKLAMA,
          price: f.SONPORTFOYDEGERI / f.SONPAYADEDI,
          changePercent: changePercent,
          history: history ? history.map(h => ({ date: h.date, price: h.price })) : []
        };
      }));

      return NextResponse.json({ success: true, data: formattedFunds });
    }

  } catch (error) {
    console.error("Market data API error:", error);
    return NextResponse.json({ success: false, data: [], error: "Sistem hatası" }, { status: 200 });
  }
}
