"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  ChevronRight, 
  Layers, 
  ArrowUpRight, 
  Zap, 
  ShieldCheck, 
  Globe, 
  Activity,
  LayoutGrid,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { STOCK_SECTORS, FUND_SECTORS } from "@/lib/constants/assets-mapping";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

interface AssetData {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  history: { date: string; price: number }[];
  category?: string;
}

interface Suggestion {
  symbol: string;
  name: string;
  type: "hisse" | "fon";
}

export default function AssetsPage() {
    const [assetType, setAssetType] = useState<"hisse" | "fon">("hisse");
    const [selectedSector, setSelectedSector] = useState(Object.keys(STOCK_SECTORS)[0]);
    const [data, setData] = useState<AssetData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [allFunds, setAllFunds] = useState<{code: string, title: string}[]>([]);

    const sectors = assetType === "hisse" ? Object.keys(STOCK_SECTORS) : Object.keys(FUND_SECTORS);

    // Common BIST names for smart autocomplete
    const STOCK_NAMES: Record<string, string> = {
        "THYAO": "Türk Hava Yolları", "ASELS": "Aselsan Savunma", "EREGL": "Erdemir Demir Çelik",
        "TUPRS": "Tüpraş Rafinerileri", "KCHOL": "Koç Holding", "SAHOL": "Sabancı Holding",
        "GARAN": "Garanti Bankası", "AKBNK": "Akbank", "ISCTR": "İş Bankası",
        "YKBNK": "Yapı Kredi Bankası", "BIMAS": "BİM Birleşik Mağazalar", "MGROS": "Migros Ticaret",
        "SOKM": "Şok Marketler", "SISE": "Şişecam", "FROTO": "Ford Otosan",
        "TOASO": "Tofaş Otomobil", "TTRAK": "Türk Traktör", "TCELL": "Turkcell İletişim",
        "TTKOM": "Türk Telekom", "SASA": "Sasa Polyester", "HEKTS": "Hektaş Ticaret",
        "ASTOR": "Astor Enerji", "KONTR": "Kontrolmatik Teknoloji", "MIATK": "Mia Teknoloji",
        "REEDR": "Reeder Teknoloji", "CWENE": "CW Enerji", "EUPWR": "Europower Enerji",
        "GESAN": "Girişim Elektrik", "ENJSA": "Enerjisa Enerji", "ODAS": "Odaş Elektrik",
        "PGSUS": "Pegasus Hava Yolları", "TAVHL": "TAV Havalimanları", "ARCLK": "Arçelik",
        "VESTL": "Vestel", "VESBE": "Vestel Beyaz Eşya", "PETKM": "Petkim Petrokimya",
        "KRDMD": "Kardemir Karabük", "ALARK": "Alarko Holding", "TKFEN": "Tekfen Holding",
        "EKGYO": "Emlak Konut GYO", "HALKB": "Halkbank", "VAKBN": "Vakıfbank",
        "AEFES": "Anadolu Efes", "CCOLA": "Coca-Cola İçecek", "ULKER": "Ülker Bisküvi",
        "ANSGR": "Anadolu Sigorta", "TURSG": "Türkiye Sigorta", "ALTNY": "Altınay Savunma",
        "OTKAR": "Otokar", "DOAS": "Doğuş Otomotiv", "PATEK": "Pasifik Teknoloji",
        "ARDYZ": "Ard Bilişim", "BRSAN": "Borusan Boru", "SDTTR": "SDT Uzay ve Savunma"
    };

    useEffect(() => {
        setSelectedSector(assetType === "hisse" ? Object.keys(STOCK_SECTORS)[0] : Object.keys(FUND_SECTORS)[0]);
    }, [assetType]);

    useEffect(() => {
        const loadAllFunds = async () => {
            try {
                const res = await fetch('/api/tefas/list');
                const json = await res.json();
                if (json.success) setAllFunds(json.data);
            } catch (e) { console.error("Fund index failed", e); }
        };
        loadAllFunds();
    }, []);

    useEffect(() => {
        if (searchTerm.length > 1) {
            const term = searchTerm.toLowerCase();
            const matches: Suggestion[] = [];

            const allStockSymbols = Object.values(STOCK_SECTORS).flat();
            const matchedStocks = allStockSymbols.filter(s => 
                s.toLowerCase().includes(term) || (STOCK_NAMES[s] && STOCK_NAMES[s].toLowerCase().includes(term))
            ).slice(0, 5);

            matchedStocks.forEach(s => matches.push({ symbol: s, name: STOCK_NAMES[s] || "BIST Hisse", type: 'hisse' }));

            const matchedFunds = allFunds.filter(f => 
                f.code.toLowerCase().includes(term) || f.title.toLowerCase().includes(term)
            ).slice(0, 5);

            matchedFunds.forEach(f => matches.push({ symbol: f.code, name: f.title, type: 'fon' }));
            setSuggestions(matches.slice(0, 10));
        } else {
            setSuggestions([]);
        }
    }, [searchTerm, allFunds]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/assets/market-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sector: selectedSector, type: assetType })
                });
                const json = await res.json();
                if (json.success) setData(json.data);
            } catch (error) { console.error("Fetch error:", error); }
            finally { setLoading(false); }
        };
        fetchData();
    }, [selectedSector, assetType]);

    const filteredData = data.filter(item => 
        (item.symbol || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 min-h-screen bg-[#F8FAFC] space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-[#00008B]/5 border border-[#00008B]/10 rounded-full w-fit">
                        <Activity className="w-3 h-3 text-[#00008B] animate-pulse" />
                        <span className="text-[10px] font-black text-[#00008B] uppercase tracking-widest">FinAi Terminal v2.0</span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">
                        Varlık <span className="text-[#00008B]">Merkezi</span>
                    </h1>
                </div>

                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#00008B]" />
                    <input 
                        type="text"
                        placeholder="Hisse veya fon ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[24px] text-sm font-bold focus:outline-none focus:ring-8 focus:ring-[#00008B]/5 focus:border-[#00008B] transition-all shadow-xl shadow-slate-200/50"
                    />
                    <AnimatePresence>
                        {suggestions.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-[24px] shadow-2xl z-[100] overflow-hidden">
                                {suggestions.map((s, i) => (
                                    <div key={i} onClick={() => { setSearchTerm(s.symbol); setAssetType(s.type); setSuggestions([]); }} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-[10px]">{s.symbol}</div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-black text-slate-900">{s.name}</p>
                                                    <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest", s.type === 'hisse' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600")}>{s.type === 'hisse' ? 'Hisse' : 'Fon'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <ArrowUpRight className="w-4 h-4 text-slate-200" />
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                {sectors.map((sector) => (
                    <button key={sector} onClick={() => setSelectedSector(sector)} className={cn("px-6 py-3.5 rounded-2xl text-[11px] font-black whitespace-nowrap transition-all border shrink-0 uppercase tracking-[0.15em]", selectedSector === sector ? "bg-[#00008B] border-[#00008B] text-white shadow-2xl shadow-[#00008B]/30 -translate-y-1" : "bg-white border-slate-200 text-slate-500 hover:border-slate-400 hover:bg-slate-50")}>
                        {sector}
                    </button>
                ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-2xl shadow-slate-200/40 min-h-[600px] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50/30 rounded-full blur-[100px] -z-0 pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-3xl bg-[#00008B] flex items-center justify-center shadow-xl shadow-[#00008B]/20">
                            <LayoutGrid className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">{selectedSector} Analizi</h2>
                        </div>
                    </div>
                    <div className="flex p-1.5 bg-slate-100/80 backdrop-blur-sm rounded-[20px] border border-slate-200/50">
                        {[{ id: "hisse", label: "Hisseler", icon: TrendingUp }, { id: "fon", label: "Fonlar", icon: Layers }].map((t) => (
                            <button key={t.id} onClick={() => setAssetType(t.id as any)} className={cn("flex items-center gap-2 px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all", assetType === t.id ? "bg-white text-[#00008B] shadow-lg" : "text-slate-500")}>
                                <t.icon className="w-4 h-4" /> {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center py-24">
                            <div className="w-20 h-20 border-4 border-slate-100 border-t-[#00008B] rounded-full animate-spin" />
                        </motion.div>
                    ) : (
                        <motion.div key="grid" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 relative z-10">
                            {filteredData.map((item, idx) => (
                                <div key={item.symbol} className="group bg-white border border-slate-100 rounded-[32px] p-6 hover:border-[#00008B]/20 hover:shadow-2xl transition-all">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">{item.symbol}</div>
                                                <div className="max-w-[120px]">
                                                    <h3 className="text-sm font-black text-slate-900 truncate">{item.name}</h3>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.category || (assetType === 'hisse' ? 'Hisse' : 'Fon')}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-20 w-full">
                                            {item.history && item.history.length > 0 && (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={item.history}>
                                                        <YAxis hide domain={['auto', 'auto']} />
                                                        <Line type="monotone" dataKey="price" stroke={item.changePercent >= 0 ? "#10b981" : "#ef4444"} strokeWidth={3} dot={false} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            )}
                                        </div>
                                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                            <div className="text-2xl font-black text-slate-900 tracking-tighter">
                                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(item.price || 0)}
                                            </div>
                                            <div className={cn("px-3 py-1.5 rounded-xl font-black text-xs", item.changePercent >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                                                %{Math.abs(item.changePercent).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
