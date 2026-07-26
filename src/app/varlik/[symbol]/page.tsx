"use client";

import { use, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Check, 
  Activity 
} from "lucide-react";
import { cn } from "@/lib/utils";

// Stock mock metadata
const STOCK_DETAILS: Record<string, { name: string; sector: string; price: number; change: number; pe: number; pb: number; volume: string; marketCap: string; high52: number; low52: number; desc: string }> = {
    "THYAO": {
        name: "Türk Hava Yolları A.O.",
        sector: "Havacılık & Ulaştırma",
        price: 315.25,
        change: 2.45,
        pe: 6.8,
        pb: 1.45,
        volume: "4.8 Mr TL",
        marketCap: "435.0 Mr TL",
        high52: 335.00,
        low52: 210.50,
        desc: "Türk Hava Yolları, yolcu ve kargo taşımacılığında küresel lider küresel hava yolu şirketlerinden biridir."
    },
    "ASELS": {
        name: "Aselsan Elektronik Sanayi A.Ş.",
        sector: "Savunma Sanayii",
        price: 64.10,
        change: 3.12,
        pe: 14.2,
        pb: 3.10,
        volume: "3.2 Mr TL",
        marketCap: "292.0 Mr TL",
        high52: 68.50,
        low52: 38.20,
        desc: "Aselsan, Türk Silahlı Kuvvetleri başta olmak üzere savunma sanayi teknolojilerinde lider elektronik sistem üreticisidir."
    },
    "EREGL": {
        name: "Ereğli Demir ve Çelik Fabrikaları",
        sector: "Demir Çelik & Sanayi",
        price: 48.60,
        change: -1.20,
        pe: 11.5,
        pb: 1.85,
        volume: "1.9 Mr TL",
        marketCap: "170.0 Mr TL",
        high52: 56.40,
        low52: 36.80,
        desc: "Erdemir, Türkiye'nin en büyük yassı çelik üreticisi ve entegre demir-çelik sanayi devidir."
    },
    "FROTO": {
        name: "Ford Otomotiv Sanayi A.Ş.",
        sector: "Otomotiv Sanayi",
        price: 1045.00,
        change: 1.85,
        pe: 9.4,
        pb: 4.20,
        volume: "2.1 Mr TL",
        marketCap: "366.5 Mr TL",
        high52: 1180.00,
        low52: 740.00,
        desc: "Ford Otosan, Avrupa'nın lider ticari araç üretim üssü ve ihracat şampiyonudur."
    },
    "MIATK": {
        name: "Mia Teknoloji A.Ş.",
        sector: "Teknoloji & Yazılım",
        price: 78.50,
        change: 4.80,
        pe: 22.1,
        pb: 5.60,
        volume: "1.4 Mr TL",
        marketCap: "38.2 Mr TL",
        high52: 89.00,
        low52: 32.10,
        desc: "Mia Teknoloji, biyometrik kimlik, siber güvenlik ve akıllı şehir yazılımlarında öncü teknoloji şirketidir."
    },
    "ASTOR": {
        name: "Astor Enerji A.Ş.",
        sector: "Enerji & Elektrik",
        price: 118.20,
        change: 3.65,
        pe: 18.4,
        pb: 4.10,
        volume: "2.6 Mr TL",
        marketCap: "118.0 Mr TL",
        high52: 142.00,
        low52: 78.00,
        desc: "Astor Enerji, trafo ve transformatör imalatında Türkiye'nin ve bölgenin lider enerji ekipman üreticisidir."
    },
    "GARAN": {
        name: "Garanti BBVA A.Ş.",
        sector: "Bankacılık & Finans",
        price: 112.40,
        change: 0.90,
        pe: 4.8,
        pb: 1.15,
        volume: "3.8 Mr TL",
        marketCap: "472.0 Mr TL",
        high52: 124.00,
        low52: 52.30,
        desc: "Garanti BBVA, dinamik dijital bankacılık altyapısıyla Türkiye'nin lider özel bankalarındandır."
    },
    "BIMAS": {
        name: "BİM Birleşik Mağazalar A.Ş.",
        sector: "Perakende & Gıda",
        price: 495.00,
        change: 1.10,
        pe: 15.2,
        pb: 3.80,
        volume: "1.7 Mr TL",
        marketCap: "300.0 Mr TL",
        high52: 540.00,
        low52: 290.00,
        desc: "BİM, indirimli gıda perakendeciliğinde Türkiye'nin en yaygın mağaza ağına sahip sektör lideridir."
    }
};

