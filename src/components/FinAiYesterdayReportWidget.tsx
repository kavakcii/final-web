"use client";

import { useState, useEffect, useMemo } from "react";
import { Sparkles, Clock, Loader2, TrendingUp, TrendingDown, Bot } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";
import { getRotatedDailyNarrative } from "@/lib/finai-templates";

const SYMBOL_NAMES: Record<string, string> = {
    "THYAO": "Türk Hava Yolları",
    "THYAO.IS": "Türk Hava Yolları",
    "GARAN": "Garanti BBVA",
    "GARAN.IS": "Garanti BBVA",
    "TUPRS": "TÜPRAŞ",
    "TUPRS.IS": "TÜPRAŞ",
    "ALTIN": "Gram Altın",
    "XAUTRY=X": "Gram Altın",
    "GUMUS": "Gram Gümüş",
    "TRY=X": "Dolar/TL",
    "BTC": "Bitcoin",
    "ETH": "Ethereum"
};

export function FinAiYesterdayReportWidget() {
    const { user, myAssets = [], prices = {}, portfolioHistory = [], isDataLoaded } = useUser();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const url = user ? `/api/finai-daily-report?userId=${user.id}` : '/api/finai-daily-report';
            const res = await fetch(url);
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
        fetchReport();
    }, [user?.id, myAssets.length]);

    // Dünkü kapanış bakiyesini geçmiş veritabanından al
    const yesterdayBalance = useMemo(() => {
        if (!portfolioHistory || portfolioHistory.length === 0) return 0;
        const todayISO = new Date().toISOString().split('T')[0];
        const pastSnaps = portfolioHistory.filter((h: any) => h.snapshot_date !== todayISO);
        if (pastSnaps.length > 0) {
            return Number(pastSnaps[pastSnaps.length - 1].total_value || 0);
        }
        if (portfolioHistory.length >= 2) {
            return Number(portfolioHistory[portfolioHistory.length - 2].total_value || 0);
        }
        return 0;
    }, [portfolioHistory]);

    // Live Client-side Backup Calculation from UserContext (Dünden Bugüne Büyüme)
    const liveCalculatedNarrative = useMemo(() => {
        if (!myAssets || myAssets.length === 0) {
            return "Portföyünüzde henüz kaydedilmiş bir varlık bulunmuyor. Varlık ekledikten sonra FinAi günlük raporunuz burada otomatik olarak üretilecektir.";
        }

        let currentTotal = 0;
        let totalCost = 0;
        const contributions: { symbol: string; name: string; gain: number }[] = [];

        myAssets.forEach((asset: any) => {
            const symUpper = (asset.symbol || '').toUpperCase();
            const symClean = symUpper.replace(/\.IS$/, '');
            const price = prices[symUpper] ?? prices[symClean] ?? prices[`${symClean}.IS`] ?? asset.avgCost ?? 0;

            const val = price * asset.quantity;
            const cost = asset.avgCost * asset.quantity;
            const gain = val - cost;

            currentTotal += val;
            totalCost += cost;

            contributions.push({
                symbol: symClean,
                name: SYMBOL_NAMES[symClean] || SYMBOL_NAMES[symUpper] || symClean,
                gain
            });
        });

        // Dünden bugüne büyüme tutarı ve oranı (Kapanış Snapshot Kıyaslaması)
        const baseBalance = yesterdayBalance > 0 ? yesterdayBalance : (totalCost > 0 ? totalCost : currentTotal);
        const diffValue = currentTotal - baseBalance;
        const diffPercent = baseBalance > 0 ? (diffValue / baseBalance) * 100 : 0;
        const isPositive = diffValue >= 0;

        // Varlıkları sembol/isim bazında grupla (Gram Altın ve Gram Altın gibi mükerrer tekrarları engeller)
        const groupedMap = new Map<string, { symbol: string; name: string; gain: number }>();
        contributions.forEach(c => {
            const key = c.name || c.symbol;
            if (groupedMap.has(key)) {
                groupedMap.get(key)!.gain += c.gain;
            } else {
                groupedMap.set(key, { ...c });
            }
        });

        const groupedContributions = Array.from(groupedMap.values());
        groupedContributions.sort((a, b) => Math.abs(b.gain) - Math.abs(a.gain));
        const topDrivers = groupedContributions.slice(0, 2);

        const names = topDrivers.map(d => d.name).join(' ve ');
        const totalGainSum = groupedContributions.reduce((acc, curr) => acc + Math.max(0, curr.gain), 0);
        const driverGainSum = topDrivers.reduce((acc, curr) => acc + Math.max(0, curr.gain), 0);
        let impactPct = totalGainSum > 0 ? Math.round((driverGainSum / totalGainSum) * 100) : 70;
        if (impactPct <= 0 || impactPct > 100) impactPct = 70;

        return getRotatedDailyNarrative({
            diffValue: Math.abs(diffValue),
            diffPercent: Math.abs(diffPercent),
            isPositive,
            topDriversNames: names || 'ana varlıklarınız',
            impactPct
        });
    }, [myAssets, prices, yesterdayBalance]);

    const liveStats = useMemo(() => {
        let currentTotal = 0;
        let totalCost = 0;
        myAssets.forEach((asset: any) => {
            const symUpper = (asset.symbol || '').toUpperCase();
            const symClean = symUpper.replace(/\.IS$/, '');
            const price = prices[symUpper] ?? prices[symClean] ?? prices[`${symClean}.IS`] ?? asset.avgCost ?? 0;
            currentTotal += price * asset.quantity;
            totalCost += asset.avgCost * asset.quantity;
        });
        const baseBalance = yesterdayBalance > 0 ? yesterdayBalance : (totalCost > 0 ? totalCost : currentTotal);
        const diff = currentTotal - baseBalance;
        const pct = baseBalance > 0 ? (diff / baseBalance) * 100 : 0;
        return { diff, pct, isPos: diff >= 0 };
    }, [myAssets, prices, yesterdayBalance]);

    const isApiEmptyError = report?.narrativeText?.includes("bulunmuyor");
    const narrativeToDisplay = (myAssets.length > 0 && isApiEmptyError)
        ? liveCalculatedNarrative
        : (report?.narrativeText || liveCalculatedNarrative);

    const displayDiffValue = (report?.diffValue !== undefined && report?.diffValue !== 0 && !isApiEmptyError) ? report.diffValue : liveStats.diff;
    const displayDiffPercent = (report?.diffPercent !== undefined && report?.diffPercent !== 0 && !isApiEmptyError) ? report.diffPercent : liveStats.pct;
    const isPositive = displayDiffValue >= 0;

    return (
        <div className="w-full bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[320px]">
            <div className="flex flex-col justify-between h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-[#00008B]/5 border border-[#00008B]/10 flex items-center justify-center shadow-inner">
                            <Sparkles className="w-4.5 h-4.5 text-[#00008B] animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-[#00008B] tracking-tight">FinAi Raporu</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Akıllı Portföy Analizi</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {myAssets.length > 0 && (
                            <span className={`text-xs font-black px-3 py-1 rounded-2xl border flex items-center gap-1.5 shadow-xs ${
                                isPositive
                                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                    : 'text-red-700 bg-red-50 border-red-200'
                            }`}>
                                {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                {isPositive ? '+' : ''}₺{Math.abs(displayDiffValue).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({isPositive ? '+' : ''}%{displayDiffPercent.toFixed(2)})
                            </span>
                        )}
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-2xl border border-slate-100">
                            <Clock className="w-3 h-3 text-[#00008B]" />
                            <span>{report?.generatedAt || 'Canlı'}</span>
                        </div>
                    </div>
                </div>

                {/* Loading or Narrative Body */}
                {!isDataLoaded && loading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-7 h-7 text-[#00008B] animate-spin" />
                        <span className="text-xs font-bold text-slate-500">FinAi Portföy Analizini Hazırlıyor...</span>
                    </div>
                ) : (
                    <div className="bg-gradient-to-br from-[#00008B] via-[#04047a] to-[#010142] text-white rounded-2xl p-5.5 shadow-md border border-[#00008B] relative overflow-hidden">
                        {/* Subtle inner background ambient light */}
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

                        <p className="text-xs font-semibold leading-relaxed text-blue-50/95 tracking-wide relative z-10">
                            {narrativeToDisplay}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
