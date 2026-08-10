"use client";

import { useMemo } from "react";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";
import { cn } from "@/lib/utils";

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(val);
};

export function DashboardSummaryCards({ layout = "grid" }: { layout?: "grid" | "stacked" }) {
    const { myAssets = [], prices = {}, isDataLoaded } = useUser();

    // Portföyüm sayfasıyla %100 aynı hesaplama mantığı
    const { totalValue, totalCost, totalProfit, profitRatio } = useMemo(() => {
        let val = 0;
        let cost = 0;

        myAssets.forEach((asset: any) => {
            const symKey = asset.symbol ? asset.symbol.toUpperCase().trim() : "";
            const cleanSymKey = symKey.replace(/\.IS$/, '');
            const currentPrice = prices[symKey] ?? prices[cleanSymKey] ?? prices[`${cleanSymKey}.IS`] ?? asset.avgCost ?? 0;

            val += currentPrice * asset.quantity;
            cost += asset.avgCost * asset.quantity;
        });

        const profit = val - cost;
        const ratio = cost > 0 ? (profit / cost) * 100 : 0;

        return {
            totalValue: val,
            totalCost: cost,
            totalProfit: profit,
            profitRatio: ratio
        };
    }, [myAssets, prices]);

    if (!isDataLoaded) {
        return (
            <div className={layout === "stacked" ? "flex flex-col gap-2.5 w-full animate-pulse" : "grid grid-cols-1 md:grid-cols-2 gap-4 w-full animate-pulse"}>
                <div className="bg-slate-100 rounded-2xl sm:rounded-3xl h-28 sm:h-36" />
                <div className="bg-slate-100 rounded-2xl sm:rounded-3xl h-28 sm:h-36" />
            </div>
        );
    }

    if (layout === "stacked") {
        return (
            <div className="flex flex-col gap-2.5 sm:gap-3 w-full h-full justify-between">
                {/* TOPLAM VARLIK DEĞERİ KARTI - LACİVERT BG */}
                <div className="bg-[#00008B] text-white border border-[#00008B] rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-lg shadow-[#00008B]/15 relative overflow-hidden group flex-1 flex flex-col justify-between">
                    <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                            </div>
                            <span className="text-white/80 text-[8px] sm:text-[10px] font-black uppercase tracking-widest">Toplam Varlık</span>
                        </div>
                    </div>
                    <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-white tracking-tighter my-0.5 truncate">
                        {formatCurrency(totalValue)}
                    </h2>
                    <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <p className="text-white/70 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider">Canlı Değerleme</p>
                    </div>
                </div>

                {/* NET KÂR / ZARAR KARTI - KARDA YEŞİL, ZARARDA KIRMIZI BG */}
                <div className={cn(
                    "rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-lg text-white border transition-all relative overflow-hidden group flex-1 flex flex-col justify-between",
                    totalProfit >= 0
                        ? "bg-emerald-600 border-emerald-500 shadow-emerald-900/10"
                        : "bg-rose-600 border-rose-500 shadow-rose-900/10"
                )}>
                    <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                                {totalProfit >= 0 ? <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" /> : <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />}
                            </div>
                            <span className="text-white/90 text-[8px] sm:text-[10px] font-black uppercase tracking-widest">Kâr / Zarar</span>
                        </div>
                        <div className="px-1.5 sm:px-2 py-0.5 rounded-lg text-[9px] sm:text-xs font-black bg-white/20 text-white border border-white/30 backdrop-blur-md">
                            {totalProfit >= 0 ? "+" : ""}{profitRatio.toFixed(1)}%
                        </div>
                    </div>
                    <div className="my-0.5">
                        <span className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight block text-white truncate">
                            {totalProfit >= 0 ? "+" : ""}{formatCurrency(totalProfit)}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-white/80 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider truncate">Maliyet: {formatCurrency(totalCost)}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {/* TOPLAM VARLIK DEĞERİ KARTI - LACİVERT BG */}
            <div className="bg-[#00008B] text-white border border-[#00008B] rounded-3xl p-5 sm:p-6 shadow-xl shadow-[#00008B]/15 relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                            <Wallet className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-white/80 text-[10px] font-black uppercase tracking-widest">Toplam Varlık Değeri</span>
                    </div>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tighter mt-2 truncate">
                    {formatCurrency(totalValue)}
                </h2>
                <div className="flex items-center gap-2 mt-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">Canlı Piyasa Değerlemesi</p>
                </div>
            </div>

            {/* NET KÂR / ZARAR KARTI - KARDA YEŞİL, ZARARDA KIRMIZI BG */}
            <div className={cn(
                "rounded-3xl p-5 sm:p-6 shadow-xl text-white border transition-all relative overflow-hidden group",
                totalProfit >= 0
                    ? "bg-emerald-600 border-emerald-500 shadow-emerald-900/10"
                    : "bg-rose-600 border-rose-500 shadow-rose-900/10"
            )}>
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                            {totalProfit >= 0 ? <TrendingUp className="w-4 h-4 text-white" /> : <TrendingDown className="w-4 h-4 text-white" />}
                        </div>
                        <span className="text-white/90 text-[10px] font-black uppercase tracking-widest">Net Kâr / Zarar</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-xl text-xs font-black bg-white/20 text-white border border-white/30 backdrop-blur-md">
                        {totalProfit >= 0 ? "+" : ""}{profitRatio.toFixed(2)}%
                    </div>
                </div>
                <div className="mt-2 sm:mt-3">
                    <span className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight block text-white truncate">
                        {totalProfit >= 0 ? "+" : ""}{formatCurrency(totalProfit)}
                    </span>
                </div>
                <div className="flex items-center gap-2 mt-4">
                    <span className="text-white/80 text-[10px] font-bold uppercase tracking-wider">Maliyet: {formatCurrency(totalCost)}</span>
                </div>
            </div>
        </div>
    );
}
