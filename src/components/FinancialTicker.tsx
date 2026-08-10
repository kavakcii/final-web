"use client";

import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, Activity } from "lucide-react";

interface Quote {
    symbol: string;
    regularMarketPrice: number;
    regularMarketChangePercent: number;
    shortName?: string;
}

// Sabit 5 Ana Makro Varlık (Kullanıcı tarafından değiştirilemez)
const FIXED_SYMBOLS = ["XU100.IS", "TRY=X", "EURTRY=X", "ALTIN", "BTC-TRY"];

const SYMBOL_NAMES: Record<string, string> = {
    "XU100.IS": "BIST 100",
    "TRY=X": "Dolar/TL",
    "EURTRY=X": "Euro/TL",
    "ALTIN": "Gram Altın",
    "XAUTRY=X": "Gram Altın",
    "BTC-TRY": "Bitcoin",
    "BTC": "Bitcoin"
};

export function FinancialTicker() {
    const [data, setData] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);

    // Canlı Piyasa Verilerini Çekme (60 saniyede bir otomatik güncelleme)
    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch(`/api/finance?symbols=${FIXED_SYMBOLS.join(",")}`);
                const json = await res.json();
                if (json.results) {
                    setData(json.results.filter((r: any) => r && r.symbol));
                }
            } catch (error) {
                console.error("Failed to fetch financial ticker data", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
        const interval = setInterval(fetchData, 60000); // 1 dakikada bir otomatik yenile
        return () => clearInterval(interval);
    }, []);

    if (loading && data.length === 0) {
        return (
            <div className="w-full h-12 flex items-center justify-center space-x-4 bg-slate-50 border-b border-slate-100 backdrop-blur-sm">
                <Activity className="w-4 h-4 text-[#00008B] animate-pulse" />
                <span className="text-xs font-bold text-slate-500">Piyasa verileri yükleniyor...</span>
            </div>
        );
    }

    return (
        <div className="w-full bg-slate-50 border-b border-slate-100 backdrop-blur-md relative h-10 md:h-12 flex items-center overflow-x-auto scrollbar-none">
            <div className="flex items-center justify-start md:justify-evenly px-4 py-2 min-w-max md:w-full gap-6 md:gap-2">
                {FIXED_SYMBOLS.map((sym, index) => {
                    const quote = data.find(q => 
                        q.symbol.toUpperCase() === sym.toUpperCase() || 
                        q.symbol.toUpperCase().replace(/\.IS$/, '') === sym.toUpperCase() ||
                        (sym === 'ALTIN' && (q.symbol.includes('XAU') || q.symbol.includes('ALTIN')))
                    ) || {
                        symbol: sym,
                        regularMarketPrice: 0,
                        regularMarketChangePercent: 0
                    };

                    const isPositive = quote.regularMarketChangePercent >= 0;
                    const name = SYMBOL_NAMES[sym] || quote.shortName || sym;

                    let price = quote.regularMarketPrice;
                    // ONS Altını Gram Altına Çevir
                    if (sym === "XAUTRY=X" || (sym === "ALTIN" && price > 50000)) {
                        price = price / 31.1034768;
                    }

                    return (
                        <div key={sym} className="flex items-center gap-2">
                            {index > 0 && <div className="w-px h-4 bg-slate-200 -ml-1 hidden md:block" />}
                            <span className="text-[10px] font-bold text-[#00008B]/50 whitespace-nowrap uppercase tracking-widest">{name}</span>
                            <span className="text-xs md:text-sm font-black text-[#00008B] whitespace-nowrap">
                                {price > 0 ? `₺${price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Canlı...'}
                            </span>
                            <div className={`flex items-center text-[10px] md:text-xs font-bold whitespace-nowrap ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                                {isPositive ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
                                %{Math.abs(quote.regularMarketChangePercent || 0).toFixed(2)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
