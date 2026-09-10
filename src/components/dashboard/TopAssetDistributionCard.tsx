"use client";

import { useMemo, useState } from "react";
import { PieChart, ArrowRight, Layers } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";
import Link from "next/link";

// FinAi kurumsal renk paleti (referans görseldeki dengeli lacivert ve mavi tonları)
const DISTRIBUTION_COLORS = [
    "#00008B", // Koyu Lacivert (FinAi İmzası)
    "#1d4ed8", // Canlı Mavi
    "#0284c7", // Okyanus Mavisi
    "#10b981", // Zümrüt Yeşili
    "#94a3b8", // Nötr Slate (Diğer)
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

    // Mevcut portföy verilerinden dağılım ve yüzde hesaplaması (KESİNLİKLE DOKUNULMADI)
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

        // En büyük 4 varlık + Kalanlar "Diğer"
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

    // Donut SVG ölçüleri (Daha belirgin ve dolgun)
    const RADIUS = 36;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~226.19

    if (!isDataLoaded) {
        return (
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 min-h-[250px] flex flex-col justify-between animate-pulse">
                <div className="flex items-center justify-between">
                    <div className="h-5 w-32 bg-slate-100 rounded-lg" />
                    <div className="h-4 w-16 bg-slate-100 rounded-md" />
                </div>
                <div className="flex items-center justify-center my-auto">
                    <div className="w-24 h-24 rounded-full border-8 border-slate-100" />
                </div>
                <div className="h-3.5 w-full bg-slate-100 rounded-md" />
            </div>
        );
    }

    const hasData = distributionItems.length > 0 && totalValue > 0;
    const activeItem = hoveredSymbol ? distributionItems.find(i => i.name === hoveredSymbol) : null;

    let cumulativeOffset = 0;

    return (
        <div className="bg-white border border-slate-200/90 hover:border-blue-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-300 min-h-[250px] h-full flex flex-col justify-between group">
            {/* 1. Üst Başlık (Referans Görsel Hiyerarşisi) */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <PieChart className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
                            Varlık Dağılımı
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium">
                            Portföy ağırlıkları ve paylar
                        </p>
                    </div>
                </div>

                <Link
                    href="/dashboard/portfolio?focus=distribution"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                    Tümünü Gör <ArrowRight className="w-3 h-3" />
                </Link>
            </div>

            {/* 2. Orta İçerik: Donut Grafik + Dağılım Listesi */}
            {hasData ? (
                <div className="flex items-center gap-3 my-auto py-1.5">
                    {/* Donut Grafik */}
                    <div className="relative w-24 h-24 sm:w-26 sm:h-26 shrink-0 flex items-center justify-center mx-auto sm:mx-0">
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
                                        strokeWidth={isHovered ? 12 : 9}
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

                        {/* Donut İçi Bilgi */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-0.5">
                            {activeItem ? (
                                <>
                                    <span className="text-[10px] font-bold text-blue-600 truncate max-w-[65px]">
                                        {activeItem.name}
                                    </span>
                                    <span className="text-xs font-bold text-slate-800">
                                        %{activeItem.percentage.toFixed(1)}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="text-[8.5px] font-medium text-slate-400 uppercase tracking-wider">
                                        Toplam
                                    </span>
                                    <span className="text-[11px] sm:text-xs font-bold text-slate-800 truncate max-w-[70px]">
                                        {formatCurrency(totalValue)}
                                    </span>
                                    <span className="text-[8.5px] font-semibold text-blue-600">
                                        {activeCount} Varlık
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Varlık Listesi */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                        {distributionItems.map((item) => {
                            const isHovered = hoveredSymbol === item.name;
                            return (
                                <div
                                    key={item.name}
                                    onMouseEnter={() => setHoveredSymbol(item.name)}
                                    onMouseLeave={() => setHoveredSymbol(null)}
                                    className={`flex items-center justify-between gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer ${
                                        isHovered ? "bg-slate-50 shadow-2xs scale-[1.01]" : "hover:bg-slate-50/70"
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <div
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="text-xs font-bold text-slate-800 shrink-0">
                                            {item.name}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <span className="text-[10.5px] font-medium text-slate-400 hidden 2xl:inline">
                                            {formatCurrency(item.value)}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                            %{item.percentage.toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* Boş Varlık Durumu */
                <div className="flex flex-col items-center justify-center py-4 gap-1.5 text-center my-auto">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                        <Layers className="w-4 h-4 text-slate-300" />
                    </div>
                    <p className="text-xs font-bold text-slate-600">Henüz kayıtlı varlık yok</p>
                    <p className="text-[10px] text-slate-400 max-w-[200px]">
                        Portföyünüze varlık eklediğinizde dağılım otomatik olarak burada şekillenecektir.
                    </p>
                </div>
            )}

            {/* 3. Alt Durum Çubuğu */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>{activeCount} Aktif Pozisyon</span>
                <span className="text-blue-600 font-semibold uppercase tracking-wider">Dengeli Portföy</span>
            </div>
        </div>
    );
}
