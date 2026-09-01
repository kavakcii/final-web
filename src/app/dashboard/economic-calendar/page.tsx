"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Calendar as CalendarIcon, Loader2, Check, Filter, Database, Zap, Sparkles, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
    ECONOMIC_CALENDAR_CATALOG, 
    CatalogCalendarEvent, 
    isEventWithin30Minutes, 
    getActualVsForecastStatus 
} from "@/lib/calendar-catalog";

const ITEMS_PER_PAGE = 10;

function parseNumber(str?: string): number | null {
    if (!str || str === '-' || str === 'Bekleniyor') return null;
    const cleaned = str.replace(/[^0-9\.\,\-]/g, '').replace(',', '.');
    const val = parseFloat(cleaned);
    return isNaN(val) ? null : val;
}

export default function EconomicCalendarPage() {
    const router = useRouter();
    const [events, setEvents] = useState<CatalogCalendarEvent[]>(ECONOMIC_CALENDAR_CATALOG);
    const [loading, setLoading] = useState(false);
    const [now, setNow] = useState<Date>(new Date());

    // Country Filters
    const [selectedCountries, setSelectedCountries] = useState<string[]>(['TR', 'ABD', 'EU', 'UK']);

    // Time Horizon Filter
    const [timeTab, setTimeTab] = useState<'today' | 'tomorrow' | 'week0' | 'week1' | 'week2' | 'custom' | 'all'>('all');

    // Custom Date Range Picker State
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Fetch Calendar Data (Standard or Custom Date Range History)
    const fetchCalendarData = async (customStart?: string, customEnd?: string) => {
        setLoading(true);
        try {
            let url = '/api/calendar';
            if (customStart && customEnd) {
                url = `/api/calendar?startDate=${customStart}&endDate=${customEnd}`;
            }
            const res = await fetch(url);
            const json = await res.json();
            if (json.data && Array.isArray(json.data) && json.data.length > 0) {
                setEvents(json.data);
            }
        } catch (err) {
            console.error("Calendar page fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (timeTab === 'custom' && startDate && endDate) {
            fetchCalendarData(startDate, endDate);
        } else {
            fetchCalendarData();
        }

        const interval = setInterval(() => {
            if (timeTab !== 'custom') {
                fetchCalendarData();
            }
            setNow(new Date());
        }, 3000);

        return () => clearInterval(interval);
    }, [timeTab, startDate, endDate]);

    // Reset pagination to page 1 whenever filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCountries, timeTab, startDate, endDate]);

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

    const todayFormatted = new Date().toLocaleDateString('tr-TR', {
        timeZone: 'Europe/Istanbul',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    const tomorrowObj = new Date();
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    const tomorrowFormatted = tomorrowObj.toLocaleDateString('tr-TR', {
        timeZone: 'Europe/Istanbul',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    // 4. KRONOLOJİK SIRALAMA (00:00 -> 23:59) VE FİLTRELEME
    const filteredEvents = useMemo(() => {
        const result = events.filter(e => {
            // Ülke Filtresi
            if (selectedCountries.length > 0 && !selectedCountries.includes(e.country)) {
                return false;
            }

            // Zaman Dilimi Filtresi
            if (timeTab === 'today') {
                if (e.dateFormatted) {
                    if (e.dateFormatted !== todayFormatted) return false;
                } else if (!e.isToday) return false;
            } else if (timeTab === 'tomorrow') {
                if (e.dateFormatted) {
                    if (e.dateFormatted !== tomorrowFormatted) return false;
                } else if (!e.isTomorrow) return false;
            } else if (timeTab === 'week0') {
                if (e.weekOffset !== undefined && e.weekOffset !== 0) return false;
            } else if (timeTab === 'week1') {
                if (e.weekOffset !== undefined && e.weekOffset !== 1) return false;
            } else if (timeTab === 'week2') {
                if (e.weekOffset !== undefined && e.weekOffset !== 2) return false;
            }

            return true;
        });

        // Kronolojik Sıralama (Tarih Artan, Saat Artan 00:00 -> 23:59)
        result.sort((a, b) => {
            const dateA = a.dateFormatted ? a.dateFormatted.split('.').reverse().join('-') : '';
            const dateB = b.dateFormatted ? b.dateFormatted.split('.').reverse().join('-') : '';
            if (dateA !== dateB) return dateA.localeCompare(dateB);
            return a.time.localeCompare(b.time);
        });

        return result;
    }, [events, selectedCountries, timeTab, todayFormatted, tomorrowFormatted]);

    // 5. SAYFALAMA (PAGINATION - 10 KAYIT / SAYFA)
    const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE) || 1;
    const paginatedEvents = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredEvents.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredEvents, currentPage]);

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
    const renderActualValue = (item: CatalogCalendarEvent) => {
        if (item.actual && item.actual !== 'Bekleniyor' && item.actual !== '-' && item.actual !== 'Açıklanacak') {
            const status = getActualVsForecastStatus(item);

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

    // Format Active Date Range Indicator Text (6. KULLANICI DENEYİMİ)
    const activeRangeText = useMemo(() => {
        if (timeTab === 'custom' && startDate && endDate) {
            const startD = new Date(startDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
            const endD = new Date(endDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
            return `${startD} — ${endD}`;
        }
        if (timeTab === 'today') return `Bugün (${todayFormatted})`;
        if (timeTab === 'tomorrow') return `Yarın (${tomorrowFormatted})`;
        if (timeTab === 'week0') return 'Bu Hafta';
        if (timeTab === 'week1') return 'Gelecek Hafta';
        if (timeTab === 'week2') return 'Diğer Hafta';
        return 'Tüm Zaman Dilimleri';
    }, [timeTab, startDate, endDate, todayFormatted, tomorrowFormatted]);

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
                        <Database className="w-4 h-4 text-[#00008B]" /> Otomatik Canlı Veri & Geçmiş Takvim Deposu
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
                                <Zap className="w-3.5 h-3.5" /> CANLI VERİ & TARİH SEÇİCİ
                            </span>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Özel Tarih Seçimi, Geçmiş Veri Sorgusu & 00:00 - 23:59 Kronolojik Sıralama (TSİ UTC+3)
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

                            {/* 4 Country Cards Grid */}
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

                        {/* 1. TARİH SİSTEMİ & MINI TARİH SEÇİCİ (DATE PICKER) */}
                        <div className="pt-4 border-t border-slate-200 space-y-4">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <span className="text-xs font-black text-[#00008B] uppercase tracking-wider flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Zaman Dilimi & Özel Tarih Seçimi
                                </span>
                                <span className="text-xs font-black text-[#00008B] bg-blue-100/60 px-3 py-1 rounded-xl border border-blue-200 flex items-center gap-1.5">
                                    <CalendarIcon className="w-3.5 h-3.5 text-[#00008B]" />
                                    {activeRangeText}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-4">
                                {/* Preset Time Range Tabs */}
                                <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200">
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
                                            onClick={() => {
                                                setTimeTab(tab.id as any);
                                                setStartDate('');
                                                setEndDate('');
                                            }}
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

                                {/* Custom Date Range Picker (Özel Tarih Aralığı & Geçmiş Sorgu) */}
                                <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-extrabold text-slate-400 uppercase">Başlangıç:</span>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => {
                                                setStartDate(e.target.value);
                                                setTimeTab('custom');
                                            }}
                                            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-black text-[#00008B] focus:outline-none focus:border-[#00008B]"
                                        />
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-extrabold text-slate-400 uppercase">Bitiş:</span>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => {
                                                setEndDate(e.target.value);
                                                setTimeTab('custom');
                                            }}
                                            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-black text-[#00008B] focus:outline-none focus:border-[#00008B]"
                                        />
                                    </div>

                                    {(startDate || endDate) && (
                                        <button
                                            onClick={() => {
                                                setStartDate('');
                                                setEndDate('');
                                                setTimeTab('all');
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-xl transition-colors"
                                            title="Tarih Seçimini Sıfırla"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="w-full bg-[#00008B] text-white border border-[#00008B] rounded-3xl p-6 shadow-xl shadow-[#00008B]/20 space-y-4">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                                <span className="text-xs font-bold text-blue-200">Ekonomik Takvim Verileri Yükleniyor...</span>
                            </div>
                        ) : filteredEvents.length > 0 ? (
                            <>
                                <div className="overflow-x-auto pr-1">
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
                                            {paginatedEvents.map((item, idx) => (
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

                                                    {/* Açıklanan */}
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

                                {/* 5. ISTEMCI TARAPLI PAGINATION CONTROLS (10 KAYIT / SAYFA) */}
                                <div className="mt-4 pt-4 border-t border-white/15 flex items-center justify-between flex-wrap gap-4 text-xs font-bold text-white">
                                    <div className="flex items-center gap-2">
                                        <span className="text-blue-200">
                                            Toplam <span className="text-white font-black">{filteredEvents.length}</span> Haberden <span className="text-white font-black">{((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredEvents.length)}</span> Arası Gösteriliyor
                                        </span>
                                    </div>

                                    {/* Pagination Navigation Buttons */}
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black flex items-center gap-1 transition-all"
                                        >
                                            <ChevronLeft className="w-4 h-4" /> Önceki
                                        </button>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                                                    currentPage === pageNum
                                                        ? 'bg-white text-[#00008B] shadow-md'
                                                        : 'bg-white/10 hover:bg-white/20 text-white'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        ))}

                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black flex items-center gap-1 transition-all"
                                        >
                                            Sonraki <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="py-16 text-center text-xs font-bold text-blue-200">
                                Seçilen filtre kriterlerine veya tarih aralığına uygun haber bulunamadı.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
