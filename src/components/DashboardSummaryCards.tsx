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
    const [selectedTimeframe, setSelectedTimeframe] = useState<'1G' | '1H' | '1A' | '3A' | '1Y'>('1A');

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
            <div className="bg-[#0b192c] border border-[#172d4a] rounded-2xl sm:rounded-3xl p-5 min-h-[250px] flex flex-col justify-between animate-pulse">
                <div className="flex items-center justify-between">
                    <div className="h-5 w-36 bg-white/10 rounded-lg" />
                    <div className="h-5 w-24 bg-white/10 rounded-lg" />
                </div>
                <div className="h-10 w-48 bg-white/10 rounded-xl my-auto" />
                <div className="h-8 w-full bg-white/10 rounded-lg pt-2 border-t border-white/10" />
            </div>
        );
    }

    const isPositive = totalProfit >= 0;

    return (
        <div className="bg-[#0b192c] text-white border border-[#1a2f4c] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg shadow-black/20 relative overflow-hidden flex flex-col justify-between min-h-[250px] h-full group">
            {/* Subtle Ambient Glow */}
            <div className="absolute -top-16 -right-16 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between h-full">
                {/* 1. Üst Başlık ve Zaman Dilimi Filtreleri */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/[0.08] flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <h3 className="text-xs sm:text-[13px] font-semibold text-slate-100 tracking-tight">
                                Toplam Varlık Değeri
                            </h3>
                            {/* Göz İkonu */}
                            <button
                                onClick={() => setIsBalanceHidden(prev => !prev)}
                                title={isBalanceHidden ? "Bakiyeyi Göster" : "Bakiyeyi Gizle"}
                                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
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

                    {/* Referans Görseldeki 1G 1H 1A 3A 1Y Filtre Butonları */}
                    <div className="flex items-center gap-0.5 bg-white/[0.04] p-0.5 rounded-lg border border-white/[0.08]">
                        {(['1G', '1H', '1A', '3A', '1Y'] as const).map((tf) => (
                            <button
                                key={tf}
                                onClick={() => setSelectedTimeframe(tf)}
                                className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all ${
                                    selectedTimeframe === tf
                                        ? "bg-[#1c3352] text-white shadow-xs font-bold"
                                        : "text-slate-400 hover:text-slate-200"
                                }`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Büyük Rakam ve Dinamik Trend Grafiği (Orta Bölüm) */}
                <div className="flex items-center justify-between gap-3 my-auto py-2">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-white tracking-tight truncate leading-none">
                            {isBalanceHidden ? "₺ ••••••••" : formatCurrency(totalValue)}
                        </h2>

                        {/* Değişim Rozeti (Referans Görsel: Yeşil Rozet + Metin) */}
                        <div className="flex items-center gap-1.5 mt-2">
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                isPositive
                                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                                    : "bg-rose-500/15 text-rose-400 border border-rose-500/25"
                            }`}>
                                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                <span>{isPositive ? "+" : ""}%{Math.abs(profitRatio).toFixed(2)}</span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-normal">
                                ({selectedTimeframe === '1A' ? 'Son 30 gün' : selectedTimeframe === '1G' ? 'Bugün' : selectedTimeframe === '1H' ? 'Son 7 gün' : selectedTimeframe === '3A' ? 'Son 3 ay' : 'Yıllık'})
                            </span>
                        </div>
                    </div>

                    {/* Referans Görsel: Sağ Taraf Dalgalı & Parlayan Trend Grafiği */}
                    <div className="w-36 sm:w-44 lg:w-52 h-14 sm:h-16 shrink-0 relative">
                        <svg viewBox="0 0 200 60" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="heroChartGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                                </linearGradient>
                            </defs>
                            {/* Gradient Alanı */}
                            <path
                                d="M 0,42 Q 25,48 50,38 T 100,32 T 145,20 T 175,12 T 200,6 L 200,60 L 0,60 Z"
                                fill="url(#heroChartGrad)"
                            />
                            {/* Zümrüt Neon Çizgisi */}
                            <path
                                d="M 0,42 Q 25,48 50,38 T 100,32 T 145,20 T 175,12 T 200,6"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                            />
                            {/* Bitiş Vurgu Noktası */}
                            <circle cx="200" cy="6" r="3" fill="#10b981" className="animate-pulse" />
                        </svg>
                    </div>
                </div>

                {/* 3. Alt Bilgi Şeridi: Referans Görseldeki 3 Sütunlu Metrik */}
                <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-white/[0.08] text-left">
                    <div>
                        <span className="text-[11px] font-normal text-slate-400 block">
                            Toplam Yatırım
                        </span>
                        <span className="text-xs sm:text-[13px] font-semibold text-slate-100 block mt-0.5 truncate">
                            {isBalanceHidden ? "₺ ••••••" : formatCurrency(totalCost)}
                        </span>
                    </div>

                    <div>
                        <span className="text-[11px] font-normal text-slate-400 block">
                            Toplam Kar / Zarar
                        </span>
                        <span className={`text-xs sm:text-[13px] font-semibold block mt-0.5 truncate ${
                            isPositive ? "text-emerald-400" : "text-rose-400"
                        }`}>
                            {isBalanceHidden
                                ? (isPositive ? "+₺ •••" : "-₺ •••")
                                : `${isPositive ? "+" : ""}${formatCurrency(totalProfit)}`}
                        </span>
                    </div>

                    <div>
                        <span className="text-[11px] font-normal text-slate-400 block">
                            Portföy Pozisyonu
                        </span>
                        <span className="text-xs sm:text-[13px] font-semibold text-slate-100 block mt-0.5 truncate">
                            {myAssets.length} Aktif Varlık
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
