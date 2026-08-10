"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import Link from "next/link";
import { 
    Newspaper, 
    Search, 
    RefreshCw, 
    Filter, 
    Zap, 
    Sparkles, 
    TrendingUp, 
    Globe, 
    Coins, 
    PieChart, 
    Building2, 
    Loader2, 
    AlertCircle, 
    Flame,
    Radio
} from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";
import { EnrichedNewsItem } from "@/app/api/news/route";
import { NewsHeroCard } from "@/components/news/NewsHeroCard";
import { NewsCard } from "@/components/news/NewsCard";
import { NewsSentimentWidget } from "@/components/news/NewsSentimentWidget";
import { KapLiveFeedWidget } from "@/components/news/KapLiveFeedWidget";

const CATEGORY_TABS = [
    { id: 'all', label: 'Tüm Akış', icon: Newspaper },
    { id: 'portfolio', label: 'Portföyüm', icon: PieChart },
    { id: 'kap', label: 'KAP Bildirimleri', icon: Building2 },
    { id: 'bist', label: 'Borsa İstanbul', icon: TrendingUp },
    { id: 'commodity', label: 'Altın & Emtia', icon: Flame },
    { id: 'macro', label: 'Makro Ekonomi', icon: Zap },
    { id: 'global', label: 'Küresel Piyasalar', icon: Globe },
    { id: 'crypto', label: 'Kripto', icon: Coins }
];

