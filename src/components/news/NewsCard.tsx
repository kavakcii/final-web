"use client";

import { motion } from "framer-motion";
import { Clock, ExternalLink, FileText, TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { EnrichedNewsItem } from "@/app/api/news/route";

interface NewsCardProps {
    item: EnrichedNewsItem;
    index: number;
    onOpenArticle: (url: string) => void;
}

export function NewsCard({ item, index, onOpenArticle }: NewsCardProps) {
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
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.04, 0.3) }}
            className="bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-[#00008B]/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group h-full relative"
        >
            {/* Top Bar: Category & Sentiment */}
            <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[9px] font-black text-[#00008B] bg-[#00008B]/5 px-3 py-1 rounded-full uppercase tracking-wider">
                    {item.categoryLabel}
                </span>

                <div className="flex items-center gap-2">
                    {item.sentiment === 'bullish' ? (
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Boğa
                        </span>
                    ) : item.sentiment === 'bearish' ? (
                        <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" /> Ayı
                        </span>
                    ) : (
                        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Minus className="w-2.5 h-2.5" /> Nötr
                        </span>
                    )}
                </div>
            </div>

            {/* Tickers */}
            {item.tickers && item.tickers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {item.tickers.map((sym, sIdx) => (
                        <span key={sIdx} className="text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                            #{sym}
                        </span>
                    ))}
                </div>
            )}

            {/* Title */}
            <h3 
                onClick={() => onOpenArticle(item.link)}
                className="text-base font-bold text-[#00008B] leading-snug group-hover:text-blue-700 transition-colors cursor-pointer line-clamp-3 mb-3"
            >
                {item.title}
            </h3>

            {/* AI Summary / Description */}
            <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-3 mb-5">
                {item.aiSummary || item.description}
            </p>

            {/* Bottom Controls */}
            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-700">{item.source}</span>
                    <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTimeAgo(item.pubDate)}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onOpenArticle(item.link)}
                        className="px-3.5 py-2 bg-[#00008B] hover:bg-[#0808a3] text-white text-[11px] font-black rounded-xl shadow-md shadow-[#00008B]/20 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
                    >
                        <FileText className="w-3.5 h-3.5" />
                        AI Özet
                    </button>
                    <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-slate-400 hover:text-[#00008B] hover:bg-slate-100 rounded-xl transition-colors"
                        title="Orijinal Kaynağı Aç"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>
        </motion.div>
    );
}