export default function VarlikDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
    const resolvedParams = use(params);
    const rawSymbol = resolvedParams?.symbol || "THYAO";
    const cleanSymbol = rawSymbol.toUpperCase().replace('.IS', '');
    
    const details = STOCK_DETAILS[cleanSymbol] || {
        name: `${cleanSymbol} BIST Hissesi`,
        sector: "Borsa İstanbul Sanayi & Ticaret",
        price: 125.50,
        change: 1.75,
        pe: 10.4,
        pb: 2.10,
        volume: "1.5 Mr TL",
        marketCap: "85.0 Mr TL",
        high52: 145.00,
        low52: 82.00,
        desc: `${cleanSymbol} hisse senedi canlı fiyatlaması, derinlik analizleri ve detaylı finansal oranları.`
    };

    const [isAdded, setIsAdded] = useState(false);

    return (
        <div className="min-h-screen bg-[#0F172A] text-white selection:bg-blue-500/30 font-sans p-4 md:p-8 space-y-8">
            {/* Header Navbar */}
            <div className="max-w-7xl mx-auto flex items-center justify-between border-b border-slate-800 pb-5">
                <Link href="/dashboard/data" className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-slate-800/60 px-4 py-2 rounded-xl border border-slate-700/50">
                    <ArrowLeft className="w-4 h-4" /> Varlık Terminaline Dön
                </Link>

                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full uppercase tracking-widest">
                        FinAi Live Feed
                    </span>
                    <span className="text-xl font-black tracking-tighter text-white">
                        FinAi<span className="text-blue-500">.net.tr</span>
                    </span>
                </div>
            </div>

            {/* Asset Hero Section */}
            <div className="max-w-7xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden space-y-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 text-white font-black text-xl flex items-center justify-center shadow-lg ring-4 ring-slate-800 shrink-0">
                            {cleanSymbol.slice(0, 4)}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{cleanSymbol}</h1>
                                <span className="text-xs font-bold px-3 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                                    {details.sector}
                                </span>
                            </div>
                            <p className="text-sm font-semibold text-slate-400 mt-1">{details.name}</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:items-end gap-2">
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl md:text-4xl font-black text-white">₺{details.price.toFixed(2)}</span>
                            <span className={cn(
                                "text-sm font-black px-3 py-1 rounded-xl flex items-center gap-1",
                                details.change >= 0 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            )}>
                                {details.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                %{Math.abs(details.change).toFixed(2)}
                            </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Piyasa Açık • Anlık Canlı Fiyat</span>
                    </div>
                </div>

                {/* Metric Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
                    <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-2xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">F/K Çarpanı</span>
                        <span className="text-lg font-black text-white">{details.pe}</span>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-2xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">PD/DD</span>
                        <span className="text-lg font-black text-white">{details.pb}</span>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-2xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Piyasa Değeri</span>
                        <span className="text-lg font-black text-emerald-400">{details.marketCap}</span>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-2xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">24s Hacim</span>
                        <span className="text-lg font-black text-sky-400">{details.volume}</span>
                    </div>
                </div>

                {/* Description & Action Buttons */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4 border-t border-slate-800">
                    <p className="text-xs text-slate-400 leading-relaxed max-w-2xl font-medium">
                        {details.desc}
                    </p>

                    <div className="flex items-center gap-3 shrink-0">
                        <button 
                            onClick={() => setIsAdded(!isAdded)}
                            className={cn(
                                "px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg",
                                isAdded 
                                    ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30"
                            )}
                        >
                            {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {isAdded ? "Portföyde Eklendi" : "Portföyüme Ekle"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Simulating Chart Box */}
            <div className="max-w-7xl mx-auto bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-center space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{cleanSymbol} Canlı Fiyat Derinlik Grafiği</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 bg-slate-800 px-3 py-1 rounded-lg">FinAi Advanced Trading Terminal</span>
                </div>
                <div className="h-64 w-full bg-slate-950/80 rounded-2xl border border-slate-800/80 flex items-center justify-center text-slate-500 text-xs font-bold">
                    [ Canlı İnteraktif TradingView / FinAi Grafik Simülasyonu ]
                </div>
            </div>
        </div>
    );
}
