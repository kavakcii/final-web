"use client";

import { useState, useEffect, Suspense, useMemo, useCallback } from "react";
import { 
    Search, 
    ShieldCheck, 
    AlertTriangle, 
    TrendingUp, 
    TrendingDown, 
    RefreshCw, 
    Loader2, 
    ArrowRight, 
    ChevronRight, 
    ChevronDown,
    ChevronUp,
    Calendar, 
    Activity, 
    BookOpen, 
    Compass, 
    CheckCircle2, 
    Filter, 
    Scale,
    Building2,
    Database,
    Eye,
    TrendingUp as TrendIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import TradingViewWidget from "@/components/TradingViewWidget";
import type { 
    FinAiAnalysisResponse, 
    UIFactorDetail, 
    UIUpcomingEvent, 
    ImpactBalanceRating 
} from "@/lib/analysis/types";

// Popular quick switch tickers
const POPULAR_TICKERS = [
    { symbol: "THYAO", name: "Türk Hava Yolları", sector: "Havacılık" },
    { symbol: "ASELS", name: "Aselsan", sector: "Savunma" },
    { symbol: "BIMAS", name: "BİM Mağazalar", sector: "Perakende" },
    { symbol: "TUPRS", name: "Tüpraş", sector: "Enerji / Petrol" },
    { symbol: "KCHOL", name: "Koç Holding", sector: "Holding" },
    { symbol: "EREGL", name: "Ereğli Demir Çelik", sector: "Demir Çelik" },
    { symbol: "SISE", name: "Şişecam", sector: "Cam / Sanayi" },
    { symbol: "FROTO", name: "Ford Otosan", sector: "Otomotiv" },
    { symbol: "AKBNK", name: "Akbank", sector: "Bankacılık" }
];

// Logo Component
function AssetLogo({ symbol, className = "w-11 h-11" }: { symbol: string; className?: string }) {
    const clean = symbol.toUpperCase().replace('.IS', '').trim();
    const [imgIndex, setImgIndex] = useState(0);
    const [isFailed, setIsFailed] = useState(false);

    const logoSlugMap: Record<string, string> = {
        "THYAO": "turk-hava-yollari", "ASELS": "aselsan", "EREGL": "eregli-demir-celik",
        "TUPRS": "tupras", "KCHOL": "koc-holding", "SAHOL": "sabanci-holding",
        "GARAN": "garanti-bbva", "AKBNK": "akbank", "ISCTR": "is-bankasi",
        "YKBNK": "yapi-kredi", "BIMAS": "bim", "MGROS": "migros",
        "SISE": "sisecam", "FROTO": "ford-otosan", "TOASO": "tofas",
        "TCELL": "turkcell", "TTKOM": "turk-telekom", "SASA": "sasa",
        "HEKTS": "hektas", "ASTOR": "astor-enerji", "PGSUS": "pegasus",
        "ARCLK": "arcelik", "ENKAI": "enka-insaat", "PETKM": "petkim"
    };

    const slug = logoSlugMap[clean] || clean.toLowerCase();
    const logoSources = [
        `https://s3-symbol-logo.tradingview.com/${slug}--big.svg`,
        `https://s3-symbol-logo.tradingview.com/${slug}.svg`,
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
            <div className={`rounded-xl bg-gradient-to-br from-indigo-700 to-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm border border-slate-200 dark:border-slate-800 ${className}`}>
                {clean.slice(0, 4)}
            </div>
        );
    }

    return (
        <div className={`rounded-xl bg-white border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center shrink-0 shadow-sm p-1 ${className}`}>
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

// Impact Balance Badge Helper (Pure qualitative direction, zero numeric rating)
function ImpactBalanceBadge({ rating }: { rating: ImpactBalanceRating }) {
    if (rating === "Pozitif") {
        return (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold text-xs tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <TrendingUp className="w-3.5 h-3.5" />
                <span>ETKİ DENGESİ: POZİTİF</span>
            </div>
        );
    }

    if (rating === "Negatif") {
        return (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 font-semibold text-xs tracking-wide">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <TrendingDown className="w-3.5 h-3.5" />
                <span>ETKİ DENGESİ: NEGATİF</span>
            </div>
        );
    }

    return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-semibold text-xs tracking-wide">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <Scale className="w-3.5 h-3.5" />
            <span>ETKİ DENGESİ: DENGELİ / NÖTR</span>
        </div>
    );
}

// Compact Streamlined Factor Item with Expandable Cause-Effect Chain
function FactorRowItem({ factor }: { factor: UIFactorDetail }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const directionColor = 
        factor.direction === "positive" ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
        factor.direction === "negative" ? "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20" :
        "text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20";

    const directionLabel = 
        factor.direction === "positive" ? "Pozitif" :
        factor.direction === "negative" ? "Negatif" :
        "Nötr";

    const directionIcon = 
        factor.direction === "positive" ? <TrendingUp className="w-3 h-3" /> :
        factor.direction === "negative" ? <TrendingDown className="w-3 h-3" /> :
        <Activity className="w-3 h-3" />;

    const hasChain = factor.causeEffectChain && factor.causeEffectChain.length > 0;

    return (
        <div 
            onClick={() => hasChain && setIsExpanded(!isExpanded)}
            className={`p-3.5 rounded-xl border transition-all text-xs ${
                hasChain ? "cursor-pointer hover:border-slate-300 dark:hover:border-slate-700" : ""
            } bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800/70 shadow-xs`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${directionColor}`}>
                            {directionIcon}
                            {directionLabel}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {factor.channelTitleTr || factor.channel}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 ml-auto sm:ml-0">
                            <Database className="w-3 h-3" />
                            {factor.source}
                        </span>
                    </div>

                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                        {factor.title}
                    </h4>

                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                        {factor.causalExplanation}
                    </p>
                </div>

                {hasChain && (
                    <button 
                        type="button"
                        aria-label="Detayları göster"
                        className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0 mt-0.5"
                    >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                )}
            </div>

            {/* Expandable Cause-Effect Chain on click */}
            <AnimatePresence>
                {isExpanded && hasChain && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800/70"
                    >
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 text-indigo-500" />
                            <span>Aktarım Aşamaları:</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                            {factor.causeEffectChain!.map((step: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 font-medium text-[11px]">
                                        {step}
                                    </span>
                                    {idx < factor.causeEffectChain!.length - 1 && (
                                        <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Main Analysis Page Component
function AnalysisContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialQuery = (searchParams?.get("q") || "THYAO").toUpperCase();

    const [symbol, setSymbol] = useState<string>(initialQuery);
    const [searchInput, setSearchInput] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [analysis, setAnalysis] = useState<FinAiAnalysisResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedChannel, setSelectedChannel] = useState<string>("TÜMÜ");

    // Fetch analysis from /api/finai/analysis
    const loadAnalysis = useCallback(async (targetSymbol: string, forceRefresh = false) => {
        const cleanSymbol = targetSymbol.toUpperCase().replace(/\.IS$/i, "").trim();
        if (!cleanSymbol) return;

        if (forceRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            const res = await fetch("/api/finai/analysis", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ symbol: cleanSymbol, forceRefresh })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Analiz verisi alınamadı.");
            }

            setAnalysis(data as FinAiAnalysisResponse);
            setSymbol(cleanSymbol);
        } catch (err: any) {
            console.error("[FinAi UI] Analysis load error:", err);
            setError(err.message || "Analiz yüklenirken beklenmedik bir hata oluştu.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Initial load and URL sync
    useEffect(() => {
        if (initialQuery) {
            loadAnalysis(initialQuery, false);
        }
    }, [initialQuery, loadAnalysis]);

    const handleSelectSymbol = (newSymbol: string) => {
        const clean = newSymbol.toUpperCase().trim();
        setSymbol(clean);
        // Use relative query to safely push without absolute path conflicts in Vercel/Next.js
        router.push(`?q=${clean}`);
        loadAnalysis(clean, false);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchInput.trim()) return;
        const clean = searchInput.toUpperCase().trim();
        handleSelectSymbol(clean);
        setSearchInput("");
    };

    // All factors aggregated
    const allFactorsList = useMemo(() => {
        if (!analysis) return [];
        return analysis.allFactors || [
            ...(analysis.positiveFactors || []),
            ...(analysis.negativeFactors || []),
            ...(analysis.neutralFactors || [])
        ];
    }, [analysis]);

    // Available transmission channels for filter
    const availableChannels = useMemo(() => {
        if (!allFactorsList.length) return ["TÜMÜ"];
        const channels = new Set<string>();
        allFactorsList.forEach(f => {
            const ch = f.channelTitleTr || f.channel;
            if (ch) channels.add(ch);
        });
        return ["TÜMÜ", ...Array.from(channels)];
    }, [allFactorsList]);

    const filteredFactors = useMemo(() => {
        if (!allFactorsList.length) return [];
        if (selectedChannel === "TÜMÜ") return allFactorsList;
        return allFactorsList.filter(f => (f.channelTitleTr || f.channel) === selectedChannel);
    }, [allFactorsList, selectedChannel]);

    // Real genuine sources (Zero fallback mock strings)
    const genuineSources = useMemo(() => {
        if (!analysis) return [];
        const set = new Set<string>();
        if (analysis.provenance && Array.isArray(analysis.provenance)) {
            analysis.provenance.forEach(s => s && set.add(s));
        }
        if (analysis.sourceReferences && Array.isArray(analysis.sourceReferences)) {
            analysis.sourceReferences.forEach(s => s.source && set.add(s.source));
        }
        return Array.from(set);
    }, [analysis]);

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* 1. TOP HEADER & SEARCH & QUICK SWITCH */}
                <header className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 uppercase">
                                    FinAi Analizi
                                </span>
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Doğrulandı
                                </span>
                            </div>
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                                Finansal Aktarım Kanalları ve Şirket Etkisi
                            </h1>
                            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                                Çok kaynaklı doğrulanmış veriler ve ekonomik nedensellik zinciriyle hazırlanan analiz.
                            </p>
                        </div>

                        {/* Search and Action buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                            <form onSubmit={handleSearchSubmit} className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input 
                                    type="text"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="BIST sembolü ara (örn: THYAO)..."
                                    className="pl-9 pr-4 py-2 text-xs md:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-52 md:w-64"
                                />
                            </form>

                            <button
                                onClick={() => loadAnalysis(symbol, true)}
                                disabled={loading || refreshing}
                                title="Verileri yeniden doğrula ve analizi tazele"
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-200 disabled:opacity-50"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-indigo-600" : ""}`} />
                                <span className="hidden sm:inline">Güncelle</span>
                            </button>
                        </div>
                    </div>

                    {/* Quick Ticker Switcher Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                        <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-1 uppercase">Hızlı Seçim:</span>
                        {POPULAR_TICKERS.map((t) => {
                            const isSelected = symbol === t.symbol;
                            return (
                                <button
                                    key={t.symbol}
                                    onClick={() => handleSelectSymbol(t.symbol)}
                                    className={`px-3 py-1.5 rounded-lg font-medium shrink-0 transition-all border ${
                                        isSelected
                                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs"
                                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                                    }`}
                                >
                                    <span className="font-bold">{t.symbol}</span>
                                    <span className="ml-1.5 opacity-70 text-[11px] hidden sm:inline">{t.name.split(" ")[0]}</span>
                                </button>
                            );
                        })}
                    </div>
                </header>

                {/* ERROR BANNER */}
                {error && (
                    <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                        <div className="flex-1 text-sm">
                            <p className="font-semibold">Analiz Yüklenirken Bir Hata Oluştu</p>
                            <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">{error}</p>
                        </div>
                        <button
                            onClick={() => loadAnalysis(symbol, true)}
                            className="px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition"
                        >
                            Tekrar Dene
                        </button>
                    </div>
                )}

                {/* LOADING SKELETON */}
                {loading && !analysis && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
                        <div className="lg:col-span-8 space-y-6">
                            <div className="h-28 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6" />
                            <div className="h-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6" />
                            <div className="h-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6" />
                        </div>
                        <div className="lg:col-span-4 space-y-6">
                            <div className="h-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6" />
                            <div className="h-44 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6" />
                        </div>
                    </div>
                )}

                {/* MAIN CONTENT WHEN LOADED */}
                {analysis && (
                    <div className="space-y-6">

                        {/* COMPANY BANNER (ÜST BÖLÜM) - Price is calm, percentage change is NOT the focal point */}
                        <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <AssetLogo symbol={analysis.symbol} className="w-13 h-13" />
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                            {analysis.companyName}
                                        </h2>
                                        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                            {analysis.symbol}
                                        </span>
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                            {analysis.sector}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                                        <span>Borsa İstanbul</span>
                                        <span>•</span>
                                        <span>Veri Tarihi: {analysis.priceDate}</span>
                                        {analysis.snapshotAgeMinutes !== undefined && (
                                            <>
                                                <span>•</span>
                                                <span>{analysis.snapshotAgeMinutes === 0 ? "Güncel" : `${analysis.snapshotAgeMinutes} dk önce`}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Current Price and Impact Balance (Calm, no oversized percentage badge) */}
                            <div className="flex items-center md:items-end justify-between md:flex-col gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                                <div className="text-left md:text-right">
                                    <div className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                        {analysis.currentPrice !== null ? `₺${analysis.currentPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : "—"}
                                    </div>
                                    <div className="text-[11px] text-slate-400 font-medium">
                                        Son İşlem Fiyatı
                                    </div>
                                </div>
                                <ImpactBalanceBadge rating={analysis.impactBalance} />
                            </div>
                        </div>

                        {/* 2-COLUMN ASYMMETRIC LAYOUT */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                            {/* ========================================================================= */}
                            {/* LEFT COLUMN: COHESIVE EDITORIAL MEMO & FACTORS (68%) */}
                            {/* ========================================================================= */}
                            <div className="lg:col-span-8 space-y-6">

                                {/* SECTION 1: TEK GÜÇLÜ ANA ANLATI (FİNAİ YORUMU) */}
                                <div className="p-6 md:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
                                    
                                    {/* Editorial Header */}
                                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-4 bg-indigo-600 rounded-full" />
                                                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                                                    FinAi Yorumu
                                                </h3>
                                            </div>
                                            <span className="text-[11px] text-slate-400 font-medium">
                                                Ekonomik Nedensellik & Aktarım Analizi
                                            </span>
                                        </div>
                                    </div>

                                    {/* Net Finansal Etki Dengesi Gerekçesi Callout */}
                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                        <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1.5">
                                            <Scale className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                            <span>Net Finansal Etki Dengesi</span>
                                        </div>
                                        {analysis.impactBalanceReasoning}
                                    </div>

                                    {/* Cohesive Narrative Paragraphs */}
                                    <div className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                        <div>
                                            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider mb-1 text-indigo-600 dark:text-indigo-400">
                                                Durum ve Dinamikler
                                            </h4>
                                            <p>
                                                {analysis.generalOverview}
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider mb-1 text-indigo-600 dark:text-indigo-400">
                                                Finansal Aktarım Kanalları
                                            </h4>
                                            <p>
                                                {analysis.detailedCommentary}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Çelişen ve Dengelenen Güçler (Piyasa İkilemleri) */}
                                    {analysis.conflictingTensions && analysis.conflictingTensions.length > 0 && (
                                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                                            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <Scale className="w-3.5 h-3.5 text-amber-500" />
                                                Piyasadaki Çelişen ve Dengelenen Güçler
                                            </h4>
                                            <div className="space-y-2">
                                                {analysis.conflictingTensions.map((item, idx) => (
                                                    <div 
                                                        key={idx}
                                                        className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15 text-xs text-slate-700 dark:text-slate-300 space-y-1"
                                                    >
                                                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                                                            <span className="text-amber-700 dark:text-amber-400 font-bold uppercase text-[10px] mr-1.5">
                                                                {item.category}:
                                                            </span>
                                                            {item.summary}
                                                        </div>
                                                        <div className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                                                            {item.resolution}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                </div>

                                {/* SECTION 2: ŞİRKETİ ETKİLEYEN FAKTÖRLER (COMPACT ACCORDION LIST) */}
                                <div className="p-6 md:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                                        <div>
                                            <h3 className="font-bold text-base text-slate-900 dark:text-white">
                                                Şirketi Etkileyen Faktörler
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Doğrulanmış göstergeler ve aktarım kanalları (Ayrıntı için faktöre tıklayabilirsiniz).
                                            </p>
                                        </div>

                                        {/* Channel Filter Pills */}
                                        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                                            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
                                            {availableChannels.map(ch => (
                                                <button
                                                    key={ch}
                                                    onClick={() => setSelectedChannel(ch)}
                                                    className={`px-2.5 py-1 rounded-md text-xs font-medium shrink-0 transition ${
                                                        selectedChannel === ch 
                                                            ? "bg-indigo-600 text-white" 
                                                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                                    }`}
                                                >
                                                    {ch}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Streamlined Factor List */}
                                    <div className="space-y-2.5">
                                        {filteredFactors.length > 0 ? (
                                            filteredFactors.map((factor, index) => (
                                                <FactorRowItem key={factor.id || index} factor={factor} />
                                            ))
                                        ) : (
                                            <div className="text-center py-6 text-xs text-slate-400 border border-dashed rounded-xl">
                                                Bu aktarım kanalına ait doğrulanmış faktör bulunamadı.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* SECTION 3: SAKİN VE KOMPAKT SENARYO PATİKALARI */}
                                {analysis.scenarios && (
                                    <div className="p-6 md:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                                        <div>
                                            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                                                <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                Olası Senaryolar
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Fiyat tahmini değildir; koşullar değişirse şirket üzerindeki etkinin nasıl şekilleneceğini gösterir.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-1">
                                                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                                                    Temel Durum
                                                </div>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                                    {analysis.scenarios.baseline}
                                                </p>
                                            </div>
                                            <div className="p-3.5 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 space-y-1">
                                                <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                                                    İyimser Koşul
                                                </div>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                                    {analysis.scenarios.optimistic}
                                                </p>
                                            </div>
                                            <div className="p-3.5 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 space-y-1">
                                                <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wide">
                                                    Temkinli Koşul
                                                </div>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                                    {analysis.scenarios.cautious}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Kritik İzleme Başlıkları */}
                                        {analysis.watchItems && analysis.watchItems.length > 0 && (
                                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                                                    Önümüzdeki Dönemde İzlenmesi Gereken Gelişmeler
                                                </h4>
                                                <ul className="space-y-1.5">
                                                    {analysis.watchItems.map((item, idx) => (
                                                        <li 
                                                            key={idx}
                                                            className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
                                                        >
                                                            <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                                                            <span>{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* SECTION 4: FINAI KAVRAM NOTU (ÖĞRENME KÖŞESİ) */}
                                {analysis.educationalTakeaway && (
                                    <div className="p-4 md:p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/80 dark:border-indigo-900/40 flex items-start gap-3">
                                        <div className="p-1.5 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5">
                                            <BookOpen className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <h4 className="font-bold text-xs uppercase tracking-wide text-indigo-900 dark:text-indigo-300">
                                                Finansal Okuryazarlık Notu
                                            </h4>
                                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                                {analysis.educationalTakeaway}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ========================================================================= */}
                            {/* RIGHT COLUMN: TRADINGVIEW CHART, SECTOR CONTEXT, UPCOMING EVENTS (32%) */}
                            {/* ========================================================================= */}
                            <div className="lg:col-span-4 space-y-6">

                                {/* RIGHT CARD 1: TRADINGVIEW CHART */}
                                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
                                    <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <TrendIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                            <span className="font-bold text-xs uppercase tracking-wide text-slate-900 dark:text-white">
                                                Fiyat Grafiği
                                            </span>
                                        </div>
                                        <span className="text-[11px] font-mono text-slate-400 font-semibold">
                                            BIST:{analysis.symbol}
                                        </span>
                                    </div>

                                    <div className="h-[340px] w-full bg-slate-50 dark:bg-slate-950">
                                        <TradingViewWidget symbol={`BIST:${analysis.symbol}`} height={340} />
                                    </div>
                                </div>

                                {/* RIGHT CARD 2: SEKTÖR VE PİYASA KARŞILAŞTIRMASI */}
                                {analysis.peerComparison && (
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                                <h4 className="font-bold text-xs uppercase tracking-wide text-slate-900 dark:text-white">
                                                    Sektör Bağlamı
                                                </h4>
                                            </div>
                                            <span className="text-[11px] text-slate-400 font-medium">
                                                {analysis.sector}
                                            </span>
                                        </div>

                                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                            {analysis.peerComparison.summary}
                                        </p>

                                        {analysis.peerComparison.metrics && analysis.peerComparison.metrics.length > 0 && (
                                            <div className="space-y-1.5 pt-1">
                                                {analysis.peerComparison.metrics.map((m, idx) => (
                                                    <div 
                                                        key={idx}
                                                        className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs flex items-center justify-between"
                                                    >
                                                        <span className="font-medium text-slate-600 dark:text-slate-400">{m.name}</span>
                                                        <div className="flex items-center gap-2 font-mono text-xs">
                                                            <span className="font-bold text-slate-900 dark:text-slate-100">
                                                                {typeof m.companyValue === "number" ? m.companyValue.toFixed(2) : (m.companyValue || "—")}
                                                            </span>
                                                            <span className="text-slate-400 text-[10px]">
                                                                (Sektör: {typeof m.sectorAvg === "number" ? m.sectorAvg.toFixed(2) : (m.sectorAvg || "—")})
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* RIGHT CARD 3: YAKLAŞAN ÖNEMLİ GELİŞMELER */}
                                {analysis.upcomingEvents && analysis.upcomingEvents.length > 0 && (
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                            <h4 className="font-bold text-xs uppercase tracking-wide text-slate-900 dark:text-white">
                                                Yaklaşan Gelişmeler
                                            </h4>
                                        </div>

                                        <div className="space-y-2">
                                            {analysis.upcomingEvents.map((evt, idx) => (
                                                <div 
                                                    key={idx}
                                                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-0.5 text-xs"
                                                >
                                                    <div className="flex items-center justify-between text-[11px]">
                                                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{evt.date}</span>
                                                        <span className="text-slate-400 text-[10px]">{evt.source}</span>
                                                    </div>
                                                    <p className="font-medium text-slate-800 dark:text-slate-200">
                                                        {evt.title}
                                                    </p>
                                                    {evt.impact && (
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                            {evt.impact}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* RIGHT CARD 4: DOĞRULANMIŞ KAYNAKLAR (COMPACT, TRANSPARENT PROVENANCE - NO NUMERIC SCORES) */}
                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                            <span>Veri Kaynağı & İzlenebilirlik</span>
                                        </span>
                                        <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 text-[11px]">
                                            <CheckCircle2 className="w-3 h-3" /> Doğrulandı
                                        </span>
                                    </div>

                                    {/* Detailed Provenance Items if standardProvenance exists */}
                                    {analysis.standardProvenance && analysis.standardProvenance.length > 0 ? (
                                        <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                                            <div className="text-[10px] font-semibold text-slate-400 uppercase">
                                                Resmî Kaynak Hiyerarşisi:
                                            </div>
                                            <div className="space-y-1.5">
                                                {analysis.standardProvenance.map((item, idx) => {
                                                    const tierColor = item.tier === 'PRIMARY_OFFICIAL'
                                                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                                                        : item.tier === 'SECONDARY_VERIFIED'
                                                        ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
                                                        : 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20';

                                                    return (
                                                        <div 
                                                            key={item.id || idx}
                                                            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] space-y-0.5"
                                                        >
                                                            <div className="flex items-center justify-between gap-1">
                                                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={item.sourceName}>
                                                                    {item.sourceName}
                                                                </span>
                                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider border shrink-0 ${tierColor}`}>
                                                                    {item.tier === 'PRIMARY_OFFICIAL' ? 'Resmî' : (item.tier === 'SECONDARY_VERIFIED' ? 'Doğrulanmış' : 'Piyasa')}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                                                                <span className="truncate">{item.provider}</span>
                                                                <span className="font-mono text-[9px] text-emerald-600 dark:text-emerald-400 shrink-0">
                                                                    {item.sourceStatus === 'VERIFIED' ? '✓ Doğrulandı' : item.sourceStatus}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                                            <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1">
                                                Kullanılan Veri Kaynakları:
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {genuineSources.length > 0 ? (
                                                    genuineSources.map((src, idx) => (
                                                        <span 
                                                            key={idx}
                                                            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium border border-slate-200/60 dark:border-slate-700/60"
                                                        >
                                                            {src}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-[11px] text-slate-400 italic">
                                                        Kaynak bilgisi mevcut değil
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>

                    </div>
                )}

            </div>
        </div>
    );
}

export default function AnalysisPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-slate-950">
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    FinAi Analiz Modülü Yükleniyor...
                </div>
            </div>
        }>
            <AnalysisContent />
        </Suspense>
    );
}
