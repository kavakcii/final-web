"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { 
    ArrowLeft, Calendar as CalendarIcon, Loader2, Check, Filter, Database, Zap, Sparkles, 
    ChevronLeft, ChevronRight, RotateCcw, Search, X, Tag, Globe, SlidersHorizontal, Clock, AlertCircle, Info 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
    ECONOMIC_CALENDAR_CATALOG, 
    CatalogCalendarEvent, 
    getActualVsForecastStatus 
} from "@/lib/calendar-catalog";

const ITEMS_PER_PAGE = 10;
const ALL_COUNTRIES = ['TR', 'ABD', 'EU', 'UK'];

const COUNTRY_MAP: Record<string, { label: string; flag: string; desc: string }> = {
    TR: { label: 'Türkiye', flag: '🇹🇷', desc: 'TCMB & TÜİK' },
    ABD: { label: 'ABD', flag: '🇺🇸', desc: 'Fed & ISM' },
    EU: { label: 'Euro Bölgesi', flag: '🇪🇺', desc: 'ECB & PMI' },
    UK: { label: 'İngiltere', flag: '🇬🇧', desc: 'BoE & GSYH' }
};

function parseNumber(str?: string): number | null {
    if (!str || str === '-' || str === 'Bekleniyor') return null;
    const cleaned = str.replace(/[^0-9\.\,\-]/g, '').replace(',', '.');
    const val = parseFloat(cleaned);
    return isNaN(val) ? null : val;
}

// Türkçe Karakter Duyarsız Metin Normalizasyonu
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

// V. GEÇMİŞ VERİ VE FORECAST/ACTUAL YORUMLAMASI (6.5)
function getForecastActualInterpretation(actualStr?: string, forecastStr?: string): { text: string; color: string; bg: string } | null {
    const actualNum = parseNumber(actualStr);
    const forecastNum = parseNumber(forecastStr);

    if (actualNum === null || forecastNum === null) return null;

    const diff = actualNum - forecastNum;
    if (Math.abs(diff) <= 0.0001) {
        return { text: "Beklentiye Paralel", color: "text-blue-300", bg: "bg-blue-500/10 border-blue-400/30" };
    }
    if (diff > 0) {
        return { text: "Beklentinin Üzerinde", color: "text-emerald-300", bg: "bg-emerald-500/10 border-emerald-400/30" };
    }
    return { text: "Beklentinin Altında", color: "text-rose-300", bg: "bg-rose-500/10 border-rose-400/30" };
}

