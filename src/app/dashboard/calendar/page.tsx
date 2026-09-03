"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Bell,
    TrendingUp,
    Building2,
    Coins,
    Sparkles,
    Globe2,
    Briefcase,
    Loader2,
    Clock,
    Search,
    Filter,
    X,
    ArrowUpDown,
    Check
} from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";

function CalendarContent() {
    const { myAssets = [] } = useUser();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [viewDate, setViewDate] = useState<Date>(new Date());
    const [activeFilter, setActiveFilter] = useState<'all' | 'earnings' | 'dividends' | 'ipo' | 'economic'>('all');

    // Data States
    const [earnings, setEarnings] = useState<any[]>([]);
    const [dividends, setDividends] = useState<any[]>([]);
    const [ipos, setIpos] = useState<any[]>([]);
    const [economicEvents, setEconomicEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Temettü Özel Filtre & Arama State'leri
    const [divSearch, setDivSearch] = useState<string>('');
    const [divDateFilter, setDivDateFilter] = useState<'all' | 'today' | 'this-week' | 'this-month' | 'next-3-months'>('all');
    const [divStatusFilter, setDivStatusFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
    const [divYieldFilter, setDivYieldFilter] = useState<'all' | '0-2' | '2-5' | '5plus'>('all');
    const [divAmountFilter, setDivAmountFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
    const [divPortfolioOnly, setDivPortfolioOnly] = useState<boolean>(false);
    const [divSort, setDivSort] = useState<'date-asc' | 'date-desc' | 'yield-desc' | 'yield-asc' | 'amount-desc' | 'name-asc' | 'name-desc'>('date-asc');

    // Sync URL search params -> state (sayfa yüklenme ve URL değişiminde)
    useEffect(() => {
        const typeParam = searchParams ? (searchParams.get('type') || searchParams.get('focus')) : null;
        if (typeParam) {
            const p = typeParam.toLowerCase();
            if (p === 'dividend' || p === 'dividends' || p === 'temettu') {
                setActiveFilter('dividends');
            } else if (p === 'earnings' || p === 'bilanco') {
                setActiveFilter('earnings');
            } else if (p === 'ipo' || p === 'halka-arz') {
                setActiveFilter('ipo');
            } else if (p === 'economic' || p === 'ekonomik') {
                setActiveFilter('economic');
            } else if (p === 'all') {
                setActiveFilter('all');
            }
        }

        // Temettü parametrelerini oku
        if (searchParams && (typeParam === 'dividend' || typeParam === 'dividends' || typeParam === 'temettu')) {
            const s = searchParams.get('search') || '';
            const d = searchParams.get('date') || 'all';
            const st = searchParams.get('status') || 'all';
            const y = searchParams.get('yield') || 'all';
            const a = searchParams.get('amount') || 'all';
            const p = searchParams.get('portfolio') === 'true';
            const so = searchParams.get('sort') || 'date-asc';

            setDivSearch(s);
            setDivDateFilter(d as any);
            setDivStatusFilter(st as any);
            setDivYieldFilter(y as any);
            setDivAmountFilter(a as any);
            setDivPortfolioOnly(p);
            setDivSort(so as any);
        }
    }, [searchParams]);

    // Temettü URL Parametrelerini Güncelleme Yardımcısı
    const updateDividendUrlParams = (newParams: Partial<{
        search: string;
        date: string;
        status: string;
        yield: string;
        amount: string;
        portfolio: boolean;
        sort: string;
    }>) => {
        const params = new URLSearchParams(window.location.search);
        params.set('type', 'dividend');

        const s = newParams.search !== undefined ? newParams.search : divSearch;
        const d = newParams.date !== undefined ? newParams.date : divDateFilter;
        const st = newParams.status !== undefined ? newParams.status : divStatusFilter;
        const y = newParams.yield !== undefined ? newParams.yield : divYieldFilter;
        const a = newParams.amount !== undefined ? newParams.amount : divAmountFilter;
        const p = newParams.portfolio !== undefined ? newParams.portfolio : divPortfolioOnly;
        const so = newParams.sort !== undefined ? newParams.sort : divSort;

        if (s) params.set('search', s); else params.delete('search');
        if (d && d !== 'all') params.set('date', d); else params.delete('date');
        if (st && st !== 'all') params.set('status', st); else params.delete('status');
        if (y && y !== 'all') params.set('yield', y); else params.delete('yield');
        if (a && a !== 'all') params.set('amount', a); else params.delete('amount');
        if (p) params.set('portfolio', 'true'); else params.delete('portfolio');
        if (so && so !== 'date-asc') params.set('sort', so); else params.delete('sort');

        router.replace(`/dashboard/calendar?${params.toString()}`, { scroll: false });
    };

    // Filtre Seçimlerini İşleme ve URL Senkronizasyonu
    const handleFilterSelect = (filterId: 'all' | 'earnings' | 'dividends' | 'ipo' | 'economic') => {
        setActiveFilter(filterId);
        const typeMap: Record<string, string> = {
            dividends: 'dividend',
            earnings: 'earnings',
            ipo: 'ipo',
            economic: 'economic',
            all: 'all'
        };
        const targetType = typeMap[filterId];
        if (targetType === 'all') {
            router.replace('/dashboard/calendar', { scroll: false });
        } else {
            router.replace(`/dashboard/calendar?type=${targetType}`, { scroll: false });
        }
    };

    // Veri Çekimi
    useEffect(() => {
        let isMounted = true;

        async function loadData() {
            setLoading(true);
            try {
                const [earningsRes, divRes, ipoRes, ecoRes] = await Promise.all([
                    fetch('/api/halkarz-earnings').then(r => r.json()).catch(() => ({ data: [] })),
                    fetch('/api/halkarz-dividends').then(r => r.json()).catch(() => ({ data: [] })),
                    fetch('/api/halkarz-ipo').then(r => r.json()).catch(() => ({ data: [] })),
                    fetch('/api/calendar').then(r => r.json()).catch(() => ({ data: [] }))
                ]);

                if (isMounted) {
                    setEarnings(earningsRes.data || []);
                    setDividends(divRes.data || []);
                    setIpos(ipoRes.data || []);
                    setEconomicEvents(ecoRes.data || []);
                }
            } catch (e) {
                console.error("Calendar data fetch error:", e);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadData();
        return () => { isMounted = false; };
    }, []);

    // Ay Navigasyon Kontrolleri
    const handlePrevMonth = () => {
        const d = new Date(viewDate);
        d.setMonth(d.getMonth() - 1);
        setViewDate(d);
    };

    const handleNextMonth = () => {
        const d = new Date(viewDate);
        d.setMonth(d.getMonth() + 1);
        setViewDate(d);
    };

    const handleToday = () => {
        const today = new Date();
        setSelectedDate(today);
        setViewDate(today);
    };

    // Portföy Sembol Seti
    const portfolioSymbols = useMemo(() => {
        return new Set((myAssets || []).map((a: any) => (a.symbol || '').toUpperCase().replace(/\.IS$/, '')));
    }, [myAssets]);

    // Portföye Özel Olaylar
    const portfolioEvents = useMemo(() => {
        if (portfolioSymbols.size === 0) return [];
        const list: any[] = [];

        earnings.forEach(e => {
            const sym = (e.symbol || '').toUpperCase().replace(/\.IS$/, '');
            if (portfolioSymbols.has(sym)) {
                list.push({ ...e, eventType: 'earnings', typeLabel: 'Bilanço', date: e.earningsDate });
            }
        });

        dividends.forEach(d => {
            const sym = (d.symbol || '').toUpperCase().replace(/\.IS$/, '');
            if (portfolioSymbols.has(sym)) {
                list.push({ ...d, eventType: 'dividends', typeLabel: 'Temettü', date: d.paymentDate });
            }
        });

        return list;
    }, [portfolioSymbols, earnings, dividends]);

    // Tarih Ayrıştırma Yardımcıları
    const getItemTimestamp = (item: any): number => {
        if (item.timestamp) return item.timestamp;
        if (item.paymentDate) {
            const parts = item.paymentDate.split('.');
            if (parts.length === 3) {
                return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
            }
            return new Date(item.paymentDate).getTime() || 0;
        }
        return 0;
    };

    const getItemYield = (item: any): number => {
        if (item.yieldPercent !== undefined && item.yieldPercent !== null) return Number(item.yieldPercent);
        if (item.yield !== undefined && item.yield !== null) return Number(item.yield);
        return 0;
    };

    const getItemAmount = (item: any): number => {
        if (item.netAmountPerShare !== undefined && item.netAmountPerShare !== null) return Number(item.netAmountPerShare);
        if (item.netAmount !== undefined && item.netAmount !== null) return Number(item.netAmount);
        if (item.netAmountFormatted) {
            const parsed = parseFloat(item.netAmountFormatted.replace('TL', '').replace(',', '.').trim());
            if (!isNaN(parsed)) return parsed;
        }
        return 0;
    };

    // TEMETTÜ GELİŞMİŞ FİLTRELEME & SIRALAMA MANTIĞI
    const filteredDividends = useMemo(() => {
        let list = [...dividends];

        // 1. Manuel Arama (Hisse Kodu veya Şirket Adı)
        if (divSearch.trim()) {
            const q = divSearch.trim().toLowerCase();
            list = list.filter(item =>
                (item.symbol || '').toLowerCase().includes(q) ||
                (item.companyName || '').toLowerCase().includes(q)
            );
        }

        // 2. Tarih Filtresi
        const now = new Date();
        if (divDateFilter !== 'all') {
            list = list.filter(item => {
                const ts = getItemTimestamp(item);
                if (!ts) return false;
                const itemDate = new Date(ts);
                if (divDateFilter === 'today') {
                    return itemDate.toDateString() === now.toDateString();
                }
                if (divDateFilter === 'this-week') {
                    const diffTime = itemDate.getTime() - now.getTime();
                    const diffDays = diffTime / (1000 * 3600 * 24);
                    return diffDays >= -1 && diffDays <= 7;
                }
                if (divDateFilter === 'this-month') {
                    return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
                }
                if (divDateFilter === 'next-3-months') {
                    const diffTime = itemDate.getTime() - now.getTime();
                    const diffDays = diffTime / (1000 * 3600 * 24);
                    return diffDays >= 0 && diffDays <= 90;
                }
                return true;
            });
        }

        // 3. Durum Filtresi (Yaklaşan / Gerçekleşen)
        if (divStatusFilter !== 'all') {
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            list = list.filter(item => {
                const ts = getItemTimestamp(item);
                if (!ts) return true;
                if (divStatusFilter === 'upcoming') {
                    return ts >= todayStart;
                } else if (divStatusFilter === 'completed') {
                    return ts < todayStart;
                }
                return true;
            });
        }

        // 4. Temettü Verimi Filtresi
        if (divYieldFilter !== 'all') {
            list = list.filter(item => {
                const y = getItemYield(item);
                if (divYieldFilter === '0-2') return y > 0 && y <= 2;
                if (divYieldFilter === '2-5') return y > 2 && y <= 5;
                if (divYieldFilter === '5plus') return y > 5;
                return true;
            });
        }

        // 5. Net Temettü Tutarı Filtresi
        if (divAmountFilter !== 'all') {
            list = list.filter(item => {
                const amt = getItemAmount(item);
                if (divAmountFilter === 'low') return amt > 0 && amt < 2;
                if (divAmountFilter === 'medium') return amt >= 2 && amt <= 10;
                if (divAmountFilter === 'high') return amt > 10;
                return true;
            });
        }

        // 6. Portföyümdekiler Filtresi
        if (divPortfolioOnly) {
            list = list.filter(item => {
                const sym = (item.symbol || '').toUpperCase().replace(/\.IS$/, '');
                return portfolioSymbols.has(sym);
            });
        }

        // 8. Sıralama Mantığı
        list.sort((a, b) => {
            const tsA = getItemTimestamp(a);
            const tsB = getItemTimestamp(b);
            const yA = getItemYield(a);
            const yB = getItemYield(b);
            const amtA = getItemAmount(a);
            const amtB = getItemAmount(b);

            if (divSort === 'date-asc') return tsA - tsB;
            if (divSort === 'date-desc') return tsB - tsA;
            if (divSort === 'yield-desc') return yB - yA;
            if (divSort === 'yield-asc') return yA - yB;
            if (divSort === 'amount-desc') return amtB - amtA;
            if (divSort === 'name-asc') return (a.companyName || '').localeCompare(b.companyName || '');
            if (divSort === 'name-desc') return (b.companyName || '').localeCompare(a.companyName || '');
            return 0;
        });

        return list;
    }, [dividends, divSearch, divDateFilter, divStatusFilter, divYieldFilter, divAmountFilter, divPortfolioOnly, divSort, portfolioSymbols]);

    // Aktif Filtre Chips Listesi
    const activeChips = useMemo(() => {
        const chips: { id: string; label: string; clear: () => void }[] = [];

        if (divSearch.trim()) {
            chips.push({ id: 'search', label: `Arama: "${divSearch}"`, clear: () => { setDivSearch(''); updateDividendUrlParams({ search: '' }); } });
        }
        if (divDateFilter !== 'all') {
            const labels: Record<string, string> = {
                today: 'Bugün',
                'this-week': 'Bu Hafta',
                'this-month': 'Bu Ay',
                'next-3-months': 'Önümüzdeki 3 Ay'
            };
            chips.push({ id: 'date', label: `Tarih: ${labels[divDateFilter]}`, clear: () => { setDivDateFilter('all'); updateDividendUrlParams({ date: 'all' }); } });
        }
        if (divStatusFilter !== 'all') {
            chips.push({ id: 'status', label: `Durum: ${divStatusFilter === 'upcoming' ? 'Yaklaşan' : 'Gerçekleşen'}`, clear: () => { setDivStatusFilter('all'); updateDividendUrlParams({ status: 'all' }); } });
        }
        if (divYieldFilter !== 'all') {
            const labels: Record<string, string> = { '0-2': '%0–2', '2-5': '%2–5', '5plus': '%5+' };
            chips.push({ id: 'yield', label: `Verim: ${labels[divYieldFilter]}`, clear: () => { setDivYieldFilter('all'); updateDividendUrlParams({ yield: 'all' }); } });
        }
        if (divAmountFilter !== 'all') {
            const labels: Record<string, string> = { low: 'Düşük (<2 TL)', medium: 'Orta (2–10 TL)', high: 'Yüksek (>10 TL)' };
            chips.push({ id: 'amount', label: `Tutar: ${labels[divAmountFilter]}`, clear: () => { setDivAmountFilter('all'); updateDividendUrlParams({ amount: 'all' }); } });
        }
        if (divPortfolioOnly) {
            chips.push({ id: 'portfolio', label: 'Portföyümdekiler', clear: () => { setDivPortfolioOnly(false); updateDividendUrlParams({ portfolio: false }); } });
        }

        return chips;
    }, [divSearch, divDateFilter, divStatusFilter, divYieldFilter, divAmountFilter, divPortfolioOnly]);

    // Tüm Temettü Filtrelerini Temizle
    const clearAllDividendFilters = () => {
        setDivSearch('');
        setDivDateFilter('all');
        setDivStatusFilter('all');
        setDivYieldFilter('all');
        setDivAmountFilter('all');
        setDivPortfolioOnly(false);
        setDivSort('date-asc');
        router.replace('/dashboard/calendar?type=dividend', { scroll: false });
    };

    // Sol Mini Takvim Grid Hesaplaması
    const monthCalendarGrid = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        let firstDayIndex = firstDayOfMonth.getDay() - 1;
        if (firstDayIndex === -1) firstDayIndex = 6;

        const daysInMonth = lastDayOfMonth.getDate();
        const grid: { date: Date; isCurrentMonth: boolean; dayNum: number }[] = [];

        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            grid.push({
                date: new Date(year, month - 1, prevMonthLastDay - i),
                isCurrentMonth: false,
                dayNum: prevMonthLastDay - i
            });
        }

        for (let d = 1; d <= daysInMonth; d++) {
            grid.push({
                date: new Date(year, month, d),
                isCurrentMonth: true,
                dayNum: d
            });
        }

        const remaining = 35 - grid.length > 0 ? 35 - grid.length : 42 - grid.length;
        for (let i = 1; i <= remaining; i++) {
            grid.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false,
                dayNum: i
            });
        }

        return grid;
    }, [viewDate]);

    // Seçili Günün Ajandası
    const selectedDayAgenda = useMemo(() => {
        const targetStr = selectedDate.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const targetParts = targetStr.split('.');
        const agendaList: any[] = [];

        if (activeFilter === 'all' || activeFilter === 'earnings') {
            earnings.forEach(e => {
                if (e.earningsDate === targetStr || e.earningsDate?.includes(targetParts[0])) {
                    agendaList.push({
                        time: '09:00',
                        category: 'Bilanço',
                        categoryColor: 'bg-blue-50 text-blue-700 border-blue-200',
                        symbol: e.symbol,
                        title: e.companyName,
                        subtitle: `${e.earningsDate || '2026/1Ç'} Finansal Sonuçları`
                    });
                }
            });
        }

        if (activeFilter === 'all' || activeFilter === 'dividends') {
            dividends.forEach(d => {
                if (d.paymentDate === targetStr || d.paymentDate?.includes(targetParts[0])) {
                    agendaList.push({
                        time: '10:00',
                        category: 'Temettü',
                        categoryColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        symbol: d.symbol,
                        title: d.companyName,
                        subtitle: `${d.netAmountFormatted || 'Temettü'} Ödeme Tarihi`
                    });
                }
            });
        }

        if (activeFilter === 'all' || activeFilter === 'ipo') {
            ipos.forEach(ipo => {
                agendaList.push({
                    time: '11:00',
                    category: 'Halka Arz',
                    categoryColor: 'bg-purple-50 text-purple-700 border-purple-200',
                    symbol: ipo.symbol,
                    title: ipo.companyName,
                    subtitle: ipo.status || 'Talep Toplama'
                });
            });
        }

        if (activeFilter === 'all' || activeFilter === 'economic') {
            economicEvents.forEach(ev => {
                if (ev.isToday || ev.dateFormatted?.includes(targetParts[0])) {
                    agendaList.push({
                        time: ev.time || '15:30',
                        category: 'Ekonomik',
                        categoryColor: 'bg-amber-50 text-amber-700 border-amber-200',
                        symbol: ev.country || 'USD',
                        title: ev.event,
                        subtitle: `Önceki: ${ev.previous} | Beklenti: ${ev.forecast}`
                    });
                }
            });
        }

        return agendaList.slice(0, 10);
    }, [selectedDate, activeFilter, earnings, dividends, ipos, economicEvents]);

    const formattedViewMonthYear = viewDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    const formattedSelectedDayHeader = selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });

    return (
        <div className="w-full min-h-screen bg-slate-50/50 p-3 sm:p-6 lg:p-8 space-y-6">
            
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-[#00008B]/5 border border-[#00008B]/10 flex items-center justify-center text-[#00008B]">
                            <CalendarIcon className="w-5 h-5" />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black text-[#00008B] tracking-tight">Takvim</h1>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-400 mt-1">
                        Piyasalardaki önemli tarihleri takip edin ve yatırım planlarınızı öne geçirin.
                    </p>
                </div>

                {/* Date Controls */}
                <div className="flex items-center gap-2 self-start md:self-auto">
                    <button
                        onClick={handleToday}
                        className="px-3.5 py-2 text-xs font-black text-[#00008B] bg-[#00008B]/5 hover:bg-[#00008B]/10 border border-[#00008B]/10 rounded-xl transition-all shadow-xs"
                    >
                        Bugün
                    </button>
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                        <button
                            onClick={handlePrevMonth}
                            className="p-1.5 text-slate-600 hover:text-[#00008B] hover:bg-white rounded-lg transition-all"
                            aria-label="Önceki Ay"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-3 text-xs font-black text-[#00008B] min-w-[110px] text-center capitalize">
                            {formattedViewMonthYear}
                        </span>
                        <button
                            onClick={handleNextMonth}
                            className="p-1.5 text-slate-600 hover:text-[#00008B] hover:bg-white rounded-lg transition-all"
                            aria-label="Sonraki Ay"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Üst Kategori Filtre Butonları */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                {[
                    { id: 'all', label: 'Tümü', icon: Sparkles, activeStyle: 'bg-[#00008B] text-white border-[#00008B] shadow-md shadow-[#00008B]/20', inactiveStyle: 'bg-white text-slate-600 border-slate-200/80 hover:border-[#00008B]/30 hover:text-[#00008B]' },
                    { id: 'earnings', label: 'Bilanço', icon: Building2, activeStyle: 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20', inactiveStyle: 'bg-blue-50/60 text-blue-700 border-blue-200/60 hover:bg-blue-100/60' },
                    { id: 'dividends', label: 'Temettü', icon: Coins, activeStyle: 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20', inactiveStyle: 'bg-emerald-50/60 text-emerald-700 border-emerald-200/60 hover:bg-emerald-100/60' },
                    { id: 'ipo', label: 'Halka Arz', icon: TrendingUp, activeStyle: 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20', inactiveStyle: 'bg-purple-50/60 text-purple-700 border-purple-200/60 hover:bg-purple-100/60' },
                    { id: 'economic', label: 'Ekonomik', icon: Globe2, activeStyle: 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20', inactiveStyle: 'bg-amber-50/60 text-amber-700 border-amber-200/60 hover:bg-amber-100/60' }
                ].map(tab => {
                    const TabIcon = tab.icon;
                    const isActive = activeFilter === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleFilterSelect(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-2xl border transition-all whitespace-nowrap shadow-xs ${
                                isActive ? tab.activeStyle : tab.inactiveStyle
                            }`}
                        >
                            <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : ''}`} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* TEMETTÜ MODU AKTİFSE: ÖZEL ARAMA VE GELİŞMİŞ FİLTRELEME BÖLÜMÜ */}
            {activeFilter === 'dividends' && (
                <div className="bg-gradient-to-b from-emerald-50/60 via-white to-white border border-emerald-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                    
                    {/* Üst Başlık & Arama Çubuğu */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-emerald-100/60">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                                <Coins className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="text-base font-black text-[#00008B]">Temettü Takvimi ve Filtreleme</h2>
                                <p className="text-[11px] font-bold text-slate-400">Şirket adına, verime, tutara ve tarihe göre temettü araması yapın</p>
                            </div>
                        </div>

                        {/* Manuel Arama Çubuğu */}
                        <div className="relative w-full md:w-80">
                            <Search className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={divSearch}
                                onChange={(e) => {
                                    setDivSearch(e.target.value);
                                    updateDividendUrlParams({ search: e.target.value });
                                }}
                                placeholder="Hisse Kodu veya Şirket Ara (örn: THYAO)..."
                                className="w-full pl-9 pr-8 py-2 text-xs font-bold text-slate-800 bg-white border border-emerald-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-xs"
                            />
                            {divSearch && (
                                <button
                                    onClick={() => {
                                        setDivSearch('');
                                        updateDividendUrlParams({ search: '' });
                                    }}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filtre Açılır Menüleri Izgarası */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs font-bold">
                        
                        {/* 1. Tarih Filtresi */}
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Tarih</label>
                            <select
                                value={divDateFilter}
                                onChange={(e) => {
                                    const val = e.target.value as any;
                                    setDivDateFilter(val);
                                    updateDividendUrlParams({ date: val });
                                }}
                                className="w-full p-2 bg-white border border-emerald-200/80 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            >
                                <option value="all">Tüm Tarihler</option>
                                <option value="today">Bugün</option>
                                <option value="this-week">Bu Hafta</option>
                                <option value="this-month">Bu Ay</option>
                                <option value="next-3-months">Önümüzdeki 3 Ay</option>
                            </select>
                        </div>

                        {/* 2. Durum Filtresi */}
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Durum</label>
                            <select
                                value={divStatusFilter}
                                onChange={(e) => {
                                    const val = e.target.value as any;
                                    setDivStatusFilter(val);
                                    updateDividendUrlParams({ status: val });
                                }}
                                className="w-full p-2 bg-white border border-emerald-200/80 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            >
                                <option value="all">Tüm Durumlar</option>
                                <option value="upcoming">Yaklaşan</option>
                                <option value="completed">Gerçekleşen</option>
                            </select>
                        </div>

                        {/* 3. Verim Filtresi */}
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Temettü Verimi</label>
                            <select
                                value={divYieldFilter}
                                onChange={(e) => {
                                    const val = e.target.value as any;
                                    setDivYieldFilter(val);
                                    updateDividendUrlParams({ yield: val });
                                }}
                                className="w-full p-2 bg-white border border-emerald-200/80 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            >
                                <option value="all">Tüm Verimler</option>
                                <option value="0-2">%0 – %2</option>
                                <option value="2-5">%2 – %5</option>
                                <option value="5plus">%5 ve Üzeri</option>
                            </select>
                        </div>

                        {/* 4. Net Tutar Filtresi */}
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Net Tutar</label>
                            <select
                                value={divAmountFilter}
                                onChange={(e) => {
                                    const val = e.target.value as any;
                                    setDivAmountFilter(val);
                                    updateDividendUrlParams({ amount: val });
                                }}
                                className="w-full p-2 bg-white border border-emerald-200/80 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            >
                                <option value="all">Tüm Tutarlar</option>
                                <option value="low">Düşük (&lt; 2 TL)</option>
                                <option value="medium">Orta (2 – 10 TL)</option>
                                <option value="high">Yüksek (&gt; 10 TL)</option>
                            </select>
                        </div>

                        {/* 5. Portföyımdekiler Butonu */}
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Portföy</label>
                            <button
                                onClick={() => {
                                    const newVal = !divPortfolioOnly;
                                    setDivPortfolioOnly(newVal);
                                    updateDividendUrlParams({ portfolio: newVal });
                                }}
                                className={`w-full p-2 rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                                    divPortfolioOnly
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                        : 'bg-white text-slate-700 border-emerald-200/80 hover:bg-emerald-50/50'
                                }`}
                            >
                                <Briefcase className="w-3.5 h-3.5" />
                                <span>Portföyümdekiler</span>
                            </button>
                        </div>

                        {/* 6. Sıralama Seçeneği */}
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Sıralama</label>
                            <select
                                value={divSort}
                                onChange={(e) => {
                                    const val = e.target.value as any;
                                    setDivSort(val);
                                    updateDividendUrlParams({ sort: val });
                                }}
                                className="w-full p-2 bg-white border border-emerald-200/80 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            >
                                <option value="date-asc">En Yakın Tarih</option>
                                <option value="date-desc">En Uzak Tarih</option>
                                <option value="yield-desc">En Yüksek Verim</option>
                                <option value="yield-asc">En Düşük Verim</option>
                                <option value="amount-desc">En Yüksek Net Tutar</option>
                                <option value="name-asc">Şirket (A-Z)</option>
                                <option value="name-desc">Şirket (Z-A)</option>
                            </select>
                        </div>
                    </div>

                    {/* Aktif Filtre Chip'leri Çubuğu */}
                    {activeChips.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-emerald-100/60">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase">Aktif Filtreler:</span>
                            {activeChips.map(chip => (
                                <span
                                    key={chip.id}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-100/80 text-emerald-900 border border-emerald-200 shadow-2xs"
                                >
                                    <span>{chip.label}</span>
                                    <button
                                        onClick={chip.clear}
                                        className="hover:bg-emerald-200/80 rounded-full p-0.5 transition-colors"
                                        title="Filtreyi Kaldır"
                                    >
                                        <X className="w-3 h-3 text-emerald-800" />
                                    </button>
                                </span>
                            ))}
                            <button
                                onClick={clearAllDividendFilters}
                                className="text-xs font-extrabold text-rose-600 hover:text-rose-700 underline ml-2"
                            >
                                Filtreleri Temizle
                            </button>
                        </div>
                    )}

                    {/* Temettü Sonuç Sayısı ve Liste Görünümü */}
                    <div className="pt-2">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-black text-[#00008B]">
                                Toplam {filteredDividends.length} Temettü Kaydı
                            </span>
                        </div>

                        {loading ? (
                            <div className="py-12 text-center text-xs font-bold text-slate-400">Temettü verileri yükleniyor...</div>
                        ) : filteredDividends.length === 0 ? (
                            <div className="py-12 bg-white rounded-2xl border border-dashed border-emerald-200 flex flex-col items-center justify-center gap-2 text-center">
                                <Clock className="w-8 h-8 text-emerald-300" />
                                <p className="text-sm font-black text-slate-700">Sonuç bulunamadı</p>
                                <p className="text-xs text-slate-400 max-w-sm">
                                    Seçtiğiniz filtre kriterlerine uygun temettü kaydı bulunamadı. Lütfen arama teriminizi veya filtrelerinizi değiştirin.
                                </p>
                                <button
                                    onClick={clearAllDividendFilters}
                                    className="mt-2 px-4 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs"
                                >
                                    Filtreleri Temizle
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredDividends.map((item, idx) => {
                                    const y = getItemYield(item);
                                    const amt = getItemAmount(item);
                                    const ts = getItemTimestamp(item);
                                    const isUpcoming = ts >= new Date().setHours(0,0,0,0);

                                    return (
                                        <div key={idx} className="p-4 rounded-2xl bg-white border border-emerald-100 hover:border-emerald-300 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-100/70 border border-emerald-200 text-emerald-800 flex items-center justify-center font-black text-xs">
                                                        {item.symbol?.substring(0, 3)}
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-black text-[#00008B] block">{item.symbol}</span>
                                                        <span className="text-[11px] font-bold text-slate-500 line-clamp-1">{item.companyName}</span>
                                                    </div>
                                                </div>
                                                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border ${
                                                    isUpcoming ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                                                }`}>
                                                    {isUpcoming ? 'Yaklaşan' : 'Gerçekleşen'}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 block">Ödeme Tarihi</span>
                                                    <span className="font-black text-slate-800">{item.paymentDate || 'Belirtilmedi'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 block">Net Temettü</span>
                                                    <span className="font-black text-emerald-700">{item.netAmountFormatted || (amt > 0 ? `${amt.toFixed(2)} TL` : 'Belirtilmedi')}</span>
                                                </div>
                                                {y > 0 && (
                                                    <div>
                                                        <span className="text-[10px] font-bold text-slate-400 block">Temettü Verimi</span>
                                                        <span className="font-black text-emerald-800">%{y.toFixed(2)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
            )}

            {/* ANA TAKVİM ALANI: Sol Mini Takvim & Sağ Günün Ajandası */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Sol: Mini Takvim */}
                <div className="lg:col-span-5 bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                            <h3 className="text-sm font-black text-[#00008B] capitalize">{formattedViewMonthYear}</h3>
                            <span className="text-[10px] font-bold text-slate-400">Aylık Görünüm</span>
                        </div>

                        {/* Days of Week */}
                        <div className="grid grid-cols-7 text-center mb-2">
                            {['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT', 'PZR'].map((day, idx) => (
                                <span key={idx} className="text-[10px] font-black text-slate-400 py-1">
                                    {day}
                                </span>
                            ))}
                        </div>

                        {/* Calendar Days Grid */}
                        <div className="grid grid-cols-7 gap-1 text-center">
                            {monthCalendarGrid.map((cell, idx) => {
                                const isSelected = selectedDate.getDate() === cell.dayNum &&
                                                   selectedDate.getMonth() === cell.date.getMonth() &&
                                                   selectedDate.getFullYear() === cell.date.getFullYear();
                                const isTodayCell = new Date().getDate() === cell.dayNum &&
                                                    new Date().getMonth() === cell.date.getMonth() &&
                                                    new Date().getFullYear() === cell.date.getFullYear();

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedDate(cell.date)}
                                        className={`h-9 w-full rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center relative ${
                                            isSelected
                                                ? 'bg-[#00008B] text-white shadow-md shadow-[#00008B]/30 scale-105 z-10'
                                                : isTodayCell
                                                ? 'bg-blue-50 text-[#00008B] border border-blue-200'
                                                : cell.isCurrentMonth
                                                ? 'text-slate-700 hover:bg-slate-100'
                                                : 'text-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        <span>{cell.dayNum}</span>
                                        {(cell.dayNum % 3 === 0 && cell.isCurrentMonth) && (
                                            <span className={`w-1 h-1 rounded-full absolute bottom-1 ${isSelected ? 'bg-white' : 'bg-[#00008B]'}`} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Sağ: Seçili Günün Ajandası */}
                <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="text-sm font-black text-[#00008B] capitalize">{formattedSelectedDayHeader}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Günün Ajandası</p>
                            </div>
                            <span className="text-xs font-black text-[#00008B] bg-[#00008B]/5 px-2.5 py-1 rounded-xl border border-[#00008B]/10">
                                {selectedDayAgenda.length} Etkinlik
                            </span>
                        </div>

                        {/* Agenda List */}
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-2">
                                <Loader2 className="w-6 h-6 text-[#00008B] animate-spin" />
                                <span className="text-xs font-bold text-slate-400">Ajanda verileri yükleniyor...</span>
                            </div>
                        ) : selectedDayAgenda.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                                <Clock className="w-8 h-8 text-slate-300" />
                                <p className="text-xs font-bold text-slate-600">Bu tarih için kayıtlı etkinlik bulunmuyor.</p>
                                <p className="text-[10px] text-slate-400">Diğer günleri veya filtreleri seçerek ajandanızı inceleyebilirsiniz.</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                                {selectedDayAgenda.map((item, idx) => {
                                    const rowBg = item.category === 'Bilanço'
                                        ? 'bg-blue-50/40 border-blue-100/80 hover:bg-blue-50/70'
                                        : item.category === 'Temettü'
                                        ? 'bg-emerald-50/40 border-emerald-100/80 hover:bg-emerald-50/70'
                                        : item.category === 'Halka Arz'
                                        ? 'bg-purple-50/40 border-purple-100/80 hover:bg-purple-50/70'
                                        : 'bg-amber-50/40 border-amber-100/80 hover:bg-amber-50/70';

                                    return (
                                        <div key={idx} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${rowBg}`}>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="text-xs font-black text-slate-600 w-10 shrink-0">{item.time}</span>
                                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border shrink-0 ${item.categoryColor}`}>
                                                    {item.category}
                                                </span>
                                                <span className="text-xs font-black text-[#00008B] shrink-0">{item.symbol}</span>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                                                    <p className="text-[10px] text-slate-500 truncate">{item.subtitle}</p>
                                                </div>
                                            </div>
                                            <button title="Hatırlatıcı Ekle" className="p-1.5 text-slate-400 hover:text-[#00008B] hover:bg-white rounded-lg transition-all shrink-0">
                                                <Bell className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* PORTFÖY İLE ENTEGRASYON: Portföyümdeki Şirketlerin Yaklaşan Olayları */}
            {myAssets.length > 0 && (
                <div className="bg-gradient-to-r from-[#00008B]/[0.03] via-white to-blue-50/30 border border-[#00008B]/10 rounded-3xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
                                <Briefcase className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-[#00008B]">Portföyümdeki Şirketlerin Yaklaşan Olayları</h3>
                                <p className="text-[10px] font-bold text-slate-400">Sadece sizin sahip olduğunuz hisse senetleri için filtrelenmiş ajanda</p>
                            </div>
                        </div>
                    </div>

                    {portfolioEvents.length === 0 ? (
                        <p className="text-xs font-bold text-slate-400 py-4 text-center">
                            Portföyünüzdeki şirketler için yakın tarihte açıklanmış bilanço veya temettü tarihi bulunmuyor.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {portfolioEvents.slice(0, 6).map((item, idx) => (
                                <div key={idx} className="p-3.5 rounded-2xl bg-white/80 border border-slate-100 flex items-center justify-between shadow-2xs">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-[#00008B]/10 border border-[#00008B]/20 flex items-center justify-center text-[#00008B] font-black text-xs">
                                            {item.symbol?.substring(0, 3)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-[#00008B]">{item.symbol}</p>
                                            <p className="text-[10px] font-bold text-slate-500">{item.companyName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border ${
                                            item.eventType === 'earnings' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        }`}>
                                            {item.typeLabel}
                                        </span>
                                        <p className="text-[10px] font-black text-slate-600 mt-1">{item.date || 'Yakında'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ÜÇLÜ KART IZGARASI: Bilanço, Temettü, Halka Arz */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. BİLANÇO TAKVİMİ (SOFT BLUE TINT) */}
                <div className="bg-gradient-to-b from-blue-50/50 via-white to-white border border-blue-100/80 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-blue-100/60">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-xl bg-blue-100/70 border border-blue-200/80 flex items-center justify-center text-blue-700">
                                    <Building2 className="w-4 h-4" />
                                </div>
                                <h3 className="text-sm font-black text-[#00008B]">Bilanço Takvimi</h3>
                            </div>
                            <Link href="/dashboard/calendar?type=earnings" onClick={(e) => { e.preventDefault(); handleFilterSelect('earnings'); }} className="text-[10px] font-extrabold text-blue-600 hover:underline">
                                Tümünü Gör
                            </Link>
                        </div>

                        {loading ? (
                            <div className="py-8 text-center text-xs font-bold text-slate-400">Yükleniyor...</div>
                        ) : earnings.length === 0 ? (
                            <div className="py-8 text-center text-xs font-bold text-slate-400">Yaklaşan bilanço verisi bulunmuyor.</div>
                        ) : (
                            <div className="space-y-3">
                                {earnings.slice(0, 4).map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-2xl bg-blue-50/50 border border-blue-100/70 hover:bg-blue-100/50 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-100/80 text-blue-800 px-2 py-1 rounded-xl text-center min-w-[44px]">
                                                <span className="text-[9px] font-black uppercase block leading-tight">{item.earningsDate?.split('.')[1] || 'MAY'}</span>
                                                <span className="text-xs font-black block leading-tight">{item.earningsDate?.split('.')[0] || '20'}</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-[#00008B]">{item.symbol}</p>
                                                <p className="text-[10px] font-bold text-slate-600 truncate max-w-[130px]">{item.companyName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold text-blue-700 bg-white/80 px-2 py-0.5 rounded-lg border border-blue-200/80">2026/1Ç</span>
                                            <button title="Hatırlat" className="p-1 text-blue-400 hover:text-[#00008B]">
                                                <Bell className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Link href="/dashboard/calendar?type=earnings" onClick={(e) => { e.preventDefault(); handleFilterSelect('earnings'); }} className="mt-4 pt-3 border-t border-blue-100/60 flex items-center justify-center text-xs font-black text-[#00008B] hover:text-blue-600 transition-colors">
                        Tüm Bilanço Takvimi →
                    </Link>
                </div>

                {/* 2. TEMETTÜ TAKVİMİ (SOFT EMERALD GREEN TINT) */}
                <div className="bg-gradient-to-b from-emerald-50/50 via-white to-white border border-emerald-100/80 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-emerald-100/60">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-xl bg-emerald-100/70 border border-emerald-200/80 flex items-center justify-center text-emerald-700">
                                    <Coins className="w-4 h-4" />
                                </div>
                                <h3 className="text-sm font-black text-[#00008B]">Temettü Takvimi</h3>
                            </div>
                            <Link href="/dashboard/calendar?type=dividend" onClick={(e) => { e.preventDefault(); handleFilterSelect('dividends'); }} className="text-[10px] font-extrabold text-emerald-600 hover:underline">
                                Tümünü Gör
                            </Link>
                        </div>

                        {loading ? (
                            <div className="py-8 text-center text-xs font-bold text-slate-400">Yükleniyor...</div>
                        ) : dividends.length === 0 ? (
                            <div className="py-8 text-center text-xs font-bold text-slate-400">Yaklaşan temettü ödemesi bulunmuyor.</div>
                        ) : (
                            <div className="space-y-3">
                                {dividends.slice(0, 4).map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-2xl bg-emerald-50/50 border border-emerald-100/70 hover:bg-emerald-100/50 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-emerald-100/80 text-emerald-800 px-2 py-1 rounded-xl text-center min-w-[44px]">
                                                <span className="text-[9px] font-black uppercase block leading-tight">{item.paymentDate?.split('.')[1] || 'MAY'}</span>
                                                <span className="text-xs font-black block leading-tight">{item.paymentDate?.split('.')[0] || '19'}</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-[#00008B]">{item.symbol}</p>
                                                <p className="text-[10px] font-bold text-slate-600 truncate max-w-[120px]">{item.companyName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-emerald-800 bg-white/80 px-2 py-0.5 rounded-lg border border-emerald-200/80">
                                                {item.netAmountFormatted || '6,00 TL'}
                                            </span>
                                            <button title="Hatırlat" className="p-1 text-emerald-500 hover:text-[#00008B]">
                                                <Bell className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Link href="/dashboard/calendar?type=dividend" onClick={(e) => { e.preventDefault(); handleFilterSelect('dividends'); }} className="mt-4 pt-3 border-t border-emerald-100/60 flex items-center justify-center text-xs font-black text-[#00008B] hover:text-emerald-600 transition-colors">
                        Tüm Temettü Takvimi →
                    </Link>
                </div>

                {/* 3. HALKA ARZ TAKVİMİ (SOFT PURPLE TINT) */}
                <div className="bg-gradient-to-b from-purple-50/50 via-white to-white border border-purple-100/80 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-purple-100/60">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-xl bg-purple-100/70 border border-purple-200/80 flex items-center justify-center text-purple-700">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                                <h3 className="text-sm font-black text-[#00008B]">Halka Arz Takvimi</h3>
                            </div>
                            <Link href="/dashboard/calendar?type=ipo" onClick={(e) => { e.preventDefault(); handleFilterSelect('ipo'); }} className="text-[10px] font-extrabold text-purple-600 hover:underline">
                                Tümünü Gör
                            </Link>
                        </div>

                        {loading ? (
                            <div className="py-8 text-center text-xs font-bold text-slate-400">Yükleniyor...</div>
                        ) : ipos.length === 0 ? (
                            <div className="py-8 text-center text-xs font-bold text-slate-400">Yaklaşan halka arz bulunmuyor.</div>
                        ) : (
                            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-purple-200">
                                {ipos.slice(0, 4).map((item, idx) => (
                                    <div key={idx} className="relative flex items-center justify-between p-2 rounded-2xl bg-purple-50/40 border border-purple-100/70 hover:bg-purple-100/40 transition-all">
                                        <div className="absolute -left-[19px] w-3 h-3 rounded-full bg-purple-600 ring-4 ring-purple-100" />
                                        
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-[#00008B]">{item.symbol}</span>
                                                <span className="text-[9px] font-extrabold text-purple-800 bg-purple-100/80 px-1.5 py-0.5 rounded border border-purple-200/80">
                                                    {item.status}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-600 truncate max-w-[140px]">{item.companyName}</p>
                                        </div>
                                        <span className="text-[10px] font-black text-purple-800 bg-white/80 px-2 py-1 rounded-lg border border-purple-200/80">
                                            {item.dateRange || 'Yakında'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Link href="/dashboard/calendar?type=ipo" onClick={(e) => { e.preventDefault(); handleFilterSelect('ipo'); }} className="mt-4 pt-3 border-t border-purple-100/60 flex items-center justify-center text-xs font-black text-[#00008B] hover:text-purple-600 transition-colors">
                        Tüm Halka Arz Takvimi →
                    </Link>
                </div>
            </div>

            {/* EKONOMİK TAKVİM TABLOSU (SOFT AMBER / ORANGE TINT) */}
            <div className="bg-gradient-to-b from-amber-50/40 via-white to-white border border-amber-100/80 rounded-3xl p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-amber-100/60">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-amber-100/70 border border-amber-200/80 flex items-center justify-center text-amber-700">
                            <Globe2 className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-[#00008B]">Ekonomik Takvim</h3>
                            <p className="text-[10px] font-bold text-slate-400">Küresel makroekonomik veriler ve faiz kararları</p>
                        </div>
                    </div>
                    <Link href="/dashboard/calendar?type=economic" onClick={(e) => { e.preventDefault(); handleFilterSelect('economic'); }} className="text-xs font-extrabold text-amber-600 hover:underline">
                        Tümünü Gör →
                    </Link>
                </div>

                <div className="overflow-x-auto scrollbar-none">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-amber-100/60 text-[10px] font-black text-amber-800/60 uppercase tracking-wider bg-amber-50/30">
                                <th className="py-3 px-3">Tarih</th>
                                <th className="py-3 px-3">Saat</th>
                                <th className="py-3 px-3">Ülke</th>
                                <th className="py-3 px-3">Veri</th>
                                <th className="py-3 px-3">Önceki</th>
                                <th className="py-3 px-3">Beklenti</th>
                                <th className="py-3 px-3">Önem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-100/40 text-xs font-bold">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-400">Veriler yükleniyor...</td>
                                </tr>
                            ) : economicEvents.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-400">Kayıtlı ekonomik veri bulunmuyor.</td>
                                </tr>
                            ) : (
                                economicEvents.slice(0, 6).map((item, idx) => (
                                    <tr key={idx} className="hover:bg-amber-50/40 transition-colors">
                                        <td className="py-3 px-3 text-[#00008B] whitespace-nowrap">{item.dateFormatted || '19 Mayıs Salı'}</td>
                                        <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{item.time || '15:30'}</td>
                                        <td className="py-3 px-3 font-black text-slate-700 whitespace-nowrap">{item.country || 'USD'}</td>
                                        <td className="py-3 px-3 text-slate-800">{item.event}</td>
                                        <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{item.previous || '-'}</td>
                                        <td className="py-3 px-3 text-slate-700 whitespace-nowrap">{item.forecast || '-'}</td>
                                        <td className="py-3 px-3 whitespace-nowrap">
                                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border ${
                                                item.impact === 'Yüksek' || item.impact === 3
                                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                    : item.impact === 'Orta' || item.impact === 2
                                                    ? 'bg-amber-100/80 text-amber-800 border-amber-200'
                                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                                            }`}>
                                                {item.impact === 3 ? 'Yüksek' : item.impact === 2 ? 'Orta' : 'Düşük'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* YAKLAŞAN ÖNEMLİ TARİHLER (KOYU SUMMARY PANELİ) */}
            <div className="bg-[#0c101d] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
                            <h3 className="text-base font-black text-white">Yaklaşan Önemli Tarihler</h3>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Özet Bilgi</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div onClick={() => handleFilterSelect('earnings')} className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 backdrop-blur-md cursor-pointer hover:bg-blue-500/20 transition-all">
                            <span className="text-[10px] font-bold text-blue-300 uppercase block mb-1">Bilanço</span>
                            <span className="text-lg font-black text-blue-400 block">{earnings.length || 5} Şirket</span>
                            <span className="text-[9px] text-blue-200/60">Yaklaşan Sonuçlar</span>
                        </div>

                        <div onClick={() => handleFilterSelect('dividends')} className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 backdrop-blur-md cursor-pointer hover:bg-emerald-500/20 transition-all">
                            <span className="text-[10px] font-bold text-emerald-300 uppercase block mb-1">Temettü</span>
                            <span className="text-lg font-black text-emerald-400 block">{dividends.length || 4} Ödeme</span>
                            <span className="text-[9px] text-emerald-200/60">Açıklanan Hak Hakediş</span>
                        </div>

                        <div onClick={() => handleFilterSelect('ipo')} className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 backdrop-blur-md cursor-pointer hover:bg-purple-500/20 transition-all">
                            <span className="text-[10px] font-bold text-purple-300 uppercase block mb-1">Halka Arz</span>
                            <span className="text-lg font-black text-purple-400 block">{ipos.length || 3} Talep Toplama</span>
                            <span className="text-[9px] text-purple-200/60">Aktif Başvuru</span>
                        </div>

                        <div onClick={() => handleFilterSelect('economic')} className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 backdrop-blur-md cursor-pointer hover:bg-amber-500/20 transition-all">
                            <span className="text-[10px] font-bold text-amber-300 uppercase block mb-1">Ekonomik Veri</span>
                            <span className="text-lg font-black text-amber-400 block">{economicEvents.length || 7} Önemli Veri</span>
                            <span className="text-[9px] text-amber-200/60">Makro Göstergeler</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}

export default function CalendarPage() {
    return (
        <Suspense fallback={
            <div className="w-full min-h-screen bg-slate-50/50 p-8 flex items-center justify-center">
                <div className="flex items-center gap-2 text-xs font-bold text-[#00008B]">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Takvim Yükleniyor...
                </div>
            </div>
        }>
            <CalendarContent />
        </Suspense>
    );
}
