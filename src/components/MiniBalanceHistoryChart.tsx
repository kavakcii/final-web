"use client";

import React from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { motion } from 'framer-motion';

interface HistoryItem {
    date: string;
    balance: number;
}

interface MiniBalanceHistoryChartProps {
    history: HistoryItem[];
}

export function MiniBalanceHistoryChart({ history = [] }: MiniBalanceHistoryChartProps) {
    // Determine if the trend is up or down
    const isUp = history.length >= 2 
        ? history[history.length - 1].balance >= history[0].balance 
        : true;

    const mainColor = isUp ? "#10b981" : "#f43f5e"; // Emerald or Rose

    if (history.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                Geçmiş Veri Yok
            </div>
        );
    }

    // Format data for Recharts
    const chartData = history.map(item => ({
        ...item,
        // Shorten date for tooltips
        displayDate: new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
    }));

    return (
        <div className="h-full w-full p-2 flex flex-col">
            <div className="flex items-center justify-between px-2 pt-1 mb-1">
                <span className="text-[8px] font-black text-[#00008B] uppercase tracking-widest opacity-60">Bakiye Gelişimi</span>
                <span className={isUp ? "text-[8px] font-black text-emerald-500" : "text-[8px] font-black text-rose-500"}>
                    {isUp ? '↑' : '↓'} TREND
                </span>
            </div>

            <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={mainColor} stopOpacity={0.4}/>
                                <stop offset="95%" stopColor={mainColor} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Tooltip 
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-white/95 backdrop-blur-md border border-slate-100 p-2 rounded-lg shadow-xl">
                                            <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">{payload[0].payload.displayDate}</p>
                                            <p className="text-[10px] font-black text-[#00008B]">
                                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(payload[0].value as number)}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                            cursor={{ stroke: mainColor, strokeWidth: 1, strokeDasharray: '3 3' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="balance" 
                            stroke={mainColor} 
                            strokeWidth={2} 
                            fillOpacity={1} 
                            fill="url(#colorBalance)" 
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
