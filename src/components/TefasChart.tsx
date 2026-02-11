"use client";

import React, { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { Loader2, AlertCircle } from 'lucide-react';

interface TefasChartProps {
    fundCode: string;
    height?: number | string;
}

export function TefasChart({ fundCode, height = 400 }: TefasChartProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!fundCode) return;
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/tefas?code=${fundCode}`);
                if (!res.ok) throw new Error('Veri alınamadı');
                const json = await res.json();

                if (json.history && json.history.length > 0) {
                    setData(json.history);
                } else {
                    setError('Geçmiş veri bulunamadı.');
                }
            } catch (err) {
                console.error("TefasChart error:", err);
                setError('Veriler yüklenirken bir hata oluştu.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [fundCode]);

    if (loading) {
        return (
            <div className="flex items-center justify-center w-full bg-slate-900/50 rounded-xl border border-white/10" style={{ height }}>
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="text-sm text-slate-400">Fon verileri yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center w-full bg-slate-900/50 rounded-xl border border-white/10 p-6 text-center" style={{ height }}>
                <div className="flex flex-col items-center gap-3">
                    <AlertCircle className="w-8 h-8 text-slate-500" />
                    <p className="text-sm text-slate-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-slate-900/50 rounded-xl border border-white/10 pt-4" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(str) => {
                            // Format dd.mm.yyyy to dd/mm
                            const parts = str.split('.');
                            return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : str;
                        }}
                        minTickGap={30}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `₺${val.toFixed(2)}`}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#fff'
                        }}
                        itemStyle={{ color: '#3b82f6' }}
                        labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
