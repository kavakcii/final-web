"use client";

import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";
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
        <div className="bg-[#00008B] text-white rounded-3xl p-6 shadow-xl shadow-[#00008B]/20 space-y-4 border border-blue-900">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-yellow-400">
                        <Zap className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">
                            KAP & Şirket Akışı
                        </h3>
                        <p className="text-[10px] font-bold text-blue-200">
                            Resmi Şirket & Halka Arz Bildirimleri
                        </p>
                    </div>
                </div>

                <span className="flex items-center gap-1 text-[9px] font-black bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    CANLI
                </span>
            </div>

            <div className="divide-y divide-white/10 max-h-[380px] overflow-y-auto pr-1">
                {kapNews && kapNews.length > 0 ? (
                    kapNews.slice(0, 6).map((item, idx) => (
                        <Link
                            key={item.id || idx}
                            href={`/dashboard/news/${item.slug}`}
                            className="py-3 block group hover:bg-white/10 rounded-xl px-2 transition-all"
                        >
                            <div className="flex items-center justify-between text-[10px] font-bold text-blue-200 mb-1">
                                <span className="flex items-center gap-1.5 text-yellow-400 font-black">
                                    {item.tickers && item.tickers.length > 0 ? `#${item.tickers.join(', ')}` : 'KAP BİLDİRİMİ'}
                                </span>
                                <span>{formatTime(item.pubDate)}</span>
                            </div>
                            <p className="text-xs font-bold text-white leading-snug group-hover:text-yellow-300 transition-colors line-clamp-2">
                                {item.title}
                            </p>
                        </Link>
                    ))
                ) : (
                    <div className="py-8 text-center text-xs font-bold text-blue-200">
                        Gelişmeler taranıyor...
                    </div>
                )}
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-blue-200">
                <span>Son 24 saatte güncellenen</span>
                <span className="text-white font-black">{kapNews.length} Gelişme</span>
            </div>
        </div>
    );
}
