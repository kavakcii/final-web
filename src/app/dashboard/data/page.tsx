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
  ArrowUp,
  ArrowDown,
  Scale,
  Trophy,
  Award,
  Flame,
  ArrowDownRight,
  X,
  Maximize2,
  Minimize2,
  ExternalLink,
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { STOCK_SECTORS } from "@/lib/constants/assets-mapping";

// Şirket Amblem / Logo Bileşeni (Lokal public/logos Klasörü & Yerel BIST Şirket Amblemleri)
function AssetLogo({ symbol, className = "w-8 h-8" }: { symbol: string; className?: string }) {
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

    // 1. Yerel Proje Klasörü (public/logos/{symbol}) -> 2. Ekofin CDN -> 3. TradingView CDN
    const logoSources = [
        `/logos/${clean}.png`,
        `/logos/${clean}.jpeg`,
        `/logos/${clean}.jpg`,
        `/logos/${clean}.webp`,
        `/logos/${clean}.svg`,
        `https://cdn.ekofin.net/Logos/${clean}.png`,
        `https://cdn.ekofin.net/Front/${clean}.png`,
        `https://s3-symbol-logo.tradingview.com/${slug}--big.svg`,
        `https://s3-symbol-logo.tradingview.com/${slug}.svg`
    ];

    const currentSource = logoSources[imgIndex];

    const handleError = () => {
        if (imgIndex < logoSources.length - 1) {
            setImgIndex(prev => prev + 1);
        } else {
            setIsFailed(true);
        }
    };

    // Fotoğraftaki gibi lacivert/koyu yuvarlatılmış kare kutu amblem tasarımı (Ekofin / BIST stili)
    if (isFailed) {
        return (
            <div className={cn("rounded-xl bg-[#121826] border border-slate-800 text-white flex items-center justify-center font-black text-[9px] shrink-0 shadow-md", className)}>
                {clean.slice(0, 5)}
            </div>
        );
    }

    return (
        <div className={cn("rounded-xl bg-[#121826] border border-slate-800 p-1 flex items-center justify-center shrink-0 shadow-md overflow-hidden", className)}>
            <img 
                src={currentSource} 
                alt={clean} 
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                className="w-full h-full object-contain rounded-lg"
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
    volume: string;
    pe: number;
    high52: number;
    sector: string;
}

type SortField = 'symbol' | 'price' | 'change' | 'volume' | 'pe' | 'high52';
type SortOrder = 'asc' | 'desc';

export default function AssetsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSector, setSelectedSector] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<SortField>('change');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
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
                        const volVal = ((sym.charCodeAt(0) * 12.4 + 50) % 850 + 40).toFixed(1) + " Mr ₺";
                        const peVal = parseFloat(((sym.charCodeAt(0) % 18) + 4.2).toFixed(1));
                        const highVal = parseFloat((basePrice * 1.25).toFixed(2));
                        
                        result.push({
                            symbol: sym,
                            name: nameStr,
                            price: parseFloat(basePrice.toFixed(2)),
                            change: changeVal,
                            volume: volVal,
                            pe: peVal,
                            high52: highVal,
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
                    const volVal = ((sym.charCodeAt(0) * 12.4 + 50) % 850 + 40).toFixed(1) + " Mr ₺";
                    const peVal = parseFloat(((sym.charCodeAt(0) % 18) + 4.2).toFixed(1));
                    const highVal = parseFloat((basePrice * 1.25).toFixed(2));
                    
                    result.push({
                        symbol: sym,
                        name: nameStr,
                        price: parseFloat(basePrice.toFixed(2)),
                        change: changeVal,
                        volume: volVal,
                        pe: peVal,
                        high52: highVal,
                        sector: secName
                    });
                }
            });
        });

        return result;
    }, []);

    // SEKTÖR, ARAMA VE SIRALAMA UYGULANMIŞ HİSSE LİSTESİ
    const filteredStocks = useMemo(() => {
        let list = [...allStocksList];

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

        // Dinamik Sıralama
        list.sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];

            if (typeof valA === 'string') {
                return sortOrder === 'asc' 
                    ? (valA as string).localeCompare(valB as string)
                    : (valB as string).localeCompare(valA as string);
            }

            return sortOrder === 'asc' 
                ? (valA as number) - (valB as number)
                : (valB as number) - (valA as number);
        });

        return list;
    }, [allStocksList, selectedSector, searchTerm, sortField, sortOrder]);

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

    // Sıralama Değiştirme
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
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
                                            ? "İstediğiniz sektör sütununa tıklayarak o sektördeki tüm hisseleri alt tabloda görüntüleyin" 
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
            {/* 2. BÖLÜM: ALT YARI (SIRA SIRALANABİLİR PROFESYONEL VERİ TABLOSU - NO HORIZONTAL SCROLL) */}
            {/* ========================================================================= */}
            <div 
                ref={stockSectionRef}
                className="w-full bg-white border border-slate-200/90 rounded-[32px] p-5 md:p-6 shadow-xl space-y-5 relative"
            >
                <div className="space-y-4">
                    
                    {/* ÜST BAŞLIK & SEKTÖREL FİLTRE ROZETLERİ */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                                    {selectedSector ? `${selectedSector} Hisseleri` : "BIST Finansal Veri Tablosu"}
                                </h2>
                                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#00008B]/10 text-[#00008B] border border-[#00008B]/20">
                                    {filteredStocks.length} Şirket
                                </span>
                            </div>
                            <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                                Tablo başlıklarına tıklayarak Fiyat, Değişim, Hacim veya F/K oranına göre anında sıralama yapabilirsiniz.
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

                    {/* VARLIK ARAMA ÇUBUĞU */}
                    <div className="relative w-full group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#00008B] transition-colors" />
                        <input 
                            type="text"
                            placeholder="Hisse Sembolü veya Şirket Ara (Örn: MIATK, THYAO, ASELS)"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00008B]/30 focus:bg-white transition-all shadow-inner"
                        />
                    </div>

                    {/* ========================================================================= */}
                    {/* PROFESYONEL DERLİ TOPLU VERİ TABLOSU (YEREL AMBLEMLER & NO SCROLLBAR) */}
                    {/* ========================================================================= */}
                    {paginatedStocks.length > 0 ? (
                        <div className="w-full rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse table-fixed">
                                <thead>
                                    <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-wider select-none">
                                        
                                        {/* HİSSE & ŞİRKET */}
                                        <th 
                                            className="py-3 px-3 w-[26%] cursor-pointer hover:bg-slate-200/60 transition-colors"
                                            onClick={() => handleSort('symbol')}
                                        >
                                            <div className="flex items-center gap-1">
                                                <span>Hisse & Şirket</span>
                                                {sortField === 'symbol' ? (
                                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#00008B]" /> : <ArrowDown className="w-3 h-3 text-[#00008B]" />
                                                ) : <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />}
                                            </div>
                                        </th>

                                        {/* SEKTÖR */}
                                        <th className="py-3 px-2 w-[18%]">
                                            <span>Sektör</span>
                                        </th>

                                        {/* FİYAT */}
                                        <th 
                                            className="py-3 px-2 text-right w-[14%] cursor-pointer hover:bg-slate-200/60 transition-colors"
                                            onClick={() => handleSort('price')}
                                        >
                                            <div className="flex items-center justify-end gap-1">
                                                <span>Fiyat</span>
                                                {sortField === 'price' ? (
                                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#00008B]" /> : <ArrowDown className="w-3 h-3 text-[#00008B]" />
                                                ) : <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />}
                                            </div>
                                        </th>

                                        {/* GÜNLÜK DEĞİŞİM */}
                                        <th 
                                            className="py-3 px-2 text-right w-[15%] cursor-pointer hover:bg-slate-200/60 transition-colors"
                                            onClick={() => handleSort('change')}
                                        >
                                            <div className="flex items-center justify-end gap-1">
                                                <span>Değişim (%)</span>
                                                {sortField === 'change' ? (
                                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#00008B]" /> : <ArrowDown className="w-3 h-3 text-[#00008B]" />
                                                ) : <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />}
                                            </div>
                                        </th>

                                        {/* HACİM */}
                                        <th 
                                            className="py-3 px-2 text-right w-[14%] cursor-pointer hover:bg-slate-200/60 transition-colors hidden sm:table-cell"
                                            onClick={() => handleSort('volume')}
                                        >
                                            <div className="flex items-center justify-end gap-1">
                                                <span>Hacim</span>
                                                {sortField === 'volume' ? (
                                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#00008B]" /> : <ArrowDown className="w-3 h-3 text-[#00008B]" />
                                                ) : <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />}
                                            </div>
                                        </th>

                                        {/* F/K ORANI */}
                                        <th 
                                            className="py-3 px-2 text-right w-[8%] cursor-pointer hover:bg-slate-200/60 transition-colors hidden md:table-cell"
                                            onClick={() => handleSort('pe')}
                                        >
                                            <div className="flex items-center justify-end gap-1">
                                                <span>F/K</span>
                                                {sortField === 'pe' ? (
                                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#00008B]" /> : <ArrowDown className="w-3 h-3 text-[#00008B]" />
                                                ) : <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />}
                                            </div>
                                        </th>

                                        {/* İŞLEM / İNCELE */}
                                        <th className="py-3 px-2 text-center w-[5%]">
                                            <span>İncele</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {paginatedStocks.map((item, idx) => (
                                        <tr 
                                            key={item.symbol} 
                                            className={cn(
                                                "hover:bg-blue-50/60 transition-colors group cursor-pointer",
                                                idx % 2 === 1 && "bg-slate-50/40"
                                            )}
                                        >
                                            {/* HİSSE & ŞİRKET (LOCAL PUBLIC/LOGOS VE EKOFIN AMBLEM KAYNAĞI) */}
                                            <td className="py-2.5 px-3">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <AssetLogo symbol={item.symbol} className="w-8 h-8" />
                                                    <div className="min-w-0">
                                                        <a 
                                                            href={`/varlik/${item.symbol}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="font-black text-slate-900 group-hover:text-[#00008B] text-xs truncate block"
                                                        >
                                                            {item.symbol}
                                                        </a>
                                                        <span className="text-[10px] font-semibold text-slate-400 truncate block max-w-[170px]" title={item.name}>
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* SEKTÖR */}
                                            <td className="py-2.5 px-2">
                                                <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-blue-50 text-[#00008B] border border-blue-100 truncate block max-w-[130px]">
                                                    {item.sector}
                                                </span>
                                            </td>

                                            {/* FİYAT */}
                                            <td className="py-2.5 px-2 text-right font-black text-slate-900 text-xs">
                                                ₺{item.price.toFixed(2)}
                                            </td>

                                            {/* DEĞİŞİM */}
                                            <td className="py-2.5 px-2 text-right">
                                                <span className={cn(
                                                    "font-black px-2 py-0.5 rounded-lg text-xs inline-flex items-center gap-0.5",
                                                    item.change >= 0 
                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" 
                                                        : "bg-rose-50 text-rose-700 border border-rose-200/60"
                                                )}>
                                                    {item.change >= 0 ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : <TrendingDown className="w-3 h-3 text-rose-600" />}
                                                    %{item.change > 0 ? `+${item.change}` : item.change}
                                                </span>
                                            </td>

                                            {/* HACİM */}
                                            <td className="py-2.5 px-2 text-right text-xs font-bold text-slate-600 hidden sm:table-cell">
                                                {item.volume}
                                            </td>

                                            {/* F/K */}
                                            <td className="py-2.5 px-2 text-right text-xs font-bold text-slate-600 hidden md:table-cell">
                                                {item.pe}
                                            </td>

                                            {/* İŞLEM / İNCELE */}
                                            <td className="py-2.5 px-2 text-center">
                                                <a 
                                                    href={`/varlik/${item.symbol}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="p-1 rounded-lg bg-slate-100 group-hover:bg-[#00008B] group-hover:text-white text-slate-500 inline-block transition-colors"
                                                    title={`${item.symbol} Detaylarını Aç`}
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-4 gap-3">
                            <span className="text-xs font-bold text-slate-500">
                                Toplam <span className="font-black text-slate-900">{filteredStocks.length}</span> Şirketten{" "}
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
                                            "w-8 h-8 rounded-xl text-xs font-black transition-all border",
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
