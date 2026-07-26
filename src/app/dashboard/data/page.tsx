"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
  ArrowDownRight,
  X,
  Maximize2,
  Minimize2,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { STOCK_SECTORS, FUND_SECTORS } from "@/lib/constants/assets-mapping";

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

// Şirket Amblem / Logo Bileşeni (Kendi Depomuzda Saklanan Yerel Resmi Şirket Amblemleri)
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
        "MIATK": "mia-teknoloji", "PGSUS": "pegasus", "ARCLK": "arcelik"
    };

    const slug = logoSlugMap[clean] || clean.toLowerCase();

    // Orijinal BIST Şirket Amblemleri CDN Kaynakları
    const logoSources = [
        `https://s3-symbol-logo.tradingview.com/${slug}--big.svg`,
        `https://s3-symbol-logo.tradingview.com/${slug}.svg`,
        `https://s3-symbol-logo.tradingview.com/crypto/XTVC${clean}.svg`,
        `https://s3-symbol-logo.tradingview.com/country/TR.svg`
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
        <div className={cn("rounded-full bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm p-0.5 ring-2 ring-slate-100", className)}>
            <img 
                src={currentSource} 
                alt={clean} 
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
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
    "MIATK": "Mia Teknoloji A.Ş.",
    "PGSUS": "Pegasus Hava Taşımacılığı A.Ş."
};

// SEKTÖRLER YILLIK GETİRİLERİ TÜM SEKTÖR VERİSİ (Yıllık Getirisine Göre Sıralı)
const ALL_SECTORS_DATA = [
    { name: "Teknoloji & Yazılım", annualReturn: 48.2, marketCap: "180 Mr TL", leader: "MIATK", color: "from-blue-600 to-indigo-600" },
    { name: "Savunma Sanayii", annualReturn: 42.1, marketCap: "380 Mr TL", leader: "ASELS", color: "from-[#00008B] to-blue-800" },
    { name: "Enerji & Yenilenebilir", annualReturn: 39.4, marketCap: "290 Mr TL", leader: "ASTOR", color: "from-amber-500 to-emerald-600" },
    { name: "Havacılık & Ulaştırma", annualReturn: 34.8, marketCap: "450 Mr TL", leader: "THYAO", color: "from-sky-500 to-blue-600" },
    { name: "Bankacılık & Finans", annualReturn: 28.5, marketCap: "620 Mr TL", leader: "GARAN", color: "from-emerald-600 to-teal-700" },
    { name: "Holdingler & Yatırım", annualReturn: 22.6, marketCap: "550 Mr TL", leader: "KCHOL", color: "from-indigo-600 to-purple-600" },
    { name: "Otomotiv Sanayi", annualReturn: 19.8, marketCap: "360 Mr TL", leader: "FROTO", color: "from-cyan-600 to-blue-700" },
    { name: "Perakende & Gıda", annualReturn: 16.4, marketCap: "300 Mr TL", leader: "BIMAS", color: "from-rose-500 to-pink-600" },
    { name: "Demir Çelik & Sanayi", annualReturn: 14.2, marketCap: "170 Mr TL", leader: "EREGL", color: "from-[#00008B] to-sky-700" },
    { name: "Gayrimenkul (GYO)", annualReturn: 11.5, marketCap: "140 Mr TL", leader: "EKGYO", color: "from-violet-600 to-purple-700" }
];

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

// RASTGELE ÖNERİLEN VARLIK KARTLARI
const RECOMMENDED_ASSETS = [
    { symbol: "THYAO", name: "Türk Hava Yolları", price: 315.25, change: 2.45, category: "Havacılık" },
    { symbol: "ASELS", name: "Aselsan Elektronik", price: 64.10, change: 3.12, category: "Savunma" },
    { symbol: "FROTO", name: "Ford Otosan", price: 1045.00, change: 1.85, category: "Otomotiv" },
    { symbol: "EREGL", name: "Ereğli Demir Çelik", price: 48.60, change: -1.20, category: "Sanayi" },
    { symbol: "MIATK", name: "Mia Teknoloji", price: 78.50, change: 4.80, category: "Teknoloji" },
    { symbol: "ASTOR", name: "Astor Enerji", price: 118.20, change: 3.65, category: "Enerji" },
    { symbol: "GARAN", name: "Garanti BBVA", price: 112.40, change: 0.90, category: "Bankacılık" },
    { symbol: "BIMAS", name: "BİM Mağazaları", price: 495.00, change: 1.10, category: "Perakende" },
    { symbol: "TUPRS", name: "Tüpraş Petrol", price: 168.40, change: 2.15, category: "Enerji" },
    { symbol: "KCHOL", name: "Koç Holding", price: 214.50, change: 0.85, category: "Holding" }
];

