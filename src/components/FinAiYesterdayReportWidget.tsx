"use client";

import { useState, useEffect, useMemo } from "react";
import { Sparkles, Clock, Loader2, TrendingUp, TrendingDown, Percent } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";

export function FinAiYesterdayReportWidget() {
    const { user, myAssets = [], prices = {}, isDataLoaded } = useUser();
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
            console.error("Failed to load FinAi report:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport(timeframe);
    }, [user?.id, myAssets.length, timeframe]);

    // Client-side fallback narrative generator
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
        <div className="w-full bg-[#f4f7fc] border border-slate-200/80 text-[#00008B] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-sm flex flex-col justify-between h-full min-h-[260px] sm:min-h-[290px] min-w-0 relative overflow-hidden">
            {/* Subtle background ambient lights */}
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between h-full space-y-3 min-w-0">
                {/* Header with Title & 3 Timeframe Tabs */}
                <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap pb-2 border-b border-slate-200/60">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-[#00008B]/10 border border-[#00008B]/20 flex items-center justify-center shadow-inner shrink-0">
                            <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#00008B] animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-xs sm:text-base font-black text-[#00008B] tracking-tight truncate">FinAi Raporu</h3>
                            <p className="text-[8px] sm:text-[10px] font-bold text-[#00008B]/60 uppercase tracking-widest hidden sm:block">Akıllı Portföy Hikâyesi</p>
                        </div>
                    </div>

                    {/* 3 Timeframe Selector Tabs */}
                    <div className="flex items-center gap-1 bg-white/80 p-1 rounded-xl border border-slate-200/80 shadow-xs">
                        <button
                            onClick={() => setTimeframe('weekly')}
                            className={`px-2 py-1 text-[9px] sm:text-[10px] font-extrabold rounded-lg transition-all ${
                                timeframe === 'weekly'
                                    ? 'bg-[#00008B] text-white shadow-xs'
                                    : 'text-[#00008B]/60 hover:text-[#00008B]'
                            }`}
                        >
                            Haftalık (7G)
                        </button>
                        <button
                            onClick={() => setTimeframe('monthly')}
                            className={`px-2 py-1 text-[9px] sm:text-[10px] font-extrabold rounded-lg transition-all ${
                                timeframe === 'monthly'
                                    ? 'bg-[#00008B] text-white shadow-xs'
                                    : 'text-[#00008B]/60 hover:text-[#00008B]'
                            }`}
                        >
                            Aylık (30G)
                        </button>
                        <button
                            onClick={() => setTimeframe('all-time')}
                            className={`px-2 py-1 text-[9px] sm:text-[10px] font-extrabold rounded-lg transition-all ${
                                timeframe === 'all-time'
                                    ? 'bg-[#00008B] text-white shadow-xs'
                                    : 'text-[#00008B]/60 hover:text-[#00008B]'
                            }`}
                        >
                            Tüm Zamanlar
                        </button>
                    </div>
                </div>

                {/* Sub-header Metric Pills */}
                {myAssets.length > 0 && !loading && (
                    <div className="flex items-center gap-2">
                        <span className={`text-[9px] sm:text-xs font-black px-2.5 py-1 rounded-xl border flex items-center gap-1 shadow-xs ${
                            isPositive
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                : 'text-red-700 bg-red-50 border-red-200'
                        }`}>
                            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {isPositive ? '+' : ''}₺{Math.abs(displayDiffValue).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({isPositive ? '+' : ''}%{displayDiffPercent.toFixed(2)})
                        </span>

                        <span className="text-[9px] sm:text-xs font-black text-[#00008B] bg-blue-50/80 px-2.5 py-1 rounded-xl border border-blue-200/80 flex items-center gap-1 shadow-xs" title="Time-Weighted Return (Gerçek Yatırım Getirisi)">
                            <Percent className="w-3 h-3 text-[#00008B]" />
                            TWR: %{twrPercent.toFixed(2)}
                        </span>
                    </div>
                )}

                {/* Direct Narrative Body */}
                {loading ? (
                    <div className="flex-1 py-8 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 text-[#00008B] animate-spin" />
                        <span className="text-[10px] font-bold text-[#00008B]/70">FinAi Portföy Analizini Hazırlıyor...</span>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col justify-start pt-1">
                        <p className="text-[11px] sm:text-xs md:text-sm font-semibold leading-relaxed text-[#00008B] tracking-wide">
                            {narrativeToDisplay}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
