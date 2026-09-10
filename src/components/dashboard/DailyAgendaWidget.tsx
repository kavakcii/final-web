"use client";

import { useState, useEffect, useMemo } from "react";
import { 
    Calendar as CalendarIcon, 
    ArrowRight, 
    Clock, 
    Loader2, 
    TrendingUp, 
    AlertCircle, 
    Building2, 
    Coins, 
    FileText, 
    Sparkles 
} from "lucide-react";
import Link from "next/link";

export interface DailyAgendaItem {
    id: string;
    category: 'all' | 'ipo' | 'dividends' | 'earnings' | 'news' | 'economic';
    categoryLabel: string;
    time: string;
    symbolOrCountry: string;
    title: string;
    badgeColor: string;
    impact?: 'low' | 'medium' | 'high' | 'critical';
    auxiliaryText?: string;
    link?: string;
    sortKey: string;
}

const CATEGORY_TABS = [
    { id: 'all', label: 'Tümü' },
    { id: 'ipo', label: 'Halka Arz' },
    { id: 'dividends', label: 'Temettü' },
    { id: 'earnings', label: 'Bilanço' },
    { id: 'news', label: 'Haber' },
    { id: 'economic', label: 'Ekonomik' }
] as const;

export function DailyAgendaWidget() {
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [loading, setLoading] = useState(true);

    // Raw datasets from existing endpoints
    const [economicData, setEconomicData] = useState<any[]>([]);
    const [earningsData, setEarningsData] = useState<any[]>([]);
    const [dividendsData, setDividendsData] = useState<any[]>([]);
    const [ipoData, setIpoData] = useState<any[]>([]);
    const [newsData, setNewsData] = useState<any[]>([]);

    useEffect(() => {
        let isMounted = true;

        async function fetchAgendaData() {
            setLoading(true);
            try {
                const [ecoRes, earnRes, divRes, ipoRes, newsRes] = await Promise.all([
                    fetch('/api/calendar').then(r => r.json()).catch(() => ({ data: [] })),
                    fetch('/api/halkarz-earnings').then(r => r.json()).catch(() => ({ data: [] })),
                    fetch('/api/halkarz-dividends').then(r => r.json()).catch(() => ({ data: [] })),
                    fetch('/api/halkarz-ipo').then(r => r.json()).catch(() => ({ data: [] })),
                    fetch('/api/news').then(r => r.json()).catch(() => ({ data: [] }))
                ]);

                if (isMounted) {
                    setEconomicData(Array.isArray(ecoRes.data) ? ecoRes.data : []);
                    setEarningsData(Array.isArray(earnRes.data) ? earnRes.data : []);
                    setDividendsData(Array.isArray(divRes.data) ? divRes.data : []);
                    setIpoData(Array.isArray(ipoRes.data) ? ipoRes.data : []);
                    setNewsData(Array.isArray(newsRes.data || newsRes.news) ? (newsRes.data || newsRes.news) : []);
                }
            } catch (err) {
                console.error("Daily agenda data load error:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchAgendaData();
        return () => { isMounted = false; };
    }, []);

    // Bugünün Tarihi (Format: 10.09.2026)
    const today = new Date();
    const todayFormattedDate = today.toLocaleDateString('tr-TR', {
        timeZone: 'Europe/Istanbul',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    // Mevcut verileri tek çatı altında ajanda formatında birleştirme
    const agendaItems = useMemo(() => {
        const unified: DailyAgendaItem[] = [];

        // 1. Ekonomik Takvim Olayları (Bugünün Verileri)
        economicData.forEach((item: any, idx: number) => {
            const isToday = item.dateFormatted === todayFormattedDate || item.isToday;
            if (isToday) {
                let aux = '';
                if (item.actual && item.actual !== '-' && item.actual !== 'Bekleniyor') {
                    aux = `Açıklanan: ${item.actual}`;
                } else if (item.forecast) {
                    aux = `Beklenti: ${item.forecast}`;
                } else if (item.previous) {
                    aux = `Önceki: ${item.previous}`;
                }

                unified.push({
                    id: `eco-${item.id || idx}`,
                    category: 'economic',
                    categoryLabel: 'Ekonomik',
                    time: item.time || '—',
                    symbolOrCountry: item.flag || item.country || '🌐',
                    title: item.event || 'Ekonomik Gelişme',
                    badgeColor: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
                    impact: item.impact,
                    auxiliaryText: aux,
                    link: item.id ? `/dashboard/economic-calendar/${item.id}` : '/dashboard/calendar?type=economic',
                    sortKey: item.time || '99:99'
                });
            }
        });

        // 2. Bilanço Olayları
        earningsData.forEach((item: any, idx: number) => {
            const isEarnToday = item.earningsDate === todayFormattedDate || (item.daysLeft !== undefined && item.daysLeft === 0);
            if (isEarnToday) {
                unified.push({
                    id: `earn-${item.symbol || idx}`,
                    category: 'earnings',
                    categoryLabel: 'Bilanço',
                    time: '—',
                    symbolOrCountry: item.symbol || 'BİST',
                    title: `${item.companyName || item.symbol} Bilanço Açıklaması`,
                    badgeColor: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
                    link: '/dashboard/calendar?type=earnings',
                    sortKey: '88:00'
                });
            }
        });

        // 3. Temettü Olayları
        dividendsData.forEach((item: any, idx: number) => {
            const isDivToday = item.paymentDate === todayFormattedDate;
            if (isDivToday) {
                unified.push({
                    id: `div-${item.symbol || idx}`,
                    category: 'dividends',
                    categoryLabel: 'Temettü',
                    time: '—',
                    symbolOrCountry: item.symbol || 'BİST',
                    title: `${item.companyName || item.symbol} Temettü Ödemesi (${item.netAmountFormatted || 'Net'})`,
                    badgeColor: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
                    auxiliaryText: item.netAmountFormatted ? `Hisse Başı: ${item.netAmountFormatted}` : undefined,
                    link: '/dashboard/calendar?type=dividend',
                    sortKey: '88:10'
                });
            }
        });

        // 4. Halka Arz Olayları (Aktif & Talep Toplama)
        ipoData.forEach((item: any, idx: number) => {
            const isActive = item.status === 'Talep Toplama' || item.status === 'İşlem Görecek' || idx < 2;
            if (isActive) {
                unified.push({
                    id: `ipo-${item.id || idx}`,
                    category: 'ipo',
                    categoryLabel: 'Halka Arz',
                    time: '—',
                    symbolOrCountry: item.symbol || 'IPO',
                    title: `${item.companyName || item.symbol} Halka Arz (${item.status || 'Talep Toplama'})`,
                    badgeColor: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
                    link: '/dashboard/calendar?type=ipo',
                    sortKey: '88:20'
                });
            }
        });

        // 5. Günün Önemli Haberleri / KAP
        newsData.slice(0, 5).forEach((item: any, idx: number) => {
            let newsTime = '—';
            if (item.pubDate) {
                const dateObj = new Date(item.pubDate);
                if (!isNaN(dateObj.getTime())) {
                    newsTime = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                }
            }

            const symbol = (item.tickers && item.tickers[0]) ? item.tickers[0] : (item.symbol || 'KAP');

            unified.push({
                id: `news-${item.id || idx}`,
                category: 'news',
                categoryLabel: 'Haber',
                time: newsTime,
                symbolOrCountry: symbol,
                title: item.title || 'Piyasa Gelişmesi',
                badgeColor: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
                link: '/dashboard/news',
                sortKey: newsTime !== '—' ? newsTime : '90:00'
            });
        });

        // Kronolojik sıralama: Saati olanlar önce, ardından diğer gelişmeler
        return unified.sort((a, b) => {
            if (a.time !== '—' && b.time !== '—') {
                return a.time.localeCompare(b.time);
            }
            if (a.time !== '—') return -1;
            if (b.time !== '—') return 1;
            return a.sortKey.localeCompare(b.sortKey);
        });
    }, [economicData, earningsData, dividendsData, ipoData, newsData, todayFormattedDate]);

    // Seçili sekmeye göre filtreleme
    const filteredItems = useMemo(() => {
        if (activeCategory === 'all') return agendaItems;
        return agendaItems.filter(item => item.category === activeCategory);
    }, [agendaItems, activeCategory]);

    // Etki sinyal barları (Ekonomik veriler için)
    const renderImpactBars = (impact?: string) => {
        if (!impact) return null;
        const isHigh = impact === 'high' || impact === 'critical';
        const isMedium = impact === 'medium';

        return (
            <div className="flex items-end gap-[2px] h-3 w-3 shrink-0" title={isHigh ? "Yüksek Etki" : (isMedium ? "Orta Etki" : "Düşük Etki")}>
                <div className={`w-[2.5px] rounded-xs ${isHigh || isMedium ? 'h-1.5 bg-white' : 'h-1 bg-white/20'}`} />
                <div className={`w-[2.5px] rounded-xs ${isHigh || isMedium ? 'h-2 bg-white' : 'h-1 bg-white/20'}`} />
                <div className={`w-[2.5px] rounded-xs ${isHigh ? 'h-3 bg-white' : 'h-1 bg-white/20'}`} />
            </div>
        );
    };

    return (
        <div className="bg-[#0b192c] text-white border border-[#1a2f4c] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg shadow-black/20 flex flex-col justify-between min-h-[380px] h-full group relative overflow-hidden">
            {/* Arka Plan Hafif Ambient Parıltı */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* 1. Üst Başlık & Kategori Filtreleri */}
            <div className="relative z-10">
                {/* Başlık Satırı */}
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0">
                            <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-xs sm:text-[13px] font-bold text-white tracking-tight">
                                Günlük Ajanda
                            </h3>
                            <span className="text-[11px] font-medium text-slate-400">
                                ({todayFormattedDate})
                            </span>
                        </div>
                    </div>

                    <Link
                        href="/dashboard/calendar"
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors group/link"
                    >
                        <span>Tümünü Gör</span>
                        <ArrowRight className="w-3 h-3 transform group-hover/link:translate-x-0.5 transition-transform" />
                    </Link>
                </div>

                {/* Kategori Filtre Sekmeleri */}
                <div className="flex items-center gap-1 overflow-x-auto py-2.5 custom-scrollbar">
                    {CATEGORY_TABS.map((tab) => {
                        const isActive = activeCategory === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveCategory(tab.id)}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all shrink-0 ${
                                    isActive
                                        ? "bg-blue-600 text-white shadow-xs"
                                        : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2. Ajanda Satırları (SAAT | ÜLKE / VARLIK | BAŞLIK | KATEGORİ) */}
            <div className="relative z-10 my-auto py-1">
                {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-center">
                        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                        <span className="text-xs font-medium text-slate-400">Günün gelişmeleri yükleniyor...</span>
                    </div>
                ) : filteredItems.length > 0 ? (
                    <div className="divide-y divide-white/[0.06] space-y-0.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                        {filteredItems.slice(0, 5).map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between gap-2.5 py-2 px-1 hover:bg-white/[0.04] rounded-lg transition-colors group/item"
                            >
                                {/* Sol: Saat + Ülke / Varlık */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs font-mono font-bold text-slate-300 w-11 shrink-0">
                                        {item.time}
                                    </span>
                                    <span className="text-xs font-bold text-white px-1.5 py-0.5 rounded bg-white/[0.08] border border-white/[0.05] shrink-0 min-w-[28px] text-center">
                                        {item.symbolOrCountry}
                                    </span>
                                </div>

                                {/* Orta: Başlık ve Yardımcı Değer */}
                                <div className="flex-1 min-w-0 pr-2">
                                    <div className="text-xs font-medium text-slate-200 truncate group-hover/item:text-white transition-colors">
                                        {item.title}
                                    </div>
                                    {item.auxiliaryText && (
                                        <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                                            {item.auxiliaryText}
                                        </div>
                                    )}
                                </div>

                                {/* Sağ: Etki + Kategori Badge */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {renderImpactBars(item.impact)}
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${item.badgeColor}`}>
                                        {item.categoryLabel}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Boş Durum (Empty State) */
                    <div className="py-10 flex flex-col items-center justify-center text-center gap-1.5 px-4">
                        <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-400 mb-1">
                            <AlertCircle className="w-4 h-4 text-slate-400" />
                        </div>
                        <p className="text-xs font-bold text-slate-300">
                            Bugün bu kategoride planlanmış bir gelişme bulunmuyor.
                        </p>
                        <p className="text-[10px] text-slate-400 max-w-[240px]">
                            Gelecek günlerin takvimi ve tüm şirket olayları için takvim sayfasına göz atabilirsiniz.
                        </p>
                    </div>
                )}
            </div>

            {/* 3. Alt Bilgi & Yönlendirme */}
            <div className="relative z-10 pt-2.5 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[11px]">Bugünün piyasa ve şirket gelişmeleri</span>
                </div>

                <Link
                    href="/dashboard/calendar"
                    className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
                >
                    <span>Tüm Takvim</span>
                    <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
        </div>
    );
}
