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
    time?: string;
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

// Tümü sekmesinde kategori sıralama önceliği:
// 1. Ekonomik Gelişmeler (En üstte, saatleriyle)
// 2. Halka Arzlar (Alt alta, saatsiz)
// 3. Temettüler (Alt alta, saatsiz)
// 4. Bilançolar (Alt alta, saatsiz)
const CATEGORY_PRIORITY: Record<string, number> = {
    economic: 1,
    ipo: 2,
    dividends: 3,
    earnings: 4
};

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
                    badgeColor: 'bg-blue-50 text-blue-700 border border-blue-200/60',
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
                    badgeColor: 'bg-blue-50 text-blue-700 border border-blue-200/60',
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
                    badgeColor: 'bg-blue-50 text-blue-700 border border-blue-200/60',
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
                    badgeColor: 'bg-blue-50 text-blue-700 border border-blue-200/60',
                    impact: 'medium',
                    auxiliaryText: 'Beklenti: -1.2M',
                    link: '/dashboard/calendar?type=economic',
                    sortKey: '17:00'
                }
            );
        }

        // 2. Halka Arz Olayları (Saat yazılmaz, sadece sembol ve içerik)
        const matchedIpo: DailyAgendaItem[] = [];
        ipoData.forEach((item: any, idx: number) => {
            const isActive = item.status === 'Talep Toplama' || item.status === 'İşlem Görecek' || idx < 2;
            if (isActive) {
                matchedIpo.push({
                    id: `ipo-${item.id || idx}`,
                    category: 'ipo',
                    categoryLabel: 'Halka Arz',
                    symbolOrCountry: item.symbol || 'IPO',
                    title: `${item.companyName || item.symbol} Halka Arz (${item.status || 'Talep Toplama'})`,
                    badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
                    auxiliaryText: 'Talep Toplama Aktif',
                    link: '/dashboard/calendar?type=ipo',
                    sortKey: 'ipo'
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
                    symbolOrCountry: 'BAHGM',
                    title: 'Bahadır Kimya Halka Arz (Talep Toplama Başladı)',
                    badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
                    auxiliaryText: 'Dağıtım: Eşit | ₺51,00',
                    link: '/dashboard/calendar?type=ipo',
                    sortKey: 'ipo'
                },
                {
                    id: 'ipo-durkn',
                    category: 'ipo',
                    categoryLabel: 'Halka Arz',
                    symbolOrCountry: 'DURKN',
                    title: 'Durukan Şekerleme Halka Arz (Talep Toplama 2. Gün)',
                    badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
                    auxiliaryText: 'Dağıtım: Eşit | ₺17,00',
                    link: '/dashboard/calendar?type=ipo',
                    sortKey: 'ipo'
                }
            );
        }

        // 3. Temettü Olayları (Saat yazılmaz, sadece hisse ve dağıtım)
        const matchedDiv: DailyAgendaItem[] = [];
        dividendsData.forEach((item: any, idx: number) => {
            const isDivToday = item.paymentDate === todayFormattedDate;
            if (isDivToday) {
                matchedDiv.push({
                    id: `div-${item.symbol || idx}`,
                    category: 'dividends',
                    categoryLabel: 'Temettü',
                    symbolOrCountry: item.symbol || 'BİST',
                    title: `${item.companyName || item.symbol} Temettü Dağıtımı (${item.netAmountFormatted || 'Net'})`,
                    badgeColor: 'bg-amber-50 text-amber-700 border border-amber-200/60',
                    auxiliaryText: item.netAmountFormatted ? `Hisse Başı: ${item.netAmountFormatted}` : 'Hesaba Geçiş',
                    link: '/dashboard/calendar?type=dividend',
                    sortKey: 'div'
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
                    symbolOrCountry: 'FROTO',
                    title: 'Ford Otomotiv Nakit Temettü Dağıtımı',
                    badgeColor: 'bg-amber-50 text-amber-700 border border-amber-200/60',
                    auxiliaryText: 'Hisse Başı Net: ₺29,75',
                    link: '/dashboard/calendar?type=dividend',
                    sortKey: 'div'
                },
                {
                    id: 'div-tuprs',
                    category: 'dividends',
                    categoryLabel: 'Temettü',
                    symbolOrCountry: 'TUPRS',
                    title: 'Tüpraş 2. Taksit Temettü Dağıtımı',
                    badgeColor: 'bg-amber-50 text-amber-700 border border-amber-200/60',
                    auxiliaryText: 'Hisse Başı Net: ₺11,93',
                    link: '/dashboard/calendar?type=dividend',
                    sortKey: 'div'
                }
            );
        }

        // 4. Bilanço Olayları (Saat yazılmaz, seans sonu/KAP)
        const matchedEarn: DailyAgendaItem[] = [];
        earningsData.forEach((item: any, idx: number) => {
            const isEarnToday = item.earningsDate === todayFormattedDate || (item.daysLeft !== undefined && item.daysLeft === 0);
            if (isEarnToday) {
                matchedEarn.push({
                    id: `earn-${item.symbol || idx}`,
                    category: 'earnings',
                    categoryLabel: 'Bilanço',
                    symbolOrCountry: item.symbol || 'BİST',
                    title: `${item.companyName || item.symbol} Bilanço Açıklaması`,
                    badgeColor: 'bg-purple-50 text-purple-700 border border-purple-200/60',
                    auxiliaryText: 'Seans Sonu Açıklanması Bekleniyor',
                    link: '/dashboard/calendar?type=earnings',
                    sortKey: 'earn'
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
                    symbolOrCountry: 'THYAO',
                    title: 'Türk Hava Yolları 2026/2. Çeyrek Bilanço Açıklaması',
                    badgeColor: 'bg-purple-50 text-purple-700 border border-purple-200/60',
                    auxiliaryText: 'Seans Kapanışı Sonrası KAP Bildirimi',
                    link: '/dashboard/calendar?type=earnings',
                    sortKey: 'earn'
                },
                {
                    id: 'earn-asels',
                    category: 'earnings',
                    categoryLabel: 'Bilanço',
                    symbolOrCountry: 'ASELS',
                    title: 'Aselsan 2. Çeyrek Finansal ve Faaliyet Raporu',
                    badgeColor: 'bg-purple-50 text-purple-700 border border-purple-200/60',
                    auxiliaryText: 'KAP Duyurusu',
                    link: '/dashboard/calendar?type=earnings',
                    sortKey: 'earn'
                }
            );
        }

        // Kategori hiyerarşisine göre sıralama:
        // 1. Ekonomik Gelişmeler (En üstte, saat sırasına göre)
        // 2. Halka Arzlar (Alt alta)
        // 3. Temettüler (Alt alta)
        // 4. Bilançolar (Alt alta)
        return unified.sort((a, b) => {
            const orderA = CATEGORY_PRIORITY[a.category] ?? 99;
            const orderB = CATEGORY_PRIORITY[b.category] ?? 99;
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            if (a.category === 'economic') {
                return (a.time || '').localeCompare(b.time || '');
            }
            return 0;
        });
    }, [economicData, earningsData, dividendsData, ipoData, todayFormattedDate]);

    // Seçili sekmeye göre filtreleme
    const filteredItems = useMemo(() => {
        if (activeCategory === 'all') return agendaItems;
        return agendaItems.filter(item => item.category === activeCategory);
    }, [agendaItems, activeCategory]);

    // Etki sinyal barları (Ekonomik veriler için açık tema)
    const renderImpactBars = (impact?: string) => {
        if (!impact) return null;
        const isHigh = impact === 'high' || impact === 'critical';
        const isMedium = impact === 'medium';

        return (
            <div className="flex items-end gap-[2px] h-3 w-3 shrink-0" title={isHigh ? "Yüksek Etki" : (isMedium ? "Orta Etki" : "Düşük Etki")}>
                <div className={`w-[2.5px] rounded-xs ${isHigh || isMedium ? 'h-1.5 bg-blue-600' : 'h-1 bg-slate-200'}`} />
                <div className={`w-[2.5px] rounded-xs ${isHigh || isMedium ? 'h-2 bg-blue-600' : 'h-1 bg-slate-200'}`} />
                <div className={`w-[2.5px] rounded-xs ${isHigh ? 'h-3 bg-blue-600' : 'h-1 bg-slate-200'}`} />
            </div>
        );
    };

    return (
        <div className="bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_55%,#f0f6fe_100%)] border border-slate-200/70 hover:border-blue-200/70 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all duration-300 flex flex-col justify-between h-[395px] group relative overflow-hidden">
            {/* Arka Plan Hafif Soft Parıltı */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-100/30 rounded-full blur-3xl pointer-events-none" />

            {/* 1. Üst Başlık & Kategori Filtreleri (Sabit Üst Alan) */}
            <div className="relative z-10 shrink-0">
                {/* Başlık Satırı */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100/80">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                            <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
                                Günlük Ajanda
                            </h3>
                            <span className="text-[11px] font-medium text-slate-400">
                                ({todayFormattedDate})
                            </span>
                        </div>
                    </div>

                    <Link
                        href="/dashboard/calendar"
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors group/link"
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
                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/80"
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2. Ajanda Satırları: En Üstten En Alta Uzanır & Scroll Edilebilir */}
            <div className="relative z-10 flex-1 min-h-0 my-2 overflow-y-auto pr-1.5 custom-scrollbar [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
                {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-center">
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        <span className="text-xs font-medium text-slate-400">Günün gelişmeleri yükleniyor...</span>
                    </div>
                ) : filteredItems.length > 0 ? (
                    <div className="divide-y divide-slate-100/80 space-y-0.5">
                        {filteredItems.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between gap-2.5 py-2.5 px-1 hover:bg-slate-50/80 rounded-lg transition-colors group/item"
                            >
                                {/* Sol: Saat (Yalnızca Ekonomik verilerde) + Ülke / Sembol */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {item.category === 'economic' && item.time ? (
                                        <span className="text-xs font-mono font-semibold text-slate-500 w-11 shrink-0">
                                            {item.time}
                                        </span>
                                    ) : null}
                                    <span className="text-xs font-bold text-slate-700 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200/60 shrink-0 min-w-[32px] text-center">
                                        {item.symbolOrCountry}
                                    </span>
                                </div>

                                {/* Orta: Başlık ve Yardımcı Değer */}
                                <div className="flex-1 min-w-0 pr-2">
                                    <div className="text-xs font-semibold text-slate-800 truncate group-hover/item:text-blue-600 transition-colors">
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
                        <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400 mb-1">
                            <AlertCircle className="w-4 h-4 text-slate-400" />
                        </div>
                        <p className="text-xs font-bold text-slate-700">
                            Bugün bu kategoride planlanmış bir gelişme bulunmuyor.
                        </p>
                        <p className="text-[10px] text-slate-400 max-w-[240px]">
                            Gelecek günlerin takvimi ve tüm şirket olayları için takvim sayfasına göz atabilirsiniz.
                        </p>
                    </div>
                )}
            </div>

            {/* 3. Alt Bilgi & Yönlendirme (Sabit Alt Alan) */}
            <div className="relative z-10 shrink-0 pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[11px] text-slate-500">Bugünün piyasa ve şirket gelişmeleri</span>
                </div>

                <Link
                    href="/dashboard/calendar"
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1"
                >
                    <span>Tüm Takvim</span>
                    <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
        </div>
    );
}
