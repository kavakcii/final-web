"use client";

import Link from "next/link";
import { Newspaper, ArrowRight, Clock, TrendingUp, TrendingDown } from "lucide-react";

export interface LatestNewsWidgetProps {
    news: any[];
}

function formatTimeAgo(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 60) return `${Math.max(1, diffMin)} dk önce`;
        const diffHours = Math.floor(diffMin / 60);
        if (diffHours < 24) return `${diffHours} saat önce`;
        return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
    } catch {
        return "Bugün";
    }
}

export function LatestNewsWidget({ news }: LatestNewsWidgetProps) {
    const newsList = Array.isArray(news) ? news.slice(0, 5) : [];

    return (
        <div className="bg-white border border-slate-100 hover:border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all duration-300 flex flex-col justify-between h-full">
            {/* 1. Başlık Alanı */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100/80 shrink-0 mb-2">
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
                    Tümünü Gör <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            {/* 2. Haber Listesi */}
            {newsList.length > 0 ? (
                <div className="flex-1 divide-y divide-slate-100/80">
                    {newsList.map((item, idx) => {
                        const href = item.slug
                            ? `/dashboard/news/${item.slug}`
                            : item.link
                            ? `/dashboard/news?url=${encodeURIComponent(item.link)}`
                            : "/dashboard/news";

                        const specificAssets = (item.affectedAssets && item.affectedAssets.length > 0
                            ? item.affectedAssets
                            : item.tickers || []
                        ).filter(
                            (a: string) =>
                                a &&
                                item.categoryLabel &&
                                a.toLowerCase() !== item.categoryLabel.toLowerCase()
                        );

                        return (
                            <Link
                                key={item.id || idx}
                                href={href}
                                className="group block -mx-2 px-2 py-2.5 rounded-xl hover:bg-slate-50/70 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        {/* Haber Başlığı */}
                                        <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 mb-1.5">
                                            {item.title}
                                        </h4>

                                        {/* Meta Bilgileri: Kaynak · Zaman · Ticker · Kategori */}
                                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                                            <span className="font-medium text-slate-500">
                                                {item.source || "FinAi"}
                                            </span>
                                            <span>·</span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5 text-slate-400" />
                                                {formatTimeAgo(item.pubDate)}
                                            </span>

                                            {/* Kategori Badge */}
                                            {item.categoryLabel && (
                                                <>
                                                    <span>·</span>
                                                    <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded">
                                                        {item.categoryLabel}
                                                    </span>
                                                </>
                                            )}

                                            {/* Ticker Badges */}
                                            {specificAssets.slice(0, 2).map((asset: string, aIdx: number) => (
                                                <span
                                                    key={aIdx}
                                                    className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50"
                                                >
                                                    {asset}
                                                </span>
                                            ))}

                                            {/* Sentiment (Bullish/Bearish) */}
                                            {item.sentiment === "bullish" && (
                                                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded">
                                                    <TrendingUp className="w-2.5 h-2.5" />
                                                    Pozitif
                                                </span>
                                            )}
                                            {item.sentiment === "bearish" && (
                                                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200/60 px-1.5 py-0.5 rounded">
                                                    <TrendingDown className="w-2.5 h-2.5" />
                                                    Negatif
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Görsel Alanı: SADECE gerçek bir görsel URL'si varsa render edilir */}
                                    {item.imageUrl && (
                                        <div className="w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden shrink-0 border border-slate-100 bg-slate-100">
                                            <img
                                                src={item.imageUrl}
                                                alt={item.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="py-12 text-center text-xs font-semibold text-slate-400">
                    Henüz gösterilecek haber bulunmuyor.
                </div>
            )}
        </div>
    );
}
