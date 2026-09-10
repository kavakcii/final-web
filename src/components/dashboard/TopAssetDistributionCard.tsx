"use client";

import { useMemo, useState } from "react";
import { PieChart, ArrowRight, Layers } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";
import Link from "next/link";

// Kontrollü ve dingin fintech renk paleti (aşırı renk cümbüşünden uzak)
const DISTRIBUTION_COLORS = [
    "#00008B", // Koyu Lacivert (FinAi Temel Rengi)
    "#2563EB", // Kraliyet Mavisi
    "#0EA5E9", // Gökyüzü Mavisi
    "#6366F1", // İndigo
    "#94A3B8", // Nötr Gri (Diğer / Denge)
];

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(val);
};

export function TopAssetDistributionCard() {
    const { myAssets = [], prices = {}, isDataLoaded } = useUser();
    const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);

    // Mevcut portföy verilerinden dağılım ve yüzde hesaplaması
    const { distributionItems, totalValue, activeCount } = useMemo(() => {
        let total = 0;
        const assetMap = new Map<string, { symbol: string; value: number }>();

        myAssets.forEach((asset: any) => {
            const rawSymbol = asset.symbol ? asset.symbol.toUpperCase().trim() : "";
            const cleanSymbol = rawSymbol.replace(/\.IS$/, '');
            const currentPrice = prices[rawSymbol] ?? prices[cleanSymbol] ?? prices[`${cleanSymbol}.IS`] ?? asset.avgCost ?? 0;
            const val = currentPrice * asset.quantity;

            total += val;

            if (assetMap.has(cleanSymbol)) {
                assetMap.get(cleanSymbol)!.value += val;
            } else {
                assetMap.set(cleanSymbol, { symbol: cleanSymbol, value: val });
            }
        });

        const sorted = Array.from(assetMap.values()).sort((a, b) => b.value - a.value);

        // Okunabilirlik için: En büyük 4 varlık + Kalanlar "Diğer"
        let items: { name: string; value: number; percentage: number; color: string }[] = [];

        if (sorted.length > 4) {
            const top4 = sorted.slice(0, 4);
            const othersValue = sorted.slice(4).reduce((sum, a) => sum + a.value, 0);

            items = [
                ...top4.map((a, idx) => ({
                    name: a.symbol,
                    value: a.value,
                    percentage: total > 0 ? (a.value / total) * 100 : 0,
                    color: DISTRIBUTION_COLORS[idx % DISTRIBUTION_COLORS.length]
                })),
                {
                    name: "Diğer",
                    value: othersValue,
                    percentage: total > 0 ? (othersValue / total) * 100 : 0,
                    color: DISTRIBUTION_COLORS[4]
                }
            ];
        } else {
            items = sorted.map((a, idx) => ({
                name: a.symbol,
                value: a.value,
                percentage: total > 0 ? (a.value / total) * 100 : 0,
                color: DISTRIBUTION_COLORS[idx % DISTRIBUTION_COLORS.length]
            }));
        }

        return {
            distributionItems: items,
            totalValue: total,
            activeCount: sorted.length
        };
    }, [myAssets, prices]);

    // Donut SVG hesaplamaları (Çevre C = 2 * PI * r)
    const RADIUS = 38;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

    if (!isDataLoaded) {
        return (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs min-h-[290px] sm:min-h-[310px] flex flex-col justify-between animate-pulse">
                <div className="flex items-center justify-between">
                    <div className="h-5 w-32 bg-slate-100 rounded-lg" />
                    <div className="h-5 w-16 bg-slate-100 rounded-lg" />
                </div>
                <div className="flex items-center justify-center py-6">
                    <div className="w-28 h-28 rounded-full border-4 border-slate-100" />
                </div>
                <div className="space-y-2">
                    <div className="h-3 w-full bg-slate-100 rounded-md" />
                    <div className="h-3 w-3/4 bg-slate-100 rounded-md" />
                </div>
            </div>
        );
    }

    const hasData = distributionItems.length > 0 && totalValue > 0;
    const activeItem = hoveredSymbol ? distributionItems.find(i => i.name === hoveredSymbol) : null;

    let cumulativeOffset = 0;

    return (
        <div className="bg-white border border-slate-200/80 hover:border-[#00008B]/20 rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-300 min-h-[290px] sm:min-h-[310px] flex flex-col justify-between group">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#00008B]/5 border border-[#00008B]/10 flex items-center justify-center text-[#00008B] shrink-0">
                        <PieChart className="w-4 h-4 text-[#00008B]" />
                    </div>
                    <div>
                        <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#00008B]">
                            Varlık Dağılımı
                        </h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            Portföy Ağırlıkları
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold text-[#00008B] bg-[#00008B]/5 border border-[#00008B]/10 px-2.5 py-1 rounded-xl">
                        {activeCount} Varlık
                    </span>
                </div>
            </div>

            {/* İçerik Alanı */}
            {hasData ? (
                <div className="flex items-center gap-4 sm:gap-6 my-auto py-2">
                    {/* Modern SVG Donut Grafik */}
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center mx-auto sm:mx-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                            {distributionItems.map((item) => {
                                const strokeLength = (item.percentage / 100) * CIRCUMFERENCE;
                                const strokeDasharray = `${strokeLength} ${CIRCUMFERENCE - strokeLength}`;
                                const strokeDashoffset = -cumulativeOffset;
                                cumulativeOffset += strokeLength;

                                const isHovered = hoveredSymbol === item.name;

                                return (
                                    <circle
                                        key={item.name}
                                        cx="50"
                                        cy="50"
                                        r={RADIUS}
                                        fill="transparent"
                                        stroke={item.color}
                                        strokeWidth={isHovered ? 13 : 9}
                                        strokeDasharray={strokeDasharray}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                        className="transition-all duration-300 cursor-pointer"
                                        onMouseEnter={() => setHoveredSymbol(item.name)}
                                        onMouseLeave={() => setHoveredSymbol(null)}
                                    />
                                );
                            })}
                        </svg>

                        {/* Donut Ortası: Hover Durumu veya Genel Durum */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-1">
                            {activeItem ? (
                                <>
                                    <span className="text-[10px] font-black text-[#00008B] truncate max-w-[70px]">
                                        {activeItem.name}
                                    </span>
                                    <span className="text-xs font-black text-slate-700">
                                        %{activeItem.percentage.toFixed(1)}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                                        Toplam
                                    </span>
                                    <span className="text-[11px] font-black text-[#00008B] truncate max-w-[72px]">
                                        {formatCurrency(totalValue)}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Dağılım Listesi */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                        {distributionItems.map((item) => {
                            const isHovered = hoveredSymbol === item.name;
                            return (
                                <div
                                    key={item.name}
                                    onMouseEnter={() => setHoveredSymbol(item.name)}
                                    onMouseLeave={() => setHoveredSymbol(null)}
                                    className={`flex items-center justify-between gap-2 px-2 py-1 rounded-xl transition-all cursor-pointer ${
                                        isHovered ? "bg-slate-50 shadow-2xs scale-[1.01]" : "hover:bg-slate-50/50"
                                    }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="text-xs font-bold text-slate-700 truncate">
                                            {item.name}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                                            {formatCurrency(item.value)}
                                        </span>
                                        <span className="text-[11px] font-black text-[#00008B] bg-slate-100 px-1.5 py-0.5 rounded-md">
                                            %{item.percentage.toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* Boş Portföy Durumu */
                <div className="flex flex-col items-center justify-center py-6 gap-2 text-center my-auto">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                        <Layers className="w-5 h-5 text-slate-300" />
                    </div>
                    <p className="text-xs font-bold text-slate-600">Portföyünüzde henüz varlık yok</p>
                    <p className="text-[10px] text-slate-400 max-w-[200px]">
                        Varlık ekledikten sonra dağılım grafiğiniz burada görüntülenecektir.
                    </p>
                </div>
            )}

            {/* Alt Bilgi / Portföy Linki */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">
                    Ağırlık dengesi
                </span>
                <Link
                    href="/dashboard/portfolio?focus=distribution"
                    className="inline-flex items-center gap-1 text-[10px] font-black text-[#00008B] hover:text-blue-600 transition-colors uppercase tracking-wider"
                >
                    Detaylar <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
        </div>
    );
}
