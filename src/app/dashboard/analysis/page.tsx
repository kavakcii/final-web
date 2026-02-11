
"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Brain, Filter, TrendingUp, TrendingDown, Scale, Info, Calendar, AlertTriangle, Search, ChevronDown, ExternalLink, Newspaper, Loader2, Building2, Landmark, Coins } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Supported Assets for Filtering
const SUPPORTED_ASSETS = [
    { id: 'gold', name: 'Altın (XAU)', type: 'commodity' },
    { id: 'dxy', name: 'Dolar Endeksi (DXY)', type: 'currency' },
    { id: 'nasdaq', name: 'NASDAQ', type: 'index' },
    { id: 'aapl', name: 'Apple (AAPL)', type: 'stock' },
    { id: 'bist', name: 'BIST 100', type: 'index' },
    { id: 'oil', name: 'Petrol (Brent)', type: 'commodity' },
    { id: 'try', name: 'Türk Lirası', type: 'currency' }
];

// Mock Data for Analysis
const ANALYSIS_DATA = [
    {
        id: 1,
        title: "ABD Enflasyon Verisi (TÜFE)",
        date: "Bugün, 14:30",
        event: "ABD'de Tüketici Fiyat Endeksi (TÜFE) beklentilerin üzerinde (%3.4) açıklandı.",
        effect: "Fed'in faiz indirim sürecini erteleme ihtimali güçlendi. Piyasalarda risk iştahı azaldı.",
        result: [
            { asset: "Altın (XAU)", change: "Düşüş", detail: "Satış baskısı oluştu.", trend: "down" },
            { asset: "Dolar Endeksi (DXY)", change: "Yükseliş", detail: "Güç kazandı.", trend: "up" },
            { asset: "NASDAQ", change: "Düşüş", detail: "Teknoloji hisselerinde kar satışı.", trend: "down" }
        ],
        type: "macro",
        relatedAssets: ['gold', 'dxy', 'nasdaq', 'try']
    },
    {
        id: 2,
        title: "Apple (AAPL) Kazanç Raporu",
        date: "Dün, Kapanış Sonrası",
        event: "Apple 4. çeyrek gelirleri beklentileri aştı, ancak Çin satışlarında zayıflama sinyali verdi.",
        effect: "Yatırımcılar büyüme endişesiyle temkinli yaklaşıyor.",
        result: [
            { asset: "Apple (AAPL)", change: "Nötr/Negatif", detail: "Hisse fiyatı baskılandı.", trend: "down" },
            { asset: "Teknoloji Sektörü", change: "Dalgalı", detail: "Genel teknoloji fonlarında karışık seyir.", trend: "neutral" }
        ],
        type: "stock",
        relatedAssets: ['aapl', 'nasdaq']
    },
    {
        id: 3,
        title: "Petrol Arz Endişeleri",
        date: "Bu Sabah",
        event: "Orta Doğu'daki jeopolitik gerilimler nedeniyle petrol arzında aksama riski arttı.",
        effect: "Enerji maliyetlerinde artış beklentisi oluştu.",
        result: [
            { asset: "Brent Petrol", change: "Yükseliş", detail: "Fiyatlar 80$ üzerine çıktı.", trend: "up" },
            { asset: "Enerji Hisseleri", change: "Yükseliş", detail: "Pozitif ayrışma.", trend: "up" }
        ],
        type: "commodity",
        relatedAssets: ['oil']
    },
    {
        id: 4,
        title: "TCMB Faiz Kararı (Önceki Toplantı)",
        date: "Geçen Ay",
        event: "Merkez Bankası politika faizini beklentiler dahilinde 500 baz puan artırdı.",
        effect: "TL varlıklarda değerlenme eğilimi görüldü.",
        result: [
            { asset: "BIST 100", change: "Yükseliş", detail: "Bankacılık öncülüğünde ralli.", trend: "up" },
            { asset: "Türk Lirası", change: "Değer Kazancı", detail: "Dolar karşısında kısmi gevşeme.", trend: "up" }
        ],
        type: "macro",
        relatedAssets: ['bist', 'try']
    }
];

