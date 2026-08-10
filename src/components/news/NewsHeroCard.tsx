"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, TrendingDown, Minus, Clock, FileText, ArrowRight } from "lucide-react";
import { EnrichedNewsItem } from "@/app/api/news/route";

interface NewsHeroCardProps {
    mainNews: EnrichedNewsItem;
    subNews: EnrichedNewsItem[];
}

export function NewsHeroCard({ mainNews, subNews }: NewsHeroCardProps) {
    if (!mainNews) return null;

    const formatTimeAgo = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMin = Math.floor(diffMs / 60000);
            if (diffMin < 60) return `${Math.max(1, diffMin)} dk önce`;
            const diffHours = Math.floor(diffMin / 60);
            if (diffHours < 24) return `${diffHours} saat önce`;
            return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        } catch {
            return 'Bugün';
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Main Featured Big Story (7 Cols) */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-7 bg-gradient-to-br from-[#00008B] via-[#000066] to-[#0a1e3d] text-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-[#00008B]/25 relative overflow-hidden flex flex-col justify-between group border border-white/10"
            >
                {/* Background Ambient Glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

                {/* Top Badges */}
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-2">
                        <span className="px-3.5 py-1.5 bg-yellow-400 text-yellow-950 text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-md shadow-yellow-400/20">
                            <Sparkles className="w-3.5 h-3.5 fill-current" /> MANŞET GELİŞME
                        </span>
                        <span className="px-3 py-1 bg-white/10 text-blue-100 text-[10px] font-bold rounded-full uppercase tracking-wider backdrop-blur-md border border-white/10">
                            {mainNews.categoryLabel}
                        </span>
                    </div>

                    {mainNews.sentiment === 'bullish' ? (
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-black rounded-full border border-emerald-400/30 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> POZİTİF ETKİ
                        </span>
                    ) : mainNews.sentiment === 'bearish' ? (
                        <span className="px-3 py-1 bg-rose-500/20 text-rose-300 text-[10px] font-black rounded-full border border-rose-400/30 flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" /> SATIŞ BASKISI
                        </span>
                    ) : (
                        <span className="px-3 py-1 bg-white/10 text-slate-300 text-[10px] font-bold rounded-full border border-white/10 flex items-center gap-1">
                            <Minus className="w-3 h-3" /> DENGELİ
                        </span>
                    )}
                </div>

                {/* Headline & Body */}
                <div className="relative z-10 space-y-4 my-auto">
                    {mainNews.tickers && mainNews.tickers.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {mainNews.tickers.map((t, idx) => (
                                <span key={idx} className="px-2.5 py-0.5 rounded-lg bg-blue-500/30 text-blue-200 text-xs font-black tracking-wider border border-blue-400/30">
                                    #{t}
                                </span>
                            ))}
                        </div>
                    )}

                    <Link href={`/dashboard/news/${mainNews.slug}`} className="block group/link">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-tight text-white group-hover/link:text-yellow-300 transition-colors">
                            {mainNews.title}
                        </h2>
                    </Link>

                    <p className="text-white/80 text-sm sm:text-base font-medium leading-relaxed line-clamp-3">
                        {mainNews.description}
                    </p>
                </div>

                {/* Bottom Bar */}
                <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-xs text-white/60 font-semibold">
                        <span className="font-bold text-white">{mainNews.source}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTimeAgo(mainNews.pubDate)}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={`/dashboard/news/${mainNews.slug}`}
                            className="px-6 py-3 bg-white text-[#00008B] hover:bg-blue-50 text-xs font-black rounded-2xl shadow-xl shadow-white/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <FileText className="w-4 h-4" />
                            Haberi Oku <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* Side 2 Spotlight Cards (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
                {subNews.slice(0, 2).map((item, idx) => (
                    <Link
                        key={item.id || idx}
                        href={`/dashboard/news/${item.slug}`}
                        className="flex-1 bg-white border border-slate-200/80 hover:border-[#00008B]/40 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="px-3 py-1 rounded-full text-[9px] font-black bg-[#00008B]/5 text-[#00008B] uppercase tracking-widest">
                                {item.categoryLabel}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(item.pubDate)}
                            </span>
                        </div>

                        <div>
                            {item.tickers && item.tickers.length > 0 && (
                                <div className="flex gap-1 mb-2">
                                    {item.tickers.map((t, tIdx) => (
                                        <span key={tIdx} className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                            #{t}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <h3 className="text-base font-bold text-[#00008B] group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                                {item.title}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium mt-2 line-clamp-2 leading-relaxed">
                                {item.description}
                            </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-400 text-[11px]">{item.source}</span>
                            <span className="text-[#00008B] font-black text-[11px] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                Haberi Oku <ArrowRight className="w-3 h-3" />
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
