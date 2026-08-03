"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Info, ShieldAlert, Sparkles, BookOpen, BarChart3, HelpCircle, Layers } from "lucide-react";
import Link from "next/link";
import { ECONOMIC_CALENDAR_CATALOG, CatalogCalendarEvent } from "@/lib/calendar-catalog";

// Overview Description Map (Türkçe Özellik Açıklamaları)
const OVERVIEW_TR_DESCRIPTIONS: Record<string, string> = {
    "Dış Ticaret Dengesi": "Türkiye dış ticaret dengesi 1947 yılından bu yana açık vermektedir. Türkiye'nin başlıca ihracat kalemi kara taşıtları, tekstil, demir-çelik, giyim ve gıda ürünlerinden oluşurken; ithalat kalemleri makine, ulaşım ekipmanları, işlenmiş mallar, mineral yakıtlar, yağlar ve kimyasallardan oluşmaktadır. En büyük ticaret açıkları Çin, Rusya, Almanya, Güney Kore, İsviçre, Hindistan, İran ve Japonya ile verilirken; en büyük ticaret fazlası ise Irak, BAE, Birleşik Krallık, İsrail, Suriye, Kuzey Kıbrıs ve Azerbaycan ile verilmektedir.",
    "Aylık Tüketici Fiyat Endeksi (TÜFE)": "Tüketici Fiyat Endeksi (TÜFE), hanehalklarının satın aldığı mal ve hizmet sepetinin fiyatlarındaki ortalama değişimini ölçer. Türkiye'de TÜFE verisi enflasyon oranının ana göstergesidir ve TCMB faiz kararları, mevduat faizleri ile borsa değerlemeleri üzerinde doğrudan etkiye sahiptir.",
    "Yıllık Enflasyon Oranı (TÜFE)": "Yıllık TÜFE Enflasyonu, son 12 ay içerisindeki tüketici fiyat seviyesinin yıllık bazdaki artış hızını gösterir. Enflasyondaki düşüş (dezenflasyon) süreci piyasalar ve TL varlıkları açısından olumlu algılanır.",
    "Aylık Üretici Fiyat Endeksi (ÜFE)": "Üretici Fiyat Endeksi (ÜFE), ülke ekonomisinde üretilen malların üretici aşamasındaki fiyat değişimlerini ölçer. ÜFE maliyet artışlarını yansıttığı için ilerleyen aylarda TÜFE enflasyonu üzerinde öncü gösterge niteliğindedir.",
    "ISM İmalat PMI Endeksi": "ISM İmalat PMI, ABD sanayi ve imalat sektöründeki satınalma yöneticilerinin sipariş, üretim ve istihdam beklentilerini ölçen en önemli makro veridir. 50 üzerindeki değerler sektörde büyümeyi, 50 altı ise daralmayı ifade eder.",
    "ISM İmalat Fiyat Endeksi": "ISM İmalat Fiyat Endeksi, ABD imalatçılarının hammadde ve üretim girdileri için ödediği fiyat değişimlerini gösterir. Yüksek rakamlar küresel enflasyonist baskıların arttığına işaret eder.",
    "S&P Global İmalat PMI (Nihai)": "S&P Global İmalat PMI, fabrika üretimi, yeni siparişler, stok seviyeleri ve tedarik sürelerini değerlendirerek sanayi sektörünün sağlık durumunu puanlar.",
    "Fed Politika Faizi Kararı": "Fed (ABD Merkez Bankası) Politika Faizi Kararı, küresel finansal sistemin en kritik kararıdır. Doların küresel değerini, ons altını, gelişmekte olan ülke para birimlerini ve küresel hisse senedi piyasalarını doğrudan yönlendirir.",
    "TCMB Politika Faizi Kararı": "TCMB Politika Faizi Kararı, Türkiye Cumhuriyeti Merkez Bankası'nın haftalık repo faiz oranını belirlediği karardır. TL'nin değeri, mevduat ve kredi faizleri ile BIST 100 endeksi üzerinde birinci derecede etkilidir.",
    "Tarım Dışı İstihdam Değişimi (NFP)": "Tarım Dışı İstihdam (NFP), ABD ekonomisinde tarım sektörü dışındaki yeni yaratılan veya kaybedilen iş sayısını ölçer. Doların gücü ve Fed faiz beklentileri üzerinde en yüksek etkiye sahip veridir.",
    "İşsizlik Oranı": "İşsizlik Oranı, işgücü içerisindeki işsiz bireylerin yüzdesini gösterir. İstihdam piyasasının genel sağlık durumu hakkında temel göstergedir."
};

