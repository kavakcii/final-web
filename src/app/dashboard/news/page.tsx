"use client";

import { useState, useEffect } from "react";
import { Newspaper, Calendar, ExternalLink, Loader2, ArrowRight, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface NewsItem {
    title: string;
    link: string;
    pubDate: string;
    source: string;
    description: string;
}

export default function NewsPage() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loadingNews, setLoadingNews] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await fetch('/api/market-news');
                const data = await res.json();
                if (data.success) {
                    setNews(data.data);
                }
            } catch (error) {
                console.error("News fetch failed", error);
            } finally {
                setLoadingNews(false);
            }
        };

        fetchNews();
    }, []);

    return (
        <div className="p-8 space-y-8 min-h-full pb-20">
            {/* Header */}
            <div className="space-y-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Newspaper className="w-8 h-8 text-blue-500" />
                        Piyasa Haberleri
                    </h1>
                    <p className="text-slate-400 mt-2 max-w-2xl">
                        Piyasalarla ilgili son dakika gelişmeleri, analizler ve haberler.
                    </p>
                </div>
            </div>

            {/* Content */}
            {loadingNews ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            ) : news.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {news.map((item: any, idx: number) => (
                        <motion.a
                            key={idx}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group flex flex-col h-full"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                                    {item.source}
                                </span>
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(item.pubDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <h3 className="text-slate-800 font-bold mb-2 line-clamp-3 group-hover:text-blue-600 transition-colors">
                                {item.title}
                            </h3>
                            <div className="flex-1">
                                <p className="text-sm text-slate-500 line-clamp-3 mb-4">
                                    {item.description}
                                </p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-xs text-slate-500 font-medium">Haberin devamı</span>
                                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                            </div>
                        </motion.a>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-white/5">
                    <Newspaper className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Haber Bulunamadı</h3>
                    <p className="text-slate-400">Şu anda görüntülenecek piyasa haberi bulunmamaktadır.</p>
                </div>
            )}
        </div>
    );
}
