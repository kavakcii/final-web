"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { 
    ArrowLeft, Calendar as CalendarIcon, Loader2, Check, Filter, 
    ChevronLeft, ChevronRight, RotateCcw, Search, X, Tag, Globe, SlidersHorizontal, Clock, Info, ArrowRight, Flame
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
    ECONOMIC_CALENDAR_CATALOG, 
    CatalogCalendarEvent 
} from "@/lib/calendar-catalog";
import { calculateBackendDifferences } from "@/lib/finai-calendar-analysis-engine";
import { INDICATOR_PROFILES_DATABASE } from "@/lib/indicator-profiles";

import FeaturedEconomicEvents from "@/components/calendar/FeaturedEconomicEvents";
import EconomicEventCard from "@/components/calendar/EconomicEventCard";
import CalendarEmptyState from "@/components/calendar/CalendarEmptyState";

const ITEMS_PER_PAGE = 10;
const ALL_COUNTRIES = ['TR', 'ABD', 'EU', 'UK'];

const COUNTRY_MAP: Record<string, { label: string; flag: string; desc: string }> = {
    TR: { label: 'Türkiye', flag: '🇹🇷', desc: 'TCMB & TÜİK' },
    ABD: { label: 'ABD', flag: '🇺🇸', desc: 'Fed & ISM' },
    EU: { label: 'Euro Bölgesi', flag: '🇪🇺', desc: 'ECB & PMI' },
    UK: { label: 'İngiltere', flag: '🇬🇧', desc: 'BoE & GSYH' }
};

function normalizeText(text?: string): string {
    if (!text) return '';
    return text
        .toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/İ/g, 'i')
        .replace(/I/g, 'i');
}

