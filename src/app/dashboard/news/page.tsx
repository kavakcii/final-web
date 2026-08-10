"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import Link from "next/link";
import { 
    Newspaper, 
    RefreshCw, 
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
    Radio,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";
import { EnrichedNewsItem } from "@/app/api/news/route";
import { NewsHeroCard } from "@/components/news/NewsHeroCard";
import { NewsCard } from "@/components/news/NewsCard";
import { NewsSentimentWidget } from "@/components/news/NewsSentimentWidget";
import { KapLiveFeedWidget } from "@/components/news/KapLiveFeedWidget";

const CATEGORY_TABS = [
    { id: 'all', label: 'Tüm Haberler', sectionTitle: 'Günün Önemli Haberleri', icon: Newspaper },
    { id: 'portfolio', label: 'Portföyüm', sectionTitle: 'Portföyünüze Özel Haberler', icon: PieChart },
    { id: 'bist', label: 'Borsa İstanbul', sectionTitle: 'Borsa İstanbul Gelişmeleri', icon: TrendingUp },
    { id: 'kap', label: 'KAP & Şirketler', sectionTitle: 'KAP & Şirket Bildirimleri', icon: Building2 },
    { id: 'commodity', label: 'Altın & Emtia', sectionTitle: 'Altın & Emtia Piyasaları', icon: Flame },
    { id: 'macro', label: 'Makro Ekonomi', sectionTitle: 'Makro Ekonomi & Para Politikası', icon: Zap },
    { id: 'global', label: 'Küresel Piyasalar', sectionTitle: 'Küresel Piyasa Gelişmeleri', icon: Globe },
    { id: 'crypto', label: 'Kripto Varlıklar', sectionTitle: 'Kripto Para Haberleri', icon: Coins }
];

const ITEMS_PER_PAGE = 6;

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

    // Filter & Pagination states
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState<number>(1);

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

    // Handle Category change & reset page
    const handleCategoryChange = (catId: string) => {
        setSelectedCategory(catId);
        setCurrentPage(1);
    };

    // Filter news client-side
    const filteredNews = useMemo(() => {
        return news.filter(item => {
            if (selectedCategory === 'all') return true;
            return item.category === selectedCategory;
        });
    }, [news, selectedCategory]);

    // Separate Featured Hero Stories and Stream News (Portföyde olan hisselerin en son haberleri öncelikli)
    const { featuredStory, subStories } = useMemo(() => {
        const portfolioMatches = news.filter(n => n.category === 'portfolio');
        const otherHotNews = news.filter(n => n.category !== 'portfolio');

        let pool = [...portfolioMatches, ...otherHotNews];
        const main = pool[0] || null;
        const subs = pool.slice(1, 3);

        return { featuredStory: main, subStories: subs };
    }, [news]);

    const streamNews = useMemo(() => {
        if (selectedCategory === 'all') {
            const featuredIds = new Set([featuredStory?.id, ...subStories.map(s => s.id)].filter(Boolean));
            return filteredNews.filter(n => !featuredIds.has(n.id));
        }
        return filteredNews;
    }, [filteredNews, featuredStory, subStories, selectedCategory]);

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(streamNews.length / ITEMS_PER_PAGE));
    const paginatedNews = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return streamNews.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [streamNews, currentPage]);

    const kapNewsOnly = useMemo(() => {
        return news.filter(n => n.category === 'kap');
    }, [news]);

    // Top Breaking news ticker items (Exact 3 items, strictly no horizontal scrollbar)
    const breakingHeadlines = useMemo(() => {
        return news.slice(0, 3);
    }, [news]);

    const currentTabInfo = useMemo(() => {
        return CATEGORY_TABS.find(t => t.id === selectedCategory) || CATEGORY_TABS[0];
    }, [selectedCategory]);

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-8 min-h-screen pb-28 max-w-[1600px] mx-auto relative">

            {/* Top Breaking Ticker Bar (Strictly No Scrollbar, 2-3 headlines) */}
            {breakingHeadlines.length > 0 && (
                <div className="bg-[#00008B] text-white rounded-2xl p-2.5 px-4 flex items-center gap-3 shadow-lg shadow-[#00008B]/15 overflow-hidden">
                    <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-lg bg-red-500 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                        <Radio className="w-3.5 h-3.5" /> CANLI AKIŞ
                    </div>
                    <div className="flex items-center gap-6 text-xs font-semibold text-blue-100 truncate overflow-hidden">
                        {breakingHeadlines.map((item, idx) => (
                            <Link
                                key={idx}
                                href={`/dashboard/news/${item.slug}`}
                                className="hover:text-yellow-300 transition-colors flex items-center gap-2 truncate shrink-0"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                                <span className="font-bold truncate max-w-[280px] sm:max-w-md">{item.title}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
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

                {/* Right Controls: Refresh Button */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchNewsData(true)}
                        disabled={refreshing || loading}
                        className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-black text-[#00008B] shadow-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
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
                                onClick={() => handleCategoryChange(tab.id)}
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
                    {/* Hero Big Story (Only on 'all' tab) */}
                    {selectedCategory === 'all' && featuredStory && (
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
                                        {currentTabInfo.sectionTitle}
                                    </h2>
                                </div>
                                <span className="text-xs font-bold text-slate-400">
                                    Toplam {streamNews.length} Haber (Sayfa {currentPage} / {totalPages})
                                </span>
                            </div>

                            {paginatedNews.length > 0 ? (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {paginatedNews.map((item, idx) => (
                                            <NewsCard
                                                key={item.id || idx}
                                                item={item}
                                                index={idx}
                                            />
                                        ))}
                                    </div>

                                    {/* Pagination Controls (1, 2, 3, 4 ...) */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-2 pt-6 border-t border-slate-100">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                                className="p-2.5 rounded-xl border border-slate-200 bg-white text-[#00008B] font-black disabled:opacity-30 hover:bg-slate-50 transition-all flex items-center gap-1 text-xs"
                                            >
                                                <ChevronLeft className="w-4 h-4" /> Önceki
                                            </button>

                                            <div className="flex items-center gap-1.5">
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                                                            currentPage === pageNum
                                                                ? 'bg-[#00008B] text-white shadow-md shadow-[#00008B]/20 scale-105'
                                                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                ))}
                                            </div>

                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                disabled={currentPage === totalPages}
                                                className="p-2.5 rounded-xl border border-slate-200 bg-white text-[#00008B] font-black disabled:opacity-30 hover:bg-slate-50 transition-all flex items-center gap-1 text-xs"
                                            >
                                                Sonraki <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-white border border-slate-200/80 rounded-3xl p-16 text-center space-y-3">
                                    <Newspaper className="w-8 h-8 text-slate-300 mx-auto" />
                                    <h3 className="text-sm font-black text-[#00008B]">Bu kategoride henüz haber bulunmuyor</h3>
                                    <p className="text-xs text-slate-400">Diğer kategorileri inceleyebilirsiniz.</p>
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
