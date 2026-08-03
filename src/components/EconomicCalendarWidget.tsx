"use client";

import { useState, useEffect, useRef } from "react";
import { Calendar, Globe2, Loader2, Signal, ChevronRight, SlidersHorizontal } from "lucide-react";

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
}

const COUNTRY_NAMES: Record<string, string> = {
    TR: "Türkiye",
    TRY: "Türkiye",
    US: "Amerika Birleşik Devletleri",
    USD: "Amerika Birleşik Devletleri",
    EU: "Avrupa Birliği",
    EUR: "Avrupa Birliği",
    GB: "Birleşik Krallık",
    GBP: "Birleşik Krallık"
};

export function EconomicCalendarWidget() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'table' | 'tradingview'>('table');
    const [filter, setFilter] = useState<'all' | 'TR' | 'US' | 'EU'>('all');
    const tradingViewContainerRef = useRef<HTMLDivElement>(null);

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

    // TradingView Embed Script Integration
    useEffect(() => {
        if (viewMode === 'tradingview' && tradingViewContainerRef.current) {
            tradingViewContainerRef.current.innerHTML = '';
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
            script.async = true;
            script.type = 'text/javascript';
            script.innerHTML = JSON.stringify({
                colorTheme: "dark",
                isTransparent: false,
                width: "100%",
                height: "520",
                locale: "tr",
                importanceFilter: "0,1",
                countryFilter: "tr,us,eu"
            });
            tradingViewContainerRef.current.appendChild(script);
        }
    }, [viewMode]);

    // Filter events (TR, US, EU & 2-star/3-star)
    const filteredEvents = events.filter(e => {
        if (filter !== 'all') {
            if (filter === 'TR' && e.country !== 'TR' && e.country !== 'TRY') return false;
            if (filter === 'US' && e.country !== 'US' && e.country !== 'USD') return false;
            if (filter === 'EU' && e.country !== 'EU' && e.country !== 'EUR') return false;
        }
        return true;
    });

    // Impact Signal Bar Renderer (Matching Screenshot)
    const renderSignalBars = (impact: string) => {
        const isHigh = impact === 'high' || impact === 'critical';
        const isMedium = impact === 'medium';

        return (
            <div className="flex items-end gap-[2px] h-3.5 w-4" title={isHigh ? "3 Yıldız (Yüksek Etki)" : "2 Yıldız (Orta Etki)"}>
                <div className={`w-[3px] rounded-xs ${isHigh || isMedium ? 'h-1.5 bg-blue-400' : 'h-1 bg-zinc-700'}`} />
                <div className={`w-[3px] rounded-xs ${isHigh || isMedium ? 'h-2.5 bg-blue-400' : 'h-1 bg-zinc-700'}`} />
                <div className={`w-[3px] rounded-xs ${isHigh ? 'h-3.5 bg-blue-400' : 'h-1 bg-zinc-700'}`} />
            </div>
        );
    };

    return (
        <div className="w-full bg-[#090a0d] border border-zinc-800/80 rounded-3xl p-6 shadow-2xl text-zinc-100 font-sans flex flex-col justify-between transition-all">
            <div>
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-800/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-black tracking-tight text-white">Ekonomik Takvim</h3>
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                    CANLI AKIŞ
                                </span>
                            </div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                                Görsel Tablo Düzeni (TR 🇹🇷 | US 🇺🇸 | EU 🇪🇺)
                            </p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* View Switcher */}
                        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-3 py-1 text-[10px] font-extrabold rounded-xl transition-all ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
                            >
                                Tablo Düzeni
                            </button>
                            <button
                                onClick={() => setViewMode('tradingview')}
                                className={`px-3 py-1 text-[10px] font-extrabold rounded-xl transition-all ${viewMode === 'tradingview' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
                            >
                                TradingView
                            </button>
                        </div>

                        {viewMode === 'table' && (
                            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`px-2.5 py-1 text-[10px] font-extrabold rounded-xl transition-all ${filter === 'all' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
                                >
                                    Tümü
                                </button>
                                <button
                                    onClick={() => setFilter('TR')}
                                    className={`px-2.5 py-1 text-[10px] font-extrabold rounded-xl transition-all ${filter === 'TR' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                                >
                                    🇹🇷 TR
                                </button>
                                <button
                                    onClick={() => setFilter('US')}
                                    className={`px-2.5 py-1 text-[10px] font-extrabold rounded-xl transition-all ${filter === 'US' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                                >
                                    🇺🇸 US
                                </button>
                                <button
                                    onClick={() => setFilter('EU')}
                                    className={`px-2.5 py-1 text-[10px] font-extrabold rounded-xl transition-all ${filter === 'EU' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                                >
                                    🇪🇺 EU
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* View Switcher Logic */}
                {viewMode === 'tradingview' ? (
                    <div className="w-full rounded-2xl overflow-hidden min-h-[500px] border border-zinc-800/80">
                        <div ref={tradingViewContainerRef} className="tradingview-widget-container" />
                    </div>
                ) : (
                    /* DARK TABULAR VIEW (Matching Screenshot Layout 100%) */
                    loading ? (
                        <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
                            <span className="text-xs font-bold text-zinc-400">Ekonomik Takvim Verileri Yükleniyor...</span>
                        </div>
                    ) : filteredEvents.length > 0 ? (
                        <div className="overflow-x-auto max-h-[520px] overflow-y-auto pr-1">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-zinc-800/80 text-[10px] font-black text-zinc-400 uppercase tracking-wider pb-2">
                                        <th className="py-2.5 px-3 w-16 text-zinc-400">Saat</th>
                                        <th className="py-2.5 px-3 w-40 text-zinc-400">Ülke</th>
                                        <th className="py-2.5 px-2 w-10 text-center">Etki</th>
                                        <th className="py-2.5 px-3">Haber Başlığı</th>
                                        <th className="py-2.5 px-3 text-right w-24">Açıklanan</th>
                                        <th className="py-2.5 px-3 text-right w-24">Beklenen</th>
                                        <th className="py-2.5 px-3 text-right w-24">Önceki</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-900/80 text-xs font-medium">
                                    {filteredEvents.map((item, idx) => {
                                        const cName = COUNTRY_NAMES[item.country] || item.country;
                                        const showTime = idx === 0 || filteredEvents[idx - 1].time !== item.time;

                                        return (
                                            <tr
                                                key={idx}
                                                className="hover:bg-zinc-900/60 transition-colors group border-b border-zinc-900/60"
                                            >
                                                {/* Saat */}
                                                <td className="py-3 px-3 font-bold text-zinc-300 align-top">
                                                    {showTime ? item.time : ''}
                                                </td>

                                                {/* Ülke & Bayrak */}
                                                <td className="py-3 px-3 align-top">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-base">{item.flag || '🌐'}</span>
                                                        <span className="text-xs font-semibold text-zinc-200 truncate max-w-[130px]">
                                                            {cName}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Etki Sinyal Barları */}
                                                <td className="py-3 px-2 text-center align-top pt-3.5">
                                                    <div className="flex justify-center">
                                                        {renderSignalBars(item.impact)}
                                                    </div>
                                                </td>

                                                {/* Haber Başlığı */}
                                                <td className="py-3 px-3 align-top">
                                                    <span className="text-xs font-bold text-zinc-100 group-hover:text-blue-400 transition-colors block">
                                                        {item.event}
                                                    </span>
                                                </td>

                                                {/* Açıklanan (Actual) */}
                                                <td className="py-3 px-3 text-right font-black text-white align-top">
                                                    {item.actual || '-'}
                                                </td>

                                                {/* Beklenen (Forecast) */}
                                                <td className="py-3 px-3 text-right font-semibold text-zinc-400 align-top">
                                                    {item.forecast || '-'}
                                                </td>

                                                {/* Önceki (Previous) */}
                                                <td className="py-3 px-3 text-right font-semibold text-zinc-400 align-top">
                                                    {item.previous || '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-12 text-center text-xs font-bold text-zinc-500">
                            Seçilen kriterlere uygun veri bulunamadı.
                        </div>
                    )
                )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-bold text-zinc-400">
                <span className="flex items-center gap-1.5">
                    <Globe2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Türkiye 🇹🇷 | ABD 🇺🇸 | Euro Bölgesi 🇪🇺 | Birleşik Krallık 🇬🇧</span>
                </span>
                <span className="text-blue-400 font-extrabold">2 & 3 Yıldız Canlı Akış</span>
            </div>
        </div>
    );
}
