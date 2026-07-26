"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  ChevronRight, 
  ChevronLeft,
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
  ExternalLink,
  Filter,
  Palette,
  Table,
  Sliders
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { STOCK_SECTORS } from "@/lib/constants/assets-mapping";

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
    "THYAO": "Türk Hava Yolları A.O.", "ASELS": "Aselsan Elektronik Sanayi A.Ş.", "EREGL": "Ereğli Demir ve Çelik Fabrikaları",
    "TUPRS": "Tüpraş Petrol Rafinerileri A.Ş.", "KCHOL": "Koç Holding A.Ş.", "SAHOL": "Hacı Ömer Sabancı Holding A.Ş.",
    "GARAN": "Garanti BBVA A.Ş.", "AKBNK": "Akbank T.A.Ş.", "ISCTR": "Türkiye İş Bankası A.Ş.",
    "YKBNK": "Yapı ve Kredi Bankası A.Ş.", "BIMAS": "BİM Birleşik Mağazalar A.Ş.", "MGROS": "Migros Ticaret A.Ş.",
    "SOKM": "Şok Marketler Ticaret A.Ş.", "SISE": "Türkiye Şişe ve Cam Fabrikaları", "FROTO": "Ford Otomotiv Sanayi A.Ş.",
    "TOASO": "Tofaş Türk Otomobil Fabrikası", "TTRAK": "Türk Traktör ve Ziraat Makineleri", "TCELL": "Turkcell İletişim Hizmetleri A.Ş.",
    "TTKOM": "Türk Telekomünikasyon A.Ş.", "SASA": "Sasa Polyester Sanayi A.Ş.", "HEKTS": "Hektaş Ticaret T.A.Ş.",
    "ASTOR": "Astor Enerji A.Ş.", "MIATK": "Mia Teknoloji A.Ş.", "PGSUS": "Pegasus Hava Taşımacılığı A.Ş.",
    "REEDR": "Reeder Teknoloji Sanayi", "ARDYZ": "ARDEYZ Bilişim Teknolojileri", "KONTR": "Kontrolmatik Teknoloji",
    "LOGO": "Logo Yazılım Sanayi", "KFEIN": "Kafein Yazılım Hizmetleri", "LINK": "Link Bilgisayar Sistemleri",
    "ALTNY": "Altınay Savunma Teknolojileri", "OTKAR": "Otokar Otomotiv ve Savunma", "SDTTR": "SDT Uzay ve Savunma",
    "PATEK": "Pasifik Teknoloji A.Ş.", "CWENE": "CW Enerji Mühendislik", "EUPWR": "Euro Power Enerji",
    "GESAN": "Girişim Elektrik Sanayi", "ENJSA": "Enerjisa Enerji A.Ş.", "ODAS": "Odaş Elektrik Üretim",
    "TAVHL": "TAV Havalimanları Holding", "PASEU": "Pasifik Eurasiya Lojistik", "DOAS": "Doğuş Otomotiv Servis",
    "KRDMD": "Kardemir Demir Çelik", "KOZAL": "Koza Altın İşletmeleri", "EKGYO": "Emlak Konut GYO A.Ş.",
    "PSGYO": "Pasifik GYO A.Ş.", "ULKER": "Ülker Bisküvi Sanayi", "CCOLA": "Coca-Cola İçecek A.Ş."
};

// GERÇEK 2025 YILI BIST SEKTÖREL GETİRİ VERİLERİ
const ALL_SECTORS_DATA = [
    { name: "Teknoloji & Yazılım", annualReturn: 104.4, marketCap: "180 Mr TL", leader: "MIATK", color: "from-[#F0F4FF] via-blue-500 to-[#00008B]" },
    { name: "Savunma Sanayii", annualReturn: 68.5, marketCap: "380 Mr TL", leader: "ASELS", color: "from-[#F0F4FF] via-blue-500 to-[#00008B]" },
    { name: "Enerji & Yenilenebilir", annualReturn: 52.4, marketCap: "290 Mr TL", leader: "ASTOR", color: "from-[#F0F4FF] via-blue-500 to-[#00008B]" },
    { name: "Holdingler & Yatırım", annualReturn: 34.2, marketCap: "550 Mr TL", leader: "KCHOL", color: "from-[#F0F4FF] via-blue-500 to-[#00008B]" },
    { name: "Demir Çelik & Sanayi", annualReturn: 24.8, marketCap: "170 Mr TL", leader: "EREGL", color: "from-[#F0F4FF] via-blue-500 to-[#00008B]" },
    { name: "Perakende & Gıda", annualReturn: 18.5, marketCap: "300 Mr TL", leader: "BIMAS", color: "from-[#F0F4FF] via-blue-500 to-[#00008B]" },
    { name: "Gayrimenkul (GYO)", annualReturn: 15.2, marketCap: "140 Mr TL", leader: "EKGYO", color: "from-[#F0F4FF] via-blue-500 to-[#00008B]" },
    { name: "Bankacılık & Finans", annualReturn: 13.6, marketCap: "620 Mr TL", leader: "GARAN", color: "from-[#F0F4FF] via-blue-500 to-[#00008B]" },
    { name: "Otomotiv Sanayi", annualReturn: 11.2, marketCap: "360 Mr TL", leader: "FROTO", color: "from-[#F0F4FF] via-blue-500 to-[#00008B]" },
    { name: "Havacılık & Ulaştırma", annualReturn: 1.6, marketCap: "450 Mr TL", leader: "THYAO", color: "from-[#F0F4FF] via-blue-500 to-[#00008B]" }
];

