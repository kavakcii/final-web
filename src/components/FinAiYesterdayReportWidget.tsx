"use client";

import { useState, useEffect, useMemo } from "react";
import { FileText, Loader2, TrendingUp, TrendingDown, Percent, ArrowRight, Sparkles, BarChart2 } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";
import Link from "next/link";

export function FinAiYesterdayReportWidget() {
    const { user, myAssets = [], prices = {}, isDataLoaded } = useUser();
    const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'all-time'>('weekly');
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Mevcut veri çekme fonksiyonu (KESİNLİKLE DOKUNULMADI)
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
            console.error("Failed to load FinAi report:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport(timeframe);
    }, [user?.id, myAssets.length, timeframe]);

    // Mevcut istemci fallback anlatı üreticisi (KESİNLİKLE DOKUNULMADI)
    const clientFallbackNarrative = useMemo(() => {
        if (!myAssets || myAssets.length === 0) {
            return "Portföyünüzde henüz kaydedilmiş aktif bir varlık bulunmuyor. Varlık ekledikten sonra FinAi analiz raporunuz otomatik olarak üretilecektir.";
        }

        let currentTotal = 0;
        let totalCost = 0;
        const assetGains: { name: string; gain: number }[] = [];

        myAssets.forEach((asset: any) => {
            const symUpper = (asset.symbol || '').toUpperCase();
            const symClean = symUpper.replace(/\.IS$/, '');
            const price = prices[symUpper] ?? prices[symClean] ?? prices[`${symClean}.IS`] ?? asset.avgCost ?? 0;

            const val = price * asset.quantity;
            const cost = asset.avgCost * asset.quantity;
            const gain = val - cost;

            currentTotal += val;
            totalCost += cost;
            assetGains.push({ name: asset.symbol.replace(/\.IS$/, ''), gain });
        });

        const diffVal = currentTotal - totalCost;
        const diffPct = totalCost > 0 ? (diffVal / totalCost) * 100 : 0;
        const isPos = diffVal >= 0;

        assetGains.sort((a, b) => Math.abs(b.gain) - Math.abs(a.gain));
        const topDriver = assetGains[0]?.name || 'ana varlıklarınız';

        const absDiffStr = Math.abs(diffVal).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const absPctStr = Math.abs(diffPct).toFixed(2);
        const startStr = totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const endStr = currentTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        if (timeframe === 'weekly') {
            return `Son 7 günlük dönemde portföyünüzün toplam değeri ₺${startStr} seviyesinden ₺${endStr} seviyesine ${isPos ? 'yükseldi' : 'geriledi'}. Bu, ₺${absDiffStr} tutarında (${isPos ? '+' : '-'}%${absPctStr}) bir bakiye değişimine karşılık geliyor. Bu süreçteki performansın en güçlü belirleyicisi ${topDriver} pozisyonunuz oldu. Piyasalar yakından takip edilmektedir.`;
        } else if (timeframe === 'monthly') {
            return `Son 30 günlük aylık değerlendirmede portföy bakiyeniz ₺${startStr} seviyesinden ₺${endStr} seviyesine ulaşarak ${isPos ? '+' : '-'}%${absPctStr} değişim gösterdi. Aylık süreçteki performansı en çok etkileyen varlık ${topDriver} olurken portföy dengesi korunmaktadır.`;
        } else {
            return `Portföyünüz oluşturulduğu günden bugüne kadar ₺${startStr} başlangıç değerinden ₺${endStr} seviyesine ulaştı. Bu süreçte gerçekleşen ₺${absDiffStr} tutarındaki toplam büyümede ${topDriver} pozisyonunuz liderlik etti.`;
        }
    }, [myAssets, prices, timeframe]);

    const isApiEmpty = !report || !report.narrativeText || report.narrativeText.includes("bulunmuyor");
    const narrativeToDisplay = (myAssets.length > 0 && isApiEmpty) ? clientFallbackNarrative : (report?.narrativeText || clientFallbackNarrative);

    const displayDiffValue = (!isApiEmpty && report?.diffValue !== undefined) ? report.diffValue : (myAssets.length > 0 ? (myAssets.reduce((tot: number, a: any) => tot + (prices[a.symbol.toUpperCase()] || a.avgCost) * a.quantity, 0) - myAssets.reduce((tot: number, a: any) => tot + a.avgCost * a.quantity, 0)) : 0);
    const displayDiffPercent = (!isApiEmpty && report?.diffPercent !== undefined) ? report.diffPercent : (myAssets.length > 0 ? (displayDiffValue / (myAssets.reduce((tot: number, a: any) => tot + a.avgCost * a.quantity, 0) || 1)) * 100 : 0);
    const twrPercent = report?.twrPercent ?? displayDiffPercent;
    const isPositive = displayDiffValue >= 0;

    return (
        <div className="bg-white border border-slate-200/90 hover:border-blue-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-300 min-h-[250px] h-full flex flex-col justify-between group">
            {/* 1. Üst Başlık (Referans Görsel Hiyerarşisi) */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
                            Finansal Rapor
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium">
                            Piyasa analizi ve yapay zekâ değerlendirmeleri
                        </p>
                    </div>
                </div>

                <Link
                    href="/dashboard/reports"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                    Tümünü Gör <ArrowRight className="w-3 h-3" />
                </Link>
            </div>

            {/* 2. Filtreler ve Metrik Şeridi */}
            <div className="flex items-center justify-between gap-1.5 pt-2 pb-0.5 flex-wrap">
                {/* Referans Görsel Tarzı Zaman Filtresi */}
                <div className="flex items-center gap-0.5 bg-slate-100/90 p-0.5 rounded-lg">
                    <button
                        onClick={() => setTimeframe('weekly')}
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all ${
                            timeframe === 'weekly'
                                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Haftalık
                    </button>
                    <button
                        onClick={() => setTimeframe('monthly')}
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all ${
                            timeframe === 'monthly'
                                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Aylık
                    </button>
                    <button
                        onClick={() => setTimeframe('all-time')}
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all ${
                            timeframe === 'all-time'
                                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Tümü
                    </button>
                </div>

                {/* Metrik Rozetleri */}
                {myAssets.length > 0 && !loading && (
                    <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border flex items-center gap-0.5 ${
                            isPositive
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-200/80'
                                : 'text-rose-700 bg-rose-50 border-rose-200/80'
                        }`}>
                            {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                            {isPositive ? '+' : ''}%{displayDiffPercent.toFixed(1)}
                        </span>

                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200/60 flex items-center gap-0.5" title="Time-Weighted Return">
                            <Percent className="w-2.5 h-2.5 text-blue-600" />
                            TWR: %{twrPercent.toFixed(1)}
                        </span>
                    </div>
                )}
            </div>

            {/* 3. Ana Açıklama Alanı (Mavi Vurgulu Yazar / Rapor Paneli) */}
            <div className="my-auto py-1.5">
                {loading ? (
                    <div className="py-6 flex flex-col items-center justify-center gap-1.5 text-center">
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        <span className="text-[10px] font-medium text-slate-400">Finansal rapor analiz ediliyor...</span>
                    </div>
                ) : (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#00008B] via-[#0a286a] to-[#103784] text-white border border-blue-900/40 shadow-xs space-y-2 relative overflow-hidden">
                        {/* İç mavi panel için hafif ambient parıltı */}
                        <div className="absolute -top-6 -right-6 w-20 h-20 bg-cyan-400/10 rounded-full blur-xl pointer-events-none" />

                        <div className="flex items-center gap-2 relative z-10">
                            <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center shrink-0">
                                <Sparkles className="w-3 h-3 text-cyan-300" />
                            </div>
                            <h4 className="text-xs font-bold text-white tracking-tight truncate">
                                {isPositive ? "Portföy Gelişim ve Değerlendirme Analizi" : "Piyasa Dinamikleri ve Portföy Dengesi"}
                            </h4>
                        </div>

                        <p className="text-[11px] sm:text-xs font-normal leading-relaxed text-blue-100/90 line-clamp-3 relative z-10">
                            {narrativeToDisplay}
                        </p>
                    </div>
                )}
            </div>

            {/* 4. Alt Aksiyon Çubuğu */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">
                    Haftalık AI rapor özeti
                </span>
                <Link
                    href="/dashboard/reports"
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50/70 hover:bg-blue-100/80 border border-blue-100 text-blue-700 text-[11px] font-bold rounded-lg shadow-2xs transition-all"
                >
                    Raporu Oku <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
        </div>
    );
}
