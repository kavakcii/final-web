"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, FileText, ArrowRight } from "lucide-react";
import { EnrichedNewsItem } from "@/app/api/news/route";

interface NewsCardProps {
    item: EnrichedNewsItem;
    index: number;
}

export function NewsCard({ item, index }: NewsCardProps) {
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

    // Sadece kategoriyle aynı olmayan spesifik varlıkları al
    const rawAssets = item.affectedAssets && item.affectedAssets.length > 0
        ? item.affectedAssets
        : (item.tickers || []);

    const specificAssets = rawAssets.filter(a => 
        a.toLowerCase() !== item.categoryLabel.toLowerCase() &&
        !item.categoryLabel.toLowerCase().includes(a.toLowerCase())
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.04, 0.3) }}
            className="bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-[#00008B]/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group h-full relative"
        >
            {/* Top Bar: Etkilenen Varlıklar & Kategori */}
            <div className="flex items-center justify-between gap-2 mb-3">
                {specificAssets.length > 0 ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Etkilenen:</span>
                        {specificAssets.map((asset, sIdx) => (
                            <span key={sIdx} className="text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                                {asset}
                            </span>
                        ))}
                    </div>
                ) : (
                    <div />
                )}

                <span className="text-[9px] font-black text-[#00008B] bg-[#00008B]/5 px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                    {item.categoryLabel}
                </span>
            </div>

            {/* Title */}
            <Link href={`/dashboard/news/${item.slug}`} className="block mb-3">
                <h3 className="text-base font-bold text-[#00008B] leading-snug group-hover:text-blue-700 transition-colors line-clamp-3">
                    {item.title}
                </h3>
            </Link>

            {/* Description */}
            <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-3 mb-5">
                {item.description}
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
                    <Link
                        href={`/dashboard/news/${item.slug}`}
                        className="px-4 py-2 bg-[#00008B] hover:bg-[#0808a3] text-white text-[11px] font-black rounded-xl shadow-md shadow-[#00008B]/20 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
                    >
                        <FileText className="w-3.5 h-3.5" />
                        Haberi Oku <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
