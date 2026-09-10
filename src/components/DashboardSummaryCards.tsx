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
            <div className="bg-[#00008B] border border-blue-900 rounded-2xl sm:rounded-3xl p-5 min-h-[250px] flex flex-col justify-between animate-pulse">
                <div className="flex items-center justify-between">
                    <div className="h-5 w-36 bg-white/10 rounded-lg" />
                    <div className="h-5 w-16 bg-white/10 rounded-lg" />
                </div>
                <div className="h-10 w-48 bg-white/10 rounded-xl my-auto" />
                <div className="h-8 w-full bg-white/10 rounded-lg pt-2 border-t border-white/10" />
            </div>
        );
    }

    const isPositive = totalProfit >= 0;

    return (
        <div className="bg-[#00008B] text-white border border-[#00008B] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl shadow-[#00008B]/25 relative overflow-hidden flex flex-col justify-between min-h-[250px] h-full group">
            {/* Subtle Ambient Glow */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />

            {/* Arka Plan Beyaz Dalga Çizgisi (Widget Arka Planı Ambient Backdrop) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <svg viewBox="0 0 500 160" className="w-full h-full opacity-70 sm:opacity-85" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="heroBackdropGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
                            <stop offset="65%" stopColor="#ffffff" stopOpacity="0.04" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="heroLineGlow" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
                            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.75" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
                        </linearGradient>
                    </defs>
                    {/* Alan Dolgusu */}
                    <path
                        d="M 0,115 Q 100,130 200,105 T 350,90 T 440,55 T 500,28 L 500,160 L 0,160 Z"
                        fill="url(#heroBackdropGrad)"
                    />
                    {/* Parlayan Çizgi */}
                    <path
                        d="M 0,115 Q 100,130 200,105 T 350,90 T 440,55 T 500,28"
                        fill="none"
                        stroke="url(#heroLineGlow)"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                    />
                    <circle cx="498" cy="28" r="3.5" fill="#ffffff" className="animate-pulse" />
                </svg>
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full">
                {/* 1. Üst Başlık (Zaman Dilimleri Kaldırıldı, Sadeleşti) */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/15">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                            <Wallet className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <h3 className="text-xs sm:text-[13px] font-semibold text-white tracking-tight">
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
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/10 border border-white/20 text-[10px] text-white font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Canlı Portföy</span>
                    </div>
                </div>

                {/* 2. Büyük Rakam ve Değişim Rozeti (Orta Bölüm) */}
                <div className="my-auto py-2">
                    <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-white tracking-tight truncate leading-none">
                        {isBalanceHidden ? "₺ ••••••••" : formatCurrency(totalValue)}
                    </h2>

                    {/* Değişim Rozeti */}
                    <div className="flex items-center gap-1.5 mt-2.5">
                        <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isPositive
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                                : "bg-rose-500/15 text-rose-400 border border-rose-500/25"
                        }`}>
                            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span>{isPositive ? "+" : ""}%{Math.abs(profitRatio).toFixed(2)}</span>
                        </div>
                        <span className="text-[11px] text-blue-200/70 font-normal">
                            (Net Getiri)
                        </span>
                    </div>
                </div>

                {/* 3. Alt Bilgi Şeridi: Referans Görseldeki 3 Sütunlu Metrik */}
                <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-white/15 text-left">
                    <div>
                        <span className="text-[11px] font-normal text-blue-200/70 block">
                            Toplam Yatırım
                        </span>
                        <span className="text-xs sm:text-[13px] font-semibold text-white block mt-0.5 truncate">
                            {isBalanceHidden ? "₺ ••••••" : formatCurrency(totalCost)}
                        </span>
                    </div>

                    <div>
                        <span className="text-[11px] font-normal text-blue-200/70 block">
                            Toplam Kar / Zarar
                        </span>
                        <span className={`text-xs sm:text-[13px] font-semibold block mt-0.5 truncate ${
                            isPositive ? "text-emerald-300" : "text-rose-300"
                        }`}>
                            {isBalanceHidden
                                ? (isPositive ? "+₺ •••" : "-₺ •••")
                                : `${isPositive ? "+" : ""}${formatCurrency(totalProfit)}`}
                        </span>
                    </div>

                    <div>
                        <span className="text-[11px] font-normal text-blue-200/70 block">
                            Portföy Pozisyonu
                        </span>
                        <span className="text-xs sm:text-[13px] font-semibold text-white block mt-0.5 truncate">
                            {myAssets.length} Aktif Varlık
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
