"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Info, ShieldAlert, Sparkles, BookOpen, BarChart3, HelpCircle } from "lucide-react";
import Link from "next/link";
import { ECONOMIC_CALENDAR_CATALOG, CatalogCalendarEvent } from "@/lib/calendar-catalog";

export default function EconomicEventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params?.id as string;

    const [event, setEvent] = useState<CatalogCalendarEvent | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!eventId) return;

        // Decoded ID matching from catalog or live API
        const decodedId = decodeURIComponent(eventId);
        const found = ECONOMIC_CALENDAR_CATALOG.find(e => e.id === decodedId || e.event === decodedId);

        if (found) {
            setEvent(found);
            setLoading(false);
        } else {
            // Fetch from API if dynamic
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
                <span className="text-xs font-black uppercase tracking-wider">Haber Detayları Yükleniyor...</span>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50 items-center justify-center p-6 text-[#00008B]">
                <h2 className="text-xl font-black mb-2">Haber Bulunamadı</h2>
                <p className="text-xs text-slate-500 mb-6">İstenen ekonomik veri detayına ulaşılamadı.</p>
                <Link href="/dashboard/economic-calendar" className="px-5 py-2.5 rounded-xl bg-[#00008B] text-white font-bold text-xs">
                    Takvime Dön
                </Link>
            </div>
        );
    }

    const isHighImpact = event.impact === 'high' || event.impact === 'critical';

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

                    <div className="flex items-center gap-2 text-xs font-black text-[#00008B] bg-blue-50 px-4 py-2 rounded-2xl border border-blue-200">
                        <Sparkles className="w-4 h-4 text-amber-500" /> FinAL Eğitim & Etki Analiz Rehberi
                    </div>
                </div>

                {/* Event Main Header Banner (Brand Navy Blue Theme) */}
                <div className="w-full bg-[#00008B] text-white border border-[#00008B] rounded-3xl p-8 shadow-xl shadow-[#00008B]/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{event.flag}</span>
                                <div>
                                    <span className="text-xs font-black text-blue-200 uppercase tracking-widest block">
                                        {event.country} • Makroekonomik Gösterge Analizi
                                    </span>
                                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-0.5">
                                        {event.event}
                                    </h1>
                                </div>
                            </div>

                            {/* Impact Badge */}
                            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md">
                                <ShieldAlert className={`w-4 h-4 ${isHighImpact ? 'text-amber-300' : 'text-blue-300'}`} />
                                <span className="text-xs font-extrabold text-white">
                                    {isHighImpact ? 'Yüksek Piyasa Etkisi' : 'Orta Piyasa Etkisi'}
                                </span>
                            </div>
                        </div>

                        {/* Metric Cards Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/15">
                            <div className="bg-white/10 p-4 rounded-2xl border border-white/15 backdrop-blur-md">
                                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">Açıklanma Zamanı</span>
                                <span className="text-sm font-black text-white block mt-1">
                                    {event.dateFormatted || 'Bugün'} - {event.time} (TSİ)
                                </span>
                            </div>

                            <div className="bg-white/10 p-4 rounded-2xl border border-white/15 backdrop-blur-md">
                                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">Açıklanan Veri</span>
                                <span className="text-sm font-black text-white block mt-1">
                                    {event.actual || 'Bekleniyor'}
                                </span>
                            </div>

                            <div className="bg-white/10 p-4 rounded-2xl border border-white/15 backdrop-blur-md">
                                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">Piyasa Beklentisi</span>
                                <span className="text-sm font-black text-blue-100 block mt-1">
                                    {event.forecast || '-'}
                                </span>
                            </div>

                            <div className="bg-white/10 p-4 rounded-2xl border border-white/15 backdrop-blur-md">
                                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">Önceki Veri</span>
                                <span className="text-sm font-black text-blue-100 block mt-1">
                                    {event.previous || '-'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Structured Educational & Market Impact Section Placeholder Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left & Middle Column (2 Cols): What is it & Why follow? */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Box 1: Nedir ve Ne İş Yapar? */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-150">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#00008B]">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-[#00008B]">Bu Veri Nedir ve Ne İşe Yarar?</h3>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Basitleştirilmiş Tanım & Temel Bilgi</p>
                                </div>
                            </div>
                            <div className="text-xs font-semibold text-slate-600 leading-relaxed space-y-3">
                                <p>
                                    <strong className="text-[#00008B] font-bold">{event.event}</strong>, ekonomideki fiyat hareketlerini ve piyasa dinamiklerini ölçen en kritik temel göstergelerden biridir.
                                </p>
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 flex items-start gap-3">
                                    <Info className="w-4 h-4 text-[#00008B] shrink-0 mt-0.5" />
                                    <span>
                                        Bu bölüm, sizinle birlikte hazırlayacağımız finansal okuryazar olmayan her kullanıcının kolayca anlayabileceği özel anlaşılır açıklamalarla doldurulacaktır.
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Box 2: Türkiye & Dünya Yatırımcıları Neden Takip Eder? */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-150">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#00008B]">
                                    <HelpCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-[#00008B]">Yatırımcılar Bu Veriyi Neden Yakından Takip Eder?</h3>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Piyasa Psikolojisi ve Merkez Bankası Kararları</p>
                                </div>
                            </div>
                            <div className="text-xs font-semibold text-slate-600 leading-relaxed space-y-3">
                                <p>
                                    Merkez bankaları faiz kararlarını verirken ve yatırımcılar portföy dağılımlarını yaparken doğrudan bu verinin sonuçlarına göre hareket eder.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (1 Col): Affected Parities & Assets Impact Matrix */}
                    <div className="space-y-6">
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-150">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#00008B]">
                                    <BarChart3 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-[#00008B]">Hangi Varlıklara Etki Eder?</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Doğrudan Etkilenen Pariteler</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                    <span className="text-xs font-black text-[#00008B]">BIST 100 Endeksi</span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">Yüksek Duyarlılık</span>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                    <span className="text-xs font-black text-[#00008B]">USD/TRY Dolar Kuru</span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">Doğrudan Etki</span>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                    <span className="text-xs font-black text-[#00008B]">Gram Altın / Ons Altın</span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">Orta Etki</span>
                                </div>
                            </div>
                        </div>

                        {/* Senaryo Analizi (Beklentinin Üstü / Altı) */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                            <h4 className="text-xs font-black text-[#00008B] uppercase tracking-wider">Senaryo Analizi</h4>
                            
                            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
                                    <TrendingUp className="w-4 h-4 text-emerald-600" /> Beklentinin Üstünde Gelirse
                                </div>
                                <p className="text-[11px] text-emerald-900 font-medium">
                                    Piyasalarda sıkılaşma algısını artırabilir, döviz ve faiz oranları üzerinde yukarı yönlü baskı oluşturabilir.
                                </p>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
                                <div className="flex items-center gap-1.5 text-xs font-black text-rose-800">
                                    <TrendingDown className="w-4 h-4 text-rose-600" /> Beklentinin Altında Gelirse
                                </div>
                                <p className="text-[11px] text-rose-900 font-medium">
                                    Piyasalarda rahatlama ve borsada olumlu hava yaratabilir.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
