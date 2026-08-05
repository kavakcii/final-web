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
        <div className="w-full bg-gradient-to-br from-[#00008B] via-[#04047a] to-[#010142] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between border border-[#00008B] min-h-[260px]">
            {/* Background Glow Effects */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/15">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                            <Sparkles className="w-4.5 h-4.5 text-white animate-pulse" />
                        </div>
                        <h3 className="text-lg font-black tracking-tight text-white">FinAi Günlük Rapor</h3>
                    </div>

                    <div className="flex items-center gap-2">
                        {myAssets.length > 0 && (
                            <span className={`text-xs font-black px-3 py-1 rounded-xl border flex items-center gap-1.5 shadow-sm ${
                                isPositive
                                    ? 'text-emerald-300 bg-emerald-500/20 border-emerald-400/30'
                                    : 'text-red-300 bg-red-500/20 border-red-400/30'
                            }`}>
                                {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                {isPositive ? '+' : ''}₺{Math.abs(displayDiffValue).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({isPositive ? '+' : ''}%{displayDiffPercent.toFixed(2)})
                            </span>
                        )}
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-200/80 bg-white/5 px-2.5 py-1 rounded-xl border border-white/10">
                            <Clock className="w-3 h-3 text-white" />
                            <span>{report?.generatedAt || 'Canlı'}</span>
                        </div>
                    </div>
                </div>

                {/* Loading or Narrative Body */}
                {!isDataLoaded && loading ? (
                    <div className="py-10 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-7 h-7 text-white animate-spin" />
                        <span className="text-xs font-bold text-blue-100">FinAi Portföy Analizini Hazırlıyor...</span>
                    </div>
                ) : (
                    <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-5 shadow-inner">
                        <div className="flex items-center gap-2 mb-2">
                            <Bot className="w-4 h-4 text-white" />
                            <span className="text-[11px] font-black text-white uppercase tracking-widest">FinAi Analist Yorumu</span>
                        </div>
                        <p className="text-xs font-semibold leading-relaxed text-blue-50/95 tracking-wide">
                            {narrativeToDisplay}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
