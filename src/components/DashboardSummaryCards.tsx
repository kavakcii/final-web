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
            <div className="bg-[#091629] border border-white/10 rounded-3xl p-6 min-h-[310px] flex flex-col justify-between animate-pulse">
                <div className="flex items-center justify-between">
                    <div className="h-6 w-40 bg-white/10 rounded-xl" />
                    <div className="h-6 w-24 bg-white/10 rounded-xl" />
                </div>
                <div className="h-12 w-64 bg-white/10 rounded-2xl my-auto" />
                <div className="h-10 w-full bg-white/10 rounded-xl pt-3 border-t border-white/10" />
            </div>
        );
    }

    const isPositive = totalProfit >= 0;

    return (
        <div className="bg-gradient-to-br from-[#061224] via-[#091b33] to-[#0c243f] text-white border border-white/15 rounded-3xl p-5 sm:p-6 shadow-xl shadow-[#00008B]/10 relative overflow-hidden flex flex-col justify-between min-h-[310px] group">
            {/* Ambient Background Glow (Referans görseldeki yeşil/mavi ışıma) */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between h-full">
                {/* 1. Üst Başlık ve Zaman Dilimi Filtreleri */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                            <Wallet className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs sm:text-[13px] font-bold text-white tracking-tight">
                                Toplam Varlık Değeri
                            </h3>
                            {/* Göz İkonu */}
                            <button
                                onClick={() => setIsBalanceHidden(prev => !prev)}
                                title={isBalanceHidden ? "Bakiyeyi Göster" : "Bakiyeyi Gizle"}
                                className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
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
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                        {(['1G', '1H', '1A', '3A', '1Y'] as const).map((tf) => (
                            <button
                                key={tf}
                                onClick={() => setSelectedTimeframe(tf)}
                                className={`px-2 py-0.5 text-[10px] font-extrabold rounded-lg transition-all ${
                                    selectedTimeframe === tf
                                        ? "bg-blue-600 text-white shadow-sm font-black"
                                        : "text-white/60 hover:text-white"
                                }`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Büyük Rakam ve Neon Büyüme Çizgisi (Orta Bölüm) */}
                <div className="flex items-center justify-between gap-4 my-auto py-3">
                    <div className="min-w-0">
                        <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-black text-white tracking-tight truncate leading-none">
                            {isBalanceHidden ? "₺ ••••••••" : formatCurrency(totalValue)}
                        </h2>

                        {/* Değişim Rozeti (Referans Görseldeki Gibi Yeşil Rozet + Metin) */}
                        <div className="flex items-center gap-2 mt-2.5">
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-black ${
                                isPositive
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            }`}>
                                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                <span>{isPositive ? "+" : ""}%{Math.abs(profitRatio).toFixed(2)}</span>
                            </div>
                            <span className="text-[11px] font-medium text-white/50">
                                ({selectedTimeframe === '1A' ? 'Son 30 gün' : selectedTimeframe === '1G' ? 'Bugün' : selectedTimeframe === '1H' ? 'Son 7 gün' : selectedTimeframe === '3A' ? 'Son 3 ay' : 'Yıllık'})
                            </span>
                        </div>
                    </div>

                    {/* Referans Görseldeki Sağ Taraf Yükselen Neon Grafik Dalgası */}
                    <div className="hidden sm:block w-36 lg:w-44 h-16 shrink-0 relative">
                        <svg viewBox="0 0 160 60" className="w-full h-full overflow-visible">
                            <defs>
                                <linearGradient id="neonGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                                </linearGradient>
                            </defs>
                            {/* Dolgu Alanı */}
                            <path
                                d="M 0,45 Q 25,48 45,35 T 90,25 T 130,12 T 160,5 L 160,60 L 0,60 Z"
                                fill="url(#neonGradient)"
                            />
                            {/* Parlayan Çizgi */}
                            <path
                                d="M 0,45 Q 25,48 45,35 T 90,25 T 130,12 T 160,5"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                            {/* Uç Nokta Parıltısı */}
                            <circle cx="160" cy="5" r="3.5" fill="#10b981" className="animate-pulse" />
                        </svg>
                    </div>
                </div>

                {/* 3. Alt Bilgi Şeridi: Referans Görseldeki 3 Sütunlu Metrik */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-left">
                    <div>
                        <span className="text-[10px] font-bold text-white/50 block uppercase tracking-wider">
                            Toplam Yatırım
                        </span>
                        <span className="text-xs sm:text-[13px] font-bold text-white block mt-0.5 truncate">
                            {isBalanceHidden ? "₺ ••••••" : formatCurrency(totalCost)}
                        </span>
                    </div>

                    <div>
                        <span className="text-[10px] font-bold text-white/50 block uppercase tracking-wider">
                            Toplam Kar / Zarar
                        </span>
                        <span className={`text-xs sm:text-[13px] font-bold block mt-0.5 truncate ${
                            isPositive ? "text-emerald-400" : "text-rose-400"
                        }`}>
                            {isBalanceHidden
                                ? (isPositive ? "+₺ •••" : "-₺ •••")
                                : `${isPositive ? "+" : ""}${formatCurrency(totalProfit)}`}
                        </span>
                    </div>

                    <div>
                        <span className="text-[10px] font-bold text-white/50 block uppercase tracking-wider">
                            Portföy Pozisyonu
                        </span>
                        <span className="text-xs sm:text-[13px] font-bold text-white block mt-0.5 truncate">
                            {myAssets.length} Aktif Varlık
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
