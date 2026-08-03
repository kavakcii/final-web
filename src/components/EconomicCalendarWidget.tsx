"use client";

import { useState, useEffect } from "react";
import { Calendar, Loader2, ArrowRight } from "lucide-react";
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
    originalDate?: any;
}

interface EconomicCalendarWidgetProps {
    isDetailedPage?: boolean;
}

function parseNumber(str?: string): number | null {
    if (!str || str === '-' || str === 'Bekleniyor') return null;
    const cleaned = str.replace(/[^0-9\.\,\-]/g, '').replace(',', '.');
    const val = parseFloat(cleaned);
    return isNaN(val) ? null : val;
}

export function EconomicCalendarWidget({ isDetailedPage = false }: EconomicCalendarWidgetProps) {
    const router = useRouter();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState<Date>(new Date());

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

    useEffect(() => {
        fetchCalendarData();

        // High frequency 5-second polling for instant live data release
        const pollInterval = setInterval(() => {
            fetchCalendarData();
            setNow(new Date());
        }, 5000);

        return () => clearInterval(pollInterval);
    }, []);

    // Sadece Bugün haberlerini filtrele
    const filteredEvents = events.filter(e => {
        const hasTodayEvents = events.some(ev => ev.isToday);
        if (hasTodayEvents && !e.isToday) return false;
        return true;
    });

    // Bugünün Tarihi (03.08.2026 Formatında TSİ - Beyaz Metin)
    const todayFormattedDate = new Date().toLocaleDateString('tr-TR', {
        timeZone: 'Europe/Istanbul',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    // Etki Sinyal Barları (Tam Net, Beyaz & Yüksek Kontrastlı)
    const renderSignalBars = (impact: string) => {
        const isHigh = impact === 'high' || impact === 'critical';
        const isMedium = impact === 'medium';

        return (
            <div className="flex items-end gap-[2px] h-3.5 w-4" title={isHigh ? "Yüksek Etki" : "Orta Etki"}>
                <div className={`w-[3px] rounded-xs ${isHigh || isMedium ? 'h-1.5 bg-white drop-shadow-[0_0_2px_rgba(255,255,255,0.9)]' : 'h-1 bg-white/20'}`} />
                <div className={`w-[3px] rounded-xs ${isHigh || isMedium ? 'h-2.5 bg-white drop-shadow-[0_0_2px_rgba(255,255,255,0.9)]' : 'h-1 bg-white/20'}`} />
                <div className={`w-[3px] rounded-xs ${isHigh ? 'h-3.5 bg-white drop-shadow-[0_0_4px_rgba(255,255,255,1)]' : 'h-1 bg-white/20'}`} />
            </div>
        );
    };

    // Açıklanan Veri Renklendirme Mantığı (Beklenenden Yüksekse YEŞİL, Düşükse KIRMIZI)
    const renderActualValue = (item: CalendarEvent) => {
        if (item.actual && item.actual !== 'Bekleniyor' && item.actual !== '-') {
            const actualNum = parseNumber(item.actual);
            const forecastNum = parseNumber(item.forecast) ?? parseNumber(item.previous);

            if (actualNum !== null && forecastNum !== null) {
                if (actualNum > forecastNum) {
                    return (
                        <span className="font-black text-emerald-400 flex items-center justify-end gap-0.5">
                            <span className="text-[10px]">▲</span> {item.actual}
                        </span>
                    );
                } else if (actualNum < forecastNum) {
                    return (
                        <span className="font-black text-rose-400 flex items-center justify-end gap-0.5">
                            <span className="text-[10px]">▼</span> {item.actual}
                        </span>
                    );
                }
            }

            return <span className="font-black text-white">{item.actual}</span>;
        }

        // Check if event time is within the next 30 minutes (or past 15 mins)
        if (item.originalDate) {
            const eventTimestamp = new Date(item.originalDate).getTime();
            const currentTimestamp = now.getTime();
            const diffMinutes = (eventTimestamp - currentTimestamp) / (1000 * 60);

            // Son 30 dakika: "Yakında 🔥" (Sarı - Beyaz Yanıp Söner)
            if (diffMinutes <= 30 && diffMinutes >= -30) {
                return (
                    <span className="font-black text-amber-300 animate-pulse tracking-wider bg-amber-400/20 px-2 py-0.5 rounded-lg border border-amber-300/40 inline-block shadow-sm">
                        Yakında 🔥
                    </span>
                );
            }
        }

        return <span className="font-bold text-white/60">Bekleniyor</span>;
    };

    const handleCardClick = () => {
        if (!isDetailedPage) {
            router.push("/dashboard/economic-calendar");
        }
    };

    const handleRowClick = (e: React.MouseEvent, item: CalendarEvent) => {
        e.stopPropagation();
        const targetId = item.id || item.event;
        router.push(`/dashboard/economic-calendar/${encodeURIComponent(targetId)}`);
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
                {/* Clean Header */}
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/15">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-black tracking-tight text-white">Ekonomik Takvim</h3>
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Saniyelik Canlı Akış" />
                        </div>
                    </div>

                    {!isDetailedPage && (
                        <div className="text-xs font-bold text-white flex items-center gap-1 hover:underline transition-all">
                            Detaylar <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                    )}
                </div>

                {/* Tablo Görünümü */}
                {loading ? (
                    <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-7 h-7 text-white animate-spin" />
                        <span className="text-xs font-bold text-blue-200">Bugünün Canlı Ekonomik Haberleri Yükleniyor...</span>
                    </div>
                ) : filteredEvents.length > 0 ? (
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto pr-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/15 text-[10px] font-black text-blue-200 uppercase tracking-wider pb-2">
                                    <th className="py-2.5 px-3 w-16 text-blue-200">Saat</th>
                                    <th className="py-2.5 px-3 w-20 text-blue-200">Ülke</th>
                                    <th className="py-2.5 px-2 w-12 text-center text-blue-200">Etki</th>
                                    <th className="py-2.5 px-3 text-blue-200">Haber Başlığı</th>
                                    <th className="py-2.5 px-3 text-right w-24 text-blue-200">Açıklanan</th>
                                    <th className="py-2.5 px-3 text-right w-24 text-blue-200">Beklenen</th>
                                    <th className="py-2.5 px-3 text-right w-24 text-blue-200">Önceki</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10 text-xs font-medium">
                                {filteredEvents.slice(0, 15).map((item, idx) => (
                                    <tr
                                        key={idx}
                                        onClick={(e) => handleRowClick(e, item)}
                                        className="hover:bg-white/15 cursor-pointer transition-colors group border-b border-white/10"
                                    >
                                        {/* Saat */}
                                        <td className="py-3.5 px-3 font-bold text-white align-top">
                                            {item.time}
                                        </td>

                                        {/* Ülke Kısaltması (TR, ABD, EU, UK) */}
                                        <td className="py-3.5 px-3 align-top">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm">{item.flag || '🌐'}</span>
                                                <span className="text-xs font-black text-white">
                                                    {item.country}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Etki Sinyal Barları (Tam Net & Beyaz) */}
                                        <td className="py-3.5 px-2 text-center align-top pt-4">
                                            <div className="flex justify-center">
                                                {renderSignalBars(item.impact)}
                                            </div>
                                        </td>

                                        {/* Haber Başlığı (%100 Türkçe & Tam Beyaz) */}
                                        <td className="py-3.5 px-3 align-top">
                                            <span className="text-xs font-bold text-white block leading-snug underline-offset-4 group-hover:underline">
                                                {item.event}
                                            </span>
                                        </td>

                                        {/* Açıklanan (Beklenenden Yüksekse YEŞİL ▲, Düşükse KIRMIZI ▼) */}
                                        <td className="py-3.5 px-3 text-right align-top">
                                            {renderActualValue(item)}
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-12 text-center text-xs font-bold text-blue-200">
                        Bugün için açıklanan kritik haber bulunmamaktadır.
                    </div>
                )}
            </div>

            {/* Footer - Bugünün Tarihi (Tam Beyaz Metin) */}
            <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-[11px] font-bold text-white">
                <span className="flex items-center gap-1.5 font-black tracking-wider text-white">
                    Tarih: {todayFormattedDate}
                </span>
                <span className="text-white/80 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Saniyelik Canlı Akış
                </span>
            </div>
        </div>
    );
}