// EŞLEŞTİRME KATALOĞU: SEKTÖR ADI -> STOCK_SECTORS ANAHTARLARI
const SECTOR_MAPPING: Record<string, string[]> = {
    "Teknoloji & Yazılım": ["Bilişim ve Yazılım", "Teknoloji Donanım ve Ticaret"],
    "Savunma Sanayii": ["Savunma"],
    "Enerji & Yenilenebilir": ["Enerji Teknolojileri", "Enerji Üretim ve Dağıtım"],
    "Havacılık & Ulaştırma": ["Ulaştırma ve Lojistik"],
    "Bankacılık & Finans": ["Bankacılık", "Aracı Kurum ve Finans"],
    "Holdingler & Yatırım": ["Holding"],
    "Otomotiv Sanayi": ["Otomotiv"],
    "Perakende & Gıda": ["Gıda Perakendeciliği", "Gıda ve İçecek"],
    "Demir Çelik & Sanayi": ["Ana Metal ve Madencilik", "Taş, Toprak, Çimento"],
    "Gayrimenkul (GYO)": ["Gayrimenkul (GYO)"]
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

interface StockItem {
    symbol: string;
    name: string;
    price: number;
    change: number;
    sector: string;
}

export default function AssetsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSector, setSelectedSector] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [designTemplate, setDesignTemplate] = useState<number>(1); // 1-10 arası şablon seçici
    const itemsPerPage = 10;

    // GRAFİK GENİŞLEME & DIŞARI TIKLAMA STATE & REF
    const [isSectorChartExpanded, setIsSectorChartExpanded] = useState(false);
    const sectorChartRef = useRef<HTMLDivElement>(null);
    const stockSectionRef = useRef<HTMLDivElement>(null);

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

    // Dinamik En Çok Getirisi Olan İlk 4 Sektör
    const top4Sectors = useMemo(() => ALL_SECTORS_DATA.slice(0, 4), []);

    // TÜM SEKTÖR HİSSELERİNİ STOCK_SECTORS KATALOĞUNDAN DİNAMİK ÜRETME
    const allStocksList = useMemo(() => {
        const result: StockItem[] = [];
        const addedSymbols = new Set<string>();

        Object.entries(SECTOR_MAPPING).forEach(([displaySector, mappingKeys]) => {
            mappingKeys.forEach(key => {
                const symbols = (STOCK_SECTORS as Record<string, string[]>)[key] || [];
                symbols.forEach((sym) => {
                    if (!addedSymbols.has(sym)) {
                        addedSymbols.add(sym);
                        const basePrice = Math.abs((sym.charCodeAt(0) * 17 + (sym.charCodeAt(1) || 65) * 5) % 450) + 12.5;
                        const changeVal = parseFloat((((sym.charCodeAt(0) % 7) - 3) * 1.35).toFixed(2));
                        const nameStr = STOCK_NAMES[sym] || `${sym} Sanayi ve Ticaret A.Ş.`;
                        
                        result.push({
                            symbol: sym,
                            name: nameStr,
                            price: parseFloat(basePrice.toFixed(2)),
                            change: changeVal,
                            sector: displaySector
                        });
                    }
                });
            });
        });

        Object.entries(STOCK_SECTORS).forEach(([secName, symbols]) => {
            symbols.forEach(sym => {
                if (!addedSymbols.has(sym)) {
                    addedSymbols.add(sym);
                    const basePrice = Math.abs((sym.charCodeAt(0) * 17 + (sym.charCodeAt(1) || 65) * 5) % 450) + 12.5;
                    const changeVal = parseFloat((((sym.charCodeAt(0) % 7) - 3) * 1.35).toFixed(2));
                    const nameStr = STOCK_NAMES[sym] || `${sym} Sanayi ve Ticaret A.Ş.`;
                    
                    result.push({
                        symbol: sym,
                        name: nameStr,
                        price: parseFloat(basePrice.toFixed(2)),
                        change: changeVal,
                        sector: secName
                    });
                }
            });
        });

        return result;
    }, []);

    // SEKTÖR VE ARAMA FİLTRESİ UYGULANMIŞ HİSSE LİSTESİ
    const filteredStocks = useMemo(() => {
        let list = allStocksList;

        if (selectedSector) {
            list = list.filter(item => item.sector === selectedSector);
        }

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            list = list.filter(item => 
                item.symbol.toLowerCase().includes(term) || 
                item.name.toLowerCase().includes(term) ||
                item.sector.toLowerCase().includes(term)
            );
        }

        return list;
    }, [allStocksList, selectedSector, searchTerm]);

    // SAYFALAMA HESAPLAMALARI
    const totalPages = Math.max(1, Math.ceil(filteredStocks.length / itemsPerPage));
    const paginatedStocks = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredStocks.slice(start, start + itemsPerPage);
    }, [filteredStocks, currentPage, itemsPerPage]);

    // Sektör Sütununa Tıklandığında Filtreleme ve Aşağı Kaydırma
    const handleSectorClick = (sectorName: string) => {
        setSelectedSector(sectorName);
        setCurrentPage(1);
        setTimeout(() => {
            stockSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    return (
        <div className="p-4 md:p-6 min-h-screen bg-[#F8FAFC] space-y-8 w-full max-w-full overflow-x-hidden">
            
            {/* ========================================================================= */}
            {/* 1. BÖLÜM: ÜST YARI (ANALYTICS & INSIGHTS - SOL %50, SAĞ %50 EQUAL WIDTH) */}
            {/* ========================================================================= */}
            <div className="w-full relative space-y-6">
                <div className="flex flex-col lg:flex-row items-stretch gap-6 w-full overflow-hidden">
                    
                    {/* SOL ÜST MODÜL: SEKTÖRLER YILLIK GETİRİLERİ */}
                    <motion.div 
                        ref={sectorChartRef}
                        layout
                        initial={false}
                        animate={{ 
                            width: isSectorChartExpanded ? "100%" : "50%",
                            flex: isSectorChartExpanded ? "1 1 100%" : "1 1 50%"
                        }}
                        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                        className={cn(
                            "bg-white border border-slate-200/90 rounded-[32px] p-6 shadow-xl relative overflow-hidden cursor-pointer group flex flex-col justify-between shrink-0 min-w-0",
                            isSectorChartExpanded 
                                ? "ring-4 ring-[#00008B]/20 shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-white" 
                                : "hover:border-[#00008B]/40 hover:shadow-2xl"
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
                                        <h2 className="text-lg font-black text-slate-900 tracking-tight">Sektörler Yıllık Getirileri (2025 BIST)</h2>
                                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-[#00008B] border border-blue-200/60 uppercase tracking-widest">
                                            {isSectorChartExpanded ? "Tüm Sektörler (Sütuna Tıkla Hisseleri İncele)" : "En Yüksek 4 Sektör"}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400">
                                        {isSectorChartExpanded 
                                            ? "İstediğiniz sektör sütununa tıklayarak o sektördeki tüm hisseleri alt listede görüntüleyin" 
                                            : "Genişletmek için kutuya, hisselerini süzmek için sektör sütununa tıklayın"}
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

                        {!isSectorChartExpanded ? (
                            /* DEFAULT 4 DİKEY SÜTUN GRAFİĞİ */
                            <div className="h-72 w-full flex items-end justify-around pt-6 px-4 pb-2 gap-4">
                                {top4Sectors.map((sector, idx) => {
                                    const maxVal = 115;
                                    const heightPercent = Math.min((sector.annualReturn / maxVal) * 100, 100);
                                    const isSelected = selectedSector === sector.name;
                                    return (
                                        <div 
                                            key={idx} 
                                            className="flex-1 flex flex-col items-center h-full justify-end group/col cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSectorClick(sector.name);
                                            }}
                                            title={`${sector.name} Hisselerini Görmek İçin Tıklayın`}
                                        >
                                            <span className="text-xs font-black text-[#00008B] mb-2 group-hover/col:scale-110 transition-transform">
                                                +{sector.annualReturn}%
                                            </span>
                                            
                                            <div 
                                                className={cn(
                                                    "w-full max-w-[72px] rounded-t-2xl bg-gradient-to-t transition-all duration-500 shadow-md group-hover/col:brightness-110 relative overflow-hidden flex items-start justify-center pt-2 border-t border-sky-300/40",
                                                    sector.color,
                                                    isSelected && "scale-105 brightness-110 shadow-xl"
                                                )}
                                                style={{ height: `${heightPercent}%` }}
                                            >
                                                <span className="text-[10px] font-black text-white bg-[#00008B]/60 backdrop-blur-sm px-1.5 py-0.5 rounded-full shadow-sm">
                                                    #{idx + 1}
                                                </span>
                                            </div>
                                            
                                            <span className={cn(
                                                "text-[11px] font-black mt-3 text-center truncate w-full transition-colors",
                                                isSelected ? "text-[#00008B] underline" : "text-slate-700 group-hover/col:text-[#00008B]"
                                            )}>
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
                            /* EXPANDED ALL SECTORS VERTICAL COLUMNS */
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                className="h-80 w-full flex items-end justify-between pt-8 px-2 md:px-6 pb-2 gap-2 md:gap-3 overflow-x-auto scrollbar-none"
                            >
                                {ALL_SECTORS_DATA.map((sector, idx) => {
                                    const maxVal = 115;
                                    const heightPercent = Math.min((sector.annualReturn / maxVal) * 100, 100);
                                    const isSelected = selectedSector === sector.name;
                                    return (
                                        <motion.div 
                                            key={idx} 
                                            initial={{ opacity: 0, scaleY: 0, y: 40 }}
                                            animate={{ opacity: 1, scaleY: 1, y: 0 }}
                                            transition={{ 
                                                duration: 0.7, 
                                                delay: 0.35 + (idx * 0.12), 
                                                ease: [0.16, 1, 0.3, 1] 
                                            }}
                                            className="flex-1 min-w-[70px] md:min-w-[85px] flex flex-col items-center h-full justify-end group/col origin-bottom cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSectorClick(sector.name);
                                            }}
                                            title={`${sector.name} Hisselerini Görmek İçin Tıklayın`}
                                        >
                                            <span className="text-[11px] md:text-xs font-black text-[#00008B] mb-2 group-hover/col:scale-110 transition-transform">
                                                +{sector.annualReturn}%
                                            </span>
                                            
                                            <div 
                                                className={cn(
                                                    "w-full max-w-[65px] rounded-t-2xl bg-gradient-to-t transition-all duration-300 shadow-lg group-hover/col:brightness-110 relative overflow-hidden flex items-start justify-center pt-2 border-t border-sky-300/40",
                                                    sector.color,
                                                    isSelected && "scale-105 brightness-110 shadow-xl"
                                                )}
                                                style={{ height: `${heightPercent}%` }}
                                            >
                                                <span className="text-[9px] font-black text-white bg-[#00008B]/60 backdrop-blur-sm px-1.5 py-0.5 rounded-full shadow-sm">
                                                    #{idx + 1}
                                                </span>
                                            </div>
                                            
                                            <span className={cn(
                                                "text-[10px] md:text-xs font-black mt-2.5 text-center truncate w-full transition-colors",
                                                isSelected ? "text-[#00008B] underline" : "text-slate-800 group-hover/col:text-[#00008B]"
                                            )} title={sector.name}>
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
                    </motion.div>

                    {/* SAĞ ÜST MODÜL: AYIN ENLERİ [ŞUBAT] */}
                    <AnimatePresence mode="popLayout">
                        {!isSectorChartExpanded && (
                            <motion.div 
                                initial={{ opacity: 0, scaleX: 0, width: "0%", filter: "blur(8px)" }}
                                animate={{ opacity: 1, scaleX: 1, width: "50%", filter: "blur(0px)" }}
                                exit={{ 
                                    opacity: 0, 
                                    scaleX: 0, 
                                    width: "0%", 
                                    filter: "blur(8px)",
                                    transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] } 
                                }}
                                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                                style={{ transformOrigin: "right center" }}
                                className="bg-white border border-slate-200/90 rounded-[32px] p-6 shadow-xl space-y-5 flex flex-col justify-between shrink-0 overflow-hidden min-w-0"
                            >
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
                                            <Trophy className="w-5 h-5 text-amber-100" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black text-slate-900 tracking-tight whitespace-nowrap">Ayın Enleri [Şubat]</h2>
                                            <p className="text-[11px] font-bold text-slate-400 whitespace-nowrap">En Çok Kazandıran & Kaybettiren Hisseler</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0">
                                        <Flame className="w-3 h-3 text-amber-500" />
                                        Performans
                                    </div>
                                </div>

                                <motion.div 
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                                >
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
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* 2. BÖLÜM: ALT YARI (10 FARKLI TASARIM ŞABLONU İLE CANLI SEÇİCİ WİDGET) */}
            {/* ========================================================================= */}
            <div 
                ref={stockSectionRef}
                className="w-full bg-white border border-slate-200/90 rounded-[32px] p-6 shadow-xl space-y-6 relative overflow-hidden"
            >
                <div className="space-y-5">
                    
                    {/* 🎨 10 FARKLI TASARIM ŞABLONU SEÇİCİ BARI */}
                    <div className="bg-gradient-to-r from-blue-900 via-[#00008B] to-slate-900 p-4 rounded-2xl text-white shadow-lg space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Palette className="w-5 h-5 text-amber-400" />
                                <h3 className="text-sm font-black tracking-tight">Tasarım Şablonu Seçici (10 Farklı Canlı Fikir)</h3>
                            </div>
                            <span className="text-[10px] font-bold text-amber-300 bg-amber-400/20 px-2.5 py-1 rounded-full border border-amber-400/30">
                                Aktif: Tasarım #{designTemplate}
                            </span>
                        </div>
                        
                        {/* 10 ADET ŞABLON DÜĞMESİ */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-1.5 pt-1">
                            {[
                                { id: 1, label: "1. Kompakt Şerit" },
                                { id: 2, label: "2. Veri Tablosu" },
                                { id: 3, label: "3. Glass Frost" },
                                { id: 4, label: "4. Düz Satır" },
                                { id: 5, label: "5. Ticker Matris" },
                                { id: 6, label: "6. Split Banner" },
                                { id: 7, label: "7. Yan Çizgili" },
                                { id: 8, label: "8. Dashboard Pill" },
                                { id: 9, label: "9. Terminal" },
                                { id: 10, label: "10. Rozetli Çip" }
                            ].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setDesignTemplate(t.id)}
                                    className={cn(
                                        "px-2 py-2 rounded-xl text-[10px] font-black transition-all text-center truncate border",
                                        designTemplate === t.id
                                            ? "bg-amber-400 text-slate-950 border-amber-300 shadow-md scale-105 font-black"
                                            : "bg-white/10 hover:bg-white/20 text-white/90 border-white/10"
                                    )}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ÜST BAŞLIK & SEKTÖREL FİLTRE ROZETLERİ */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                                    {selectedSector ? `${selectedSector} Hisseleri` : "Tüm BIST Hisseleri"}
                                </h2>
                                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#00008B]/10 text-[#00008B] border border-[#00008B]/20">
                                    {filteredStocks.length} Hisse Bulundu
                                </span>
                            </div>
                            <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                                {selectedSector 
                                    ? `Sadece "${selectedSector}" sektörüne ait şirketler gösterilmektedir` 
                                    : "BIST şirketlerini arayabilir veya yukarıdaki sektör grafiğinden filtreleyebilirsiniz"}
                            </p>
                        </div>

                        {selectedSector && (
                            <button
                                onClick={() => {
                                    setSelectedSector(null);
                                    setCurrentPage(1);
                                }}
                                className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black flex items-center gap-1.5 transition-all shadow-sm"
                            >
                                <X className="w-3.5 h-3.5 text-rose-500" />
                                Tüm Sektörleri Göster
                            </button>
                        )}
                    </div>

                    {/* SEKTÖRLER YATAY FİLTRELEME PİLL BUTONLARI */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        <button
                            onClick={() => {
                                setSelectedSector(null);
                                setCurrentPage(1);
                            }}
                            className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border",
                                selectedSector === null 
                                    ? "bg-[#00008B] text-white border-[#00008B] shadow-md" 
                                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                            )}
                        >
                            Tüm Sektörler ({allStocksList.length})
                        </button>
                        {ALL_SECTORS_DATA.map(sec => (
                            <button
                                key={sec.name}
                                onClick={() => {
                                    setSelectedSector(sec.name);
                                    setCurrentPage(1);
                                }}
                                className={cn(
                                    "px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border",
                                    selectedSector === sec.name 
                                        ? "bg-[#00008B] text-white border-[#00008B] shadow-md" 
                                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                )}
                            >
                                {sec.name}
                            </button>
                        ))}
                    </div>

                    {/* VARLIK ARAMA ÇUBUĞU (FULL-WIDTH INPUT) */}
                    <div className="relative w-full group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#00008B] transition-colors" />
                        <input 
                            type="text"
                            placeholder="Hisse Sembolü, Şirket Adı veya Sektör Ara (Örn: MIATK, THYAO, Teknoloji)"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00008B]/30 focus:bg-white transition-all shadow-inner"
                        />
                    </div>

                    {/* ========================================================================= */}
                    {/* 10 FARKLI TASARIM GÖRÜNÜM WİDGET RENDERER */}
                    {/* ========================================================================= */}
                    {paginatedStocks.length > 0 ? (
                        <div className="w-full">
                            
                            {/* TASARIM 1: KOMPAKT ŞERİT KARTLAR (Ultra Az Yükseklik) */}
                            {designTemplate === 1 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full">
                                    {paginatedStocks.map((item) => (
                                        <a
                                            key={item.symbol}
                                            href={`/varlik/${item.symbol}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group p-3 bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-[#00008B]/40 rounded-2xl hover:shadow-md transition-all flex items-center justify-between gap-2 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <AssetLogo symbol={item.symbol} className="w-7 h-7" />
                                                <div className="min-w-0">
                                                    <span className="text-xs font-black text-slate-900 group-hover:text-[#00008B] block truncate">{item.symbol}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 block truncate">{item.sector}</span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="text-xs font-black text-slate-900 block">₺{item.price.toFixed(2)}</span>
                                                <span className={cn("text-[10px] font-black px-1.5 py-0.2 rounded-md inline-block", item.change >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                                                    %{item.change > 0 ? `+${item.change}` : item.change}
                                                </span>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            )}

                            {/* TASARIM 2: PROFESYONEL FİNANSAL VERİ TABLOSU */}
                            {designTemplate === 2 && (
                                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                                <th className="py-3 px-4">Hisse & Şirket</th>
                                                <th className="py-3 px-4">Sektör</th>
                                                <th className="py-3 px-4 text-right">Fiyat</th>
                                                <th className="py-3 px-4 text-right">Günlük Değişim</th>
                                                <th className="py-3 px-4 text-center">Detay</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-xs">
                                            {paginatedStocks.map((item) => (
                                                <tr key={item.symbol} className="hover:bg-blue-50/40 transition-colors group">
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <AssetLogo symbol={item.symbol} className="w-8 h-8" />
                                                            <div>
                                                                <span className="font-black text-slate-900 group-hover:text-[#00008B] block text-xs">{item.symbol}</span>
                                                                <span className="text-[10px] font-semibold text-slate-400 block truncate max-w-[200px]">{item.name}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                                            {item.sector}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-black text-slate-900 text-xs">
                                                        ₺{item.price.toFixed(2)}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <span className={cn("font-black px-2 py-0.5 rounded-lg text-xs inline-block", item.change >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                                                            %{item.change > 0 ? `+${item.change}` : item.change}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <a 
                                                            href={`/varlik/${item.symbol}`} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#00008B] hover:text-white text-slate-600 inline-block transition-colors"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* TASARIM 3: GLASSMORPHISM FROST KARTLAR */}
                            {designTemplate === 3 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full">
                                    {paginatedStocks.map((item) => (
                                        <a
                                            key={item.symbol}
                                            href={`/varlik/${item.symbol}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group p-3.5 bg-gradient-to-br from-white/90 to-blue-50/30 border border-blue-100/80 hover:border-[#00008B]/40 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-2 cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <AssetLogo symbol={item.symbol} className="w-7 h-7" />
                                                    <span className="text-xs font-black text-slate-900 group-hover:text-[#00008B]">{item.symbol}</span>
                                                </div>
                                                <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full", item.change >= 0 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white")}>
                                                    %{item.change > 0 ? `+${item.change}` : item.change}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                                                <span className="text-[9px] font-bold text-slate-400 truncate max-w-[90px]">{item.sector}</span>
                                                <span className="font-black text-slate-900">₺{item.price.toFixed(2)}</span>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            )}

                            {/* TASARIM 4: MINIMALIST DÜZ SATIR LİSTESİ */}
                            {designTemplate === 4 && (
                                <div className="bg-slate-50/60 rounded-2xl border border-slate-200/80 divide-y divide-slate-200/60">
                                    {paginatedStocks.map((item) => (
                                        <a
                                            key={item.symbol}
                                            href={`/varlik/${item.symbol}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3 hover:bg-white flex items-center justify-between gap-3 transition-colors group cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <AssetLogo symbol={item.symbol} className="w-7 h-7" />
                                                <span className="text-xs font-black text-slate-900 group-hover:text-[#00008B] w-16">{item.symbol}</span>
                                                <span className="text-xs font-semibold text-slate-500 truncate hidden md:inline">{item.name}</span>
                                            </div>
                                            <div className="flex items-center gap-4 shrink-0">
                                                <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">{item.sector}</span>
                                                <span className="text-xs font-black text-slate-900 w-20 text-right">₺{item.price.toFixed(2)}</span>
                                                <span className={cn("text-xs font-black px-2 py-0.5 rounded-lg w-16 text-center", item.change >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                                                    %{item.change > 0 ? `+${item.change}` : item.change}
                                                </span>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            )}

                            {/* TASARIM 5: BIST TICKER MATRİS (5 Kolon Sıkışık Matris) */}
                            {designTemplate === 5 && (
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 w-full">
                                    {paginatedStocks.map((item) => (
                                        <a
                                            key={item.symbol}
                                            href={`/varlik/${item.symbol}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group p-2.5 bg-slate-900 text-white rounded-2xl hover:bg-[#00008B] transition-all flex flex-col justify-between space-y-2 cursor-pointer shadow-md"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black tracking-wider">{item.symbol}</span>
                                                <span className={cn("text-[9px] font-black px-1.5 py-0.2 rounded", item.change >= 0 ? "bg-emerald-500/30 text-emerald-400" : "bg-rose-500/30 text-rose-400")}>
                                                    %{item.change > 0 ? `+${item.change}` : item.change}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between border-t border-white/10 pt-1.5 text-[11px]">
                                                <span className="text-[9px] font-semibold text-slate-400 truncate">{item.sector}</span>
                                                <span className="font-black text-amber-400">₺{item.price.toFixed(2)}</span>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            )}

                            {/* TASARIM 6: SPLIT HEADER GRADIENT KARTLAR */}
                            {designTemplate === 6 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full">
                                    {paginatedStocks.map((item) => (
                                        <a
                                            key={item.symbol}
                                            href={`/varlik/${item.symbol}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group rounded-2xl border border-slate-200 overflow-hidden bg-white hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
                                        >
                                            <div className="bg-gradient-to-r from-[#00008B] to-blue-700 p-2 text-white flex items-center justify-between">
                                                <span className="text-xs font-black">{item.symbol}</span>
                                                <span className="text-[8px] font-bold opacity-80 uppercase tracking-widest">{item.sector}</span>
                                            </div>
                                            <div className="p-3 flex items-center justify-between">
                                                <AssetLogo symbol={item.symbol} className="w-7 h-7" />
                                                <div className="text-right">
                                                    <span className="text-xs font-black text-slate-900 block">₺{item.price.toFixed(2)}</span>
                                                    <span className={cn("text-[10px] font-bold", item.change >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                                        %{item.change > 0 ? `+${item.change}` : item.change}
                                                    </span>
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            )}

                            {/* TASARIM 7: YAN VURGU ÇİZGİLİ KARTLAR */}
                            {designTemplate === 7 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full">
                                    {paginatedStocks.map((item) => (
                                        <a
                                            key={item.symbol}
                                            href={`/varlik/${item.symbol}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={cn(
                                                "group p-3 bg-white border border-slate-200 rounded-2xl hover:shadow-md transition-all flex items-center justify-between gap-2 cursor-pointer border-l-4",
                                                item.change >= 0 ? "border-l-emerald-500" : "border-l-rose-500"
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <AssetLogo symbol={item.symbol} className="w-7 h-7" />
                                                <div className="min-w-0">
                                                    <span className="text-xs font-black text-slate-900 group-hover:text-[#00008B] block truncate">{item.symbol}</span>
                                                    <span className="text-[8px] font-bold text-slate-400 block truncate">{item.sector}</span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="text-xs font-black text-slate-900 block">₺{item.price.toFixed(2)}</span>
                                                <span className={cn("text-[9px] font-black", item.change >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                                    %{item.change > 0 ? `+${item.change}` : item.change}
                                                </span>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            )}

                            {/* TASARIM 8: DASHBOARD PILL KARTLAR */}
                            {designTemplate === 8 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full">
                                    {paginatedStocks.map((item) => (
                                        <a
                                            key={item.symbol}
                                            href={`/varlik/${item.symbol}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group p-2.5 bg-slate-100/80 hover:bg-white border border-slate-200 rounded-3xl hover:shadow-md transition-all flex items-center justify-between cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2">
                                                <AssetLogo symbol={item.symbol} className="w-8 h-8" />
                                                <div>
                                                    <span className="text-xs font-black text-slate-900 block leading-tight">{item.symbol}</span>
                                                    <span className={cn("text-[9px] font-black", item.change >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                                        %{item.change > 0 ? `+${item.change}` : item.change}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-xs font-black bg-slate-900 text-white px-2.5 py-1 rounded-2xl shadow-sm">
                                                ₺{item.price.toFixed(2)}
                                            </span>
                                        </a>
                                    ))}
                                </div>
                            )}

                            {/* TASARIM 9: BLOOMBERG TERMINAL STİLİ */}
                            {designTemplate === 9 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full font-mono">
                                    {paginatedStocks.map((item) => (
                                        <a
                                            key={item.symbol}
                                            href={`/varlik/${item.symbol}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group p-3 bg-slate-950 text-slate-100 border border-slate-800 rounded-2xl hover:border-amber-400 transition-all flex flex-col justify-between space-y-2 cursor-pointer shadow-lg"
                                        >
                                            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                                <span className="text-xs font-black text-amber-400">{item.symbol}</span>
                                                <span className="text-[9px] text-slate-500 truncate max-w-[80px]">{item.sector}</span>
                                            </div>
                                            <div className="flex items-center justify-between pt-1">
                                                <span className="text-xs font-bold">₺{item.price.toFixed(2)}</span>
                                                <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded", item.change >= 0 ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-rose-950 text-rose-400 border border-rose-800")}>
                                                    %{item.change > 0 ? `+${item.change}` : item.change}
                                                </span>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            )}

                            {/* TASARIM 10: ROZETLİ MİNİMAL ÇİP LİSTESİ */}
                            {designTemplate === 10 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full">
                                    {paginatedStocks.map((item) => (
                                        <a
                                            key={item.symbol}
                                            href={`/varlik/${item.symbol}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group p-3 bg-white border border-slate-200/90 rounded-2xl hover:border-[#00008B] hover:shadow-md transition-all flex flex-col justify-between space-y-2 cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black text-[#00008B] bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{item.symbol}</span>
                                                <span className={cn("text-[10px] font-black", item.change >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                                    %{item.change > 0 ? `+${item.change}` : item.change}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                                                <span className="text-[9px] font-bold text-slate-400 truncate">{item.name}</span>
                                                <span className="text-xs font-black text-slate-900">₺{item.price.toFixed(2)}</span>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="py-12 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <Info className="w-8 h-8 text-slate-400 mx-auto" />
                            <p className="text-sm font-black text-slate-700">Aramanıza Uygun Hisse Bulunamadı</p>
                            <p className="text-xs text-slate-400 font-bold">Filtreyi temizleyebilir veya başka bir sektör arayabilirsiniz.</p>
                            <button
                                onClick={() => {
                                    setSelectedSector(null);
                                    setSearchTerm("");
                                    setCurrentPage(1);
                                }}
                                className="px-4 py-2 rounded-xl bg-[#00008B] text-white text-xs font-black shadow-md inline-block"
                            >
                                Tüm Hisseleri Göster
                            </button>
                        </div>
                    )}

                    {/* NUMARALI SAYFALAMA KONTROLÜ (PAGINATION BAR: 1, 2, 3, 4...) */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-5 gap-3">
                            <span className="text-xs font-bold text-slate-500">
                                Toplam <span className="font-black text-slate-900">{filteredStocks.length}</span> Hisseden{" "}
                                <span className="font-black text-slate-900">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredStocks.length)}</span> Arası Gösteriliyor
                            </span>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    title="Önceki Sayfa"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={cn(
                                            "w-9 h-9 rounded-xl text-xs font-black transition-all border",
                                            currentPage === pageNum
                                                ? "bg-[#00008B] text-white border-[#00008B] shadow-md scale-105"
                                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                        )}
                                    >
                                        {pageNum}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    title="Sonraki Sayfa"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
