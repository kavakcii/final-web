"use client";

import { useMemo, useState } from "react";
import { PieChart, ChevronRight, Layers } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";
import Link from "next/link";

// Referans görseldeki renk paleti (Mavi, Mor, Sarı, Gri, Zümrüt)
const DISTRIBUTION_COLORS = [
    "#2563EB", // Canlı Mavi (Hisse Senetleri vb.)
    "#8B5CF6", // Mor / Menekşe (Fonlar vb.)
    "#F59E0B", // Amber / Altın Sarısı
    "#94A3B8", // Nötr Gri / Nakit
    "#10B981", // Zümrüt Yeşili
];

const TYPE_NAMES: Record<string, string> = {
    STOCK: "Hisse Senetleri",
    FUND: "Fonlar",
    GOLD: "Altın",
    CASH: "Nakit",
    CRYPTO: "Kripto",
};

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
        const assetMap = new Map<string, { name: string; value: number; type: string }>();

        // Portföydeki varlık türü çeşitliliğini kontrol et
        const distinctTypes = new Set(myAssets.map((a: any) => a.type || 'STOCK'));
        const groupByClass = distinctTypes.size > 1;

        myAssets.forEach((asset: any) => {
            const rawSymbol = asset.symbol ? asset.symbol.toUpperCase().trim() : "";
            const cleanSymbol = rawSymbol.replace(/\.IS$/, '');
            const currentPrice = prices[rawSymbol] ?? prices[cleanSymbol] ?? prices[`${cleanSymbol}.IS`] ?? asset.avgCost ?? 0;
            const val = currentPrice * asset.quantity;

            total += val;

            const groupKey = groupByClass
                ? (TYPE_NAMES[asset.type] || asset.type || cleanSymbol)
                : cleanSymbol;

            if (assetMap.has(groupKey)) {
                assetMap.get(groupKey)!.value += val;
            } else {
                assetMap.set(groupKey, { name: groupKey, value: val, type: asset.type || 'STOCK' });
            }
        });

        const sorted = Array.from(assetMap.values()).sort((a, b) => b.value - a.value);

        let items: { name: string; value: number; percentage: number; color: string }[] = [];

        if (sorted.length > 4) {
            const top4 = sorted.slice(0, 4);
            const othersValue = sorted.slice(4).reduce((sum, a) => sum + a.value, 0);

            items = [
                ...top4.map((a, idx) => ({
                    name: a.name,
                    value: a.value,
                    percentage: total > 0 ? (a.value / total) * 100 : 0,
                    color: DISTRIBUTION_COLORS[idx % DISTRIBUTION_COLORS.length]
                })),
                {
                    name: "Diğer",
                    value: othersValue,
                    percentage: total > 0 ? (othersValue / total) * 100 : 0,
                    color: DISTRIBUTION_COLORS[3]
                }
            ];
        } else {
            items = sorted.map((a, idx) => ({
                name: a.name,
                value: a.value,
                percentage: total > 0 ? (a.value / total) * 100 : 0,
                color: DISTRIBUTION_COLORS[idx % DISTRIBUTION_COLORS.length]
            }));
        }

        return {
            distributionItems: items,
            totalValue: total,
            activeCount: myAssets.length
        };
    }, [myAssets, prices]);

    // Donut SVG ölçüleri (Büyütülmüş & Daha Okunaklı)
    const RADIUS = 38;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~238.76

    if (!isDataLoaded) {
        return (
            <div className="bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_55%,#f0f6fe_100%)] border border-slate-200/70 rounded-2xl sm:rounded-3xl p-4 sm:p-5 min-h-[250px] flex flex-col justify-between animate-pulse">
                <div className="flex items-center justify-between">
                    <div className="h-5 w-28 bg-slate-100 rounded-lg" />
                    <div className="h-4 w-4 bg-slate-100 rounded-md" />
                </div>
                <div className="flex items-center justify-center my-auto">
                    <div className="w-28 h-28 rounded-full border-8 border-slate-100" />
                </div>
            </div>
        );
    }

    const hasData = distributionItems.length > 0 && totalValue > 0;
    let cumulativeOffset = 0;

    return (
        <div className="bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_55%,#f0f6fe_100%)] border border-slate-200/70 hover:border-blue-200/70 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all duration-300 min-h-[250px] h-full flex flex-col justify-between group">
            {/* 1. Üst Başlık (Referans Görsel: İkon + Başlık + Sağda Chevron >) */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100/80">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-slate-100/80 flex items-center justify-center text-slate-700 shrink-0">
                        <PieChart className="w-3.5 h-3.5 text-slate-700" />
                    </div>
                    <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
                        Varlık Dağılımı
                    </h3>
                </div>

                <Link
                    href="/dashboard/portfolio?focus=distribution"
                    className="text-slate-400 hover:text-slate-700 transition-colors p-0.5"
                    title="Portföy Dağılımını İncele"
                >
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            {/* 2. Orta İçerik: Bir Tık Büyütülmüş Donut Grafik + Okunaklı Liste */}
            {hasData ? (
                <div className="flex items-center gap-3.5 my-auto py-2">
                    {/* Büyütülmüş Donut Grafik (Sol) */}
                    <div className="relative w-28 h-28 sm:w-30 sm:h-30 xl:w-32 xl:h-32 shrink-0 flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 filter drop-shadow-2xs">
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
                                        strokeWidth={isHovered ? 13 : 10.5}
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

                        {/* Donut İçi Toplam Bilgisi (Büyütülmüş ve Belirgin) */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-1">
                            <span className="text-[11px] font-normal text-slate-400 leading-tight">
                                Toplam
                            </span>
                            <span className="text-sm sm:text-[15px] font-black text-slate-900 tracking-tight mt-0.5 truncate max-w-[86px]">
                                {formatCurrency(totalValue)}
                            </span>
                        </div>
                    </div>

                    {/* Dağılım Listesi (Sağ - Büyütülmüş Yazılar ve Ferah Satırlar) */}
                    <div className="flex-1 min-w-0 space-y-2">
                        {distributionItems.map((item) => {
                            const isHovered = hoveredSymbol === item.name;
                            return (
                                <div
                                    key={item.name}
                                    onMouseEnter={() => setHoveredSymbol(item.name)}
                                    onMouseLeave={() => setHoveredSymbol(null)}
                                    className={`flex items-center justify-between gap-1.5 py-0.5 px-1 rounded transition-colors cursor-pointer ${
                                        isHovered ? "bg-slate-50" : ""
                                    }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="text-xs sm:text-[13px] font-semibold text-slate-800 truncate max-w-[85px] sm:max-w-[110px]">
                                            {item.name}
                                        </span>
                                    </div>

                                    <span className="text-xs sm:text-[13px] font-bold text-slate-900 tabular-nums ml-auto shrink-0">
                                        %{item.percentage.toFixed(1).replace('.', ',')}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* Boş Varlık Durumu */
                <div className="flex flex-col items-center justify-center py-4 gap-1 text-center my-auto">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                        <Layers className="w-4 h-4 text-slate-300" />
                    </div>
                    <p className="text-xs font-semibold text-slate-600">Henüz kayıtlı varlık yok</p>
                    <p className="text-[10px] text-slate-400 max-w-[180px]">
                        Portföyünüze varlık eklediğinizde dağılım burada listelenecektir.
                    </p>
                </div>
            )}
        </div>
    );
}

