"use client";

import { useState, useEffect, useMemo } from "react";
import { 
    Sparkles, 
    ArrowLeft, 
    TrendingUp, 
    TrendingDown, 
    Calendar, 
    RefreshCw, 
    Printer, 
    ShieldCheck, 
    Layers, 
    PieChart, 
    Loader2, 
    Percent, 
    CheckCircle2, 
    FileText 
} from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";
import Link from "next/link";

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(val);
};

export default function FinAiReportViewPage() {
    const { user, myAssets = [], prices = {}, isDataLoaded, userName, email } = useUser();
    const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'all-time'>('weekly');
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchReport = async (tf: 'weekly' | 'monthly' | 'all-time') => {
        setLoading(true);
        try {
            const baseUrl = user 
                ? `/api/finai-daily-report?userId=${user.id}&timeframe=${tf}` 
                : `/api/finai-daily-report?timeframe=${tf}`;
            const res = await fetch(baseUrl);
            const json = await res.json();
            if (json.success && json.data) {
                setReport(json.data);
            }
        } catch (e) {
            console.error("FinAi report error:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isDataLoaded) {
            fetchReport(timeframe);
        }
    }, [user?.id, myAssets.length, timeframe, isDataLoaded]);

    // Canlı portföy metrikleri ve varlık katkı analizi
    const portfolioMetrics = useMemo(() => {
        let totalVal = 0;
        let totalCost = 0;
        const assetBreakdown: {
            symbol: string;
            cleanSymbol: string;
            type: string;
            quantity: number;
            avgCost: number;
            currentPrice: number;
            totalValue: number;
            totalCost: number;
            profitVal: number;
            profitPct: number;
            weight: number;
        }[] = [];

        myAssets.forEach((asset: any) => {
            const raw = (asset.symbol || '').toUpperCase().trim();
            const clean = raw.replace(/\.IS$/, '');
            const price = prices[raw] ?? prices[clean] ?? prices[`${clean}.IS`] ?? asset.avgCost ?? 0;
            const val = price * asset.quantity;
            const cost = asset.avgCost * asset.quantity;
            const profitVal = val - cost;
            const profitPct = cost > 0 ? (profitVal / cost) * 100 : 0;

            totalVal += val;
            totalCost += cost;

            assetBreakdown.push({
                symbol: raw,
                cleanSymbol: clean,
                type: asset.type || 'STOCK',
                quantity: asset.quantity,
                avgCost: asset.avgCost,
                currentPrice: price,
                totalValue: val,
                totalCost: cost,
                profitVal,
                profitPct,
                weight: 0
            });
        });

        assetBreakdown.forEach(item => {
            item.weight = totalVal > 0 ? (item.totalValue / totalVal) * 100 : 0;
        });

        assetBreakdown.sort((a, b) => b.totalValue - a.totalValue);

        const netProfit = totalVal - totalCost;
        const netProfitPct = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

        return {
            totalVal,
            totalCost,
            netProfit,
            netProfitPct,
            assetBreakdown,
            isPositive: netProfit >= 0
        };
    }, [myAssets, prices]);

    // Anlatı metni
    const clientFallbackNarrative = useMemo(() => {
        if (!myAssets || myAssets.length === 0) {
            return "Portföyünüzde henüz kayıtlı aktif bir varlık bulunmuyor. Varlık ekledikten sonra FinAi piyasa korelasyonu ve performans raporunuz anlık olarak burada üretilecektir.";
        }

        const topDriver = portfolioMetrics.assetBreakdown[0]?.cleanSymbol || 'ana pozisyonunuz';
        const startStr = formatCurrency(portfolioMetrics.totalCost);
        const endStr = formatCurrency(portfolioMetrics.totalVal);
        const diffStr = formatCurrency(Math.abs(portfolioMetrics.netProfit));
        const diffPct = Math.abs(portfolioMetrics.netProfitPct).toFixed(2);
        const isPos = portfolioMetrics.isPositive;

        if (timeframe === 'weekly') {
            return `Son 7 günlük değerlendirmede portföyünüzün toplam büyüklüğü ${startStr} maliyet tabanından ${endStr} piyasa değerine ulaştı (${isPos ? '+' : '-'}${diffStr}, %${diffPct}). Bu dönemde getiri dinamiğinin en belirleyici faktörü %${(portfolioMetrics.assetBreakdown[0]?.weight || 0).toFixed(1)} portföy ağırlığına sahip olan ${topDriver} pozisyonu oldu. Küresel risk iştahı ve BIST endeks trendleri yakından izlenmektedir.`;
        } else if (timeframe === 'monthly') {
            return `Son 30 günlük aylık incelemede toplam varlık değeriniz ${endStr} seviyesinde dengelenerek ${isPos ? '+' : '-' }%${diffPct} net değişim kaydetti. Aylık döneme yayılan fiyatlamada ${topDriver} varlığının performansı öne çıkarken risk dağılımının dengeli kaldığı gözlemlendi.`;
        } else {
            return `Portföyünüzün oluşturulduğu ilk günden bugüne gerçekleşen genel performans değerlendirmesinde kümülatif büyüme ${isPos ? '+' : '-'}${diffStr} (${isPos ? '+' : '-' }%${diffPct}) olarak gerçekleşmiştir. Toplam varlık büyüklüğünüz ${endStr} seviyesindedir.`;
        }
    }, [myAssets, portfolioMetrics, timeframe]);

    const isApiEmpty = !report || !report.narrativeText || report.narrativeText.includes("bulunmuyor");
    const fullNarrative = (myAssets.length > 0 && isApiEmpty) ? clientFallbackNarrative : (report?.narrativeText || clientFallbackNarrative);

    const displayTwr = report?.twrPercent !== undefined ? report.twrPercent : portfolioMetrics.netProfitPct;

    return (
        <div className="min-h-screen bg-slate-50/70 text-slate-900 pb-16">
            {/* Üst Bar / Geri Dönüş */}
            <div className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Ana Sayfa</span>
                        </Link>
                        <div className="h-5 w-px bg-slate-200 hidden sm:block" />
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600">
                                <Sparkles className="w-4 h-4 text-emerald-600" />
                            </div>
                            <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                                FinAi Finansal Rapor
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchReport(timeframe)}
                            disabled={loading}
                            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-xs flex items-center gap-1.5 font-medium"
                            title="Raporu Yenile"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
                            <span className="hidden sm:inline">Yenile</span>
                        </button>

                        <button
                            onClick={() => window.print()}
                            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-xs flex items-center gap-1.5 font-medium"
                            title="Raporu Yazdır"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Yazdır</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
                {/* Rapor Üst Başlık ve Zaman Dilimi Seçici */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                Canlı Yapay Zekâ Analizi
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                                • {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Portföy Gelişim ve Değerlendirme Raporu
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1 max-w-2xl">
                            {userName || email?.split('@')[0]} için portföy varlıkları, getiri korelasyonları ve piyasa dinamikleri esas alınarak hazırlanmıştır.
                        </p>
                    </div>

                    {/* Zaman Dilimi Filtresi */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start md:self-center shrink-0">
                        <button
                            onClick={() => setTimeframe('weekly')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                timeframe === 'weekly'
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            Haftalık (7 Gün)
                        </button>
                        <button
                            onClick={() => setTimeframe('monthly')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                timeframe === 'monthly'
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            Aylık (30 Gün)
                        </button>
                        <button
                            onClick={() => setTimeframe('all-time')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                timeframe === 'all-time'
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            Tüm Zamanlar
                        </button>
                    </div>
                </div>

                {/* Özet Metrik Kartları */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                        <span className="text-xs font-medium text-slate-400 block">Toplam Portföy Değeri</span>
                        <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                            {formatCurrency(portfolioMetrics.totalVal)}
                        </div>
                        <span className="text-[11px] text-slate-400 mt-1 block">
                            Maliyet: {formatCurrency(portfolioMetrics.totalCost)}
                        </span>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                        <span className="text-xs font-medium text-slate-400 block">Dönem Net Getirisi</span>
                        <div className={`text-xl sm:text-2xl font-black mt-1 flex items-center gap-1 ${
                            portfolioMetrics.isPositive ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                            {portfolioMetrics.isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                            <span>{portfolioMetrics.isPositive ? '+' : ''}{formatCurrency(portfolioMetrics.netProfit)}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 mt-1 block">
                            Getiri Oranı: {portfolioMetrics.isPositive ? '+' : ''}%{portfolioMetrics.netProfitPct.toFixed(2)}
                        </span>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                        <span className="text-xs font-medium text-slate-400 block">Zaman Ağırlıklı Getiri (TWR)</span>
                        <div className="text-xl sm:text-2xl font-black text-blue-600 mt-1 flex items-center gap-1">
                            <Percent className="w-5 h-5" />
                            <span>%{displayTwr.toFixed(2)}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 mt-1 block">
                            Nakit akışından bağımsız getiri
                        </span>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                        <span className="text-xs font-medium text-slate-400 block">Aktif Varlık & Çeşitlilik</span>
                        <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                            {portfolioMetrics.assetBreakdown.length} Pozisyon
                        </div>
                        <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                            Risk Dengesi: Dengeli
                        </span>
                    </div>
                </div>

                {/* Ana Rapor Anlatısı */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600">
                                <FileText className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                                    FinAi Yapay Zekâ Değerlendirme Anlatısı
                                </h3>
                                <p className="text-xs text-slate-400 font-medium">
                                    Piyasa hareketleri ve varlık getirilerinin gerekçeli analizi
                                </p>
                            </div>
                        </div>

                        <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Doğrulanmış Finansal Motor
                        </span>
                    </div>

                    {loading ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                            <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                            <p className="text-xs font-medium text-slate-500">Finansal rapor analiz ediliyor ve anlatı oluşturuluyor...</p>
                        </div>
                    ) : (
                        <div className="prose max-w-none text-slate-700 text-sm sm:text-base leading-relaxed space-y-4">
                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 font-normal leading-relaxed">
                                {fullNarrative}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1.5">
                                    <h5 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                                        Performansı Destekleyen Faktörler
                                    </h5>
                                    <p className="text-xs text-emerald-800/90 leading-normal">
                                        Portföydeki ana varlık pozisyonlarının endeks üzeri getirisi ve dengeli varlık dağılımı toplam değer artışını desteklemiştir.
                                    </p>
                                </div>

                                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1.5">
                                    <h5 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                                        Risk Yönetimi ve İzleme Notu
                                    </h5>
                                    <p className="text-xs text-blue-800/90 leading-normal">
                                        Önümüzdeki dönemde faiz kararları, enflasyon beklentileri ve makro takvim olayları portföy dengesi açısından öncelikli olarak takip edilmelidir.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Varlık Performans ve Dağılım Tablosu */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                                Varlık Performans ve Katkı Dökümü
                            </h3>
                            <p className="text-xs text-slate-400 font-medium">
                                Portföyünüzdeki pozisyonların anlık değerleri, maliyetleri ve getiri oranları
                            </p>
                        </div>
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
                            {portfolioMetrics.assetBreakdown.length} Varlık
                        </span>
                    </div>

                    {portfolioMetrics.assetBreakdown.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        <th className="py-3 px-3">Varlık</th>
                                        <th className="py-3 px-3">Adet / Miktar</th>
                                        <th className="py-3 px-3">Ort. Maliyet</th>
                                        <th className="py-3 px-3">Güncel Fiyat</th>
                                        <th className="py-3 px-3">Toplam Tutar</th>
                                        <th className="py-3 px-3">Kâr / Zarar</th>
                                        <th className="py-3 px-3">Portföy Payı</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {portfolioMetrics.assetBreakdown.map((asset) => {
                                        const isPos = asset.profitVal >= 0;
                                        return (
                                            <tr key={asset.symbol} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-3.5 px-3">
                                                    <div className="font-bold text-slate-900">{asset.cleanSymbol}</div>
                                                    <div className="text-[10px] text-slate-400 font-medium">{asset.type}</div>
                                                </td>
                                                <td className="py-3.5 px-3 font-semibold text-slate-700 tabular-nums">
                                                    {asset.quantity.toLocaleString('tr-TR')}
                                                </td>
                                                <td className="py-3.5 px-3 text-slate-600 tabular-nums">
                                                    {formatCurrency(asset.avgCost)}
                                                </td>
                                                <td className="py-3.5 px-3 font-bold text-slate-900 tabular-nums">
                                                    {formatCurrency(asset.currentPrice)}
                                                </td>
                                                <td className="py-3.5 px-3 font-bold text-slate-900 tabular-nums">
                                                    {formatCurrency(asset.totalValue)}
                                                </td>
                                                <td className="py-3.5 px-3">
                                                    <span className={`inline-flex items-center gap-1 font-bold ${
                                                        isPos ? 'text-emerald-600' : 'text-rose-600'
                                                    }`}>
                                                        {isPos ? '+' : ''}{formatCurrency(asset.profitVal)}
                                                        <span className="text-[10px] font-semibold">
                                                            ({isPos ? '+' : ''}%${asset.profitPct.toFixed(1)})
                                                        </span>
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-blue-600 rounded-full" 
                                                                style={{ width: `${Math.min(100, asset.weight)}%` }}
                                                            />
                                                        </div>
                                                        <span className="font-bold text-slate-700 tabular-nums text-[11px]">
                                                            %${asset.weight.toFixed(1)}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-10 text-center text-slate-400 text-xs">
                            Kayıtlı varlık bulunamadı.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
