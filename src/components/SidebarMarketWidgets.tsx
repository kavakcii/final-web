"use client";

import { useEffect, useState, memo } from "react";
import { TrendingUp, Coins, DollarSign, Euro, Bitcoin } from "lucide-react";

interface MarketItem {
    id: string;
    symbol: string;
    label: string;
    price: number;
    changePercent: number;
    currencySuffix?: string;
    icon: typeof TrendingUp;
}

const DEFAULT_MARKET_ITEMS: MarketItem[] = [
    { id: "bist", symbol: "XU100.IS", label: "BIST 100", price: 14000, changePercent: 0, currencySuffix: "", icon: TrendingUp },
    { id: "gold", symbol: "ALTIN", label: "Gram Altın", price: 6800, changePercent: 0, currencySuffix: " ₺", icon: Coins },
    { id: "usd", symbol: "TRY=X", label: "USD/TRY", price: 48.4, changePercent: 0, currencySuffix: " ₺", icon: DollarSign },
    { id: "eur", symbol: "EURTRY=X", label: "EUR/TRY", price: 56.2, changePercent: 0, currencySuffix: " ₺", icon: Euro },
    { id: "btc", symbol: "BTC-USD", label: "BTC/USD", price: 80000, changePercent: 0, currencySuffix: " $", icon: Bitcoin },
];

function formatPrice(val: number, maxDecimals: number = 2): string {
    if (!val || isNaN(val)) return "—";
    return val.toLocaleString("tr-TR", {
        minimumFractionDigits: maxDecimals,
        maximumFractionDigits: maxDecimals,
    });
}

function SidebarMarketWidgetsComponent() {
    const [items, setItems] = useState<MarketItem[]>(DEFAULT_MARKET_ITEMS);

    useEffect(() => {
        let isMounted = true;

        async function fetchMarketData() {
            try {
                const res = await fetch("/api/finance?symbols=XU100.IS,ALTIN,TRY=X,EURTRY=X,BTC-USD");
                if (!res.ok) return;
                const json = await res.json();
                if (!json.results || !Array.isArray(json.results) || !isMounted) return;

                const results = json.results;

                setItems(prev => prev.map(item => {
                    const match = results.find((r: any) => {
                        if (!r || !r.symbol) return false;
                        const s = r.symbol.toUpperCase();
                        if (item.symbol === "ALTIN") {
                            return s === "ALTIN" || s === "GA" || s.includes("XAU");
                        }
                        return s === item.symbol.toUpperCase() || s.replace(".IS", "") === item.symbol.toUpperCase();
                    });

                    if (match && typeof match.regularMarketPrice === "number" && match.regularMarketPrice > 0) {
                        return {
                            ...item,
                            price: match.regularMarketPrice,
                            changePercent: typeof match.regularMarketChangePercent === "number" 
                                ? match.regularMarketChangePercent 
                                : item.changePercent,
                        };
                    }
                    return item;
                }));
            } catch (err) {
                console.error("Sidebar market widgets fetch error:", err);
            }
        }

        fetchMarketData();
        const timer = setInterval(fetchMarketData, 45000); // 45 saniyede bir otomatik yenile
        return () => {
            isMounted = false;
            clearInterval(timer);
        };
    }, []);

    return (
        <div className="pt-3.5 pb-2.5 px-3 md:px-4 border-t border-slate-200/80 bg-white select-none">
            {/* Başlık & Canlı Rozeti */}
            <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-[10px] font-black tracking-widest uppercase text-slate-400">
                    PİYASA
                </span>
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-slate-400 tracking-tight">Canlı</span>
                </div>
            </div>

            {/* 5 Adet Mini Gösterge Satırı */}
            <div className="space-y-1">
                {items.map((item) => {
                    const Icon = item.icon;
                    const isPositive = item.changePercent >= 0;
                    const decimals = 2;

                    return (
                        <div
                            key={item.id}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50/70 hover:bg-slate-100/80 transition-colors duration-150 border border-slate-100/60"
                        >
                            {/* Sol: İkon & Varlık Adı */}
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-4 h-4 rounded-md bg-white flex items-center justify-center text-[#00008B] shadow-2xs shrink-0 border border-slate-200/50">
                                    <Icon className="w-2.5 h-2.5" />
                                </div>
                                <span className="text-[11px] font-bold text-slate-700 truncate tracking-tight">
                                    {item.label}
                                </span>
                            </div>

                            {/* Sağ: Değer & Yüzde Değişimi */}
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] font-extrabold text-[#00008B] tabular-nums">
                                    {formatPrice(item.price, decimals)}{item.currencySuffix}
                                </span>
                                <span
                                    className={`text-[10px] font-bold tabular-nums flex items-center ${
                                        isPositive ? "text-emerald-600" : "text-rose-600"
                                    }`}
                                >
                                    {isPositive ? "+" : ""}
                                    {item.changePercent.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export const SidebarMarketWidgets = memo(SidebarMarketWidgetsComponent);
