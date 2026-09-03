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
    X
} from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";

function CalendarContent() {
    const { myAssets = [] } = useUser();
    const searchParams = useSearchParams();
    const router = useRouter();

    // Initial active filter from URL query param
    const getInitialFilter = (): 'all' | 'earnings' | 'dividends' | 'ipo' | 'economic' => {
        const typeParam = searchParams ? (searchParams.get('type') || searchParams.get('focus')) : null;
        if (typeParam) {
            const p = typeParam.toLowerCase();
            if (p === 'dividend' || p === 'dividends' || p === 'temettu') return 'dividends';
            if (p === 'earnings' || p === 'bilanco') return 'earnings';
            if (p === 'ipo' || p === 'halka-arz') return 'ipo';
            if (p === 'economic' || p === 'ekonomik') return 'economic';
        }
        return 'all';
    };

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [viewDate, setViewDate] = useState<Date>(new Date());
    const [activeFilter, setActiveFilter] = useState<'all' | 'earnings' | 'dividends' | 'ipo' | 'economic'>(getInitialFilter);

    // Data States
    const [earnings, setEarnings] = useState<any[]>([]);
    const [dividends, setDividends] = useState<any[]>([]);
    const [ipos, setIpos] = useState<any[]>([]);
    const [economicEvents, setEconomicEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // ==========================================
    // 1. TEMETTÜ STATE'LERİ
    // ==========================================
    const [divSearch, setDivSearch] = useState<string>(() => searchParams?.get('search') || '');
    const [divDateFilter, setDivDateFilter] = useState<'all' | 'today' | 'this-week' | 'this-month' | 'next-3-months'>(
        () => (searchParams?.get('date') as any) || 'all'
    );
    const [divStatusFilter, setDivStatusFilter] = useState<'all' | 'upcoming' | 'completed'>(
        () => (searchParams?.get('status') as any) || 'all'
    );
    const [divYieldFilter, setDivYieldFilter] = useState<'all' | '0-2' | '2-5' | '5plus'>(
        () => (searchParams?.get('yield') as any) || 'all'
    );
    const [divAmountFilter, setDivAmountFilter] = useState<'all' | 'low' | 'medium' | 'high'>(
        () => (searchParams?.get('amount') as any) || 'all'
    );
    const [divPortfolioOnly, setDivPortfolioOnly] = useState<boolean>(
        () => searchParams?.get('portfolio') === 'true'
    );
    const [divSort, setDivSort] = useState<'date-asc' | 'date-desc' | 'yield-desc' | 'yield-asc' | 'amount-desc' | 'name-asc' | 'name-desc'>(
        () => (searchParams?.get('sort') as any) || 'date-asc'
    );

    // ==========================================
    // 2. BİLANÇO STATE'LERİ
    // ==========================================
    const [earnSearch, setEarnSearch] = useState<string>(() => searchParams?.get('search') || '');
    const [earnDateFilter, setEarnDateFilter] = useState<'all' | 'today' | 'this-week' | 'this-month' | 'next-3-months'>(
        () => (searchParams?.get('date') as any) || 'all'
    );
    const [earnPeriodFilter, setEarnPeriodFilter] = useState<'all' | '1q' | '2q' | '3q' | '4q'>(
        () => (searchParams?.get('period') as any) || 'all'
    );
    const [earnStatusFilter, setEarnStatusFilter] = useState<'all' | 'upcoming' | 'completed'>(
        () => (searchParams?.get('status') as any) || 'all'
    );
    const [earnPortfolioOnly, setEarnPortfolioOnly] = useState<boolean>(
        () => searchParams?.get('portfolio') === 'true'
    );
    const [earnSort, setEarnSort] = useState<'date-asc' | 'date-desc' | 'name-asc' | 'name-desc'>(
        () => (searchParams?.get('sort') as any) || 'date-asc'
    );

    // ==========================================
    // 3. HALKA ARZ STATE'LERİ
    // ==========================================
    const [ipoSearch, setIpoSearch] = useState<string>(() => searchParams?.get('search') || '');
    const [ipoDateFilter, setIpoDateFilter] = useState<'all' | 'today' | 'this-week' | 'this-month' | 'next-3-months'>(
        () => (searchParams?.get('date') as any) || 'all'
    );
    const [ipoStatusFilter, setIpoStatusFilter] = useState<'all' | 'upcoming' | 'active' | 'completed'>(
        () => (searchParams?.get('status') as any) || 'all'
    );
    const [ipoPriceFilter, setIpoPriceFilter] = useState<'all' | '0-25' | '25-50' | '50-100' | '100plus'>(
        () => (searchParams?.get('price') as any) || 'all'
    );
    const [ipoPortfolioOnly, setIpoPortfolioOnly] = useState<boolean>(
        () => searchParams?.get('portfolio') === 'true'
    );
    const [ipoSort, setIpoSort] = useState<'date-asc' | 'date-desc' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'>(
        () => (searchParams?.get('sort') as any) || 'date-asc'
    );

    // ==========================================
    // 4. EKONOMİK TAKVİM STATE'LERİ
    // ==========================================
    const [ecoSearch, setEcoSearch] = useState<string>(() => searchParams?.get('search') || '');
    const [ecoDateFilter, setEcoDateFilter] = useState<'all' | 'today' | 'tomorrow' | 'this-week' | 'this-month'>(
        () => (searchParams?.get('date') as any) || 'all'
    );
    const [ecoCountryFilter, setEcoCountryFilter] = useState<'all' | 'tr' | 'us' | 'eu' | 'uk' | 'de' | 'cn' | 'jp' | 'other'>(
        () => (searchParams?.get('country') as any) || 'all'
    );
    const [ecoImportanceFilter, setEcoImportanceFilter] = useState<'all' | 'high' | 'medium' | 'low'>(
        () => (searchParams?.get('importance') as any) || 'all'
    );
    const [ecoStatusFilter, setEcoStatusFilter] = useState<'all' | 'pending' | 'announced'>(
        () => (searchParams?.get('status') as any) || 'all'
    );
    const [ecoSort, setEcoSort] = useState<'date-asc' | 'date-desc' | 'importance-desc' | 'name-asc'>(
        () => (searchParams?.get('sort') as any) || 'date-asc'
    );

    // Sync URL search params -> state (Sayfa açılışında ve URL değişiminde)
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
            } else {
                setActiveFilter('all');
            }
        } else {
            setActiveFilter('all');
        }

        if (!searchParams) return;

        // 1. Temettü Parametreleri
        if (typeParam === 'dividend' || typeParam === 'dividends' || typeParam === 'temettu') {
            setDivSearch(searchParams.get('search') || '');
            setDivDateFilter((searchParams.get('date') as any) || 'all');
            setDivStatusFilter((searchParams.get('status') as any) || 'all');
            setDivYieldFilter((searchParams.get('yield') as any) || 'all');
            setDivAmountFilter((searchParams.get('amount') as any) || 'all');
            setDivPortfolioOnly(searchParams.get('portfolio') === 'true');
            setDivSort((searchParams.get('sort') as any) || 'date-asc');
        }

        // 2. Bilanço Parametreleri
        if (typeParam === 'earnings' || typeParam === 'bilanco') {
            setEarnSearch(searchParams.get('search') || '');
            setEarnDateFilter((searchParams.get('date') as any) || 'all');
            setEarnPeriodFilter((searchParams.get('period') as any) || 'all');
            setEarnStatusFilter((searchParams.get('status') as any) || 'all');
            setEarnPortfolioOnly(searchParams.get('portfolio') === 'true');
            setEarnSort((searchParams.get('sort') as any) || 'date-asc');
        }

        // 3. Halka Arz Parametreleri
        if (typeParam === 'ipo' || typeParam === 'halka-arz') {
            setIpoSearch(searchParams.get('search') || '');
            setIpoDateFilter((searchParams.get('date') as any) || 'all');
            setIpoStatusFilter((searchParams.get('status') as any) || 'all');
            setIpoPriceFilter((searchParams.get('price') as any) || 'all');
            setIpoPortfolioOnly(searchParams.get('portfolio') === 'true');
            setIpoSort((searchParams.get('sort') as any) || 'date-asc');
        }

        // 4. Ekonomik Takvim Parametreleri
        if (typeParam === 'economic' || typeParam === 'ekonomik') {
            setEcoSearch(searchParams.get('search') || '');
            setEcoDateFilter((searchParams.get('date') as any) || 'all');
            setEcoCountryFilter((searchParams.get('country') as any) || 'all');
            setEcoImportanceFilter((searchParams.get('importance') as any) || 'all');
            setEcoStatusFilter((searchParams.get('status') as any) || 'all');
            setEcoSort((searchParams.get('sort') as any) || 'date-asc');
        }
    }, [searchParams]);

    // URL Parametresi Güncelleme Fonksiyonları (UI -> URL)
    const updateDividendUrlParams = (newParams: Partial<Record<string, any>>) => {
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

    const updateEarningsUrlParams = (newParams: Partial<Record<string, any>>) => {
        const params = new URLSearchParams(window.location.search);
        params.set('type', 'earnings');
        const s = newParams.search !== undefined ? newParams.search : earnSearch;
        const d = newParams.date !== undefined ? newParams.date : earnDateFilter;
        const pe = newParams.period !== undefined ? newParams.period : earnPeriodFilter;
        const st = newParams.status !== undefined ? newParams.status : earnStatusFilter;
        const p = newParams.portfolio !== undefined ? newParams.portfolio : earnPortfolioOnly;
        const so = newParams.sort !== undefined ? newParams.sort : earnSort;

        if (s) params.set('search', s); else params.delete('search');
        if (d && d !== 'all') params.set('date', d); else params.delete('date');
        if (pe && pe !== 'all') params.set('period', pe); else params.delete('period');
        if (st && st !== 'all') params.set('status', st); else params.delete('status');
        if (p) params.set('portfolio', 'true'); else params.delete('portfolio');
        if (so && so !== 'date-asc') params.set('sort', so); else params.delete('sort');
        router.replace(`/dashboard/calendar?${params.toString()}`, { scroll: false });
    };

    const updateIpoUrlParams = (newParams: Partial<Record<string, any>>) => {
        const params = new URLSearchParams(window.location.search);
        params.set('type', 'ipo');
        const s = newParams.search !== undefined ? newParams.search : ipoSearch;
        const d = newParams.date !== undefined ? newParams.date : ipoDateFilter;
        const st = newParams.status !== undefined ? newParams.status : ipoStatusFilter;
        const pr = newParams.price !== undefined ? newParams.price : ipoPriceFilter;
        const p = newParams.portfolio !== undefined ? newParams.portfolio : ipoPortfolioOnly;
        const so = newParams.sort !== undefined ? newParams.sort : ipoSort;

        if (s) params.set('search', s); else params.delete('search');
        if (d && d !== 'all') params.set('date', d); else params.delete('date');
        if (st && st !== 'all') params.set('status', st); else params.delete('status');
        if (pr && pr !== 'all') params.set('price', pr); else params.delete('price');
        if (p) params.set('portfolio', 'true'); else params.delete('portfolio');
        if (so && so !== 'date-asc') params.set('sort', so); else params.delete('sort');
        router.replace(`/dashboard/calendar?${params.toString()}`, { scroll: false });
    };

    const updateEconomicUrlParams = (newParams: Partial<Record<string, any>>) => {
        const params = new URLSearchParams(window.location.search);
        params.set('type', 'economic');
        const s = newParams.search !== undefined ? newParams.search : ecoSearch;
        const d = newParams.date !== undefined ? newParams.date : ecoDateFilter;
        const c = newParams.country !== undefined ? newParams.country : ecoCountryFilter;
        const i = newParams.importance !== undefined ? newParams.importance : ecoImportanceFilter;
        const st = newParams.status !== undefined ? newParams.status : ecoStatusFilter;
        const so = newParams.sort !== undefined ? newParams.sort : ecoSort;

        if (s) params.set('search', s); else params.delete('search');
        if (d && d !== 'all') params.set('date', d); else params.delete('date');
        if (c && c !== 'all') params.set('country', c); else params.delete('country');
        if (i && i !== 'all') params.set('importance', i); else params.delete('importance');
        if (st && st !== 'all') params.set('status', st); else params.delete('status');
        if (so && so !== 'date-asc') params.set('sort', so); else params.delete('sort');
        router.replace(`/dashboard/calendar?${params.toString()}`, { scroll: false });
    };

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
            router.push('/dashboard/calendar');
        } else {
            router.push(`/dashboard/calendar?type=${targetType}`);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

    // Tarih / Sayı Ayrıştırma Yardımcıları
    const getItemTimestamp = (item: any, dateKey: string = 'paymentDate'): number => {
        if (item.timestamp) return item.timestamp;
        const val = item[dateKey] || item.earningsDate || item.paymentDate;
        if (val) {
            const parts = String(val).split('.');
            if (parts.length === 3) {
                return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
            }
            return new Date(val).getTime() || 0;
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

    // ==========================================
    // TEMETTÜ FİLTRELEME & SIRALAMA MANTIĞI
    // ==========================================
    const filteredDividends = useMemo(() => {
        let list = [...dividends];
        if (divSearch.trim()) {
            const q = divSearch.trim().toLowerCase();
            list = list.filter(item =>
                (item.symbol || '').toLowerCase().includes(q) ||
                (item.companyName || '').toLowerCase().includes(q)
            );
        }
        const now = new Date();
        if (divDateFilter !== 'all') {
            list = list.filter(item => {
                const ts = getItemTimestamp(item, 'paymentDate');
                if (!ts) return false;
                const itemDate = new Date(ts);
                if (divDateFilter === 'today') return itemDate.toDateString() === now.toDateString();
                if (divDateFilter === 'this-week') {
                    const diffDays = (itemDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
                    return diffDays >= -1 && diffDays <= 7;
                }
                if (divDateFilter === 'this-month') return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
                if (divDateFilter === 'next-3-months') {
                    const diffDays = (itemDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
                    return diffDays >= 0 && diffDays <= 90;
                }
                return true;
            });
        }
        if (divStatusFilter !== 'all') {
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            list = list.filter(item => {
                const ts = getItemTimestamp(item, 'paymentDate');
                if (!ts) return true;
                return divStatusFilter === 'upcoming' ? ts >= todayStart : ts < todayStart;
            });
        }
        if (divYieldFilter !== 'all') {
            list = list.filter(item => {
                const y = getItemYield(item);
                if (divYieldFilter === '0-2') return y > 0 && y <= 2;
                if (divYieldFilter === '2-5') return y > 2 && y <= 5;
                if (divYieldFilter === '5plus') return y > 5;
                return true;
            });
        }
        if (divAmountFilter !== 'all') {
            list = list.filter(item => {
                const amt = getItemAmount(item);
                if (divAmountFilter === 'low') return amt > 0 && amt < 2;
                if (divAmountFilter === 'medium') return amt >= 2 && amt <= 10;
                if (divAmountFilter === 'high') return amt > 10;
                return true;
            });
        }
        if (divPortfolioOnly) {
            list = list.filter(item => {
                const sym = (item.symbol || '').toUpperCase().replace(/\.IS$/, '');
                return portfolioSymbols.has(sym);
            });
        }
        list.sort((a, b) => {
            const tsA = getItemTimestamp(a, 'paymentDate');
            const tsB = getItemTimestamp(b, 'paymentDate');
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

    const divActiveChips = useMemo(() => {
        const chips: { id: string; label: string; clear: () => void }[] = [];
        if (divSearch.trim()) chips.push({ id: 'search', label: `Arama: "${divSearch}"`, clear: () => { setDivSearch(''); updateDividendUrlParams({ search: '' }); } });
        if (divDateFilter !== 'all') {
            const labels: Record<string, string> = { today: 'Bugün', 'this-week': 'Bu Hafta', 'this-month': 'Bu Ay', 'next-3-months': 'Önümüzdeki 3 Ay' };
            chips.push({ id: 'date', label: `Tarih: ${labels[divDateFilter]}`, clear: () => { setDivDateFilter('all'); updateDividendUrlParams({ date: 'all' }); } });
        }
        if (divStatusFilter !== 'all') chips.push({ id: 'status', label: `Durum: ${divStatusFilter === 'upcoming' ? 'Yaklaşan' : 'Gerçekleşen'}`, clear: () => { setDivStatusFilter('all'); updateDividendUrlParams({ status: 'all' }); } });
        if (divYieldFilter !== 'all') {
            const labels: Record<string, string> = { '0-2': '%0–2', '2-5': '%2–5', '5plus': '%5+' };
            chips.push({ id: 'yield', label: `Verim: ${labels[divYieldFilter]}`, clear: () => { setDivYieldFilter('all'); updateDividendUrlParams({ yield: 'all' }); } });
        }
        if (divAmountFilter !== 'all') {
            const labels: Record<string, string> = { low: 'Düşük (<2 TL)', medium: 'Orta (2–10 TL)', high: 'Yüksek (>10 TL)' };
            chips.push({ id: 'amount', label: `Tutar: ${labels[divAmountFilter]}`, clear: () => { setDivAmountFilter('all'); updateDividendUrlParams({ amount: 'all' }); } });
        }
        if (divPortfolioOnly) chips.push({ id: 'portfolio', label: 'Portföyümdekiler', clear: () => { setDivPortfolioOnly(false); updateDividendUrlParams({ portfolio: false }); } });
        return chips;
    }, [divSearch, divDateFilter, divStatusFilter, divYieldFilter, divAmountFilter, divPortfolioOnly]);

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

    // ==========================================
    // BİLANÇO FİLTRELEME & SIRALAMA MANTIĞI
    // ==========================================
    const filteredEarnings = useMemo(() => {
        let list = [...earnings];
        if (earnSearch.trim()) {
            const q = earnSearch.trim().toLowerCase();
            list = list.filter(item =>
                (item.symbol || '').toLowerCase().includes(q) ||
                (item.companyName || '').toLowerCase().includes(q)
            );
        }
        const now = new Date();
        if (earnDateFilter !== 'all') {
            list = list.filter(item => {
                const ts = getItemTimestamp(item, 'earningsDate');
                if (!ts) return false;
                const itemDate = new Date(ts);
                if (earnDateFilter === 'today') return itemDate.toDateString() === now.toDateString();
                if (earnDateFilter === 'this-week') {
                    const diffDays = (itemDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
                    return diffDays >= -1 && diffDays <= 7;
                }
                if (earnDateFilter === 'this-month') return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
                if (earnDateFilter === 'next-3-months') {
                    const diffDays = (itemDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
                    return diffDays >= 0 && diffDays <= 90;
                }
                return true;
            });
        }
        if (earnPeriodFilter !== 'all') {
            list = list.filter(item => {
                const str = (item.earningsDate || item.period || '').toLowerCase();
                if (earnPeriodFilter === '1q') return str.includes('1ç') || str.includes('1q');
                if (earnPeriodFilter === '2q') return str.includes('2ç') || str.includes('2q');
                if (earnPeriodFilter === '3q') return str.includes('3ç') || str.includes('3q');
                if (earnPeriodFilter === '4q') return str.includes('4ç') || str.includes('4q') || str.includes('yıllık');
                return true;
            });
        }
        if (earnStatusFilter !== 'all') {
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            list = list.filter(item => {
                const ts = getItemTimestamp(item, 'earningsDate');
                if (!ts) return true;
                return earnStatusFilter === 'upcoming' ? ts >= todayStart : ts < todayStart;
            });
        }
        if (earnPortfolioOnly) {
            list = list.filter(item => {
                const sym = (item.symbol || '').toUpperCase().replace(/\.IS$/, '');
                return portfolioSymbols.has(sym);
            });
        }
        list.sort((a, b) => {
            const tsA = getItemTimestamp(a, 'earningsDate');
            const tsB = getItemTimestamp(b, 'earningsDate');
            if (earnSort === 'date-asc') return tsA - tsB;
            if (earnSort === 'date-desc') return tsB - tsA;
            if (earnSort === 'name-asc') return (a.companyName || '').localeCompare(b.companyName || '');
            if (earnSort === 'name-desc') return (b.companyName || '').localeCompare(a.companyName || '');
            return 0;
        });
        return list;
    }, [earnings, earnSearch, earnDateFilter, earnPeriodFilter, earnStatusFilter, earnPortfolioOnly, earnSort, portfolioSymbols]);

    const earnActiveChips = useMemo(() => {
        const chips: { id: string; label: string; clear: () => void }[] = [];
        if (earnSearch.trim()) chips.push({ id: 'search', label: `Arama: "${earnSearch}"`, clear: () => { setEarnSearch(''); updateEarningsUrlParams({ search: '' }); } });
        if (earnDateFilter !== 'all') {
            const labels: Record<string, string> = { today: 'Bugün', 'this-week': 'Bu Hafta', 'this-month': 'Bu Ay', 'next-3-months': 'Önümüzdeki 3 Ay' };
            chips.push({ id: 'date', label: `Tarih: ${labels[earnDateFilter]}`, clear: () => { setEarnDateFilter('all'); updateEarningsUrlParams({ date: 'all' }); } });
        }
        if (earnPeriodFilter !== 'all') {
            const labels: Record<string, string> = { '1q': '1. Çeyrek (1Ç)', '2q': '2. Çeyrek (2Ç)', '3q': '3. Çeyrek (3Ç)', '4q': '4. Çeyrek (Yıllık)' };
            chips.push({ id: 'period', label: `Dönem: ${labels[earnPeriodFilter]}`, clear: () => { setEarnPeriodFilter('all'); updateEarningsUrlParams({ period: 'all' }); } });
        }
        if (earnStatusFilter !== 'all') chips.push({ id: 'status', label: `Durum: ${earnStatusFilter === 'upcoming' ? 'Yaklaşan' : 'Açıklanan'}`, clear: () => { setEarnStatusFilter('all'); updateEarningsUrlParams({ status: 'all' }); } });
        if (earnPortfolioOnly) chips.push({ id: 'portfolio', label: 'Portföyümdekiler', clear: () => { setEarnPortfolioOnly(false); updateEarningsUrlParams({ portfolio: false }); } });
        return chips;
    }, [earnSearch, earnDateFilter, earnPeriodFilter, earnStatusFilter, earnPortfolioOnly]);

    const clearAllEarningsFilters = () => {
        setEarnSearch('');
        setEarnDateFilter('all');
        setEarnPeriodFilter('all');
        setEarnStatusFilter('all');
        setEarnPortfolioOnly(false);
        setEarnSort('date-asc');
        router.replace('/dashboard/calendar?type=earnings', { scroll: false });
    };

    // ==========================================
    // HALKA ARZ FİLTRELEME & SIRALAMA MANTIĞI
    // ==========================================
    const filteredIpos = useMemo(() => {
        let list = [...ipos];
        if (ipoSearch.trim()) {
            const q = ipoSearch.trim().toLowerCase();
            list = list.filter(item =>
                (item.symbol || '').toLowerCase().includes(q) ||
                (item.companyName || '').toLowerCase().includes(q)
            );
        }
        const now = new Date();
        if (ipoDateFilter !== 'all') {
            list = list.filter(item => {
                const ts = getItemTimestamp(item, 'dateRange');
                if (!ts) return false;
                const itemDate = new Date(ts);
                if (ipoDateFilter === 'today') return itemDate.toDateString() === now.toDateString();
                if (ipoDateFilter === 'this-week') {
                    const diffDays = (itemDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
                    return diffDays >= -1 && diffDays <= 7;
                }
                if (ipoDateFilter === 'this-month') return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
                if (ipoDateFilter === 'next-3-months') {
                    const diffDays = (itemDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
                    return diffDays >= 0 && diffDays <= 90;
                }
                return true;
            });
        }
        if (ipoStatusFilter !== 'all') {
            list = list.filter(item => {
                const st = (item.status || '').toLowerCase();
                if (ipoStatusFilter === 'upcoming') return st.includes('yaklaşan') || st.includes('hazırlık');
                if (ipoStatusFilter === 'active') return st.includes('açık') || st.includes('talep');
                if (ipoStatusFilter === 'completed') return st.includes('sona') || st.includes('tamam');
                return true;
            });
        }
        if (ipoPriceFilter !== 'all') {
            list = list.filter(item => {
                const p = parseFloat(item.priceFormatted || item.offerPrice || '0');
                if (ipoPriceFilter === '0-25') return p > 0 && p <= 25;
                if (ipoPriceFilter === '25-50') return p > 25 && p <= 50;
                if (ipoPriceFilter === '50-100') return p > 50 && p <= 100;
                if (ipoPriceFilter === '100plus') return p > 100;
                return true;
            });
        }
        if (ipoPortfolioOnly) {
            list = list.filter(item => {
                const sym = (item.symbol || '').toUpperCase().replace(/\.IS$/, '');
                return portfolioSymbols.has(sym);
            });
        }
        list.sort((a, b) => {
            const tsA = getItemTimestamp(a, 'dateRange');
            const tsB = getItemTimestamp(b, 'dateRange');
            const prA = parseFloat(a.priceFormatted || a.offerPrice || '0');
            const prB = parseFloat(b.priceFormatted || b.offerPrice || '0');
            if (ipoSort === 'date-asc') return tsA - tsB;
            if (ipoSort === 'date-desc') return tsB - tsA;
            if (ipoSort === 'price-asc') return prA - prB;
            if (ipoSort === 'price-desc') return prB - prA;
            if (ipoSort === 'name-asc') return (a.companyName || '').localeCompare(b.companyName || '');
            if (ipoSort === 'name-desc') return (b.companyName || '').localeCompare(a.companyName || '');
            return 0;
        });
        return list;
    }, [ipos, ipoSearch, ipoDateFilter, ipoStatusFilter, ipoPriceFilter, ipoPortfolioOnly, ipoSort, portfolioSymbols]);

    const ipoActiveChips = useMemo(() => {
        const chips: { id: string; label: string; clear: () => void }[] = [];
        if (ipoSearch.trim()) chips.push({ id: 'search', label: `Arama: "${ipoSearch}"`, clear: () => { setIpoSearch(''); updateIpoUrlParams({ search: '' }); } });
        if (ipoDateFilter !== 'all') {
            const labels: Record<string, string> = { today: 'Bugün', 'this-week': 'Bu Hafta', 'this-month': 'Bu Ay', 'next-3-months': 'Önümüzdeki 3 Ay' };
            chips.push({ id: 'date', label: `Tarih: ${labels[ipoDateFilter]}`, clear: () => { setIpoDateFilter('all'); updateIpoUrlParams({ date: 'all' }); } });
        }
        if (ipoStatusFilter !== 'all') {
            const labels: Record<string, string> = { upcoming: 'Yaklaşan', active: 'Başvuru Açık', completed: 'Tamamlanan' };
            chips.push({ id: 'status', label: `Durum: ${labels[ipoStatusFilter]}`, clear: () => { setIpoStatusFilter('all'); updateIpoUrlParams({ status: 'all' }); } });
        }
        if (ipoPriceFilter !== 'all') {
            const labels: Record<string, string> = { '0-25': '0–25 TL', '25-50': '25–50 TL', '50-100': '50–100 TL', '100plus': '100 TL+' };
            chips.push({ id: 'price', label: `Fiyat: ${labels[ipoPriceFilter]}`, clear: () => { setIpoPriceFilter('all'); updateIpoUrlParams({ price: 'all' }); } });
        }
        if (ipoPortfolioOnly) chips.push({ id: 'portfolio', label: 'Portföyümdekiler', clear: () => { setIpoPortfolioOnly(false); updateIpoUrlParams({ portfolio: false }); } });
        return chips;
    }, [ipoSearch, ipoDateFilter, ipoStatusFilter, ipoPriceFilter, ipoPortfolioOnly]);

    const clearAllIpoFilters = () => {
        setIpoSearch('');
        setIpoDateFilter('all');
        setIpoStatusFilter('all');
        setIpoPriceFilter('all');
        setIpoPortfolioOnly(false);
        setIpoSort('date-asc');
        router.replace('/dashboard/calendar?type=ipo', { scroll: false });
    };

    // ==========================================
    // EKONOMİK TAKVİM FİLTRELEME & SIRALAMA MANTIĞI
    // ==========================================
    const filteredEconomicEvents = useMemo(() => {
        let list = [...economicEvents];
        if (ecoSearch.trim()) {
            const q = ecoSearch.trim().toLowerCase();
            list = list.filter(item =>
                (item.event || '').toLowerCase().includes(q) ||
                (item.country || '').toLowerCase().includes(q) ||
                (item.currency || '').toLowerCase().includes(q)
            );
        }
        const now = new Date();
        if (ecoDateFilter !== 'all') {
            list = list.filter(item => {
                if (ecoDateFilter === 'today') return item.isToday || false;
                if (ecoDateFilter === 'tomorrow') {
                    const tom = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                    return item.dateFormatted?.includes(tom.getDate().toString()) || false;
                }
                return true;
            });
        }
        if (ecoCountryFilter !== 'all') {
            list = list.filter(item => {
                const c = (item.country || item.currency || '').toLowerCase();
                if (ecoCountryFilter === 'tr') return c.includes('tr') || c.includes('try') || c.includes('türkiye');
                if (ecoCountryFilter === 'us') return c.includes('us') || c.includes('usd') || c.includes('abd');
                if (ecoCountryFilter === 'eu') return c.includes('eu') || c.includes('eur') || c.includes('euro');
                if (ecoCountryFilter === 'uk') return c.includes('uk') || c.includes('gbp') || c.includes('ingiltere');
                if (ecoCountryFilter === 'de') return c.includes('de') || c.includes('almanya');
                if (ecoCountryFilter === 'cn') return c.includes('cn') || c.includes('cny') || c.includes('çin');
                if (ecoCountryFilter === 'jp') return c.includes('jp') || c.includes('jpy') || c.includes('japonya');
                return true;
            });
        }
        if (ecoImportanceFilter !== 'all') {
            list = list.filter(item => {
                const imp = item.impact;
                if (ecoImportanceFilter === 'high') return imp === 'Yüksek' || imp === 3;
                if (ecoImportanceFilter === 'medium') return imp === 'Orta' || imp === 2;
                if (ecoImportanceFilter === 'low') return imp === 'Düşük' || imp === 1;
                return true;
            });
        }
        if (ecoStatusFilter !== 'all') {
            list = list.filter(item => {
                const hasActual = item.actual !== undefined && item.actual !== null && item.actual !== '' && item.actual !== '-';
                return ecoStatusFilter === 'announced' ? hasActual : !hasActual;
            });
        }
        list.sort((a, b) => {
            const impA = a.impact === 'Yüksek' || a.impact === 3 ? 3 : a.impact === 'Orta' || a.impact === 2 ? 2 : 1;
            const impB = b.impact === 'Yüksek' || b.impact === 3 ? 3 : b.impact === 'Orta' || b.impact === 2 ? 2 : 1;
            if (ecoSort === 'importance-desc') return impB - impA;
            if (ecoSort === 'name-asc') return (a.event || '').localeCompare(b.event || '');
            return 0;
        });
        return list;
    }, [economicEvents, ecoSearch, ecoDateFilter, ecoCountryFilter, ecoImportanceFilter, ecoStatusFilter, ecoSort]);

    const ecoActiveChips = useMemo(() => {
        const chips: { id: string; label: string; clear: () => void }[] = [];
        if (ecoSearch.trim()) chips.push({ id: 'search', label: `Arama: "${ecoSearch}"`, clear: () => { setEcoSearch(''); updateEconomicUrlParams({ search: '' }); } });
        if (ecoDateFilter !== 'all') {
            const labels: Record<string, string> = { today: 'Bugün', tomorrow: 'Yarın', 'this-week': 'Bu Hafta', 'this-month': 'Bu Ay' };
            chips.push({ id: 'date', label: `Tarih: ${labels[ecoDateFilter]}`, clear: () => { setEcoDateFilter('all'); updateEconomicUrlParams({ date: 'all' }); } });
        }
        if (ecoCountryFilter !== 'all') {
            const labels: Record<string, string> = { tr: 'Türkiye (TRY)', us: 'ABD (USD)', eu: 'Euro Bölgesi', uk: 'İngiltere', de: 'Almanya', cn: 'Çin', jp: 'Japonya' };
            chips.push({ id: 'country', label: `Ülke: ${labels[ecoCountryFilter] || ecoCountryFilter}`, clear: () => { setEcoCountryFilter('all'); updateEconomicUrlParams({ country: 'all' }); } });
        }
        if (ecoImportanceFilter !== 'all') {
            const labels: Record<string, string> = { high: 'Yüksek Önem', medium: 'Orta Önem', low: 'Düşük Önem' };
            chips.push({ id: 'importance', label: `Önem: ${labels[ecoImportanceFilter]}`, clear: () => { setEcoImportanceFilter('all'); updateEconomicUrlParams({ importance: 'all' }); } });
        }
        if (ecoStatusFilter !== 'all') {
            chips.push({ id: 'status', label: `Durum: ${ecoStatusFilter === 'announced' ? 'Açıklandı' : 'Bekleniyor'}`, clear: () => { setEcoStatusFilter('all'); updateEconomicUrlParams({ status: 'all' }); } });
        }
        return chips;
    }, [ecoSearch, ecoDateFilter, ecoCountryFilter, ecoImportanceFilter, ecoStatusFilter]);

    const clearAllEconomicFilters = () => {
        setEcoSearch('');
        setEcoDateFilter('all');
        setEcoCountryFilter('all');
        setEcoImportanceFilter('all');
        setEcoStatusFilter('all');
        setEcoSort('date-asc');
        router.replace('/dashboard/calendar?type=economic', { scroll: false });
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

            {/* ================================================= */}
            {/* TEMETTÜ GELİŞMİŞ FİLTRELEME PANENİ */}
            {/* ================================================= */}
            {activeFilter === 'dividends' && (
                <div className="bg-gradient-to-b from-emerald-50/60 via-white to-white border border-emerald-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
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

                        <div className="relative w-full md:w-80">
                            <Search className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={divSearch}
                                onChange={(e) => { setDivSearch(e.target.value); updateDividendUrlParams({ search: e.target.value }); }}
                                placeholder="Hisse Kodu veya Şirket Ara (örn: THYAO)..."
                                className="w-full pl-9 pr-8 py-2 text-xs font-bold text-slate-800 bg-white border border-emerald-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-xs"
                            />
                            {divSearch && (
                                <button onClick={() => { setDivSearch(''); updateDividendUrlParams({ search: '' }); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs font-bold">
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Tarih</label>
                            <select value={divDateFilter} onChange={(e) => { const v = e.target.value as any; setDivDateFilter(v); updateDividendUrlParams({ date: v }); }} className="w-full p-2 bg-white border border-emerald-200/80 rounded-xl text-slate-700">
                                <option value="all">Tüm Tarihler</option>
                                <option value="today">Bugün</option>
                                <option value="this-week">Bu Hafta</option>
                                <option value="this-month">Bu Ay</option>
                                <option value="next-3-months">Önümüzdeki 3 Ay</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Durum</label>
                            <select value={divStatusFilter} onChange={(e) => { const v = e.target.value as any; setDivStatusFilter(v); updateDividendUrlParams({ status: v }); }} className="w-full p-2 bg-white border border-emerald-200/80 rounded-xl text-slate-700">
                                <option value="all">Tüm Durumlar</option>
                                <option value="upcoming">Yaklaşan</option>
                                <option value="completed">Gerçekleşen</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Verim</label>
                            <select value={divYieldFilter} onChange={(e) => { const v = e.target.value as any; setDivYieldFilter(v); updateDividendUrlParams({ yield: v }); }} className="w-full p-2 bg-white border border-emerald-200/80 rounded-xl text-slate-700">
                                <option value="all">Tüm Verimler</option>
                                <option value="0-2">%0 – %2</option>
                                <option value="2-5">%2 – %5</option>
                                <option value="5plus">%5 ve Üzeri</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Net Tutar</label>
                            <select value={divAmountFilter} onChange={(e) => { const v = e.target.value as any; setDivAmountFilter(v); updateDividendUrlParams({ amount: v }); }} className="w-full p-2 bg-white border border-emerald-200/80 rounded-xl text-slate-700">
                                <option value="all">Tüm Tutarlar</option>
                                <option value="low">Düşük (&lt; 2 TL)</option>
                                <option value="medium">Orta (2 – 10 TL)</option>
                                <option value="high">Yüksek (&gt; 10 TL)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Portföy</label>
                            <button onClick={() => { const v = !divPortfolioOnly; setDivPortfolioOnly(v); updateDividendUrlParams({ portfolio: v }); }} className={`w-full p-2 rounded-xl border transition-all flex items-center justify-center gap-1.5 ${divPortfolioOnly ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-emerald-200/80'}`}>
                                <Briefcase className="w-3.5 h-3.5" />
                                <span>Portföyümdekiler</span>
                            </button>
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Sıralama</label>
                            <select value={divSort} onChange={(e) => { const v = e.target.value as any; setDivSort(v); updateDividendUrlParams({ sort: v }); }} className="w-full p-2 bg-white border border-emerald-200/80 rounded-xl text-slate-700">
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

                    {divActiveChips.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-emerald-100/60">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase">Aktif Filtreler:</span>
                            {divActiveChips.map(chip => (
                                <span key={chip.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-100/80 text-emerald-900 border border-emerald-200">
                                    <span>{chip.label}</span>
                                    <button onClick={chip.clear} className="hover:bg-emerald-200/80 rounded-full p-0.5"><X className="w-3 h-3 text-emerald-800" /></button>
                                </span>
                            ))}
                            <button onClick={clearAllDividendFilters} className="text-xs font-extrabold text-rose-600 hover:underline ml-2">Filtreleri Temizle</button>
                        </div>
                    )}

                    <div className="pt-2">
                        <span className="text-xs font-black text-[#00008B] block mb-3">Toplam {filteredDividends.length} Temettü Kaydı</span>
                        {loading ? (
                            <div className="py-8 text-center text-xs font-bold text-slate-400">Yükleniyor...</div>
                        ) : filteredDividends.length === 0 ? (
                            <div className="py-12 bg-white rounded-2xl border border-dashed border-emerald-200 flex flex-col items-center justify-center gap-2 text-center">
                                <Clock className="w-8 h-8 text-emerald-300" />
                                <p className="text-sm font-black text-slate-700">Sonuç bulunamadı</p>
                                <button onClick={clearAllDividendFilters} className="px-4 py-2 text-xs font-black text-white bg-emerald-600 rounded-xl">Filtreleri Temizle</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredDividends.map((item, idx) => (
                                    <div key={idx} className="p-4 rounded-2xl bg-white border border-emerald-100 flex flex-col justify-between space-y-3">
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
                                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200">
                                                {item.paymentDate || 'Temettü'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs font-bold">
                                            <div><span className="text-[10px] text-slate-400 block">Tutar</span><span className="text-emerald-700">{item.netAmountFormatted || '6,00 TL'}</span></div>
                                            <div><span className="text-[10px] text-slate-400 block">Verim</span><span className="text-emerald-800">%{getItemYield(item).toFixed(2)}</span></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ================================================= */}
            {/* BİLANÇO GELİŞMİŞ FİLTRELEME PANENİ */}
            {/* ================================================= */}
            {activeFilter === 'earnings' && (
                <div className="bg-gradient-to-b from-blue-50/60 via-white to-white border border-blue-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-blue-100/60">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                                <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="text-base font-black text-[#00008B]">Bilanço Takvimi ve Filtreleme</h2>
                                <p className="text-[11px] font-bold text-slate-400">Şirket adına, döneme, açıklama durumuna ve tarihe göre bilanço araması yapın</p>
                            </div>
                        </div>

                        <div className="relative w-full md:w-80">
                            <Search className="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={earnSearch}
                                onChange={(e) => { setEarnSearch(e.target.value); updateEarningsUrlParams({ search: e.target.value }); }}
                                placeholder="Hisse Kodu veya Şirket Ara (örn: THYAO)..."
                                className="w-full pl-9 pr-8 py-2 text-xs font-bold text-slate-800 bg-white border border-blue-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-xs"
                            />
                            {earnSearch && (
                                <button onClick={() => { setEarnSearch(''); updateEarningsUrlParams({ search: '' }); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs font-bold">
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Tarih</label>
                            <select value={earnDateFilter} onChange={(e) => { const v = e.target.value as any; setEarnDateFilter(v); updateEarningsUrlParams({ date: v }); }} className="w-full p-2 bg-white border border-blue-200/80 rounded-xl text-slate-700">
                                <option value="all">Tüm Tarihler</option>
                                <option value="today">Bugün</option>
                                <option value="this-week">Bu Hafta</option>
                                <option value="this-month">Bu Ay</option>
                                <option value="next-3-months">Önümüzdeki 3 Ay</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Dönem</label>
                            <select value={earnPeriodFilter} onChange={(e) => { const v = e.target.value as any; setEarnPeriodFilter(v); updateEarningsUrlParams({ period: v }); }} className="w-full p-2 bg-white border border-blue-200/80 rounded-xl text-slate-700">
                                <option value="all">Tüm Dönemler</option>
                                <option value="1q">1. Çeyrek (1Ç)</option>
                                <option value="2q">2. Çeyrek (2Ç)</option>
                                <option value="3q">3. Çeyrek (3Ç)</option>
                                <option value="4q">4. Çeyrek (Yıllık)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Durum</label>
                            <select value={earnStatusFilter} onChange={(e) => { const v = e.target.value as any; setEarnStatusFilter(v); updateEarningsUrlParams({ status: v }); }} className="w-full p-2 bg-white border border-blue-200/80 rounded-xl text-slate-700">
                                <option value="all">Tüm Durumlar</option>
                                <option value="upcoming">Yaklaşan</option>
                                <option value="completed">Açıklanan</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Portföy</label>
                            <button onClick={() => { const v = !earnPortfolioOnly; setEarnPortfolioOnly(v); updateEarningsUrlParams({ portfolio: v }); }} className={`w-full p-2 rounded-xl border transition-all flex items-center justify-center gap-1.5 ${earnPortfolioOnly ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-blue-200/80'}`}>
                                <Briefcase className="w-3.5 h-3.5" />
                                <span>Portföyümdekiler</span>
                            </button>
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Sıralama</label>
                            <select value={earnSort} onChange={(e) => { const v = e.target.value as any; setEarnSort(v); updateEarningsUrlParams({ sort: v }); }} className="w-full p-2 bg-white border border-blue-200/80 rounded-xl text-slate-700">
                                <option value="date-asc">En Yakın Tarih</option>
                                <option value="date-desc">En Uzak Tarih</option>
                                <option value="name-asc">Şirket (A-Z)</option>
                                <option value="name-desc">Şirket (Z-A)</option>
                            </select>
                        </div>
                    </div>

                    {earnActiveChips.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-blue-100/60">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase">Aktif Filtreler:</span>
                            {earnActiveChips.map(chip => (
                                <span key={chip.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black bg-blue-100/80 text-blue-900 border border-blue-200">
                                    <span>{chip.label}</span>
                                    <button onClick={chip.clear} className="hover:bg-blue-200/80 rounded-full p-0.5"><X className="w-3 h-3 text-blue-800" /></button>
                                </span>
                            ))}
                            <button onClick={clearAllEarningsFilters} className="text-xs font-extrabold text-rose-600 hover:underline ml-2">Filtreleri Temizle</button>
                        </div>
                    )}

                    <div className="pt-2">
                        <span className="text-xs font-black text-[#00008B] block mb-3">Toplam {filteredEarnings.length} Bilanço Kaydı</span>
                        {loading ? (
                            <div className="py-8 text-center text-xs font-bold text-slate-400">Yükleniyor...</div>
                        ) : filteredEarnings.length === 0 ? (
                            <div className="py-12 bg-white rounded-2xl border border-dashed border-blue-200 flex flex-col items-center justify-center gap-2 text-center">
                                <Clock className="w-8 h-8 text-blue-300" />
                                <p className="text-sm font-black text-slate-700">Sonuç bulunamadı</p>
                                <button onClick={clearAllEarningsFilters} className="px-4 py-2 text-xs font-black text-white bg-blue-600 rounded-xl">Filtreleri Temizle</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredEarnings.map((item, idx) => (
                                    <div key={idx} className="p-4 rounded-2xl bg-white border border-blue-100 flex flex-col justify-between space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-100/70 border border-blue-200 text-blue-800 flex items-center justify-center font-black text-xs">
                                                    {item.symbol?.substring(0, 3)}
                                                </div>
                                                <div>
                                                    <span className="text-xs font-black text-[#00008B] block">{item.symbol}</span>
                                                    <span className="text-[11px] font-bold text-slate-500 line-clamp-1">{item.companyName}</span>
                                                </div>
                                            </div>
                                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md border bg-blue-50 text-blue-700 border-blue-200">
                                                {item.earningsDate || '2026/1Ç'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ================================================= */}
            {/* HALKA ARZ GELİŞMİŞ FİLTRELEME PANENİ */}
            {/* ================================================= */}
            {activeFilter === 'ipo' && (
                <div className="bg-gradient-to-b from-purple-50/60 via-white to-white border border-purple-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-purple-100/60">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="text-base font-black text-[#00008B]">Halka Arz Takvimi ve Filtreleme</h2>
                                <p className="text-[11px] font-bold text-slate-400">Şirket adına, başvuru durumuna, fiyata ve tarihe göre halka arz araması yapın</p>
                            </div>
                        </div>

                        <div className="relative w-full md:w-80">
                            <Search className="w-4 h-4 text-purple-600 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={ipoSearch}
                                onChange={(e) => { setIpoSearch(e.target.value); updateIpoUrlParams({ search: e.target.value }); }}
                                placeholder="Hisse Kodu veya Şirket Ara (örn: EFORK)..."
                                className="w-full pl-9 pr-8 py-2 text-xs font-bold text-slate-800 bg-white border border-purple-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 shadow-xs"
                            />
                            {ipoSearch && (
                                <button onClick={() => { setIpoSearch(''); updateIpoUrlParams({ search: '' }); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs font-bold">
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Tarih</label>
                            <select value={ipoDateFilter} onChange={(e) => { const v = e.target.value as any; setIpoDateFilter(v); updateIpoUrlParams({ date: v }); }} className="w-full p-2 bg-white border border-purple-200/80 rounded-xl text-slate-700">
                                <option value="all">Tüm Tarihler</option>
                                <option value="today">Bugün</option>
                                <option value="this-week">Bu Hafta</option>
                                <option value="this-month">Bu Ay</option>
                                <option value="next-3-months">Önümüzdeki 3 Ay</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Durum</label>
                            <select value={ipoStatusFilter} onChange={(e) => { const v = e.target.value as any; setIpoStatusFilter(v); updateIpoUrlParams({ status: v }); }} className="w-full p-2 bg-white border border-purple-200/80 rounded-xl text-slate-700">
                                <option value="all">Tüm Durumlar</option>
                                <option value="upcoming">Yaklaşan</option>
                                <option value="active">Başvuru Açık</option>
                                <option value="completed">Tamamlanan</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Fiyat</label>
                            <select value={ipoPriceFilter} onChange={(e) => { const v = e.target.value as any; setIpoPriceFilter(v); updateIpoUrlParams({ price: v }); }} className="w-full p-2 bg-white border border-purple-200/80 rounded-xl text-slate-700">
                                <option value="all">Tüm Fiyatlar</option>
                                <option value="0-25">0 – 25 TL</option>
                                <option value="25-50">25 – 50 TL</option>
                                <option value="50-100">50 – 100 TL</option>
                                <option value="100plus">100 TL ve Üzeri</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Portföy</label>
                            <button onClick={() => { const v = !ipoPortfolioOnly; setIpoPortfolioOnly(v); updateIpoUrlParams({ portfolio: v }); }} className={`w-full p-2 rounded-xl border transition-all flex items-center justify-center gap-1.5 ${ipoPortfolioOnly ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-700 border-purple-200/80'}`}>
                                <Briefcase className="w-3.5 h-3.5" />
                                <span>Portföyümdekiler</span>
                            </button>
                        </div>
                        <div className="col-span-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Sıralama</label>
                            <select value={ipoSort} onChange={(e) => { const v = e.target.value as any; setIpoSort(v); updateIpoUrlParams({ sort: v }); }} className="w-full p-2 bg-white border border-purple-200/80 rounded-xl text-slate-700">
                                <option value="date-asc">En Yakın Tarih</option>
                                <option value="date-desc">En Uzak Tarih</option>
                                <option value="price-asc">En Düşük Fiyat</option>
                                <option value="price-desc">En Yüksek Fiyat</option>
                                <option value="name-asc">Şirket (A-Z)</option>
                                <option value="name-desc">Şirket (Z-A)</option>
                            </select>
                        </div>
                    </div>

                    {ipoActiveChips.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-purple-100/60">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase">Aktif Filtreler:</span>
                            {ipoActiveChips.map(chip => (
                                <span key={chip.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black bg-purple-100/80 text-purple-900 border border-purple-200">
                                    <span>{chip.label}</span>
                                    <button onClick={chip.clear} className="hover:bg-purple-200/80 rounded-full p-0.5"><X className="w-3 h-3 text-purple-800" /></button>
                                </span>
                            ))}
                            <button onClick={clearAllIpoFilters} className="text-xs font-extrabold text-rose-600 hover:underline ml-2">Filtreleri Temizle</button>
                        </div>
                    )}

                    <div className="pt-2">
                        <span className="text-xs font-black text-[#00008B] block mb-3">Toplam {filteredIpos.length} Halka Arz Kaydı</span>
                        {loading ? (
                            <div className="py-8 text-center text-xs font-bold text-slate-400">Yükleniyor...</div>
                        ) : filteredIpos.length === 0 ? (
                            <div className="py-12 bg-white rounded-2xl border border-dashed border-purple-200 flex flex-col items-center justify-center gap-2 text-center">
                                <Clock className="w-8 h-8 text-purple-300" />
                                <p className="text-sm font-black text-slate-700">Sonuç bulunamadı</p>
                                <button onClick={clearAllIpoFilters} className="px-4 py-2 text-xs font-black text-white bg-purple-600 rounded-xl">Filtreleri Temizle</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredIpos.map((item, idx) => (
                                    <div key={idx} className="p-4 rounded-2xl bg-white border border-purple-100 flex flex-col justify-between space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <span className="text-xs font-black text-[#00008B] block">{item.symbol}</span>
                                                <span className="text-[11px] font-bold text-slate-500 line-clamp-1">{item.companyName}</span>
                                            </div>
                                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md border bg-purple-50 text-purple-700 border-purple-200">
                                                {item.status || 'Talep Toplama'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ================================================= */}
            {/* EKONOMİK TAKVİM GELİŞMİŞ FİLTRELEME PANENİ */}
            {/* ================================================= */}
            {activeFilter === 'economic' && (
                <div className="bg-gradient-to-b from-amber-50/60 via-white to-white border border-amber-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-amber-100/60">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                                <Globe2 className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="text-base font-black text-[#00008B]">Ekonomik Takvim ve Filtreleme</h2>
                                <p className="text-[11px] font-bold text-slate-400">Veri adına, ülkeye, önem seviyesine ve açıklama durumuna göre makroekonomik arama yapın</p>
                            </div>
                        </div>

                        <div className="relative w-full md:w-80">
                            <Search className="w-4 h-4 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={ecoSearch}
                                onChange={(e) => { setEcoSearch(e.target.value); updateEconomicUrlParams({ search: e.target.value }); }}
                                placeholder="Veri Adı, Ülke veya Para Birimi Ara (örn: Enflasyon, USD)..."
                                className="w-full pl-9 pr-8 py-2 text-xs font-bold text-slate-800 bg-white border border-amber-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-xs"
                            />
                            {ecoSearch && (
                                <button onClick={() => { setEcoSearch(''); updateEconomicUrlParams({ search: '' }); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs font-bold">
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Tarih</label>
                            <select value={ecoDateFilter} onChange={(e) => { const v = e.target.value as any; setEcoDateFilter(v); updateEconomicUrlParams({ date: v }); }} className="w-full p-2 bg-white border border-amber-200/80 rounded-xl text-slate-700">
                                <option value="all">Tüm Tarihler</option>
                                <option value="today">Bugün</option>
                                <option value="tomorrow">Yarın</option>
                                <option value="this-week">Bu Hafta</option>
                                <option value="this-month">Bu Ay</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Ülke / Bölge</label>
                            <select value={ecoCountryFilter} onChange={(e) => { const v = e.target.value as any; setEcoCountryFilter(v); updateEconomicUrlParams({ country: v }); }} className="w-full p-2 bg-white border border-amber-200/80 rounded-xl text-slate-700">
                                <option value="all">Tüm Ülkeler</option>
                                <option value="tr">Türkiye (TRY)</option>
                                <option value="us">ABD (USD)</option>
                                <option value="eu">Euro Bölgesi (EUR)</option>
                                <option value="uk">İngiltere (GBP)</option>
                                <option value="de">Almanya</option>
                                <option value="cn">Çin (CNY)</option>
                                <option value="jp">Japonya (JPY)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Önem Seviyesi</label>
                            <select value={ecoImportanceFilter} onChange={(e) => { const v = e.target.value as any; setEcoImportanceFilter(v); updateEconomicUrlParams({ importance: v }); }} className="w-full p-2 bg-white border border-amber-200/80 rounded-xl text-slate-700">
                                <option value="all">Tüm Önem Düzeyleri</option>
                                <option value="high">Yüksek Önem</option>
                                <option value="medium">Orta Önem</option>
                                <option value="low">Düşük Önem</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Durum</label>
                            <select value={ecoStatusFilter} onChange={(e) => { const v = e.target.value as any; setEcoStatusFilter(v); updateEconomicUrlParams({ status: v }); }} className="w-full p-2 bg-white border border-amber-200/80 rounded-xl text-slate-700">
                                <option value="all">Tüm Durumlar</option>
                                <option value="pending">Bekleniyor</option>
                                <option value="announced">Açıklandı</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Sıralama</label>
                            <select value={ecoSort} onChange={(e) => { const v = e.target.value as any; setEcoSort(v); updateEconomicUrlParams({ sort: v }); }} className="w-full p-2 bg-white border border-amber-200/80 rounded-xl text-slate-700">
                                <option value="date-asc">En Yakın Tarih</option>
                                <option value="importance-desc">Önem: Yüksek → Düşük</option>
                                <option value="name-asc">Veri Adı (A-Z)</option>
                            </select>
                        </div>
                    </div>

                    {ecoActiveChips.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-amber-100/60">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase">Aktif Filtreler:</span>
                            {ecoActiveChips.map(chip => (
                                <span key={chip.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black bg-amber-100/80 text-amber-900 border border-amber-200">
                                    <span>{chip.label}</span>
                                    <button onClick={chip.clear} className="hover:bg-amber-200/80 rounded-full p-0.5"><X className="w-3 h-3 text-amber-800" /></button>
                                </span>
                            ))}
                            <button onClick={clearAllEconomicFilters} className="text-xs font-extrabold text-rose-600 hover:underline ml-2">Filtreleri Temizle</button>
                        </div>
                    )}

                    <div className="pt-2">
                        <span className="text-xs font-black text-[#00008B] block mb-3">Toplam {filteredEconomicEvents.length} Ekonomik Veri Kaydı</span>
                        {loading ? (
                            <div className="py-8 text-center text-xs font-bold text-slate-400">Yükleniyor...</div>
                        ) : filteredEconomicEvents.length === 0 ? (
                            <div className="py-12 bg-white rounded-2xl border border-dashed border-amber-200 flex flex-col items-center justify-center gap-2 text-center">
                                <Clock className="w-8 h-8 text-amber-300" />
                                <p className="text-sm font-black text-slate-700">Sonuç bulunamadı</p>
                                <button onClick={clearAllEconomicFilters} className="px-4 py-2 text-xs font-black text-white bg-amber-600 rounded-xl">Filtreleri Temizle</button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto scrollbar-none bg-white rounded-2xl border border-amber-100 p-2">
                                <table className="w-full text-left border-collapse text-xs font-bold">
                                    <thead>
                                        <tr className="border-b border-amber-100 text-[10px] font-black text-slate-400 uppercase">
                                            <th className="py-2.5 px-3">Tarih / Saat</th>
                                            <th className="py-2.5 px-3">Ülke</th>
                                            <th className="py-2.5 px-3">Veri</th>
                                            <th className="py-2.5 px-3">Önceki</th>
                                            <th className="py-2.5 px-3">Beklenti</th>
                                            <th className="py-2.5 px-3">Açıklanan</th>
                                            <th className="py-2.5 px-3">Önem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-amber-100/50">
                                        {filteredEconomicEvents.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-amber-50/40">
                                                <td className="py-2.5 px-3 text-[#00008B]">{item.dateFormatted || 'Bugün'} {item.time || '15:30'}</td>
                                                <td className="py-2.5 px-3 font-black text-slate-700">{item.country || 'USD'}</td>
                                                <td className="py-2.5 px-3 text-slate-800">{item.event}</td>
                                                <td className="py-2.5 px-3 text-slate-500">{item.previous || '—'}</td>
                                                <td className="py-2.5 px-3 text-slate-700">{item.forecast || '—'}</td>
                                                <td className="py-2.5 px-3 text-amber-700 font-black">{item.actual || '—'}</td>
                                                <td className="py-2.5 px-3">
                                                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border ${
                                                        item.impact === 'Yüksek' || item.impact === 3 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-100/80 text-amber-800 border-amber-200'
                                                    }`}>
                                                        {item.impact === 3 ? 'Yüksek' : 'Orta'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
                            <Link href="/dashboard/calendar?type=earnings" onClick={() => { setActiveFilter('earnings'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-[10px] font-extrabold text-blue-600 hover:underline">
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

                    <Link href="/dashboard/calendar?type=earnings" onClick={() => { setActiveFilter('earnings'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="mt-4 pt-3 border-t border-blue-100/60 flex items-center justify-center text-xs font-black text-[#00008B] hover:text-blue-600 transition-colors">
                        Tüm Bilançoları Gör →
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
                            <Link href="/dashboard/calendar?type=dividend" onClick={() => { setActiveFilter('dividends'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-[10px] font-extrabold text-emerald-600 hover:underline">
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

                    <Link href="/dashboard/calendar?type=dividend" onClick={() => { setActiveFilter('dividends'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="mt-4 pt-3 border-t border-emerald-100/60 flex items-center justify-center text-xs font-black text-[#00008B] hover:text-emerald-600 transition-colors">
                        Tüm Temettüleri Gör →
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
                            <Link href="/dashboard/calendar?type=ipo" onClick={() => { setActiveFilter('ipo'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-[10px] font-extrabold text-purple-600 hover:underline">
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

                    <Link href="/dashboard/calendar?type=ipo" onClick={() => { setActiveFilter('ipo'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="mt-4 pt-3 border-t border-purple-100/60 flex items-center justify-center text-xs font-black text-[#00008B] hover:text-purple-600 transition-colors">
                        Tüm Halka Arzları Gör →
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
                    <Link href="/dashboard/calendar?type=economic" onClick={() => { setActiveFilter('economic'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-xs font-extrabold text-amber-600 hover:underline">
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

                <Link href="/dashboard/calendar?type=economic" onClick={() => { setActiveFilter('economic'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="mt-4 pt-3 border-t border-amber-100/60 flex items-center justify-center text-xs font-black text-[#00008B] hover:text-amber-600 transition-colors">
                    Tüm Ekonomik Verileri Gör →
                </Link>
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
                        <Link href="/dashboard/calendar?type=earnings" onClick={() => { setActiveFilter('earnings'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 backdrop-blur-md cursor-pointer hover:bg-blue-500/20 transition-all block">
                            <span className="text-[10px] font-bold text-blue-300 uppercase block mb-1">Bilanço</span>
                            <span className="text-lg font-black text-blue-400 block">{earnings.length || 5} Şirket</span>
                            <span className="text-[9px] text-blue-200/60">Yaklaşan Sonuçlar</span>
                        </Link>

                        <Link href="/dashboard/calendar?type=dividend" onClick={() => { setActiveFilter('dividends'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 backdrop-blur-md cursor-pointer hover:bg-emerald-500/20 transition-all block">
                            <span className="text-[10px] font-bold text-emerald-300 uppercase block mb-1">Temettü</span>
                            <span className="text-lg font-black text-emerald-400 block">{dividends.length || 4} Ödeme</span>
                            <span className="text-[9px] text-emerald-200/60">Açıklanan Hak Hakediş</span>
                        </Link>

                        <Link href="/dashboard/calendar?type=ipo" onClick={() => { setActiveFilter('ipo'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 backdrop-blur-md cursor-pointer hover:bg-purple-500/20 transition-all block">
                            <span className="text-[10px] font-bold text-purple-300 uppercase block mb-1">Halka Arz</span>
                            <span className="text-lg font-black text-purple-400 block">{ipos.length || 3} Talep Toplama</span>
                            <span className="text-[9px] text-purple-200/60">Aktif Başvuru</span>
                        </Link>

                        <Link href="/dashboard/calendar?type=economic" onClick={() => { setActiveFilter('economic'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 backdrop-blur-md cursor-pointer hover:bg-amber-500/20 transition-all block">
                            <span className="text-[10px] font-bold text-amber-300 uppercase block mb-1">Ekonomik Veri</span>
                            <span className="text-lg font-black text-amber-400 block">{economicEvents.length || 7} Önemli Veri</span>
                            <span className="text-[9px] text-amber-200/60">Makro Göstergeler</span>
                        </Link>
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
