"use client";

import { AuthComponent } from "@/components/ui/sign-up";
import { TrendingUp, Activity, DollarSign, BarChart2, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { useUser } from "@/components/providers/UserProvider";

export default function Dashboard() {
    const { email: userEmail, userName, isAuthenticated } = useUser();

    // DASHBOARD CONTENT
    const stats = [
        {
            title: "Toplam Portföy",
            value: "₺124,500.00",
            change: "+%12.5",
            isPositive: true,
            icon: Wallet,
            gradient: "from-blue-500/20 to-purple-500/20",
            border: "border-blue-500/20"
        },
        {
            title: "Günlük Kar/Zarar",
            value: "₺1,250.00",
            change: "+%2.1",
            isPositive: true,
            icon: Activity,
            gradient: "from-green-500/20 to-emerald-500/20",
            border: "border-green-500/20"
        },
        {
            title: "Açık Pozisyonlar",
            value: "8",
            change: "-1",
            isPositive: false,
            icon: BarChart2,
            gradient: "from-orange-500/20 to-red-500/20",
            border: "border-orange-500/20"
        }
    ];

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Hoşgeldin, {userName || userEmail?.split('@')[0]} 👋</h1>
                    <p className="text-slate-400">Piyasa verileri ve portföyün güncel.</p>
                </div>
                <div className="flex gap-3">
                    <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Yeni İşlem
                    </button>
                    <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10">
                        Rapor Al
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`bg-slate-900/50 backdrop-blur-sm border ${stat.border} rounded-2xl p-6 relative overflow-hidden group hover:bg-slate-900/80 transition-all duration-300`}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-white/5 rounded-lg text-slate-300 group-hover:text-white transition-colors">
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${stat.isPositive ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                                    {stat.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    {stat.change}
                                </div>
                            </div>

                            <h3 className="text-slate-400 text-sm font-medium mb-1">{stat.title}</h3>
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Placeholder Content for Charts/Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart Area */}
                <div className="lg:col-span-2 bg-slate-900/50 border border-white/10 rounded-2xl p-6 min-h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-white">Piyasa Analizi</h2>
                        <div className="flex gap-2">
                            {['1G', '1H', '1A', '1Y'].map((period) => (
                                <button key={period} className="px-3 py-1 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-colors">
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-[300px] flex items-center justify-center text-slate-500 border-2 border-dashed border-white/5 rounded-xl">
                        Grafik Alanı (TradingView Entegrasyonu)
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-6">Son İşlemler</h2>
                    <div className="space-y-4">
                        {[
                            { name: "THYAO", type: "Alış", price: "284.50", amount: "₺14,225", time: "10:42" },
                            { name: "GARAN", type: "Satış", price: "64.20", amount: "₺8,560", time: "09:15" },
                            { name: "ASELS", type: "Alış", price: "52.10", amount: "₺5,210", time: "Dün" },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${item.type === 'Alış' ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <div>
                                        <p className="text-sm font-medium text-white">{item.name}</p>
                                        <p className="text-xs text-slate-400">{item.type}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-white">{item.amount}</p>
                                    <p className="text-xs text-slate-400">{item.price} • {item.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
