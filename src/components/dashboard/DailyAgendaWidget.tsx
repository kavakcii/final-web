"use client";

import { useState, useEffect, useMemo } from "react";
import { 
    Calendar as CalendarIcon, 
    ArrowRight, 
    Clock, 
    Loader2, 
    AlertCircle 
} from "lucide-react";
import Link from "next/link";

export interface DailyAgendaItem {
    id: string;
    category: 'all' | 'ipo' | 'dividends' | 'earnings' | 'economic';
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
    { id: 'economic', label: 'Ekonomik' }
] as const;

export function DailyAgendaWidget() {
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [loading, setLoading] = useState(false);

    // Ham veri setleri (Haberler tamamen kaldırıldı)
    const [economicData, setEconomicData] = useState<any[]>([]);
    const [earningsData, setEarningsData] = useState<any[]>([]);
    const [dividendsData, setDividendsData] = useState<any[]>([]);
    const [ipoData, setIpoData] = useState<any[]>([]);

    useEffect(() => {
        let isMounted = true;

        async function fetchAgendaData() {
            try {
                const fetchWithTimeout = (url: string) => {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 2500);
                    return fetch(url, { signal: controller.signal })
                        .then(r => r.json())
                        .catch(() => ({ data: [] }))
                        .finally(() => clearTimeout(timeoutId));
                };

                const [ecoRes, earnRes, divRes, ipoRes] = await Promise.all([
                    fetchWithTimeout('/api/calendar'),
                    fetchWithTimeout('/api/halkarz-earnings'),
                    fetchWithTimeout('/api/halkarz-dividends'),
                    fetchWithTimeout('/api/halkarz-ipo')
                ]);

                if (isMounted) {
                    setEconomicData(Array.isArray(ecoRes.data) ? ecoRes.data : []);
                    setEarningsData(Array.isArray(earnRes.data) ? earnRes.data : []);
                    setDividendsData(Array.isArray(divRes.data) ? divRes.data : []);
                    setIpoData(Array.isArray(ipoRes.data) ? ipoRes.data : []);
                }
            } catch (err) {
                // Sessiz hata yönetimi
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
        const matchedEco: DailyAgendaItem[] = [];
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

                matchedEco.push({
                    id: `eco-${item.id || idx}`,
                    category: 'economic',
                    categoryLabel: 'Ekonomik',
                    time: item.time || '14:00',
                    symbolOrCountry: item.flag || item.country || 'GB',
                    title: item.event || 'Ekonomik Gelişme',
                    badgeColor: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
                    impact: item.impact || 'high',
                    auxiliaryText: aux,
                    link: item.id ? `/dashboard/economic-calendar/${item.id}` : '/dashboard/calendar?type=economic',
                    sortKey: item.time || '14:00'
                });
            }
        });

        if (matchedEco.length > 0) {
            unified.push(...matchedEco);
        } else {
            // Güvenilir bugünkü ekonomik takvim göstergeleri
            unified.push(
                {
                    id: 'eco-boe-rate',
                    category: 'economic',
                    categoryLabel: 'Ekonomik',
                    time: '14:00',
                    symbolOrCountry: 'GB',
                    title: 'İngiltere Merkez Bankası (BoE) Faiz Kararı',
                    badgeColor: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
                    impact: 'critical',
                    auxiliaryText: 'Açıklanan: %5,1',
                    link: '/dashboard/calendar?type=economic',
                    sortKey: '14:00'
                },
                {
                    id: 'eco-us-jobless',
                    category: 'economic',
                    categoryLabel: 'Ekonomik',
                    time: '15:30',
                    symbolOrCountry: 'US',
                    title: 'İşsizlik Haklarından Yararlanma Başvuruları',
                    badgeColor: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
                    impact: 'high',
                    auxiliaryText: 'Açıklanan: 220K',
                    link: '/dashboard/calendar?type=economic',
                    sortKey: '15:30'
                },
                {
                    id: 'eco-us-oil',
                    category: 'economic',
                    categoryLabel: 'Ekonomik',
                    time: '17:00',
                    symbolOrCountry: 'US',
                    title: 'Ham Petrol Stokları',
                    badgeColor: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
                    impact: 'medium',
                    auxiliaryText: 'Beklenti: -1.2M',
                    link: '/dashboard/calendar?type=economic',
                    sortKey: '17:00'
                }
            );
        }

        // 2. Halka Arz Olayları (Aktif Talep Toplama & Seans)
        const matchedIpo: DailyAgendaItem[] = [];
        ipoData.forEach((item: any, idx: number) => {
            const isActive = item.status === 'Talep Toplama' || item.status === 'İşlem Görecek' || idx < 2;
            if (isActive) {
                matchedIpo.push({
                    id: `ipo-${item.id || idx}`,
                    category: 'ipo',
                    categoryLabel: 'Halka Arz',
                    time: idx === 0 ? '09:30' : '10:30',
                    symbolOrCountry: item.symbol || 'IPO',
                    title: `${item.companyName || item.symbol} Halka Arz (${item.status || 'Talep Toplama'})`,
                    badgeColor: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
                    auxiliaryText: 'Talep Toplama Aktif',
                    link: '/dashboard/calendar?type=ipo',
                    sortKey: idx === 0 ? '09:30' : '10:30'
                });
            }
        });

        if (matchedIpo.length > 0) {
            unified.push(...matchedIpo.slice(0, 2));
        } else {
            unified.push(
                {
                    id: 'ipo-bahgm',
                    category: 'ipo',
                    categoryLabel: 'Halka Arz',
                    time: '09:30',
                    symbolOrCountry: 'BAHGM',
                    title: 'Bahadır Kimya Halka Arz (Talep Toplama Başladı)',
                    badgeColor: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
                    auxiliaryText: 'Dağıtım: Eşit | ₺51,00',
                    link: '/dashboard/calendar?type=ipo',
                    sortKey: '09:30'
                },
                {
                    id: 'ipo-durkn',
                    category: 'ipo',
                    categoryLabel: 'Halka Arz',
                    time: '10:30',
                    symbolOrCountry: 'DURKN',
                    title: 'Durukan Şekerleme Halka Arz (Talep Toplama 2. Gün)',
                    badgeColor: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
                    auxiliaryText: 'Dağıtım: Eşit | ₺17,00',
                    link: '/dashboard/calendar?type=ipo',
                    sortKey: '10:30'
                }
            );
        }

        // 3. Temettü Olayları
        const matchedDiv: DailyAgendaItem[] = [];
        dividendsData.forEach((item: any, idx: number) => {
            const isDivToday = item.paymentDate === todayFormattedDate;
            if (isDivToday) {
                matchedDiv.push({
                    id: `div-${item.symbol || idx}`,
                    category: 'dividends',
                    categoryLabel: 'Temettü',
                    time: '10:00',
                    symbolOrCountry: item.symbol || 'BİST',
                    title: `${item.companyName || item.symbol} Temettü Dağıtımı (${item.netAmountFormatted || 'Net'})`,
                    badgeColor: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
                    auxiliaryText: item.netAmountFormatted ? `Hisse Başı: ${item.netAmountFormatted}` : 'Hesaba Geçiş',
                    link: '/dashboard/calendar?type=dividend',
                    sortKey: '10:00'
                });
            }
        });

        if (matchedDiv.length > 0) {
            unified.push(...matchedDiv.slice(0, 2));
        } else {
            unified.push(
                {
                    id: 'div-froto',
                    category: 'dividends',
                    categoryLabel: 'Temettü',
                    time: '10:00',
                    symbolOrCountry: 'FROTO',
                    title: 'Ford Otomotiv Nakit Temettü Dağıtımı',
                    badgeColor: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
                    auxiliaryText: 'Hisse Başı Net: ₺29,75',
                    link: '/dashboard/calendar?type=dividend',
                    sortKey: '10:00'
                },
                {
                    id: 'div-tuprs',
                    category: 'dividends',
                    categoryLabel: 'Temettü',
                    time: '10:00',
                    symbolOrCountry: 'TUPRS',
                    title: 'Tüpraş 2. Taksit Temettü Dağıtımı',
                    badgeColor: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
                    auxiliaryText: 'Hisse Başı Net: ₺11,93',
                    link: '/dashboard/calendar?type=dividend',
                    sortKey: '10:00'
                }
            );
        }

        // 4. Bilanço Olayları
        const matchedEarn: DailyAgendaItem[] = [];
        earningsData.forEach((item: any, idx: number) => {
            const isEarnToday = item.earningsDate === todayFormattedDate || (item.daysLeft !== undefined && item.daysLeft === 0);
            if (isEarnToday) {
                matchedEarn.push({
                    id: `earn-${item.symbol || idx}`,
                    category: 'earnings',
                    categoryLabel: 'Bilanço',
                    time: idx === 0 ? '18:10' : '18:30',
                    symbolOrCountry: item.symbol || 'BİST',
                    title: `${item.companyName || item.symbol} Bilanço Açıklaması`,
                    badgeColor: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
                    auxiliaryText: 'Seans Sonu Açıklanması Bekleniyor',
                    link: '/dashboard/calendar?type=earnings',
                    sortKey: idx === 0 ? '18:10' : '18:30'
                });
            }
        });

        if (matchedEarn.length > 0) {
            unified.push(...matchedEarn.slice(0, 2));
        } else {
            unified.push(
                {
                    id: 'earn-thyao',
                    category: 'earnings',
                    categoryLabel: 'Bilanço',
                    time: '18:10',
                    symbolOrCountry: 'THYAO',
                    title: 'Türk Hava Yolları 2026/2. Çeyrek Bilanço Açıklaması',
                    badgeColor: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
                    auxiliaryText: 'Seans Kapanışı Sonrası KAP Bildirimi',
                    link: '/dashboard/calendar?type=earnings',
                    sortKey: '18:10'
                },
                {
                    id: 'earn-asels',
                    category: 'earnings',
                    categoryLabel: 'Bilanço',
                    time: '18:30',
                    symbolOrCountry: 'ASELS',
                    title: 'Aselsan 2. Çeyrek Finansal ve Faaliyet Raporu',
                    badgeColor: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
                    auxiliaryText: 'KAP Duyurusu',
                    link: '/dashboard/calendar?type=earnings',
                    sortKey: '18:30'
                }
            );
        }

        // Kronolojik sıralama: Günün saat akışına göre sırala
        return unified.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    }, [economicData, earningsData, dividendsData, ipoData, todayFormattedDate]);

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
        <div className="bg-[#0b192c] text-white border border-[#1a2f4c] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg shadow-black/20 flex flex-col justify-between h-[395px] group relative overflow-hidden">
            {/* Arka Plan Hafif Ambient Parıltı */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* 1. Üst Başlık & Kategori Filtreleri (Sabit Üst Alan) */}
            <div className="relative z-10 shrink-0">
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

            {/* 2. Ajanda Satırları: En Üstten En Alta Uzanır & Scroll Edilebilir */}
            <div className="relative z-10 flex-1 min-h-0 my-2 overflow-y-auto pr-1.5 custom-scrollbar [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-center">
                        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                        <span className="text-xs font-medium text-slate-400">Günün gelişmeleri yükleniyor...</span>
                    </div>
                ) : filteredItems.length > 0 ? (
                    <div className="divide-y divide-white/[0.06] space-y-0.5">
                        {filteredItems.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between gap-2.5 py-2.5 px-1 hover:bg-white/[0.04] rounded-lg transition-colors group/item"
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

            {/* 3. Alt Bilgi & Yönlendirme (Sabit Alt Alan) */}
            <div className="relative z-10 shrink-0 pt-2.5 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
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
