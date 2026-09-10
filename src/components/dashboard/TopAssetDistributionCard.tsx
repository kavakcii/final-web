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
    const RADIUS = 40;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~251.32

    if (!isDataLoaded) {
        return (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 min-h-[310px] flex flex-col justify-between animate-pulse">
                <div className="flex items-center justify-between">
                    <div className="h-6 w-36 bg-slate-100 rounded-xl" />
                    <div className="h-5 w-20 bg-slate-100 rounded-lg" />
                </div>
                <div className="flex items-center justify-center my-auto">
                    <div className="w-36 h-36 rounded-full border-8 border-slate-100" />
                </div>
                <div className="h-4 w-full bg-slate-100 rounded-md" />
            </div>
        );
    }

    const hasData = distributionItems.length > 0 && totalValue > 0;
    const activeItem = hoveredSymbol ? distributionItems.find(i => i.name === hoveredSymbol) : null;

    let cumulativeOffset = 0;

    return (
        <div className="bg-white border border-slate-200/90 hover:border-[#00008B]/25 rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-300 min-h-[310px] flex flex-col justify-between group">
            {/* 1. Üst Başlık (Referans Görsel Hiyerarşisi) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#00008B]/5 border border-[#00008B]/10 flex items-center justify-center text-[#00008B] shrink-0">
                        <PieChart className="w-4 h-4 text-[#00008B]" />
                    </div>
                    <div>
                        <h3 className="text-xs sm:text-[13px] font-bold text-[#00008B] tracking-tight">
                            Varlık Dağılımı
                        </h3>
                        <p className="text-[10px] font-semibold text-slate-400">
                            Portföy ağırlıkları ve paylar
                        </p>
                    </div>
                </div>

                <Link
                    href="/dashboard/portfolio?focus=distribution"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00008B] hover:text-blue-700 transition-colors"
                >
                    Tümünü Gör <ArrowRight className="w-3 h-3" />
                </Link>
            </div>

            {/* 2. Orta İçerik: Belirgin Donut + Zengin Dağılım Listesi */}
            {hasData ? (
                <div className="flex items-center gap-4 lg:gap-5 my-auto py-2">
                    {/* Donut Grafik (Büyütülmüş & İnce Çizgili) */}
                    <div className="relative w-32 h-32 sm:w-36 sm:h-36 shrink-0 flex items-center justify-center mx-auto sm:mx-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 filter drop-shadow-xs">
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
                                        strokeWidth={isHovered ? 14 : 10}
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
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-1">
                            {activeItem ? (
                                <>
                                    <span className="text-[11px] font-black text-[#00008B] truncate max-w-[80px]">
                                        {activeItem.name}
                                    </span>
                                    <span className="text-sm font-black text-slate-800">
                                        %{activeItem.percentage.toFixed(1)}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                        Toplam Portföy
                                    </span>
                                    <span className="text-xs font-black text-[#00008B] truncate max-w-[84px]">
                                        {formatCurrency(totalValue)}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Varlık Listesi */}
                    <div className="flex-1 min-w-0 space-y-2">
                        {distributionItems.map((item) => {
                            const isHovered = hoveredSymbol === item.name;
                            return (
                                <div
                                    key={item.name}
                                    onMouseEnter={() => setHoveredSymbol(item.name)}
                                    onMouseLeave={() => setHoveredSymbol(null)}
                                    className={`flex items-center justify-between gap-2 px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                                        isHovered ? "bg-slate-50 shadow-2xs scale-[1.01]" : "hover:bg-slate-50/60"
                                    }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="text-xs font-bold text-slate-800 truncate">
                                            {item.name}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[11px] font-semibold text-slate-400 hidden xl:inline">
                                            {formatCurrency(item.value)}
                                        </span>
                                        <span className="text-[11px] font-black text-[#00008B] bg-slate-100/90 px-2 py-0.5 rounded-md">
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
                <div className="flex flex-col items-center justify-center py-6 gap-2 text-center my-auto">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                        <Layers className="w-5 h-5 text-slate-300" />
                    </div>
                    <p className="text-xs font-bold text-slate-600">Henüz kayıtlı varlık yok</p>
                    <p className="text-[10px] text-slate-400 max-w-[220px]">
                        Portföyünüze varlık eklediğinizde dağılım otomatik olarak burada şekillenecektir.
                    </p>
                </div>
            )}

            {/* 3. Alt Durum Çubuğu */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span>{activeCount} farklı varlık pozisyonu</span>
                <span className="text-[#00008B] font-extrabold uppercase tracking-wider">Otomatik Dengeli</span>
            </div>
        </div>
    );
}
