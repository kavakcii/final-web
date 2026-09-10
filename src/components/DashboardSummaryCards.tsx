"use client";

import { useMemo, useState } from "react";
import { Wallet, TrendingUp, TrendingDown, Eye, EyeOff, Sparkles } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(val);
};

export function DashboardSummaryCards({ layout = "grid", compact = false }: { layout?: "grid" | "stacked"; compact?: boolean }) {
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
            <div className={`bg-[#0b192c] border border-[#1a2f4c] rounded-2xl p-4 flex flex-col justify-between animate-pulse ${compact ? 'min-h-[160px]' : 'min-h-[250px]'}`}>
                <div className="flex items-center justify-between">
                    <div className="h-4 w-32 bg-white/10 rounded-lg" />
                    <div className="h-4 w-14 bg-white/10 rounded-lg" />
                </div>
                <div className="h-8 w-40 bg-white/10 rounded-xl my-auto" />
                <div className="h-6 w-full bg-white/10 rounded-lg pt-1 border-t border-white/10" />
            </div>
        );
    }

    const isPositive = totalProfit >= 0;

    return (
        <div className={`bg-[#0b192c] text-white border border-[#1a2f4c] shadow-xl shadow-black/40 relative overflow-hidden flex flex-col justify-between h-full group ${
            compact 
                ? 'rounded-2xl p-3.5 sm:p-4 min-h-0' 
                : 'rounded-2xl sm:rounded-3xl p-4 sm:p-5 min-h-[250px]'
        }`}>
            {/* Subtle Ambient Glow */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />

            {/* Arka Plan Beyaz Dalga Çizgisi */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <svg viewBox="0 0 500 160" className="w-full h-full opacity-60 sm:opacity-75" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="heroBackdropGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.10" />
                            <stop offset="65%" stopColor="#ffffff" stopOpacity="0.02" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="heroLineGlow" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
                            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.60" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.90" />
                        </linearGradient>
                    </defs>
                    {/* Alan Dolgusu */}
                    <path
                        d="M 0,118 C 60,130 90,125 140,112 C 190,99 220,118 270,103 C 320,88 360,95 400,72 C 430,55 465,38 500,24 L 500,160 L 0,160 Z"
                        fill="url(#heroBackdropGrad)"
                    />
                    {/* İnce Kıvrımlı Beyaz Çizgi */}
                    <path
                        d="M 0,118 C 60,130 90,125 140,112 C 190,99 220,118 270,103 C 320,88 360,95 400,72 C 430,55 465,38 500,24"
                        fill="none"
                        stroke="url(#heroLineGlow)"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <circle cx="499" cy="24" r="2.5" fill="#ffffff" opacity="0.85" className="animate-pulse" />
                </svg>
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full">
                {/* 1. Üst Başlık */}
                <div className={`flex items-center justify-between gap-2 border-b border-white/15 ${compact ? 'pb-1.5' : 'pb-2.5'}`}>
                    <div className="flex items-center gap-2">
                        <div className={`rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 ${compact ? 'w-6 h-6' : 'w-7 h-7'}`}>
                            <Wallet className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-white`} />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <h3 className={`font-semibold text-white tracking-tight ${compact ? 'text-xs' : 'text-xs sm:text-[13px]'}`}>
                                Toplam Varlık Değeri
                            </h3>
                            {/* Göz İkonu */}
                            <button
                                onClick={() => setIsBalanceHidden(prev => !prev)}
                                title={isBalanceHidden ? "Bakiyeyi Göster" : "Bakiyeyi Gizle"}
                                className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                                aria-label="Bakiyeyi Gizle / Göster"
                            >
                                {isBalanceHidden ? (
                                    <EyeOff className="w-3.5 h-3.5" />
                                ) : (
                                    <Eye className="w-3.5 h-3.5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Sağ Üst Sade Durum Rozeti */}
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/10 border border-white/20 text-white font-medium ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Canlı Portföy</span>
                    </div>
                </div>

                {/* 2. Büyük Rakam ve Değişim Rozeti (Orta Bölüm) */}
                <div className={compact ? "py-1.5 my-auto" : "my-auto py-2"}>
                    <h2 className={`font-extrabold text-white tracking-tight truncate leading-none ${
                        compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl lg:text-[42px]'
                    }`}>
                        {isBalanceHidden ? "₺ ••••••••" : formatCurrency(totalValue)}
                    </h2>

                    {/* Değişim Rozeti */}
                    <div className={`flex items-center gap-1.5 ${compact ? 'mt-1.5' : 'mt-2.5'}`}>
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${
                            compact ? 'text-[11px]' : 'text-xs'
                        } ${
                            isPositive
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                                : "bg-rose-500/15 text-rose-400 border border-rose-500/25"
                        }`}>
                            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span>{isPositive ? "+" : ""}%{Math.abs(profitRatio).toFixed(2)}</span>
                        </div>
                        <span className={`text-blue-200/70 font-normal ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
                            (Net Getiri)
                        </span>
                    </div>
                </div>

                {/* 3. Alt Bilgi Şeridi */}
                <div className={`grid grid-cols-3 gap-2 border-t border-white/15 text-left ${compact ? 'pt-1.5' : 'pt-2.5'}`}>
                    <div>
                        <span className={`font-normal text-blue-200/70 block ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
                            Toplam Yatırım
                        </span>
                        <span className={`font-semibold text-white block truncate ${compact ? 'text-xs mt-0.5' : 'text-xs sm:text-[13px] mt-0.5'}`}>
                            {isBalanceHidden ? "₺ ••••••" : formatCurrency(totalCost)}
                        </span>
                    </div>

                    <div>
                        <span className={`font-normal text-blue-200/70 block ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
                            Toplam Kar / Zarar
                        </span>
                        <span className={`font-semibold block truncate ${compact ? 'text-xs mt-0.5' : 'text-xs sm:text-[13px] mt-0.5'} ${
                            isPositive ? "text-emerald-300" : "text-rose-300"
                        }`}>
                            {isBalanceHidden
                                ? (isPositive ? "+₺ •••" : "-₺ •••")
                                : `${isPositive ? "+" : ""}${formatCurrency(totalProfit)}`}
                        </span>
                    </div>

                    <div>
                        <span className={`font-normal text-blue-200/70 block ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
                            Portföy Pozisyonu
                        </span>
                        <span className={`font-semibold text-white block truncate ${compact ? 'text-xs mt-0.5' : 'text-xs sm:text-[13px] mt-0.5'}`}>
                            {myAssets.length} Aktif Varlık
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
