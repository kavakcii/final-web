"use client";

import Link from "next/link";
import { Lightbulb, ChevronRight, ArrowRight, FileText } from "lucide-react";

export interface FeaturedNewsWidgetProps {
    news: any[];
}

export function FeaturedNewsWidget({ news }: FeaturedNewsWidgetProps) {
    const newsList = Array.isArray(news) ? news.slice(0, 4) : [];

    return (
        <div className="bg-white border border-slate-100 hover:border-slate-200/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 md:p-5 shadow-xs hover:shadow-sm transition-all duration-300 flex flex-col justify-between h-full">
            {/* 1. Başlık Alanı (Referans Görseldeki Gibi) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100/80 shrink-0 mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
                            Öne Çıkanlar
                        </h3>
                    </div>
                </div>
            </div>

            {/* 2. Liste Öğeleri (Referans Görseldeki Ok İkonlu Satır Mimarisi) */}
            {newsList.length > 0 ? (
                <div className="flex-1 flex flex-col justify-between py-1 divide-y divide-slate-100/80">
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
                                className="group flex items-center justify-between gap-2.5 py-2 hover:bg-slate-50/70 -mx-1 px-1 rounded-lg transition-colors"
                            >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
                                    <span className="text-[11px] sm:text-xs font-medium text-slate-700 group-hover:text-blue-600 transition-colors line-clamp-1">
                                        {item.title}
                                    </span>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="py-8 text-center text-xs font-semibold text-slate-400">
                    Öne çıkan gelişme bulunmuyor.
                </div>
            )}

            {/* 3. Alt Bağlantı (Referans Görsel: 'Tüm analizleri gör →') */}
            <div className="pt-2.5 border-t border-slate-100/80 mt-1">
                <Link
                    href="/dashboard/analysis"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-blue-600 transition-colors"
                >
                    Tüm analizleri gör <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
        </div>
    );
}