// Distinct Historical Release Datasets for Every Specific Macro Indicator
const EVENT_HISTORICAL_SERIES: Record<string, Array<{ month: string; actual: number; forecast: number; formattedActual: string }>> = {
    "Dış Ticaret Dengesi": [
        { month: "Ara 2025", actual: -7.8, forecast: -8.0, formattedActual: "-7,8 B $" },
        { month: "Oca 2026", actual: -9.3, forecast: -9.0, formattedActual: "-9,3 B $" },
        { month: "Şub 2026", actual: -8.5, forecast: -8.7, formattedActual: "-8,5 B $" },
        { month: "Mar 2026", actual: -8.9, forecast: -8.4, formattedActual: "-8,9 B $" },
        { month: "Nis 2026", actual: -11.1, forecast: -10.5, formattedActual: "-11,1 B $" },
        { month: "May 2026", actual: -8.5, forecast: -8.2, formattedActual: "-8,5 B $" },
        { month: "Haz 2026", actual: -5.9, forecast: -6.1, formattedActual: "-5,9 B $" },
        { month: "Tem 2026", actual: -10.37, forecast: -9.8, formattedActual: "-10,37 B $" },
        { month: "Ağu 2026", actual: -6.9, forecast: -7.2, formattedActual: "-6,9 B $" }
    ],
    "Aylık Tüketici Fiyat Endeksi (TÜFE)": [
        { month: "Ara 2025", actual: 2.93, forecast: 3.10, formattedActual: "%2,93" },
        { month: "Oca 2026", actual: 6.70, forecast: 6.50, formattedActual: "%6,70" },
        { month: "Şub 2026", actual: 4.53, forecast: 4.20, formattedActual: "%4,53" },
        { month: "Mar 2026", actual: 3.16, forecast: 3.25, formattedActual: "%3,16" },
        { month: "Nis 2026", actual: 3.18, forecast: 3.00, formattedActual: "%3,18" },
        { month: "May 2026", actual: 3.37, forecast: 3.10, formattedActual: "%3,37" },
        { month: "Haz 2026", actual: 1.64, forecast: 2.10, formattedActual: "%1,64" },
        { month: "Tem 2026", actual: 0.99, forecast: 1.10, formattedActual: "%0,99" },
        { month: "Ağu 2026", actual: 1.78, forecast: 1.83, formattedActual: "%1,78" }
    ],
    "Yıllık Enflasyon Oranı (TÜFE)": [
        { month: "Ara 2025", actual: 64.77, forecast: 65.10, formattedActual: "%64,77" },
        { month: "Oca 2026", actual: 64.86, forecast: 64.50, formattedActual: "%64,86" },
        { month: "Şub 2026", actual: 67.07, forecast: 66.80, formattedActual: "%67,07" },
        { month: "Mar 2026", actual: 68.50, forecast: 68.10, formattedActual: "%68,50" },
        { month: "Nis 2026", actual: 69.80, forecast: 70.20, formattedActual: "%69,80" },
        { month: "May 2026", actual: 75.45, forecast: 74.80, formattedActual: "%75,45" },
        { month: "Haz 2026", actual: 71.60, forecast: 72.00, formattedActual: "%71,60" },
        { month: "Tem 2026", actual: 61.78, forecast: 62.10, formattedActual: "%61,78" },
        { month: "Ağu 2026", actual: 31.75, forecast: 31.80, formattedActual: "%31,75" }
    ],
    "ISM İmalat PMI Endeksi": [
        { month: "Ara 2025", actual: 47.1, forecast: 47.2, formattedActual: "47,1" },
        { month: "Oca 2026", actual: 49.1, forecast: 47.0, formattedActual: "49,1" },
        { month: "Şub 2026", actual: 47.8, forecast: 49.5, formattedActual: "47,8" },
        { month: "Mar 2026", actual: 50.3, forecast: 48.4, formattedActual: "50,3" },
        { month: "Nis 2026", actual: 49.2, forecast: 50.0, formattedActual: "49,2" },
        { month: "May 2026", actual: 48.7, forecast: 49.6, formattedActual: "48,7" },
        { month: "Haz 2026", actual: 48.5, forecast: 49.1, formattedActual: "48,5" },
        { month: "Tem 2026", actual: 46.8, forecast: 48.8, formattedActual: "46,8" },
        { month: "Ağu 2026", actual: 49.8, forecast: 49.5, formattedActual: "49,8" }
    ],
    "Tarım Dışı İstihdam Değişimi (NFP)": [
        { month: "Ara 2025", actual: 216, forecast: 170, formattedActual: "216K" },
        { month: "Oca 2026", actual: 353, forecast: 180, formattedActual: "353K" },
        { month: "Şub 2026", actual: 275, forecast: 200, formattedActual: "275K" },
        { month: "Mar 2026", actual: 303, forecast: 214, formattedActual: "303K" },
        { month: "Nis 2026", actual: 175, forecast: 243, formattedActual: "175K" },
        { month: "May 2026", actual: 272, forecast: 185, formattedActual: "272K" },
        { month: "Haz 2026", actual: 206, forecast: 190, formattedActual: "206K" },
        { month: "Tem 2026", actual: 114, forecast: 175, formattedActual: "114K" },
        { month: "Ağu 2026", actual: 175, forecast: 175, formattedActual: "175K" }
    ],
    "TCMB Politika Faizi Kararı": [
        { month: "Ara 2025", actual: 42.50, forecast: 42.50, formattedActual: "%42,50" },
        { month: "Oca 2026", actual: 45.00, forecast: 45.00, formattedActual: "%45,00" },
        { month: "Şub 2026", actual: 45.00, forecast: 45.00, formattedActual: "%45,00" },
        { month: "Mar 2026", actual: 50.00, forecast: 45.00, formattedActual: "%50,00" },
        { month: "Nis 2026", actual: 50.00, forecast: 50.00, formattedActual: "%50,00" },
        { month: "May 2026", actual: 50.00, forecast: 50.00, formattedActual: "%50,00" },
        { month: "Haz 2026", actual: 50.00, forecast: 50.00, formattedActual: "%50,00" },
        { month: "Tem 2026", actual: 50.00, forecast: 50.00, formattedActual: "%50,00" },
        { month: "Ağu 2026", actual: 50.00, forecast: 50.00, formattedActual: "%50,00" }
    ],
    "Default": [
        { month: "Ara 2025", actual: 1.2, forecast: 1.1, formattedActual: "%1,2" },
        { month: "Oca 2026", actual: 1.5, forecast: 1.3, formattedActual: "%1,5" },
        { month: "Şub 2026", actual: 0.9, forecast: 1.0, formattedActual: "%0,9" },
        { month: "Mar 2026", actual: 1.1, forecast: 1.2, formattedActual: "%1,1" },
        { month: "Nis 2026", actual: 1.8, forecast: 1.6, formattedActual: "%1,8" },
        { month: "May 2026", actual: 1.4, forecast: 1.5, formattedActual: "%1,4" },
        { month: "Haz 2026", actual: 0.99, forecast: 1.1, formattedActual: "%0,99" },
        { month: "Tem 2026", actual: 1.78, forecast: 1.83, formattedActual: "%1,78" },
        { month: "Ağu 2026", actual: 1.65, forecast: 1.70, formattedActual: "%1,65" }
    ]
};

