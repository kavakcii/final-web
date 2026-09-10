"use client";

import { useState, useEffect, useMemo } from "react";
import { FileText, Loader2, TrendingUp, TrendingDown, Percent, ArrowRight } from "lucide-react";
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
        <div className="bg-white border border-slate-200/80 hover:border-[#00008B]/20 rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-300 min-h-[290px] sm:min-h-[310px] flex flex-col justify-between group">
            {/* Header: Kullanıcı Başlığı FİNANSAL RAPOR ve Zaman Filtreleri */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#00008B]/5 border border-[#00008B]/10 flex items-center justify-center text-[#00008B] shrink-0">
                        <FileText className="w-4 h-4 text-[#00008B]" />
                    </div>
                    <div>
                        <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#00008B]">
                            Finansal Rapor
                        </h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            Portföy Değerlendirmesi
                        </p>
                    </div>
                </div>

                {/* Zaman Dilimi Seçici Haplar */}
                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                    <button
                        onClick={() => setTimeframe('weekly')}
                        className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${
                            timeframe === 'weekly'
                                ? 'bg-white text-[#00008B] shadow-2xs font-black'
                                : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        Haftalık
                    </button>
                    <button
                        onClick={() => setTimeframe('monthly')}
                        className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${
                            timeframe === 'monthly'
                                ? 'bg-white text-[#00008B] shadow-2xs font-black'
                                : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        Aylık
                    </button>
                    <button
                        onClick={() => setTimeframe('all-time')}
                        className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${
                            timeframe === 'all-time'
                                ? 'bg-white text-[#00008B] shadow-2xs font-black'
                                : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        Tümü
                    </button>
                </div>
            </div>

            {/* Metrik Rozetleri (Varsa) */}
            {myAssets.length > 0 && !loading && (
                <div className="flex items-center gap-2 pt-2.5 pb-1 flex-wrap">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg border flex items-center gap-1 ${
                        isPositive
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200/80'
                            : 'text-rose-700 bg-rose-50 border-rose-200/80'
                    }`}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {isPositive ? '+' : ''}₺{Math.abs(displayDiffValue).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ({isPositive ? '+' : ''}%{displayDiffPercent.toFixed(1)})
                    </span>

                    <span className="text-[10px] font-black text-[#00008B] bg-blue-50/80 px-2.5 py-0.5 rounded-lg border border-blue-200/70 flex items-center gap-1" title="Time-Weighted Return">
                        <Percent className="w-2.5 h-2.5 text-[#00008B]" />
                        TWR: %{twrPercent.toFixed(1)}
                    </span>
                </div>
            )}

            {/* Rapor Metin Gövdesi */}
            <div className="my-auto py-1">
                {loading ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-2 text-center">
                        <Loader2 className="w-5 h-5 text-[#00008B] animate-spin" />
                        <span className="text-[11px] font-bold text-slate-400">Rapor yükleniyor...</span>
                    </div>
                ) : (
                    <p className="text-xs sm:text-[13px] font-medium leading-relaxed text-slate-700 line-clamp-4">
                        {narrativeToDisplay}
                    </p>
                )}
            </div>

            {/* Alt Kısım / Detaylı Rapor Linki */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">
                    Otomatik portföy analizi
                </span>
                <Link
                    href="/dashboard/reports"
                    className="inline-flex items-center gap-1 text-[10px] font-black text-[#00008B] hover:text-blue-600 transition-colors uppercase tracking-wider"
                >
                    Raporu Oku <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
        </div>
    );
}
