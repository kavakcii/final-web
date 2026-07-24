"use client";

import { useState, useEffect, useMemo } from "react";
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
  Info,
  Sparkles,
  BarChart3,
  SlidersHorizontal,
  Grid,
  List,
  Cpu,
  PieChart,
  Plus,
  Check,
  Building2,
  RefreshCw,
  ArrowUpDown,
  ArrowRightLeft,
  Scale,
  LineChart as LineChartIcon,
  Maximize2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { STOCK_SECTORS, FUND_SECTORS } from "@/lib/constants/assets-mapping";
import { ResponsiveContainer, AreaChart, Area, YAxis, LineChart, Line, XAxis, Tooltip } from "recharts";

interface AssetData {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  history: { date: string; price: number }[];
  category?: string;
  volume?: string;
  high52?: number;
  low52?: number;
  pe?: number; // F/K Oranı
  pb?: number; // PD/DD Oranı
}

interface Suggestion {
  symbol: string;
  name: string;
  type: "hisse" | "fon";
}

// BIST Şirket Tam Adları Kataloğu
const STOCK_NAMES: Record<string, string> = {
    "THYAO": "Türk Hava Yolları A.O.", 
    "ASELS": "Aselsan Elektronik Sanayi A.Ş.", 
    "EREGL": "Ereğli Demir ve Çelik Fabrikaları",
    "TUPRS": "Tüpraş Petrol Rafinerileri A.Ş.", 
    "KCHOL": "Koç Holding A.Ş.", 
    "SAHOL": "Hacı Ömer Sabancı Holding A.Ş.",
    "GARAN": "Garanti BBVA A.Ş.", 
    "AKBNK": "Akbank T.A.Ş.", 
    "ISCTR": "Türkiye İş Bankası A.Ş.",
    "YKBNK": "Yapı ve Kredi Bankası A.Ş.", 
    "BIMAS": "BİM Birleşik Mağazalar A.Ş.", 
    "MGROS": "Migros Ticaret A.Ş.",
    "SOKM": "Şok Marketler Ticaret A.Ş.", 
    "SISE": "Türkiye Şişe ve Cam Fabrikaları", 
    "FROTO": "Ford Otomotiv Sanayi A.Ş.",
    "TOASO": "Tofaş Türk Otomobil Fabrikası", 
    "TTRAK": "Türk Traktör ve Ziraat Makineleri", 
    "TCELL": "Turkcell İletişim Hizmetleri A.Ş.",
    "TTKOM": "Türk Telekomünikasyon A.Ş.", 
    "SASA": "Sasa Polyester Sanayi A.Ş.", 
    "HEKTS": "Hektaş Ticaret T.A.Ş.",
    "ASTOR": "Astor Enerji A.Ş.", 
    "KONTR": "Kontrolmatik Teknoloji Enerji", 
    "MIATK": "Mia Teknoloji A.Ş.",
    "REEDR": "Reeder Teknoloji Sanayi A.Ş.", 
    "CWENE": "CW Enerji Mühendislik A.Ş.", 
    "EUPWR": "Europower Enerji A.Ş.",
    "GESAN": "Girişim Elektrik Sanayi A.Ş.", 
    "ENJSA": "Enerjisa Enerji A.Ş.", 
    "ODAS": "Odaş Elektrik Üretim A.Ş.",
    "PGSUS": "Pegasus Hava Taşımacılığı A.Ş.", 
    "TAVHL": "TAV Havalimanları Holding A.Ş.", 
    "ARCLK": "Arçelik A.Ş.",
    "VESTL": "Vestel Elektronik Sanayi A.Ş.", 
    "VESBE": "Vestel Beyaz Eşya Sanayi A.Ş.", 
    "PETKM": "Petkim Petrokimya Holding A.Ş.",
    "KRDMD": "Kardemir Karabük Demir Çelik", 
    "ALARK": "Alarko Holding A.Ş.", 
    "TKFEN": "Tekfen Holding A.Ş.",
    "EKGYO": "Emlak Konut GYO A.Ş.", 
    "HALKB": "Türkiye Halk Bankası A.Ş.", 
    "VAKBN": "Türkiye Vakıflar Bankası T.A.O.",
    "AEFES": "Anadolu Efes Biracılık ve Malt", 
    "CCOLA": "Coca-Cola İçecek A.Ş.", 
    "ULKER": "Ülker Bisküvi Sanayi A.Ş.",
    "ANSGR": "Anadolu Anonim Türk Sigorta", 
    "TURSG": "Türkiye Sigorta A.Ş.", 
    "ALTNY": "Altınay Savunma Teknolojileri",
    "OTKAR": "Otokar Otomotiv ve Savunma", 
    "DOAS": "Doğuş Otomotiv Servis ve Ticaret", 
    "PATEK": "Pasifik Teknoloji A.Ş.",
    "ARDYZ": "ARD Grup Bilişim Teknolojileri", 
    "BRSAN": "Borusan Birleşik Boru Fabrikaları", 
    "SDTTR": "SDT Uzay ve Savunma Teknolojileri"
};

