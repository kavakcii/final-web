"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Loader2, Check, Filter, Database, Zap, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
    ECONOMIC_CALENDAR_CATALOG, 
    CatalogCalendarEvent, 
    isEventWithin30Minutes, 
    getActualVsForecastStatus 
} from "@/lib/calendar-catalog";

function parseNumber(str?: string): number | null {
    if (!str || str === '-' || str === 'Bekleniyor') return null;
    const cleaned = str.replace(/[^0-9\.\,\-]/g, '').replace(',', '.');
    const val = parseFloat(cleaned);
    return isNaN(val) ? null : val;
}

export default function EconomicCalendarPage() {
    const router = useRouter();
    // Initial load instantly from pre-indexed catalog (0 ms lag!)
    const [events, setEvents] = useState<CatalogCalendarEvent[]>(ECONOMIC_CALENDAR_CATALOG);
    const [loading, setLoading] = useState(false);
    const [now, setNow] = useState<Date>(new Date());

    // All countries selected by default
    const [selectedCountries, setSelectedCountries] = useState<string[]>(['TR', 'ABD', 'EU', 'UK']);

    // Time Horizon Filter
    const [timeTab, setTimeTab] = useState<'today' | 'tomorrow' | 'week0' | 'week1' | 'week2' | 'all'>('all');

    const fetchCalendarData = async () => {
        try {
            const res = await fetch('/api/calendar');
            const json = await res.json();
            if (json.data && Array.isArray(json.data) && json.data.length > 0) {
                setEvents(json.data);
            }
        } catch (err) {
            console.error("Calendar page fetch error:", err);
        }
    };

    useEffect(() => {
        fetchCalendarData();

        // Fast interval for scheduled event time updates & 30-min pulsing animation refresh
        const interval = setInterval(() => {
            fetchCalendarData();
            setNow(new Date());
        }, 3000);

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

    // Filtered Events
    const filteredEvents = events.filter(e => {
        // Multi-country filter
        if (selectedCountries.length > 0 && !selectedCountries.includes(e.country)) {
            return false;
        }

        // Time Horizon filter
        if (timeTab === 'today') {
            if (!e.isToday && e.dateFormatted !== "03.08.2026") return false;
        } else if (timeTab === 'tomorrow') {
            if (!e.isTomorrow && e.dateFormatted !== "04.08.2026") return false;
        } else if (timeTab === 'week0') {
            if (e.weekOffset !== 0) return false;
        } else if (timeTab === 'week1') {
            if (e.weekOffset !== 1) return false;
        } else if (timeTab === 'week2') {
            if (e.weekOffset !== 2) return false;
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

    // Actual vs Forecast Color Logic + 30-Minute Pulsing Animation
    const renderActualValue = (item: CatalogCalendarEvent) => {
        if (item.actual && item.actual !== 'Bekleniyor' && item.actual !== '-' && item.actual !== 'Açıklanacak') {
            const status = getActualVsForecastStatus(item);
            const isPulsing = isEventWithin30Minutes(item);

            if (isPulsing) {
                if (status === 'above') {
                    return (
                        <span className="font-black text-white bg-emerald-500 px-2.5 py-1 rounded-xl shadow-lg shadow-emerald-500/50 animate-pulse flex items-center justify-end gap-1 text-xs">
                            <span>▲</span> {item.actual}
                        </span>
                    );
                } else if (status === 'below') {
                    return (
                        <span className="font-black text-white bg-rose-500 px-2.5 py-1 rounded-xl shadow-lg shadow-rose-500/50 animate-pulse flex items-center justify-end gap-1 text-xs">
                            <span>▼</span> {item.actual}
                        </span>
                    );
                } else {
                    return (
                        <span className="font-black text-white bg-slate-700 px-2.5 py-1 rounded-xl shadow-lg shadow-slate-500/50 animate-pulse flex items-center justify-end gap-1 text-xs">
                            {item.actual}
                        </span>
                    );
                }
            }

            // Static after 30 minutes
            if (status === 'above') {
                return (
                    <span className="font-black text-emerald-400 flex items-center justify-end gap-0.5">
                        <span className="text-[10px]">▲</span> {item.actual}
                    </span>
                );
            } else if (status === 'below') {
                return (
                    <span className="font-black text-rose-400 flex items-center justify-end gap-0.5">
                        <span className="text-[10px]">▼</span> {item.actual}
                    </span>
                );
            }

            return <span className="font-black text-white">{item.actual}</span>;
        }

        return <span className="font-bold text-white/60">Bekleniyor</span>;
    };

    const handleRowClick = (item: CatalogCalendarEvent) => {
        const targetId = item.id || item.event;
        router.push(`/dashboard/economic-calendar/${encodeURIComponent(targetId)}`);
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
                        <Database className="w-4 h-4 text-[#00008B]" /> Otomatik Canlı Veri Takip Deposu
                    </div>
                </div>

                {/* Page Title & Controls */}
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#00008B]">
                                Özel Ekonomik Takvim
                            </h1>
                            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1">
                                <Zap className="w-3.5 h-3.5" /> CANLI VERİ & ANIMASYON
                            </span>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Haber Saatlerinde Otomatik Güncellenen & 30 Dakika Yanıp Sönen Makro Veri Takvimi (TSİ UTC+3)
                        </p>
                    </div>

                    {/* Filter Card Box */}
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                        {/* Multi-Select Country Checkbox Cards */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-black text-[#00008B] uppercase tracking-wider flex items-center gap-1.5">
                                    <Filter className="w-4 h-4 text-[#00008B]" /> Ülke Filtreleri (Çıkarmak İstediğiniz Ülkeye Tıklayın)
                                </span>
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                    {selectedCountries.length} / 4 Ülke Seçili
                                </span>
                            </div>

                            {/* 4 Card Boxes Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { code: 'TR', label: 'Türkiye', flag: '🇹🇷', desc: 'TCMB & TÜİK Makro Verileri' },
                                    { code: 'ABD', label: 'Amerika Birleşik Devletleri', flag: '🇺🇸', desc: 'Fed & ISM & İstihdam Verileri' },
                                    { code: 'EU', label: 'Avrupa Birliği', flag: '🇪🇺', desc: 'ECB & PMI & Enflasyon Verileri' },
                                    { code: 'UK', label: 'Birleşik Krallık', flag: '🇬🇧', desc: 'BoE & İmalat & GSYH Verileri' }
                                ].map((country) => {
                                    const isSelected = selectedCountries.includes(country.code);
                                    return (
                                        <div
                                            key={country.code}
                                            onClick={() => toggleCountry(country.code)}
                                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                                                isSelected
                                                    ? 'bg-[#00008B] text-white border-[#00008B] shadow-lg shadow-[#00008B]/20 ring-2 ring-[#00008B]/30'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:border-[#00008B]/40 hover:shadow-md'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <span className="text-2xl">{country.flag}</span>
                                                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                                                    isSelected ? 'bg-white text-[#00008B] border-white shadow-sm' : 'border-slate-300 bg-white'
                                                }`}>
                                                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className={`text-sm font-black tracking-tight ${isSelected ? 'text-white' : 'text-[#00008B]'}`}>
                                                    {country.label} ({country.code})
                                                </h4>
                                                <p className={`text-[10px] font-medium mt-0.5 ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                                                    {country.desc}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Time Horizon Filter Buttons */}
                        <div className="pt-2 border-t border-slate-200">
                            <span className="text-xs font-black text-[#00008B] uppercase tracking-wider block mb-3 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Zaman Dilimi Filtresi
                            </span>
                            <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 w-fit">
                                {[
                                    { id: 'today', label: 'Bugün' },
                                    { id: 'tomorrow', label: 'Yarın' },
                                    { id: 'week0', label: 'Bu Hafta' },
                                    { id: 'week1', label: 'Gelecek Hafta' },
                                    { id: 'week2', label: 'Diğer Hafta' },
                                    { id: 'all', label: 'Tümü' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setTimeTab(tab.id as any)}
                                        className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
                                            timeTab === tab.id
                                                ? 'bg-[#00008B] text-white shadow-md shadow-[#00008B]/20'
                                                : 'text-slate-500 hover:text-[#00008B] hover:bg-slate-50'
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
                        {filteredEvents.length > 0 ? (
                            <div className="overflow-x-auto max-h-[650px] overflow-y-auto pr-1">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/15 text-[10px] font-black text-blue-200 uppercase tracking-wider pb-2">
                                            <th className="py-3 px-3 w-32 text-blue-200">Tarih</th>
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
                                                onClick={() => handleRowClick(item)}
                                                className="hover:bg-white/15 cursor-pointer transition-colors group border-b border-white/10"
                                            >
                                                {/* Tarih */}
                                                <td className="py-4 px-3 font-bold text-white align-top">
                                                    <span className="block text-xs font-black text-white">{item.dateFormatted}</span>
                                                    <span className="text-[10px] text-blue-200 block font-semibold">{item.dateDayName}</span>
                                                </td>

                                                {/* Saat */}
                                                <td className="py-4 px-3 font-bold text-white align-top">
                                                    {item.time}
                                                </td>

                                                {/* Ülke */}
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

                                                {/* Haber Başlığı */}
                                                <td className="py-4 px-3 align-top">
                                                    <span className="text-xs font-bold text-white block leading-snug">
                                                        {item.event}
                                                    </span>
                                                </td>

                                                {/* Açıklanan (30 DAKİKA YANIP SÖNEN YEŞİL / KIRMIZI ANİMASYONLU) */}
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
                                Toplam Gösterilen: {filteredEvents.length} Haber (3 Haftalık Katalog)
                            </span>
                            <span className="text-blue-200 font-bold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                TSİ Saat Başı Otomatik Canlı Yenileme Aktif
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
