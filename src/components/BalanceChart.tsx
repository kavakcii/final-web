"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
    { name: "Pzt", balance: 42000 },
    { name: "Sal", balance: 45000 },
    { name: "Çar", balance: 43500 },
    { name: "Per", balance: 48000 },
    { name: "Cum", balance: 52000 },
    { name: "Cmt", balance: 51000 },
    { name: "Paz", balance: 55000 },
];

interface BalanceChartProps {
    totalBalance: string;
    changePercent: string;
    isPositive: boolean;
    history?: any[];
}

export function BalanceChart({ totalBalance, changePercent, isPositive, history = [] }: BalanceChartProps) {
    const chartData = React.useMemo(() => {
        if (history && history.length > 0) {
            return history.map(item => ({
                name: new Date(item.snapshot_date).toLocaleDateString('tr-TR', { 
                    day: '2-digit', 
                    month: '2-digit',
                    year: 'numeric'
                }),
                balance: Number(item.total_value),
                rawDate: item.snapshot_date
            }));
        }
        
        // Fallback: If no history, show current balance as a starting point
        const today = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const currentBalance = Number(totalBalance.replace('₺', '').replace(/\./g, '').replace(',', '.'));
        
        return [
            { name: today, balance: currentBalance }
        ];
    }, [history, totalBalance]);

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                        <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00008B" stopOpacity={0.15}/>
                                <stop offset="95%" stopColor="#00008B" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Tooltip 
                            labelStyle={{ color: '#00008B', fontWeight: 'bold', fontSize: '12px', marginBottom: '4px' }}
                            contentStyle={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                                border: 'none', 
                                borderRadius: '12px', 
                                boxShadow: '0 10px 25px -5px rgba(0,0,139,0.15)',
                                padding: '12px'
                            }}
                            formatter={(value: any) => [
                                typeof value === 'number' 
                                    ? `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
                                    : `₺${value}`,
                                "Bakiye"
                            ]}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="balance" 
                            stroke="#00008B" 
                            strokeWidth={3}
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