export default function AssetsPage() {
    const [searchTerm, setSearchTerm] = useState("");

    // GRAFİK GENİŞLEME & DIŞARI TIKLAMA STATE & REF
    const [isSectorChartExpanded, setIsSectorChartExpanded] = useState(false);
    const sectorChartRef = useRef<HTMLDivElement>(null);

    // Sayfanın/kapsayıcının boş bir alanına tıklandığında genişlemiş grafiği kapatma
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (sectorChartRef.current && !sectorChartRef.current.contains(event.target as Node)) {
                setIsSectorChartExpanded(false);
            }
        }
        if (isSectorChartExpanded) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isSectorChartExpanded]);

    // Dinamik En Çok Getirisi Olan İlk 4 Sektör (Varsayılan dikey sütun görünümü için)
    const top4Sectors = useMemo(() => ALL_SECTORS_DATA.slice(0, 4), []);

    // Arama filtreli önerilen varlıklar
    const filteredRecommended = useMemo(() => {
        if (!searchTerm.trim()) return RECOMMENDED_ASSETS;
        const term = searchTerm.toLowerCase();
        return RECOMMENDED_ASSETS.filter(a => 
            a.symbol.toLowerCase().includes(term) || a.name.toLowerCase().includes(term)
        );
    }, [searchTerm]);

    return (
        <div className="p-4 md:p-6 min-h-screen bg-[#F8FAFC] space-y-8 w-full max-w-full overflow-x-hidden">
            
            {/* ========================================================================= */}
            {/* 1. BÖLÜM: ÜST YARI (ANALYTICS & INSIGHTS - SOL %50, SAĞ %50 EQUAL WIDTH) */}
            {/* ========================================================================= */}
            <div className="w-full relative space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
                    
                    {/* SOL ÜST MODÜL: SEKTÖRLER YILLIK GETİRİLERİ (%50 -> %100 ANIMATED REFLOW) */}
                    <div 
                        ref={sectorChartRef}
                        className={cn(
                            "bg-white border border-slate-200/90 rounded-[32px] p-6 shadow-xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden cursor-pointer group flex flex-col justify-between",
                            isSectorChartExpanded 
                                ? "lg:col-span-12 ring-4 ring-[#00008B]/20 shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-white" 
                                : "lg:col-span-6 hover:border-[#00008B]/40 hover:shadow-2xl"
                        )}
                        onClick={() => !isSectorChartExpanded && setIsSectorChartExpanded(true)}
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-[#00008B] flex items-center justify-center text-white shadow-md shadow-[#00008B]/20 shrink-0">
                                    <BarChart3 className="w-5 h-5 text-sky-300" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-black text-slate-900 tracking-tight">Sektörler Yıllık Getirileri</h2>
                                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-[#00008B] border border-blue-200/60 uppercase tracking-widest">
                                            {isSectorChartExpanded ? "Tüm Sektörler Dikey Grafiği (Canlı Animasyon)" : "En Yüksek 4 Sektör"}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400">
                                        {isSectorChartExpanded 
                                            ? "Yıllık getirisine göre dikey sütunlar halinde sırayla yüklenen tüm ana sektörler" 
                                            : "Genişletmek ve tüm dikey sektör sütunlarını canlı görmek için tıklayın"}
                                    </p>
                                </div>
                            </div>

                            {/* Kapatma ("X") veya Büyütme İkonu */}
                            {isSectorChartExpanded ? (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsSectorChartExpanded(false);
                                    }}
                                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-rose-500 hover:text-white text-slate-600 transition-all duration-300 shadow-sm flex items-center gap-1.5 text-xs font-black"
                                    title="Orijinal Düzenine Dön (Kapat)"
                                >
                                    <X className="w-4 h-4" />
                                    <span className="hidden sm:inline">Kapat</span>
                                </button>
                            ) : (
                                <div className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-[#00008B] group-hover:text-white transition-all duration-300">
                                    <Maximize2 className="w-4 h-4" />
                                </div>
                            )}
                        </div>

                        {/* GRAFİK GÖRÜNÜMÜ: VARSAYILAN (4 DİKEY SÜTUN) vs GENİŞLETİLMİŞ (TÜM DİKEY SÜTUNLAR) */}
                        {!isSectorChartExpanded ? (
                            /* DEFAULT 4 DİKEY SÜTUN GRAFİĞİ */
                            <div className="h-72 w-full flex items-end justify-around pt-6 px-4 pb-2 gap-4">
                                {top4Sectors.map((sector, idx) => {
                                    const maxVal = 55;
                                    const heightPercent = (sector.annualReturn / maxVal) * 100;
                                    return (
                                        <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group/col">
                                            {/* Getiri Yüzdesi */}
                                            <span className="text-xs font-black text-[#00008B] mb-2 group-hover/col:scale-110 transition-transform">
                                                +{sector.annualReturn}%
                                            </span>
                                            
                                            {/* Dikey Sütun Barı */}
                                            <div 
                                                className={cn(
                                                    "w-full max-w-[72px] rounded-t-2xl bg-gradient-to-t transition-all duration-500 shadow-md group-hover/col:brightness-110 relative overflow-hidden flex items-start justify-center pt-2",
                                                    sector.color
                                                )}
                                                style={{ height: `${heightPercent}%` }}
                                            >
                                                <span className="text-[10px] font-black text-white/90 bg-black/20 px-1.5 py-0.5 rounded-full">
                                                    #{idx + 1}
                                                </span>
                                            </div>
                                            
                                            {/* Sektör Adı */}
                                            <span className="text-[11px] font-black text-slate-700 mt-3 text-center truncate w-full">
                                                {sector.name}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400">
                                                Lider: {sector.leader}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* EXPANDED ALL SECTORS VERTICAL COLUMNS CHART (TEKER TEKER SIRAYLA YÜKLENEN DİKEY SÜTUN ANIMASYONU) */
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.4 }}
                                className="h-80 w-full flex items-end justify-between pt-8 px-2 md:px-6 pb-2 gap-2 md:gap-3 overflow-x-auto scrollbar-none"
                            >
                                {ALL_SECTORS_DATA.map((sector, idx) => {
                                    const maxVal = 55;
                                    const heightPercent = (sector.annualReturn / maxVal) * 100;
                                    return (
                                        <motion.div 
                                            key={idx} 
                                            initial={{ opacity: 0, scaleY: 0, y: 30 }}
                                            animate={{ opacity: 1, scaleY: 1, y: 0 }}
                                            transition={{ 
                                                duration: 0.5, 
                                                delay: 0.15 + (idx * 0.07), 
                                                ease: [0.16, 1, 0.3, 1] 
                                            }}
                                            className="flex-1 min-w-[70px] md:min-w-[85px] flex flex-col items-center h-full justify-end group/col origin-bottom"
                                        >
                                            {/* Getiri Yüzdesi */}
                                            <span className="text-[11px] md:text-xs font-black text-[#00008B] mb-2 group-hover/col:scale-110 transition-transform">
                                                +{sector.annualReturn}%
                                            </span>
                                            
                                            {/* Dikey Sütun Barı */}
                                            <div 
                                                className={cn(
                                                    "w-full max-w-[65px] rounded-t-2xl bg-gradient-to-t transition-all duration-300 shadow-lg group-hover/col:brightness-110 relative overflow-hidden flex items-start justify-center pt-2",
                                                    sector.color
                                                )}
                                                style={{ height: `${heightPercent}%` }}
                                            >
                                                <span className="text-[9px] font-black text-white/90 bg-black/20 px-1.5 py-0.5 rounded-full">
                                                    #{idx + 1}
                                                </span>
                                            </div>
                                            
                                            {/* Sektör Adı & Lideri */}
                                            <span className="text-[10px] md:text-xs font-black text-slate-800 mt-2.5 text-center truncate w-full" title={sector.name}>
                                                {sector.name}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400">
                                                {sector.leader}
                                            </span>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </div>

                    {/* SAĞ ÜST MODÜL: AYIN ENLERİ [ŞUBAT] (SAYFANIN İÇİNE DOĞRU ERİYEREK KAYBOLAN ANIMASYON) */}
                    <AnimatePresence>
                        {!isSectorChartExpanded && (
                            <motion.div 
                                initial={{ opacity: 1, scale: 1, y: 0 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ 
                                    opacity: 0, 
                                    scale: 0.6, 
                                    filter: "blur(12px)",
                                    transition: { duration: 0.6, ease: [0.32, 0, 0.67, 0] } 
                                }}
                                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                className="lg:col-span-6 bg-white border border-slate-200/90 rounded-[32px] p-6 shadow-xl space-y-5 flex flex-col justify-between"
                            >
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
                                            <Trophy className="w-5 h-5 text-amber-100" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black text-slate-900 tracking-tight">Ayın Enleri [Şubat]</h2>
                                            <p className="text-[11px] font-bold text-slate-400">En Çok Kazandıran & Kaybettiren Hisseler</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-[9px] font-black uppercase tracking-wider">
                                        <Flame className="w-3 h-3 text-amber-500" />
                                        Performans
                                    </div>
                                </div>

                                {/* YAN YANA (SAĞ VE SOL) İKİ KOLONLU AYIN ENLERİ DÜZENİ */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* SOL KOLON: OCAK AYININ EN İYİ GETİRİLİ 5 HİSSESİ */}
                                    <div className="space-y-2 bg-emerald-50/40 p-3 rounded-2xl border border-emerald-100/80">
                                        <h3 className="text-[10px] font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                            En İyi Getirili 5 Hisse
                                        </h3>
                                        <div className="space-y-1.5">
                                            {MONTHLY_TOP_5_GAINERS.map((item) => (
                                                <div key={item.symbol} className="flex items-center justify-between p-2 bg-white border border-emerald-100 rounded-xl hover:shadow-sm transition-all text-xs">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <AssetLogo symbol={item.symbol} className="w-6 h-6" />
                                                        <div className="min-w-0">
                                                            <span className="font-black text-slate-900 text-xs block leading-tight">{item.symbol}</span>
                                                            <span className="text-[8px] font-semibold text-slate-400 block truncate">{item.name}</span>
                                                        </div>
                                                    </div>
                                                    <span className="font-black text-emerald-600 text-xs shrink-0">+{item.monthlyReturn}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* SAĞ KOLON: OCAK AYININ EN KÖTÜ GETİRİLİ 5 HİSSESİ */}
                                    <div className="space-y-2 bg-rose-50/40 p-3 rounded-2xl border border-rose-100/80">
                                        <h3 className="text-[10px] font-black text-rose-900 uppercase tracking-wider flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                                            En Kötü Getirili 5 Hisse
                                        </h3>
                                        <div className="space-y-1.5">
                                            {MONTHLY_TOP_5_LOSERS.map((item) => (
                                                <div key={item.symbol} className="flex items-center justify-between p-2 bg-white border border-rose-100 rounded-xl hover:shadow-sm transition-all text-xs">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <AssetLogo symbol={item.symbol} className="w-6 h-6" />
                                                        <div className="min-w-0">
                                                            <span className="font-black text-slate-900 text-xs block leading-tight">{item.symbol}</span>
                                                            <span className="text-[8px] font-semibold text-slate-400 block truncate">{item.name}</span>
                                                        </div>
                                                    </div>
                                                    <span className="font-black text-rose-600 text-xs shrink-0">{item.monthlyReturn}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* 2. BÖLÜM: ALT YARI (SEARCH & DISCOVERY - SADECE ÖNERİLEN HİSSELER KALDI) */}
            {/* ========================================================================= */}
            <div className="w-full bg-white border border-slate-200/90 rounded-[32px] p-6 shadow-xl space-y-6 relative overflow-hidden">
                <div className="space-y-4">
                    {/* VARLIK ARAMA ÇUBUĞU (FULL-WIDTH INPUT) */}
                    <div className="relative w-full group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#00008B] transition-colors" />
                        <input 
                            type="text"
                            placeholder="Hisse Ara (Örn: THYAO, FROTO)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00008B]/30 focus:bg-white transition-all shadow-inner"
                        />
                    </div>

                    {/* RASTGELE ÖNERİLEN VARLIKLAR (TARGET="_BLANK" NATIVE NAVIGATION) */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                Önerilen BIST Varlıkları
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">Detay için tıkladığınızda yeni sekmede açılır</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 w-full">
                            {filteredRecommended.map((item) => (
                                <a
                                    key={item.symbol}
                                    href={`/varlik/${item.symbol}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group p-3.5 bg-slate-50/90 hover:bg-white border border-slate-200/80 hover:border-[#00008B]/40 rounded-2xl hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-3 cursor-pointer"
                                >
                                    <div className="flex items-center justify-between">
                                        <AssetLogo symbol={item.symbol} className="w-8 h-8" />
                                        <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#00008B] transition-colors" />
                                    </div>

                                    <div>
                                        <span className="text-xs font-black text-slate-900 block group-hover:text-[#00008B] transition-colors">{item.symbol}</span>
                                        <span className="text-[9px] font-semibold text-slate-400 truncate block">{item.name}</span>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 text-[11px]">
                                        <span className="font-black text-slate-800">₺{item.price.toFixed(2)}</span>
                                        <span className={cn("font-black", item.change >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                            %{item.change > 0 ? `+${item.change}` : item.change}
                                        </span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
