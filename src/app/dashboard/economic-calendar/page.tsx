"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Loader2, Check, Filter } from "lucide-react";
import Link from "next/link";

export interface CalendarEvent {
    id?: string;
    time: string;
    dateFormatted?: string;
    dateDayName?: string;
    country: string;
    flag?: string;
    event: string;
    actual?: string;
    previous?: string;
    forecast?: string;
    impact: 'low' | 'medium' | 'high' | 'critical';
    isToday?: boolean;
    originalDate?: any;
}

function parseNumber(str?: string): number | null {
    if (!str || str === '-' || str === 'Bekleniyor') return null;
    const cleaned = str.replace(/[^0-9\.\,\-]/g, '').replace(',', '.');
    const val = parseFloat(cleaned);
    return isNaN(val) ? null : val;
}

export default function EconomicCalendarPage() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState<Date>(new Date());

    // Multi-Select Country Checkboxes (TR, ABD, EU, UK)
    const [selectedCountries, setSelectedCountries] = useState<string[]>(['TR', 'ABD']);

    // Time Horizon Filter (Bugün, Yarın, Bu Hafta, Tüm Veriler)
    const [timeTab, setTimeTab] = useState<'today' | 'tomorrow' | 'week' | 'all'>('week');

    const fetchCalendarData = async () => {
        try {
            const res = await fetch('/api/calendar');
            const json = await res.json();
            if (json.data && Array.isArray(json.data)) {
                setEvents(json.data);
            }
        } catch (err) {
            console.error("Calendar page fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCalendarData();

        // 5-sec fast polling
        const interval = setInterval(() => {
            fetchCalendarData();
            setNow(new Date());
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // Multi-Country Checkbox Toggle Handler
    const toggleCountry = (code: string) => {
        if (selectedCountries.includes(code)) {
            if (selectedCountries.length > 1) {
                setSelectedCountries(selectedCountries.filter(c => c !== code));
            }
        } else {
            setSelectedCountries([...selectedCountries, code]);
        }
    };

    // Today and Tomorrow strings in TSİ
    const todayStr = new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' });
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' });

    // Filtered Events
    const filteredEvents = events.filter(e => {
        // Multi-country filter
        if (selectedCountries.length > 0 && !selectedCountries.includes(e.country)) {
            return false;
        }

        // Time Horizon filter
        if (timeTab === 'today') {
            if (e.dateFormatted !== todayStr && !e.isToday) return false;
        } else if (timeTab === 'tomorrow') {
            if (e.dateFormatted !== tomorrowStr) return false;
        }

        return true;
    });

    // Impact Signal Bar Renderer
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

    // Actual vs Forecast Color Logic
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

        // Flashing Soon Alert within 30 minutes
        if (item.originalDate) {
            const eventTimestamp = new Date(item.originalDate).getTime();
            const currentTimestamp = now.getTime();
            const diffMinutes = (eventTimestamp - currentTimestamp) / (1000 * 60);

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

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-white text-[#00008B] w-full mx-auto relative overflow-hidden">
            <div className="w-full max-w-[1600px] mx-auto px-6 py-8 md:px-10 lg:py-10 space-y-8 relative z-10 mb-20">
                {/* Top Navigation */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#00008B] text-white font-bold text-xs shadow-lg shadow-[#00008B]/20 hover:bg-[#0808a3] transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
                    </Link>
                    <div className="flex items-center gap-2 text-xs font-black text-[#00008B] bg-blue-50 px-4 py-2 rounded-2xl border border-blue-200">
                        <Calendar className="w-4 h-4 text-[#00008B]" /> Özel Ekonomik Takvim Detay Sayfası
                    </div>
                </div>

                {/* Page Title & Controls */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#00008B]">
                            Özel Ekonomik Takvim
                        </h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Türkiye Saati (TSİ UTC+3) ile Çoklu Ülke ve Zaman Filtreli Makro Veriler
                        </p>
                    </div>

                    {/* Filter Card Box */}
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
                        {/* Multi-Select Country Checkboxes (TR, ABD, EU, UK) */}
                        <div>
                            <span className="text-[11px] font-black text-[#00008B] uppercase tracking-wider block mb-3 flex items-center gap-1.5">
                                <Filter className="w-3.5 h-3.5" /> Çoklu Ülke Seçimi (Aynı Anda Birden Fazla Seçilebilir)
                            </span>
                            <div className="flex flex-wrap items-center gap-3">
                                {[
                                    { code: 'TR', label: 'Türkiye', flag: '🇹🇷' },
                                    { code: 'ABD', label: 'Amerika Birleşik Devletleri', flag: '🇺🇸' },
                                    { code: 'EU', label: 'Avrupa Birliği', flag: '🇪🇺' },
                                    { code: 'UK', label: 'Birleşik Krallık', flag: '🇬🇧' }
                                ].map((country) => {
                                    const isSelected = selectedCountries.includes(country.code);
                                    return (
                                        <button
                                            key={country.code}
                                            onClick={() => toggleCountry(country.code)}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all border ${
                                                isSelected
                                                    ? 'bg-[#00008B] text-white border-[#00008B] shadow-md shadow-[#00008B]/20'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-[#00008B]/40'
                                            }`}
                                        >
                                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                                                isSelected ? 'bg-white text-[#00008B] border-white' : 'border-slate-300 bg-white'
                                            }`}>
                                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                            </div>
                                            <span>{country.flag} {country.label} ({country.code})</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Time Horizon Filter Tabs */}
                        <div>
                            <span className="text-[11px] font-black text-[#00008B] uppercase tracking-wider block mb-2">
                                Zaman Aralığı
                            </span>
                            <div className="flex flex-wrap items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 w-fit">
                                {[
                                    { id: 'today', label: 'Bugün' },
                                    { id: 'tomorrow', label: 'Yarın' },
                                    { id: 'week', label: 'Bu Hafta' },
                                    { id: 'all', label: 'Tüm Haberler' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setTimeTab(tab.id as any)}
                                        className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
                                            timeTab === tab.id
                                                ? 'bg-[#00008B] text-white shadow-sm'
                                                : 'text-slate-500 hover:text-[#00008B]'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Table View (Brand Blue Theme - White Text) */}
                    <div className="w-full bg-[#00008B] text-white border border-[#00008B] rounded-3xl p-6 shadow-xl shadow-[#00008B]/20">
                        {loading ? (
                            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                                <span className="text-xs font-bold text-blue-200">Canlı Ekonomik Haberler Yükleniyor...</span>
                            </div>
                        ) : filteredEvents.length > 0 ? (
                            <div className="overflow-x-auto max-h-[650px] overflow-y-auto pr-1">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/15 text-[10px] font-black text-blue-200 uppercase tracking-wider pb-2">
                                            <th className="py-3 px-3 w-28 text-blue-200">Tarih</th>
                                            <th className="py-3 px-3 w-16 text-blue-200">Saat (TSİ)</th>
                                            <th className="py-3 px-3 w-24 text-blue-200">Ülke</th>
                                            <th className="py-3 px-2 w-12 text-center text-blue-200">Etki</th>
                                            <th className="py-3 px-3 text-blue-200">Haber Başlığı</th>
                                            <th className="py-3 px-3 text-right w-28 text-blue-200">Açıklanan</th>
                                            <th className="py-3 px-3 text-right w-28 text-blue-200">Beklenen</th>
                                            <th className="py-3 px-3 text-right w-28 text-blue-200">Önceki</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10 text-xs font-medium">
                                        {filteredEvents.map((item, idx) => (
                                            <tr
                                                key={idx}
                                                className="hover:bg-white/10 transition-colors group border-b border-white/10"
                                            >
                                                {/* Tarih */}
                                                <td className="py-4 px-3 font-bold text-white align-top">
                                                    <span className="block text-xs font-black">{item.dateFormatted}</span>
                                                    <span className="text-[10px] text-blue-200 block font-semibold">{item.dateDayName}</span>
                                                </td>

                                                {/* Saat */}
                                                <td className="py-4 px-3 font-bold text-white align-top">
                                                    {item.time}
                                                </td>

                                                {/* Ülke (TR, ABD, EU, UK) */}
                                                <td className="py-4 px-3 align-top">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-base">{item.flag || '🌐'}</span>
                                                        <span className="text-xs font-black text-white">
                                                            {item.country}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Etki Sinyal Barları */}
                                                <td className="py-4 px-2 text-center align-top pt-4">
                                                    <div className="flex justify-center">
                                                        {renderSignalBars(item.impact)}
                                                    </div>
                                                </td>

                                                {/* Haber Başlığı (%100 Türkçe) */}
                                                <td className="py-4 px-3 align-top">
                                                    <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors block leading-snug">
                                                        {item.event}
                                                    </span>
                                                </td>

                                                {/* Açıklanan (YEŞİL / KIRMIZI / YAKINDA 🔥) */}
                                                <td className="py-4 px-3 text-right align-top">
                                                    {renderActualValue(item)}
                                                </td>

                                                {/* Beklenen */}
                                                <td className="py-4 px-3 text-right font-semibold text-blue-200 align-top">
                                                    {item.forecast || '-'}
                                                </td>

                                                {/* Önceki */}
                                                <td className="py-4 px-3 text-right font-semibold text-blue-200 align-top">
                                                    {item.previous || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-16 text-center text-xs font-bold text-blue-200">
                                Seçilen filtre kriterlerine uygun haber bulunamadı.
                            </div>
                        )}

                        {/* Footer */}
                        <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-[11px] font-bold text-white">
                            <span className="flex items-center gap-1.5 font-black text-white">
                                Toplam Gösterilen: {filteredEvents.length} Haber
                            </span>
                            <span className="text-blue-200 font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                TSİ (UTC+3) Anlık Akış
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
