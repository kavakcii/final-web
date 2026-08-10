"use client";

import Link from "next/link";
import { Zap, Building2, ChevronRight, ExternalLink } from "lucide-react";
import { EnrichedNewsItem } from "@/app/api/news/route";

interface KapLiveFeedWidgetProps {
    kapNews: EnrichedNewsItem[];
}

export function KapLiveFeedWidget({ kapNews }: KapLiveFeedWidgetProps) {
    const formatTime = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '--:--';
        }
    };

    return (
        <div className="bg-[#00008B] text-white rounded-3xl p-6 shadow-xl shadow-[#00008B]/20 space-y-5 border border-blue-900 h-full flex flex-col justify-between">
            <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center text-yellow-400">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">
                                KAP & Şirket Bildirimleri
                            </h3>
                            <p className="text-[10px] font-bold text-blue-200">
                                Borsa İstanbul Şirket Açıklamaları & Halka Arzlar
                            </p>
                        </div>
                    </div>

                    <span className="flex items-center gap-1.5 text-[9px] font-black bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        CANLI AKIŞ
                    </span>
                </div>

                {/* Notifications Stream */}
                <div className="divide-y divide-white/10 max-h-[560px] overflow-y-auto pr-1 mt-2 scrollbar-thin scrollbar-thumb-white/20">
                    {kapNews && kapNews.length > 0 ? (
                        kapNews.map((item, idx) => {
                            const assets = item.affectedAssets && item.affectedAssets.length > 0
                                ? item.affectedAssets
                                : (item.tickers || []);

                            return (
                                <Link
                                    key={item.id || idx}
                                    href={`/dashboard/news/${item.slug}`}
                                    className="py-3.5 block group hover:bg-white/10 rounded-2xl px-2.5 transition-all"
                                >
                                    <div className="flex items-center justify-between text-[10px] font-bold text-blue-200 mb-1.5">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {assets.map((asset, aIdx) => (
                                                <span key={aIdx} className="text-yellow-400 font-black bg-white/10 px-2 py-0.5 rounded-md">
                                                    #{asset}
                                                </span>
                                            ))}
                                        </div>
                                        <span className="text-blue-300 font-semibold">{formatTime(item.pubDate)}</span>
                                    </div>
                                    <p className="text-xs font-bold text-white leading-snug group-hover:text-yellow-300 transition-colors line-clamp-2">
                                        {item.title}
                                    </p>
                                </Link>
                            );
                        })
                    ) : (
                        <div className="py-16 text-center text-xs font-bold text-blue-200">
                            Şirket bildirimleri taranıyor...
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Footer Bar */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-blue-200">
                <span>Aktif Gelişmeler</span>
                <span className="text-white font-black bg-white/10 px-2.5 py-0.5 rounded-lg">
                    {kapNews.length} Bildirim
                </span>
            </div>
        </div>
    );
}
