import { NextResponse } from "next/server";
import { fetchMultipleStocks } from "@/lib/stocks";
import { fetchTefasData } from "@/lib/tefas";
import { ASSET_SECTORS } from "@/lib/constants/assets-mapping";

export async function POST(req: Request) {
  try {
    const { sector, type } = await req.json();

    if (!sector || !ASSET_SECTORS[sector]) {
      return NextResponse.json({ error: "Geçersiz sektör" }, { status: 400 });
    }

    const mapping = ASSET_SECTORS[sector];

    if (type === "hisse") {
      const stocks = await fetchMultipleStocks(mapping.hisseler);
      return NextResponse.json({ success: true, data: stocks });
    } else {
      // For funds, we fetch all and filter by the codes in mapping
      const allFunds = await fetchTefasData(new Date());
      const filteredFunds = allFunds.filter(f => mapping.fonlar.includes(f.FONKODU));
      
      // Map to a consistent format
      const formattedFunds = filteredFunds.map(f => ({
        symbol: f.FONKODU,
        name: f.FONUNVAN,
        category: f.FONTURACIKLAMA,
        price: f.SONPORTFOYDEGERI / f.SONPAYADEDI,
        // Since list doesn't give returns, we'd need another call or just use price for now
        // For the sake of this UI, we will return what we have
      }));

      return NextResponse.json({ success: true, data: formattedFunds });
    }

  } catch (error) {
    console.error("Market data API error:", error);
    return NextResponse.json({ error: "Sistem hatası" }, { status: 500 });
  }
}
