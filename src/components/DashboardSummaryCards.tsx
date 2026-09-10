"use client";

import { useMemo, useState } from "react";
import { Wallet, TrendingUp, TrendingDown, Eye, EyeOff, ArrowRight } from "lucide-react";
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

export function DashboardSummaryCards({ layout = "grid" }: { layout?: "grid" | "stacked" }) {
    const { myAssets = [], prices = {}, isDataLoaded } = useUser();
    const [isBalanceHidden, setIsBalanceHidden] = useState(false);

    // Portföyüm sayfasıyla %100 aynı hesaplama mantığı (KESİNLİKLE DOKUNULMADI)
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
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs min-h-[290px] sm:min-h-[310px] flex flex-col justify-between animate-pulse">
                <div className="flex items-center justify-between">
                    <div className="h-5 w-36 bg-slate-100 rounded-lg" />
                    <div className="h-5 w-16 bg-slate-100 rounded-lg" />
                </div>
                <div className="h-10 w-52 bg-slate-100 rounded-xl my-auto" />
                <div className="space-y-2 pt-3 border-t border-slate-100">
                    <div className="h-4 w-32 bg-slate-100 rounded-md" />
                    <div className="h-3 w-48 bg-slate-100 rounded-md" />
                </div>
            </div>
        );
    }

    const isPositive = totalProfit >= 0;

    return (
        <div className="bg-white border border-slate-200/80 hover:border-[#00008B]/20 rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-300 min-h-[290px] sm:min-h-[310px] flex flex-col justify-between group">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#00008B]/5 border border-[#00008B]/10 flex items-center justify-center text-[#00008B] shrink-0">
                        <Wallet className="w-4 h-4 text-[#00008B]" />
                    </div>
                    <div>
                        <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#00008B]">
                            Toplam Varlık Değeri
                        </h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            Anlık Bakiye
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Bakiye Gizle / Göster Butonu */}
                    <button
                        onClick={() => setIsBalanceHidden(prev => !prev)}
                        title={isBalanceHidden ? "Bakiyeyi Göster" : "Bakiyeyi Gizle"}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-[#00008B] hover:bg-slate-50 transition-all"
                        aria-label="Bakiyeyi Gizle / Göster"
                    >
                        {isBalanceHidden ? (
                            <EyeOff className="w-4 h-4 text-slate-400" />
                        ) : (
                            <Eye className="w-4 h-4 text-slate-400" />
                        )}
                    </button>

                    {/* Canlı Değerleme Göstergesi */}
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-emerald-50/80 border border-emerald-200/60">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider">
                            Canlı
                        </span>
                    </div>
                </div>
            </div>

            {/* Büyük Rakam (Hero Section) */}
            <div className="my-auto py-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
                    Portföy Değeri
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black text-[#00008B] tracking-tight truncate">
                    {isBalanceHidden ? "₺ ••••••••" : formatCurrency(totalValue)}
                </h2>
            </div>

            {/* Kâr / Zarar ve Maliyet Bilgisi */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    {/* Kâr / Zarar Rozeti */}
                    <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border transition-all ${
                            isPositive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                                : "bg-rose-50 text-rose-700 border-rose-200/80"
                        }`}
                    >
                        {isPositive ? (
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                            <TrendingDown className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        )}
                        <span>
                            {isBalanceHidden
                                ? (isPositive ? "+%" : "-%") + Math.abs(profitRatio).toFixed(2)
                                : `${isPositive ? "+" : ""}${formatCurrency(totalProfit)} (${isPositive ? "+" : ""}%${profitRatio.toFixed(2)})`}
                        </span>
                    </div>

                    <span className="text-[10px] font-extrabold text-[#00008B] bg-blue-50/60 border border-blue-100 px-2.5 py-1 rounded-xl">
                        {myAssets.length} Pozisyon
                    </span>
                </div>

                {/* Alt Detay Satırı */}
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pt-0.5">
                    <span className="truncate">
                        Maliyet: {isBalanceHidden ? "₺ ••••••" : formatCurrency(totalCost)}
                    </span>
                    <Link
                        href="/dashboard/portfolio"
                        className="inline-flex items-center gap-1 text-[10px] font-black text-[#00008B] hover:text-blue-600 transition-colors uppercase tracking-wider shrink-0"
                    >
                        Portföyüm <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
