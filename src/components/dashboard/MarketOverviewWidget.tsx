"use client";

import { useState, useEffect, useMemo } from "react";
import { TrendingUp, TrendingDown, ArrowRight, BarChart2, Globe } from "lucide-react";
import Link from "next/link";

interface MarketItem {
    symbol: string;
    cleanSymbol: string;
    name: string;
    price: number;
    changePct: number;
    isPositive: boolean;
}

const TABS = [
    { id: "bist", label: "BIST", benchmark: "BIST 100", fallbackPrice: 11286.60, fallbackChange: 0.72 },
    { id: "us", label: "ABD", benchmark: "S&P 500", fallbackPrice: 5980.20, fallbackChange: 0.45 },
    { id: "eu", label: "Avrupa", benchmark: "DAX 40", fallbackPrice: 19450.80, fallbackChange: -0.18 },
    { id: "asia", label: "Asya", benchmark: "Nikkei 225", fallbackPrice: 38720.50, fallbackChange: 1.12 },
    { id: "fx", label: "Döviz", benchmark: "USD/TRY", fallbackPrice: 36.48, fallbackChange: 0.15 },
    { id: "commodity", label: "Emtia", benchmark: "Ons Altın", fallbackPrice: 2890.40, fallbackChange: 0.65 },
] as const;

// Kategoriye göre piyasa göstergeleri
const TAB_ITEMS: Record<string, { symbol: string; name: string; fallbackPrice: number; fallbackChange: number }[]> = {
    bist: [
        { symbol: "XU100", name: "BIST 100", fallbackPrice: 11286.60, fallbackChange: 0.72 },
        { symbol: "XU030", name: "BIST 30", fallbackPrice: 12428.17, fallbackChange: 0.81 },
        { symbol: "THYAO", name: "THYAO", fallbackPrice: 289.50, fallbackChange: 1.23 },
        { symbol: "ASELS", name: "ASELS", fallbackPrice: 176.30, fallbackChange: 0.68 },
        { symbol: "TUPRS", name: "TUPRS", fallbackPrice: 162.40, fallbackChange: 0.92 },
    ],
    us: [
        { symbol: "SPX", name: "S&P 500", fallbackPrice: 5980.20, fallbackChange: 0.45 },
        { symbol: "NDX", name: "Nasdaq 100", fallbackPrice: 21120.40, fallbackChange: 0.62 },
        { symbol: "DJI", name: "Dow Jones", fallbackPrice: 43910.10, fallbackChange: 0.28 },
        { symbol: "AAPL", name: "Apple", fallbackPrice: 232.50, fallbackChange: 0.85 },
        { symbol: "NVDA", name: "Nvidia", fallbackPrice: 142.80, fallbackChange: 2.10 },
    ],
    eu: [
        { symbol: "DAX", name: "DAX 40", fallbackPrice: 19450.80, fallbackChange: -0.18 },
        { symbol: "FTSE", name: "FTSE 100", fallbackPrice: 8380.20, fallbackChange: 0.22 },
        { symbol: "CAC", name: "CAC 40", fallbackPrice: 7420.50, fallbackChange: -0.34 },
        { symbol: "IBEX", name: "IBEX 35", fallbackPrice: 11840.10, fallbackChange: 0.15 },
        { symbol: "STOXX", name: "Euro Stoxx 50", fallbackPrice: 4890.30, fallbackChange: -0.12 },
    ],
    asia: [
        { symbol: "N225", name: "Nikkei 225", fallbackPrice: 38720.50, fallbackChange: 1.12 },
        { symbol: "HSI", name: "Hang Seng", fallbackPrice: 20450.20, fallbackChange: -0.45 },
        { symbol: "SHCOMP", name: "Shanghai", fallbackPrice: 3340.80, fallbackChange: 0.35 },
        { symbol: "KOSPI", name: "KOSPI", fallbackPrice: 2540.10, fallbackChange: 0.58 },
        { symbol: "SENSEX", name: "BSE Sensex", fallbackPrice: 79820.40, fallbackChange: 0.42 },
    ],
    fx: [
        { symbol: "USDTRY", name: "USD / TRY", fallbackPrice: 36.48, fallbackChange: 0.15 },
        { symbol: "EURTRY", name: "EUR / TRY", fallbackPrice: 38.12, fallbackChange: -0.22 },
        { symbol: "GBPTRY", name: "GBP / TRY", fallbackPrice: 45.80, fallbackChange: 0.08 },
        { symbol: "EURUSD", name: "EUR / USD", fallbackPrice: 1.0450, fallbackChange: -0.35 },
        { symbol: "DXY", name: "Dolar Endeksi", fallbackPrice: 107.20, fallbackChange: 0.25 },
    ],
    commodity: [
        { symbol: "XAU", name: "Ons Altın", fallbackPrice: 2890.40, fallbackChange: 0.65 },
        { symbol: "GLDTR", name: "Gram Altın", fallbackPrice: 3410.20, fallbackChange: 0.78 },
        { symbol: "XAG", name: "Gümüş", fallbackPrice: 32.40, fallbackChange: 1.15 },
        { symbol: "BRENT", name: "Brent Petrol", fallbackPrice: 74.80, fallbackChange: -0.85 },
        { symbol: "NG", name: "Doğalgaz", fallbackPrice: 3.12, fallbackChange: 2.40 },
    ],
};

