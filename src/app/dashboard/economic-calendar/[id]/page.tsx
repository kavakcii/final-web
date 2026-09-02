"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    ArrowLeft, Calendar as CalendarIcon, Info, BookOpen, BarChart3, Target, 
    ChevronDown, ChevronUp, Layers, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, Activity, Zap, Sparkles, X, Database
} from "lucide-react";
import Link from "next/link";
import { ECONOMIC_CALENDAR_CATALOG, CatalogCalendarEvent } from "@/lib/calendar-catalog";
import { INDICATOR_PROFILES_DATABASE, IndicatorProfile, TECHNICAL_TERMS, TechnicalTermTooltip } from "@/lib/indicator-profiles";
import { calculateBackendDifferences, generateFinAiAnalysis } from "@/lib/finai-calendar-analysis-engine";
import FollowIndicatorButton from "@/components/calendar/FollowIndicatorButton";

function toSlug(str: string): string {
    return str
        .toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function resolveCalendarEvent(rawId: string, list: CatalogCalendarEvent[]): CatalogCalendarEvent | null {
    if (!rawId || !list || list.length === 0) return null;

    const decoded = decodeURIComponent(rawId).trim();
    const cleanLower = decoded.toLowerCase();

    // 1. Exact Event ID Match
    const exactId = list.find(e => e.id === decoded || e.id === rawId);
    if (exactId) return exactId;

    // 2. Exact Event Name Match
    const exactName = list.find(e => e.event === decoded || e.event.toLowerCase() === cleanLower);
    if (exactName) return exactName;

    // 3. Match by Slugified Event Name or Slug ID
    const targetSlug = toSlug(decoded);
    const slugMatch = list.find(e => {
        const eSlug = toSlug(e.event);
        return eSlug === targetSlug || e.id.toLowerCase() === targetSlug;
    });
    if (slugMatch) return slugMatch;

    // 4. Parse Legacy Composite ID: ${country}_${eventName}_${date}
    const underscoreParts = decoded.split('_');
    if (underscoreParts.length >= 2) {
        const countryCandidate = underscoreParts[0].toUpperCase();
        const middleParts = underscoreParts.slice(1, underscoreParts.length - 1).join('_');
        const middleSlug = toSlug(middleParts);

        if (middleParts || middleSlug) {
            const compositeMatch = list.find(e => {
                const countryOk = !countryCandidate || e.country.toUpperCase() === countryCandidate;
                const nameOk = e.event === middleParts || 
                               e.event.toLowerCase() === middleParts.toLowerCase() ||
                               toSlug(e.event) === middleSlug;
                return countryOk && nameOk;
            });
            if (compositeMatch) return compositeMatch;
        }
    }

    // 5. Strict Substring Match for Long Log Strings
    const strictContains = list.find(e => {
        const eLower = e.event.toLowerCase();
        return cleanLower.includes(eLower) && (cleanLower.length - eLower.length) < 25;
    });
    if (strictContains) return strictContains;

    return null;
}

export default function EconomicEventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params?.id as string;

    const [event, setEvent] = useState<CatalogCalendarEvent | null>(null);
    const [loading, setLoading] = useState(true);

    // REAL HISTORICAL DATABASE RECORDS FROM SUPABASE
    const [realHistoryEvents, setRealHistoryEvents] = useState<CatalogCalendarEvent[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

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

        const catalogResolved = resolveCalendarEvent(eventId, ECONOMIC_CALENDAR_CATALOG);

        if (catalogResolved) {
            setEvent(catalogResolved);
            setLoading(false);
        } else {
            fetch('/api/calendar')
                .then(res => res.json())
                .then(json => {
                    if (json.data && Array.isArray(json.data)) {
                        const apiResolved = resolveCalendarEvent(eventId, json.data);
                        if (apiResolved) setEvent(apiResolved);
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [eventId]);

    // FETCH REAL HISTORICAL RECORDS FROM SUPABASE DATABASE
    useEffect(() => {
        if (!event) return;

        setLoadingHistory(true);
        const todayYear = new Date().getFullYear();
        const startYear = todayYear - 2;
        const startDate = `${startYear}-01-01`;
        const endDate = `${todayYear + 1}-12-31`;

        fetch(`/api/calendar?startDate=${startDate}&endDate=${endDate}`)
            .then(res => res.json())
            .then(json => {
                if (json.data && Array.isArray(json.data)) {
                    const matchingDbRecords = json.data.filter((item: any) => {
                        const nameMatch = item.event === event.event || item.event.includes(event.event) || event.event.includes(item.event);
                        const countryMatch = item.country === event.country;
                        const released = item.actual && item.actual !== 'Bekleniyor' && item.actual !== '-';
                        return nameMatch && countryMatch && released;
                    });
                    setRealHistoryEvents(matchingDbRecords);
                }
            })
            .catch(err => console.error("Real history query error:", err))
            .finally(() => setLoadingHistory(false));
    }, [event]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50 items-center justify-center text-[#00008B]">
                <div className="w-10 h-10 rounded-full border-4 border-[#00008B] border-t-transparent animate-spin mb-3" />
                <span className="text-xs font-black uppercase tracking-wider">Gösterge Analizi Yükleniyor...</span>
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

    const calc = calculateBackendDifferences(event);
    const finAiAnalysis = generateFinAiAnalysis(event);
    const hasEnoughRealData = realHistoryEvents.length >= 2;

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-slate-50 text-[#00008B] w-full mx-auto relative overflow-hidden">
            <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6 md:px-10 lg:py-8 space-y-6 relative z-10 mb-20">
                {/* Navigation Top Bar */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/dashboard/economic-calendar"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 text-[#00008B] font-bold text-xs shadow-sm hover:bg-slate-100 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" /> Ekonomik Takvime Dön
                    </Link>
                </div>

                {/* SADELEŞTİRİLMİŞ HEADER BANNER (TAKİP ET BUTONU EKLENDİ) */}
                <div className="w-full bg-[#00008B] text-white border border-[#00008B] rounded-3xl p-6 md:p-8 shadow-xl shadow-[#00008B]/20 relative overflow-hidden space-y-4">
                    <div className="relative z-10 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-blue-200 text-xs font-bold">
                                <span>{profile.flag}</span>
                                <span>{event.country}</span>
                                <span>·</span>
                                <span>{profile.category}</span>
                            </div>
                            <FollowIndicatorButton indicatorName={event.event} />
                        </div>

                        <div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-snug">
                                {event.event}
                            </h1>
                            <p className="text-xs font-bold text-blue-200 mt-1.5 flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4 text-blue-300" /> {event.dateFormatted || 'Bugün'} · {event.time} TSİ
                            </p>
                        </div>
                    </div>
                </div>

                {/* ACTUAL / FORECAST / PREVIOUS KARTLARI */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Actual */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                Açıklanan (Actual)
                                <button 
                                    onClick={() => setActiveTooltip(TECHNICAL_TERMS.actual)} 
                                    className="text-slate-400 hover:text-[#00008B] transition-colors"
                                >
                                    <Info className="w-3.5 h-3.5" />
                                </button>
                            </span>
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                                calc.hasActual ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                            }`}>
                                {calc.hasActual ? 'Açıklandı' : 'Bekleniyor'}
                            </span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-[#00008B]">
                            {event.actual || 'Bekleniyor'}
                        </div>
                    </div>

                    {/* Forecast */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                Beklenti (Forecast)
                                <button 
                                    onClick={() => setActiveTooltip(TECHNICAL_TERMS.forecast)} 
                                    className="text-slate-400 hover:text-[#00008B] transition-colors"
                                >
                                    <Info className="w-3.5 h-3.5" />
                                </button>
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">Piyasa Tahmini</span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-slate-700">
                            {event.forecast || '-'}
                        </div>
                        {calc.forecastDiffText && (
                            <div className="pt-2 border-t border-slate-100 text-xs font-bold text-blue-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> {calc.forecastDiffText}
                            </div>
                        )}
                    </div>

                    {/* Previous */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
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
                        <div className="text-2xl sm:text-3xl font-black text-slate-700">
                            {event.previous || '-'}
                        </div>
                        {calc.previousDiffText && (
                            <div className="pt-2 border-t border-slate-100 text-xs font-bold text-slate-600 flex items-center gap-1">
                                <Activity className="w-3.5 h-3.5 text-slate-500" /> {calc.previousDiffText}
                            </div>
                        )}
                    </div>
                </div>

                {/* FINAI INTELLIGENCE ANA BÖLÜMÜ (TEKNİK NİTELEMELER KALDIRILDI) */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-150">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-[#00008B]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#00008B] tracking-tight">FINAI INTELLIGENCE</h2>
                            <p className="text-xs text-slate-400 font-bold">
                                Bu verinin ne söylediğini, ne anlama geldiğini ve hangi koşullarda önem kazandığını açıklıyoruz.
                            </p>
                        </div>
                    </div>

                    {/* FINAI'NİN KISA DEĞERLENDİRMESİ */}
                    <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-2 shadow-md">
                        <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-400" /> FinAi'nin Kısa Değerlendirmesi
                        </h3>
                        <p className="text-xs text-slate-200 font-medium leading-relaxed">
                            {finAiAnalysis.shortExecutiveSummary}
                        </p>
                    </div>

                    {/* DÖRT PARÇALI ANALİZ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
                            <h4 className="text-xs font-black text-[#00008B] uppercase tracking-wider flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-[#00008B]" /> 01 — NE OLDU?
                            </h4>
                            <p className="text-xs font-medium text-slate-700 leading-relaxed">
                                {finAiAnalysis.whatHappened}
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                            <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-emerald-600" /> 02 — NE ANLAMA GELİYOR?
                            </h4>
                            <p className="text-xs font-medium text-slate-700 leading-relaxed">
                                {finAiAnalysis.whatItMeans}
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2">
                            <h4 className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-purple-600" /> 03 — NELERİ ETKİLEYEBİLİR?
                            </h4>
                            <p className="text-xs font-medium text-slate-700 leading-relaxed">
                                {finAiAnalysis.potentialImpacts}
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-2">
                            <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-amber-600" /> 04 — NELERE DİKKAT EDİLMELİ?
                            </h4>
                            <p className="text-xs font-medium text-slate-700 leading-relaxed">
                                {finAiAnalysis.pointsToConsider}
                            </p>
                        </div>
                    </div>
                </div>

                {/* BU VERİ NEDİR? */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-150">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-[#00008B]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#00008B]">Bu Veri Nedir?</h2>
                            <p className="text-xs text-slate-400 font-bold">Gösterge Özeti ve Yorumlama Mantığı</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                            <h3 className="text-xs font-black text-[#00008B] uppercase tracking-wider">1. Tanım</h3>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">{profile.definition}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                            <h3 className="text-xs font-black text-[#00008B] uppercase tracking-wider">2. Ne Ölçer?</h3>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">{profile.whatItMeasures}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                            <h3 className="text-xs font-black text-[#00008B] uppercase tracking-wider">3. Neden Önemlidir?</h3>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">{profile.whyItMatters}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
                            <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-blue-600" /> 4. Nasıl Yorumlanır?
                            </h3>
                            <p className="text-xs text-slate-700 font-medium leading-relaxed">{profile.howToInterpret}</p>
                        </div>
                    </div>
                </div>

                {/* EKONOMİK ETKİ ZİNCİRİ */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-150">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                            <Layers className="w-5 h-5 text-[#00008B]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#00008B]">Ekonomik Etki Zinciri</h2>
                            <p className="text-xs text-slate-400 font-bold">Veri Açıklamasından Varlık Fiyatlamalarına Neden-Sonuç Akışı</p>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row items-stretch justify-between gap-3">
                        {profile.impactChannels.map((channel, idx) => (
                            <div key={idx} className="flex-1 flex flex-col lg:flex-row items-center gap-3">
                                <div className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider block">
                                        {channel.step}
                                    </span>
                                    <h4 className="text-xs font-black text-[#00008B]">{channel.title}</h4>
                                    <p className="text-[11px] text-slate-500 font-medium leading-normal">{channel.desc}</p>
                                </div>
                                {idx < profile.impactChannels.length - 1 && (
                                    <span className="text-slate-300 font-black text-sm hidden lg:block">➔</span>
                                )}
                                {idx < profile.impactChannels.length - 1 && (
                                    <span className="text-slate-300 font-black text-sm lg:hidden">↓</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* SENARYO ANALİZİ */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
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

                    <div className="p-6 rounded-3xl bg-[#00008B] text-white space-y-4 shadow-lg">
                        <div className="flex items-center justify-between">
                            <span className="px-3 py-1 rounded-xl bg-emerald-400 text-[#00008B] text-xs font-black">
                                Gerçekleşen Senaryo
                            </span>
                            <span className="text-xs font-bold text-blue-200">
                                {calc.forecastDiffText || 'Piyasa Paralelinde'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-medium text-blue-100 pt-2 border-t border-blue-800">
                            <div>
                                <span className="text-[10px] text-blue-300 uppercase block font-bold">PİYASA BEKLENTİSİ</span>
                                <span className="text-sm font-black text-white">{event.forecast || '-'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-blue-300 uppercase block font-bold">GERÇEKLEŞEN VERİ</span>
                                <span className="text-sm font-black text-white">{event.actual || 'Bekleniyor'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-blue-300 uppercase block font-bold">OLASI EKONOMİK YANSIMA</span>
                                <span className="text-xs font-bold text-emerald-300">{finAiAnalysis.whatItMeans.slice(0, 80)}...</span>
                            </div>
                        </div>
                    </div>

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

                {/* HISTORICAL GRAPH — GERÇEK TARİHSEL VERİ GRAFİĞİ */}
                <div className="bg-white border border-slate-200 text-[#00008B] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-150">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                                <Database className="w-5 h-5 text-[#00008B]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-[#00008B] tracking-tight">
                                    FinAi Geçmiş Veri Grafiği
                                </h3>
                                <p className="text-xs text-slate-400 font-bold">Kalıcı Veritabanından Doğrulanan Gerçek Kayıtlar</p>
                            </div>
                        </div>
                    </div>

                    {loadingHistory ? (
                        <div className="h-40 flex items-center justify-center text-xs font-bold text-slate-400">
                            Geçmiş veriler sorgulanıyor...
                        </div>
                    ) : realHistoryEvents.length === 0 ? (
                        <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
                            <Database className="w-8 h-8 text-slate-400 mx-auto" />
                            <h4 className="text-sm font-black text-[#00008B]">Bu gösterge için henüz geçmiş veri bulunmuyor.</h4>
                            <p className="text-xs text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
                                Veritabanımıza gerçekleşen veri kaydoldukça gerçek geçmiş veri grafiği burada otomatik olarak görüntülenecektir.
                            </p>
                        </div>
                    ) : (
                        <div className="relative pt-6 pb-2">
                            {hoveredPoint && (
                                <div className="absolute top-0 right-4 bg-[#00008B] text-white p-3 rounded-2xl text-xs font-bold shadow-lg z-20 space-y-1">
                                    <div>Dönem: {hoveredPoint.month}</div>
                                    <div className="text-emerald-300">Açıklanan: {hoveredPoint.actual}</div>
                                    <div className="text-blue-200">Beklenti: {hoveredPoint.forecast}</div>
                                    <div className="text-slate-300">Önceki: {hoveredPoint.previous}</div>
                                </div>
                            )}

                            <div className="h-48 flex items-end justify-[#00008B] justify-center sm:justify-around gap-4 px-4 border-b border-slate-200 pb-2">
                                {realHistoryEvents.map((pt, idx) => {
                                    const valNum = parseFloat((pt.actual || '0').replace(/[^0-9\.\,\-]/g, '').replace(',', '.'));
                                    const heightPercent = Math.min(Math.max((Math.abs(valNum) / 10) * 100, 20), 90);

                                    return (
                                        <div
                                            key={idx}
                                            onMouseEnter={() => setHoveredPoint({ month: pt.dateFormatted, actual: pt.actual || '-', forecast: pt.forecast || '-', previous: pt.previous || '-' })}
                                            onMouseLeave={() => setHoveredPoint(null)}
                                            className="flex-1 max-w-[60px] flex flex-col items-center gap-2 group cursor-pointer"
                                        >
                                            <span className="text-[10px] font-black text-slate-500 group-hover:text-[#00008B] transition-colors">
                                                {pt.actual}
                                            </span>
                                            <div className="w-full max-w-[28px] bg-slate-200 group-hover:bg-[#00008B] rounded-t-xl transition-all duration-300 relative overflow-hidden" style={{ height: `${heightPercent}%` }}>
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#00008B]/80 to-blue-500/80 group-hover:from-[#00008B] group-hover:to-blue-400 transition-all" />
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-400 group-hover:text-[#00008B] whitespace-nowrap">
                                                {pt.dateFormatted.split('.')[1]}/{pt.dateFormatted.split('.')[2].slice(2)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* GRAFİK NASIL OKUNUR? & SON DÖNEMDE NE DEĞİŞTİ? */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                        <h3 className="text-sm font-black text-[#00008B] uppercase tracking-wider flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-[#00008B]" /> Grafik Nasıl Okunur?
                        </h3>
                        <div className="space-y-3">
                            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                                <h4 className="text-xs font-black text-[#00008B]">01 — YÖN</h4>
                                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                                    {profile.chartReadingCards.direction}
                                </p>
                            </div>
                            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                                <h4 className="text-xs font-black text-[#00008B]">02 — DEĞİŞİM HIZI</h4>
                                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                                    {profile.chartReadingCards.changeSpeed}
                                </p>
                            </div>
                            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                                <h4 className="text-xs font-black text-[#00008B]">03 — BAĞLAM</h4>
                                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                                    {profile.chartReadingCards.context}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                        <h3 className="text-sm font-black text-[#00008B] uppercase tracking-wider flex items-center gap-2">
                            <Activity className="w-4 h-4 text-[#00008B]" /> Son Dönemde Ne Değişti?
                        </h3>
                        <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2 h-[calc(100%-2.5rem)] flex flex-col justify-center">
                            {hasEnoughRealData ? (
                                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                                    Son veritabanı kayıtlarına göre göstergenin son gerçekleşen değeri {realHistoryEvents[realHistoryEvents.length - 1]?.actual || '-'} seviyesindedir. Önceki dönem gerçekleşmesi olan {realHistoryEvents[realHistoryEvents.length - 2]?.actual || '-'} seviyesi ile kıyaslandığında dönemsel eğilim makroekonomik beklentiler doğrultusunda şekillenmektedir.
                                </p>
                            ) : (
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    FinAi Historical Archive veritabanımızda henüz yeterli sayıda dönemsel gerçek kayıt birikmediği için dinamik trend özeti üretilmemiştir.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* NE ÇIKARAMAYIZ? & FİNANSAL OKURYAZARLIK */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
                        <div className="flex items-center gap-2 text-rose-600">
                            <AlertTriangle className="w-5 h-5 text-rose-600" />
                            <h3 className="text-sm font-black uppercase tracking-wider">Ne Çıkaramayız?</h3>
                        </div>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                            {profile.whatWeCannotInfer}
                        </p>
                    </div>

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

                {/* İLGİLİ GÖSTERGELER */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-black text-[#00008B] uppercase tracking-wider flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#00008B]" /> Bu Veriyi Anlamak İçin Bunlara Da Bak
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

            {/* TEKNİK TERİMLER TOOLTIP MODAL */}
            {activeTooltip && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
                    <div className="bg-white text-[#00008B] p-6 rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                            <span className="text-xs font-black uppercase text-blue-600">Teknik Terim ⓘ</span>
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