function NewsContent() {
    const { user } = useUser();

    // Data states
    const [news, setNews] = useState<EnrichedNewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sentimentDist, setSentimentDist] = useState({
        bullish: 60,
        bearish: 25,
        neutral: 15,
        total: 0
    });

    // Filter states
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const fetchNewsData = async (isManualRefresh = false) => {
        if (isManualRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        try {
            const url = user 
                ? `/api/news?userId=${user.id}${isManualRefresh ? '&refresh=true' : ''}`
                : `/api/news${isManualRefresh ? '?refresh=true' : ''}`;
            
            const res = await fetch(url);
            const data = await res.json();

            if (data.success && Array.isArray(data.data)) {
                setNews(data.data);
                if (data.sentimentDistribution) {
                    setSentimentDist(data.sentimentDistribution);
                }
            } else {
                setError(data.error || "Haber akışı yüklenemedi.");
            }
        } catch (err: any) {
            console.error("News fetch error:", err);
            setError("Sunucuya bağlanırken bir sorun oluştu.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNewsData();
    }, [user]);

    // Filter news client-side for instant tab switching
    const filteredNews = useMemo(() => {
        return news.filter(item => {
            const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
            const s = searchQuery.toLowerCase().trim();
            const matchSearch = !s || 
                item.title.toLowerCase().includes(s) || 
                item.description.toLowerCase().includes(s) ||
                item.tickers.some(t => t.toLowerCase().includes(s)) ||
                item.source.toLowerCase().includes(s);

            return matchCategory && matchSearch;
        });
    }, [news, selectedCategory, searchQuery]);

    // Separate Featured Hero Stories and Stream News
    const featuredStory = useMemo(() => {
        return news.find(n => n.isHot || n.impact === 'high') || news[0];
    }, [news]);

    const subStories = useMemo(() => {
        return news.filter(n => n.id !== featuredStory?.id).slice(0, 2);
    }, [news, featuredStory]);

    const streamNews = useMemo(() => {
        if (selectedCategory === 'all' && !searchQuery) {
            const featuredIds = new Set([featuredStory?.id, ...subStories.map(s => s.id)]);
            return filteredNews.filter(n => !featuredIds.has(n.id));
        }
        return filteredNews;
    }, [filteredNews, featuredStory, subStories, selectedCategory, searchQuery]);

    const kapNewsOnly = useMemo(() => {
        return news.filter(n => n.category === 'kap');
    }, [news]);

    // Top Breaking news ticker items
    const breakingHeadlines = useMemo(() => {
        return news.slice(0, 5);
    }, [news]);

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-8 min-h-screen pb-28 max-w-[1600px] mx-auto relative">

            {/* Top Breaking Ticker Bar */}
            {breakingHeadlines.length > 0 && (
                <div className="bg-[#00008B] text-white rounded-2xl p-2.5 px-4 flex items-center gap-3 shadow-lg shadow-[#00008B]/15 overflow-hidden">
                    <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-lg bg-red-500 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                        <Radio className="w-3.5 h-3.5" /> CANLI AKIŞ
                    </div>
                    <div className="overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-6 text-xs font-semibold text-blue-100">
                        {breakingHeadlines.map((item, idx) => (
                            <Link
                                key={idx}
                                href={`/dashboard/news/${item.slug}`}
                                className="hover:text-yellow-300 transition-colors flex items-center gap-2 shrink-0"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                                <span className="font-bold">{item.title}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-2">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-[#00008B] text-white text-[9px] font-black rounded-full uppercase tracking-widest">
                            FinAi Ekonomi Masası
                        </span>
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 text-[9px] font-black rounded-full border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1">
                            <Sparkles className="w-3 h-3 fill-current" /> Bloomberg HT • AA Finans • Ekonomim
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-[#00008B] tracking-tight">
                        Piyasa & Haber İstihbaratı
                    </h1>
                    <p className="text-[#00008B]/60 mt-1.5 font-bold uppercase text-[11px] tracking-[0.2em]">
                        Borsa İstanbul, KAP Bildirimleri, Şirket Gelişmeleri ve Küresel Piyasalar
                    </p>
                </div>

                {/* Right Controls: Search & Refresh */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[240px] sm:min-w-[280px]">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00008B]/40" />
                        <input
                            type="text"
                            placeholder="Haber veya hisse ara (#THYAO)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200/80 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold text-[#00008B] placeholder:text-[#00008B]/40 focus:outline-none focus:ring-2 focus:ring-[#00008B]/20 transition-all shadow-sm"
                        />
                    </div>

                    <button
                        onClick={() => fetchNewsData(true)}
                        disabled={refreshing || loading}
                        className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-black text-[#00008B] shadow-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                        title="Verileri Yenile"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        Yenile
                    </button>
                </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="overflow-x-auto scrollbar-none pb-1">
                <div className="flex items-center gap-2 min-w-max bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
                    {CATEGORY_TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isSelected = selectedCategory === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedCategory(tab.id)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                                    isSelected
                                        ? 'bg-[#00008B] text-white shadow-md shadow-[#00008B]/20'
                                        : 'text-[#00008B]/70 hover:text-[#00008B] hover:bg-white/60'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-28 space-y-4">
                    <div className="relative">
                        <Loader2 className="w-12 h-12 text-[#00008B] animate-spin" />
                        <Sparkles className="w-6 h-6 text-[#00008B] absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <p className="text-[#00008B] font-bold text-sm opacity-50">
                        Bloomberg HT, AA Finans ve Ekonomim haberleri derleniyor...
                    </p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-3xl flex items-center gap-4">
                    <AlertCircle className="w-8 h-8 text-red-500 shrink-0" />
                    <div>
                        <h3 className="font-black text-base">Haberler Alınamadı</h3>
                        <p className="text-xs text-red-600 mt-1">{error}</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-10">
                    {/* Hero Big Story (Only on 'all' tab without active search) */}
                    {selectedCategory === 'all' && !searchQuery && featuredStory && (
                        <NewsHeroCard
                            mainNews={featuredStory}
                            subNews={subStories}
                        />
                    )}

                    {/* Main Content: 8 Columns + 4 Columns Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        
                        {/* Left Side: Stream News Grid (8 Cols) */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#00008B]" />
                                    <h2 className="text-lg font-black text-[#00008B] uppercase tracking-wide">
                                        {CATEGORY_TABS.find(t => t.id === selectedCategory)?.label} Akışı
                                    </h2>
                                </div>
                                <span className="text-xs font-bold text-slate-400">
                                    {streamNews.length} Gelişme Listeleniyor
                                </span>
                            </div>

                            {streamNews.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {streamNews.map((item, idx) => (
                                        <NewsCard
                                            key={item.id || idx}
                                            item={item}
                                            index={idx}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white border border-slate-200/80 rounded-3xl p-16 text-center space-y-3">
                                    <Filter className="w-8 h-8 text-slate-300 mx-auto" />
                                    <h3 className="text-sm font-black text-[#00008B]">Bu kriterlere uygun haber bulunamadı</h3>
                                    <p className="text-xs text-slate-400">Arama kelimenizi değiştirebilir veya başka bir kategori seçebilirsiniz.</p>
                                </div>
                            )}
                        </div>

                        {/* Right Side: KAP Feed + Sentiment Index (4 Cols) */}
                        <div className="lg:col-span-4 space-y-6 sticky top-24">
                            {/* Sentiment Index Bar */}
                            <NewsSentimentWidget distribution={sentimentDist} />

                            {/* KAP Live Feed */}
                            <KapLiveFeedWidget
                                kapNews={kapNewsOnly}
                            />
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}

export default function NewsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#00008B]" />
            </div>
        }>
            <NewsContent />
        </Suspense>
    );
}