// Sektörel Büyüme Şablon Verisi (Gelecekte dinamik veri bağlamaya hazır)
const SECTOR_GROWTH_TEMPLATES = [
    { name: "Havacılık & Ulaştırma", annualGrowth: 34.8, marketCap: "450 Ml TL", momentum: "Güçlü Yükseliş", leader: "THYAO", score: 92 },
    { name: "Savunma Sanayii", annualGrowth: 42.1, marketCap: "380 Ml TL", momentum: "Yüksek İvme", leader: "ASELS", score: 95 },
    { name: "Bankacılık & Finans", annualGrowth: 28.5, marketCap: "620 Ml TL", momentum: "Dengeli", leader: "GARAN", score: 86 },
    { name: "Enerji & Yenilenebilir", annualGrowth: 39.4, marketCap: "290 Ml TL", momentum: "Yükseliş", leader: "ASTOR", score: 89 },
    { name: "Teknoloji & Yazılım", annualGrowth: 48.2, marketCap: "180 Ml TL", momentum: "Çok Yüksek", leader: "MIATK", score: 94 },
    { name: "Holdingler & Yatırım", annualGrowth: 22.6, marketCap: "550 Ml TL", momentum: "Stabil", leader: "KCHOL", score: 82 }
];

export default function AssetsPage() {
    const [assetType, setAssetType] = useState<"hisse" | "fon">("hisse");
    const [selectedSector, setSelectedSector] = useState(Object.keys(STOCK_SECTORS)[0]);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [sortBy, setSortBy] = useState<"change-desc" | "change-asc" | "price-desc" | "price-asc">("change-desc");
    const [data, setData] = useState<AssetData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [allFunds, setAllFunds] = useState<{code: string, title: string}[]>([]);
    const [addedSymbols, setAddedSymbols] = useState<Record<string, boolean>>({});

    // KARŞILAŞTIRMA WIDGET'I STATE'LERİ
    const [compAsset1, setCompAsset1] = useState<string>("THYAO");
    const [compAsset2, setCompAsset2] = useState<string>("PGSUS");
    const [compTimeframe, setCompTimeframe] = useState<"1A" | "6A" | "1Y">("1A");

    const sectors = assetType === "hisse" ? Object.keys(STOCK_SECTORS) : Object.keys(FUND_SECTORS);

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

            matchedStocks.forEach(s => matches.push({ symbol: s, name: STOCK_NAMES[s] || "BIST Hisse Senedi", type: 'hisse' }));

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
            } catch (error) { 
                console.error("Fetch error:", error); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchData();
    }, [selectedSector, assetType]);

    // İşlenmiş ve Sıralanmış Varlık Verisi
    const processedData = useMemo(() => {
        let list = data.filter(item => 
            (item.symbol || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.name || "").toLowerCase().includes(searchTerm.toLowerCase())
        );

        return list.sort((a, b) => {
            if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
            if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
            if (sortBy === 'change-desc') return (b.changePercent || 0) - (a.changePercent || 0);
            if (sortBy === 'change-asc') return (a.changePercent || 0) - (b.changePercent || 0);
            return 0;
        });
    }, [data, searchTerm, sortBy]);

    // Karşılaştırılacak Varlıkların Mock/Canlı Verisi
    const compData1 = useMemo(() => {
        const found = data.find(d => d.symbol === compAsset1);
        return {
            symbol: compAsset1,
            name: STOCK_NAMES[compAsset1] || compAsset1,
            price: found?.price || 315.25,
            changePercent: found?.changePercent || 2.45,
            pe: 6.8, // F/K Oranı
            pb: 1.45, // PD/DD Oranı
            annualYield: 44.5,
            volume: "4.8 Mr TL"
        };
    }, [compAsset1, data]);

    const compData2 = useMemo(() => {
        const found = data.find(d => d.symbol === compAsset2);
        return {
            symbol: compAsset2,
            name: STOCK_NAMES[compAsset2] || compAsset2,
            price: found?.price || 234.10,
            changePercent: found?.changePercent || -1.12,
            pe: 8.2,
            pb: 2.10,
            annualYield: 38.2,
            volume: "2.1 Mr TL"
        };
    }, [compAsset2, data]);

    const availableSymbols = useMemo(() => {
        return Object.keys(STOCK_NAMES);
    }, []);

    const handleQuickAdd = (symbol: string) => {
        setAddedSymbols(prev => ({ ...prev, [symbol]: true }));
        setTimeout(() => {
            setAddedSymbols(prev => ({ ...prev, [symbol]: false }));
        }, 2000);
    };

    return (
        <div className="p-4 md:p-8 min-h-screen bg-[#F8FAFC] space-y-10">
            {/* HERO BAŞLIK & VARTALIK ARAŞTIRMA TERMİNALİ */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white border border-slate-200/80 rounded-[36px] p-6 md:p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-gradient-to-br from-[#00008B]/5 to-sky-400/10 rounded-full blur-[90px] -z-0 pointer-events-none" />
                
                <div className="relative z-10 space-y-3 max-w-2xl">
                    <div className="flex items-center gap-2 px-3.5 py-1 bg-[#00008B]/5 border border-[#00008B]/10 rounded-full w-fit">
                        <Activity className="w-3.5 h-3.5 text-[#00008B] animate-pulse" />
                        <span className="text-[10px] font-black text-[#00008B] uppercase tracking-widest">FinAi Varlık & Piyasa Araştırma Terminali</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                        Varlık <span className="text-[#00008B]">Merkezi</span>
                    </h1>
                    <p className="text-xs md:text-sm font-semibold text-slate-500 leading-relaxed">
                        Tüm BIST hisselerini ve TEFAS fonlarını inceleyin, varlıkları baş başa karşılaştırın ve sektörel büyüme ivmelerini keşfedin.
                    </p>
                </div>

                {/* HIZLI GEÇİŞ / SEÇENEK İSTATİSTİK ROZETLERİ */}
                <div className="relative z-10 flex flex-wrap items-center gap-3">
                    <div className="bg-blue-50/80 border border-blue-200/60 rounded-2xl px-5 py-3.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Takip Edilen Varlık</span>
                        <span className="text-xl font-black text-[#00008B] tracking-tight">50+ BIST & TEFAS</span>
                    </div>
                    <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-2xl px-5 py-3.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Sektörel Kapsam</span>
                        <span className="text-xl font-black text-emerald-700 tracking-tight">8 Ana Sektör</span>
                    </div>
                </div>
            </div>

            {/* WIDGET 1: VARLIK KARŞILAŞTIRMA TERMİNALİ (ASSET COMPARISON WIDGET) */}
            <div className="bg-white border border-slate-200/90 rounded-[36px] p-6 md:p-8 shadow-xl shadow-slate-200/40 space-y-6 relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5 gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-[#00008B] flex items-center justify-center text-white shadow-lg shadow-[#00008B]/20">
                            <Scale className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Varlık Karşılaştırma Terminali</h2>
                            <p className="text-xs font-bold text-slate-400 mt-0.5">İki Varlığın Fiyat, Çarpan ve Getiri Göstergelerini Yan Yana Kıyaslayın</p>
                        </div>
                    </div>

                    {/* ZAMAN PERİYODU PİLLERİ */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/70 self-start md:self-auto">
                        {(['1A', '6A', '1Y'] as const).map((tf) => (
                            <button
                                key={tf}
                                onClick={() => setCompTimeframe(tf)}
                                className={cn(
                                    "px-4 py-1.5 text-xs font-black rounded-xl transition-all uppercase tracking-wider",
                                    compTimeframe === tf
                                        ? "bg-[#00008B] text-white shadow-md shadow-[#00008B]/20 scale-105"
                                        : "text-slate-500 hover:text-[#00008B]"
                                )}
                            >
                                {tf === '1A' ? '1 Aylık' : tf === '6A' ? '6 Aylık' : '1 Yıllık'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* İKİ VARLIK SEÇİM MENÜLERİ VE BAŞ BAŞA KARŞILAŞTIRMA KARTLARI */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* 1. VARLIK KARTI */}
                    <div className="lg:col-span-5 bg-slate-50 border border-slate-200/80 rounded-3xl p-6 space-y-5 hover:border-[#00008B]/30 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-[#00008B] text-white flex items-center justify-center font-black text-sm shadow-md">
                                    {compAsset1}
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">1. Varlık</span>
                                    <h3 className="text-base font-black text-slate-900">{compData1.name}</h3>
                                </div>
                            </div>

                            <select
                                value={compAsset1}
                                onChange={(e) => setCompAsset1(e.target.value)}
                                className="bg-white border border-slate-200 text-xs font-black text-[#00008B] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00008B]"
                            >
                                {availableSymbols.map(sym => (
                                    <option key={sym} value={sym}>{sym}</option>
                                ))}
                            </select>
                        </div>

                        {/* GÖSTERGELER */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="bg-white p-3 rounded-2xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Canlı Fiyat</span>
                                <span className="text-lg font-black text-slate-900">{compData1.price} ₺</span>
                            </div>
                            <div className="bg-white p-3 rounded-2xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Günlük Değişim</span>
                                <span className={cn("text-lg font-black", compData1.changePercent >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                    %{compData1.changePercent}
                                </span>
                            </div>
                            <div className="bg-white p-3 rounded-2xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">F/K Oranı</span>
                                <span className="text-sm font-black text-slate-800">{compData1.pe}</span>
                            </div>
                            <div className="bg-white p-3 rounded-2xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">1Y Getiri</span>
                                <span className="text-sm font-black text-emerald-600">+{compData1.annualYield}%</span>
                            </div>
                        </div>
                    </div>

                    {/* ORTA KARŞILAŞTIRMA İKONU (VS) */}
                    <div className="lg:col-span-2 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-[#00008B] text-white font-black text-base flex items-center justify-center shadow-xl shadow-[#00008B]/30 ring-8 ring-blue-50">
                            VS
                        </div>
                    </div>

                    {/* 2. VARLIK KARTI */}
                    <div className="lg:col-span-5 bg-slate-50 border border-slate-200/80 rounded-3xl p-6 space-y-5 hover:border-sky-400/40 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black text-sm shadow-md">
                                    {compAsset2}
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">2. Varlık</span>
                                    <h3 className="text-base font-black text-slate-900">{compData2.name}</h3>
                                </div>
                            </div>

                            <select
                                value={compAsset2}
                                onChange={(e) => setCompAsset2(e.target.value)}
                                className="bg-white border border-slate-200 text-xs font-black text-sky-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                            >
                                {availableSymbols.map(sym => (
                                    <option key={sym} value={sym}>{sym}</option>
                                ))}
                            </select>
                        </div>

                        {/* GÖSTERGELER */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="bg-white p-3 rounded-2xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Canlı Fiyat</span>
                                <span className="text-lg font-black text-slate-900">{compData2.price} ₺</span>
                            </div>
                            <div className="bg-white p-3 rounded-2xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Günlük Değişim</span>
                                <span className={cn("text-lg font-black", compData2.changePercent >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                    %{compData2.changePercent}
                                </span>
                            </div>
                            <div className="bg-white p-3 rounded-2xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">F/K Oranı</span>
                                <span className="text-sm font-black text-slate-800">{compData2.pe}</span>
                            </div>
                            <div className="bg-white p-3 rounded-2xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">1Y Getiri</span>
                                <span className="text-sm font-black text-emerald-600">+{compData2.annualYield}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* YAPAY ZEKA KARŞILAŞTIRMA ÖNGÖRÜ KUTUSU */}
                <div className="bg-[#00008B] border border-[#00008B]/20 rounded-2xl p-4 text-white shadow-md">
                    <p className="text-xs font-medium text-slate-100 leading-relaxed">
                        <span className="font-black text-sky-300 uppercase tracking-wider mr-2">FinAi Karşılaştırma Analizi:</span>
                        {compAsset1} ve {compAsset2} varlıkları kıyaslandığında, {compAsset1} daha düşük F/K çarpanı ({compData1.pe}) ve %{compData1.annualYield} yıllık getirisiyle öne çıkarken; {compAsset2} dengeli volatilite sergilemektedir. Portföy hedeflerinize göre ağırlıklandırmayı değerlendirebilirsiniz.
                    </p>
                </div>
            </div>

            {/* WIDGET 2: SEKTÖREL BÜYÜME & TREND TERMİNALİ (SECTORAL GROWTH WIDGET) */}
            <div className="bg-white border border-slate-200/90 rounded-[36px] p-6 md:p-8 shadow-xl shadow-slate-200/40 space-y-6 relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5 gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Sektörel Büyüme & Trend Terminalı</h2>
                            <p className="text-xs font-bold text-slate-400 mt-0.5">Sektörlerin Yıllık Büyüme Oranları, Piyasa Değerleri ve İvme Puanları</p>
                        </div>
                    </div>

                    <span className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black rounded-full uppercase tracking-wider self-start md:self-auto">
                        Sektörel Trend İvmesi
                    </span>
                </div>

                {/* SEKTÖREL BÜYÜME ŞABLON KARTLARI GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {SECTOR_GROWTH_TEMPLATES.map((sector, idx) => (
                        <div 
                            key={idx} 
                            className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 space-y-4 hover:border-[#00008B]/30 hover:shadow-xl transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-slate-900">{sector.name}</h3>
                                <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-blue-100 text-[#00008B]">
                                    Skor: {sector.score}/100
                                </span>
                            </div>

                            {/* BÜYÜME İLERLEME ÇUBUĞU */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-slate-400">Yıllık Büyüme</span>
                                    <span className="text-emerald-600 font-black">+{sector.annualGrowth}%</span>
                                </div>
                                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-[#00008B] to-emerald-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.min(sector.annualGrowth * 1.8, 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Piyasa Değeri</span>
                                    <span className="font-black text-slate-800">{sector.marketCap}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Sektör Lideri</span>
                                    <span className="font-black text-[#00008B]">{sector.leader}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* WIDGET 3: KAPSAMLI HİSSE & VARLIK ARAŞTIRMA TERMINALİ (STOCK RESEARCH & DISCOVERY) */}
            <div className="bg-white border border-slate-200/90 rounded-[36px] p-6 md:p-8 shadow-2xl shadow-slate-200/50 space-y-8 relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#00008B] flex items-center justify-center text-white shadow-lg shadow-[#00008B]/20">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Hisse & Varlık Araştırma Terminalı</h2>
                            <p className="text-xs font-bold text-slate-400 mt-0.5">Tüm BIST Şirketlerini ve TEFAS Fonlarını Detaylıca İnceleyin</p>
                        </div>
                    </div>

                    {/* HİSSE VS FON ANAHTARI */}
                    <div className="flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80 self-start md:self-auto">
                        {[
                            { id: "hisse", label: "Hisse Senetleri", icon: TrendingUp }, 
                            { id: "fon", label: "Yatırım Fonları", icon: Layers }
                        ].map((t) => (
                            <button 
                                key={t.id} 
                                onClick={() => setAssetType(t.id as any)} 
                                className={cn(
                                    "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all", 
                                    assetType === t.id 
                                        ? "bg-[#00008B] text-white shadow-md shadow-[#00008B]/20 scale-105" 
                                        : "text-slate-500 hover:text-[#00008B]"
                                )}
                            >
                                <t.icon className="w-4 h-4" /> {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* AKILLI ARAMA, SEKTÖR PİLLERİ VE GÖRÜNÜM MODLARI */}
                <div className="space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#00008B] transition-colors" />
                            <input 
                                type="text"
                                placeholder="Hisse sembolü veya şirket adı ile arayın..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#00008B]/10 focus:border-[#00008B] transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-3 rounded-2xl">
                                <ArrowUpDown className="w-4 h-4 text-[#00008B]" />
                                <select 
                                    value={sortBy} 
                                    onChange={(e: any) => setSortBy(e.target.value)}
                                    className="bg-transparent text-xs font-black text-slate-700 focus:outline-none cursor-pointer"
                                >
                                    <option value="change-desc">En Çok Yükselenler</option>
                                    <option value="change-asc">En Çok Düşenler</option>
                                    <option value="price-desc">Fiyat: Yüksekten Düşüğe</option>
                                    <option value="price-asc">Fiyat: Düşükten Yüksek</option>
                                </select>
                            </div>

                            <div className="flex items-center p-1 bg-slate-200/70 rounded-2xl">
                                <button 
                                    onClick={() => setViewMode("grid")}
                                    className={cn("p-2 rounded-xl transition-all", viewMode === "grid" ? "bg-white text-[#00008B] shadow-md" : "text-slate-500")}
                                >
                                    <Grid className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setViewMode("list")}
                                    className={cn("p-2 rounded-xl transition-all", viewMode === "list" ? "bg-white text-[#00008B] shadow-md" : "text-slate-500")}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* SEKTÖR SEÇİM PİLLERİ */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {sectors.map((sector) => (
                            <button 
                                key={sector} 
                                onClick={() => setSelectedSector(sector)} 
                                className={cn(
                                    "px-5 py-3 rounded-2xl text-[11px] font-black whitespace-nowrap transition-all border shrink-0 uppercase tracking-wider", 
                                    selectedSector === sector 
                                        ? "bg-[#00008B] border-[#00008B] text-white shadow-xl shadow-[#00008B]/20 scale-105" 
                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:border-[#00008B]/40"
                                )}
                            >
                                {sector}
                            </button>
                        ))}
                    </div>
                </div>

                {/* KART GRİD İÇERİĞİ */}
                <AnimatePresence mode="wait">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 space-y-4">
                            <div className="w-16 h-16 border-4 border-slate-100 border-t-[#00008B] rounded-full animate-spin" />
                            <p className="text-xs font-black text-[#00008B] uppercase tracking-widest">Varlıklar Yükleniyor...</p>
                        </div>
                    ) : processedData.length === 0 ? (
                        <div className="text-center py-20 space-y-3">
                            <Info className="w-12 h-12 text-slate-300 mx-auto" />
                            <h3 className="text-lg font-black text-slate-700">Aramanıza Uygun Varlık Bulunamadı</h3>
                        </div>
                    ) : viewMode === "grid" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {processedData.map((item) => {
                                const fullName = STOCK_NAMES[item.symbol] || item.name || item.symbol;
                                const isPositive = item.changePercent >= 0;

                                return (
                                    <div 
                                        key={item.symbol} 
                                        className="group bg-white border border-slate-200/90 hover:border-[#00008B]/30 rounded-3xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
                                    >
                                        <div className="space-y-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-md group-hover:bg-[#00008B] transition-colors">
                                                        {item.symbol}
                                                    </div>
                                                    <div className="max-w-[130px]">
                                                        <h3 className="text-sm font-black text-slate-900 truncate group-hover:text-[#00008B] transition-colors">
                                                            {item.symbol}
                                                        </h3>
                                                        <p className="text-[10px] font-bold text-slate-400 truncate" title={fullName}>
                                                            {fullName}
                                                        </p>
                                                    </div>
                                                </div>

                                                <span className={cn(
                                                    "px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1 shrink-0",
                                                    isPositive 
                                                        ? "bg-emerald-50 border-emerald-200/60 text-emerald-600" 
                                                        : "bg-rose-50 border-rose-200/60 text-rose-600"
                                                )}>
                                                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                    %{Math.abs(item.changePercent).toFixed(2)}
                                                </span>
                                            </div>

                                            {/* SPARKLINE CHART */}
                                            <div className="h-16 w-full pt-2">
                                                {item.history && item.history.length > 0 && (
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={item.history}>
                                                            <defs>
                                                                <linearGradient id={`grad-${item.symbol}`} x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="0%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.3} />
                                                                    <stop offset="100%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.0} />
                                                                </linearGradient>
                                                            </defs>
                                                            <YAxis hide domain={['auto', 'auto']} />
                                                            <Area 
                                                                type="monotone" 
                                                                dataKey="price" 
                                                                stroke={isPositive ? "#10b981" : "#ef4444"} 
                                                                strokeWidth={2.5} 
                                                                fill={`url(#grad-${item.symbol})`} 
                                                            />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                                            <div>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Canlı Fiyat</span>
                                                <span className="text-lg font-black text-slate-900">
                                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(item.price || 0)}
                                                </span>
                                            </div>

                                            <button 
                                                onClick={() => handleQuickAdd(item.symbol)}
                                                className={cn(
                                                    "p-2.5 rounded-xl border transition-all flex items-center justify-center",
                                                    addedSymbols[item.symbol] 
                                                        ? "bg-emerald-500 border-emerald-500 text-white shadow-md" 
                                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-[#00008B] hover:border-[#00008B] hover:text-white"
                                                )}
                                                title="Portföyüme Ekle"
                                            >
                                                {addedSymbols[item.symbol] ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* TABLO (LISTE) GÖRÜNÜMÜ */
                        <div className="overflow-x-auto rounded-3xl border border-slate-200 shadow-lg">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <th className="py-4 px-6">Varlık / Sembol</th>
                                        <th className="py-4 px-6">Şirket / Fon Adı</th>
                                        <th className="py-4 px-6">Son Fiyat</th>
                                        <th className="py-4 px-6 text-right">24S Değişim</th>
                                        <th className="py-4 px-6 text-center">Trend</th>
                                        <th className="py-4 px-6 text-right">Eylem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm font-bold">
                                    {processedData.map((item) => {
                                        const fullName = STOCK_NAMES[item.symbol] || item.name || item.symbol;
                                        const isPositive = item.changePercent >= 0;

                                        return (
                                            <tr key={item.symbol} className="hover:bg-blue-50/40 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                                                            {item.symbol}
                                                        </div>
                                                        <span className="font-black text-slate-900">{item.symbol}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-slate-600 font-medium text-xs max-w-xs truncate">
                                                    {fullName}
                                                </td>
                                                <td className="py-4 px-6 font-black text-slate-900">
                                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(item.price || 0)}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <span className={cn(
                                                        "px-2.5 py-1 rounded-xl text-xs font-black inline-flex items-center gap-1",
                                                        isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                                    )}>
                                                        {isPositive ? `+` : ``}%{item.changePercent.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 w-36">
                                                    <div className="h-8 w-full">
                                                        {item.history && item.history.length > 0 && (
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <AreaChart data={item.history}>
                                                                    <YAxis hide domain={['auto', 'auto']} />
                                                                    <Area 
                                                                        type="monotone" 
                                                                        dataKey="price" 
                                                                        stroke={isPositive ? "#10b981" : "#ef4444"} 
                                                                        strokeWidth={2} 
                                                                        fillOpacity={0.1}
                                                                        fill={isPositive ? "#10b981" : "#ef4444"} 
                                                                    />
                                                                </AreaChart>
                                                            </ResponsiveContainer>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <button 
                                                        onClick={() => handleQuickAdd(item.symbol)}
                                                        className={cn(
                                                            "p-2 rounded-xl text-xs font-bold transition-all border",
                                                            addedSymbols[item.symbol]
                                                                ? "bg-emerald-500 border-emerald-500 text-white"
                                                                : "bg-slate-50 border-slate-200 text-[#00008B] hover:bg-[#00008B] hover:text-white"
                                                        )}
                                                    >
                                                        {addedSymbols[item.symbol] ? "Eklendi" : "Portföye Ekle"}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
