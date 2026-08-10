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

        const todayDay = new Date().getDay();
        const isMarketClosed = todayDay === 0 || todayDay === 6 || (diffValue === 0 && diffPercent === 0);

        return getRotatedDailyNarrative({
            diffValue: Math.abs(diffValue),
            diffPercent: Math.abs(diffPercent),
            isPositive,
            topDriversNames: names || 'ana varlıklarınız',
            impactPct,
            isMarketClosed
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
        <div className="w-full bg-[#f4f7fc] border border-slate-200/80 text-[#00008B] rounded-2xl sm:rounded-3xl p-4 sm:p-6.5 shadow-sm flex flex-col justify-between min-h-[280px] sm:min-h-[320px] relative overflow-hidden min-w-0">
            {/* Subtle background ambient lights */}
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between h-full space-y-4 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-[#00008B]/10 border border-[#00008B]/20 flex items-center justify-center shadow-inner shrink-0">
                            <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#00008B] animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-base font-black text-[#00008B] tracking-tight">FinAi Raporu</h3>
                            <p className="text-[9px] sm:text-[10px] font-bold text-[#00008B]/60 uppercase tracking-widest">Akıllı Portföy Analizi</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {myAssets.length > 0 && (
                            <span className={`text-[10px] sm:text-xs font-black px-2.5 py-1 sm:px-3 rounded-xl sm:rounded-2xl border flex items-center gap-1 shadow-xs ${
                                isPositive
                                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                    : 'text-red-700 bg-red-50 border-red-200'
                            }`}>
                                {isPositive ? <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                                {isPositive ? '+' : ''}₺{Math.abs(displayDiffValue).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({isPositive ? '+' : ''}%{displayDiffPercent.toFixed(2)})
                            </span>
                        )}
                        <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] font-bold text-[#00008B]/70 bg-white/70 px-2 py-1 sm:px-2.5 rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-xs">
                            <Clock className="w-3 h-3 text-[#00008B]" />
                            <span>{report?.generatedAt || 'Canlı'}</span>
                        </div>
                    </div>
                </div>

                {/* Direct Narrative Body (No nested inner box) */}
                {!isDataLoaded && loading ? (
                    <div className="flex-1 py-12 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-7 h-7 text-[#00008B] animate-spin" />
                        <span className="text-xs font-bold text-[#00008B]/70">FinAi Portföy Analizini Hazırlıyor...</span>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col justify-center py-3">
                        <p className="text-sm font-semibold leading-relaxed text-[#00008B] tracking-wide">
                            {narrativeToDisplay}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