export default function EconomicCalendarPage() {
    const router = useRouter();
    const [events, setEvents] = useState<CatalogCalendarEvent[]>(ECONOMIC_CALENDAR_CATALOG);
    const [loading, setLoading] = useState(false);
    const [now, setNow] = useState<Date>(new Date());

    // Highlight effect for newly updated events
    const [recentlyUpdatedIds, setRecentlyUpdatedIds] = useState<Set<string>>(new Set());
    const previousEventsMap = useRef<Map<string, string>>(new Map());

    // Filters State
    const [selectedCountries, setSelectedCountries] = useState<string[]>(ALL_COUNTRIES);
    const [impactFilter, setImpactFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Time & Date Navigation State
    const [timeTab, setTimeTab] = useState<'today' | 'tomorrow' | 'custom' | 'all'>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Hover Preview State for Desktop Table
    const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

    // URL State Synchronization
    const syncStatesFromUrl = useCallback(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);

        const countryParam = params.get('country');
        if (countryParam) {
            if (countryParam === 'all') setSelectedCountries(ALL_COUNTRIES);
            else if (countryParam === 'none') setSelectedCountries([]);
            else setSelectedCountries(countryParam.split(',').filter(c => ALL_COUNTRIES.includes(c)));
        }

        const impactParam = params.get('impact');
        if (impactParam && ['all', 'low', 'medium', 'high', 'critical'].includes(impactParam)) {
            setImpactFilter(impactParam as any);
        }

        const qParam = params.get('q');
        if (qParam !== null) setSearchQuery(qParam);

        const tabParam = params.get('tab');
        if (tabParam && ['today', 'tomorrow', 'custom', 'all'].includes(tabParam)) {
            setTimeTab(tabParam as any);
        }

        const startParam = params.get('startDate');
        const endParam = params.get('endDate');
        if (startParam) setStartDate(startParam);
        if (endParam) setEndDate(endParam);

        const pageParam = params.get('page');
        if (pageParam) {
            const parsedPage = parseInt(pageParam, 10);
            if (!isNaN(parsedPage) && parsedPage > 0) setCurrentPage(parsedPage);
        }
    }, []);

    useEffect(() => {
        syncStatesFromUrl();
        const handlePopState = () => syncStatesFromUrl();
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [syncStatesFromUrl]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams();

        if (selectedCountries.length === 0) params.set('country', 'none');
        else if (selectedCountries.length < 4) params.set('country', selectedCountries.join(','));

        if (impactFilter !== 'all') params.set('impact', impactFilter);
        if (searchQuery.trim() !== '') params.set('q', searchQuery.trim());
        if (timeTab !== 'all') params.set('tab', timeTab);
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        if (currentPage > 1) params.set('page', currentPage.toString());

        const newQuery = params.toString();
        const newUrl = newQuery ? `?${newQuery}` : window.location.pathname;

        if (window.location.search !== (newQuery ? `?${newQuery}` : '')) {
            window.history.replaceState(null, '', newUrl);
        }
    }, [selectedCountries, impactFilter, searchQuery, timeTab, startDate, endDate, currentPage]);

    // Data Fetching Function
    const fetchCalendarData = async (customStart?: string, customEnd?: string) => {
        try {
            let url = '/api/calendar';
            if (customStart && customEnd) {
                url = `/api/calendar?startDate=${customStart}&endDate=${customEnd}`;
            }
            const res = await fetch(url);
            const json = await res.json();

            if (json.data && Array.isArray(json.data) && json.data.length > 0) {
                const updatedIds = new Set<string>();
                json.data.forEach((item: CatalogCalendarEvent) => {
                    const id = item.id || item.event;
                    const prevActual = previousEventsMap.current.get(id);
                    if (prevActual && item.actual && item.actual !== 'Bekleniyor' && item.actual !== '-' && item.actual !== prevActual) {
                        updatedIds.add(id);
                    }
                    if (item.actual) {
                        previousEventsMap.current.set(id, item.actual);
                    }
                });

                if (updatedIds.size > 0) {
                    setRecentlyUpdatedIds(prev => new Set([...Array.from(prev), ...Array.from(updatedIds)]));
                    setTimeout(() => {
                        setRecentlyUpdatedIds(new Set());
                    }, 4000);
                }

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
            if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
                return;
            }
            if (timeTab !== 'custom') {
                fetchCalendarData();
            }
            setNow(new Date());
        }, 4000);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchCalendarData();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [timeTab, startDate, endDate]);

    // Reset Page on Filter Change
    const prevFilterRef = useRef({ selectedCountries, impactFilter, searchQuery, timeTab, startDate, endDate });
    useEffect(() => {
        const prev = prevFilterRef.current;
        const isFilterChanged = 
            prev.selectedCountries !== selectedCountries ||
            prev.impactFilter !== impactFilter ||
            prev.searchQuery !== searchQuery ||
            prev.timeTab !== timeTab ||
            prev.startDate !== startDate ||
            prev.endDate !== endDate;

        if (isFilterChanged) {
            setCurrentPage(1);
            prevFilterRef.current = { selectedCountries, impactFilter, searchQuery, timeTab, startDate, endDate };
        }
    }, [selectedCountries, impactFilter, searchQuery, timeTab, startDate, endDate]);

    const toggleCountry = (code: string) => {
        if (selectedCountries.includes(code)) {
            setSelectedCountries(selectedCountries.filter(c => c !== code));
        } else {
            setSelectedCountries([...selectedCountries, code]);
        }
    };

    const toggleAllCountries = () => {
        if (selectedCountries.length === 4) {
            setSelectedCountries([]);
        } else {
            setSelectedCountries([...ALL_COUNTRIES]);
        }
    };

    const clearAllFilters = () => {
        setSelectedCountries([...ALL_COUNTRIES]);
        setImpactFilter('all');
        setSearchQuery('');
        setTimeTab('all');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
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

    const getEventStatusInfo = (item: CatalogCalendarEvent) => {
        const isReleased = item.actual && item.actual !== 'Bekleniyor' && item.actual !== '-';
        if (isReleased) {
            return { status: 'released', text: 'Açıklandı', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' };
        }

        try {
            const parts = (item.dateFormatted || todayFormatted).split('.');
            const [timeH, timeM] = item.time.split(':').map(Number);
            const eventDate = new Date(Date.UTC(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), timeH - 3, timeM));
            const diffMinutes = Math.round((eventDate.getTime() - now.getTime()) / (1000 * 60));

            if (diffMinutes > 60) {
                return { status: 'upcoming', text: item.time, badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' };
            }
            if (diffMinutes > 30 && diffMinutes <= 60) {
                return { status: 'countdown', text: `${diffMinutes} dk kaldı`, badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 font-bold' };
            }
            if (diffMinutes > 10 && diffMinutes <= 30) {
                return { status: 'urgent', text: `${diffMinutes} dk kaldı`, badgeClass: 'bg-amber-50 text-amber-700 border-amber-300 font-black animate-pulse' };
            }
            if (diffMinutes >= 0 && diffMinutes <= 10) {
                return { status: 'releasing', text: 'Açıklanıyor...', badgeClass: 'bg-rose-500 text-white font-black animate-pulse shadow-md shadow-rose-500/30' };
            }

            const passedMinutes = Math.abs(diffMinutes);
            if (passedMinutes <= 30) {
                return { status: 'releasing', text: 'Açıklanıyor...', badgeClass: 'bg-rose-500 text-white font-black animate-pulse shadow-md shadow-rose-500/30' };
            }
            return { status: 'delayed', text: 'Bekleniyor', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' };
        } catch {
            return { status: 'upcoming', text: item.time, badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' };
        }
    };

    const filteredEvents = useMemo(() => {
        if (selectedCountries.length === 0) return [];

        const normQuery = normalizeText(searchQuery.trim());

        const result = events.filter(e => {
            if (!selectedCountries.includes(e.country)) return false;
            
            // ETKİ FİLTRESİ
            if (impactFilter !== 'all') {
                if (impactFilter === 'high' && !(e.impact === 'high' || e.impact === 'critical')) return false;
                if (impactFilter === 'medium' && (e.impact as string) !== 'medium') return false;
                if (impactFilter === 'low' && (e.impact as string) !== 'low') return false;
            }

            if (normQuery !== '') {
                const normEventName = normalizeText(e.event);
                if (!normEventName.includes(normQuery)) return false;
            }

            if (timeTab === 'today') {
                return e.dateFormatted === todayFormatted;
            }
            if (timeTab === 'tomorrow') {
                return e.dateFormatted === tomorrowFormatted;
            }
            return true;
        });

        // Chronological Sorting (00:00 -> 23:59)
        return result.sort((a, b) => {
            const partsA = a.dateFormatted.split('.').reverse().join('-');
            const partsB = b.dateFormatted.split('.').reverse().join('-');
            if (partsA !== partsB) return partsA.localeCompare(partsB);
            return a.time.localeCompare(b.time);
        });
    }, [events, selectedCountries, impactFilter, searchQuery, timeTab, todayFormatted, tomorrowFormatted]);

    const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE) || 1;
    const paginatedEvents = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredEvents.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredEvents, currentPage]);

    const renderSignalBars = (impact: string) => {
        const isHigh = impact === 'high' || impact === 'critical';
        const isMedium = impact === 'medium';

        return (
            <div className="flex items-end gap-[2px] h-3.5 w-4" title={isHigh ? "Yüksek Etki" : "Orta Etki"}>
                <div className={`w-[3px] rounded-xs ${isHigh || isMedium ? 'h-1.5 bg-[#00008B]' : 'h-1 bg-slate-200'}`} />
                <div className={`w-[3px] rounded-xs ${isHigh || isMedium ? 'h-2.5 bg-[#00008B]' : 'h-1 bg-slate-200'}`} />
                <div className={`w-[3px] rounded-xs ${isHigh ? 'h-3.5 bg-rose-600' : 'h-1 bg-slate-200'}`} />
            </div>
        );
    };

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-slate-50 text-[#00008B] w-full mx-auto relative overflow-hidden">
            <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6 md:px-10 lg:py-8 space-y-6 relative z-10 mb-20">
                {/* Navigation Top Bar */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 text-[#00008B] font-bold text-xs shadow-sm hover:bg-slate-100 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
                    </Link>
                </div>

                {/* Page Title & Subtitle */}
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-[#00008B]">
                        EKONOMİK TAKVİM
                    </h1>
                    <p className="text-xs font-bold text-slate-500">
                        Türkiye, ABD, Euro Bölgesi ve İngiltere'nin ekonomik gündemini takip edin.
                    </p>
                </div>

                {/* ÖNE ÇIKAN YÜKSEK ETKİLİ VERİLER BANNER */}
                <FeaturedEconomicEvents events={filteredEvents} />

                {/* DÜZENLENMİŞ VE YENİLENMİŞ FİLTRELER HİYERARŞİSİ */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                    {/* 1. Ülke Seçimi */}
                    <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Ülke Seçimi</span>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={toggleAllCountries}
                                className={`px-4 py-2 rounded-2xl font-black text-xs border transition-all ${
                                    selectedCountries.length === 4 
                                        ? 'bg-[#00008B] text-white border-[#00008B] shadow-sm' 
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                🌐 TÜM ÜLKELER ({selectedCountries.length}/4)
                            </button>
                            {ALL_COUNTRIES.map(code => {
                                const info = COUNTRY_MAP[code];
                                const isSelected = selectedCountries.includes(code);

                                return (
                                    <button
                                        key={code}
                                        onClick={() => toggleCountry(code)}
                                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl font-bold text-xs border transition-all ${
                                            isSelected 
                                                ? 'bg-blue-50 text-[#00008B] border-blue-300 shadow-sm font-black' 
                                                : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 opacity-60'
                                        }`}
                                    >
                                        <span>{info.flag}</span>
                                        <span>{info.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 2. Etki Seviyesi Filtresi (GERİ EKLENDİ) & Tarih Kısayolları */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-150">
                        {/* Etki Seviyesi */}
                        <div className="space-y-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Etki Seviyesi</span>
                            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                                {[
                                    { id: 'all', label: 'Tümü' },
                                    { id: 'high', label: 'Yüksek Etki' },
                                    { id: 'medium', label: 'Orta Etki' },
                                    { id: 'low', label: 'Düşük Etki' }
                                ].map(imp => (
                                    <button
                                        key={imp.id}
                                        onClick={() => setImpactFilter(imp.id as any)}
                                        className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all ${
                                            impactFilter === imp.id 
                                                ? 'bg-[#00008B] text-white shadow-sm' 
                                                : 'text-slate-600 hover:text-[#00008B]'
                                        }`}
                                    >
                                        {imp.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tarih Seçimi (Bugün, Yarın, Tarih Aralığı) */}
                        <div className="space-y-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Tarih Seçimi</span>
                            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                                {[
                                    { id: 'today', label: 'Bugün' },
                                    { id: 'tomorrow', label: 'Yarın' },
                                    { id: 'custom', label: 'Tarih Aralığı' },
                                    { id: 'all', label: 'Tümü' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setTimeTab(tab.id as any)}
                                        className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all ${
                                            timeTab === tab.id 
                                                ? 'bg-[#00008B] text-white shadow-sm' 
                                                : 'text-slate-600 hover:text-[#00008B]'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Tarih Aralığı Date Pickers (Custom Seçildiğinde) */}
                    {timeTab === 'custom' && (
                        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3 pt-3">
                            <span className="text-xs font-black text-[#00008B] flex items-center gap-1.5">
                                <CalendarIcon className="w-4 h-4 text-blue-600" /> Özel Tarih Aralığı Seçin
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Başlangıç Tarihi</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#00008B] focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Bitiş Tarihi</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        min={startDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#00008B] focus:outline-none"
                                    />
                                </div>
                            </div>
                            {startDate && endDate && (
                                <p className="text-xs font-bold text-blue-700">
                                    Seçilen Aralık: {startDate.split('-').reverse().join('.')} — {endDate.split('-').reverse().join('.')}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Anlık Arama */}
                    <div className="relative pt-2">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Gösterge adı veya duyuru ara..."
                            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#00008B] focus:outline-none focus:border-[#00008B]"
                        />
                    </div>
                </div>

                {/* FİLTRE SONUÇ ÖZET BARI */}
                <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-[#00008B]" />
                        <span>{selectedCountries.length} Ülke Seçili · Toplam {filteredEvents.length} Ekonomik Veri</span>
                    </span>
                    {filteredEvents.length > 0 && (
                        <span>Sayfa {currentPage} / {totalPages}</span>
                    )}
                </div>

                {/* BOŞ GÜN VEYA TAKVİM İÇERİĞİ */}
                {selectedCountries.length === 0 || filteredEvents.length === 0 ? (
                    <CalendarEmptyState onResetFilters={clearAllFilters} />
                ) : (
                    <>
                        {/* MOBİL GÖRÜNÜM (CARD FORMAT) */}
                        <div className="grid grid-cols-1 gap-3 md:hidden">
                            {paginatedEvents.map((item, idx) => {
                                const statusInfo = getEventStatusInfo(item);
                                const id = item.id || item.event;
                                const isRecentlyUpdated = recentlyUpdatedIds.has(id);

                                return (
                                    <EconomicEventCard
                                        key={idx}
                                        item={item}
                                        statusInfo={statusInfo}
                                        isRecentlyUpdated={isRecentlyUpdated}
                                    />
                                );
                            })}
                        </div>

                        {/* DESKTOP GÖRÜNÜM (TEMİZ VE SADE TABLO FORMATI) */}
                        <div className="hidden md:block bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                                            <th className="py-3.5 px-4 w-28">SAAT</th>
                                            <th className="py-3.5 px-3 w-28">DURUM</th>
                                            <th className="py-3.5 px-3 w-20">ÜLKE</th>
                                            <th className="py-3.5 px-2 text-center w-16">ETKİ</th>
                                            <th className="py-3.5 px-3">GÖSTERGE / HABER ADI</th>
                                            <th className="py-3.5 px-3 text-right">AÇIKLANAN</th>
                                            <th className="py-3.5 px-3 text-right">BEKLENTİ</th>
                                            <th className="py-3.5 px-3 text-right">ÖNCEKİ</th>
                                            <th className="py-3.5 px-4 text-right">FINAI INTELLIGENCE</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs">
                                        {paginatedEvents.map((item, idx) => {
                                            const statusInfo = getEventStatusInfo(item);
                                            const calc = calculateBackendDifferences(item);
                                            const id = item.id || item.event;
                                            const isRecentlyUpdated = recentlyUpdatedIds.has(id);
                                            const targetId = encodeURIComponent(id);

                                            return (
                                                <tr 
                                                    key={idx} 
                                                    onMouseEnter={() => setHoveredEventId(id)}
                                                    onMouseLeave={() => setHoveredEventId(null)}
                                                    className={`transition-colors hover:bg-blue-50/40 group ${
                                                        isRecentlyUpdated ? 'bg-emerald-50 font-bold' : ''
                                                    }`}
                                                >
                                                    {/* Saat */}
                                                    <td className="py-4 px-4 font-mono font-bold text-[#00008B] align-top">
                                                        {item.time}
                                                    </td>

                                                    {/* Durum Badge */}
                                                    <td className="py-4 px-3 align-top">
                                                        <span className={`inline-block px-2.5 py-1 rounded-xl text-[10px] border transition-all ${statusInfo.badgeClass}`}>
                                                            {statusInfo.text}
                                                        </span>
                                                    </td>

                                                    {/* Ülke */}
                                                    <td className="py-4 px-3 align-top">
                                                        <div className="flex items-center gap-1.5 font-bold text-slate-700">
                                                            <span className="text-base">{item.flag || '🌐'}</span>
                                                            <span>{item.country}</span>
                                                        </div>
                                                    </td>

                                                    {/* Etki Sinyal Barları */}
                                                    <td className="py-4 px-2 text-center align-top pt-4">
                                                        <div className="flex justify-center">
                                                            {renderSignalBars(item.impact)}
                                                        </div>
                                                    </td>

                                                    {/* Haber Başlığı */}
                                                    <td className="py-4 px-3 align-top relative">
                                                        <span className="text-xs font-bold text-[#00008B] block leading-snug">
                                                            {item.event}
                                                        </span>

                                                        {/* Sadeleştirilmiş Nesnel Fark Badge (Mekanik Puan İfadeleri Kaldırıldı) */}
                                                        {calc.forecastDiffText && (
                                                            <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 inline-block mt-1">
                                                                {calc.forecastDiffText}
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Actual */}
                                                    <td className="py-4 px-3 text-right font-black text-[#00008B] align-top">
                                                        {item.actual || 'Bekleniyor'}
                                                    </td>

                                                    {/* Forecast */}
                                                    <td className="py-4 px-3 text-right font-semibold text-slate-600 align-top">
                                                        {item.forecast || '-'}
                                                    </td>

                                                    {/* Previous */}
                                                    <td className="py-4 px-3 text-right font-semibold text-slate-400 align-top">
                                                        {item.previous || '-'}
                                                    </td>

                                                    {/* FinAi Intelligence CTA */}
                                                    <td className="py-4 px-4 text-right align-top">
                                                        <Link
                                                            href={`/dashboard/economic-calendar/${targetId}`}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-[#00008B] hover:text-white text-[#00008B] font-black text-[11px] border border-blue-200 transition-all shadow-xs"
                                                        >
                                                            İncele <ArrowRight className="w-3 h-3" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* PAGINATION CONTROLS */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-[#00008B] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-all"
                                >
                                    ← Önceki Sayfa
                                </button>
                                <span className="text-xs font-black text-[#00008B]">
                                    Sayfa {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-[#00008B] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-all"
                                >
                                    Sonraki Sayfa →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