// Mock Data for Upcoming Events
const UPCOMING_EVENTS = [
    {
        id: 1,
        title: "Fed Faiz Kararı Toplantısı",
        date: "18 Mart 2026",
        description: "ABD Merkez Bankası'nın (Fed) faiz kararı ve ardından Başkan'ın yapacağı açıklamalar.",
        scenarios: [
            {
                condition: "Olası Faiz İndirimi Durumunda",
                impact: "Faiz indirimleri, teorik olarak mevduat getirisini düşürerek yatırımcıları alternatif araçlara yönlendirebilir. Bu durumda piyasalarda risk iştahının artmasıyla altın ve hisse senedi piyasalarında yukarı yönlü hareketler izlenebilir. Döviz kurlarında ise, faiz avantajının azalması sebebiyle gevşeme eğilimi oluşabilir.",
                sentiment: "positive",
                assetsAffected: ['gold', 'dxy', 'nasdaq', 'oil']
            },
            {
                condition: "Faizlerin Yüksek Kalması Durumunda",
                impact: "Faizlerin yüksek kalması, sabit getirili varlıklara olan ilgiyi canlı tutabilir. Bu senaryoda, riskli varlıklardan (hisse senedi, altın vb.) çıkışlar görülebilir ve güvenli liman arayışıyla Dolar endeksinde güçlenme eğilimi devam edebilir.",
                sentiment: "negative",
                assetsAffected: ['gold', 'dxy', 'nasdaq']
            }
        ],
        relatedAssets: ['gold', 'dxy', 'nasdaq', 'oil', 'try']
    },
    {
        id: 2,
        title: "TCMB Para Politikası Kurulu",
        date: "19 Mart 2026",
        description: "Türkiye Cumhuriyet Merkez Bankası'nın faiz kararı ve PPK metni.",
        scenarios: [
            {
                condition: "Faizlerin Artırılması Durumunda",
                impact: "Faiz artışı, TL varlıkların cazibesini artırarak döviz talebini sınırlandırabilir. Bu durumda kurlarda denge arayışı beklenebilir. Öte yandan, kredi maliyetlerinin artması şirketlerin finansman koşullarını zorlaştırabilir ve borsa üzerinde baskı oluşturabilir.",
                sentiment: "mixed",
                assetsAffected: ['bist', 'try']
            },
            {
                condition: "Faizlerin Düşürülmesi veya Aynı Kalması",
                impact: "Faizlerin düşük seyretmesi, enflasyonist beklentilerle birlikte yatırımcıları döviz ve altına yönlendirebilir. Şirketler açısından ise finansman maliyetlerinin düşük kalması, hisse senedi piyasaları için destekleyici bir unsur olarak değerlendirilebilir.",
                sentiment: "neutral",
                assetsAffected: ['bist', 'try', 'dxy']
            }
        ],
        relatedAssets: ['bist', 'try']
    },
    {
        id: 3,
        title: "Jeopolitik Gerilim: ABD - İran İlişkileri",
        date: "Güncel Gelişme",
        description: "Eski Başkan Trump'ın İran'a yönelik sert tehditleri ve olası askeri müdahale sinyalleri piyasalarda risk algısını artırıyor.",
        scenarios: [
            {
                condition: "Savaş veya Ciddi Bir Çatışma Çıkarsa",
                impact: "Jeopolitik risklerin tırmanması, küresel piyasalarda güvenli liman arayışını tetikleyebilir. Bu tür dönemlerde altın ve petrol fiyatlarında volatilite artışı ve yukarı yönlü hareketler görülebilir. Borsalarda ise riskten kaçış eğilimi baskın olabilir.",
                sentiment: "negative",
                assetsAffected: ['gold', 'oil', 'bist', 'nasdaq']
            },
            {
                condition: "Sadece Karşılıklı Tehditleşme Olursa",
                impact: "Gerilimin sadece söylem düzeyinde kalması durumunda, piyasalarda kısa vadeli dalgalanmalar yaşanabilir. Ancak risk algısının azalmasıyla birlikte fiyatlamaların normal seyrine dönmesi beklenebilir.",
                sentiment: "neutral",
                assetsAffected: ['gold', 'oil', 'dxy']
            }
        ],
        relatedAssets: ['gold', 'oil', 'bist', 'nasdaq', 'dxy']
    }
];

