"use client";

import { Activity, TrendingUp, TrendingDown, Minus, BrainCircuit } from "lucide-react";

interface NewsSentimentWidgetProps {
    distribution: {
        bullish: number;
        bearish: number;
        neutral: number;
        total: number;
    };
}

export function NewsSentimentWidget({ distribution }: NewsSentimentWidgetProps) {
    const { bullish = 60, bearish = 25, neutral = 15, total = 0 } = distribution || {};

    let dominantSentiment = 'Pozitif (Boğa Baskın)';
    let dominantColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (bearish > bullish && bearish > neutral) {
        dominantSentiment = 'Satış / Temkinli (Ayı Baskın)';
        dominantColor = 'text-rose-600 bg-rose-50 border-rose-200';
    } else if (neutral >= bullish && neutral >= bearish) {
        dominantSentiment = 'Dengeli / Bekle-Gör';
        dominantColor = 'text-blue-700 bg-blue-50 border-blue-200';
    }

    return (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#00008B] text-white flex items-center justify-center">
                        <BrainCircuit className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-[#00008B] uppercase tracking-wider">
                            Piyasa AI Duyarlılık Endeksi
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400">
                            Günün {total} kritik haberinin analizi
                        </p>
                    </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${dominantColor}`}>
                    {dominantSentiment}
                </span>
            </div>

            {/* Visual Segmented Progress Bar */}
            <div className="space-y-1.5">
                <div className="h-3 w-full rounded-full bg-slate-100 flex overflow-hidden p-0.5 gap-1">
                    <div
                        style={{ width: `${bullish}%` }}
                        className="bg-emerald-500 rounded-full transition-all duration-700"
                        title={`Pozitif / Boğa: %${bullish}`}
                    />
                    <div
                        style={{ width: `${neutral}%` }}
                        className="bg-blue-400 rounded-full transition-all duration-700"
                        title={`Nötr / Dengeli: %${neutral}`}
                    />
                    <div
                        style={{ width: `${bearish}%` }}
                        className="bg-rose-500 rounded-full transition-all duration-700"
                        title={`Negatif / Ayı: %${bearish}`}
                    />
                </div>

                <div className="flex items-center justify-between text-[11px] font-black pt-1">
                    <span className="text-emerald-600 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" /> %{bullish} Boğa
                    </span>
                    <span className="text-blue-600 flex items-center gap-1">
                        <Minus className="w-3.5 h-3.5" /> %{neutral} Nötr
                    </span>
                    <span className="text-rose-600 flex items-center gap-1">
                        <TrendingDown className="w-3.5 h-3.5" /> %{bearish} Ayı
                    </span>
                </div>
            </div>
        </div>
    );
}
