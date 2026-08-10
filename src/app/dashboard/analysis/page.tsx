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
    Flame
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { DashboardAnalysisCards } from "@/components/DashboardAnalysisCards";
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

// Popüler Örnek Varlıklar
const POPULAR_ASSETS = [
    { symbol: "THYAO", name: "Türk Hava Yolları", type: "BIST" },
    { symbol: "ASELS", name: "Aselsan", type: "BIST" },
    { symbol: "MAC", name: "Marmara Capital Hisse Fonu", type: "TEFAS" },
    { symbol: "TUPRS", name: "Tüpraş", type: "BIST" },
    { symbol: "ALTIN", name: "Gram Altın", type: "Emtia" },
    { symbol: "EREGL", name: "Ereğli Demir Çelik", type: "BIST" },
    { symbol: "BIMAS", name: "BİM Mağazalar", type: "BIST" },
    { symbol: "USDTRY", name: "Dolar / TL", type: "Döviz" }
];

function AnalysisContent() {
    const searchParams = useSearchParams();
    const queryAsset = searchParams?.get('q') || null;
    const { user, globalNews } = useUser();

    const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
    const [selectedAssetDetails, setSelectedAssetDetails] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAnalysisData, setAiAnalysisData] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [tefasData, setTefasData] = useState<any | null>(null);

    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isValidSelection, setIsValidSelection] = useState(false);
    const [portfolioAssets, setPortfolioAssets] = useState<Asset[]>([]);
    const [abortController, setAbortController] = useState<AbortController | null>(null);

    // Haberler state'i (Analiz sayfasında gösterilecek ilgili haberler)
    const [relatedNews, setRelatedNews] = useState<any[]>([]);
    const [newsLoading, setNewsLoading] = useState(false);

    const FIN_LESSONS = [
        { title: "Portföy Çeşitlendirmesi", lines: ["Yatırım dünyasının temel prensibi olan çeşitlendirme, riskin farklı varlık sınıflarına (hisse senedi, tahvil, emtia vb.) dağıtılmasını ifade eder. Tek bir varlığa odaklanmak yerine dengeli bir sepet oluşturmak, piyasa dalgalanmalarına karşı portföyünüzün dayanıklılığını artırır ve uzun vadeli, sürdürülebilir getiri potansiyelini optimize eder."] },
        { title: "Piyasa Zamanlaması ve Trend Analizi", lines: ["Piyasa düşüşleri her zaman bir alım fırsatı olarak değerlendirilmemelidir; düşüş trendinin sonlandığına dair teknik ve temel göstergelerin teyidi beklenmelidir. 'Bıçak düşerken tutulmaz' prensibi gereği, fiyatların dengelenmesini beklemek ve ana trend yönünde işlem yapmak, sermaye koruma stratejisinin en kritik bileşenidir."] },
        { title: "Yatırımcı Psikolojisi ve Disiplin", lines: ["Yatırım kararlarında duygusal faktörlerin (FOMO, panik vb.) rolünü minimize etmek, başarılı bir stratejinin temelidir. Piyasa coşkusunun zirve yaptığı anlarda temkinli olmak, karamsarlığın hakim olduğu dönemlerde ise rasyonel fırsatları değerlendirmek gerekir. Veriye dayalı karar alma mekanizması, sürdürülebilir başarının anahtarıdır."] },
        { title: "Likidite Yönetimi", lines: ["Portföy yönetiminde nakit pozisyonunu korumak, olası kriz dönemlerinde stratejik manevra kabiliyeti sağlar. Piyasa belirsizliklerinin arttığı dönemlerde likit kalmak, hem varlık değerlerinizi korumanıza hem de piyasa diplerinde oluşabilecek cazip fırsatları değerlendirmenize olanak tanır."] },
        { title: "Uzun Vadeli Yatırım Perspektifi", lines: ["Finansal piyasalarda servet inşası, kısa vadeli spekülatif işlemlerden ziyade, uzun vadeli ve disiplinli bir strateji gerektirir. Bileşik getirinin gücünden faydalanmak için sabırlı olmak ve piyasadaki günlük gürültüden uzaklaşarak temel hedeflere odaklanmak, yatırımcının en büyük avantajıdır."] },
        { title: "Risk Yönetimi ve Stop-Loss", lines: ["Sermaye piyasalarında hayatta kalmanın birinci kuralı sermayeyi korumaktır. Stop-loss (zarar kes) mekanizmalarını aktif kullanmak, öngörülemeyen piyasa hareketlerinde kayıpları sınırlı tutar. Zararı erken realize etmek, daha büyük finansal yıkımların önüne geçer ve oyunda kalmanızı sağlar."] }
    ];
    
    const [lessonIndex, setLessonIndex] = useState(0);
    const [lessonOrder, setLessonOrder] = useState<number[]>(FIN_LESSONS.map((_, i) => i));

    // Arama önerilerini çekme
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm.length >= 1) {
                fetchSuggestions(searchTerm);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Analiz döngüsü ders değişimi
    useEffect(() => {
        if (!isAnalyzing) return;
        const t = setInterval(() => {
            setLessonIndex((prev) => (prev + 1) % lessonOrder.length);
        }, 12000);
        return () => clearInterval(t);
    }, [isAnalyzing, lessonOrder]);

    // Kullanıcı portföy varlıklarını yükleme
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

    // Haberleri getirme (Seçili varlığa veya genel piyasaya göre)
    const fetchRelatedNews = async (symbolToSearch?: string) => {
        setNewsLoading(true);
        try {
            const endpoint = user?.id ? `/api/news?userId=${user.id}` : `/api/news`;
            const res = await fetch(endpoint);
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                if (symbolToSearch) {
                    const clean = symbolToSearch.toUpperCase().replace('.IS', '');
                    const filtered = data.data.filter((item: any) => 
                        (item.title && item.title.toUpperCase().includes(clean)) ||
                        (item.description && item.description.toUpperCase().includes(clean)) ||
                        (item.symbol && item.symbol.toUpperCase().includes(clean))
                    );
                    setRelatedNews(filtered.length > 0 ? filtered.slice(0, 4) : data.data.slice(0, 4));
                } else {
                    setRelatedNews(data.data.slice(0, 4));
                }
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

    useEffect(() => {
        fetchRelatedNews(selectedAsset || undefined);
    }, [selectedAsset]);

    // URL parametresinden varlık gelirse otomatik analiz başlat
    useEffect(() => {
        if (queryAsset && !selectedAsset && !isAnalyzing) {
            setSearchTerm(queryAsset);
            handleAnalyze(queryAsset);
        }
    }, [queryAsset]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setIsValidSelection(false);
        setSelectedAssetDetails(null);
    };

    const fetchSuggestions = async (query: string) => {
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data.results) {
                setSuggestions(data.results);
                setShowSuggestions(true);
            }
        } catch (e) {
            console.error("Arama önerileri alınamadı", e);
        }
    };

    const handleAnalyze = async (overrideTerm?: string, overrideDetails?: any) => {
        const termToUse = (overrideTerm || searchTerm).trim();

        if (!termToUse) return;

        setIsAnalyzing(true);
        const controller = new AbortController();
        setAbortController(controller);

        const shuffled = [...FIN_LESSONS.map((_, i) => i)].sort(() => Math.random() - 0.5);
        setLessonOrder(shuffled);
        setLessonIndex(0);
        setSelectedAsset(termToUse);
        setAiAnalysisData(null);
        setTefasData(null);
        setError(null);

        const assetContext = overrideDetails || ((selectedAssetDetails && selectedAssetDetails.symbol === termToUse)
            ? selectedAssetDetails
            : null);

        // TEFAS fonu ise fon detaylarını getir
        if (assetContext && (assetContext.quoteType === 'MUTUALFUND' || assetContext.quoteType === 'ETF' || /^[A-Z]{3}$/.test(termToUse))) {
            try {
                const tefasCode = termToUse.replace('.IS', '');
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
                    assetName: termToUse,
                    assetContext: assetContext
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
            if (error.name === 'AbortError') {
                console.log('Analiz kullanıcı tarafından iptal edildi.');
                return;
            }
            console.error("Analiz isteği başarısız oldu", error);
            setError("Bir bağlantı hatası oluştu. Lütfen tekrar deneyin.");
        } finally {
            setIsAnalyzing(false);
            setAbortController(null);
        }
    };

    const displayEvents = aiAnalysisData?.analysis || (Array.isArray(aiAnalysisData) ? aiAnalysisData : []) || [];

    // Önerileri kategorilendirme
    const groupedSuggestions = suggestions.reduce((acc: any, curr: any) => {
        const type = curr.quoteType || 'OTHER';
        let category = 'Diğer Varlıklar';

        if (type === 'EQUITY') category = 'Borsa İstanbul Hisseleri';
        else if (type === 'MUTUALFUND' || type === 'ETF') category = 'Yatırım Fonları (TEFAS)';
        else if (type === 'CURRENCY' || type === 'COMMODITY') category = 'Döviz & Emtia';

        if (!acc[category]) acc[category] = [];
        acc[category].push(curr);
        return acc;
    }, {});

    const getIconForType = (type: string) => {
        switch (type) {
            case 'EQUITY': return <Building2 className="w-4 h-4 text-blue-600" />;
            case 'MUTUALFUND':
            case 'ETF': return <Landmark className="w-4 h-4 text-emerald-600" />;
            case 'COMMODITY': return <Coins className="w-4 h-4 text-amber-500" />;
            default: return <TrendingUp className="w-4 h-4 text-slate-500" />;
        }
    };

    // Benzersiz portföy sembolleri
    const uniquePortfolioSymbols = useMemo(() => {
        const map = new Map<string, Asset>();
        portfolioAssets.forEach(a => {
            if (!map.has(a.symbol)) {
                map.set(a.symbol, a);
            }
        });
        return Array.from(map.values());
    }, [portfolioAssets]);

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-white text-[#00008B] w-full mx-auto relative overflow-hidden">
            {/* Arka Plan Ambient Işıltısı */}
            <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] rounded-full bg-blue-50/60 blur-[130px] pointer-events-none" />
            <div className="absolute right-[-5%] top-[20%] w-[35%] h-[35%] rounded-full bg-indigo-50/40 blur-[120px] pointer-events-none" />

            {/* Analiz Yükleniyor Modalı (Finansal Okuryazarlık Kartı) */}
            <AnimatePresence>
                {isAnalyzing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md grid place-items-center p-4"
                    >
                        <div className="relative w-[min(620px,94vw)] overflow-hidden rounded-[2.5rem] bg-white border border-slate-100 p-8 md:p-10 shadow-2xl text-center">
                            {/* İptal Butonu */}
                            <button
                                onClick={() => {
                                    if (abortController) abortController.abort();
                                    setIsAnalyzing(false);
                                }}
                                className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all"
                                title="Analizi İptal Et"
                            >
                                <span className="sr-only">İptal Et</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>

                            <div className="relative z-10 flex flex-col items-center gap-6">
                                <div className="relative w-24 h-24 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-blue-100/50 rounded-full blur-xl animate-pulse" />
                                    <div className="relative z-10 w-20 h-20 flex items-center justify-center">
                                        <FinAiLogo showText={false} className="w-16 h-16 drop-shadow-md" />
                                    </div>
                                    <div className="absolute -inset-2 border-2 border-dashed border-[#00008B]/30 rounded-full animate-[spin_10s_linear_infinite]" />
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-[#00008B] flex items-center justify-center gap-2 tracking-tight">
                                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                        Yapay Zeka Varlığı İnceliyor...
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        Piyasa verileri, haberler ve olası senaryolar taranıyor
                                    </p>
                                </div>

                                {/* Bilgi Notu Kartı */}
                                <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 text-left relative overflow-hidden shadow-inner">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="px-3 py-1 rounded-full bg-[#00008B]/10 text-[#00008B] text-[10px] font-black uppercase tracking-wider">
                                            Finansal Okuryazarlık Notu #{lessonIndex + 1}
                                        </span>
                                    </div>
                                    <h4 className="text-base font-bold text-slate-900 mb-2">
                                        {FIN_LESSONS[lessonOrder[lessonIndex]].title}
                                    </h4>
                                    <p className="text-xs leading-relaxed text-slate-600">
                                        {FIN_LESSONS[lessonOrder[lessonIndex]].lines.join(" ")}
                                    </p>

                                    {/* Progress Bar */}
                                    <div className="absolute bottom-0 left-0 h-1 w-full bg-slate-200">
                                        <motion.div
                                            initial={{ width: "0%" }}
                                            animate={{ width: "100%" }}
                                            transition={{ duration: 12, ease: "linear", repeat: Infinity }}
                                            className="h-full bg-gradient-to-r from-[#00008B] to-blue-600"
                                        />
                                    </div>
                                </div>

                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                                    FinAi analiz motoru aktif
                                </p>
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
                                <span>FinAi Akıllı Analiz Motoru</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-[#00008B] tracking-tight">
                                Varlık Analiz Merkezi
                            </h1>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Merak ettiğiniz hisse, fon veya emtiayı arayın; yapay zekamız geçmiş dinamikleri, makro senaryoları ve güncel piyasa beklentilerini sizin için analiz etsin.
                            </p>
                        </div>

                        {/* Arama Inputu & Buton */}
                        <div className="w-full lg:w-[460px] relative">
                            <div className="flex gap-2">
                                <div className="relative flex-1 group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00008B] transition-colors z-10">
                                        <Search className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={handleInputChange}
                                        placeholder="Fon veya hisse arayın (Örn: THYAO, MAC, ASELS)..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-10 py-3.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00008B] focus:bg-white transition-all shadow-inner"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                if (suggestions.length > 0 && !isValidSelection && (suggestions[0].symbol.toUpperCase() === searchTerm.toUpperCase() || suggestions.length === 1)) {
                                                    const match = suggestions[0];
                                                    setSearchTerm(match.symbol);
                                                    setSelectedAssetDetails(match);
                                                    setIsValidSelection(true);
                                                    setShowSuggestions(false);
                                                    handleAnalyze(match.symbol, match);
                                                } else {
                                                    handleAnalyze();
                                                    setShowSuggestions(false);
                                                }
                                            }
                                        }}
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => {
                                                setSearchTerm("");
                                                setSelectedAsset(null);
                                                setSelectedAssetDetails(null);
                                                setAiAnalysisData(null);
                                                setError(null);
                                                setIsValidSelection(false);
                                            }}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 z-10 p-1"
                                        >
                                            ✕
                                        </button>
                                    )}

                                    {/* Arama Önerileri Açılır Menü */}
                                    <AnimatePresence>
                                        {showSuggestions && suggestions.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 8 }}
                                                className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-[380px] overflow-y-auto z-50 divide-y divide-slate-100 scrollbar-thin scrollbar-thumb-slate-200"
                                            >
                                                {Object.entries(groupedSuggestions).map(([category, items]: [string, any]) => (
                                                    <div key={category}>
                                                        <div className="px-4 py-2 bg-slate-50 text-[11px] font-bold text-[#00008B] uppercase tracking-wider sticky top-0 backdrop-blur-sm z-10 border-b border-slate-100">
                                                            {category}
                                                        </div>
                                                        {items.map((s: any, idx: number) => (
                                                            <div
                                                                key={idx}
                                                                className="px-4 py-2.5 hover:bg-blue-50/60 cursor-pointer text-slate-900 flex items-center gap-3 transition-colors group"
                                                                onClick={() => {
                                                                    setSearchTerm(s.symbol);
                                                                    setSelectedAssetDetails(s);
                                                                    setShowSuggestions(false);
                                                                    setIsValidSelection(true);
                                                                    handleAnalyze(s.symbol, s);
                                                                }}
                                                            >
                                                                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-[#00008B]/10 transition-colors shrink-0">
                                                                    {getIconForType(s.quoteType)}
                                                                </div>
                                                                <div className="flex flex-col min-w-0 flex-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold text-slate-900 text-xs group-hover:text-[#00008B] transition-colors">{s.symbol}</span>
                                                                    </div>
                                                                    <span className="text-[11px] text-slate-500 truncate">{s.shortname || s.longname}</span>
                                                                </div>
                                                                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-[#00008B] transition-colors" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <button
                                    onClick={() => handleAnalyze()}
                                    disabled={isAnalyzing || !searchTerm.trim()}
                                    className={`px-6 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 shrink-0 shadow-md ${
                                        searchTerm.trim()
                                            ? 'bg-[#00008B] hover:bg-blue-800 text-white shadow-blue-900/20 active:scale-95'
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    }`}
                                >
                                    {isAnalyzing ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            Analiz Et
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Hızlı Seçim Şeritleri */}
                    <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
                        {/* Portföyümden Hızlı Analiz */}
                        {uniquePortfolioSymbols.length > 0 && (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <div className="flex items-center gap-2 text-xs font-bold text-[#00008B] uppercase tracking-wider shrink-0">
                                    <Wallet className="w-4 h-4 text-blue-600" />
                                    <span>Portföyünüz:</span>
                                </div>
                                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                                    {uniquePortfolioSymbols.slice(0, 6).map((asset) => (
                                        <button
                                            key={asset.id || asset.symbol}
                                            onClick={() => {
                                                setSearchTerm(asset.symbol);
                                                handleAnalyze(asset.symbol);
                                            }}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 border ${
                                                selectedAsset === asset.symbol
                                                    ? 'bg-[#00008B] text-white border-[#00008B]'
                                                    : 'bg-slate-50 hover:bg-blue-50 text-slate-700 border-slate-200'
                                            }`}
                                        >
                                            <AssetLogo symbol={asset.symbol} className="w-4 h-4" />
                                            <span>{asset.symbol}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Popüler Varlıklar */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
                                <Flame className="w-4 h-4 text-amber-500" />
                                <span>Popüler:</span>
                            </div>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                                {POPULAR_ASSETS.map((pop) => (
                                    <button
                                        key={pop.symbol}
                                        onClick={() => {
                                            setSearchTerm(pop.symbol);
                                            handleAnalyze(pop.symbol);
                                        }}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 border ${
                                            selectedAsset === pop.symbol
                                                ? 'bg-[#00008B] text-white border-[#00008B]'
                                                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 shadow-sm'
                                        }`}
                                    >
                                        <span className="text-[#00008B] font-extrabold">{pop.symbol}</span>
                                        <span className="text-[10px] text-slate-400 font-normal">({pop.type})</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hata Bildirimi */}
                {error && !isAnalyzing && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-sm font-semibold shadow-sm"
                    >
                        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                        <p>{error}</p>
                    </motion.div>
                )}

                {/* TEFAS FONU DETAY KARTI */}
                {tefasData && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100"
                    >
                        {/* Header */}
                        <div className="bg-[#00008B] px-8 py-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="text-3xl font-black tracking-tight">{tefasData.symbol}</span>
                                    <span className="px-3 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                                        TEFAS Yatırım Fonu
                                    </span>
                                </div>
                                <p className="text-blue-100 text-xs font-medium">{tefasData.title}</p>
                            </div>

                            {tefasData.details?.find((d: any) => d.label.includes('Son Fiyat')) && (
                                <div className="text-right">
                                    <div className="text-[11px] text-blue-200 font-bold uppercase tracking-wider">Son Pay Fiyatı</div>
                                    <div className="text-3xl font-black text-white tracking-tight">
                                        {tefasData.details.find((d: any) => d.label.includes('Son Fiyat')).value} <span className="text-sm font-normal text-blue-200">TL</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Metrikler Grid */}
                        <div className="p-6 md:p-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 bg-slate-50/50">
                            {tefasData.details?.filter((d: any) => !d.label.includes('Son Fiyat')).map((detail: any, idx: number) => {
                                const isPositive = detail.value && !detail.value.includes('-') && (detail.label.includes('Getiri') || detail.label.includes('Değişim'));
                                const isNegative = detail.value && detail.value.includes('-') && (detail.label.includes('Getiri') || detail.label.includes('Değişim'));

                                return (
                                    <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">{detail.label}</span>
                                        <span className={`text-base font-black ${
                                            isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-slate-900'
                                        }`}>
                                            {detail.value || '-'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* ANALİZ SONUÇLARI (AI ANALİZİ VE DAĞILIM) */}
                {(aiAnalysisData?.topHoldings?.length > 0 || aiAnalysisData?.summary) && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                        {/* Sol Sütun: Varlık Dağılımı (5 Cols) */}
                        {aiAnalysisData?.topHoldings && aiAnalysisData.topHoldings.length > 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="lg:col-span-5 bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-2xl bg-blue-50 text-[#00008B]">
                                                <Layers className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-[#00008B]">Varlık Dağılımı</h3>
                                                <p className="text-xs text-slate-400">En ağırlıklı portföy bileşenleri</p>
                                            </div>
                                        </div>
                                        <span className="text-[11px] font-bold text-[#00008B] bg-blue-50 px-3 py-1 rounded-full">
                                            Top {aiAnalysisData.topHoldings.length}
                                        </span>
                                    </div>

                                    <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                                        {aiAnalysisData.topHoldings.map((holding: any, idx: number) => {
                                            const pct = holding.percent ? holding.percent.replace('%', '').replace(',', '.') : '0';
                                            return (
                                                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-blue-200 transition-all flex flex-col gap-2 group">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <AssetLogo symbol={holding.symbol} className="w-7 h-7" />
                                                            <div className="min-w-0">
                                                                <span className="font-bold text-slate-900 text-xs block group-hover:text-[#00008B] transition-colors">{holding.symbol}</span>
                                                                <span className="text-[10px] text-slate-400 truncate block max-w-[180px]">{holding.name}</span>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs font-black text-[#00008B] bg-white px-2.5 py-1 rounded-xl shadow-sm border border-slate-100">
                                                            {holding.percent}
                                                        </span>
                                                    </div>
                                                    {/* Progress Bar */}
                                                    <div className="h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-[#00008B] to-blue-500 rounded-full"
                                                            style={{ width: `${Math.min(Math.max(parseFloat(pct) || 0, 5), 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        ) : null}

                        {/* Sağ Sütun: AI Özeti & Beklentiler (7 Cols veya 12 Cols) */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`${aiAnalysisData?.topHoldings?.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'} bg-gradient-to-br from-[#00008B] via-blue-900 to-indigo-950 rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl flex flex-col justify-between relative overflow-hidden`}
                        >
                            <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                            
                            <div className="space-y-6 relative z-10">
                                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-2xl bg-white/10 text-blue-300 backdrop-blur-md">
                                            <Brain className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white tracking-tight">FinAi Piyasa Görünümü & Özeti</h3>
                                            <p className="text-xs text-blue-200/70">Gerçek zamanlı yapay zeka değerlendirmesi</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                                        Canlı Analiz
                                    </span>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                                    <p className="text-white/90 text-sm md:text-base leading-relaxed font-normal">
                                        {aiAnalysisData?.summary || "Bu varlık için güncel piyasa değerlendirmesi hazırlanmaktadır."}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-blue-200/60 relative z-10">
                                <span>Veri kaynağı: Yapay Zeka Sentezi & Piyasa Akışları</span>
                                <span>FinAi Analysis Engine v2.4</span>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* GEÇMİŞ OLAY / VAKA ANALİZİ */}
                {aiAnalysisData?.historicalEvent && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6"
                    >
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
                                <HistoryIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[#00008B]">Tarihsel Vaka İncelemesi</h3>
                                <p className="text-xs text-slate-400">Geçmişte yaşanan benzer piyasa hareketlerinde varlığın tepkisi</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                                        <th className="pb-3 pl-2 font-bold">Olay & Tarih</th>
                                        <th className="pb-3 px-4 font-bold">Neden & Gelişme</th>
                                        <th className="pb-3 pr-2 font-bold">Piyasa Sonucu</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs">
                                    <tr className="border-b border-slate-50">
                                        <td className="py-4 pl-2 pr-4 align-top text-slate-900 font-bold min-w-[160px]">
                                            {aiAnalysisData.historicalEvent.title}
                                            <div className="text-[11px] text-slate-400 mt-0.5 font-normal">{aiAnalysisData.historicalEvent.date}</div>
                                        </td>
                                        <td className="py-4 px-4 align-top text-slate-600 leading-relaxed border-l border-slate-100">
                                            {aiAnalysisData.historicalEvent.impact}
                                            {aiAnalysisData.historicalEvent.affectedAssets && (
                                                <div className="flex gap-1.5 flex-wrap mt-2.5">
                                                    {aiAnalysisData.historicalEvent.affectedAssets.map((asset: string, idx: number) => (
                                                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-semibold">
                                                            #{asset}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 pl-4 pr-2 align-top text-emerald-600 font-bold border-l border-slate-100 min-w-[160px]">
                                            {aiAnalysisData.historicalEvent.result}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* GELECEK SENARYOLARI VE ETKİ MATRİSİ */}
                {displayEvents.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-blue-50 text-[#00008B]">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[#00008B]">
                                    {aiAnalysisData ? "Gelecek Senaryoları & Olası Etki Matrisi" : "Yaklaşan Kritik Gelişmeler ve Senaryolar"}
                                </h2>
                                <p className="text-slate-400 text-xs">
                                    {aiAnalysisData
                                        ? "Bu varlığı etkileyebilecek olası gelişmeler ve piyasa yansımaları"
                                        : "Piyasa aktörlerinin radarındaki temel gelişmeler"}
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-6">
                            {displayEvents.map((event: any, idx: number) => (
                                <motion.div
                                    key={event.id || idx}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100"
                                >
                                    {/* Header */}
                                    <div className="bg-slate-50/80 px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-blue-600" />
                                            <h3 className="font-bold text-slate-900 text-base">{event.title || event.condition}</h3>
                                        </div>
                                        {event.date && (
                                            <span className="px-3 py-1 rounded-full bg-white text-slate-600 text-xs font-bold border border-slate-200">
                                                {event.date}
                                            </span>
                                        )}
                                    </div>

                                    {/* Body */}
                                    <div className="p-8 space-y-6">
                                        <p className="text-slate-600 text-sm leading-relaxed">
                                            {event.description || event.impact}
                                        </p>

                                        {event.scenarios && (
                                            <div className="grid md:grid-cols-2 gap-4">
                                                {event.scenarios.map((scenario: any, sIdx: number) => {
                                                    const sentiment = scenario.sentiment?.toLowerCase() || 'neutral';
                                                    let title = "Nötr Senaryo";
                                                    if (sentiment === 'positive') title = "Pozitif Beklenti";
                                                    if (sentiment === 'negative') title = "Negatif Beklenti";

                                                    return (
                                                        <div key={sIdx} className={`p-5 rounded-2xl border transition-all ${
                                                            sentiment === 'positive'
                                                                ? 'bg-emerald-50/60 border-emerald-100 hover:border-emerald-200'
                                                                : sentiment === 'negative'
                                                                    ? 'bg-red-50/60 border-red-100 hover:border-red-200'
                                                                    : 'bg-slate-50 border-slate-200'
                                                        }`}>
                                                            <h4 className={`font-bold text-xs uppercase tracking-wider mb-2 ${
                                                                sentiment === 'positive' ? 'text-emerald-800' :
                                                                sentiment === 'negative' ? 'text-red-800' : 'text-slate-800'
                                                            }`}>
                                                                {title}
                                                            </h4>
                                                            <p className={`text-xs leading-relaxed ${
                                                                sentiment === 'positive' ? 'text-emerald-700' :
                                                                sentiment === 'negative' ? 'text-red-700' : 'text-slate-600'
                                                            }`}>
                                                                <span className="font-bold block mb-1 text-slate-900">{scenario.condition}</span>
                                                                {scenario.impact}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {(event.relatedAssets || event.assetsAffected) && (
                                            <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2 items-center">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2">Etkilenen Varlıklar:</span>
                                                {(event.relatedAssets || event.assetsAffected).map((asset: string, aIdx: number) => (
                                                    <span key={aIdx} className="px-2.5 py-1 bg-slate-50 text-slate-700 text-xs rounded-xl font-bold border border-slate-200">
                                                        #{asset.toUpperCase()}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* İLGİLİ HABERLER & GÜNDEM WİDGET'I */}
                {relatedNews.length > 0 && (
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-blue-50 text-[#00008B]">
                                    <Newspaper className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[#00008B]">
                                        {selectedAsset ? `${selectedAsset} ile İlgili Son Gelişmeler` : "Piyasayı Etkileyen Önemli Haberler"}
                                    </h3>
                                    <p className="text-xs text-slate-400">Haber akışımızdan derlenen son başlıklar</p>
                                </div>
                            </div>
                            <Link 
                                href="/dashboard/news" 
                                className="text-xs font-bold text-[#00008B] hover:text-blue-600 flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200"
                            >
                                Tüm Haberler <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {relatedNews.map((newsItem: any, idx: number) => (
                                <div key={idx} className="p-5 rounded-2xl bg-slate-50/60 border border-slate-100 hover:border-blue-200 transition-all flex flex-col justify-between group">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                                            <span className="font-bold text-[#00008B]">{newsItem.source || "FinAi Haber"}</span>
                                            <span>{newsItem.timeAgo || "Bugün"}</span>
                                        </div>
                                        <h4 className="font-bold text-slate-900 text-xs md:text-sm line-clamp-2 group-hover:text-[#00008B] transition-colors">
                                            {newsItem.title}
                                        </h4>
                                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                            {newsItem.summary || newsItem.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* VARLIK SEÇİLMEDİĞİNDE GÖSTERİLEN MAKRO PİYASA KARTLARI */}
                {!selectedAsset && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-blue-50 text-[#00008B]">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[#00008B]">Genel Piyasa Görünümü & Makro Analiz</h2>
                                <p className="text-slate-400 text-xs">Altın, döviz ve emtialar için aylık görünüm ve beklenti raporları</p>
                            </div>
                        </div>

                        <DashboardAnalysisCards />
                    </div>
                )}

                {/* KORELASYON VE SEKTÖR ANALİZİ TEASER KARTI */}
                <div className="bg-gradient-to-r from-slate-900 to-[#00008B] rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="p-4 bg-white/10 rounded-2xl text-blue-300 backdrop-blur-md shrink-0">
                            <Scale className="w-8 h-8" />
                        </div>
                        <div className="space-y-1.5">
                            <h3 className="text-xl font-black tracking-tight text-white">Çoklu Varlık Korelasyon Analizi</h3>
                            <p className="text-xs md:text-sm text-blue-100/80 max-w-xl leading-relaxed">
                                Portföyünüzdeki varlıkların birbirleriyle ve makro piyasa değişkenleriyle (Dolar, Faiz, Enflasyon, Altın) olan ilişkisini matematiksel korelasyon matrisiyle inceleyin.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/dashboard/correlation-analysis"
                        className="px-6 py-3.5 bg-white hover:bg-blue-50 text-[#00008B] font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg flex items-center gap-2 shrink-0 relative z-10 active:scale-95"
                    >
                        Korelasyon Tablosunu Aç
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

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
