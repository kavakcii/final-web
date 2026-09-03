"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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
    ArrowUpRight,
    Briefcase,
    Loader2,
    CheckCircle2,
    Clock,
    AlertCircle
} from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";

export default function CalendarPage() {
    const { myAssets = [] } = useUser();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [viewDate, setViewDate] = useState<Date>(new Date());
    const [activeFilter, setActiveFilter] = useState<'all' | 'earnings' | 'dividends' | 'ipo' | 'economic'>('all');

    // Data States
    const [earnings, setEarnings] = useState<any[]>([]);
    const [dividends, setDividends] = useState<any[]>([]);
    const [ipos, setIpos] = useState<any[]>([]);
    const [economicEvents, setEconomicEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch Calendar Data
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

    // Month Navigation Controls
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

    // User's Portfolio Symbols
    const portfolioSymbols = useMemo(() => {
        return new Set((myAssets || []).map((a: any) => (a.symbol || '').toUpperCase().replace(/\.IS$/, '')));
    }, [myAssets]);

    // Portfolio Specific Events
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

    // Mini Calendar Grid Calculation
    const monthCalendarGrid = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        // Day of week index (Monday = 0, Sunday = 6)
        let firstDayIndex = firstDayOfMonth.getDay() - 1;
        if (firstDayIndex === -1) firstDayIndex = 6; // Sunday

        const daysInMonth = lastDayOfMonth.getDate();
        const grid: { date: Date; isCurrentMonth: boolean; dayNum: number }[] = [];

        // Previous month padding
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            grid.push({
                date: new Date(year, month - 1, prevMonthLastDay - i),
                isCurrentMonth: false,
                dayNum: prevMonthLastDay - i
            });
        }

        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            grid.push({
                date: new Date(year, month, d),
                isCurrentMonth: true,
                dayNum: d
            });
        }

        // Next month padding (to fill 35 or 42 cells)
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

    // Selected Day Agenda Events
    const selectedDayAgenda = useMemo(() => {
        const targetStr = selectedDate.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const targetParts = targetStr.split('.'); // [DD, MM, YYYY]
        const targetIsoDate = `${targetParts[2]}-${targetParts[1]}-${targetParts[0]}`;

        const agendaList: any[] = [];

        // Earnings
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

        // Dividends
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

        // IPOs
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

        // Economic Calendar
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
                    { id: 'all', label: 'Tümü', icon: Sparkles },
                    { id: 'earnings', label: 'Bilanço', icon: Building2 },
                    { id: 'dividends', label: 'Temettü', icon: Coins },
                    { id: 'ipo', label: 'Halka Arz', icon: TrendingUp },
                    { id: 'economic', label: 'Ekonomik', icon: Globe2 }
                ].map(tab => {
                    const TabIcon = tab.icon;
                    const isActive = activeFilter === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveFilter(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-2xl border transition-all whitespace-nowrap shadow-xs ${
                                isActive
                                    ? 'bg-[#00008B] text-white border-[#00008B] shadow-md shadow-[#00008B]/20 scale-102'
                                    : 'bg-white text-slate-600 border-slate-200/80 hover:border-[#00008B]/30 hover:text-[#00008B]'
                            }`}
                        >
                            <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#00008B]'}`} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

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
                                        {/* Dot Indicator */}
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
                                {selectedDayAgenda.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-all">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="text-xs font-black text-slate-500 w-10 shrink-0">{item.time}</span>
                                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border shrink-0 ${item.categoryColor}`}>
                                                {item.category}
                                            </span>
                                            <span className="text-xs font-black text-[#00008B] shrink-0">{item.symbol}</span>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                                                <p className="text-[10px] text-slate-400 truncate">{item.subtitle}</p>
                                            </div>
                                        </div>
                                        <button title="Hatırlatıcı Ekle" className="p-1.5 text-slate-400 hover:text-[#00008B] hover:bg-white rounded-lg transition-all shrink-0">
                                            <Bell className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* PORTFÖY İLE ENTEGRASYON: Portföyümdeki Şirketlerin Yaklaşan Olayları */}
            {myAssets.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
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
                                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
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
                
                {/* 1. BİLANÇO TAKVİMİ */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
                                    <Building2 className="w-4 h-4" />
                                </div>
                                <h3 className="text-sm font-black text-[#00008B]">Bilanço Takvimi</h3>
                            </div>
                            <Link href="/dashboard/portfolio?focus=earnings" className="text-[10px] font-extrabold text-blue-600 hover:underline">
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
                                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-100/60 text-blue-800 px-2 py-1 rounded-xl text-center min-w-[44px]">
                                                <span className="text-[9px] font-black uppercase block leading-tight">{item.earningsDate?.split('.')[1] || 'MAY'}</span>
                                                <span className="text-xs font-black block leading-tight">{item.earningsDate?.split('.')[0] || '20'}</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-[#00008B]">{item.symbol}</p>
                                                <p className="text-[10px] font-bold text-slate-500 truncate max-w-[130px]">{item.companyName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-lg border border-slate-200">2026/1Ç</span>
                                            <button title="Hatırlat" className="p-1 text-slate-400 hover:text-[#00008B]">
                                                <Bell className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Link href="/dashboard/portfolio?focus=earnings" className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center text-xs font-black text-[#00008B] hover:text-blue-600 transition-colors">
                        Tüm Bilanço Takvimi →
                    </Link>
                </div>

                {/* 2. TEMETTÜ TAKVİMİ */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                                    <Coins className="w-4 h-4" />
                                </div>
                                <h3 className="text-sm font-black text-[#00008B]">Temettü Takvimi</h3>
                            </div>
                            <Link href="/dashboard/portfolio?focus=dividends" className="text-[10px] font-extrabold text-emerald-600 hover:underline">
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
                                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-emerald-100/60 text-emerald-800 px-2 py-1 rounded-xl text-center min-w-[44px]">
                                                <span className="text-[9px] font-black uppercase block leading-tight">{item.paymentDate?.split('.')[1] || 'MAY'}</span>
                                                <span className="text-xs font-black block leading-tight">{item.paymentDate?.split('.')[0] || '19'}</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-[#00008B]">{item.symbol}</p>
                                                <p className="text-[10px] font-bold text-slate-500 truncate max-w-[120px]">{item.companyName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                                                {item.netAmountFormatted || '6,00 TL'}
                                            </span>
                                            <button title="Hatırlat" className="p-1 text-slate-400 hover:text-[#00008B]">
                                                <Bell className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Link href="/dashboard/portfolio?focus=dividends" className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center text-xs font-black text-[#00008B] hover:text-emerald-600 transition-colors">
                        Tüm Temettü Takvimi →
                    </Link>
                </div>

                {/* 3. HALKA ARZ TAKVİMİ (TIMELINE) */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                                <h3 className="text-sm font-black text-[#00008B]">Halka Arz Takvimi</h3>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">Timeline</span>
                        </div>

                        {loading ? (
                            <div className="py-8 text-center text-xs font-bold text-slate-400">Yükleniyor...</div>
                        ) : ipos.length === 0 ? (
                            <div className="py-8 text-center text-xs font-bold text-slate-400">Yaklaşan halka arz bulunmuyor.</div>
                        ) : (
                            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-purple-100">
                                {ipos.slice(0, 4).map((item, idx) => (
                                    <div key={idx} className="relative flex items-center justify-between">
                                        {/* Timeline Dot */}
                                        <div className="absolute -left-[19px] w-3 h-3 rounded-full bg-purple-600 ring-4 ring-purple-100" />
                                        
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-[#00008B]">{item.symbol}</span>
                                                <span className="text-[9px] font-extrabold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                                    {item.status}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-500 truncate max-w-[150px]">{item.companyName}</p>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                            {item.dateRange || 'Yakında'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Link href="/dashboard/data" className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center text-xs font-black text-[#00008B] hover:text-purple-600 transition-colors">
                        Tüm Halka Arz Takvimi →
                    </Link>
                </div>
            </div>

            {/* EKONOMİK TAKVİM TABLOSU */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
                            <Globe2 className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-[#00008B]">Ekonomik Takvim</h3>
                            <p className="text-[10px] font-bold text-slate-400">Küresel makroekonomik veriler ve faiz kararları</p>
                        </div>
                    </div>
                    <Link href="/dashboard/economic-calendar" className="text-xs font-extrabold text-amber-600 hover:underline">
                        Tümünü Gör →
                    </Link>
                </div>

                <div className="overflow-x-auto scrollbar-none">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                <th className="py-3 px-3">Tarih</th>
                                <th className="py-3 px-3">Saat</th>
                                <th className="py-3 px-3">Ülke</th>
                                <th className="py-3 px-3">Veri</th>
                                <th className="py-3 px-3">Önceki</th>
                                <th className="py-3 px-3">Beklenti</th>
                                <th className="py-3 px-3">Önem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-bold">
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
                                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
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
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
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
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Bilanço</span>
                            <span className="text-lg font-black text-blue-400 block">{earnings.length || 5} Şirket</span>
                            <span className="text-[9px] text-slate-400">Yaklaşan Sonuçlar</span>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Temettü</span>
                            <span className="text-lg font-black text-emerald-400 block">{dividends.length || 4} Ödeme</span>
                            <span className="text-[9px] text-slate-400">Açıklanan Hak Hakediş</span>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Halka Arz</span>
                            <span className="text-lg font-black text-purple-400 block">{ipos.length || 3} Talep Toplama</span>
                            <span className="text-[9px] text-slate-400">Aktif Başvuru</span>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Ekonomik Veri</span>
                            <span className="text-lg font-black text-amber-400 block">{economicEvents.length || 7} Önemli Veri</span>
                            <span className="text-[9px] text-slate-400">Makro Göstergeler</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
