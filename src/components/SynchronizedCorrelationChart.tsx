
'use client';

import React, { useState, useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceDot,
    ReferenceLine
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, Info, Calendar, Zap, AlertTriangle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoryPoint {
    date: string;
    price: number;
}

interface MarketEvent {
    date: string;
    title: string;
    description: string;
    impact: string;
}

interface SynchronizedCorrelationChartProps {
    sourceSymbol: string;
    targetSymbol: string;
    historySource: HistoryPoint[];
    historyTarget: HistoryPoint[];
    rollingCorrelation: number[];
    events: MarketEvent[];
    correlationValue: number;
    isStructuralOverlap?: boolean;
    customInsight?: string;
}

export const SynchronizedCorrelationChart = ({
    sourceSymbol,
    targetSymbol,
    historySource,
    historyTarget,
    rollingCorrelation,
    events,
    correlationValue,
    isStructuralOverlap,
    customInsight
}: SynchronizedCorrelationChartProps) => {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const [activeEvent, setActiveEvent] = useState<MarketEvent | null>(null);

    // Normalization logic: % change from start
    const chartData = useMemo(() => {
        const startSrc = historySource[0]?.price || 1;
        const startTgt = historyTarget[0]?.price || 1;

        return historySource.map((s, i) => {
            const t = historyTarget[i];
            const srcPct = ((s.price - startSrc) / startSrc) * 100;
            const tgtPct = t ? ((t.price - startTgt) / startTgt) * 100 : 0;
            const roll = rollingCorrelation[i] !== undefined ? rollingCorrelation[i] : null;

            return {
                index: i,
                date: s.date,
                displayDate: new Date(s.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }),
                srcPrice: s.price,
                tgtPrice: t?.price || 0,
                srcPct: parseFloat(srcPct.toFixed(2)),
                tgtPct: parseFloat(tgtPct.toFixed(2)),
                rolling: roll
            };
        });
    }, [historySource, historyTarget, rollingCorrelation]);

    const handleMouseMove = (state: any) => {
        if (state && state.activeTooltipIndex !== undefined) {
            setHoverIndex(state.activeTooltipIndex);

            // Check for event at this point
            const currentDate = chartData[state.activeTooltipIndex]?.date;
            const event = events.find(e => e.date === currentDate);
            if (event) setActiveEvent(event);
            else setActiveEvent(null);
        }
    };

    const handleMouseLeave = () => {
        setHoverIndex(null);
        setActiveEvent(null);
    };

    // Custom Dot for "Lighthouse" pointers (Events)
    const renderLighthouseDot = (props: any) => {
        const { cx, cy, payload } = props;
        const hasEvent = events.some(e => e.date === payload.date);

        if (!hasEvent) return null;

        const isCurrentlyActive = activeEvent?.date === payload.date;

        return (
            <g key={`lighthouse-${payload.date}`} style={{ cursor: 'pointer' }}>
                <circle cx={cx} cy={cy} r={isCurrentlyActive ? 12 : 8} fill="rgba(168,85,247,0.4)" className="animate-pulse" />
                <circle cx={cx} cy={cy} r={6} fill="#a855f7" stroke="#fff" strokeWidth={2} />
                {/* Larger invisible hit area for easier hover */}
                <circle cx={cx} cy={cy} r={20} fill="transparent" />
            </g>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 w-full min-h-[450px]">
            {/* Main Visual Section */}
            <div className="lg:col-span-7 space-y-4 min-w-0">
                {/* Compact Header */}
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 font-bold tracking-tighter uppercase">Trend Karşılaştırması (%)</span>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                <span className="text-sm font-black text-white">{sourceSymbol}</span>
                                <span className="text-slate-600 font-black">/</span>
                                <div className="w-2 h-2 rounded-full bg-indigo-400" />
                                <span className="text-sm font-black text-white">{targetSymbol}</span>
                            </div>
                        </div>
                    </div>

                    <div className={cn(
                        "px-4 py-1.5 rounded-full border text-[10px] font-black tracking-widest flex items-center gap-2",
                        correlationValue > 0.7
                            ? "bg-red-500/10 border-red-500/20 text-red-400"
                            : "bg-green-500/10 border-green-500/20 text-green-400"
                    )}>
                        <Sparkles className="w-3 h-3" />
                        KORELASYON: {correlationValue.toFixed(2)}
                    </div>
                </div>

                {/* Single Consolidated Chart */}
                <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 h-[380px] relative group overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/5 blur-[100px] pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/5 blur-[100px] pointer-events-none" />

                    <ResponsiveContainer width="100%" height="88%">
                        <AreaChart data={chartData} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
                            <defs>
                                <linearGradient id="gradSrc" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradTgt" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                            <XAxis
                                dataKey="displayDate"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                                interval={Math.floor(chartData.length / 5)}
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} domain={['auto', 'auto']} unit="%" />
                            <Tooltip
                                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                                content={() => null}
                            />

                            {/* Area A */}
                            <Area
                                type="monotone"
                                dataKey="srcPct"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#gradSrc)"
                                dot={renderLighthouseDot}
                                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                            />

                            {/* Area B */}
                            <Area
                                type="monotone"
                                dataKey="tgtPct"
                                stroke="#818cf8"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#gradTgt)"
                                dot={false}
                                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>

                    {/* Compact Rolling Sparkline Indicator at the bottom of the chart */}
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-3 h-3 text-slate-500" />
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">15-GÜN Roller Korelasyon</span>
                        </div>
                        <div className="flex gap-1 h-4 items-end">
                            {chartData.map((d, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "w-1 rounded-full",
                                        d.rolling !== null ? (d.rolling > 0.7 ? "bg-red-500/40" : "bg-blue-500/20") : "bg-transparent"
                                    )}
                                    style={{ height: d.rolling !== null ? `${Math.abs(d.rolling) * 100}%` : '0%' }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Insight Card Section - Sits to the right on large screens */}
            <div className="lg:col-span-3 flex flex-col gap-4 min-w-0">
                {/* Persistent Summary Insight (Always visible if no hover) */}
                {!activeEvent && hoverIndex === null && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-500/10 border border-blue-500/20 rounded-[2rem] p-5 space-y-3"
                    >
                        <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4 text-blue-400" />
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Temel Analiz</span>
                        </div>
                        <div className="text-xs text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
                            {customInsight || (correlationValue > 0.85
                                ? `${sourceSymbol} ve ${targetSymbol} arasında çok güçlü bir bağ var. Neredeyse tek bir varlık gibi hareket ediyorlar.`
                                : correlationValue > 0.4
                                    ? "Varlıklar arasında belirgin bir benzerlik var. Makro ekonomik gelişmeler her ikisini de benzer etkiliyor."
                                    : "Bu iki varlık düşük korelasyona sahip. Portföy çeşitlendirmesi için oldukça uygunlar.")}
                        </div>
                        {isStructuralOverlap && (
                            <div className="mt-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2 shadow-lg shadow-red-500/5">
                                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                <span className="text-[9px] font-black text-red-400 uppercase leading-snug">
                                    DİKKAT: Yapısal Çakışma! Her iki fon da aynı endekse/hisselere yatırım yapıyor.
                                </span>
                            </div>
                        )}
                    </motion.div>
                )}
                <AnimatePresence mode="wait">
                    {activeEvent ? (
                        <motion.div
                            key="event-view"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-[2rem] p-6 flex flex-col h-full"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{activeEvent.date}</div>
                                        <h4 className="text-sm font-bold text-white leading-tight truncate">{activeEvent.title}</h4>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed">{activeEvent.description}</p>
                                <div className="p-3 rounded-xl bg-black/20 border border-white/5 text-[10px] text-slate-400 italic">
                                    "{activeEvent.impact}"
                                </div>
                            </div>
                        </motion.div>
                    ) : hoverIndex !== null ? (
                        <motion.div
                            key="data-view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 flex flex-col justify-center gap-4 h-full"
                        >
                            <div className="text-center pb-4 border-b border-white/5">
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{chartData[hoverIndex].date}</div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="text-[10px] text-blue-400 font-bold uppercase tracking-tighter truncate">{sourceSymbol}</div>
                                        <div className="text-sm font-black text-white">₺{chartData[hoverIndex].srcPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 5 })}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-slate-500 font-bold uppercase">Değişim %</div>
                                        <div className={cn("text-xs font-bold", chartData[hoverIndex].srcPct >= 0 ? "text-green-400" : "text-red-400")}>
                                            {chartData[hoverIndex].srcPct > 0 ? '+' : ''}{chartData[hoverIndex].srcPct}%
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-tighter truncate">{targetSymbol}</div>
                                        <div className="text-sm font-black text-white">₺{chartData[hoverIndex].tgtPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 5 })}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-slate-500 font-bold uppercase">Değişim %</div>
                                        <div className={cn("text-xs font-bold", chartData[hoverIndex].tgtPct >= 0 ? "text-green-400" : "text-red-400")}>
                                            {chartData[hoverIndex].tgtPct > 0 ? '+' : ''}{chartData[hoverIndex].tgtPct}%
                                        </div>
                                    </div>
                                </div>

                                {chartData[hoverIndex].rolling !== null && (
                                    <div className="mt-4 p-3 bg-purple-500/5 rounded-2xl border border-purple-500/10 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-3 h-3 text-purple-400" />
                                            <span className="text-[9px] font-bold text-slate-400 uppercase">ANLIK KORELASYON</span>
                                        </div>
                                        <span className="text-sm font-black text-purple-400">{chartData[hoverIndex].rolling.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <div className="bg-slate-900/20 border border-dashed border-white/5 rounded-[2rem] p-6 flex flex-col items-center justify-center text-center space-y-3 h-full min-h-[160px]">
                            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-slate-600">
                                <Info className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Detaylı Analiz</h4>
                                <p className="text-[10px] text-slate-600">Grafiğin üzerine gelerek anlık verileri ve AI olaylarını inceleyin.</p>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
