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
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, Zap, TrendingUp, ChevronRight, Activity, Target, Calendar } from 'lucide-react';
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
    const [highlightedLine, setHighlightedLine] = useState<'src' | 'tgt' | null>(null);

    // ─────────────────────────────────────────────────────────────────────────
    // DATA ALIGNMENT
    // ─────────────────────────────────────────────────────────────────────────
    const chartData = useMemo(() => {
        if (!historySource.length || !historyTarget.length) return [];

        const sourceMap = new Map(historySource.map(p => [p.date, p.price]));
        const targetMap = new Map(historyTarget.map(p => [p.date, p.price]));
        const allDates = Array.from(new Set([...sourceMap.keys(), ...targetMap.keys()])).sort();

        let lastSrc = historySource[0]?.price;
        let lastTgt = historyTarget[0]?.price;

        const aligned = allDates.map(date => {
            const src = sourceMap.get(date) ?? lastSrc;
            const tgt = targetMap.get(date) ?? lastTgt;
            if (sourceMap.has(date)) lastSrc = src;
            if (targetMap.has(date)) lastTgt = tgt;
            return { date, src, tgt };
        });

        const baseSrc = aligned[0].src || 1;
        const baseTgt = aligned[0].tgt || 1;

        return aligned.map((d, i) => ({
            index: i,
            date: d.date,
            displayDate: new Date(d.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }),
            srcPrice: d.src,
            tgtPrice: d.tgt,
            srcPct: parseFloat(((d.src - baseSrc) / baseSrc * 100).toFixed(2)),
            tgtPct: parseFloat(((d.tgt - baseTgt) / baseTgt * 100).toFixed(2)),
            rolling: rollingCorrelation[i] ?? null
        }));
    }, [historySource, historyTarget, rollingCorrelation]);

    const handleMouseMove = (state: any) => {
        if (state && state.activeTooltipIndex !== undefined) {
            setHoverIndex(state.activeTooltipIndex);
            const currentDate = chartData[state.activeTooltipIndex]?.date;
            const event = events.find(e => e.date === currentDate);
            setActiveEvent(event || null);
        }
    };

    const currentPoint = hoverIndex !== null ? chartData[hoverIndex] : null;

    return (
        <div className="flex flex-col w-full gap-8 bg-white">
            {/* Header / Interactive Legend */}
            <div className="flex flex-wrap items-end justify-between gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-600" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Karşılaştırmalı Performans Endeksi</span>
                    </div>

                    <div className="flex items-center gap-8">
                        {/* Source Legend */}
                        <div
                            onMouseEnter={() => setHighlightedLine('src')}
                            onMouseLeave={() => setHighlightedLine(null)}
                            className={cn(
                                "flex flex-col transition-all duration-300 cursor-pointer",
                                highlightedLine === 'tgt' ? "opacity-30" : "opacity-100"
                            )}
                        >
                            <div className="flex items-center gap-2.5 mb-1">
                                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm" />
                                <span className="text-lg font-black text-slate-900 tracking-tight">{sourceSymbol.replace('.IS', '')}</span>
                            </div>
                            {currentPoint && (
                                <div className="flex items-center gap-2 ml-5">
                                    <span className="text-xs font-bold text-slate-500">₺{currentPoint.srcPrice.toLocaleString('tr-TR')}</span>
                                    <span className={cn("text-xs font-black", currentPoint.srcPct >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                        {currentPoint.srcPct > 0 ? '+' : ''}{currentPoint.srcPct}%
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="h-10 w-[1px] bg-slate-200" />

                        {/* Target Legend */}
                        <div
                            onMouseEnter={() => setHighlightedLine('tgt')}
                            onMouseLeave={() => setHighlightedLine(null)}
                            className={cn(
                                "flex flex-col transition-all duration-300 cursor-pointer",
                                highlightedLine === 'src' ? "opacity-30" : "opacity-100"
                            )}
                        >
                            <div className="flex items-center gap-2.5 mb-1">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
                                <span className="text-lg font-black text-indigo-600 tracking-tight">{targetSymbol.replace('.IS', '')}</span>
                            </div>
                            {currentPoint && (
                                <div className="flex items-center gap-2 ml-5">
                                    <span className="text-xs font-bold text-slate-500">₺{currentPoint.tgtPrice.toLocaleString('tr-TR')}</span>
                                    <span className={cn("text-xs font-black", currentPoint.tgtPct >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                        {currentPoint.tgtPct > 0 ? '+' : ''}{currentPoint.tgtPct}%
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Score Badge */}
                <div className="flex flex-col items-end gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Korelasyon Skoru</span>
                    <div className={cn(
                        "px-6 py-3 rounded-2xl border text-sm font-black flex items-center gap-3 transition-all duration-700",
                        correlationValue > 0.85
                            ? "bg-rose-50 border-rose-200 text-rose-600"
                            : "bg-indigo-50 border-indigo-200 text-indigo-700"
                    )}>
                        <Target className="w-4 h-4" />
                        {correlationValue.toFixed(4)}
                    </div>
                </div>
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[460px]">
                {/* Visual Section */}
                <div className="lg:col-span-9 bg-slate-50 border border-slate-200 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-inner">
                    {/* Floating Crosshair Indicator */}
                    {currentPoint && (
                        <div
                            className="absolute top-0 bottom-0 w-[1px] bg-indigo-200/50 pointer-events-none transition-all duration-75 z-20"
                            style={{ left: `${(hoverIndex! / (chartData.length - 1)) * 90 + 5}%` }}
                        >
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-600 shadow-xl shadow-indigo-300" />
                        </div>
                    )}

                    <ResponsiveContainer width="100%" height="88%">
                        <AreaChart data={chartData} onMouseMove={handleMouseMove} onMouseLeave={() => setHoverIndex(null)} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradSrcL" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradTgtL" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#e2e8f0" />

                            <XAxis
                                dataKey="displayDate"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                interval={Math.floor(chartData.length / 8)}
                                padding={{ left: 20, right: 20 }}
                            />

                            <YAxis hide domain={['auto', 'auto']} />

                            <Area
                                type="monotone"
                                dataKey="srcPct"
                                stroke="#3b82f6"
                                strokeWidth={highlightedLine === 'src' ? 4 : 2.5}
                                fillOpacity={1}
                                fill="url(#gradSrcL)"
                                animationDuration={1200}
                                activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 3 }}
                                style={{ opacity: highlightedLine === 'tgt' ? 0.2 : 1 }}
                            />

                            <Area
                                type="monotone"
                                dataKey="tgtPct"
                                stroke="#10b981"
                                strokeWidth={highlightedLine === 'tgt' ? 4 : 2.5}
                                fillOpacity={1}
                                fill="url(#gradTgtL)"
                                animationDuration={1200}
                                activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 3 }}
                                style={{ opacity: highlightedLine === 'src' ? 0.2 : 1 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>

                    {/* Advanced Sparkline Indicator */}
                    <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                <TrendingUp className="w-4 h-4 text-indigo-500" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Canlı Uyum Akışı</span>
                        </div>
                        <div className="flex gap-[4px] h-4 items-end">
                            {chartData.map((d, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: d.rolling !== null ? `${Math.abs(d.rolling) * 100}%` : '20%' }}
                                    className={cn(
                                        "w-[3px] rounded-full",
                                        d.rolling !== null ? (Math.abs(d.rolling) > 0.85 ? "bg-rose-500" : "bg-indigo-300") : "bg-slate-200"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Vertical Panel */}
                <div className="lg:col-span-3">
                    <AnimatePresence mode="wait">
                        {activeEvent ? (
                            <motion.div
                                key="event"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full bg-indigo-900 border border-indigo-900 rounded-[2.5rem] p-8 flex flex-col shadow-2xl"
                            >
                                <div className="space-y-6">
                                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                                        <Zap className="w-7 h-7 fill-current" />
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">{activeEvent.date}</span>
                                        <h4 className="text-xl font-black text-white leading-tight">{activeEvent.title}</h4>
                                    </div>
                                    <p className="text-sm text-indigo-100 leading-relaxed font-medium italic opacity-80">"{activeEvent.description}"</p>
                                </div>
                                <div className="mt-auto pt-6 border-t border-white/10">
                                    <div className="p-4 rounded-2xl bg-black/20 text-[10px] text-white/70 font-black uppercase tracking-widest">
                                        MAKRO ETKİ: {activeEvent.impact}
                                    </div>
                                </div>
                            </motion.div>
                        ) : currentPoint ? (
                            <motion.div
                                key="data"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="h-full bg-white border border-slate-200 rounded-[2.5rem] p-8 flex flex-col gap-10 shadow-sm"
                            >
                                <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs font-black text-slate-900 uppercase tracking-widest tabular-nums">{currentPoint.displayDate} {new Date(currentPoint.date).getFullYear()}</span>
                                </div>

                                <div className="space-y-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                            <span>{sourceSymbol.replace('.IS', '')}</span>
                                            <span className={cn(currentPoint.srcPct >= 0 ? "text-emerald-600" : "text-rose-600")}>{currentPoint.srcPct}%</span>
                                        </div>
                                        <div className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">₺{currentPoint.srcPrice.toLocaleString('tr-TR', { minimumFractionDigits: 4 })}</div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-[10px] font-black text-indigo-700 uppercase tracking-widest">
                                            <span>{targetSymbol.replace('.IS', '')}</span>
                                            <span className={cn(currentPoint.tgtPct >= 0 ? "text-emerald-600" : "text-rose-600")}>{currentPoint.tgtPct}%</span>
                                        </div>
                                        <div className="text-3xl font-black text-indigo-600 tracking-tighter tabular-nums">₺{currentPoint.tgtPrice.toLocaleString('tr-TR', { minimumFractionDigits: 4 })}</div>
                                    </div>
                                </div>

                                <div className="mt-auto p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">UYUM</span>
                                    <span className="text-2xl font-black text-indigo-700 tabular-nums">{currentPoint.rolling?.toFixed(2) || '0.00'}</span>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center gap-6">
                                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg shadow-slate-200/50 border border-slate-100">
                                    <Brain className="w-10 h-10 text-slate-300 animate-pulse" />
                                </div>
                                <div className="space-y-2 px-4">
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Derin Analiz</h4>
                                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed">Varlık hareketlerini ve piyasa tepkilerini incelemek için grafiğe odaklanın.</p>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
