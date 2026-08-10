"use client";

import { useState, useEffect, Suspense, useMemo, useRef } from "react";
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
    ChevronRight,
    ChevronDown,
    Filter,
    Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/components/providers/UserProvider";
import { EnrichedNewsItem } from "@/app/api/news/route";
import { NewsHeroCard } from "@/components/news/NewsHeroCard";
import { NewsCard } from "@/components/news/NewsCard";
import { KapLiveFeedWidget } from "@/components/news/KapLiveFeedWidget";

const CATEGORY_OPTIONS = [
    { id: 'all', label: 'Tüm Haberler', sectionTitle: 'Günün Önemli Haberleri', icon: Newspaper },
    { id: 'portfolio', label: 'Portföyüm', sectionTitle: 'Portföyünüze Özel Haberler', icon: PieChart },
    { id: 'bist', label: 'Borsa İstanbul', sectionTitle: 'Borsa İstanbul Gelişmeleri', icon: TrendingUp },
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

    // Filter & Pagination states
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handle Category change & reset page
    const handleCategoryChange = (catId: string) => {
        setSelectedCategory(catId);
        setCurrentPage(1);
        setIsDropdownOpen(false);
    };

    // Filter news client-side
    const filteredNews = useMemo(() => {
        return news.filter(item => {
            if (selectedCategory === 'all') return true;
            return item.category === selectedCategory;
        });
    }, [news, selectedCategory]);

    // Separate Featured Hero Stories and Stream News (Portföyde olan hisselerin en güncel haberleri öncelikli)
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
        return news.filter(n => n.category === 'kap' || (n.category === 'bist' && n.tickers && n.tickers.length > 0));
    }, [news]);

    // Top Breaking news ticker items (3 items filling the full horizontal width)
    const breakingHeadlines = useMemo(() => {
        return news.slice(0, 3);
    }, [news]);

    const currentTabInfo = useMemo(() => {
        return CATEGORY_OPTIONS.find(t => t.id === selectedCategory) || CATEGORY_OPTIONS[0];
    }, [selectedCategory]);

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-8 min-h-screen pb-28 max-w-[1600px] mx-auto relative">

            {/* Top Breaking Ticker Bar (Dengeli 3 Eşit Kolon, Tam Genişlik Doldurma) */}
            {breakingHeadlines.length > 0 && (
                <div className="bg-gradient-to-r from-[#00008B] via-[#0505a5] to-[#0a1e3d] border border-white/10 text-white rounded-2xl p-2.5 px-4 flex flex-col md:flex-row items-stretch md:items-center gap-3 shadow-xl shadow-[#00008B]/15 overflow-hidden backdrop-blur-xl w-full">
                    <div className="flex items-center gap-1.5 shrink-0 px-3 py-1 rounded-lg bg-red-500 text-white text-[10px] font-black uppercase tracking-wider animate-pulse shadow-md shadow-red-500/30 w-fit">
                        <Radio className="w-3.5 h-3.5" /> CANLI AKIŞ
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 flex-1 items-center divide-y md:divide-y-0 md:divide-x divide-white/10 text-xs font-semibold text-blue-100">
                        {breakingHeadlines.map((item, idx) => (
                            <Link
                                key={idx}
                                href={`/dashboard/news/${item.slug}`}
                                className={`hover:text-yellow-300 transition-colors flex items-center gap-2 truncate ${idx > 0 ? 'md:pl-4 pt-1 md:pt-0' : ''}`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                                <span className="font-bold truncate" title={item.title}>{item.title}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-3 py-1 bg-[#00008B] text-white text-[9px] font-black rounded-full uppercase tracking-widest">
                            FinAi Haber Masası
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-[#00008B] tracking-tight">
                        Piyasa Haberleri
                    </h1>
                    <p className="text-[#00008B]/60 mt-1 font-bold uppercase text-[11px] tracking-[0.2em]">
                        Borsa, Şirket ve Finans Gelişmeleri
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

            {loading ? (
                <div className="flex flex-col items-center justify-center py-28 space-y-4">
                    <div className="relative">
                        <Loader2 className="w-12 h-12 text-[#00008B] animate-spin" />
                        <Sparkles className="w-6 h-6 text-[#00008B] absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <p className="text-[#00008B] font-bold text-sm opacity-50">
                        Güncel piyasa haberleri derleniyor...
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

                    {/* Main Content: 8 Columns (Stream + Filter Dropdown) + 4 Columns (KAP Panel) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        
                        {/* Left Side: Stream News Grid with Dropdown Filter (8 Cols) */}
                        <div className="lg:col-span-8 space-y-6">
                            
                            {/* Section Title & Dropdown Filter Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-3 h-3 rounded-full bg-[#00008B]" />
                                    <h2 className="text-lg md:text-xl font-black text-[#00008B] tracking-tight">
                                        {currentTabInfo.sectionTitle}
                                    </h2>
                                </div>

                                {/* Dropdown Filter Menu */}
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-[#00008B]/40 rounded-2xl text-xs font-black text-[#00008B] shadow-sm hover:shadow-md transition-all cursor-pointer"
                                    >
                                        <Filter className="w-3.5 h-3.5 text-[#00008B]" />
                                        <span className="text-slate-400 font-bold">Kategori:</span>
                                        <span className="text-[#00008B]">{currentTabInfo.label}</span>
                                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {isDropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                                className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 z-50 overflow-hidden"
                                            >
                                                <div className="space-y-1">
                                                    {CATEGORY_OPTIONS.map((option) => {
                                                        const Icon = option.icon;
                                                        const isSelected = selectedCategory === option.id;
                                                        return (
                                                            <button
                                                                key={option.id}
                                                                onClick={() => handleCategoryChange(option.id)}
                                                                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${
                                                                    isSelected 
                                                                        ? 'bg-[#00008B] text-white shadow-md' 
                                                                        : 'text-slate-700 hover:bg-slate-50 hover:text-[#00008B]'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#00008B]'}`} />
                                                                    <span>{option.label}</span>
                                                                </div>
                                                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
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

                        {/* Right Side: Genişletilmiş KAP & Şirket Bildirimleri Paneli (4 Cols) */}
                        <div className="lg:col-span-4 sticky top-24">
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
