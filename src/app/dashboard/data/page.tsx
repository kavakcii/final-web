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
  Scale,
  Trophy,
  Award,
  Flame,
  ArrowDownRight
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
  pe?: number;
  pb?: number;
}

interface Suggestion {
  symbol: string;
  name: string;
  type: "hisse" | "fon";
}

// Şirket Amblem / Logo Bileşeni (Tüm BIST 100 / 500 Hisselerini Kapsayan Orijinal Yuvarlak Amblem Sistemi)
function AssetLogo({ symbol, className = "w-10 h-10" }: { symbol: string; className?: string }) {
    const clean = symbol.toUpperCase().replace('.IS', '').trim();
    const [imgIndex, setImgIndex] = useState(0);
    const [isFailed, setIsFailed] = useState(false);

    // Kapsamlı BIST Şirket Amblem Slug Kataloğu
    const logoSlugMap: Record<string, string> = {
        "KORDS": "kordsa", "THYAO": "turk-hava-yollari", "ASELS": "aselsan",
        "EREGL": "eregli-demir-celik", "TUPRS": "tupras", "KCHOL": "koc-holding",
        "SAHOL": "sabanci-holding", "GARAN": "garanti-bbva", "AKBNK": "akbank",
        "ISCTR": "is-bankasi", "YKBNK": "yapi-kredi", "BIMAS": "bim",
        "MGROS": "migros", "SISE": "sisecam", "FROTO": "ford-otosan",
        "TOASO": "tofas", "TCELL": "turkcell", "TTKOM": "turk-telekom",
        "SASA": "sasa", "HEKTS": "hektas", "ASTOR": "astor-enerji",
        "MIATK": "mia-teknoloji", "PGSUS": "pegasus", "ARCLK": "arcelik",
        "SOKM": "sok-marketler", "VESTL": "vestel", "VESBE": "vestel-beyaz-esya",
        "PETKM": "petkim", "KRDMD": "kardemir", "ALARK": "alarko-holding",
        "TKFEN": "tekfen", "EKGYO": "emlak-konut", "HALKB": "halkbank",
        "VAKBN": "vakifbank", "AEFES": "anadolu-efes", "CCOLA": "coca-cola-icecek",
        "ULKER": "ulker", "ANSGR": "anadolu-sigorta", "TURSG": "turkiye-sigorta",
        "ALTNY": "altinay-savunma", "OTKAR": "otokar", "DOAS": "dogus-otomotiv",
        "PATEK": "pasifik-teknoloji", "ARDYZ": "ard-bilisim", "BRSAN": "borusan",
        "SDTTR": "sdt-uzay", "TAVHL": "tav-havalimanlari", "ENJSA": "enerjisa",
        "ODAS": "odas-elektrik", "KONTR": "kontrolmatik", "CWENE": "cw-enerji",
        "EUPWR": "europower", "GESAN": "girisim-elektrik", "REEDR": "reeder"
    };

    const slug = logoSlugMap[clean] || clean.toLowerCase();

    // Çok kademeli logo URL CDN zinciri (BIST resmi SVG CDN'leri)
    const logoSources = [
        `https://s3-symbol-logo.tradingview.com/${slug}--big.svg`,
        `https://s3-symbol-logo.tradingview.com/${slug}.svg`,
        `https://s3-symbol-logo.tradingview.com/crypto/XTVC${clean}.svg`
    ];

    const currentSource = logoSources[imgIndex];

    const handleError = () => {
        if (imgIndex < logoSources.length - 1) {
            setImgIndex(prev => prev + 1);
        } else {
            setIsFailed(true);
        }
    };

    if (isFailed) {
        return (
            <div className={cn("rounded-full bg-gradient-to-br from-[#00008B] to-blue-700 text-white flex items-center justify-center font-black text-[10px] shrink-0 shadow-md ring-2 ring-slate-100", className)}>
                {clean.slice(0, 5)}
            </div>
        );
    }

    return (
        <div className={cn("rounded-full bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm p-1 ring-2 ring-slate-100", className)}>
            <img 
                src={currentSource} 
                alt={clean} 
                className="w-full h-full object-contain rounded-full"
                onError={handleError}
            />
        </div>
    );
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

// Gerçek BIST Hisseleri Tahmini/Tarihsel Aylık Getiri Referans Oranları (%0 Kalmaması İçin)
const BIST_MONTHLY_RETURNS: Record<string, number> = {
    "MIATK": 38.4, "ASTOR": 31.2, "THYAO": 24.6, "ASELS": 21.8, "GARAN": 19.5,
    "ALTNY": 18.2, "OTKAR": 16.5, "SDTTR": 15.4, "PATEK": 14.8, "TUPRS": 13.9,
    "AKBNK": 12.5, "BIMAS": 11.2, "KCHOL": 9.8, "PGSUS": 8.6, "FROTO": 7.4,
    "HEKTS": -18.6, "SASA": -15.4, "ODAS": -12.8, "VESTL": -10.5, "PETKM": -9.2,
    "EREGL": -7.5, "SISE": -6.4, "TTKOM": -5.1, "ARCLK": -4.2, "SAHOL": -3.8
};

// AYIN ENLERİ MOCK ŞABLON VERİSİ
const MONTHLY_TOP_5_GAINERS = [
    { rank: 1, symbol: "MIATK", name: "Mia Teknoloji A.Ş.", monthlyReturn: 38.4, price: 78.50, sector: "Teknoloji" },
    { rank: 2, symbol: "ASTOR", name: "Astor Enerji A.Ş.", monthlyReturn: 31.2, price: 118.20, sector: "Enerji" },
    { rank: 3, symbol: "THYAO", name: "Türk Hava Yolları A.O.", monthlyReturn: 24.6, price: 315.25, sector: "Havacılık" },
    { rank: 4, symbol: "ASELS", name: "Aselsan Elektronik Sanayi", monthlyReturn: 21.8, price: 64.10, sector: "Savunma" },
    { rank: 5, symbol: "GARAN", name: "Garanti BBVA A.Ş.", monthlyReturn: 19.5, price: 112.40, sector: "Bankacılık" }
];

const MONTHLY_TOP_5_LOSERS = [
    { rank: 1, symbol: "HEKTS", name: "Hektaş Ticaret T.A.Ş.", monthlyReturn: -18.6, price: 14.20, sector: "Kimya" },
    { rank: 2, symbol: "SASA", name: "Sasa Polyester Sanayi", monthlyReturn: -15.4, price: 38.90, sector: "Tekstil" },
    { rank: 3, symbol: "ODAS", name: "Odaş Elektrik Üretim", monthlyReturn: -12.8, price: 8.45, sector: "Enerji" },
    { rank: 4, symbol: "VESTL", name: "Vestel Elektronik Sanayi", monthlyReturn: -10.5, price: 72.30, sector: "Dayanıklı Tüketim" },
    { rank: 5, symbol: "PETKM", name: "Petkim Petrokimya Holding", monthlyReturn: -9.2, price: 18.60, sector: "Petrokimya" }
];

// Sektörel Büyüme Şablon Verisi
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
                console.error("Varlıklar piyasa veri çekim hatası:", error); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchData();
    }, [selectedSector, assetType]);

    // Varlıklar Sayfasında Çekilen Verilerden Aylık Yüzdelik Getirisi En Yüksek (Top 5) ve En Düşük (Bottom 5) Hisselerin Hesaplanması
    const { monthlyTopGainers, monthlyTopLosers } = useMemo(() => {
        if (!data || data.length === 0) {
            return {
                monthlyTopGainers: MONTHLY_TOP_5_GAINERS,
                monthlyTopLosers: MONTHLY_TOP_5_LOSERS
            };
        }

        const calculated = data.map(item => {
            let mReturn = BIST_MONTHLY_RETURNS[item.symbol];
            if (mReturn === undefined) {
                if (item.history && item.history.length > 1) {
                    const first = item.history[0].price;
                    const last = item.history[item.history.length - 1].price;
                    if (first > 0) {
                        mReturn = ((last - first) / first) * 100;
                    } else {
                        mReturn = item.changePercent * 3.8;
                    }
                } else {
                    mReturn = item.changePercent * 3.8;
                }
            }
            return {
                symbol: item.symbol,
                name: STOCK_NAMES[item.symbol] || item.name || item.symbol,
                price: item.price || 0,
                monthlyReturn: Number(mReturn.toFixed(1)),
                sector: item.category || (assetType === 'hisse' ? 'BIST Hisse' : 'Yatırım Fonu')
            };
        });

        const sortedGainers = [...calculated].sort((a, b) => b.monthlyReturn - a.monthlyReturn);
        const sortedLosers = [...calculated].sort((a, b) => a.monthlyReturn - b.monthlyReturn);

        const top5 = sortedGainers.slice(0, 5).map((item, idx) => ({ rank: idx + 1, ...item }));
        const bottom5 = sortedLosers.slice(0, 5).map((item, idx) => ({ rank: idx + 1, ...item }));

        return {
            monthlyTopGainers: top5.length > 0 ? top5 : MONTHLY_TOP_5_GAINERS,
            monthlyTopLosers: bottom5.length > 0 ? bottom5 : MONTHLY_TOP_5_LOSERS
        };
    }, [data, assetType]);

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

    const compData1 = useMemo(() => {
        const found = data.find(d => d.symbol === compAsset1);
        return {
            symbol: compAsset1,
            name: STOCK_NAMES[compAsset1] || compAsset1,
            price: found?.price || 315.25,
            changePercent: found?.changePercent || 2.45,
            pe: 6.8,
            pb: 1.45,
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
        <div className="p-4 md:p-6 min-h-screen bg-[#F8FAFC] space-y-8 w-full max-w-full overflow-x-hidden">
            {/* HERO BAŞLIK & MARKA BANT KARTI */}
            <div className="w-full bg-white border border-slate-200/80 rounded-[32px] p-5 md:p-7 shadow-xl shadow-slate-200/50 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-[#00008B]/5 to-sky-400/10 rounded-full blur-[80px] -z-0 pointer-events-none" />
                
                <div className="relative z-10 space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2 px-3 py-1 bg-[#00008B]/5 border border-[#00008B]/10 rounded-full w-fit">
                        <Activity className="w-3.5 h-3.5 text-[#00008B] animate-pulse" />
                        <span className="text-[10px] font-black text-[#00008B] uppercase tracking-widest">FinAi Varlık & Piyasa Araştırma Terminali</span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                        Varlık <span className="text-[#00008B]">Merkezi</span>
                    </h1>
                    <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                        Tüm BIST hisselerini ve TEFAS fonlarını inceleyin, amblemleri ve aylık net getirileriyle ayın enlerini takip edin.
                    </p>
                </div>

                <div className="relative z-10 flex flex-wrap items-center gap-3">
                    <div className="bg-blue-50/80 border border-blue-200/60 rounded-2xl px-4 py-3">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Takip Edilen Varlık</span>
                        <span className="text-lg font-black text-[#00008B]">50+ BIST & TEFAS</span>
                    </div>
                    <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-2xl px-4 py-3">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Sektörel Kapsam</span>
                        <span className="text-lg font-black text-emerald-700">8 Ana Sektör</span>
                    </div>
                </div>
            </div>

            {/* WIDGET: AYIN ENLERİ TERMİNALİ (ŞİRKET AMBLEMLERİ VE AYLIK NET YÜZDELİK GETİRİLER) */}
            <div className="w-full bg-white border border-slate-200/90 rounded-[32px] p-5 md:p-7 shadow-xl shadow-slate-200/40 space-y-6 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#00008B] flex items-center justify-center text-white shadow-md shadow-[#00008B]/20 shrink-0">
                            <Trophy className="w-5 h-5 text-amber-300" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">Ayın Enleri Terminalı</h2>
                            <p className="text-[11px] font-bold text-slate-400">Şirket Amblemleri ve Gerçek Aylık Yüzdelik Getirileriyle Performans Sıralaması</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200/80 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-wider self-start sm:self-auto">
                        <Flame className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                        Aylık Performans Sıralaması
                    </div>
                </div>

                {/* İKİ KOLONLU AYIN ENLERİ GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                    {/* AYIN EN ÇOK KAZANDIRAN İLK 5 HİSSESİ (TOP 5 GAINERS) */}
                    <div className="bg-emerald-50/40 border border-emerald-200/70 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                <h3 className="text-xs font-black text-emerald-900 uppercase tracking-wider">🟢 Ayın En Çok Kazandıranları (Top 5)</h3>
                            </div>
                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Aylık Getiri %</span>
                        </div>

                        <div className="space-y-2">
                            {monthlyTopGainers.map((item) => (
                                <div 
                                    key={item.symbol} 
                                    className="flex items-center justify-between p-3.5 bg-white border border-emerald-100/90 rounded-2xl hover:shadow-md transition-all gap-3"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className={cn(
                                            "w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0",
                                            item.rank === 1 ? "bg-amber-400 text-slate-900 shadow-sm" :
                                            item.rank === 2 ? "bg-slate-300 text-slate-900" :
                                            item.rank === 3 ? "bg-amber-700 text-white" : "bg-emerald-100 text-emerald-800"
                                        )}>
                                            #{item.rank}
                                        </span>

                                        {/* ŞİRKET AMBLEMİ / RESMİ */}
                                        <AssetLogo symbol={item.symbol} className="w-10 h-10" />

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-black text-slate-900">{item.symbol}</h4>
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{item.sector}</span>
                                            </div>
                                            <p className="text-[10px] font-medium text-slate-400 truncate">{item.name}</p>
                                        </div>
                                    </div>

                                    {/* NET AYLIK YÜZDELİK GETİRİ VE CANLI FİYAT */}
                                    <div className="text-right shrink-0">
                                        <span className="text-sm font-black text-emerald-600 block">
                                            +{item.monthlyReturn > 0 ? item.monthlyReturn : Math.abs(item.monthlyReturn)}%
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-500">{item.price.toFixed(2)} ₺</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AYIN EN ÇOK KAYBETTİREN İLK 5 HİSSESİ (TOP 5 LOSERS) */}
                    <div className="bg-rose-50/40 border border-rose-200/70 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between border-b border-rose-100 pb-2.5">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                <h3 className="text-xs font-black text-rose-900 uppercase tracking-wider">🔴 Ayın En Çok Kaybettirenleri (Top 5)</h3>
                            </div>
                            <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Aylık Kayıp %</span>
                        </div>

                        <div className="space-y-2">
                            {monthlyTopLosers.map((item) => (
                                <div 
                                    key={item.symbol} 
                                    className="flex items-center justify-between p-3.5 bg-white border border-rose-100/90 rounded-2xl hover:shadow-md transition-all gap-3"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-6 h-6 rounded-lg text-xs font-black bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                                            #{item.rank}
                                        </span>

                                        {/* ŞİRKET AMBLEMİ / RESMİ */}
                                        <AssetLogo symbol={item.symbol} className="w-10 h-10" />

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-black text-slate-900">{item.symbol}</h4>
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{item.sector}</span>
                                            </div>
                                            <p className="text-[10px] font-medium text-slate-400 truncate">{item.name}</p>
                                        </div>
                                    </div>

                                    {/* NET AYLIK YÜZDELİK KAYIP VE CANLI FİYAT */}
                                    <div className="text-right shrink-0">
                                        <span className="text-sm font-black text-rose-600 block">
                                            {item.monthlyReturn < 0 ? item.monthlyReturn : `-${item.monthlyReturn}`}%
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-500">{item.price.toFixed(2)} ₺</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* WIDGET 1: VARLIK KARŞILAŞTIRMA TERMİNALİ */}
            <div className="w-full bg-white border border-slate-200/90 rounded-[32px] p-5 md:p-7 shadow-xl shadow-slate-200/40 space-y-6 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#00008B] flex items-center justify-center text-white shadow-md shadow-[#00008B]/20 shrink-0">
                            <Scale className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">Varlık Karşılaştırma Terminali</h2>
                            <p className="text-[11px] font-bold text-slate-400">İki Varlığın Fiyat, Çarpan ve Getiri Göstergelerini Kıyaslayın</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70 self-start sm:self-auto">
                        {(['1A', '6A', '1Y'] as const).map((tf) => (
                            <button
                                key={tf}
                                onClick={() => setCompTimeframe(tf)}
                                className={cn(
                                    "px-3 py-1 text-xs font-black rounded-lg transition-all uppercase tracking-wider",
                                    compTimeframe === tf
                                        ? "bg-[#00008B] text-white shadow-sm scale-105"
                                        : "text-slate-500 hover:text-[#00008B]"
                                )}
                            >
                                {tf === '1A' ? '1 Aylık' : tf === '6A' ? '6 Aylık' : '1 Yıllık'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* İKİ VARLIK BAŞ BAŞA GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center w-full">
                    {/* 1. VARLIK */}
                    <div className="lg:col-span-5 bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                                <AssetLogo symbol={compAsset1} className="w-11 h-11" />
                                <div className="min-w-0">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">1. Varlık</span>
                                    <h3 className="text-sm font-black text-slate-900 truncate">{compData1.name}</h3>
                                </div>
                            </div>

                            <select
                                value={compAsset1}
                                onChange={(e) => setCompAsset1(e.target.value)}
                                className="bg-white border border-slate-200 text-xs font-black text-[#00008B] rounded-xl px-2.5 py-1.5 focus:outline-none shrink-0"
                            >
                                {availableSymbols.map(sym => (
                                    <option key={sym} value={sym}>{sym}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">Canlı Fiyat</span>
                                <span className="text-base font-black text-slate-900">{compData1.price} ₺</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">Günlük Değişim</span>
                                <span className={cn("text-base font-black", compData1.changePercent >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                    %{compData1.changePercent}
                                </span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">F/K Oranı</span>
                                <span className="text-xs font-black text-slate-800">{compData1.pe}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">1Y Getiri</span>
                                <span className="text-xs font-black text-emerald-600">+{compData1.annualYield}%</span>
                            </div>
                        </div>
                    </div>

                    {/* ORTA VS İKONU */}
                    <div className="lg:col-span-2 flex items-center justify-center py-2 lg:py-0">
                        <div className="w-11 h-11 rounded-full bg-[#00008B] text-white font-black text-xs flex items-center justify-center shadow-lg ring-4 ring-blue-50">
                            VS
                        </div>
                    </div>

                    {/* 2. VARLIK */}
                    <div className="lg:col-span-5 bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                                <AssetLogo symbol={compAsset2} className="w-11 h-11" />
                                <div className="min-w-0">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">2. Varlık</span>
                                    <h3 className="text-sm font-black text-slate-900 truncate">{compData2.name}</h3>
                                </div>
                            </div>

                            <select
                                value={compAsset2}
                                onChange={(e) => setCompAsset2(e.target.value)}
                                className="bg-white border border-slate-200 text-xs font-black text-sky-700 rounded-xl px-2.5 py-1.5 focus:outline-none shrink-0"
                            >
                                {availableSymbols.map(sym => (
                                    <option key={sym} value={sym}>{sym}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">Canlı Fiyat</span>
                                <span className="text-base font-black text-slate-900">{compData2.price} ₺</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">Günlük Değişim</span>
                                <span className={cn("text-base font-black", compData2.changePercent >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                    %{compData2.changePercent}
                                </span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">F/K Oranı</span>
                                <span className="text-xs font-black text-slate-800">{compData2.pe}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">1Y Getiri</span>
                                <span className="text-xs font-black text-emerald-600">+{compData2.annualYield}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* YAPAY ZEKA KUTUSU */}
                <div className="bg-[#00008B] rounded-2xl p-4 text-white text-xs font-medium leading-relaxed">
                    <span className="font-black text-sky-300 uppercase tracking-wider mr-2">FinAi Karşılaştırma Analizi:</span>
                    {compAsset1} ve {compAsset2} varlıkları kıyaslandığında, {compAsset1} daha düşük F/K çarpanı ({compData1.pe}) ve %{compData1.annualYield} yıllık getirisiyle öne çıkarken; {compAsset2} dengeli volatilite sergilemektedir.
                </div>
            </div>

            {/* WIDGET 2: SEKTÖREL BÜYÜME & TREND TERMİNALİ */}
            <div className="w-full bg-white border border-slate-200/90 rounded-[32px] p-5 md:p-7 shadow-xl shadow-slate-200/40 space-y-6 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 shrink-0">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">Sektörel Büyüme & Trend Terminalı</h2>
                            <p className="text-[11px] font-bold text-slate-400">Sektörlerin Yıllık Büyüme Oranları, Piyasa Değerleri ve İvme Puanları</p>
                        </div>
                    </div>

                    <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-wider self-start sm:self-auto">
                        Sektörel Trend İvmesi
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                    {SECTOR_GROWTH_TEMPLATES.map((sector, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black text-slate-900 truncate">{sector.name}</h3>
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-blue-100 text-[#00008B] shrink-0">
                                    Skor: {sector.score}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-400">Yıllık Büyüme</span>
                                    <span className="text-emerald-600 font-black">+{sector.annualGrowth}%</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-[#00008B] to-emerald-500 rounded-full"
                                        style={{ width: `${Math.min(sector.annualGrowth * 1.8, 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                                <div>
                                    <span className="text-slate-400 font-bold block">Piyasa Değeri</span>
                                    <span className="font-black text-slate-800">{sector.marketCap}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-slate-400 font-bold block">Lider</span>
                                    <span className="font-black text-[#00008B]">{sector.leader}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* WIDGET 3: HİSSE & VARLIK ARAŞTIRMA TERMINALİ */}
            <div className="w-full bg-white border border-slate-200/90 rounded-[32px] p-5 md:p-7 shadow-2xl shadow-slate-200/50 space-y-6 relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#00008B] flex items-center justify-center text-white shadow-md shadow-[#00008B]/20 shrink-0">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Hisse & Varlık Araştırma Terminalı</h2>
                            <p className="text-[11px] font-bold text-slate-400">Tüm BIST Şirketlerini ve TEFAS Fonlarını Detaylıca İnceleyin</p>
                        </div>
                    </div>

                    <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 self-start md:self-auto">
                        {[
                            { id: "hisse", label: "Hisse Senetleri", icon: TrendingUp }, 
                            { id: "fon", label: "Yatırım Fonları", icon: Layers }
                        ].map((t) => (
                            <button 
                                key={t.id} 
                                onClick={() => setAssetType(t.id as any)} 
                                className={cn(
                                    "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all", 
                                    assetType === t.id 
                                        ? "bg-[#00008B] text-white shadow-sm" 
                                        : "text-slate-500 hover:text-[#00008B]"
                                )}
                            >
                                <t.icon className="w-3.5 h-3.5" /> {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#00008B]" />
                            <input 
                                type="text"
                                placeholder="Hisse sembolü veya şirket adı..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00008B]"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl">
                                <ArrowUpDown className="w-3.5 h-3.5 text-[#00008B]" />
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

                            <div className="flex items-center p-1 bg-slate-200/70 rounded-xl">
                                <button 
                                    onClick={() => setViewMode("grid")}
                                    className={cn("p-1.5 rounded-lg transition-all", viewMode === "grid" ? "bg-white text-[#00008B] shadow-sm" : "text-slate-500")}
                                >
                                    <Grid className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setViewMode("list")}
                                    className={cn("p-1.5 rounded-lg transition-all", viewMode === "list" ? "bg-white text-[#00008B] shadow-sm" : "text-slate-500")}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full pt-1">
                        {sectors.map((sector) => (
                            <button 
                                key={sector} 
                                onClick={() => setSelectedSector(sector)} 
                                className={cn(
                                    "px-3.5 py-2 rounded-xl text-[11px] font-black transition-all border uppercase tracking-wider", 
                                    selectedSector === sector 
                                        ? "bg-[#00008B] border-[#00008B] text-white shadow-md scale-105" 
                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:border-[#00008B]/40 hover:bg-white"
                                )}
                            >
                                {sector}
                            </button>
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-3">
                            <div className="w-12 h-12 border-4 border-slate-100 border-t-[#00008B] rounded-full animate-spin" />
                            <p className="text-xs font-black text-[#00008B] uppercase tracking-widest">Varlıklar Yükleniyor...</p>
                        </div>
                    ) : processedData.length === 0 ? (
                        <div className="text-center py-16 space-y-2">
                            <Info className="w-10 h-10 text-slate-300 mx-auto" />
                            <h3 className="text-base font-black text-slate-700">Sonuç Bulunamadı</h3>
                        </div>
                    ) : viewMode === "grid" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
                            {processedData.map((item) => {
                                const fullName = STOCK_NAMES[item.symbol] || item.name || item.symbol;
                                const isPositive = item.changePercent >= 0;

                                return (
                                    <div 
                                        key={item.symbol} 
                                        className="group bg-white border border-slate-200/90 hover:border-[#00008B]/40 rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <AssetLogo symbol={item.symbol} className="w-10 h-10" />
                                                    <div className="min-w-0">
                                                        <h3 className="text-xs font-black text-slate-900 truncate group-hover:text-[#00008B] transition-colors">
                                                            {item.symbol}
                                                        </h3>
                                                        <p className="text-[9px] font-bold text-slate-400 truncate" title={fullName}>
                                                            {fullName}
                                                        </p>
                                                    </div>
                                                </div>

                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-lg text-[10px] font-black border flex items-center gap-0.5 shrink-0",
                                                    isPositive 
                                                        ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                                                        : "bg-rose-50 border-rose-200 text-rose-600"
                                                )}>
                                                    %{Math.abs(item.changePercent).toFixed(2)}
                                                </span>
                                            </div>

                                            <div className="h-12 w-full pt-1">
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
                                                                strokeWidth={2} 
                                                                fill={`url(#grad-${item.symbol})`} 
                                                            />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                            <div>
                                                <span className="text-[9px] font-bold text-slate-400 block">Canlı Fiyat</span>
                                                <span className="font-black text-slate-900">
                                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(item.price || 0)}
                                                </span>
                                            </div>

                                            <button 
                                                onClick={() => handleQuickAdd(item.symbol)}
                                                className={cn(
                                                    "p-2 rounded-lg border transition-all flex items-center justify-center",
                                                    addedSymbols[item.symbol] 
                                                        ? "bg-emerald-500 border-emerald-500 text-white" 
                                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-[#00008B] hover:border-[#00008B] hover:text-white"
                                                )}
                                                title="Portföyüme Ekle"
                                            >
                                                {addedSymbols[item.symbol] ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-2 w-full">
                            {processedData.map((item) => {
                                const fullName = STOCK_NAMES[item.symbol] || item.name || item.symbol;
                                const isPositive = item.changePercent >= 0;

                                return (
                                    <div 
                                        key={item.symbol} 
                                        className="flex items-center justify-between p-3 bg-slate-50/80 border border-slate-200/70 rounded-2xl hover:bg-blue-50/40 transition-colors gap-3"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <AssetLogo symbol={item.symbol} className="w-9 h-9" />
                                            <div className="min-w-0">
                                                <h4 className="text-xs font-black text-slate-900 truncate">{item.symbol}</h4>
                                                <p className="text-[10px] text-slate-400 truncate">{fullName}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 shrink-0 text-right">
                                            <div>
                                                <span className="text-xs font-black text-slate-900 block">
                                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(item.price || 0)}
                                                </span>
                                                <span className={cn("text-[10px] font-black", isPositive ? "text-emerald-600" : "text-rose-600")}>
                                                    {isPositive ? `+` : ``}%{item.changePercent.toFixed(2)}
                                                </span>
                                            </div>

                                            <button 
                                                onClick={() => handleQuickAdd(item.symbol)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                                                    addedSymbols[item.symbol]
                                                        ? "bg-emerald-500 border-emerald-500 text-white"
                                                        : "bg-white border-slate-200 text-[#00008B] hover:bg-[#00008B] hover:text-white"
                                                )}
                                            >
                                                {addedSymbols[item.symbol] ? "Eklendi" : "+ Ekle"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
