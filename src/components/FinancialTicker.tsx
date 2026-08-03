"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowUp, ArrowDown, Activity, Settings, Plus, X, Check, Search, Loader2 } from "lucide-react";

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

    // Autocomplete State
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    // Autocomplete Search Effect
    useEffect(() => {
        if (!newSymbol || newSymbol.trim().length === 0) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`/api/search?q=${newSymbol}`);
                const data = await res.json();
                if (data.results) {
                    setSearchResults(data.results.slice(0, 5));
                    setShowDropdown(true);
                }
            } catch (e) {
                console.error("Search error:", e);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [newSymbol]);

    // Close Dropdown on Click Outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

    const handleAddSymbol = (symbolToAdd: string = newSymbol) => {
        if (symbolToAdd && !symbols.includes(symbolToAdd.toUpperCase())) {
            setSymbols([...symbols, symbolToAdd.toUpperCase()]);
            setNewSymbol("");
            setShowDropdown(false);
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
        <div className="w-full bg-slate-50 border-b border-slate-100 backdrop-blur-md relative group h-12 flex items-center">

            {/* Edit Mode Overlay */}
            {isEditing && (
                <div className="absolute inset-0 z-20 bg-white flex items-center justify-between px-4 gap-4 overflow-visible backdrop-blur-lg border-b border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 flex-shrink-0 relative" ref={dropdownRef}>
                        <div className="relative">
                            <input
                                type="text"
                                value={newSymbol}
                                onChange={(e) => {
                                    setNewSymbol(e.target.value);
                                    setShowDropdown(true);
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddSymbol()}
                                placeholder="Sembol (Örn: THYAO)"
                                className="bg-slate-50 border border-slate-100 rounded-md pl-8 pr-3 py-1.5 text-xs text-[#00008B] font-bold placeholder:text-[#00008B]/30 focus:outline-none focus:border-[#00008B]/20 w-44 transition-colors"
                            />
                            <Search className="w-3.5 h-3.5 text-[#00008B]/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            {isSearching && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />}
                        </div>
                        
                        {showDropdown && searchResults.length > 0 && (
                            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-100 rounded-lg shadow-xl shadow-blue-900/5 z-50 overflow-hidden">
                                {searchResults.map((res: any, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleAddSymbol(res.symbol)}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0 group transition-colors"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-bold text-[#00008B] group-hover:text-blue-600 transition-colors">{res.symbol}</span>
                                            <span className="text-[10px] text-slate-400 line-clamp-1">{res.shortname}</span>
                                        </div>
                                        <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-widest">{res.typeDisp || res.exchange || 'Hisse'}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        <button onClick={() => handleAddSymbol()} className="p-1.5 hover:bg-emerald-500/20 rounded-md text-emerald-400 transition-colors"><Plus className="w-4 h-4" /></button>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-gradient-x flex-1">
                        {symbols.map(sym => (
                            <div key={sym} className="flex items-center gap-1.5 bg-[#00008B]/5 pl-2.5 pr-1.5 py-1 rounded-full border border-[#00008B]/10 flex-shrink-0 animate-in fade-in zoom-in duration-200">
                                <span className="text-[10px] font-bold text-[#00008B]/60 uppercase tracking-widest">{SYMBOL_NAMES[sym] || sym}</span>
                                <button onClick={() => handleRemoveSymbol(sym)} className="text-[#00008B]/40 hover:text-red-500 transition-colors p-0.5"><X className="w-3 h-3" /></button>
                            </div>
                        ))}
                    </div>

                    <button onClick={() => setIsEditing(false)} className="p-1.5 hover:bg-blue-50/50 rounded-md text-[#00008B] ml-auto flex-shrink-0 transition-colors flex items-center gap-1.5 px-3">
                        <Check className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-widest text-[10px]">Bitti</span>
                    </button>
                </div>
            )}

            <div className={`flex items-center justify-evenly px-4 py-3 w-full ${!isEditing ? '' : 'opacity-0'}`}>
                {data.length === 0 && !loading && <span className="text-xs text-slate-500 w-full text-center">Takip listesi boş. Düzenlemek için sağdaki ayar ikonuna tıklayın.</span>}

                {data.map((quote, index) => {
                    const isPositive = quote.regularMarketChangePercent >= 0;
                    const name = SYMBOL_NAMES[quote.symbol] || quote.shortName || quote.symbol;

                    let price = quote.regularMarketPrice;
                    // Convert Ounce Gold to Gram (Approx 31.1035g per troy ounce)
                    if (quote.symbol === "XAUTRY=X") {
                        price = price / 31.1034768;
                    }

                    return (
                        <div key={quote.symbol} className="flex items-center gap-2">
                            {index > 0 && <div className="w-px h-4 bg-slate-200 -ml-1 hidden md:block" />}
                            <span className="text-[10px] font-bold text-[#00008B]/40 whitespace-nowrap uppercase tracking-widest">{name}</span>
                            <span className="text-sm font-black text-[#00008B] whitespace-nowrap">
                                {price?.toFixed(2)}
                            </span>
                            <div className={`flex items-center text-xs font-semibold whitespace-nowrap ${isPositive ? "text-green-400" : "text-red-400"}`}>
                                {isPositive ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
                                %{Math.abs(quote.regularMarketChangePercent || 0).toFixed(2)}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Edit Toggle Button */}
            {!isEditing && (
                <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />
            )}
            {!isEditing && (
                <button
                    onClick={() => setIsEditing(true)}
                    className="absolute right-4 z-20 p-2 text-[#00008B]/40 hover:text-[#00008B] transition-colors bg-white/50 hover:bg-white rounded-full border border-slate-100 backdrop-blur-sm opacity-0 group-hover:opacity-100 duration-200 shadow-sm"
                    title="Şeridi Düzenle"
                >
                    <Settings className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
