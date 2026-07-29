"use client";

import { useState, useEffect } from "react";
import { Calendar, Globe2, Loader2, Star } from "lucide-react";

export interface CalendarEvent {
    id?: string;
    time: string;
    country: string;
    flag?: string;
    event: string;
    actual?: string;
    previous?: string;
    forecast?: string;
    impact: 'low' | 'medium' | 'high' | 'critical';
}

export function EconomicCalendarWidget() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'TR' | 'US' | 'EUR'>('all');
    const [starFilter, setStarFilter] = useState<'all' | '2-star' | '3-star'>('all');

    useEffect(() => {
        const fetchCalendarData = async () => {
            try {
                const res = await fetch('/api/calendar');
                const json = await res.json();
                if (json.data && Array.isArray(json.data)) {
                    setEvents(json.data);
                }
            } catch (err) {
                console.error("Calendar fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCalendarData();
    }, []);

    const filteredEvents = events.filter(e => {
        // Country filter
        if (filter !== 'all') {
            if (filter === 'TR' && e.country !== 'TR' && e.country !== 'TRY') return false;
            if (filter === 'US' && e.country !== 'US' && e.country !== 'USD') return false;
            if (filter === 'EUR' && e.country !== 'EU' && e.country !== 'EUR') return false;
        }

        // Star filter (2-star: medium, 3-star: high/critical)
        if (starFilter === '2-star' && e.impact !== 'medium') return false;
        if (starFilter === '3-star' && e.impact !== 'high' && e.impact !== 'critical') return false;

        return true;
    });

    const getImpactBadge = (impact: string) => {
        switch (impact) {
            case 'critical':
            case 'high':
                return (
                    <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 border border-amber-200/60 px-2 py-0.5 rounded-full text-[9px] font-black">
                        <span className="flex text-amber-500"><Star className="w-2.5 h-2.5 fill-amber-500" /><Star className="w-2.5 h-2.5 fill-amber-500" /><Star className="w-2.5 h-2.5 fill-amber-500" /></span>
                        <span>3 Yıldız (Yüksek)</span>
                    </div>
                );
            case 'medium':
                return (
                    <div className="flex items-center gap-1 bg-blue-500/10 text-blue-600 border border-blue-200/60 px-2 py-0.5 rounded-full text-[9px] font-black">
                        <span className="flex text-blue-500"><Star className="w-2.5 h-2.5 fill-blue-500" /><Star className="w-2.5 h-2.5 fill-blue-500" /></span>
                        <span>2 Yıldız (Orta)</span>
                    </div>
                );
            default:
                return <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-100 text-slate-500 border border-slate-200">1 Yıldız</span>;
        }
    };

    return (
        <div className="w-full bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-all">
            <div>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-[#00008B]/5 border border-[#00008B]/10 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-[#00008B]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-black text-[#00008B] tracking-tight">Ekonomik Takvim</h3>
                                <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    CANLI VERİ
                                </span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">2 & 3 Yıldızlı Kritik Makro Haberler</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Country Filter */}
                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-2.5 py-1 text-[10px] font-extrabold rounded-xl transition-all ${filter === 'all' ? 'bg-[#00008B] text-white shadow-sm' : 'text-slate-500 hover:text-[#00008B]'}`}
                            >
                                Tümü
                            </button>
                            <button
                                onClick={() => setFilter('TR')}
                                className={`px-2 py-1 text-[10px] font-extrabold rounded-xl transition-all ${filter === 'TR' ? 'bg-[#00008B] text-white shadow-sm' : 'text-slate-500 hover:text-[#00008B]'}`}
                            >
                                🇹🇷 TR
                            </button>
                            <button
                                onClick={() => setFilter('US')}
                                className={`px-2 py-1 text-[10px] font-extrabold rounded-xl transition-all ${filter === 'US' ? 'bg-[#00008B] text-white shadow-sm' : 'text-slate-500 hover:text-[#00008B]'}`}
                            >
                                🇺🇸 US
                            </button>
                        </div>

                        {/* Star Filter */}
                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                            <button
                                onClick={() => setStarFilter('all')}
                                className={`px-2 py-1 text-[10px] font-extrabold rounded-xl transition-all ${starFilter === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                2 & 3 ★
                            </button>
                            <button
                                onClick={() => setStarFilter('3-star')}
                                className={`px-2 py-1 text-[10px] font-extrabold rounded-xl transition-all ${starFilter === '3-star' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-amber-600'}`}
                            >
                                3 ★
                            </button>
                            <button
                                onClick={() => setStarFilter('2-star')}
                                className={`px-2 py-1 text-[10px] font-extrabold rounded-xl transition-all ${starFilter === '2-star' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-blue-600'}`}
                            >
                                2 ★
                            </button>
                        </div>
                    </div>
                </div>

                {/* Event List */}
                {loading ? (
                    <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 text-[#00008B] animate-spin" />
                        <span className="text-xs font-bold text-slate-400">Ekonomik Takvim Yükleniyor...</span>
                    </div>
                ) : filteredEvents.length > 0 ? (
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                        {filteredEvents.slice(0, 10).map((item, idx) => (
                            <div
                                key={idx}
                                className="p-3.5 rounded-2xl border border-slate-100 hover:border-[#00008B]/20 bg-slate-50/50 hover:bg-white transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-black text-[#00008B] bg-white border border-slate-200 px-2.5 py-1 rounded-xl shadow-2xs">
                                        {item.time}
                                    </span>
                                    <span className="text-base">{item.flag || '🌐'}</span>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#00008B] transition-colors leading-tight">
                                            {item.event}
                                        </h4>
                                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                                            Beklenen: {item.forecast || '-'} | Önceki: {item.previous || '-'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                                    <div className="text-right">
                                        <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Açıklanan</span>
                                        <span className="text-xs font-black text-[#00008B]">{item.actual || 'Bekleniyor'}</span>
                                    </div>
                                    {getImpactBadge(item.impact)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 text-center text-xs font-bold text-slate-400">
                        Seçilen kriterlere uygun haber bulunamadı.
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span className="flex items-center gap-1">
                    <Globe2 className="w-3 h-3 text-[#00008B]/40" /> Otomatik Canlı Veri Akışı
                </span>
                <span className="text-[#00008B]/60 hover:text-[#00008B] cursor-pointer">Tüm Piyasalar →</span>
            </div>
        </div>
    );
}
