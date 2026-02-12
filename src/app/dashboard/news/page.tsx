"use client";

import { useState, useEffect } from "react";
import { Newspaper, Calendar, ExternalLink, Loader2, Target, TrendingUp, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/components/providers/UserProvider";

interface NewsItem {
    title: string;
    link: string;
    pubDate: string;
    source: string;
    description: string;
    isRelevant?: boolean; // Portföyle ilgili mi?
    relatedAsset?: string;
}

export default function NewsPage() {
    const { user } = useUser();
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                // 1. Fetch User Portfolio
                const { data: portfolioData, error: portfolioError } = await supabase
                    .from('user_portfolios')
                    .select('symbol, asset_type')
                    .eq('user_id', user.id);

                if (portfolioError) throw portfolioError;

                const userAssets = new Set(portfolioData?.map(p => p.symbol.toUpperCase()) || []);

                // 2. Fetch News
                const res = await fetch('/api/news');
                const data = await res.json();

                if (data.success && Array.isArray(data.news)) {
                    // 3. Match News with Portfolio
                    const processedNews: NewsItem[] = data.news.map((item: any) => {
                        // Check if title or description contains any asset symbol
                        let relatedAssetString = '';
                        const isRelevant = Array.from(userAssets).some(asset => {
                            // Simple word boundary check to avoid partial matches (e.g. searching 'IS' in 'ISRAEL')
                            const regex = new RegExp(`\\b${asset}\\b`, 'i');
                            if (regex.test(item.title) || regex.test(item.description)) {
                                relatedAssetString = asset;
                                return true;
                            }
                            return false;
                        });

                        return {
                            ...item,
                            isRelevant,
                            relatedAsset: relatedAssetString
                        };
                    });

                    setNews(processedNews);
                } else {
                    setError("Haberler alınamadı.");
                }

            } catch (err: any) {
                console.error("News page error:", err);
                setError(err.message || "Bir hata oluştu.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // Separate news into categories
    const smartNews = news.filter(n => n.isRelevant);
    const generalNews = news.filter(n => !n.isRelevant);

    // Format date helper
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('tr-TR', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-8 min-h-full pb-20 max-w-7xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Newspaper className="w-8 h-8 text-blue-500" />
                    Türkiye ve Dünya Ekonomisi
                </h1>
                <p className="text-slate-400 mt-2">
                    Borsa, Döviz, Altın ve Türkiye gündemine dair son dakika gelişmeleri.
                </p>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                    <p className="text-slate-500">Haberler derleniyor...</p>
                </div>
            ) : error ? (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            ) : (
                <div className="space-y-12">

                    {/* ✅ SMART RECOMMENDATIONS */}
                    {smartNews.length > 0 && (
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <Target className="w-6 h-6 text-yellow-500" />
                                <h2 className="text-xl font-bold text-white">
                                    Sizin İçin Önemli
                                    <span className="ml-2 text-sm font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                                        Portföyünüzle İlgili {smartNews.length} Haber
                                    </span>
                                </h2>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {smartNews.map((item, idx) => (
                                    <motion.a
                                        key={`smart-${idx}`}
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        whileHover={{ scale: 1.01 }}
                                        className="bg-gradient-to-br from-blue-900/20 to-indigo-900/10 border border-blue-500/30 rounded-xl p-5 hover:border-blue-400 transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Target className="w-24 h-24 text-blue-400 transform rotate-12" />
                                        </div>

                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-xs font-bold text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                                                    {item.source}
                                                </span>
                                                {item.relatedAsset && (
                                                    <span className="text-xs font-bold text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-full border border-yellow-500/20 flex items-center gap-1">
                                                        <Target className="w-3 h-3" />
                                                        {item.relatedAsset} İle İlgili
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="text-lg font-bold text-blue-100 mb-2 group-hover:text-blue-300 transition-colors line-clamp-2">
                                                {item.title}
                                            </h3>

                                            <div className="text-sm text-slate-400 mb-4 line-clamp-2" dangerouslySetInnerHTML={{ __html: item.description }} />

                                            <div className="flex items-center justify-between text-xs text-slate-500 border-t border-white/5 pt-3 mt-auto">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(item.pubDate)}
                                                </span>
                                                <span className="flex items-center gap-1 text-blue-400 group-hover:underline">
                                                    Haberi Oku <ExternalLink className="w-3 h-3" />
                                                </span>
                                            </div>
                                        </div>
                                    </motion.a>
                                ))}
                            </div>
                        </motion.section>
                    )}

                    {/* 🌍 GENERAL NEWS */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-6 h-6 text-emerald-500" />
                            <h2 className="text-xl font-bold text-white">Türkiye ve Piyasa Gündemi</h2>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {generalNews.map((item, idx) => (
                                <motion.a
                                    key={`gen-${idx}`}
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-slate-900/40 rounded-xl p-5 border border-white/5 hover:border-white/10 hover:bg-slate-800/60 transition-all group flex flex-col h-full"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-medium text-slate-400 bg-white/5 px-2 py-1 rounded-md">
                                            {item.source}
                                        </span>
                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(item.pubDate)}
                                        </span>
                                    </div>

                                    <h3 className="text-base font-semibold text-slate-200 mb-2 line-clamp-3 group-hover:text-emerald-400 transition-colors">
                                        {item.title}
                                    </h3>

                                    <div className="flex-1">
                                        <div className="text-sm text-slate-500 line-clamp-3 mb-4" dangerouslySetInnerHTML={{ __html: item.description }} />
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-end">
                                        <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-emerald-500 transition-colors" />
                                    </div>
                                </motion.a>
                            ))}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
