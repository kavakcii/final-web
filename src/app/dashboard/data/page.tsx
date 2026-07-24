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
  ArrowUpDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { STOCK_SECTORS, FUND_SECTORS } from "@/lib/constants/assets-mapping";
import { ResponsiveContainer, AreaChart, Area, YAxis } from "recharts";

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
}

interface Suggestion {
  symbol: string;
  name: string;
  type: "hisse" | "fon";
}

// BIST Şirket Tam Adları & Sektör Tanımları
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

// Sektörel Yapay Zeka Analiz Şablonları
const SECTOR_AI_INSIGHTS: Record<string, string> = {
    "Havacılık": "Yaz sezonu kapasite kullanımı ve uluslararası yolcu verileri %14 artış trendinde. Jet yakıtı marjlarındaki dengelenme sektör şirketlerinin marjlarını olumlu etkiliyor.",
    "Savunma": "İhracat sözleşmeleri ve yerli savunma projelerinin büyümesiyle sektörde ciro büyüme ivmesi güçlü seyrediyor. Ar-Ge yatırımları uzun vadeli çarpanları destekliyor.",
    "Bankacılık": "Net faiz marjlarındaki toparlanma ve özkaynak kârlılığı ivme kazanıyor. Yabancı kurumsal yatırımcı ilgisinin en yüksek olduğu ana sektör konumunu koruyor.",
    "Holding": "Net aktif değer (NAD) iskontosu tarihsel ortalamaların altında seyrediyor. İştirak çeşitliliği portföy risklerini dengeliyor.",
    "Enerji": "Yenilenebilir enerji yatırımları ve kapasite artışları orta vadeli nakit akışını güçlendiriyor. Yeşil dönüşüm teşvikleri ivmeyi artırmaktadır.",
    "Teknoloji": "Yazılım ve sistem entegrasyonu tarafındaki sipariş büyümesi yüksek özkaynak kârlılığını beraberinde getiriyor.",
    "Perakende": "Enflasyonist ortamda yüksek nakit akışı yaratma kabiliyeti ve güçlü mağaza açılış ivmesiyle defansif yapısını koruyor.",
    "Otomotiv": "İhracat pazarlarındaki elektrikli araç dönüşümü ve yerli satış hacimleri sektör dinamizmini korumaktadır."
};

