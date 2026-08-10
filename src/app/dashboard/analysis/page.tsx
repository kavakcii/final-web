"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { 
    ArrowRight, 
    Brain, 
    TrendingUp, 
    TrendingDown, 
    Scale, 
    Info, 
    Calendar, 
    AlertTriangle, 
    Search, 
    ChevronDown, 
    ExternalLink, 
    Newspaper, 
    Loader2, 
    Building2, 
    Landmark, 
    Coins, 
    DollarSign, 
    Euro, 
    Wallet, 
    History as HistoryIcon,
    Sparkles,
    ShieldCheck,
    Layers,
    Activity,
    ArrowUpRight,
    RefreshCw,
    CheckCircle2,
    Clock,
    Flame,
    HelpCircle,
    Globe,
    Zap,
    TrendingUp as TrendIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { PortfolioService, Asset } from "@/lib/portfolio-service";
import { useUser } from "@/components/providers/UserProvider";
import { FinAiLogo } from "@/components/ui/logo";
import Link from "next/link";

// Şirket Amblem / Logo Bileşeni
function AssetLogo({ symbol, className = "w-10 h-10" }: { symbol: string; className?: string }) {
    const clean = symbol.toUpperCase().replace('.IS', '').trim();
    const [imgIndex, setImgIndex] = useState(0);
    const [isFailed, setIsFailed] = useState(false);

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
            <div className={`rounded-full bg-gradient-to-br from-[#00008B] to-blue-700 text-white flex items-center justify-center font-black text-[10px] shrink-0 shadow-md ring-2 ring-slate-100 ${className}`}>
                {clean.slice(0, 4)}
            </div>
        );
    }

    return (
        <div className={`rounded-full bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm p-0.5 ring-2 ring-slate-100 ${className}`}>
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

// Önerilen & Popüler Varlık Kartları
const RECOMMENDED_ASSETS = [
    { symbol: "ALTIN", name: "Gram Altın", type: "Emtia / Değerli Maden", apiSymbol: "XAUUSD=X", unit: "TL", fallbackPrice: "3.045,50", change: "+1.42%", isPositive: true },
    { symbol: "GUMUS", name: "Gram Gümüş", type: "Emtia / Sanayi", apiSymbol: "XAGUSD=X", unit: "TL", fallbackPrice: "37,80", change: "+0.85%", isPositive: true },
    { symbol: "USDTRY", name: "Dolar / TL", type: "Döviz", apiSymbol: "USDTRY=X", unit: "₺", fallbackPrice: "36,45", change: "+0.12%", isPositive: true },
    { symbol: "EURTRY", name: "Euro / TL", type: "Döviz", apiSymbol: "EURTRY=X", unit: "₺", fallbackPrice: "38,15", change: "-0.24%", isPositive: false },
    { symbol: "THYAO", name: "Türk Hava Yolları", type: "BIST 30", apiSymbol: "THYAO.IS", unit: "₺", fallbackPrice: "312,50", change: "+2.15%", isPositive: true },
    { symbol: "ASELS", name: "Aselsan", type: "BIST 30", apiSymbol: "ASELS.IS", unit: "₺", fallbackPrice: "68,40", change: "+1.78%", isPositive: true },
    { symbol: "MAC", name: "Marmara Capital Hisse Fonu", type: "TEFAS", apiSymbol: "MAC", unit: "₺", fallbackPrice: "142,60", change: "+0.95%", isPositive: true },
    { symbol: "TUPRS", name: "Tüpraş", type: "BIST 30", apiSymbol: "TUPRS.IS", unit: "₺", fallbackPrice: "164,20", change: "-0.60%", isPositive: false }
];

function AnalysisContent() {
    const searchParams = useSearchParams();
    const queryAsset = searchParams?.get('q') || null;
    const { user, globalNews } = useUser();

    // Default olarak Altın ile başla veya query'den al
    const [selectedAsset, setSelectedAsset] = useState<string>("ALTIN");
    const [selectedAssetDetails, setSelectedAssetDetails] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAnalysisData, setAiAnalysisData] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [tefasData, setTefasData] = useState<any | null>(null);

    // Canlı Piyasa Fiyatları
    const [marketPrices, setMarketPrices] = useState<Record<string, any>>({});

    // Ekonomik Takvim
    const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
    const [calendarLoading, setCalendarLoading] = useState(false);

    // Haberler State'i
    const [relatedNews, setRelatedNews] = useState<any[]>([]);
    const [newsLoading, setNewsLoading] = useState(false);

    // Portföy Varlıkları
    const [portfolioAssets, setPortfolioAssets] = useState<Asset[]>([]);

    // Arama Önerileri
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isValidSelection, setIsValidSelection] = useState(false);
    const [abortController, setAbortController] = useState<AbortController | null>(null);

    const FIN_LESSONS = [
        { title: "Portföy Çeşitlendirmesi", lines: ["Yatırım dünyasının temel prensibi olan çeşitlendirme, riskin farklı varlık sınıflarına (hisse senedi, tahvil, emtia vb.) dağıtılmasını ifade eder. Altın gibi güvenli liman varlıkları portföyün dalgalanmalara karşı sigortasıdır."] },
        { title: "Piyasa Zamanlaması ve Trend Analizi", lines: ["Piyasa düşüşleri her zaman bir alım fırsatı olarak değerlendirilmemelidir; düşüş trendinin sonlandığına dair teknik ve temel göstergelerin teyidi beklenmelidir."] },
        { title: "Faiz ve Güvenli Liman İlişkisi", lines: ["Faizler düştüğünde faiz getirisi olmayan altının alternatif maliyeti azalır ve altın fiyatları yükseliş eğilimine girer. Jeopolitik krizler ise güvenli liman talebini tetikler."] }
    ];
    
    const [lessonIndex, setLessonIndex] = useState(0);

    // Canlı Piyasa Verilerini Çekme
    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const symbols = "XAUUSD=X,XAGUSD=X,USDTRY=X,EURTRY=X,THYAO.IS,ASELS.IS,TUPRS.IS,BIMAS.IS";
                const res = await fetch(`/api/finance?symbols=${symbols}`);
                const json = await res.json();
                if (json.results) {
                    const map: Record<string, any> = {};
                    json.results.forEach((r: any) => {
                        map[r.symbol] = r;
                    });
                    setMarketPrices(map);
                }
            } catch (e) {
                console.error("Fiyatlar alınamadı", e);
            }
        };
        fetchPrices();
    }, []);

    // Canlı Ekonomik Takvimi Çekme
    useEffect(() => {
        const fetchCalendar = async () => {
            setCalendarLoading(true);
            try {
                const res = await fetch('/api/calendar');
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    setCalendarEvents(data.data);
                }
            } catch (err) {
                console.error("Takvim yüklenemedi", err);
            } finally {
                setCalendarLoading(false);
            }
        };
        fetchCalendar();
    }, []);

    // Kullanıcı Portföy Varlıklarını Yükleme
    useEffect(() => {
        const loadPortfolio = async () => {
            try {
                const assets = await PortfolioService.getAssets();
                setPortfolioAssets(assets);
            } catch (error) {
                console.error("Portföy varlıkları yüklenemedi", error);
            }
        };
        loadPortfolio();
    }, [user]);

    // İlgili Haberleri Çekme
    const fetchRelatedNews = async (symbolToSearch: string) => {
        setNewsLoading(true);
        try {
            const endpoint = user?.id ? `/api/news?userId=${user.id}` : `/api/news`;
            const res = await fetch(endpoint);
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                const clean = symbolToSearch.toUpperCase().replace('.IS', '');
                let filtered = data.data.filter((item: any) => {
                    const text = `${item.title || ''} ${item.description || ''} ${item.symbol || ''}`.toUpperCase();
                    if (clean === 'ALTIN' || clean === 'XAU') {
                        return text.includes('ALTIN') || text.includes('FED') || text.includes('EMTİA') || text.includes('ENFLASYON') || text.includes('FAİZ');
                    }
                    return text.includes(clean);
                });

                if (filtered.length === 0) {
                    filtered = data.data; // Eşleşme yoksa genel önemli haberleri göster
                }
                setRelatedNews(filtered.slice(0, 4));
            } else if (globalNews && globalNews.length > 0) {
                setRelatedNews(globalNews.slice(0, 4));
            }
        } catch (err) {
            console.error("Analiz haberleri yüklenemedi", err);
            if (globalNews && globalNews.length > 0) {
                setRelatedNews(globalNews.slice(0, 4));
            }
        } finally {
            setNewsLoading(false);
        }
    };

    // Arama Önerileri
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchTerm.length >= 1) {
                try {
                    const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
                    const data = await res.json();
                    if (data.results) {
                        setSuggestions(data.results);
                        setShowSuggestions(true);
                    }
                } catch (e) {
                    console.error("Arama hatası", e);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Varlık Analizi Tetikleme
    const handleAnalyze = async (symbolToAnalyze: string, assetDetails?: any) => {
        const term = (symbolToAnalyze || searchTerm || "ALTIN").trim();
        if (!term) return;

        setIsAnalyzing(true);
        const controller = new AbortController();
        setAbortController(controller);

        setSelectedAsset(term);
        setError(null);
        setAiAnalysisData(null);
        setTefasData(null);

        // İlgili haberleri çek
        fetchRelatedNews(term);

        // TEFAS fonu kontrolü
        if (assetDetails?.quoteType === 'MUTUALFUND' || assetDetails?.quoteType === 'ETF' || /^[A-Z]{3}$/.test(term)) {
            try {
                const tefasCode = term.replace('.IS', '');
                const tefasRes = await fetch(`/api/tefas?code=${tefasCode}`);
                if (tefasRes.ok) {
                    const tefasJson = await tefasRes.json();
                    setTefasData(tefasJson);
                }
            } catch (e) {
                console.error("TEFAS verisi alınamadı", e);
            }
        }

        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assetName: term,
                    assetContext: assetDetails || selectedAssetDetails
                }),
                signal: controller.signal
            });
            const data = await res.json();

            if (data.success) {
                setAiAnalysisData(data.data);
            } else {
                setError(data.error || "Analiz tamamlanamadı. Lütfen tekrar deneyin.");
            }
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            console.error("Analiz hatası", error);
            setError("Bağlantı hatası oluştu. Analiz yenileniyor.");
        } finally {
            setIsAnalyzing(false);
            setAbortController(null);
        }
    };

    // İlk açılışta veya URL parametresi varsa analizi başlat
    useEffect(() => {
        const target = queryAsset || "ALTIN";
        setSelectedAsset(target);
        handleAnalyze(target);
    }, [queryAsset]);

    // Seçili varlık fiyat bilgisi
    const currentAssetInfo = useMemo(() => {
        const match = RECOMMENDED_ASSETS.find(a => a.symbol === selectedAsset);
        if (match) {
            const live = marketPrices[match.apiSymbol];
            if (live && live.regularMarketPrice) {
                return {
                    ...match,
                    price: `${live.regularMarketPrice.toFixed(2)} ${match.unit}`,
                    change: `${live.regularMarketChangePercent >= 0 ? '+' : ''}${live.regularMarketChangePercent.toFixed(2)}%`,
                    isPositive: live.regularMarketChangePercent >= 0
                };
            }
            return {
                ...match,
                price: `${match.fallbackPrice} ${match.unit}`,
                change: match.change,
                isPositive: match.isPositive
            };
        }
        return {
            symbol: selectedAsset,
            name: selectedAssetDetails?.longname || selectedAssetDetails?.shortname || selectedAsset,
            type: selectedAssetDetails?.typeDisp || "Yatırım Varlığı",
            price: "Piyasa Fiyatı",
            change: "Canlı",
            isPositive: true
        };
    }, [selectedAsset, marketPrices, selectedAssetDetails]);

    const displayEvents = aiAnalysisData?.analysis || [];

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-white text-[#00008B] w-full mx-auto relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] rounded-full bg-blue-50/60 blur-[130px] pointer-events-none" />
            <div className="absolute right-[-5%] top-[20%] w-[35%] h-[35%] rounded-full bg-indigo-50/40 blur-[120px] pointer-events-none" />

            {/* Analiz Yükleniyor Modalı */}
            <AnimatePresence>
                {isAnalyzing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md grid place-items-center p-4"
                    >
                        <div className="relative w-[min(620px,94vw)] overflow-hidden rounded-[2.5rem] bg-white border border-slate-100 p-8 md:p-10 shadow-2xl text-center">
                            <button
                                onClick={() => {
                                    if (abortController) abortController.abort();
                                    setIsAnalyzing(false);
                                }}
                                className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all"
                            >
                                ✕
                            </button>

                            <div className="flex flex-col items-center gap-6">
                                <div className="relative w-24 h-24 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-blue-100/50 rounded-full blur-xl animate-pulse" />
                                    <FinAiLogo showText={false} className="w-16 h-16 drop-shadow-md" />
                                    <div className="absolute -inset-2 border-2 border-dashed border-[#00008B]/30 rounded-full animate-[spin_10s_linear_infinite]" />
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-[#00008B] flex items-center justify-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                        {selectedAsset} Analiz Ediliyor...
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        Ekonomik takvim, haber akışları ve senaryolar taranıyor
                                    </p>
                                </div>

                                <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 text-left shadow-inner">
                                    <span className="px-3 py-1 rounded-full bg-[#00008B]/10 text-[#00008B] text-[10px] font-black uppercase tracking-wider">
                                        Finansal Okuryazarlık Notu
                                    </span>
                                    <h4 className="text-base font-bold text-slate-900 mt-2 mb-1">
                                        {FIN_LESSONS[lessonIndex].title}
                                    </h4>
                                    <p className="text-xs leading-relaxed text-slate-600">
                                        {FIN_LESSONS[lessonIndex].lines[0]}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ANA SAYFA İÇERİĞİ */}
            <div className="w-full max-w-[1600px] mx-auto px-6 py-8 md:px-10 lg:py-10 space-y-8 relative z-10 mb-20">
                
                {/* Header & Arama Alanı */}
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-10 shadow-sm relative overflow-hidden">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                        <div className="space-y-3 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00008B]/5 border border-[#00008B]/10 text-[#00008B] text-xs font-bold tracking-wider uppercase">
                                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                <span>FinAi Varlık Analiz Merkezi</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-[#00008B] tracking-tight">
                                Akıllı Varlık Analizi & Senaryo Matrisi
                            </h1>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                İstediğiniz varlığı seçin; anlık fiyatı, yapay zeka haber yorumu, ekonomik takvim etkileri (FED, TÜFE vb.) ve tarihsel kriz vaka incelemeleri tek ekranda önünüze gelsin.
                            </p>
                        </div>

                        {/* Arama Inputu */}
                        <div className="w-full lg:w-[460px] relative">
                            <div className="flex gap-2">
                                <div className="relative flex-1 group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00008B] transition-colors z-10">
                                        <Search className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Varlık veya hisse arayın (Örn: ALTIN, THYAO, MAC)..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-10 py-3.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00008B] focus:bg-white transition-all shadow-inner"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleAnalyze(searchTerm);
                                                setShowSuggestions(false);
                                            }
                                        }}
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm("")}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 z-10 p-1"
                                        >
                                            ✕
                                        </button>
                                    )}

                                    {/* Arama Önerileri Dropdown */}
                                    <AnimatePresence>
                                        {showSuggestions && suggestions.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 8 }}
                                                className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-[350px] overflow-y-auto z-50 divide-y divide-slate-100"
                                            >
                                                {suggestions.map((s: any, idx: number) => (
                                                    <div
                                                        key={idx}
                                                        className="px-4 py-2.5 hover:bg-blue-50/60 cursor-pointer text-slate-900 flex items-center justify-between transition-colors"
                                                        onClick={() => {
                                                            setSearchTerm(s.symbol);
                                                            setSelectedAssetDetails(s);
                                                            setShowSuggestions(false);
                                                            handleAnalyze(s.symbol, s);
                                                        }}
                                                    >
                                                        <div>
                                                            <span className="font-bold text-slate-900 text-xs block">{s.symbol}</span>
                                                            <span className="text-[11px] text-slate-400">{s.shortname || s.longname}</span>
                                                        </div>
                                                        <ArrowUpRight className="w-4 h-4 text-slate-300" />
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <button
                                    onClick={() => handleAnalyze(searchTerm)}
                                    disabled={isAnalyzing || !searchTerm.trim()}
                                    className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-[#00008B] hover:bg-blue-800 text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
                                >
                                    Analiz Et
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ÖNERİLEN & PORTFÖYÜMDEKİ VARLIKLARIN KARTLARI (HIZLI TIKLAMA) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-[#00008B] uppercase tracking-wider">
                            <Sparkles className="w-4 h-4 text-blue-600" />
                            <span>Önerilen ve Takip Edilen Varlık Kartları</span>
                        </div>
                        <span className="text-xs text-slate-400">Tek tıkla derin analizini açın</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {RECOMMENDED_ASSETS.map((asset) => {
                            const isSelected = selectedAsset === asset.symbol;
                            const livePrice = marketPrices[asset.apiSymbol]?.regularMarketPrice;
                            const liveChange = marketPrices[asset.apiSymbol]?.regularMarketChangePercent;
                            
                            const displayPrice = livePrice ? `${livePrice.toFixed(2)} ${asset.unit}` : `${asset.fallbackPrice} ${asset.unit}`;
                            const displayChange = liveChange !== undefined 
                                ? `${liveChange >= 0 ? '+' : ''}${liveChange.toFixed(2)}%`
                                : asset.change;
                            const isPos = liveChange !== undefined ? liveChange >= 0 : asset.isPositive;

                            return (
                                <motion.div
                                    key={asset.symbol}
                                    whileHover={{ y: -3 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleAnalyze(asset.symbol)}
                                    className={`p-5 rounded-[2rem] cursor-pointer transition-all border flex flex-col justify-between ${
                                        isSelected 
                                            ? 'bg-gradient-to-br from-[#00008B] to-blue-900 text-white border-[#00008B] shadow-lg shadow-blue-900/20 ring-2 ring-blue-400/40' 
                                            : 'bg-white hover:bg-slate-50/80 text-slate-900 border-slate-100 shadow-sm'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <AssetLogo symbol={asset.symbol} className="w-10 h-10" />
                                            <div>
                                                <h3 className={`font-black text-sm ${isSelected ? 'text-white' : 'text-[#00008B]'}`}>
                                                    {asset.symbol}
                                                </h3>
                                                <p className={`text-[11px] truncate max-w-[120px] ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                                                    {asset.name}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {asset.type}
                                        </span>
                                    </div>

                                    <div className="flex items-end justify-between pt-3 border-t border-slate-100/20">
                                        <div>
                                            <span className={`text-[10px] uppercase font-bold block ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>Fiyat</span>
                                            <span className={`text-base font-black tracking-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                                {displayPrice}
                                            </span>
                                        </div>
                                        <div className={`flex items-center gap-1 text-xs font-black px-2 py-1 rounded-xl ${
                                            isSelected 
                                                ? (isPos ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300')
                                                : (isPos ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600')
                                        }`}>
                                            {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                            {displayChange}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* SEÇİLEN VARLIK ÖZET BANNER'I */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <AssetLogo symbol={currentAssetInfo.symbol} className="w-16 h-16 shadow-md" />
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl md:text-3xl font-black text-[#00008B] tracking-tight">
                                    {currentAssetInfo.symbol}
                                </h2>
                                <span className="px-3 py-1 rounded-full bg-blue-50 text-[#00008B] text-xs font-bold uppercase tracking-wider">
                                    {currentAssetInfo.type}
                                </span>
                            </div>
                            <p className="text-slate-500 text-sm font-medium mt-1">
                                {currentAssetInfo.name}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 self-start md:self-auto bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                        <div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Güncel Fiyat</div>
                            <div className="text-2xl font-black text-[#00008B] tracking-tight">
                                {currentAssetInfo.price}
                            </div>
                        </div>
                        <div className="h-8 w-[1px] bg-slate-200" />
                        <div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Günlük Seyir</div>
                            <div className={`text-sm font-bold flex items-center gap-1 ${
                                currentAssetInfo.isPositive ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                                {currentAssetInfo.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                {currentAssetInfo.change}
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI GENEL ÖZETİ & HABER YORUMU KARTI */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    {/* Sol: FinAi Genel Görünüm ve Durum Özeti (6 Cols) */}
                    <div className="lg:col-span-6 bg-gradient-to-br from-[#00008B] via-blue-900 to-indigo-950 rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between pb-4 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-white/10 text-blue-300 backdrop-blur-md">
                                        <Brain className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white">{selectedAsset} Genel Durum Özeti</h3>
                                        <p className="text-xs text-blue-200/70">Yapay Zeka Destekli Stratejik Değerlendirme</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                                    Canlı Görünüm
                                </span>
                            </div>

                            <p className="text-white/90 text-sm md:text-base leading-relaxed font-normal bg-white/5 p-6 rounded-2xl border border-white/10">
                                {aiAnalysisData?.summary || `${selectedAsset} için piyasa verileri ve makro dinamikler taranmaktadır. Genel eğilim dengeli ve orta vadeli getiri potansiyelini korumaktadır.`}
                            </p>
                        </div>

                        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-blue-200/60 relative z-10 mt-6">
                            <span>FinAi Sentez Motoru</span>
                            <span>Risk Seviyesi: Dinamik</span>
                        </div>
                    </div>

                    {/* Sağ: Haberler Sayfası Entegrasyonu ve AI Haber Yorumu (6 Cols) */}
                    <div className="lg:col-span-6 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-blue-50 text-[#00008B]">
                                        <Newspaper className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[#00008B]">Son Haberler & FinAi Yorumu</h3>
                                        <p className="text-xs text-slate-400">Haber akışının varlık üzerindeki doğrudan etkisi</p>
                                    </div>
                                </div>
                                <Link 
                                    href="/dashboard/news" 
                                    className="text-xs font-bold text-[#00008B] hover:text-blue-600 flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200"
                                >
                                    Tüm Haberler <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>

                            {/* AI Haber Yorumu */}
                            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs leading-relaxed text-slate-800 font-medium">
                                <span className="font-bold text-[#00008B] block mb-1">💡 FinAi Haber Değerlendirmesi:</span>
                                {aiAnalysisData?.newsInterpretation || `${selectedAsset} ile ilgili son küresel gelişmeler, varlık üzerinde pozitif talep dalgası oluşturmaktadır.`}
                            </div>

                            {/* İlgili Haber Başlıkları */}
                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                {relatedNews.map((newsItem: any, idx: number) => (
                                    <div key={idx} className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/50 transition-colors border border-slate-100">
                                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                                            <span className="font-bold text-[#00008B]">{newsItem.source || "Piyasa Gündemi"}</span>
                                            <span>{newsItem.timeAgo || "Bugün"}</span>
                                        </div>
                                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                                            {newsItem.title}
                                        </h4>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* EKONOMİK TAKVİM & EĞİTİCİ AÇIKLAMA BÖLÜMÜ (FED, TÜFE VB.) */}
                <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-blue-50 text-[#00008B]">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[#00008B]">
                                    Ekonomik Takvim & {selectedAsset} Etki Analizi
                                </h3>
                                <p className="text-xs text-slate-400">Gelecek günlerde/haftalarda varlığı etkileyebilecek kritik makro olaylar</p>
                            </div>
                        </div>

                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            Canlı Takvim Akışı
                        </span>
                    </div>

                    {/* Eğitici Makro Açıklama Kutusu (Örn: Fed Faizi Nedir?) */}
                    {aiAnalysisData?.educationalConcept && (
                        <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-6 relative overflow-hidden">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-3 py-1 rounded-full bg-[#00008B] text-white text-[10px] font-black uppercase tracking-wider">
                                    Finansal Kavram Rehberi
                                </span>
                            </div>
                            <h4 className="text-base font-extrabold text-[#00008B] mb-2">
                                {aiAnalysisData.educationalConcept.title}
                            </h4>
                            <p className="text-xs text-slate-700 leading-relaxed mb-3">
                                {aiAnalysisData.educationalConcept.description}
                            </p>
                            <div className="text-[11px] font-bold text-blue-700 flex items-center gap-1">
                                <span>📌 Yatırımcı İçin Önemi:</span>
                                <span className="font-normal text-slate-600">{aiAnalysisData.educationalConcept.whyItMatters}</span>
                            </div>
                        </div>
                    )}

                    {/* Gelecek Senaryoları (Pozitif / Negatif Beklenti Kartları) */}
                    {displayEvents.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-500" />
                                Olası Gelecek Senaryoları & Piyasa Tepkisi (Eğer X olursa &rarr; Y olur)
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {displayEvents[0]?.scenarios?.map((scenario: any, sIdx: number) => {
                                    const isPositive = scenario.sentiment === 'positive';
                                    return (
                                        <div 
                                            key={sIdx}
                                            className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                                                isPositive 
                                                    ? 'bg-emerald-50/70 border-emerald-200' 
                                                    : 'bg-red-50/70 border-red-200'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                                        isPositive ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                                                    }`}>
                                                        {isPositive ? 'Pozitif Beklenti Senaryosu' : 'Negatif Beklenti Senaryosu'}
                                                    </span>
                                                </div>
                                                <h5 className={`font-bold text-sm mb-2 ${isPositive ? 'text-emerald-900' : 'text-red-900'}`}>
                                                    {scenario.condition}
                                                </h5>
                                                <p className={`text-xs leading-relaxed ${isPositive ? 'text-emerald-800' : 'text-red-800'}`}>
                                                    {scenario.impact}
                                                </p>
                                            </div>

                                            {scenario.assetsAffected && scenario.assetsAffected.length > 0 && (
                                                <div className="mt-4 pt-3 border-t border-black/5 flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-[10px] font-bold text-black/50">Etkilenenler:</span>
                                                    {scenario.assetsAffected.map((a: string, i: number) => (
                                                        <span key={i} className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-white text-slate-700 shadow-xs">
                                                            #{a}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Canlı Ekonomik Takvim Verileri */}
                    {calendarEvents.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Radarımızdaki Yaklaşan Makro Veriler (Canlı Akış)
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {calendarEvents.slice(0, 4).map((evt: any, idx: number) => (
                                    <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                                                <span>{evt.flag} {evt.country}</span>
                                                <span className="font-bold text-slate-700">{evt.time}</span>
                                            </div>
                                            <h6 className="font-bold text-xs text-slate-900 line-clamp-2">{evt.event}</h6>
                                        </div>
                                        <div className="mt-3 text-[11px] flex justify-between text-slate-500 font-medium">
                                            <span>Beklenti: <strong className="text-slate-800">{evt.forecast || '-'}</strong></span>
                                            <span>Önceki: <strong className="text-slate-800">{evt.previous || '-'}</strong></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* TARİHSEL VAKA İNCELEMESİ (JEOPOLİTİK KRİZ / SAVAŞ / ŞOK ÖRNEĞİ) */}
                {aiAnalysisData?.historicalEvent && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm space-y-6"
                    >
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                                <HistoryIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[#00008B]">
                                    Tarihsel Vaka İncelemesi & Kriz Tepkisi (Geçmiş Örnek)
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Küresel savaş, jeopolitik şoklar veya büyük faiz kararlarında {selectedAsset} nasıl davrandı?
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                                        <th className="pb-3 pl-2 font-bold">Tarihsel Olay</th>
                                        <th className="pb-3 px-4 font-bold">Kriz Gelişimi & Neden</th>
                                        <th className="pb-3 pr-2 font-bold">Varlık Tepkisi & Sonuç</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs">
                                    <tr className="border-b border-slate-50">
                                        <td className="py-4 pl-2 pr-4 align-top text-slate-900 font-black min-w-[180px]">
                                            {aiAnalysisData.historicalEvent.title}
                                            <div className="text-[11px] text-slate-400 mt-1 font-normal">
                                                {aiAnalysisData.historicalEvent.date}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 align-top text-slate-600 leading-relaxed border-l border-slate-100">
                                            {aiAnalysisData.historicalEvent.impact}
                                            {aiAnalysisData.historicalEvent.affectedAssets && (
                                                <div className="flex gap-1.5 flex-wrap mt-3">
                                                    {aiAnalysisData.historicalEvent.affectedAssets.map((asset: string, idx: number) => (
                                                        <span key={idx} className="text-[10px] px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold border border-slate-200">
                                                            #{asset}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 pl-4 pr-2 align-top text-emerald-600 font-black border-l border-slate-100 min-w-[180px] leading-relaxed">
                                            {aiAnalysisData.historicalEvent.result}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* Yasal Uyarı */}
                <div className="pt-6 border-t border-slate-100 text-center px-4">
                    <div className="flex items-center justify-center gap-2 mb-2 text-slate-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Yasal Uyarı</span>
                    </div>
                    <p className="text-[11px] text-slate-400 max-w-4xl mx-auto leading-relaxed">
                        Burada yer alan yatırım bilgi, yorum ve tavsiyeleri yatırım danışmanlığı kapsamında değildir. 
                        Yatırım kararlarınızı kendi risk ve getiri tercihlerinize göre değerlendirmeniz önerilir.
                    </p>
                </div>

            </div>
        </div>
    );
}

export default function AnalysisPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex items-center gap-3 text-[#00008B] font-bold text-sm">
                    <Loader2 className="w-6 h-6 animate-spin text-[#00008B]" />
                    Varlık Analiz Merkezi yükleniyor...
                </div>
            </div>
        }>
            <AnalysisContent />
        </Suspense>
    );
}
