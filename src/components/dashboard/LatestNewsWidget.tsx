"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Newspaper, ArrowRight } from "lucide-react";

export interface LatestNewsWidgetProps {
    news: any[];
}

function formatClockTime(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    } catch {
        return "--:--";
    }
}

function NewsThumbnail({ imageUrl, title }: { imageUrl?: string | null; title: string }) {
    const [hasError, setHasError] = useState(false);

    if (imageUrl && !hasError) {
        return (
            <div className="w-[60px] h-[60px] sm:w-[68px] sm:h-[68px] rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-100 relative shadow-2xs">
                <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={() => setHasError(true)}
                    loading="lazy"
                />
            </div>
        );
    }

    // FinAi Fallback Placeholder (Referans görseldeki kare thumbnail ölçeğinde)
    return (
        <div className="w-[60px] h-[60px] sm:w-[68px] sm:h-[68px] rounded-xl shrink-0 border border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50/40 flex flex-col items-center justify-center text-slate-400 relative select-none shadow-2xs group-hover:border-blue-100 transition-colors">
            <Newspaper className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
            <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 mt-1">FinAi</span>
        </div>
    );
}

export function LatestNewsWidget({ news }: LatestNewsWidgetProps) {
    // Referans tasarımda 4 adet yatay kart yan yana dizilir
    const newsList = Array.isArray(news) ? news.slice(0, 4) : [];

    return (
        <div className="bg-white border border-slate-100 hover:border-slate-200/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 md:p-5 shadow-xs hover:shadow-sm transition-all duration-300 flex flex-col justify-between h-full">
            {/* 1. Başlık Alanı (Referans görseldeki gibi) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100/80 shrink-0 mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <Newspaper className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
                            Son Haberler
                        </h3>
                    </div>
                </div>
                <Link
                    href="/dashboard/news"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors"
                >
                    Tümü <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            {/* 2. Haber Listesi: 4 Kolonlu Yatay Kartlar (Referans Görseldeki Birebir Düzen) */}
            {newsList.length > 0 ? (
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 gap-2 sm:gap-0">
                    {newsList.map((item, idx) => {
                        const href = item.slug
                            ? `/dashboard/news/${item.slug}`
                            : item.link
                            ? `/dashboard/news?url=${encodeURIComponent(item.link)}`
                            : "/dashboard/news";

                        return (
                            <Link
                                key={item.id || idx}
                                href={href}
                                className="group flex items-start gap-2.5 sm:gap-3 p-2 sm:px-3 sm:py-1 hover:bg-slate-50/70 rounded-xl transition-colors min-w-0"
                            >
                                {/* Kare Haber Görseli / Fallback */}
                                <NewsThumbnail imageUrl={item.imageUrl} title={item.title} />

                                {/* Sağ Bilgi Alanı: Saat + Başlık + Kategori */}
                                <div className="min-w-0 flex-1 flex flex-col justify-between h-[60px] sm:h-[68px]">
                                    {/* Saat */}
                                    <span className="text-[10px] sm:text-[11px] font-medium text-slate-400">
                                        {formatClockTime(item.pubDate)}
                                    </span>

                                    {/* Başlık */}
                                    <h4 className="text-[11px] sm:text-xs font-semibold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 my-auto">
                                        {item.title}
                                    </h4>

                                    {/* Kategori Badge */}
                                    <div>
                                        <span className="inline-block text-[9px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                                            {item.categoryLabel || "Ekonomi"}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="py-10 text-center text-xs font-semibold text-slate-400">
                    Henüz gösterilecek haber bulunmuyor.
                </div>
            )}
        </div>
    );
}