export default function EconomicCalendarPage() {
    const router = useRouter();
    const [events, setEvents] = useState<CatalogCalendarEvent[]>(ECONOMIC_CALENDAR_CATALOG);
    const [loading, setLoading] = useState(false);
    const [dataSource, setDataSource] = useState<string>('live-feed');
    const [now, setNow] = useState<Date>(new Date());

    // 6.4 Akıllı UI Güncellemesi için Son Güncellenen Event ID'leri (Highlight Efekti)
    const [recentlyUpdatedIds, setRecentlyUpdatedIds] = useState<Set<string>>(new Set());
    const previousEventsMap = useRef<Map<string, string>>(new Map());

    // 6.2 Filtreleme State'leri
    const [selectedCountries, setSelectedCountries] = useState<string[]>(ALL_COUNTRIES);
    const [impactFilter, setImpactFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // 6.1 Zaman Dilimi & Tarih Seçici State'leri
    const [timeTab, setTimeTab] = useState<'today' | 'tomorrow' | 'week0' | 'week1' | 'week2' | 'custom' | 'all'>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState<number>(1);

    // 6.6 URL STATE SENKRONİZASYONU
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
        if (tabParam && ['today', 'tomorrow', 'week0', 'week1', 'week2', 'custom', 'all'].includes(tabParam)) {
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

    // İlk Yüklemede ve Popstate Durumunda URL'den State Yükle
    useEffect(() => {
        syncStatesFromUrl();
        const handlePopState = () => syncStatesFromUrl();
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [syncStatesFromUrl]);

    // State Değişikliklerinde URL Sorgu Parametrelerini Güncelle (replaceState)
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

    // Veri Çekme Fonksiyonu
    const fetchCalendarData = async (customStart?: string, customEnd?: string) => {
        try {
            let url = '/api/calendar';
            if (customStart && customEnd) {
                url = `/api/calendar?startDate=${customStart}&endDate=${customEnd}`;
            }
            const res = await fetch(url);
            const json = await res.json();
            
            if (json.source) setDataSource(json.source);

            if (json.data && Array.isArray(json.data) && json.data.length > 0) {
                // 6.4 Akıllı UI Güncellemesi: Değişen Actual verilerini tespit et ve highlight kümesine ekle
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
                    }, 4000); // 4 Saniye sonra vurgulamayı kaldır
                }

                setEvents(json.data);
            }
        } catch (err) {
            console.error("Calendar page fetch error:", err);
            // 6.7 Veri Güvenilirliği UI: Hata durumunda mevcut veriyi silme, kaynağı fallback olarak işaretle
            setDataSource('fallback-active');
        } finally {
            setLoading(false);
        }
    };

    // 6.3 CANLI DURUM & ADAPTIVE POLLING ENGINE (Tab Görünürlük Kontrolü)
    useEffect(() => {
        if (timeTab === 'custom' && startDate && endDate) {
            fetchCalendarData(startDate, endDate);
        } else {
            fetchCalendarData();
        }

        const interval = setInterval(() => {
            // Sekme arka planda ise agresif polling yapma (Kullanıcı Pozisyonu & Kaynak Koruması)
            if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
                return;
            }

            if (timeTab !== 'custom') {
                fetchCalendarData();
            }
            setNow(new Date());
        }, 4000);

        // Tab Görünürlüğe Geri Döndüğünde Anında Yenile
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

    // 6.4 KULLANICI POZİSYONU KORUMASI: Yalnızca Manuel Filtre/Tarih Değişince Page 1 Yap
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

    // Ülke Seçim Handlers
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

    // Filtreleri Temizle
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

    // 6.3 CANLI DURUM & GERİ SAYIM HESAPLAYICI
    const getEventStatusInfo = (item: CatalogCalendarEvent) => {
        const isReleased = item.actual && item.actual !== 'Bekleniyor' && item.actual !== '-';
        if (isReleased) {
            return { status: 'released', text: 'Açıklandı', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
        }

        try {
            const parts = (item.dateFormatted || todayFormatted).split('.');
            const [timeH, timeM] = item.time.split(':').map(Number);
            const eventDate = new Date(Date.UTC(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), timeH - 3, timeM));
            const diffMinutes = Math.round((eventDate.getTime() - now.getTime()) / (1000 * 60));

            if (diffMinutes > 60) {
                return { status: 'upcoming', text: item.time, badgeClass: 'bg-white/10 text-white border-white/20' };
            }
            if (diffMinutes > 30 && diffMinutes <= 60) {
                return { status: 'countdown', text: `${diffMinutes} dk kaldı`, badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
            }
            if (diffMinutes > 10 && diffMinutes <= 30) {
                return { status: 'urgent', text: `${diffMinutes} dk kaldı`, badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse' };
            }
            if (diffMinutes >= 0 && diffMinutes <= 10) {
                return { status: 'releasing', text: 'Açıklanıyor...', badgeClass: 'bg-rose-500 text-white font-black animate-pulse shadow-lg shadow-rose-500/50' };
            }

            // Saat geçti ama actual gelmedi
            const passedMinutes = Math.abs(diffMinutes);
            if (passedMinutes <= 30) {
                return { status: 'releasing', text: 'Açıklanıyor...', badgeClass: 'bg-rose-500 text-white font-black animate-pulse shadow-lg shadow-rose-500/50' };
            }
            return { status: 'delayed', text: 'Bekleniyor', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
        } catch {
            return { status: 'upcoming', text: item.time, badgeClass: 'bg-white/10 text-white border-white/20' };
        }
    };

    // 6.2 TÜM FİLTRELERİN BİRLEŞİK MANTIĞI & KRONOLOJİK SIRALAMA
    const filteredEvents = useMemo(() => {
        if (selectedCountries.length === 0) return [];

        const normQuery = normalizeText(searchQuery.trim());

        const result = events.filter(e => {
            if (!selectedCountries.includes(e.country)) return false;
            if (impactFilter !== 'all' && e.impact !== impactFilter) return false;

            if (normQuery !== '') {
                const normEventName = normalizeText(e.event);
                if (!normEventName.includes(normQuery)) return false;
            }

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
    }, [events, selectedCountries, impactFilter, searchQuery, timeTab, todayFormatted, tomorrowFormatted]);

    // SAYFALAMA & SONUÇ HESAPLAMA
    const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE) || 1;
    const paginatedEvents = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredEvents.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredEvents, currentPage]);

    // AKTİF FİLTRE CHİPLERİ KONTROLÜ
    const hasActiveFilters = useMemo(() => {
        return (
            selectedCountries.length < 4 ||
            impactFilter !== 'all' ||
            searchQuery.trim() !== '' ||
            timeTab !== 'all' ||
            startDate !== '' ||
            endDate !== ''
        );
    }, [selectedCountries, impactFilter, searchQuery, timeTab, startDate, endDate]);

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

    // Actual vs Forecast Renklendirme ve Yorumlama
    const renderActualValue = (item: CatalogCalendarEvent) => {
        const interpretation = getForecastActualInterpretation(item.actual, item.forecast);

        if (item.actual && item.actual !== 'Bekleniyor' && item.actual !== '-' && item.actual !== 'Açıklanacak') {
            const status = getActualVsForecastStatus(item);

            return (
                <div className="flex flex-col items-end">
                    {status === 'above' ? (
                        <span className="font-black text-emerald-400 flex items-center justify-end gap-0.5">
                            <span className="text-[10px]">▲</span> {item.actual}
                        </span>
                    ) : status === 'below' ? (
                        <span className="font-black text-rose-400 flex items-center justify-end gap-0.5">
                            <span className="text-[10px]">▼</span> {item.actual}
                        </span>
                    ) : (
                        <span className="font-black text-white">{item.actual}</span>
                    )}

                    {/* 6.5 Nümerik Beklenti Yorum Rozeti */}
                    {interpretation && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border mt-1 ${interpretation.color} ${interpretation.bg}`}>
                            {interpretation.text}
                        </span>
                    )}
                </div>
            );
        }

        return <span className="font-bold text-white/60">Bekleniyor</span>;
    };

    const handleRowClick = (item: CatalogCalendarEvent) => {
        const targetId = item.id || item.event;
        router.push(`/dashboard/economic-calendar/${encodeURIComponent(targetId)}`);
    };

    // Active Date Range Label
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
        return 'Tüm Zamanlar';
    }, [timeTab, startDate, endDate, todayFormatted, tomorrowFormatted]);

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-white text-[#00008B] w-full mx-auto relative overflow-hidden">
            <div className="w-full max-w-[1600px] mx-auto px-6 py-8 md:px-10 lg:py-10 space-y-8 relative z-10 mb-20">
                {/* Top Navigation & 6.7 Veri Güvenilirliği Rozetleri */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#00008B] text-white font-bold text-xs shadow-lg shadow-[#00008B]/20 hover:bg-[#0808a3] transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
                    </Link>

                    {/* 6.7 VERİ GÜVENİLİRLİĞİ STATUS BADGES */}
                    <div className="flex items-center gap-3">
                        {dataSource === 'live-feed' && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-50 px-3.5 py-1.5 rounded-2xl border border-emerald-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                CANLI AKIŞ AKTİF (LIVE)
                            </span>
                        )}
                        {dataSource === 'server-cache' && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#00008B] bg-blue-50 px-3.5 py-1.5 rounded-2xl border border-blue-200">
                                <Zap className="w-3.5 h-3.5 text-[#00008B]" />
                                HIZLI SUNUCU ÖNBELLEĞİ
                            </span>
                        )}
                        {dataSource === 'database-history' && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-black text-purple-600 bg-purple-50 px-3.5 py-1.5 rounded-2xl border border-purple-200">
                                <Database className="w-3.5 h-3.5 text-purple-600" />
                                KALICI VERİTABANI GEÇMİŞİ
                            </span>
                        )}
                        {dataSource.includes('fallback') && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-700 bg-amber-50 px-3.5 py-1.5 rounded-2xl border border-amber-200">
                                <Info className="w-3.5 h-3.5 text-amber-600" />
                                YEDEK VERİTAPANI (KORUMALI)
                            </span>
                        )}
                    </div>
                </div>

                {/* Page Title & Controls */}
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#00008B]">
                                    Özel Ekonomik Takvim
                                </h1>
                                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1">
                                    <Zap className="w-3.5 h-3.5" /> AŞAMA 6 CANLI & GELİŞMİŞ TAKVİM
                                </span>
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                Canlı Durum, Beklenti Yorumları, Gelişmiş Filtreleme & URL State (TSİ UTC+3)
                            </p>
                        </div>

                        {/* SONUÇ SAYISI VE SAYFA BİLGİSİ */}
                        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 px-4 py-2.5 rounded-2xl">
                            <span className="text-xs font-black text-[#00008B] flex items-center gap-1.5">
                                <SlidersHorizontal className="w-4 h-4 text-[#00008B]" />
                                {filteredEvents.length} Sonuç · Sayfa {currentPage}/{totalPages}
                            </span>
                        </div>
                    </div>

                    {/* FILTER PANEL BOX */}
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                        
                        {/* SEARCH BAR & IMPACT FILTER */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* ARAMA GİRDİSİ (INSTANT SEARCH) */}
                            <div className="md:col-span-2 relative">
                                <label className="text-xs font-black text-[#00008B] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <Search className="w-3.5 h-3.5 text-[#00008B]" /> Gösterge / Haber Adı İle Anlık Arama
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Örn: CPI, Enflasyon, Faiz, TÜFE, Tarım Dışı..."
                                        className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-10 py-2.5 text-xs font-black text-[#00008B] placeholder:text-slate-400 focus:outline-none focus:border-[#00008B] focus:ring-2 focus:ring-[#00008B]/20 transition-all"
                                    />
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* ETKİ FİLTRESİ (SINGLE SELECT) */}
                            <div>
                                <label className="text-xs font-black text-[#00008B] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <Tag className="w-3.5 h-3.5 text-[#00008B]" /> Etki Seviyesi Filtresi
                                </label>
                                <select
                                    value={impactFilter}
                                    onChange={(e) => setImpactFilter(e.target.value as any)}
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-black text-[#00008B] focus:outline-none focus:border-[#00008B] focus:ring-2 focus:ring-[#00008B]/20 transition-all cursor-pointer"
                                >
                                    <option value="all">Tümü (Tüm Etkiler)</option>
                                    <option value="critical">🔴 Critical (Çok Yüksek)</option>
                                    <option value="high">🟠 High (Yüksek)</option>
                                    <option value="medium">🟡 Medium (Orta)</option>
                                    <option value="low">⚪ Low (Düşük)</option>
                                </select>
                            </div>
                        </div>

                        {/* ÜLKE FİLTRELERİ */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-black text-[#00008B] uppercase tracking-wider flex items-center gap-1.5">
                                    <Globe className="w-4 h-4 text-[#00008B]" /> Ülke Seçimi (İstediğiniz Ülkeyi Ekleyin / Çıkarın)
                                </span>
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                    {selectedCountries.length} / 4 Ülke Seçili {selectedCountries.length === 0 && '(HİÇBİRİ SEÇİLİ DEĞİL)'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                {/* 'TÜMÜ' CARD */}
                                <div
                                    onClick={toggleAllCountries}
                                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                                        selectedCountries.length === 4
                                            ? 'bg-[#00008B] text-white border-[#00008B] shadow-md ring-2 ring-[#00008B]/30'
                                            : 'bg-white text-slate-700 border-slate-200 hover:border-[#00008B]/40'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">🌐</span>
                                        <span className="text-xs font-black">Tümü</span>
                                    </div>
                                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                                        selectedCountries.length === 4 ? 'bg-white text-[#00008B] border-white' : 'border-slate-300'
                                    }`}>
                                        {selectedCountries.length === 4 && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                </div>

                                {/* 4 COUNTRY CARDS */}
                                {ALL_COUNTRIES.map((code) => {
                                    const c = COUNTRY_MAP[code];
                                    const isSelected = selectedCountries.includes(code);
                                    return (
                                        <div
                                            key={code}
                                            onClick={() => toggleCountry(code)}
                                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                                                isSelected
                                                    ? 'bg-[#00008B] text-white border-[#00008B] shadow-md ring-2 ring-[#00008B]/30'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:border-[#00008B]/40'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">{c.flag}</span>
                                                <div>
                                                    <span className="text-xs font-black block leading-none">{c.label}</span>
                                                    <span className={`text-[9px] font-semibold ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>{code}</span>
                                                </div>
                                            </div>
                                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                                                isSelected ? 'bg-white text-[#00008B] border-white' : 'border-slate-300'
                                            }`}>
                                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* TARİH SEÇİCİ & ZAMAN DİLİMLERİ */}
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

                        {/* AKTİF FİLTRE CHİPLERİ & FİLTRELERİ TEMİZLE BUTONU */}
                        {hasActiveFilters && (
                            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                                        Aktif Filtreler:
                                    </span>

                                    {selectedCountries.length < 4 && selectedCountries.map(code => (
                                        <span
                                            key={code}
                                            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-blue-100/80 text-[#00008B] text-xs font-black border border-blue-200"
                                        >
                                            {COUNTRY_MAP[code]?.flag} {COUNTRY_MAP[code]?.label}
                                            <button onClick={() => toggleCountry(code)} className="hover:text-red-600 ml-0.5">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </span>
                                    ))}

                                    {selectedCountries.length === 0 && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-rose-100 text-rose-700 text-xs font-black border border-rose-200">
                                            Hiçbir Ülke Seçili Değil!
                                        </span>
                                    )}

                                    {impactFilter !== 'all' && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-100 text-amber-800 text-xs font-black border border-amber-200">
                                            Etki: {impactFilter.toUpperCase()}
                                            <button onClick={() => setImpactFilter('all')} className="hover:text-red-600 ml-0.5">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </span>
                                    )}

                                    {searchQuery.trim() !== '' && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-200">
                                            Arama: "{searchQuery}"
                                            <button onClick={() => setSearchQuery('')} className="hover:text-red-600 ml-0.5">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </span>
                                    )}

                                    {timeTab !== 'all' && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-purple-100 text-purple-800 text-xs font-black border border-purple-200">
                                            Zaman: {activeRangeText}
                                            <button onClick={() => { setTimeTab('all'); setStartDate(''); setEndDate(''); }} className="hover:text-red-600 ml-0.5">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </span>
                                    )}
                                </div>

                                <button
                                    onClick={clearAllFilters}
                                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-extrabold text-xs border border-rose-200 transition-all"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" /> Filtreleri Temizle
                                </button>
                            </div>
                        )}
                    </div>

                    {/* TABLE VIEW */}
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
                                                <th className="py-3 px-3 w-28 text-blue-200">Saat / Durum</th>
                                                <th className="py-3 px-3 w-24 text-blue-200">Ülke</th>
                                                <th className="py-3 px-2 w-12 text-center text-blue-200">Etki</th>
                                                <th className="py-3 px-3 text-blue-200">Haber Başlığı</th>
                                                <th className="py-3 px-3 text-right w-36 text-blue-200">Açıklanan</th>
                                                <th className="py-3 px-3 text-right w-28 text-blue-200">Beklenen</th>
                                                <th className="py-3 px-3 text-right w-28 text-blue-200">Önceki</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/10 text-xs font-medium">
                                            {paginatedEvents.map((item, idx) => {
                                                const id = item.id || item.event;
                                                const isJustUpdated = recentlyUpdatedIds.has(id);
                                                const statusInfo = getEventStatusInfo(item);

                                                return (
                                                    <tr
                                                        key={idx}
                                                        onClick={() => handleRowClick(item)}
                                                        className={`transition-colors duration-500 cursor-pointer group border-b border-white/10 ${
                                                            isJustUpdated ? 'bg-emerald-500/30' : 'hover:bg-white/15'
                                                        }`}
                                                    >
                                                        {/* Tarih */}
                                                        <td className="py-4 px-3 font-bold text-white align-top">
                                                            <span className="block text-xs font-black text-white">{item.dateFormatted}</span>
                                                            <span className="text-[10px] text-blue-200 block font-semibold">{item.dateDayName}</span>
                                                        </td>

                                                        {/* 6.3 Saat & Canlı Durum Rozeti */}
                                                        <td className="py-4 px-3 align-top">
                                                            <span className={`inline-block px-2.5 py-1 rounded-xl text-[11px] font-black border transition-all ${statusInfo.badgeClass}`}>
                                                                {statusInfo.text}
                                                            </span>
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

                                                        {/* Haber Başlığı & 7.26 Veriyi ve Etkilerini İncele Linki */}
                                                        <td className="py-4 px-3 align-top">
                                                            <span className="text-xs font-bold text-white block leading-snug">
                                                                {item.event}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-blue-200 group-hover:text-amber-300 flex items-center gap-1 mt-1 transition-colors">
                                                                FinAi Intelligence'ı incele →
                                                            </span>
                                                        </td>

                                                        {/* 6.5 Açıklanan & Nümerik Beklenti Yorumlama */}
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
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* PAGINATION CONTROLS */}
                                <div className="mt-4 pt-4 border-t border-white/15 flex items-center justify-between flex-wrap gap-4 text-xs font-bold text-white">
                                    <div className="flex items-center gap-2">
                                        <span className="text-blue-200">
                                            Toplam <span className="text-white font-black">{filteredEvents.length}</span> Haberden <span className="text-white font-black">{((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredEvents.length)}</span> Arası Gösteriliyor
                                        </span>
                                    </div>

                                    {/* Pagination Buttons */}
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
                            /* BOŞ SONUÇ EKRANI */
                            <div className="py-16 px-6 text-center space-y-4 max-w-md mx-auto">
                                <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto text-blue-200">
                                    <Search className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-white">Bu filtrelere uygun ekonomik veri bulunamadı.</h3>
                                    <p className="text-xs font-semibold text-blue-200 mt-1">
                                        Sonuç bulamıyorsanız tarih aralığını genişletmeyi veya filtreleri temizlemeyi deneyebilirsiniz.
                                    </p>
                                </div>
                                <div className="pt-2">
                                    <button
                                        onClick={clearAllFilters}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-[#00008B] font-black text-xs shadow-lg hover:bg-blue-50 transition-all"
                                    >
                                        <RotateCcw className="w-4 h-4" /> Filtreleri Temizle
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