const formatPrice = (val: number) => {
    return new Intl.NumberFormat("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(val);
};

export function MarketOverviewWidget() {
    const [activeTab, setActiveTab] = useState<string>("bist");
    const [livePrices, setLivePrices] = useState<Record<string, { price: number; change: number }>>({});

    // Mevcut finance API'sinden canlı fiyatları sorgula (opsiyonel zenginleştirme)
    useEffect(() => {
        let isMounted = true;
        const fetchQuotes = async () => {
            try {
                const res = await fetch('/api/finance?symbols=XAUUSD=X,USDTRY=X,EURTRY=X,THYAO.IS,ASELS.IS,TUPRS.IS');
                const json = await res.json();
                if (isMounted && json.results && Array.isArray(json.results)) {
                    const map: Record<string, { price: number; change: number }> = {};
                    json.results.forEach((r: any) => {
                        const clean = (r.symbol || '').replace('.IS', '').replace('=X', '');
                        map[clean] = {
                            price: r.regularMarketPrice || r.price || 0,
                            change: r.regularMarketChangePercent || r.changePercent || 0,
                        };
                    });
                    setLivePrices(map);
                }
            } catch (e) {
                // Sessiz hata - tasarım iskeletini bozma
            }
        };

        fetchQuotes();
        return () => { isMounted = false; };
    }, []);

    const currentTabMeta = TABS.find((t) => t.id === activeTab) || TABS[0];
    const items = TAB_ITEMS[activeTab] || TAB_ITEMS.bist;

    // Seçili tab'ın benchmark fiyatı
    const benchmarkData = useMemo(() => {
        const first = items[0];
        const live = livePrices[first.symbol];
        return {
            name: currentTabMeta.benchmark,
            price: live ? live.price : first.fallbackPrice,
            change: live ? live.change : first.fallbackChange,
            isPositive: (live ? live.change : first.fallbackChange) >= 0,
        };
    }, [activeTab, items, livePrices, currentTabMeta]);

    return (
        <div className="bg-white border border-slate-100 hover:border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all duration-300 h-[395px] flex flex-col justify-between group">
            {/* 1. Üst Başlık & Kategori Sekmeleri */}
            <div>
                {/* Başlık Satırı */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100/80">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
                                Piyasa Genel Görünümü
                            </h3>
                        </div>
                    </div>

                    <Link
                        href="/dashboard/market"
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors group/link"
                    >
                        <span>Tümü</span>
                        <ArrowRight className="w-3 h-3 transform group-hover/link:translate-x-0.5 transition-transform" />
                    </Link>
                </div>

                {/* Kategori Filtre Sekmeleri (Pills) */}
                <div className="flex items-center gap-1 overflow-x-auto py-2.5 custom-scrollbar">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all shrink-0 ${
                                    isActive
                                        ? "bg-blue-50 text-blue-700 border border-blue-200/70 shadow-2xs"
                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2. Ana Gövde: Sol Grafik Alanı (55%) + Sağ Piyasa Göstergeleri (45%) */}
            <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-4 items-stretch my-auto py-2">
                {/* Sol Taraf: Grafik Alanı İskeleti (Referans Tasarıma Birebir Sadık) */}
                <div className="flex flex-col justify-between border-r-0 md:border-r border-slate-100/80 pr-0 md:pr-4">
                    {/* Endeks Başlık & Fiyat Satırı */}
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-xs font-bold text-slate-400">
                            {benchmarkData.name}
                        </span>
                        <span className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                            {formatPrice(benchmarkData.price)}
                        </span>
                        <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-md ${
                            benchmarkData.isPositive
                                ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60"
                                : "text-rose-700 bg-rose-50 border border-rose-200/60"
                        }`}>
                            {benchmarkData.isPositive ? "▲ +" : "▼ "}
                            %{Math.abs(benchmarkData.change).toFixed(2)}
                        </span>
                    </div>

                    {/* Grafik Görsel İskeleti (SVG Sparkline & Grid Rehber Çizgileri) */}
                    <div className="relative w-full h-40 sm:h-44 flex flex-col justify-between overflow-hidden">
                        {/* Y-Ekseni Kılavuz Çizgileri */}
                        <div className="absolute inset-x-0 top-0 bottom-5 flex flex-col justify-between pointer-events-none text-[9.5px] font-semibold text-slate-300">
                            <div className="border-b border-dashed border-slate-100 pb-0.5">11.400</div>
                            <div className="border-b border-dashed border-slate-100 pb-0.5">11.200</div>
                            <div className="border-b border-dashed border-slate-100 pb-0.5">11.000</div>
                            <div className="border-b border-dashed border-slate-100 pb-0.5">10.800</div>
                        </div>

                        {/* Zarif SVG Dalga Grafiği */}
                        <div className="relative z-10 w-full h-full pt-3">
                            <svg viewBox="0 0 400 130" className="w-full h-full" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="marketCurveGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                                        <stop offset="60%" stopColor="#10b981" stopOpacity="0.05" />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                                    </linearGradient>
                                    <linearGradient id="marketStroke" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
                                        <stop offset="50%" stopColor="#10b981" stopOpacity="0.8" />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
                                    </linearGradient>
                                </defs>
                                {/* Alan Dolgusu */}
                                <path
                                    d="M 0,105 Q 60,115 120,80 T 220,70 T 310,40 T 400,25 L 400,130 L 0,130 Z"
                                    fill="url(#marketCurveGrad)"
                                />
                                {/* Trend Çizgisi */}
                                <path
                                    d="M 0,105 Q 60,115 120,80 T 220,70 T 310,40 T 400,25"
                                    fill="none"
                                    stroke="url(#marketStroke)"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                />
                                <circle cx="398" cy="25" r="3.5" fill="#10b981" className="animate-pulse" />
                            </svg>
                        </div>

                        {/* X-Ekseni Saat Damgaları */}
                        <div className="flex items-center justify-between text-[9px] font-medium text-slate-400 pt-1 border-t border-slate-100">
                            <span>10:00</span>
                            <span>11:00</span>
                            <span>12:00</span>
                            <span>13:00</span>
                            <span>14:00</span>
                            <span>15:00</span>
                            <span>16:00</span>
                            <span>17:00</span>
                        </div>
                    </div>
                </div>

                {/* Sağ Taraf: Piyasa Göstergeleri Tablosu */}
                <div className="flex flex-col justify-between">
                    {/* Tablo Başlıkları */}
                    <div className="grid grid-cols-3 text-[10.5px] font-bold text-slate-400 pb-2 border-b border-slate-100">
                        <span>Endeks / Hisse</span>
                        <span className="text-right">Son</span>
                        <span className="text-right">Değişim</span>
                    </div>

                    {/* Tablo Satırları */}
                    <div className="divide-y divide-slate-100/80 my-auto">
                        {items.map((item, idx) => {
                            const live = livePrices[item.symbol];
                            const currentPrice = live ? live.price : item.fallbackPrice;
                            const currentChange = live ? live.change : item.fallbackChange;
                            const isPos = currentChange >= 0;

                            return (
                                <div
                                    key={item.symbol}
                                    className="grid grid-cols-3 items-center py-2 hover:bg-slate-50/80 rounded-lg px-1 transition-colors"
                                >
                                    {/* Sembol ve İsim */}
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[9px] font-black text-slate-700 shrink-0">
                                            {item.name.slice(0, 2).toUpperCase()}
                                        </div>
                                        <span className="text-xs font-bold text-slate-900 truncate">
                                            {item.name}
                                        </span>
                                    </div>

                                    {/* Fiyat */}
                                    <div className="text-right text-xs font-semibold text-slate-800 tabular-nums">
                                        {formatPrice(currentPrice)}
                                    </div>

                                    {/* Yüzde Değişim */}
                                    <div className="text-right">
                                        <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums ${
                                            isPos ? "text-emerald-600" : "text-rose-600"
                                        }`}>
                                            {isPos ? "▲ +" : "▼ "}
                                            %{Math.abs(currentChange).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