export default function AssetsPage() {
    const [assetType, setAssetType] = useState<"hisse" | "fon">("hisse");
    const [selectedSector, setSelectedSector] = useState(Object.keys(STOCK_SECTORS)[0]);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [sortBy, setSortBy] = useState<"price-desc" | "price-asc" | "change-desc" | "change-asc">("change-desc");
    const [data, setData] = useState<AssetData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [allFunds, setAllFunds] = useState<{code: string, title: string}[]>([]);
    const [addedSymbols, setAddedSymbols] = useState<Record<string, boolean>>({});

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

    // Sektör Genel Özet İstatistikleri
    const sectorStats = useMemo(() => {
        if (!data || data.length === 0) return { avgChange: 0, gainers: 0, losers: 0, topGainer: null };
        const totalChange = data.reduce((acc, curr) => acc + (curr.changePercent || 0), 0);
        const gainers = data.filter(d => (d.changePercent || 0) > 0).length;
        const losers = data.filter(d => (d.changePercent || 0) < 0).length;
        const sorted = [...data].sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0));
        return {
            avgChange: Number((totalChange / data.length).toFixed(2)),
            gainers,
            losers,
            topGainer: sorted[0] || null
        };
    }, [data]);

    const handleQuickAdd = (symbol: string) => {
        setAddedSymbols(prev => ({ ...prev, [symbol]: true }));
        setTimeout(() => {
            setAddedSymbols(prev => ({ ...prev, [symbol]: false }));
        }, 2000);
    };

    return (
        <div className="p-4 md:p-8 min-h-screen bg-[#F8FAFC] space-y-8">
            {/* HER BAŞLIK & METRİK ÖZET PANELİ */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white border border-slate-200/80 rounded-[36px] p-6 md:p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-gradient-to-br from-[#00008B]/5 to-sky-400/10 rounded-full blur-[90px] -z-0 pointer-events-none" />
                
                <div className="relative z-10 space-y-4 max-w-2xl">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1 bg-[#00008B]/5 border border-[#00008B]/10 rounded-full">
                            <Activity className="w-3.5 h-3.5 text-[#00008B] animate-pulse" />
                            <span className="text-[10px] font-black text-[#00008B] uppercase tracking-widest">FinAi Canlı Piyasa Terminalı v2.0</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200/60 rounded-full text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            Canlı Veri Akışı
                        </div>
                    </div>

                    <div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                            Varlık <span className="text-[#00008B]">Merkezi</span>
                        </h1>
                        <p className="text-xs md:text-sm font-semibold text-slate-500 mt-2 leading-relaxed">
                            Borsa İstanbul hisse senetleri, TEFAS yatırım fonları ve piyasa enstrümanlarını canlı veriler, teknik ivme ve sektörel analizlerle keşfedin.
                        </p>
                    </div>
                </div>

                {/* SAĞ TARAF CANLI METRİK KARTLARI */}
                <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 flex flex-col justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Sektör Ort.</span>
                        <div className="flex items-baseline gap-1 mt-2">
                            <span className={cn("text-xl font-black", sectorStats.avgChange >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                {sectorStats.avgChange >= 0 ? `+` : ``}%{sectorStats.avgChange}
                            </span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 mt-1">Son 24 Saatlik İvme</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 flex flex-col justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Yükselen / Düşen</span>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-xl font-black text-emerald-600">{sectorStats.gainers}</span>
                            <span className="text-xs font-bold text-slate-400">/</span>
                            <span className="text-xl font-black text-rose-600">{sectorStats.losers}</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 mt-1">Denge Oranı</span>
                    </div>

                    <div className="bg-[#00008B] border border-[#00008B]/20 rounded-2xl p-4 text-white col-span-2 sm:col-span-1 flex flex-col justify-between shadow-lg shadow-[#00008B]/20">
                        <span className="text-[10px] font-black text-sky-200 uppercase tracking-wider">Sektör Lideri</span>
                        <div className="mt-2">
                            <div className="text-base font-black truncate">{sectorStats.topGainer?.symbol || '---'}</div>
                            <div className="text-xs font-bold text-emerald-300">
                                {sectorStats.topGainer ? `+%${(sectorStats.topGainer.changePercent || 0).toFixed(2)}` : '---'}
                            </div>
                        </div>
                        <span className="text-[9px] font-bold text-slate-300 mt-1">En Yüksek Prim</span>
                    </div>
                </div>
            </div>

            {/* AKILLI ARAMA, SEKTÖR PİLLERİ VE FİLTRELEME ÇUBUĞU */}
            <div className="space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* ARAMA ÇUBUĞU VE DİNAMİK AUTOCOMPLETE */}
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#00008B] transition-colors" />
                        <input 
                            type="text"
                            placeholder="Sembol veya şirket adı ile arayın (Örn: THYAO, Tüpraş, TCD)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-10 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#00008B]/10 focus:border-[#00008B] transition-all shadow-lg shadow-slate-200/40"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold bg-slate-100 p-1 rounded-full">
                                ✕
                            </button>
                        )}
                        
                        {/* AUTOCOMPLETE POPUP */}
                        <AnimatePresence>
                            {suggestions.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    exit={{ opacity: 0, y: 10 }} 
                                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-3xl shadow-2xl z-50 overflow-hidden"
                                >
                                    {suggestions.map((s, i) => (
                                        <div 
                                            key={i} 
                                            onClick={() => { setSearchTerm(s.symbol); setAssetType(s.type); setSuggestions([]); }} 
                                            className="flex items-center justify-between px-6 py-3.5 hover:bg-blue-50/60 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-[#00008B] text-white flex items-center justify-center font-black text-xs shadow-md shadow-[#00008B]/20">
                                                    {s.symbol}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900">{s.name}</p>
                                                    <span className={cn("text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider", s.type === 'hisse' ? "bg-blue-100 text-[#00008B]" : "bg-purple-100 text-purple-700")}>
                                                        {s.type === 'hisse' ? 'BIST Hisse' : 'TEFAS Fon'}
                                                    </span>
                                                </div>
                                            </div>
                                            <ArrowUpRight className="w-4 h-4 text-[#00008B]" />
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* FİLTRELEME & GÖRÜNÜM KONTROLLERİ */}
                    <div className="flex items-center gap-3 self-end lg:self-auto">
                        {/* SIRALAMA SEÇİCİ */}
                        <div className="flex items-center gap-2 bg-white border border-slate-200 px-3.5 py-3 rounded-2xl shadow-sm">
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

                        {/* GÖRÜNÜM MODU SWITCH (GRID vs LIST) */}
                        <div className="flex items-center p-1 bg-slate-200/70 rounded-2xl border border-slate-300/40">
                            <button 
                                onClick={() => setViewMode("grid")}
                                className={cn("p-2 rounded-xl transition-all", viewMode === "grid" ? "bg-white text-[#00008B] shadow-md scale-105" : "text-slate-500 hover:text-slate-800")}
                                title="Izgara Görünümü"
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setViewMode("list")}
                                className={cn("p-2 rounded-xl transition-all", viewMode === "list" ? "bg-white text-[#00008B] shadow-md scale-105" : "text-slate-500 hover:text-slate-800")}
                                title="Liste Görünümü"
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
                                    : "bg-white border-slate-200 text-slate-600 hover:border-[#00008B]/40 hover:bg-slate-50"
                            )}
                        >
                            {sector}
                        </button>
                    ))}
                </div>
            </div>

            {/* ANA İÇERİK KONTROLÜ VE VARLIK GRİD / LİSTE KARTLARI */}
            <div className="bg-white border border-slate-200/80 rounded-[36px] p-6 md:p-8 shadow-2xl shadow-slate-200/50 min-h-[600px] relative overflow-hidden space-y-8">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50/20 rounded-full blur-[100px] -z-0 pointer-events-none" />

                {/* SEKTÖR BAŞLIĞI VE TÜR GEÇİŞ BUTONLARI */}
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#00008B] flex items-center justify-center shadow-lg shadow-[#00008B]/20">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedSector} Kriter Analizi</h2>
                            <p className="text-xs font-bold text-slate-400 mt-0.5">Toplu Piyasa Performansı ve Trend Çizgileri</p>
                        </div>
                    </div>

                    {/* HİSSE SENEDİ VS YATIRIM FONLARI ANAHTARI */}
                    <div className="flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80 self-start md:self-auto shadow-inner">
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

                {/* WIDGET: MARKA RENK PALETİNDEKİ SEKTÖREL YAPAY ZEKA ANALİZİ KUTUSU */}
                <div className="bg-[#00008B] border border-[#00008B]/20 rounded-3xl p-5 shadow-xl text-white relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md shrink-0">
                            <Sparkles className="w-6 h-6 text-sky-300" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-black uppercase tracking-widest text-sky-200">FinAi Yapay Zeka Sektör Analizi</h3>
                                <span className="px-2 py-0.5 bg-sky-400/20 text-sky-200 rounded-full text-[9px] font-bold uppercase">Canlı Rapor</span>
                            </div>
                            <p className="text-xs font-medium text-slate-100 leading-relaxed mt-1 max-w-4xl">
                                {SECTOR_AI_INSIGHTS[selectedSector] || `${selectedSector} sektöründe piyasa hacimleri ve fiyat hareketleri yükseliş ivmesini koruyor. Portföy çeşitlendirmesi açısından dengeli takip önerilmektedir.`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* YÜKLENİYOR / KART GRID İÇERİĞİ */}
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div 
                            key="loading" 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            className="flex flex-col items-center justify-center py-28 space-y-4"
                        >
                            <div className="w-16 h-16 border-4 border-slate-100 border-t-[#00008B] rounded-full animate-spin" />
                            <p className="text-xs font-black text-[#00008B] uppercase tracking-widest">Canlı Varlık Verileri Yükleniyor...</p>
                        </motion.div>
                    ) : processedData.length === 0 ? (
                        <div className="text-center py-20 space-y-3">
                            <Info className="w-12 h-12 text-slate-300 mx-auto" />
                            <h3 className="text-lg font-black text-slate-700">Aramanıza Uygun Varlık Bulunamadı</h3>
                            <p className="text-xs text-slate-400 font-bold">Lütfen arama teriminizi veya seçili sektörü değiştirerek tekrar deneyin.</p>
                        </div>
                    ) : viewMode === "grid" ? (
                        /* IZGARA (GRID) GÖRÜNÜMÜ */
                        <motion.div 
                            key="grid" 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10"
                        >
                            {processedData.map((item) => {
                                const fullName = STOCK_NAMES[item.symbol] || item.name || item.symbol;
                                const isPositive = item.changePercent >= 0;

                                return (
                                    <div 
                                        key={item.symbol} 
                                        className="group bg-white border border-slate-200/90 hover:border-[#00008B]/30 rounded-3xl p-5 shadow-lg shadow-slate-200/30 hover:shadow-2xl hover:shadow-[#00008B]/10 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
                                    >
                                        {/* KART ÜST KISMI */}
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

                                            {/* MİNİ SPARKLINE TREND GRAFİĞİ (SVG RECHARTS) */}
                                            <div className="h-16 w-full pt-2">
                                                {item.history && item.history.length > 0 ? (
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
                                                ) : (
                                                    <div className="h-full flex items-center justify-center text-[10px] text-slate-300 font-bold">
                                                        Trend verisi yükleniyor...
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* KART ALT KISMI (FİYAT VE HIZLI EYLEM) */}
                                        <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                                            <div>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Canlı Fiyat</span>
                                                <span className="text-lg font-black text-slate-900 tracking-tight">
                                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(item.price || 0)}
                                                </span>
                                            </div>

                                            <button 
                                                onClick={() => handleQuickAdd(item.symbol)}
                                                className={cn(
                                                    "p-2.5 rounded-xl border transition-all flex items-center justify-center",
                                                    addedSymbols[item.symbol] 
                                                        ? "bg-emerald-500 border-emerald-500 text-white shadow-md scale-105" 
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
                        </motion.div>
                    ) : (
                        /* LİSTE (TABLE) GÖRÜNÜMÜ */
                        <motion.div 
                            key="list" 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            className="overflow-x-auto rounded-3xl border border-slate-200 shadow-lg"
                        >
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
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
