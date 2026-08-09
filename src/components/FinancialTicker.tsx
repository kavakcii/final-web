"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowUp, ArrowDown, Activity, Settings, Plus, X, Check, Search, Loader2, AlertCircle } from "lucide-react";
import { BIST_CATALOG, TEFAS_CATALOG } from "@/lib/asset-catalog";

interface Quote {
    symbol: string;
    regularMarketPrice: number;
    regularMarketChangePercent: number;
    shortName?: string;
}

const MAX_TICKER_SYMBOLS = 5;

const DEFAULT_SYMBOLS = ["XU100.IS", "TRY=X", "EURTRY=X", "BTC-TRY", "ALTIN"];
const SYMBOL_NAMES: Record<string, string> = {
    "XU100.IS": "BIST 100",
    "TRY=X": "Dolar/TL",
    "EURTRY=X": "Euro/TL",
    "BTC-TRY": "Bitcoin",
    "ALTIN": "Gram Altın",
    "XAUTRY=X": "Gram Altın"
};

const COMMODITY_CATALOG = [
    { symbol: "ALTIN", name: "Gram Altın", type: "Altın" },
    { symbol: "GUMUS", name: "Gram Gümüş", type: "Altın/Emtia" },
    { symbol: "ALTIN.S1", name: "Darphane Altın Sertifikası", type: "Altın" },
    { symbol: "BTC", name: "Bitcoin (BTC)", type: "Kripto" },
    { symbol: "ETH", name: "Ethereum (ETH)", type: "Kripto" },
    { symbol: "USDTRY", name: "Dolar / TL", type: "Döviz" },
    { symbol: "EURTRY", name: "Euro / TL", type: "Döviz" }
];

