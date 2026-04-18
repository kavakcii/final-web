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

export function BalanceChart() {
    return (
        <div className="w-full h-full p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-[#00008B] text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Haftalık Performans</h3>
                    <p className="text-xl font-black text-[#00008B]">₺55,240.00</p>
                </div>
                <div className="px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded-md text-[10px] font-bold">
                    +12.4%
                </div>
            </div>

            <div className="flex-1 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00008B" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#00008B" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,139,0.1)' }}
                            itemStyle={{ color: '#00008B', fontWeight: 'bold' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="balance" 
                            stroke="#00008B" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorBalance)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="flex justify-between items-center mt-2">
                <span className="text-[9px] font-bold text-[#00008B]/30 uppercase tracking-widest">Son 7 Günlük Bakiye Geçişi</span>
                <span className="text-[9px] font-bold text-[#00008B] uppercase tracking-widest">Canlı</span>
            </div>
        </div>
    );
}
