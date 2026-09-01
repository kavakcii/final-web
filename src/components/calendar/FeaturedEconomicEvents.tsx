"use client";

import { CatalogCalendarEvent } from "@/lib/calendar-catalog";
import { Flame, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

interface FeaturedEconomicEventsProps {
    events: CatalogCalendarEvent[];
}

export default function FeaturedEconomicEvents({ events }: FeaturedEconomicEventsProps) {
    const featuredEvents = events
        .filter(e => e.impact === 'high' || e.impact === 'critical')
        .slice(0, 3);

    if (featuredEvents.length === 0) return null;

    return (
        <div className="w-full bg-[#00008B] text-white border border-[#00008B] rounded-3xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400 fill-amber-400" /> ÖNE ÇIKAN YÜKSEK ETKİLİ VERİLER
                </h3>
                <span className="text-[10px] font-bold text-blue-200">
                    Piyasa Yönü Açısından En Kritik Gelişmeler
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                {featuredEvents.map((item, idx) => {
                    const isReleased = item.actual && item.actual !== 'Bekleniyor' && item.actual !== '-';
                    const targetId = encodeURIComponent(item.id || item.event);

                    return (
                        <div 
                            key={idx} 
                            className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md flex flex-col justify-between space-y-3 hover:bg-white/15 transition-all group"
                        >
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-bold text-blue-200">
                                    <span className="flex items-center gap-1">
                                        <span>{item.flag || '🌐'}</span> {item.country}
                                    </span>
                                    <span className="flex items-center gap-1 font-mono text-[11px] bg-white/10 px-2 py-0.5 rounded-lg text-white">
                                        <Clock className="w-3 h-3 text-blue-300" /> {item.time} TSİ
                                    </span>
                                </div>
                                <h4 className="text-sm font-black text-white leading-snug line-clamp-2">
                                    {item.event}
                                </h4>
                            </div>

                            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] text-blue-200 font-bold block uppercase">
                                        {isReleased ? 'Gerçekleşen' : 'Piyasa Beklentisi'}
                                    </span>
                                    <span className="text-sm font-black text-white">
                                        {isReleased ? item.actual : (item.forecast || '-')}
                                    </span>
                                </div>

                                <Link
                                    href={`/dashboard/economic-calendar/${targetId}`}
                                    className="px-3 py-1.5 rounded-xl bg-amber-400 text-[#00008B] font-black text-[11px] hover:bg-amber-300 transition-all flex items-center gap-1 shadow-sm"
                                >
                                    İncele <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
