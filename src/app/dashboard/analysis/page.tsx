
"use client";

import { useState, useEffect, Suspense } from "react";
import { ArrowRight, Brain, Filter, TrendingUp, TrendingDown, Scale, Info, Calendar, AlertTriangle, Search, ChevronDown, ExternalLink, Newspaper, Loader2, Building2, Landmark, Coins, DollarSign, Euro } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { DashboardAnalysisCards } from "@/components/DashboardAnalysisCards";

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

            {/* Top Holdings Section (AI Generated) */}
            {aiAnalysisData?.topHoldings && aiAnalysisData.topHoldings.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg border border-slate-200 mb-6 px-4 py-3 shadow-sm w-fit max-w-full"
                >
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2 text-blue-600 border-r border-slate-200 pr-4 shrink-0">
                            <Coins className="w-4 h-4" />
                            <span className="text-sm font-bold whitespace-nowrap">Öne Çıkanlar</span>
                        </div>
                        <div className="flex flex-wrap gap-1 text-sm text-slate-700 items-center">
                            {aiAnalysisData.topHoldings.slice(0, 5).map((holding: any, idx: number) => (
                                <span key={idx} className="font-medium whitespace-nowrap">
                                    {holding.symbol}
                                    {idx < Math.min(aiAnalysisData.topHoldings.length, 5) - 1 && (
                                        <span className="text-slate-300 mx-2">|</span>
                                    )}
                                </span>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* AI Summary Section - NEW */}
            {aiAnalysisData?.summary && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg border border-blue-500/50 mb-8 p-6 text-white relative overflow-hidden"
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







            {/* Upcoming/AI Scenarios Section */}
            {
                displayEvents.length > 0 && (
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
                                                                {scenario.condition}
                                                            </h4>
                                                            <p className={`text-sm ${sentiment === 'positive' ? 'text-emerald-700' :
                                                                sentiment === 'negative' ? 'text-red-700' : 'text-slate-600'
                                                                }`}>{scenario.impact}</p>
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