interface NewsItem {
    title: string;
    link: string;
    pubDate: string;
    source: string;
    description: string;
}

export default function AnalysisPage() {
    const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
    const [selectedAssetDetails, setSelectedAssetDetails] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAnalysisData, setAiAnalysisData] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loadingNews, setLoadingNews] = useState(true);
    const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
    const [tefasData, setTefasData] = useState<any | null>(null);

    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [isValidSelection, setIsValidSelection] = useState(false);

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

    // Reset validity when user types
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setIsValidSelection(false); // User is typing, selection is not valid yet
        setSelectedAssetDetails(null);
    };

    const fetchSuggestions = async (query: string) => {
        try {
            const res = await fetch(`/api/search?q=${query}`);
            const data = await res.json();
            if (data.results) {
                setSuggestions(data.results);
                setShowSuggestions(true);
            }
        } catch (e) {
            console.error("Suggestion fetch failed", e);
        }
    };

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await fetch('/api/news');
                const data = await res.json();
                if (data.success) {
                    setNews(data.news);
                }
            } catch (error) {
                console.error("News fetch failed", error);
            } finally {
                setLoadingNews(false);
            }
        };

        const fetchCalendar = async () => {
            try {
                const res = await fetch('/api/calendar');
                const data = await res.json();
                if (data.data) {
                    setCalendarEvents(data.data);
                }
            } catch (error) {
                console.error("Calendar fetch failed", error);
            }
        };

        fetchNews();
        fetchCalendar();
    }, []);

    const handleAnalyze = async (overrideTerm?: string, overrideDetails?: any) => {
        const termToUse = overrideTerm || searchTerm;

        if (!termToUse.trim()) return;

        setIsAnalyzing(true);
        setSelectedAsset(termToUse); // Use search term as the "selected asset" name
        setAiAnalysisData(null); // Clear previous data
        setTefasData(null); // Clear previous TEFAS data
        setError(null); // Clear previous errors

        // If the search term matches the selected details, use the details. 
        // Otherwise (if user typed manually after selecting), rely on just the term or clear details.
        const assetContext = overrideDetails || ((selectedAssetDetails && selectedAssetDetails.symbol === termToUse)
            ? selectedAssetDetails
            : null);

        // Fetch TEFAS data if it's a fund
        if (assetContext && (assetContext.quoteType === 'MUTUALFUND' || assetContext.quoteType === 'ETF')) {
            try {
                // Remove .IS suffix if present for TEFAS lookup
                const tefasCode = termToUse.replace('.IS', '');
                const tefasRes = await fetch(`/api/tefas?code=${tefasCode}`);
                if (tefasRes.ok) {
                    const tefasJson = await tefasRes.json();
                    setTefasData(tefasJson);
                }
            } catch (e) {
                console.error("TEFAS fetch failed", e);
            }
        }

        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assetName: termToUse,
                    assetContext: assetContext
                })
            });
            const data = await res.json();

            if (data.success) {
                setAiAnalysisData(data.data);
            } else {
                setError(data.error || "Analiz yapılamadı. Lütfen tekrar deneyin.");
            }
        } catch (error) {
            console.error("Analysis failed", error);
            setError("Bir bağlantı hatası oluştu. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Filter logic
    // If AI data exists, we don't show the static past events (unless we want to keep them generic)
    // For now, let's hide static past events if we have a custom search, as they won't match.
    const filteredAnalysis = selectedAsset && !aiAnalysisData
        ? ANALYSIS_DATA.filter(item => item.relatedAssets.includes(selectedAsset))
        : !selectedAsset ? ANALYSIS_DATA : [];

    // Use AI data if available, otherwise fallback to static events
    const displayEvents = (aiAnalysisData?.analysis || (Array.isArray(aiAnalysisData) ? aiAnalysisData : [])) || (selectedAsset
        ? UPCOMING_EVENTS.filter(item => item.relatedAssets.includes(selectedAsset))
        : UPCOMING_EVENTS);

    const selectedAssetName = selectedAsset || "Bir Varlık Seçin (Örn: Altın)";

    // Group suggestions by category
    const groupedSuggestions = suggestions.reduce((acc: any, curr: any) => {
        const type = curr.quoteType || 'OTHER';
        let category = 'Diğer';

        if (type === 'EQUITY') category = 'Hisse Senetleri';
        else if (type === 'MUTUALFUND' || type === 'ETF') category = 'Yatırım Fonları';

        if (!acc[category]) acc[category] = [];
        acc[category].push(curr);
        return acc;
    }, {});

    const getIconForType = (type: string) => {
        // Simplified icons to match clean list look
        switch (type) {
            case 'EQUITY': return <Building2 className="w-5 h-5 text-blue-400" />;
            case 'MUTUALFUND':
            case 'ETF': return <Landmark className="w-5 h-5 text-green-400" />;
            default: return <TrendingUp className="w-5 h-5 text-slate-400" />;
        }
    };

    return (
        <div className="p-8 space-y-8 min-h-full pb-20">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Brain className="w-8 h-8 text-blue-500" />
                            Varlık Analiz Merkezi
                        </h1>
                        <p className="text-slate-400 mt-2 max-w-2xl">
                            Merak ettiğiniz varlığı yazın, yapay zekamız geçmişteki etkileşimleri ve gelecekteki olası senaryoları sizin için analiz etsin.
                        </p>
                    </div>

                    {/* Asset Input */}
                    <div className="relative w-full md:w-96 z-20 flex gap-2">
                        <div className="relative flex-1 group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors z-10">
                                <Search className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleInputChange}
                                placeholder="Fon veya hisse arayın (Örn: MAC, THYAO)..."
                                className={`w-full bg-slate-900 border ${!isValidSelection && searchTerm.length > 2 ? 'border-yellow-500/50' : 'border-white/10'} rounded-xl pl-10 pr-10 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors`}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        // Auto-select first suggestion if matches perfectly or is the only one
                                        if (suggestions.length > 0 && !isValidSelection && (suggestions[0].symbol.toUpperCase() === searchTerm.toUpperCase() || suggestions.length === 1)) {
                                            const match = suggestions[0];
                                            setSearchTerm(match.symbol);
                                            setSelectedAssetDetails(match);
                                            setIsValidSelection(true);
                                            setShowSuggestions(false);
                                            // Immediately trigger analysis
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
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white z-10"
                                >
                                    ✕
                                </button>
                            )}

                            {/* Suggestions Dropdown - styled like user request */}
                            <AnimatePresence>
                                {showSuggestions && suggestions.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-full left-0 right-0 mt-2 bg-black border border-white/10 rounded-xl shadow-2xl max-h-[400px] overflow-y-auto z-50 divide-y divide-white/5 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                                    >
                                        {Object.entries(groupedSuggestions).map(([category, items]: [string, any]) => (
                                            <div key={category}>
                                                <div className="px-4 py-2 bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider sticky top-0 backdrop-blur-sm z-10 border-b border-white/5">
                                                    {category}
                                                </div>
                                                {items.map((s: any, idx: number) => (
                                                    <div
                                                        key={idx}
                                                        className="px-4 py-2 hover:bg-white/10 cursor-pointer text-white flex items-center gap-3 transition-colors group relative"
                                                        onClick={() => {
                                                            setSearchTerm(s.symbol);
                                                            setSelectedAssetDetails(s);
                                                            setShowSuggestions(false);
                                                            setIsValidSelection(true);
                                                            // Immediately trigger analysis with selected asset
                                                            handleAnalyze(s.symbol, s);
                                                        }}
                                                    >
                                                        {/* Icon Container - More Compact */}
                                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors shrink-0">
                                                            {getIconForType(s.quoteType)}
                                                        </div>

                                                        {/* Info - Clean Row Layout */}
                                                        <div className="flex flex-col min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">{s.symbol}</span>
                                                            </div>
                                                            <span className="text-xs text-slate-400 truncate group-hover:text-slate-300 transition-colors">{s.shortname || s.longname}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button
                            id="analyze-btn"
                            onClick={() => handleAnalyze()}
                            disabled={isAnalyzing || !searchTerm.trim()}
                            className={`px-6 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg ${searchTerm.trim() ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20 hover:scale-105' : 'bg-slate-800 text-slate-500'
                                }`}
                        >
                            {isAnalyzing ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Analiz Et
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {selectedAsset && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-3"
                    >
                        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-200">
                            Şu anda <span className="font-bold text-white">{selectedAsset}</span> için yapay zeka destekli analiz sonuçlarını görüntülüyorsunuz.
                        </p>
                    </motion.div>
                )}
            </div>

            {/* TEFAS Data Card - Modern Navy & White Design */}
            {tefasData && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 mb-8"
                >
                    {/* Header - Navy Blue */}
                    <div className="bg-[#0f172a] px-8 py-6 relative overflow-hidden">
                        {/* Abstract Stripes Pattern */}
                        <div className="absolute top-0 right-0 w-64 h-full opacity-10"
                            style={{
                                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ffffff 10px, #ffffff 20px)'
                            }}
                        />

                        <div className="relative z-10 flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-3xl font-bold text-white tracking-tight">{tefasData.symbol}</span>
                                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">TEFAS Fonu</span>
                                </div>
                                <h3 className="text-slate-300 text-sm font-medium tracking-wide">{tefasData.title}</h3>
                            </div>
                            <div className="text-right">
                                {tefasData.details.find((d: any) => d.label.includes('Son Fiyat')) && (
                                    <>
                                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Son Fiyat</div>
                                        <div className="text-4xl font-bold text-white tracking-tighter">
                                            {tefasData.details.find((d: any) => d.label.includes('Son Fiyat')).value} <span className="text-lg text-slate-400 font-normal">TL</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Body - White with Clean Grid */}
                    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-8 bg-white">
                        {tefasData.details.filter((d: any) => !d.label.includes('Son Fiyat')).map((detail: any, idx: number) => (
                            <div key={idx} className="flex flex-col border-l-2 border-slate-100 pl-4">
                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{detail.label}</span>
                                <span className={`text-lg font-bold ${detail.label.includes('Getiri')
                                    ? detail.value.includes('-') ? 'text-red-600' : 'text-emerald-600'
                                    : 'text-slate-800'
                                    }`}>
                                    {detail.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Top Holdings Section (AI Generated) */}
            {aiAnalysisData?.topHoldings && aiAnalysisData.topHoldings.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 mb-8"
                >
                    <div className="bg-[#0f172a] px-8 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Coins className="w-6 h-6 text-yellow-400" />
                            Tahmini Fon Dağılımı (Top 5 Hisse)
                        </h3>
                        <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded border border-yellow-500/30">
                            Yapay Zeka Tahmini
                        </span>
                    </div>
                    <div className="p-0">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-3">Hisse Senedi</th>
                                    <th className="px-6 py-3">Şirket Adı</th>
                                    <th className="px-6 py-3 text-right">Tahmini Ağırlık</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {aiAnalysisData.topHoldings.map((holding: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800">{holding.symbol}</td>
                                        <td className="px-6 py-4 text-slate-600">{holding.name}</td>
                                        <td className="px-6 py-4 text-right font-bold text-blue-600">{holding.percent}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            Bu veriler yapay zeka tarafından fon stratejisine göre tahmin edilmiştir. Kesin portföy dağılımı için KAP bildirimlerini kontrol ediniz.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Economic Calendar Section - Striped Table */}
            {!selectedAsset && calendarEvents.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-orange-400" />
                        Ekonomik Takvim (Yaklaşan Veriler)
                    </h2>
                    <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-slate-700">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-white uppercase bg-[#0f172a]">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold tracking-wider">Saat</th>
                                        <th className="px-6 py-4 font-semibold tracking-wider">Ülke</th>
                                        <th className="px-6 py-4 font-semibold tracking-wider">Olay</th>
                                        <th className="px-6 py-4 font-semibold tracking-wider">Beklenen / Önceki</th>
                                        <th className="px-6 py-4 font-semibold tracking-wider">Etki</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {calendarEvents.slice(0, 5).map((event: any, idx: number) => (
                                        <tr key={idx} className={`transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                                            <td className="px-6 py-4 font-bold text-slate-900">{event.time}</td>
                                            <td className="px-6 py-4 text-slate-600">{event.country}</td>
                                            <td className="px-6 py-4 text-slate-800 font-medium">{event.event}</td>
                                            <td className="px-6 py-4 text-slate-500">{event.actual || '-'} / {event.previous}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${event.impact === 'high' || event.impact === 'critical' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                    event.impact === 'medium' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                                        'bg-green-100 text-green-700 border border-green-200'
                                                    }`}>
                                                    {event.impact === 'high' || event.impact === 'critical' ? 'Yüksek' :
                                                        event.impact === 'medium' ? 'Orta' : 'Düşük'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Past Events Section (Only show if no AI data or if generic) */}
            {filteredAnalysis.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                        Geçmiş Etkileşimler
                    </h2>
                    {/* ... (Existing Past Events Mapping) ... */}
                    <div className="grid gap-6">
                        {filteredAnalysis.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-xl overflow-hidden shadow-lg border border-slate-200"
                            >
                                <div className="bg-[#1e293b] px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-0.5">{item.title}</h3>
                                        <p className="text-xs text-slate-400">{item.date}</p>
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-white border border-white/10">
                                        {item.type === 'macro' ? 'Makroekonomi' : item.type === 'stock' ? 'Hisse Senedi' : 'Emtia'}
                                    </div>
                                </div>

                                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                                    <div className="hidden md:block absolute top-1/2 left-1/3 w-8 h-[2px] bg-slate-200 -translate-y-1/2 -ml-4" />
                                    <div className="hidden md:block absolute top-1/2 right-1/3 w-8 h-[2px] bg-slate-200 -translate-y-1/2 mr-4" />

                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 relative group">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-xl" />
                                        <h4 className="text-blue-700 font-bold mb-2 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            Gelişme
                                        </h4>
                                        <p className="text-slate-700 text-sm leading-relaxed">
                                            {item.event}
                                        </p>
                                    </div>

                                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 relative group">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 rounded-l-xl" />
                                        <h4 className="text-amber-700 font-bold mb-2 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                                            Etki
                                        </h4>
                                        <p className="text-slate-700 text-sm leading-relaxed">
                                            {item.effect}
                                        </p>
                                        <div className="md:hidden flex justify-center py-2">
                                            <ArrowRight className="w-5 h-5 text-slate-400 rotate-90 md:rotate-0" />
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 relative">
                                        <h4 className="text-slate-700 font-bold mb-3 flex items-center gap-2">
                                            <Scale className="w-4 h-4 text-slate-500" />
                                            Sonuç
                                        </h4>
                                        <div className="space-y-3">
                                            {item.result.map((res, idx) => (
                                                <div key={idx} className={`flex items-start justify-between p-2 rounded-lg ${res.trend === 'down' ? 'bg-red-50 border border-red-100' : res.trend === 'up' ? 'bg-emerald-50 border border-emerald-100' : 'bg-white border border-slate-100'}`}>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-slate-800">{res.asset}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5">{res.detail}</p>
                                                    </div>
                                                    <div className="ml-2 mt-1">
                                                        {res.trend === 'down' ? (
                                                            <TrendingDown className="w-4 h-4 text-red-500" />
                                                        ) : res.trend === 'up' ? (
                                                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                                                        ) : (
                                                            <div className="w-4 h-2 bg-slate-300 rounded-full mt-2" />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Upcoming/AI Scenarios Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            {aiAnalysisData ? "Yapay Zeka Destekli Gelecek Senaryoları" : "Yaklaşan Kritik Gelişmeler ve Senaryolar"}
                        </h2>
                        <p className="text-slate-400 text-sm">
                            {aiAnalysisData
                                ? "Seçtiğiniz varlık için belirlenen kritik faktörler ve olası etkileri."
                                : "Piyasaların radarındaki olaylar ve olası senaryolar."}
                        </p>
                    </div>
                </div>

                {displayEvents.length > 0 ? (
                    <div className="grid gap-6">
                        {displayEvents.map((event: any) => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-xl overflow-hidden shadow-lg border border-slate-200 flex flex-col mb-6"
                            >
                                {/* Card Header - Navy */}
                                <div className="bg-[#1e293b] px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-bold text-white text-lg">{event.title || event.condition}</h3>
                                        {event.date && <span className="px-2 py-0.5 rounded bg-white/10 text-white/80 text-xs font-medium">{event.date}</span>}
                                    </div>
                                </div>

                                {/* Card Body - White */}
                                <div className="p-6 bg-white">
                                    <p className="text-slate-600 mb-6 leading-relaxed">
                                        {event.description || event.impact}
                                    </p>

                                    {/* Scenarios if present */}
                                    {event.scenarios && (
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {event.scenarios.map((scenario: any, sIdx: number) => (
                                                <div key={sIdx} className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:border-blue-300 transition-colors">
                                                    <h4 className={`font-bold mb-2 ${scenario.sentiment === 'positive' ? 'text-emerald-600' :
                                                        scenario.sentiment === 'negative' ? 'text-red-600' : 'text-amber-600'
                                                        }`}>
                                                        {scenario.condition}
                                                    </h4>
                                                    <p className="text-sm text-slate-600">{scenario.impact}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Assets Tags */}
                                    {(event.relatedAssets || event.assetsAffected) && (
                                        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                                            {(event.relatedAssets || event.assetsAffected).map((asset: string, idx: number) => (
                                                <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded font-medium border border-slate-200">
                                                    #{asset.toUpperCase()}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-900/50 border border-white/10 rounded-xl p-8 text-center text-slate-400">
                        {isAnalyzing ? (
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                <p>Yapay zeka analiz yapıyor, lütfen bekleyin...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center gap-3 text-red-400">
                                <AlertTriangle className="w-8 h-8" />
                                <p>{error}</p>
                            </div>
                        ) : (
                            "Görüntülenecek senaryo bulunamadı."
                        )}
                    </div>
                )}
            </div>

            {/* Market News Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-green-500/20 rounded-xl text-green-400">
                        <Newspaper className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Güncel Piyasa Haberleri</h2>
                        <p className="text-slate-400 text-sm">
                            Piyasaları etkileyen en son gelişmeler ve haber başlıkları.
                        </p>
                    </div>
                </div>

                {loadingNews ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                ) : news.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {news.slice(0, 6).map((item, idx) => (
                            <a
                                key={idx}
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block bg-slate-900/50 border border-white/10 rounded-xl p-5 hover:border-green-500/30 hover:bg-white/5 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-xs font-medium px-2 py-1 bg-white/5 rounded text-slate-400 border border-white/10">
                                        {new Date(item.pubDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-green-400 transition-colors" />
                                </div>
                                <h3 className="text-white font-medium mb-2 line-clamp-2 group-hover:text-green-400 transition-colors">
                                    {item.title}
                                </h3>
                                <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                                    {item.source}
                                </p>
                            </a>
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-900/50 border border-white/10 rounded-xl p-8 text-center text-slate-400">
                        Şu anda güncel haber bulunamadı.
                    </div>
                )}
            </div>

            {/* Correlation Teaser */}
            <div className="mt-8 bg-gradient-to-r from-slate-900 to-slate-800 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-purple-500/20 rounded-full text-purple-400">
                        <Scale className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Korelasyon Tablosu</h3>
                        <p className="text-slate-400 text-sm max-w-md">
                            Varlıklarınızın birbirleriyle ve piyasa değişkenleriyle (Dolar, Faiz, Petrol vb.) olan ilişkisini inceleyin.
                        </p>
                    </div>
                </div>
                <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-colors flex items-center gap-2 whitespace-nowrap">
                    Tabloyu İncele
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>

            {/* Legal Disclaimer */}
            <div className="mt-8 pt-8 border-t border-white/5 text-center px-4">
                <div className="flex items-center justify-center gap-2 mb-2 text-slate-500">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Yasal Uyarı</span>
                </div>
                <p className="text-xs text-slate-600 max-w-4xl mx-auto leading-relaxed">
                    Burada yer alan yatırım bilgi, yorum ve tavsiyeleri yatırım danışmanlığı kapsamında değildir.
                    Yatırım danışmanlığı hizmeti; aracı kurumlar, portföy yönetim şirketleri, mevduat kabul etmeyen bankalar ile müşteri arasında imzalanacak yatırım danışmanlığı sözleşmesi çerçevesinde sunulmaktadır.
                    Sadece burada yer alan bilgilere dayanılarak yatırım kararı verilmesi beklentilerinize uygun sonuçlar doğurmayabilir.
                </p>
            </div>
        </div>
    );
}
