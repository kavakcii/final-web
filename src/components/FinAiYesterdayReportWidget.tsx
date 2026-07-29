"use client";

import { useState } from "react";
import { Sparkles, Bot, Clock, ArrowUpRight, ShieldCheck, ChevronRight, RefreshCw, BarChart2 } from "lucide-react";
import { motion } from "framer-motion";

export function FinAiYesterdayReportWidget() {
    const [activeTab, setActiveTab] = useState<'macro' | 'assets' | 'portfolio'>('portfolio');

    // Rich analytical mock structure for yesterday's summary
    const yesterdaySummary = {
        dateLabel: "Dünün Özeti (Son Kapanış Raporu)",
        overallSentiment: "Pozitif Ayrışma",
        portfolioReturn: "+%1.84",
        betaScore: "0.92 (Dengeli Volatilite)",
        reportText: "Dünkü küresel ve yerel piyasa seansında, makroekonomik veri trafiğinin yarattığı likidite hareketleri portföy dinamiklerinize olumlu yansımıştır. BIST 100 endeksindeki yükselişe paralel olarak ağırlıklı hisse pozisyonlarınız endeks üstü getiri (alpha) üretmiş, TEFAS fon grubunuz ise sabit getirili varlık kanalıyla portföy tabanındaki volatiliteyi sönümlemiştir.",
        highlights: [
            { label: "Makro Etki", text: "Dün açıklanan ABD TÜFE verisi sonrası faiz beklentilerinin yumuşamasıyla emtia ve hisse kanallarına girdi sağlandı." },
            { label: "Varlık Aksiyonu", text: "Portföyünüzdeki BIST ve teknoloji yoğun fonlar dünkü kapanışta %2.10 primlenerek ana sürükleyici oldu." },
            { label: "Risk Dinamiği", text: "Portföyün toplam Sharpe oranı ve volatilite bandı optimum korelasyon seviyelerini korudu." }
        ]
    };

    return (
        <div className="w-full bg-gradient-to-br from-[#00008B] via-[#05059e] to-[#0b0b6b] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between border border-[#00008B]">
            {/* Background Glow Effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-black tracking-tight text-white">FinAI Günlük Rapor</h3>
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400/20 text-amber-300 border border-amber-300/30">
                                    DÜNÜN ÖZETİ
                                </span>
                            </div>
                            <p className="text-[10px] font-bold text-blue-200/80 uppercase tracking-widest">Profesyonel Piyasa & Portföy Analizi</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-200/70 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                        <Clock className="w-3 h-3 text-amber-300" />
                        <span>Kapanış: Dün</span>
                    </div>
                </div>

                {/* Main Insight Card */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-4.5 mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                            <Bot className="w-3.5 h-3.5" /> AI Portföy Hakem Notu
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-400/30">
                                Dünkü Değişim: {yesterdaySummary.portfolioReturn}
                            </span>
                        </div>
                    </div>
                    
                    <p className="text-xs font-medium leading-relaxed text-blue-50/90 mb-3">
                        {yesterdaySummary.reportText}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-3 border-t border-white/10">
                        {yesterdaySummary.highlights.map((h, i) => (
                            <div key={i} className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                                <span className="text-[9px] font-black text-blue-200 uppercase tracking-wider block mb-1">
                                    {h.label}
                                </span>
                                <p className="text-[11px] font-medium leading-snug text-white/90">
                                    {h.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sub Tab Selectors */}
                <div className="flex items-center gap-2 bg-black/20 p-1 rounded-2xl border border-white/10">
                    <button
                        onClick={() => setActiveTab('portfolio')}
                        className={`flex-1 py-1.5 text-[10px] font-black rounded-xl transition-all ${activeTab === 'portfolio' ? 'bg-white text-[#00008B] shadow-md' : 'text-blue-200 hover:text-white'}`}
                    >
                        Portföy Hareketi
                    </button>
                    <button
                        onClick={() => setActiveTab('macro')}
                        className={`flex-1 py-1.5 text-[10px] font-black rounded-xl transition-all ${activeTab === 'macro' ? 'bg-white text-[#00008B] shadow-md' : 'text-blue-200 hover:text-white'}`}
                    >
                        Dünkü Takvim & Haber
                    </button>
                    <button
                        onClick={() => setActiveTab('assets')}
                        className={`flex-1 py-1.5 text-[10px] font-black rounded-xl transition-all ${activeTab === 'assets' ? 'bg-white text-[#00008B] shadow-md' : 'text-blue-200 hover:text-white'}`}
                    >
                        Varlık Ayrışmaları
                    </button>
                </div>
            </div>

            {/* Bottom Status */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-bold text-blue-200/70 relative z-10">
                <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Beta Katsayısı: {yesterdaySummary.betaScore}
                </span>
                <span className="text-amber-300 hover:underline cursor-pointer flex items-center gap-1">
                    Detaylı Raporu İncele <ChevronRight className="w-3 h-3" />
                </span>
            </div>
        </div>
    );
}
