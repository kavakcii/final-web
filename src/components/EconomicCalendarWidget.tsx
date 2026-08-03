"use client";

import { useState, useEffect } from "react";
import { Calendar, Globe2, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export interface CalendarEvent {
    id?: string;
    time: string;
    country: string;
    countryName?: string;
    flag?: string;
    event: string;
    actual?: string;
    previous?: string;
    forecast?: string;
    impact: 'low' | 'medium' | 'high' | 'critical';
    isToday?: boolean;
}

interface EconomicCalendarWidgetProps {
    isDetailedPage?: boolean;
}

export function EconomicCalendarWidget({ isDetailedPage = false }: EconomicCalendarWidgetProps) {
    const router = useRouter();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'TR' | 'ABD' | 'EU' | 'UK'>('all');
    const [dayFilter, setDayFilter] = useState<'today' | 'all'>('today');

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

    // Filter logic: Sadece Bugün haberleri & Ülke filtresi
    const filteredEvents = events.filter(e => {
        // Today filter
        if (dayFilter === 'today') {
            const hasTodayEvents = events.some(ev => ev.isToday);
            if (hasTodayEvents && !e.isToday) return false;
        }

        // Country filter
        if (filter !== 'all') {
            if (filter === 'TR' && e.country !== 'TR') return false;
            if (filter === 'ABD' && e.country !== 'ABD') return false;
            if (filter === 'EU' && e.country !== 'EU') return false;
            if (filter === 'UK' && e.country !== 'UK') return false;
        }

        return true;
    });

    // Impact Signal Bar Renderer (Matching Screenshot)
    const renderSignalBars = (impact: string) => {
        const isHigh = impact === 'high' || impact === 'critical';
        const isMedium = impact === 'medium';

        return (
            <div className="flex items-end gap-[2px] h-3.5 w-4" title={isHigh ? "Yüksek Etki" : "Orta Etki"}>
                <div className={`w-[3px] rounded-xs ${isHigh || isMedium ? 'h-1.5 bg-blue-300' : 'h-1 bg-white/20'}`} />
                <div className={`w-[3px] rounded-xs ${isHigh || isMedium ? 'h-2.5 bg-blue-300' : 'h-1 bg-white/20'}`} />
                <div className={`w-[3px] rounded-xs ${isHigh ? 'h-3.5 bg-amber-400' : 'h-1 bg-white/20'}`} />
            </div>
        );
    };

    const handleCardClick = () => {
        if (!isDetailedPage) {
            router.push("/dashboard/economic-calendar");
        }
    };

    return (
        <div
            onClick={handleCardClick}
            className={`w-full bg-[#00008B] text-white border border-[#00008B] rounded-3xl p-6 shadow-xl shadow-[#00008B]/20 font-sans flex flex-col justify-between transition-all relative overflow-hidden group ${
                !isDetailedPage ? 'cursor-pointer hover:border-white/30' : ''
            }`}
        >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/15">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-black tracking-tight text-white">Ekonomik Takvim</h3>
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                                    BUGÜN - TSİ (UTC+3)
                                </span>
                            </div>
                            <p className="text-[10px] font-bold text-blue-200/80 uppercase tracking-widest mt-0.5">
                                Bugünün Kritik Makroekonomik Verileri (TR 🇹🇷 | ABD 🇺🇸 | EU 🇪🇺)
                            </p>
                        </div>
                    </div>

                    {/* Filter & Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {/* Day Filter */}
                        <div className="flex items-center gap-1 bg-white/10 p-1 rounded-2xl border border-white/15 backdrop-blur-md">
                            <button
                                onClick={() => setDayFilter('today')}
                                className={`px-3 py-1 text-[10px] font-extrabold rounded-xl transition-all ${dayFilter === 'today' ? 'bg-white text-[#00008B] shadow-md' : 'text-blue-100 hover:text-white'}`}
                            >
                                Bugün
                            </button>
                            <button
                                onClick={() => setDayFilter('all')}
                                className={`px-3 py-1 text-[10px] font-extrabold rounded-xl transition-all ${dayFilter === 'all' ? 'bg-white text-[#00008B] shadow-md' : 'text-blue-100 hover:text-white'}`}
                            >
                                Haftalık
                            </button>
                        </div>

                        {/* Country Filter */}
                        <div className="flex items-center gap-1 bg-white/10 p-1 rounded-2xl border border-white/15 backdrop-blur-md">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-2.5 py-1 text-[10px] font-extrabold rounded-xl transition-all ${filter === 'all' ? 'bg-white text-[#00008B]' : 'text-blue-100 hover:text-white'}`}
                            >
                                Tümü
                            </button>
                            <button
                                onClick={() => setFilter('TR')}
                                className={`px-2.5 py-1 text-[10px] font-extrabold rounded-xl transition-all ${filter === 'TR' ? 'bg-white text-[#00008B]' : 'text-blue-100 hover:text-white'}`}
                            >
                                🇹🇷 TR
                            </button>
                            <button
                                onClick={() => setFilter('ABD')}
                                className={`px-2.5 py-1 text-[10px] font-extrabold rounded-xl transition-all ${filter === 'ABD' ? 'bg-white text-[#00008B]' : 'text-blue-100 hover:text-white'}`}
                            >
                                🇺🇸 ABD
                            </button>
                            <button
                                onClick={() => setFilter('EU')}
                                className={`px-2.5 py-1 text-[10px] font-extrabold rounded-xl transition-all ${filter === 'EU' ? 'bg-white text-[#00008B]' : 'text-blue-100 hover:text-white'}`}
                            >
                                🇪🇺 EU
                            </button>
                        </div>
                    </div>
                </div>

                {/* Brand Blue Tabular View */}
                {loading ? (
                    <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-7 h-7 text-white animate-spin" />
                        <span className="text-xs font-bold text-blue-200">Bugünün Ekonomik Haberleri Yükleniyor...</span>
                    </div>
                ) : filteredEvents.length > 0 ? (
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto pr-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/15 text-[10px] font-black text-blue-200 uppercase tracking-wider pb-2">
                                    <th className="py-2.5 px-3 w-16 text-blue-200">Saat (TSİ)</th>
                                    <th className="py-2.5 px-3 w-28 text-blue-200">Ülke</th>
                                    <th className="py-2.5 px-2 w-10 text-center">Etki</th>
                                    <th className="py-2.5 px-3">Haber Başlığı</th>
                                    <th className="py-2.5 px-3 text-right w-24">Açıklanan</th>
                                    <th className="py-2.5 px-3 text-right w-24">Beklenen</th>
                                    <th className="py-2.5 px-3 text-right w-24">Önceki</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10 text-xs font-medium">
                                {filteredEvents.slice(0, 15).map((item, idx) => {
                                    const showTime = idx === 0 || filteredEvents[idx - 1].time !== item.time;

                                    return (
                                        <tr
                                            key={idx}
                                            className="hover:bg-white/10 transition-colors group border-b border-white/10"
                                        >
                                            {/* Saat */}
                                            <td className="py-3.5 px-3 font-bold text-white align-top">
                                                {showTime ? item.time : ''}
                                            </td>

                                            {/* Ülke Kısaltması (TR, ABD, EU, UK) */}
                                            <td className="py-3.5 px-3 align-top">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-base">{item.flag || '🌐'}</span>
                                                    <span className="text-xs font-black text-white">
                                                        {item.country}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Etki Sinyal Barları */}
                                            <td className="py-3.5 px-2 text-center align-top pt-4">
                                                <div className="flex justify-center">
                                                    {renderSignalBars(item.impact)}
                                                </div>
                                            </td>

                                            {/* Haber Başlığı (Türkçe) */}
                                            <td className="py-3.5 px-3 align-top">
                                                <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors block">
                                                    {item.event}
                                                </span>
                                            </td>

                                            {/* Açıklanan (Actual) */}
                                            <td className="py-3.5 px-3 text-right font-black text-white align-top">
                                                {item.actual || 'Bekleniyor'}
                                            </td>

                                            {/* Beklenen (Forecast) */}
                                            <td className="py-3.5 px-3 text-right font-semibold text-blue-200 align-top">
                                                {item.forecast || '-'}
                                            </td>

                                            {/* Önceki (Previous) */}
                                            <td className="py-3.5 px-3 text-right font-semibold text-blue-200 align-top">
                                                {item.previous || '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-12 text-center text-xs font-bold text-blue-200">
                        Bugün için yayınlanan kritik haber bulunmamaktadır.
                    </div>
                )}
            </div>

            {/* Footer & Navigation Link */}
            <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-[10px] font-bold text-blue-200">
                <span className="flex items-center gap-1.5">
                    <Globe2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>TR 🇹🇷 | ABD 🇺🇸 | EU 🇪🇺 | UK 🇬🇧</span>
                </span>
                {!isDetailedPage ? (
                    <span className="text-white group-hover:text-amber-300 flex items-center gap-1 font-extrabold transition-colors">
                        Detaylı Ekonomik Takvim Sayfasına Git <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                ) : (
                    <span className="text-blue-200 font-extrabold">TSİ (UTC+3) Anlık Akış</span>
                )}
            </div>
        </div>
    );
}