export function FinancialTicker() {
    const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
    const [data, setData] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [newSymbol, setNewSymbol] = useState("");
    const [warningMsg, setWarningMsg] = useState<string | null>(null);

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
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setSymbols(parsed.slice(0, MAX_TICKER_SYMBOLS));
                    }
                } catch (e) {
                    console.error("Error parsing saved symbols", e);
                }
            }
        }
    }, []);

    // Save symbols on change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem("financialTickerSymbols", JSON.stringify(symbols.slice(0, MAX_TICKER_SYMBOLS)));
        }
    }, [symbols]);

    // Akıllı Harf Bazlı Öneri Arama Motoru (1 Harf Girildiği An)
    useEffect(() => {
        if (!newSymbol || newSymbol.trim().length === 0) {
            setSearchResults([]);
            setShowDropdown(false);
            setWarningMsg(null);
            return;
        }

        const query = newSymbol.toLowerCase().trim();
        
        // Tüm Varlıklar (BİST, Altın, Emtia, Kripto, TEFAS Fonları)
        const ALL_ASSETS = [
            ...COMMODITY_CATALOG,
            ...BIST_CATALOG,
            ...TEFAS_CATALOG.map(f => ({ symbol: f.symbol, name: f.name, type: 'Yatırım Fonu' }))
        ];

        const localMatches = ALL_ASSETS.filter(asset => 
            asset.symbol.toLowerCase().includes(query) || 
            asset.name.toLowerCase().includes(query)
        ).map(asset => ({
            symbol: asset.symbol,
            shortname: asset.name,
            typeDisp: asset.type || 'Hisse'
        })).slice(0, 10);

        setSearchResults(localMatches);
        setShowDropdown(true);

        if (localMatches.length === 0) {
            const delayDebounceFn = setTimeout(async () => {
                setIsSearching(true);
                try {
                    const res = await fetch(`/api/search?q=${encodeURIComponent(newSymbol)}`);
                    const json = await res.json();
                    if (json.results) {
                        setSearchResults(json.results.slice(0, 10));
                        setShowDropdown(true);
                    }
                } catch (e) {
                    console.error("Search error:", e);
                } finally {
                    setIsSearching(false);
                }
            }, 300);

            return () => clearTimeout(delayDebounceFn);
        }
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
                const activeSymbols = symbols.slice(0, MAX_TICKER_SYMBOLS);
                const uniqueSymbols = Array.from(new Set(activeSymbols));
                const res = await fetch(`/api/finance?symbols=${uniqueSymbols.join(",")}`);
                const json = await res.json();
                if (json.results) {
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
        if (!symbolToAdd) return;

        // 1. Maksimum 5 Varlık Sınırı Kontrolü
        if (symbols.length >= MAX_TICKER_SYMBOLS) {
            setWarningMsg("Canlı fiyat bandına en fazla 5 varlık ekleyebilirsiniz.");
            setTimeout(() => setWarningMsg(null), 4000);
            return;
        }

        const symUpper = symbolToAdd.toUpperCase().trim();
        if (!symbols.includes(symUpper)) {
            setSymbols([...symbols, symUpper]);
            setNewSymbol("");
            setShowDropdown(false);
            setWarningMsg(null);
        }
    };

    const handleRemoveSymbol = (sym: string) => {
        setSymbols(symbols.filter(s => s !== sym));
        setWarningMsg(null);
    };

    if (loading && symbols.length > 0 && data.length === 0) {
        return (
            <div className="w-full h-12 flex items-center justify-center space-x-4 bg-white/5 border-b border-slate-100 backdrop-blur-sm">
                <Activity className="w-4 h-4 text-[#00008B] animate-pulse" />
                <span className="text-xs font-bold text-slate-500">Piyasa verileri yükleniyor...</span>
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
                                disabled={symbols.length >= MAX_TICKER_SYMBOLS}
                                onChange={(e) => {
                                    setNewSymbol(e.target.value);
                                    setShowDropdown(true);
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddSymbol()}
                                placeholder={symbols.length >= MAX_TICKER_SYMBOLS ? "Sınır (5/5) Doldu" : "Varlık Ara (Örn: THYAO, Altın...)"}
                                className={`bg-slate-50 border rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#00008B] font-bold placeholder:text-[#00008B]/40 focus:outline-none w-56 transition-all ${
                                    symbols.length >= MAX_TICKER_SYMBOLS 
                                        ? 'border-amber-200 bg-amber-50/50 cursor-not-allowed text-amber-700' 
                                        : 'border-slate-200 focus:border-[#00008B]/40'
                                }`}
                            />
                            <Search className="w-3.5 h-3.5 text-[#00008B]/50 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            {isSearching && <Loader2 className="w-3.5 h-3.5 text-[#00008B] animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />}
                        </div>
                        
                        {/* Akıllı Öneri Dropdown */}
                        {showDropdown && searchResults.length > 0 && symbols.length < MAX_TICKER_SYMBOLS && (
                            <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-blue-200 rounded-2xl shadow-2xl shadow-[#00008B]/20 z-[100] overflow-hidden max-h-64 overflow-y-auto">
                                {searchResults.map((res: any, idx: number) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleAddSymbol(res.symbol)}
                                        className="px-4 py-3 hover:bg-blue-50/80 cursor-pointer flex justify-between items-center border-b border-slate-100 last:border-0 transition-colors group"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-black text-[#00008B] text-xs group-hover:text-blue-600 transition-colors">{res.symbol}</span>
                                            <span className="text-[11px] text-slate-500 font-semibold line-clamp-1">{res.shortname}</span>
                                        </div>
                                        <span className="text-[9px] px-2.5 py-1 rounded-lg bg-blue-50 text-[#00008B] font-bold border border-blue-200/60 uppercase tracking-wider">{res.typeDisp || res.exchange || 'Hisse'}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <button
                            onClick={() => handleAddSymbol()}
                            disabled={symbols.length >= MAX_TICKER_SYMBOLS}
                            className={`p-1.5 rounded-xl text-white transition-all ${
                                symbols.length >= MAX_TICKER_SYMBOLS 
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                                    : 'bg-[#00008B] hover:bg-[#0808a3] shadow-xs'
                            }`}
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Sınır & Uyarı Rozeti */}
                    <div className="flex items-center gap-2">
                        {warningMsg ? (
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200 flex items-center gap-1.5 animate-in fade-in">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                {warningMsg}
                            </span>
                        ) : (
                            <span className="text-[10px] font-black text-[#00008B]/60 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
                                Sınır: <span className="text-[#00008B] font-black">{symbols.length}/5</span> Varlık
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-gradient-x flex-1">
                        {symbols.map(sym => (
                            <div key={sym} className="flex items-center gap-1.5 bg-[#00008B]/5 pl-2.5 pr-1.5 py-1 rounded-full border border-[#00008B]/10 flex-shrink-0">
                                <span className="text-[10px] font-bold text-[#00008B] uppercase tracking-widest">{SYMBOL_NAMES[sym] || sym}</span>
                                <button onClick={() => handleRemoveSymbol(sym)} className="text-[#00008B]/40 hover:text-red-500 transition-colors p-0.5"><X className="w-3 h-3" /></button>
                            </div>
                        ))}
                    </div>

                    <button onClick={() => setIsEditing(false)} className="p-1.5 hover:bg-blue-50/50 rounded-xl text-[#00008B] ml-auto flex-shrink-0 transition-colors flex items-center gap-1.5 px-3 border border-slate-200">
                        <Check className="w-4 h-4 text-emerald-600" /> <span className="text-xs font-bold uppercase tracking-widest text-[10px]">Tamam</span>
                    </button>
                </div>
            )}

            {/* Display Mode */}
            <div className={`flex items-center justify-evenly px-4 py-3 w-full ${!isEditing ? '' : 'opacity-0'}`}>
                {data.length === 0 && !loading && <span className="text-xs text-slate-500 w-full text-center">Takip listesi boş. Düzenlemek için sağdaki ayar ikonuna tıklayın.</span>}

                {data.slice(0, MAX_TICKER_SYMBOLS).map((quote, index) => {
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
                            <span className="text-[10px] font-bold text-[#00008B]/50 whitespace-nowrap uppercase tracking-widest">{name}</span>
                            <span className="text-sm font-black text-[#00008B] whitespace-nowrap">
                                ₺{price?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <div className={`flex items-center text-xs font-bold whitespace-nowrap ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
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
                    className="absolute right-4 z-20 p-2 text-[#00008B]/60 hover:text-[#00008B] transition-colors bg-white/80 hover:bg-white rounded-full border border-slate-200 backdrop-blur-sm opacity-0 group-hover:opacity-100 duration-200 shadow-xs"
                    title="Şeridi Düzenle"
                >
                    <Settings className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
