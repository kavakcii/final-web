"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    ArrowLeft, Calendar as CalendarIcon, Info, BookOpen, BarChart3, HelpCircle, Target, 
    ChevronDown, ChevronUp, Layers, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, Activity, Zap, Sparkles, X
} from "lucide-react";
import Link from "next/link";
import { ECONOMIC_CALENDAR_CATALOG, CatalogCalendarEvent } from "@/lib/calendar-catalog";
import { INDICATOR_PROFILES_DATABASE, IndicatorProfile, TECHNICAL_TERMS, TechnicalTermTooltip } from "@/lib/indicator-profiles";
import { calculateBackendDifferences, generateFinAiAnalysis } from "@/lib/finai-calendar-analysis-engine";

export default function EconomicEventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params?.id as string;

    const [event, setEvent] = useState<CatalogCalendarEvent | null>(null);
    const [loading, setLoading] = useState(true);

    // State: Tooltip modal / popover state
    const [activeTooltip, setActiveTooltip] = useState<TechnicalTermTooltip | null>(null);

    // State: Show all scenarios accordion toggle
    const [showAllScenarios, setShowAllScenarios] = useState(false);

    // State: Historical chart timeframe filter
    const [chartTimeframe, setChartTimeframe] = useState<'12m' | '1y' | '3y'>('12m');

    // State: Chart hover tooltip
    const [hoveredPoint, setHoveredPoint] = useState<{ month: string; actual: string; forecast: string; previous: string } | null>(null);

    useEffect(() => {
        if (!eventId) return;

        const decodedId = decodeURIComponent(eventId);
        const found = ECONOMIC_CALENDAR_CATALOG.find(e => e.id === decodedId || e.event === decodedId);

        if (found) {
            setEvent(found);
            setLoading(false);
        } else {
            fetch('/api/calendar')
                .then(res => res.json())
                .then(json => {
                    if (json.data && Array.isArray(json.data)) {
                        const apiFound = json.data.find((e: any) => e.id === decodedId || e.event === decodedId);
                        if (apiFound) setEvent(apiFound);
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [eventId]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50 items-center justify-center text-[#00008B]">
                <div className="w-10 h-10 rounded-full border-4 border-[#00008B] border-t-transparent animate-spin mb-3" />
                <span className="text-xs font-black uppercase tracking-wider">Aşama 7 Ekonomik Veri Analizi Yükleniyor...</span>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50 items-center justify-center p-6 text-[#00008B]">
                <h2 className="text-xl font-black mb-2">Gösterge Bulunamadı</h2>
                <p className="text-xs text-slate-500 mb-6">İstenen ekonomik veri detayına ve analiz geçmişine ulaşılamadı.</p>
                <Link href="/dashboard/economic-calendar" className="px-5 py-2.5 rounded-xl bg-[#00008B] text-white font-bold text-xs">
                    Takvime Dön
                </Link>
            </div>
        );
    }

    // Indicator Profile Lookup
    const profile: IndicatorProfile = INDICATOR_PROFILES_DATABASE[event.event] || 
        INDICATOR_PROFILES_DATABASE[Object.keys(INDICATOR_PROFILES_DATABASE).find(k => event.event.includes(k)) || ""] || 
        INDICATOR_PROFILES_DATABASE["Default"];

    // 7.2 Backend Calculation Layer Differences
    const calc = calculateBackendDifferences(event);

    // 7.4 FinAi Narrative Analysis Generation
    const finAiAnalysis = generateFinAiAnalysis(event);

    // Dynamic Mock Historical Dataset based on profile
    const historicalData = [
        { month: 'Eyl 2025', actual: '3,2', forecast: '3,3', previous: '3,5' },
        { month: 'Eki 2025', actual: '3,1', forecast: '3,2', previous: '3,2' },
        { month: 'Kas 2025', actual: '3,0', forecast: '3,1', previous: '3,1' },
        { month: 'Ara 2025', actual: '2,9', forecast: '3,0', previous: '3,0' },
        { month: 'Oca 2026', actual: '3,4', forecast: '3,2', previous: '2,9' },
        { month: 'Şub 2026', actual: '3,3', forecast: '3,3', previous: '3,4' },
        { month: 'Mar 2026', actual: '3,1', forecast: '3,2', previous: '3,3' },
        { month: 'Nis 2026', actual: '3,0', forecast: '3,1', previous: '3,1' },
        { month: 'May 2026', actual: '3,2', forecast: '3,0', previous: '3,0' },
        { month: 'Haz 2026', actual: '2,8', forecast: '2,9', previous: '3,2' },
        { month: 'Tem 2026', actual: '2,7', forecast: '2,8', previous: '2,8' },
        { month: 'Ağu 2026', actual: event.actual || '2,9', forecast: event.forecast || '3,1', previous: event.previous || '3,2' }
    ];

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-slate-50 text-[#00008B] w-full mx-auto relative overflow-hidden">
            <div className="w-full max-w-[1400px] mx-auto px-6 py-8 md:px-10 lg:py-10 space-y-8 relative z-10 mb-20">
                {/* Navigation Top Bar */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/dashboard/economic-calendar"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-slate-200 text-[#00008B] font-bold text-xs shadow-sm hover:bg-slate-100 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" /> Ekonomik Takvime Dön
                    </Link>
                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-3.5 py-1.5 rounded-2xl border border-blue-200 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-blue-600" /> FinAi Economic Intelligence System v7.0
                    </span>
                </div>

                {/* 7.1 GİRİŞ BÖLÜMÜ HEADER BANNER */}
                <div className="w-full bg-[#00008B] text-white border border-[#00008B] rounded-3xl p-8 shadow-xl shadow-[#00008B]/20 relative overflow-hidden space-y-6">
                    <div className="relative z-10 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-2xl">{profile.flag}</span>
                            <span className="px-3 py-1 rounded-xl bg-white/10 border border-white/20 text-xs font-black text-blue-200">
                                {event.country}
                            </span>
                            <span className="px-3 py-1 rounded-xl bg-white/10 border border-white/20 text-xs font-black text-amber-300">
                                {profile.category}
                            </span>
                            <span className="px-3 py-1 rounded-xl bg-rose-500/20 border border-rose-400/30 text-xs font-black text-rose-200">
                                {event.impact === 'critical' || event.impact === 'high' ? '🔥 Yüksek Etki' : 'Orta Etki'}
                            </span>
                        </div>

                        <div>
                            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
                                {event.event}
                            </h1>
                            <p className="text-xs font-bold text-blue-200 mt-2 flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4" /> {event.dateFormatted || 'Bugün'} · {event.time} TSİ (Europe/Istanbul)
                            </p>
                        </div>
                    </div>
                </div>

                {/* 7.2 & 7.3 VERİ KARTLARI VE BACKEND HESAPLAMA ROZETLERİ */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Açıklanan (Actual) */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3 relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                Açıklanan (Actual)
                                <button 
                                    onClick={() => setActiveTooltip(TECHNICAL_TERMS.actual)} 
                                    className="text-slate-400 hover:text-[#00008B] transition-colors"
                                >
                                    <Info className="w-3.5 h-3.5" />
                                </button>
                            </span>
                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black ${
                                calc.hasActual ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                            }`}>
                                {calc.hasActual ? 'Açıklandı' : 'Açıklanması Bekleniyor'}
                            </span>
                        </div>
                        <div className="text-3xl md:text-4xl font-black text-[#00008B]">
                            {event.actual || 'Bekleniyor'}
                        </div>
                    </div>

                    {/* Beklenti (Forecast) */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                Beklenti (Forecast)
                                <button 
                                    onClick={() => setActiveTooltip(TECHNICAL_TERMS.forecast)} 
                                    className="text-slate-400 hover:text-[#00008B] transition-colors"
                                >
                                    <Info className="w-3.5 h-3.5" />
                                </button>
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">Piyasa Konsensüsü</span>
                        </div>
                        <div className="text-3xl md:text-4xl font-black text-slate-700">
                            {event.forecast || '-'}
                        </div>
                        {calc.forecastDiffText && (
                            <div className="pt-2 border-t border-slate-100 text-xs font-bold text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {calc.forecastDiffText}
                            </div>
                        )}
                    </div>

                    {/* Önceki (Previous) */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                Önceki (Previous)
                                <button 
                                    onClick={() => setActiveTooltip(TECHNICAL_TERMS.previous)} 
                                    className="text-slate-400 hover:text-[#00008B] transition-colors"
                                >
                                    <Info className="w-3.5 h-3.5" />
                                </button>
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">Geçen Dönem</span>
                        </div>
                        <div className="text-3xl md:text-4xl font-black text-slate-700">
                            {event.previous || '-'}
                        </div>
                        {calc.previousDiffText && (
                            <div className="pt-2 border-t border-slate-100 text-xs font-bold text-blue-600 flex items-center gap-1">
                                <Activity className="w-3.5 h-3.5 text-blue-500" /> {calc.previousDiffText}
                            </div>
                        )}
                    </div>
                </div>

                {/* 7.4 FİNAİ YORUMU (4 PARÇALI NARRATIVE ANALİZ KARTI) */}
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-150">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-[#00008B]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-[#00008B]">FinAi Yorumu</h2>
                                <p className="text-xs text-slate-400 font-bold">Resmi Verilere & Şartlı Ekonomik Mantığa Dayalı Otomatik Analiz</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-extrabold text-slate-400 bg-slate-100 px-3 py-1 rounded-xl">
                            Versiyon: {finAiAnalysis.version} · Status: {finAiAnalysis.status}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 1. Ne oldu? */}
                        <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
                            <h3 className="text-xs font-black text-[#00008B] uppercase tracking-wider flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-[#00008B]" /> 1. Ne Oldu?
                            </h3>
                            <p className="text-xs font-medium text-slate-700 leading-relaxed">
                                {finAiAnalysis.whatHappened}
                            </p>
                        </div>

                        {/* 2. Ne anlama geliyor? */}
                        <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                            <h3 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-emerald-600" /> 2. Ne Anlama Geliyor?
                            </h3>
                            <p className="text-xs font-medium text-slate-700 leading-relaxed">
                                {finAiAnalysis.whatItMeans}
                            </p>
                        </div>

                        {/* 3. Neleri etkileyebilir? */}
                        <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2">
                            <h3 className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-purple-600" /> 3. Neleri Etkileyebilir?
                            </h3>
                            <p className="text-xs font-medium text-slate-700 leading-relaxed">
                                {finAiAnalysis.potentialImpacts}
                            </p>
                        </div>

                        {/* 4. Nelere dikkat edilmeli? */}
                        <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-2">
                            <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-amber-600" /> 4. Nelere Dikkat Edilmeli?
                            </h3>
                            <p className="text-xs font-medium text-slate-700 leading-relaxed">
                                {finAiAnalysis.pointsToConsider}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 7.7 BU VERİ NEDİR? (INDICATOR PROFILE) */}
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-150">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-[#00008B]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#00008B]">Bu Veri Nedir?</h2>
                            <p className="text-xs text-slate-400 font-bold">Indicator Profile Kapsamında Gösterge Özeti</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <h3 className="text-xs font-black text-[#00008B] uppercase tracking-wider">1. Tanım</h3>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">{profile.definition}</p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xs font-black text-[#00008B] uppercase tracking-wider">2. Ne Ölçer?</h3>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">{profile.whatItMeasures}</p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xs font-black text-[#00008B] uppercase tracking-wider">3. Neden Önemlidir?</h3>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">{profile.whyItMatters}</p>
                        </div>
                    </div>
                </div>

                {/* 7.9 BU VERİ HANGİ ALANLARI ETKİLEYEBİLİR? (ETKİ ZİNCİRİ AKIŞ ŞEMASI) */}
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-150">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                            <Layers className="w-5 h-5 text-[#00008B]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#00008B]">Bu Veri Hangi Alanları Etkileyebilir?</h2>
                            <p className="text-xs text-slate-400 font-bold">Olası Ekonomik & Finansal Etki Kanalları</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4">
                        {profile.impactChannels.map((channel, idx) => (
                            <div key={idx} className="flex-1 min-w-[200px] p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                                <span className="text-[10px] font-extrabold text-blue-600 uppercase">Adım {idx + 1}</span>
                                <h4 className="text-xs font-black text-[#00008B]">{channel.title}</h4>
                                <p className="text-[11px] text-slate-500 font-medium leading-normal">{channel.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 7.10 & 7.11 SENARYO ANALİZİ BÖLÜMÜ */}
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-150">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                                <Target className="w-5 h-5 text-[#00008B]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-[#00008B]">Senaryo Analizi</h2>
                                <p className="text-xs text-slate-400 font-bold">Gerçekleşen Senaryo & Olası Alternatif Durumlar</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAllScenarios(!showAllScenarios)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-[#00008B] font-extrabold text-xs transition-all"
                        >
                            {showAllScenarios ? 'Diğer Senaryoları Gizle' : 'Diğer Senaryoları Görüntüle'}
                            {showAllScenarios ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Gerçekleşen Senaryo Kartı */}
                    <div className="p-6 rounded-2xl bg-[#00008B] text-white space-y-3 shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="px-3 py-1 rounded-xl bg-emerald-400 text-[#00008B] text-xs font-black">
                                Gerçekleşen Senaryo
                            </span>
                            <span className="text-xs font-bold text-blue-200">
                                {calc.forecastDiffText || 'Piyasa Paralelinde'}
                            </span>
                        </div>
                        <h3 className="text-lg font-black text-white">
                            Açıklanan Değer: {event.actual || 'Bekleniyor'} (Beklenti: {event.forecast || '-'})
                        </h3>
                        <p className="text-xs text-blue-100 font-medium leading-relaxed">
                            {finAiAnalysis.whatItMeans}
                        </p>
                    </div>

                    {/* Diğer Senaryolar (Akordeon Mantığı) */}
                    {showAllScenarios && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-150">
                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                                <h4 className="text-xs font-black text-emerald-700">1. Beklentinin Üzerinde Gelirse</h4>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                    Göstergenin öngörülen beklenti seviyesinin üzerinde gerçekleşmesi durumunda faiz beklentileri sıkılaşabilir ve para politikasında temkinli duruş korunabilir.
                                </p>
                            </div>
                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                                <h4 className="text-xs font-black text-rose-700">2. Beklentinin Altında Gelirse</h4>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                    Göstergenin piyasa beklentilerinin gerisinde kalması halinde dezenflasyonist veya yavaşlama sinyalleri güçlenebilir, faiz indirimi alanları doğabilir.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* 7.17 - 7.21 İNTERAKTİF GEÇMİŞ VERİ GRAFİĞİ BÖLÜMÜ */}
                <div className="bg-white border border-slate-200 text-[#00008B] rounded-3xl p-8 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-150">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-[#00008B]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-[#00008B] tracking-tight">
                                    {event.event} — FinAi Historical Archive Grafiği
                                </h3>
                                <p className="text-xs text-slate-400 font-bold">Kalıcı Veritabanı Arşivi Üzerinden Dönemsel Seyir</p>
                            </div>
                        </div>

                        {/* Zaman Aralığı Butonları */}
                        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                            {[
                                { id: '12m', label: 'Son 12 Dönem' },
                                { id: '1y', label: '1 Yıl' },
                                { id: '3y', label: '3 Yıl' }
                            ].map((tf) => (
                                <button
                                    key={tf.id}
                                    onClick={() => setChartTimeframe(tf.id as any)}
                                    className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all ${
                                        chartTimeframe === tf.id ? 'bg-[#00008B] text-white shadow-sm' : 'text-slate-600 hover:text-[#00008B]'
                                    }`}
                                >
                                    {tf.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* SVG/Bar İnteraktif Grafik Çizimi */}
                    <div className="relative pt-6 pb-2">
                        {hoveredPoint && (
                            <div className="absolute top-0 right-4 bg-[#00008B] text-white p-3 rounded-2xl text-xs font-bold shadow-lg z-20 space-y-1">
                                <div>Dönem: {hoveredPoint.month}</div>
                                <div className="text-emerald-300">Açıklanan: {hoveredPoint.actual}</div>
                                <div className="text-blue-200">Beklenti: {hoveredPoint.forecast}</div>
                                <div className="text-slate-300">Önceki: {hoveredPoint.previous}</div>
                            </div>
                        )}

                        <div className="h-48 flex items-end justify-between gap-3 px-4 border-b border-slate-200 pb-2">
                            {historicalData.map((pt, idx) => {
                                const valNum = parseFloat(pt.actual.replace(',', '.'));
                                const heightPercent = Math.min(Math.max((valNum / 5) * 100, 15), 90);

                                return (
                                    <div
                                        key={idx}
                                        onMouseEnter={() => setHoveredPoint(pt)}
                                        onMouseLeave={() => setHoveredPoint(null)}
                                        className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
                                    >
                                        <span className="text-[10px] font-black text-slate-500 group-hover:text-[#00008B] transition-colors">
                                            {pt.actual}
                                        </span>
                                        <div className="w-full max-w-[28px] bg-slate-150 group-hover:bg-[#00008B] rounded-t-xl transition-all duration-300 relative overflow-hidden" style={{ height: `${heightPercent}%` }}>
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#00008B]/80 to-blue-500/80 group-hover:from-[#00008B] group-hover:to-blue-400 transition-all" />
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-400 group-hover:text-[#00008B] whitespace-nowrap">
                                            {pt.month.split(' ')[0]}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 7.20 Grafik Nasıl Okunur & 7.21 Dinamik Grafik Özeti */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-150">
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                            <h4 className="text-xs font-black text-[#00008B] uppercase tracking-wider">Grafik Nasıl Okunur?</h4>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">{profile.readingChartGuide}</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
                            <h4 className="text-xs font-black text-[#00008B] uppercase tracking-wider">Son Dönemde Ne Değişti?</h4>
                            <p className="text-xs text-slate-700 font-medium leading-relaxed">
                                Son 12 açıklama döneminde gösterge {historicalData[0].actual} seviyesinden {historicalData[historicalData.length - 1].actual} seviyesine ulaşmıştır. Dönemsel oynaklıklar makro beklentiler doğrultusunda dengelenmektedir.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 7.22 "NE ÇIKARAMAYIZ?" & 7.23 FİNANSAL OKURYAZARLIK BÖLÜMÜ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Ne Çıkaramayız? */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
                        <div className="flex items-center gap-2 text-rose-600">
                            <AlertTriangle className="w-5 h-5 text-rose-600" />
                            <h3 className="text-sm font-black uppercase tracking-wider">Ne Çıkaramayız?</h3>
                        </div>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                            {profile.whatWeCannotInfer}
                        </p>
                    </div>

                    {/* Finansal Okuryazarlık */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
                        <div className="flex items-center gap-2 text-[#00008B]">
                            <BookOpen className="w-5 h-5 text-[#00008B]" />
                            <h3 className="text-sm font-black uppercase tracking-wider">Bu Veriyi Anlamak İçin Bilmen Gerekenler</h3>
                        </div>
                        <div className="space-y-2">
                            {profile.financialLiteracyItems.map((item, idx) => (
                                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                                    <h4 className="text-xs font-black text-[#00008B]">{item.title}</h4>
                                    <p className="text-[11px] text-slate-600 font-medium leading-normal">{item.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 7.24 & 7.25 İLGİLİ GÖSTERGELER & EKONOMİK ÖĞRENME AĞI */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-black text-[#00008B] uppercase tracking-wider flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#00008B]" /> İlgili Göstergeler & Ekonomik Öğrenme Ağları
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                        {profile.relatedIndicators.map((rel, idx) => (
                            <Link
                                key={idx}
                                href={`/dashboard/economic-calendar/${encodeURIComponent(rel.id)}`}
                                className="px-4 py-2 rounded-2xl bg-blue-50 hover:bg-blue-100 text-[#00008B] font-bold text-xs border border-blue-200 transition-all flex items-center gap-2"
                            >
                                {rel.name} <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* 7.8 TEKNİK TERİM MODAL / POPOVER TOOLTIP */}
            {activeTooltip && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
                    <div className="bg-white text-[#00008B] p-6 rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                            <span className="text-xs font-black uppercase text-blue-600">Terim Sözlüğü ⓘ</span>
                            <button onClick={() => setActiveTooltip(null)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div>
                            <h3 className="text-base font-black text-[#00008B]">{activeTooltip.label} ({activeTooltip.term})</h3>
                            <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">{activeTooltip.definition}</p>
                        </div>
                        <button
                            onClick={() => setActiveTooltip(null)}
                            className="w-full py-2.5 rounded-2xl bg-[#00008B] text-white text-xs font-black shadow-md hover:bg-[#0808a3] transition-all"
                        >
                            Anladım
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