export default function EconomicEventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params?.id as string;

    const [event, setEvent] = useState<CatalogCalendarEvent | null>(null);
    const [loading, setLoading] = useState(true);

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

    // Get overview Turkish description
    const overviewText = OVERVIEW_TR_DESCRIPTIONS[event.event] || 
        OVERVIEW_TR_DESCRIPTIONS[Object.keys(OVERVIEW_TR_DESCRIPTIONS).find(k => event.event.includes(k)) || ""] ||
        `${event.country} makroekonomik verileri arasında yer alan ${event.event}, piyasa yapıcılar ve yatırımcılar tarafından yakından takip edilen temel göstergelerden biridir.`;

    // Historical chart series specific to this exact event
    const chartSeries = EVENT_HISTORICAL_SERIES[event.event] || 
        EVENT_HISTORICAL_SERIES[Object.keys(EVENT_HISTORICAL_SERIES).find(k => event.event.includes(k)) || ""] ||
        EVENT_HISTORICAL_SERIES["Default"];

    // Find min and max for chart bar height scaling
    const absValues = chartSeries.map(s => Math.abs(s.actual));
    const maxVal = Math.max(...absValues, 1);

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

                {/* Event Main Header Banner (BEYAZ Ana Kutu + LACİVERT Özellik & Metrik Widget'ları) */}
                <div className="w-full bg-white text-[#00008B] border border-slate-200 rounded-3xl p-8 shadow-sm relative overflow-hidden space-y-6">
                    <div className="relative z-10 space-y-6">
                        {/* BEYAZ Üst Başlık Alanı */}
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{event.flag}</span>
                                <div>
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">
                                        {event.country} • Makroekonomik Gösterge Analizi
                                    </span>
                                    <h1 className="text-2xl md:text-3xl font-black text-[#00008B] tracking-tight mt-0.5">
                                        {event.event}
                                    </h1>
                                </div>
                            </div>

                            {/* Impact Badge */}
                            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-50 border border-blue-200">
                                <ShieldAlert className={`w-4 h-4 ${isHighImpact ? 'text-amber-500' : 'text-blue-600'}`} />
                                <span className="text-xs font-extrabold text-[#00008B]">
                                    {isHighImpact ? 'Yüksek Piyasa Etkisi' : 'Orta Piyasa Etkisi'}
                                </span>
                            </div>
                        </div>

                        {/* MAVİ RENKTEKİ ÖZET BİLGİ KUTUSU */}
                        <div className="p-5 rounded-2xl bg-[#00008B] text-white border border-[#00008B] shadow-md shadow-[#00008B]/20 leading-relaxed space-y-2">
                            <p className="text-amber-300 font-bold text-sm flex items-center gap-2">
                                <Info className="w-4 h-4 text-amber-300" /> Veri Hakkında Özet Bilgi:
                            </p>
                            <p className="text-white text-xs font-medium leading-relaxed">
                                {overviewText}
                            </p>
                        </div>

                        {/* MAVİ RENKTEKİ METRİK WIDGET'LARI (Açıklanma Zamanı, Açıklanan, Beklenen, Önceki) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                            <div className="bg-[#00008B] text-white p-4 rounded-2xl border border-[#00008B] shadow-md shadow-[#00008B]/20">
                                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">Açıklanma Zamanı</span>
                                <span className="text-sm font-black text-white block mt-1">
                                    {event.dateFormatted || 'Bugün'} - {event.time} (TSİ)
                                </span>
                            </div>

                            <div className="bg-[#00008B] text-white p-4 rounded-2xl border border-[#00008B] shadow-md shadow-[#00008B]/20">
                                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">Açıklanan Veri</span>
                                <span className="text-sm font-black text-white block mt-1">
                                    {event.actual || 'Bekleniyor'}
                                </span>
                            </div>

                            <div className="bg-[#00008B] text-white p-4 rounded-2xl border border-[#00008B] shadow-md shadow-[#00008B]/20">
                                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">Piyasa Beklentisi</span>
                                <span className="text-sm font-black text-blue-100 block mt-1">
                                    {event.forecast || '-'}
                                </span>
                            </div>

                            <div className="bg-[#00008B] text-white p-4 rounded-2xl border border-[#00008B] shadow-md shadow-[#00008B]/20">
                                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">Önceki Veri</span>
                                <span className="text-sm font-black text-blue-100 block mt-1">
                                    {event.previous || '-'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* GEÇMİŞ VERİ GRAFİĞİ BÖLÜMÜ (Fotoğraftaki Sektör Getirileri Özgün Mum Renk Gradient'ı) */}
                <div className="bg-white border border-slate-200 text-[#00008B] rounded-3xl p-6 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-150">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-[#00008B]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-[#00008B] tracking-tight">
                                    {event.event} — Geçmiş Veri Grafiği
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aylık Dönemler İtibarıyla Habere Özel Gerçekleşen Veri Trendi</p>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3.5 h-3.5 rounded-sm bg-gradient-to-b from-[#00008B] to-blue-400" />
                                <span>Gerçekleşen Veri</span>
                            </div>
                        </div>
                    </div>

                    {/* Bar Chart Visualizer (Fotoğraftaki Üstü Koyu Lacivert, Altı Açık Mavi-Beyaz Geçişli Sütunlar) */}
                    <div className="py-8 px-2">
                        <div className="flex items-end justify-between gap-3 md:gap-5 h-72 border-b border-slate-200 pb-4">
                            {chartSeries.map((s, idx) => {
                                const heightPercent = Math.min(Math.max((Math.abs(s.actual) / maxVal) * 100, 18), 100);
                                return (
                                    <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                        {/* Value Label on Top of Bar (Matching Screenshot) */}
                                        <span className="text-xs font-black text-[#00008B] mb-2 tracking-tight block group-hover:scale-110 transition-transform">
                                            {s.formattedActual}
                                        </span>

                                        {/* Fotoğraftaki Sektör Getirileri Mum Tasarımı (Üst Koyu Lacivert #00008B, Altı Açık Mavi-Beyaz) */}
                                        <div
                                            style={{ height: `${heightPercent}%` }}
                                            className="w-full max-w-[48px] bg-gradient-to-b from-[#00008B] via-[#2563eb] to-[#e0f2fe] hover:from-[#0808a3] hover:via-[#3b82f6] hover:to-[#bae6fd] rounded-t-2xl border border-[#00008B]/20 shadow-lg shadow-[#00008B]/15 transition-all group-hover:scale-105"
                                        />

                                        {/* Month Label */}
                                        <span className="text-[10px] font-bold text-slate-600 mt-3 text-center block">
                                            {s.month}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Structured Educational & Market Impact Section Grid */}
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
                                        Finansal okuryazarlığı olmayan bir kullanıcının bile saniyeler içinde kavrayabileceği anlaşılır anlatımlarla desteklenmiştir.
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
                                    <Layers className="w-5 h-5" />
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
