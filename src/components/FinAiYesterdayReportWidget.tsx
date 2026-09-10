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
        <div className="bg-white border border-slate-100 hover:border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all duration-300 min-h-[250px] h-full flex flex-col justify-between group">
            {/* 1. Üst Başlık (Referans Görsel: İkon + "FinAi Analizi" + Sağda "Güncel" Rozeti) */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100/80">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-emerald-50 border border-emerald-200/50 flex items-center justify-center text-emerald-600 shrink-0">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
                        FinAi Analizi
                    </h3>
                </div>

                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
                    Güncel
                </span>
            </div>

            {/* 2. Ana İçerik: Belirgin Başlık ve Akıcı Analiz Metni */}
            <div className="my-auto py-2">
                {loading ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-2 text-center">
                        <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                        <span className="text-[11px] font-medium text-slate-400">Piyasa analizi hazırlanıyor...</span>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        <h4 className="text-sm sm:text-[15px] font-bold text-slate-900 hover:text-blue-900 transition-colors tracking-tight leading-snug">
                            {isPositive
                                ? "Portföy Gelişim ve Değerlendirme Analizi"
                                : "Piyasa Dinamikleri ve Portföy Dengesi"}
                        </h4>

                        <p className="text-xs text-slate-500 font-normal leading-relaxed line-clamp-4">
                            {narrativeToDisplay}
                        </p>
                    </div>
                )}
            </div>

            {/* 3. Alt Aksiyon Linki: Referanstaki "Detaylı analize git →" */}
            <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between">
                <Link
                    href="/dashboard/report"
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors inline-flex items-center gap-1.5 group/link"
                >
                    <span>Detaylı analize git</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover/link:translate-x-1 transition-transform" />
                </Link>

                {myAssets.length > 0 && !loading && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                    }`}>
                        {isPositive ? '+' : ''}%{displayDiffPercent.toFixed(1)}
                    </span>
                )}
            </div>
        </div>
    );
}
