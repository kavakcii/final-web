"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi } from "lucide-react";
import { FinAiLogo } from "./FinAiLogo";
import { useUser } from "@/components/providers/UserProvider";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

interface PremiumCardProps {
    userName: string;
    totalBalance?: string;
    changePercent?: string;
    isPositive?: boolean;
    history?: any[];
}

export function PremiumCard({ userName, totalBalance = "₺0,00", changePercent = "%0", isPositive = true, history = [] }: PremiumCardProps) {
    const { user } = useUser();
    const [isHovered, setIsHovered] = useState(false);

    // Format join date as DD.MM
    const joinDate = user?.created_at ? new Date(user.created_at) : null;
    const formattedJoinDate = joinDate 
        ? `${joinDate.getDate().toString().padStart(2, '0')}${(joinDate.getMonth() + 1).toString().padStart(2, '0')}`
        : "0101";

    const chartData = React.useMemo(() => {
        if (history && history.length > 0) {
            return history.map(item => ({
                name: new Date(item.snapshot_date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
                balance: Number(item.total_value)
            }));
        }
        return [
            { name: "1", balance: 42000 },
            { name: "2", balance: 45000 },
            { name: "3", balance: 43500 },
            { name: "4", balance: 48000 },
            { name: "5", balance: 52000 },
        ];
    }, [history]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, rotateY: 5, rotateX: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative w-full max-w-[280px] aspect-[1.586/1] rounded-[16px] overflow-hidden shadow-2xl cursor-pointer group/card preserve-3d"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Base Background with Texture */}
            <div className="absolute inset-0 bg-[#001a4d] bg-gradient-to-br from-[#001a4d] via-[#00008B] to-[#001a4d]">
                <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
            </div>

            {/* Inner Content - Default View */}
            <AnimatePresence mode="wait">
                {!isHovered ? (
                    <motion.div
                        key="card-face"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="relative h-full w-full p-5 flex flex-col justify-between text-white select-none z-10"
                    >
                        {/* Top Row: Logo and Contactless */}
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-1">
                                <FinAiLogo className="w-5 h-5 drop-shadow-lg" />
                                <span className="text-sm font-black tracking-tighter">
                                    FinAi<span className="text-blue-400">.</span>
                                </span>
                            </div>
                            <div className="rotate-90">
                                <Wifi className="w-4 h-4 opacity-60" />
                            </div>
                        </div>

                        {/* Middle: Chip and Card Number in Same Row */}
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-6 bg-gradient-to-br from-[#ffd700] via-[#fdf5e6] to-[#daa520] rounded-[4px] shadow-inner relative overflow-hidden shrink-0">
                                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-px opacity-30">
                                    {[...Array(9)].map((_, i) => (
                                        <div key={i} className="border-[0.5px] border-black/20" />
                                    ))}
                                </div>
                            </div>
                            
                            {/* Card Number */}
                            <div className="text-[11px] font-mono tracking-[0.15em] drop-shadow-md whitespace-nowrap opacity-80">
                                **** **** **** {formattedJoinDate}
                            </div>
                        </div>

                        {/* Bottom: Total Balance */}
                        <div className="flex items-end justify-between">
                            <div>
                                <span className="text-[8px] uppercase tracking-[0.2em] opacity-40 font-bold block mb-0.5">Toplam Bakiye</span>
                                <p className="text-lg font-black tracking-tight leading-none">{totalBalance}</p>
                            </div>
                            <div className={`px-1.5 py-0.5 ${isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'} rounded text-[9px] font-bold`}>
                                {changePercent}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="chart-view"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="relative h-full w-full p-4 flex flex-col text-white select-none z-10"
                    >
                        {/* Chart Header */}
                        <div className="flex items-center justify-between mb-1">
                            <div>
                                <span className="text-[8px] uppercase tracking-[0.2em] opacity-50 font-bold">Portföy Geçmişi</span>
                                <p className="text-sm font-black tracking-tight leading-tight">{totalBalance}</p>
                            </div>
                            <div className={`px-1.5 py-0.5 ${isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'} rounded text-[9px] font-bold`}>
                                {changePercent}
                            </div>
                        </div>

                        {/* Mini Chart */}
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="cardGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'rgba(0,0,50,0.9)', 
                                            border: '1px solid rgba(96,165,250,0.3)', 
                                            borderRadius: '8px',
                                            fontSize: '10px',
                                            padding: '4px 8px'
                                        }}
                                        itemStyle={{ color: '#93c5fd', fontWeight: 'bold', fontSize: '10px' }}
                                        labelStyle={{ color: '#60a5fa', fontSize: '9px' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="balance" 
                                        stroke="#60a5fa" 
                                        strokeWidth={2}
                                        fillOpacity={1} 
                                        fill="url(#cardGradient)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Chart Footer */}
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-[7px] font-bold opacity-30 uppercase tracking-widest">Bakiye Değişimi</span>
                            <span className="text-[7px] font-bold text-blue-300 uppercase tracking-widest flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
                                Canlı
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reflection Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none group-hover/card:translate-x-full transition-transform duration-1000 ease-in-out z-20" />
        </motion.div>
    );
}
