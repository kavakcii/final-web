"use client";

import TradingViewWidget from "@/components/TradingViewWidget";
import TradingViewTechnicalAnalysis from "@/components/TradingViewTechnicalAnalysis";
import { ArrowUpRight } from "lucide-react";

export default function MarketPage() {
    return (
        <div className="p-6 h-full flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Piyasa Analizi
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        BIST 100 ve diğer piyasaların detaylı teknik analizi.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-emerald-400 flex items-center bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        Canlı Veri (Gecikmeli)
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[500px]">
                <div className="lg:col-span-2 h-full min-h-[500px]">
                    <TradingViewWidget />
                </div>
                <div className="h-full min-h-[500px]">
                    <TradingViewTechnicalAnalysis />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {/* Placeholder for future widgets like Top Gainers, Losers etc */}
                {[
                    { title: "En Çok Artanlar", items: ["THYAO +%5.2", "ASELS +%3.1", "GARAN +%2.8"] },
                    { title: "En Çok Düşenler", items: ["SASA -%4.1", "HEKTS -%3.5", "EREGL -%1.2"] },
                    { title: "Hacim Liderleri", items: ["THYAO 12.5Mr", "ISCTR 8.2Mr", "YKBNK 6.1Mr"] },
                ].map((card, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                        <h3 className="text-sm font-semibold text-slate-300 mb-3">{card.title}</h3>
                        <ul className="space-y-2">
                            {card.items.map((item, i) => (
                                <li key={i} className="text-xs font-mono text-slate-400 flex justify-between">
                                    <span>{item.split(' ')[0]}</span>
                                    <span className={item.includes('+') ? 'text-green-400' : 'text-red-400'}>{item.split(' ')[1]}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}
