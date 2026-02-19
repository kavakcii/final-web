
"use client";

import { useState, useEffect, Suspense } from "react";
import { ArrowRight, Brain, Filter, TrendingUp, TrendingDown, Scale, Info, Calendar, AlertTriangle, Search, ChevronDown, ExternalLink, Newspaper, Loader2, Building2, Landmark, Coins, DollarSign, Euro, Wallet, History as HistoryIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { DashboardAnalysisCards } from "@/components/DashboardAnalysisCards";
import { PortfolioService } from "@/lib/portfolio-service";
import { DisplayCard } from "@/components/ui/display-cards";
import { PremiumAssetCard } from "@/components/ui/premium-asset-card";
import { FinAiLogo } from "@/components/FinAiLogo";

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



export default function AnalysisPage() {
    const searchParams = useSearchParams();
    const queryAsset = searchParams.get('q');

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
    const [portfolioAssets, setPortfolioAssets] = useState<any[]>([]);
    const [abortController, setAbortController] = useState<AbortController | null>(null);

    const FIN_LESSONS = [
        { title: "Portföy Çeşitlendirmesi", lines: ["Yatırım dünyasının temel prensibi olan çeşitlendirme, riskin farklı varlık sınıflarına (hisse senedi, tahvil, emtia vb.) dağıtılmasını ifade eder. Tek bir varlığa odaklanmak yerine dengeli bir sepet oluşturmak, piyasa dalgalanmalarına karşı portföyünüzün dayanıklılığını artırır ve uzun vadeli, sürdürülebilir getiri potansiyelini optimize eder."] },
        { title: "Piyasa Zamanlaması ve Trend Analizi", lines: ["Piyasa düşüşleri her zaman bir alım fırsatı olarak değerlendirilmemelidir; düşüş trendinin sonlandığına dair teknik ve temel göstergelerin teyidi beklenmelidir. 'Bıçak düşerken tutulmaz' prensibi gereği, fiyatların dengelenmesini beklemek ve ana trend yönünde işlem yapmak, sermaye koruma stratejisinin en kritik bileşenidir."] },
        { title: "Yatırımcı Psikolojisi ve Disiplin", lines: ["Yatırım kararlarında duygusal faktörlerin (FOMO, panik vb.) rolünü minimize etmek, başarılı bir stratejinin temelidir. Piyasa coşkusunun zirve yaptığı anlarda temkinli olmak, karamsarlığın hakim olduğu dönemlerde ise rasyonel fırsatları değerlendirmek gerekir. Veriye dayalı karar alma mekanizması, sürdürülebilir başarının anahtarıdır."] },
        { title: "Likidite Yönetimi", lines: ["Portföy yönetiminde nakit pozisyonunu korumak, olası kriz dönemlerinde stratejik manevra kabiliyeti sağlar. Piyasa belirsizliklerinin arttığı dönemlerde likit kalmak, hem varlık değerlerinizi korumanıza hem de piyasa diplerinde oluşabilecek cazip fırsatları değerlendirmenize olanak tanır."] },
        { title: "Uzun Vadeli Yatırım Perspektifi", lines: ["Finansal piyasalarda servet inşası, kısa vadeli spekülatif işlemlerden ziyade, uzun vadeli ve disiplinli bir strateji gerektirir. Bileşik getirinin gücünden faydalanmak için sabırlı olmak ve piyasadaki günlük gürültüden uzaklaşarak temel hedeflere odaklanmak, yatırımcının en büyük avantajıdır."] },
        { title: "Risk Yönetimi ve Stop-Loss", lines: ["Sermaye piyasalarında hayatta kalmanın birinci kuralı sermayeyi korumaktır. Stop-loss (zarar kes) mekanizmalarını aktif kullanmak, öngörülemeyen piyasa hareketlerinde kayıpları sınırlı tutar. Zararı erken realize etmek, daha büyük finansal yıkımların önüne geçer ve oyunda kalmanızı sağlar."] }
    ];
    const [lessonIndex, setLessonIndex] = useState(0);
    const [prepIndex, setPrepIndex] = useState(1);
    const [lessonOrder, setLessonOrder] = useState<number[]>(FIN_LESSONS.map((_, i) => i));

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

    useEffect(() => {
        if (!isAnalyzing) return;
        const t = setInterval(() => {
            setLessonIndex((prev) => (prev + 1) % lessonOrder.length);
            setPrepIndex((prev) => (prev + 1) % lessonOrder.length);
        }, 15000);
        return () => clearInterval(t);
    }, [isAnalyzing, lessonOrder]);

    // Fetch user portfolio assets
    useEffect(() => {
        const loadPortfolio = async () => {
            try {
                const assets = await PortfolioService.getAssets();
                setPortfolioAssets(assets);
            } catch (error) {
                console.error("Failed to load portfolio assets", error);
            }
        };
        loadPortfolio();
    }, []);

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
        // Market data fetching is handled by DashboardAnalysisCards now
    }, []);

    useEffect(() => {
        if (queryAsset && !selectedAsset && !isAnalyzing) {
            setSearchTerm(queryAsset);
            // We need to wait for state update or pass it directly
            handleAnalyze(queryAsset);
        }
    }, [queryAsset]);

    const handleAnalyze = async (overrideTerm?: string, overrideDetails?: any) => {
        const termToUse = overrideTerm || searchTerm;

        if (!termToUse.trim()) return;

        setIsAnalyzing(true);
        const controller = new AbortController(); // Create new ABortController
        setAbortController(controller);

        const shuffled = [...FIN_LESSONS.map((_, i) => i)].sort(() => Math.random() - 0.5);
        setLessonOrder(shuffled);
        setLessonIndex(0);
        setPrepIndex(1 % shuffled.length);
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
                }),
                signal: controller.signal // Connect the signal
            });
            const data = await res.json();

            if (data.success) {
                setAiAnalysisData(data.data);
            } else {
                setError(data.error || "Analiz yapılamadı. Lütfen tekrar deneyin.");
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Analysis cancelled by user');
                return; // Do nothing if cancelled
            }
            console.error("Analysis failed", error);
            setError("Bir bağlantı hatası oluştu. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.");
        } finally {
            setIsAnalyzing(false);
            setAbortController(null);
        }
    };

    // Filter logic
    // We only show AI data now to ensure freshness.
    // Static past events are removed.


    // Use AI data if available
    const displayEvents = aiAnalysisData?.analysis || (Array.isArray(aiAnalysisData) ? aiAnalysisData : []) || [];

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
            {isAnalyzing && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-[#020617]/90 backdrop-blur-md grid place-items-center"
                >
                    <div className="relative w-[min(600px,90vw)] overflow-hidden rounded-3xl border border-blue-500/20 bg-slate-900/50 p-1 shadow-2xl">
                        {/* Background Gradients */}
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 pointer-events-none" />

                        {/* Cancel Button */}
                        <button
                            onClick={() => {
                                if (abortController) abortController.abort();
                                setIsAnalyzing(false);
                            }}
                            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all border border-white/5 hover:border-red-500/30 group"
                            title="Analizi İptal Et"
                        >
                            <span className="sr-only">İptal Et</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 group-hover:scale-110 transition-transform"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>

                        <div className="relative z-10 flex flex-col items-center gap-8 p-10 bg-slate-950/80 rounded-[22px]">
                            {/* Logo & Spinner */}
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full" />
                                <div className="relative z-10 p-4 bg-slate-900 rounded-2xl border border-blue-500/30 shadow-lg shadow-blue-500/20">
                                    <FinAiLogo size="lg" />
                                </div>
                                {/* Spinning Ring */}
                                <div className="absolute -inset-4 border-2 border-dashed border-blue-500/30 rounded-full animate-[spin_8s_linear_infinite]" />
                                <div className="absolute -inset-4 border-2 border-blue-500/10 rounded-full animate-[ping_3s_ease-in-out_infinite]" />
                            </div>

                            {/* Status Text & Pro Tip */}
                            <div className="w-full max-w-lg text-center space-y-8">
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-bold text-white flex items-center justify-center gap-3 tracking-tight">
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                                        <span className="bg-gradient-to-r from-white via-blue-100 to-slate-200 bg-clip-text text-transparent drop-shadow-sm">
                                            Analiz Ediliyor...
                                        </span>
                                    </h3>
                                    <p className="text-sm font-medium text-slate-400/80 tracking-wide">
                                        Piyasa verileri taranıyor, geçmiş senaryolar inceleniyor.
                                    </p>
                                </div>

                                {/* Pro Tip Card */}
                                <div className="relative w-full bg-[#0B1120]/80 backdrop-blur-xl rounded-2xl p-8 border border-white/[0.08] shadow-2xl shadow-black/50 overflow-hidden group hover:border-blue-500/20 transition-colors duration-500">
                                    {/* Subtle animated background gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] via-transparent to-purple-500/[0.02] group-hover:from-blue-500/[0.05] transition-all duration-1000" />

                                    {/* Decorative top line */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={lessonIndex}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="relative z-10 flex flex-col items-center"
                                        >
                                            <div className="mb-6">
                                                <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-300 text-[11px] font-bold uppercase tracking-[0.15em] border border-blue-500/20 shadow-[0_0_15px_-3px_rgba(59,130,246,0.2)]">
                                                    Finansal Okuryazarlık Notu #{lessonIndex + 1}
                                                </span>
                                            </div>

                                            <h4 className="text-xl font-bold text-white mb-4 tracking-tight">
                                                {FIN_LESSONS[lessonOrder[lessonIndex]].title}
                                            </h4>

                                            <div className="text-center w-full px-4">
                                                <p className="text-[14px] leading-7 text-slate-300 font-normal">
                                                    {FIN_LESSONS[lessonOrder[lessonIndex]].lines.join(" ")}
                                                </p>
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>

                                    {/* Progress Bar at bottom */}
                                    <div className="absolute bottom-0 left-0 h-[2px] w-full bg-slate-800/50">
                                        <motion.div
                                            initial={{ width: "0%" }}
                                            animate={{ width: "100%" }}
                                            transition={{ duration: 15, ease: "linear", repeat: Infinity }}
                                            className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                        />
                                    </div>
                                </div>
                                <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest animate-pulse">
                                    FinAI Sizin için çalışıyor...
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
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
                                    Yeni Talimat Oluştur
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Portfolio Quick Actions */}
                {!selectedAsset && portfolioAssets.length > 0 && (
                    <div className="space-y-4 mt-6">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Wallet className="w-5 h-5 text-blue-400" />
                            <span className="font-medium">Portföyünüzden Hızlı Analiz</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                            {portfolioAssets.slice(0, 4).map((asset) => (
                                <PremiumAssetCard
                                    key={asset.id}
                                    symbol={asset.symbol}
                                    onClick={() => {
                                        setSearchTerm(asset.symbol);
                                        handleAnalyze(asset.symbol);
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}

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

            {/* Daily Market Insights - Fixed Cards */}
            {!selectedAsset && (
                <DashboardAnalysisCards />
            )}

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

            {/* AI Analysis Loading Skeleton - Visual Feedback while waiting */}
            {isAnalyzing && !aiAnalysisData && (
                <div className="space-y-8 animate-pulse">
                    {/* Holdings Skeleton */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="h-16 border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                            <div className="h-6 bg-slate-200 rounded w-48"></div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-slate-50 rounded-xl border border-slate-100"></div>
                            ))}
                        </div>
                    </div>

                    {/* Summary Skeleton */}
                    <div className="h-40 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 opacity-50"></div>

                    {/* Scenarios Skeleton */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="h-16 bg-slate-800 px-6 py-4 flex items-center gap-3">
                            <div className="h-6 bg-white/20 rounded w-64"></div>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="h-4 bg-slate-100 rounded w-full"></div>
                            <div className="h-4 bg-slate-100 rounded w-2/3"></div>
                            <div className="grid md:grid-cols-2 gap-4 mt-6">
                                <div className="h-40 bg-emerald-50/50 border border-emerald-100 rounded-lg p-4">
                                    <div className="h-6 bg-emerald-100/50 rounded w-32 mb-4"></div>
                                    <div className="h-20 bg-emerald-100/30 rounded"></div>
                                </div>
                                <div className="h-40 bg-red-50/50 border border-red-100 rounded-lg p-4">
                                    <div className="h-6 bg-red-100/50 rounded w-32 mb-4"></div>
                                    <div className="h-20 bg-red-100/30 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && !isAnalyzing && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-200 mb-8">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {/* Split Layout: Top Holdings (Left) & AI Summary (Right) */}
            {(aiAnalysisData?.topHoldings?.length > 0 || aiAnalysisData?.summary) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Top Holdings Section (Detailed Card) - Left */}
                    {aiAnalysisData?.topHoldings && aiAnalysisData.topHoldings.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden h-full flex flex-col"
                        >
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                        <Coins className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-lg">Fon Varlık Dağılımı</h3>
                                </div>
                                <span className="text-xs font-medium text-slate-500 bg-slate-200 px-3 py-1 rounded-full">
                                    En Büyük {aiAnalysisData.topHoldings.length} Varlık
                                </span>
                            </div>

                            <div className="p-6 flex-1 overflow-y-auto max-h-[500px] scrollbar-thin scrollbar-thumb-slate-200">
                                <div className="grid grid-cols-1 gap-4">
                                    {aiAnalysisData.topHoldings.map((holding: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 group-hover:bg-blue-500 group-hover:text-white transition-colors text-sm">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-bold text-slate-800">{holding.symbol}</span>
                                                    <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                                        {holding.percent}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-500 truncate" title={holding.name}>
                                                    {holding.name}
                                                </div>
                                                {/* Simple Progress Bar Visual */}
                                                <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full opacity-80"
                                                        style={{ width: holding.percent.replace('%', '').replace(',', '.') + '%' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* AI Summary Section - Right */}
                    {aiAnalysisData?.summary && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg border border-blue-500/50 p-6 text-white relative overflow-hidden h-full flex flex-col justify-center"
                        >
                            <div className="absolute top-0 right-0 w-64 h-full opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
                            <div className="flex items-start gap-4 relative z-10">
                                <div className="p-3 bg-white/10 rounded-xl shrink-0 backdrop-blur-sm border border-white/10">
                                    <Brain className="w-8 h-8 text-blue-200" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold mb-3 text-blue-100 flex items-center gap-2">
                                        Piyasa Özeti ve Beklentiler
                                        <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-xs text-blue-200 border border-blue-400/30">Canlı Analiz</span>
                                    </h3>
                                    <p className="text-white text-lg font-medium leading-relaxed">
                                        {aiAnalysisData.summary}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Historical Event Analysis Table */}
            {
                aiAnalysisData?.historicalEvent && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm"
                    >
                        <div className="bg-gradient-to-r from-amber-900/40 to-slate-900/40 px-6 py-4 border-b border-amber-500/20 flex items-center gap-3">
                            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                                <HistoryIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-amber-100">Geçmiş Analiz (Örnek Vaka)</h3>
                                <p className="text-xs text-amber-200/60">Yakın geçmişte yaşanan benzer bir olayın analizi</p>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-700/50 text-xs uppercase tracking-wider text-slate-400">
                                            <th className="pb-3 pl-2 font-medium">Olay</th>
                                            <th className="pb-3 px-4 font-medium">Etki (Neden)</th>
                                            <th className="pb-3 pr-2 font-medium">Sonuç</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        <tr className="group">
                                            <td className="py-4 pl-2 pr-4 align-top text-white font-medium min-w-[140px]">
                                                {aiAnalysisData.historicalEvent.title}
                                                <div className="text-xs text-slate-500 mt-1 font-normal">{aiAnalysisData.historicalEvent.date}</div>
                                            </td>
                                            <td className="py-4 px-4 align-top text-slate-300 border-l border-slate-800/50">
                                                {aiAnalysisData.historicalEvent.impact}
                                                {aiAnalysisData.historicalEvent.affectedAssets && (
                                                    <div className="flex gap-1 flex-wrap mt-2">
                                                        {aiAnalysisData.historicalEvent.affectedAssets.map((asset: string, idx: number) => (
                                                            <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">{asset}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 pl-4 pr-2 align-top text-emerald-400 font-medium border-l border-slate-800/50 min-w-[140px]">
                                                {aiAnalysisData.historicalEvent.result}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )
            }

            {/* Upcoming/AI Scenarios Section */}
            {
                displayEvents.length > 0 ? (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {aiAnalysisData ? "Gelecek Senaryoları ve Etki Analizi" : "Yaklaşan Kritik Gelişmeler ve Senaryolar"}
                                </h2>
                                <p className="text-slate-400 text-sm">
                                    {aiAnalysisData
                                        ? "Bu varlığı etkileyen faktörler ve olası sonuçları (Eğer X olursa -> Y olur)."
                                        : "Piyasaların radarındaki olaylar ve olası senaryolar."}
                                </p>
                            </div>
                        </div>

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
                                                {event.scenarios.map((scenario: any, sIdx: number) => {
                                                    const sentiment = scenario.sentiment?.toLowerCase() || 'neutral';

                                                    // Fixed titles based on sentiment to match user preference
                                                    let title = "Nötr Beklenti";
                                                    if (sentiment === 'positive') title = "Pozitif Beklenti";
                                                    if (sentiment === 'negative') title = "Negatif Beklenti";

                                                    return (
                                                        <div key={sIdx} className={`rounded-lg p-4 border transition-colors ${sentiment === 'positive'
                                                            ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
                                                            : sentiment === 'negative'
                                                                ? 'bg-red-50 border-red-200 hover:border-red-300'
                                                                : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                                                            }`}>
                                                            <h4 className={`font-bold mb-2 ${sentiment === 'positive' ? 'text-emerald-800' :
                                                                sentiment === 'negative' ? 'text-red-800' : 'text-slate-800'
                                                                }`}>
                                                                {title}
                                                            </h4>
                                                            <p className={`text-sm leading-relaxed ${sentiment === 'positive' ? 'text-emerald-700' :
                                                                sentiment === 'negative' ? 'text-red-700' : 'text-slate-600'
                                                                }`}>
                                                                <span className="font-semibold block mb-1 text-black/60">{scenario.condition}</span>
                                                                {scenario.impact}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
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
                    </div>
                ) : (
                    /* Show fallback message only if analysis data exists but no scenarios found */
                    aiAnalysisData && (
                        <div className="p-8 text-center bg-slate-800/50 rounded-xl border border-white/10">
                            <Info className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                            <h3 className="text-white font-medium">Bu varlık için şu an detaylı senaryo bulunamadı.</h3>
                            <p className="text-slate-400 text-sm mt-1">Lütfen daha sonra tekrar deneyin veya farklı bir varlık arayın.</p>
                        </div>
                    )
                )
            }

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
        </div >
    );
}
