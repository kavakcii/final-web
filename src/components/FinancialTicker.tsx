"use client";

import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, Activity, Settings, Plus, X, Check } from "lucide-react";

interface Quote {
    symbol: string;
    regularMarketPrice: number;
    regularMarketChangePercent: number;
    shortName?: string;
}

const DEFAULT_SYMBOLS = ["XU100.IS", "TRY=X", "EURTRY=X", "BTC-TRY", "XAUTRY=X"];
const SYMBOL_NAMES: Record<string, string> = {
    "XU100.IS": "BIST 100",
    "TRY=X": "Dolar/TL",
    "EURTRY=X": "Euro/TL",
    "BTC-TRY": "Bitcoin (TL)",
    "XAUTRY=X": "Gram Altın"
};

export function FinancialTicker() {
    const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
    const [data, setData] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [newSymbol, setNewSymbol] = useState("");

    // Load saved symbols
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem("financialTickerSymbols");
            if (saved) {
                try {
                    setSymbols(JSON.parse(saved));
                } catch (e) {
                    console.error("Error parsing saved symbols", e);
                }
            }
        }
    }, []);

    // Save symbols on change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem("financialTickerSymbols", JSON.stringify(symbols));
        }
    }, [symbols]);

    // Fetch data
    useEffect(() => {
        async function fetchData() {
            if (symbols.length === 0) {
                setData([]);
                setLoading(false);
                return;
            }
            try {
                // simple deduplication just in case
                const uniqueSymbols = Array.from(new Set(symbols));
                const res = await fetch(`/api/finance?symbols=${uniqueSymbols.join(",")}`);
                const json = await res.json();
                if (json.results) {
                    // Filter out null results if any
                    setData(json.results.filter((r: any) => r && r.symbol));
                }
            } catch (error) {
                console.error("Failed to fetch financial data", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
        const interval = setInterval(fetchData, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [symbols]);

    const handleAddSymbol = () => {
        if (newSymbol && !symbols.includes(newSymbol.toUpperCase())) {
            setSymbols([...symbols, newSymbol.toUpperCase()]);
            setNewSymbol("");
        }
    };

    const handleRemoveSymbol = (sym: string) => {
        setSymbols(symbols.filter(s => s !== sym));
    };

    if (loading && symbols.length > 0 && data.length === 0) {
        return (
            <div className="w-full h-12 flex items-center justify-center space-x-4 bg-white/5 border-b border-white/10 backdrop-blur-sm">
                <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
                <span className="text-xs text-slate-400">Piyasa verileri yükleniyor...</span>
            </div>
        );
    }

    return (
        <div className="w-full bg-black/50 border-b border-white/10 backdrop-blur-md relative group h-12 flex items-center">

            {/* Edit Mode Overlay */}
            {isEditing && (
                <div className="absolute inset-0 z-20 bg-zinc-900/95 flex items-center justify-between px-4 gap-4 overflow-hidden backdrop-blur-lg">
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <input
                            type="text"
                            value={newSymbol}
                            onChange={(e) => setNewSymbol(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddSymbol()}
                            placeholder="Sembol (THYAO.IS)"
                            className="bg-white/10 border border-white/20 rounded-md px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-36 transition-colors"
                        />
                        <button onClick={handleAddSymbol} className="p-1.5 hover:bg-emerald-500/20 rounded-md text-emerald-400 transition-colors"><Plus className="w-4 h-4" /></button>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-gradient-x flex-1">
                        {symbols.map(sym => (
                            <div key={sym} className="flex items-center gap-1.5 bg-white/5 pl-2.5 pr-1.5 py-1 rounded-full border border-white/10 flex-shrink-0 animate-in fade-in zoom-in duration-200">
                                <span className="text-[10px] font-medium text-slate-300">{SYMBOL_NAMES[sym] || sym}</span>
                                <button onClick={() => handleRemoveSymbol(sym)} className="text-slate-500 hover:text-red-400 transition-colors p-0.5"><X className="w-3 h-3" /></button>
                            </div>
                        ))}
                    </div>

                    <button onClick={() => setIsEditing(false)} className="p-1.5 hover:bg-blue-500/20 rounded-md text-blue-400 ml-auto flex-shrink-0 transition-colors flex items-center gap-1.5 px-3">
                        <Check className="w-4 h-4" /> <span className="text-xs font-medium">Bitti</span>
                    </button>
                </div>
            )}

            <div className={`flex items-center space-x-8 px-6 py-3 w-full overflow-x-auto no-scrollbar ${!isEditing ? '' : 'opacity-0'}`}>
                {data.length === 0 && !loading && <span className="text-xs text-slate-500 w-full text-center">Takip listesi boş. Düzenlemek için sağdaki ayar ikonuna tıklayın.</span>}

                {data.map((quote) => {
                    const isPositive = quote.regularMarketChangePercent >= 0;
                    const name = SYMBOL_NAMES[quote.symbol] || quote.shortName || quote.symbol;

                    let price = quote.regularMarketPrice;
                    // Convert Ounce Gold to Gram (Approx 31.1035g per troy ounce)
                    if (quote.symbol === "XAUTRY=X") {
                        price = price / 31.1034768;
                    }

                    return (
                        <div key={quote.symbol} className="flex items-center space-x-2 min-w-max">
                            <span className="text-xs font-medium text-slate-400">{name}</span>
                            <span className="text-sm font-bold text-white">
                                {price?.toFixed(2)}
                            </span>
                            <div className={`flex items-center text-xs font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                                {isPositive ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
                                %{Math.abs(quote.regularMarketChangePercent || 0).toFixed(2)}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Edit Toggle Button */}
            {!isEditing && (
                <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
            )}
            {!isEditing && (
                <button
                    onClick={() => setIsEditing(true)}
                    className="absolute right-4 z-20 p-2 text-slate-400 hover:text-white transition-colors bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 duration-200"
                    title="Şeridi Düzenle"
                >
                    <Settings className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
