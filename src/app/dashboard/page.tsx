"use client";

import { AuthComponent } from "@/components/ui/sign-up";
import { TrendingUp, Activity, DollarSign, BarChart2, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/components/providers/UserProvider";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2 } from "lucide-react";

import TradingViewWidget from "@/components/TradingViewWidget";
import { TefasChart } from "@/components/TefasChart";
import { PortfolioService, Asset } from "@/lib/portfolio-service";
import { DashboardPortfolioWidget } from "@/components/DashboardPortfolioWidget";

export default function Dashboard() {
    const { email: userEmail, userName, isAuthenticated, myAssets, prices, stats, isDataLoaded } = useUser();
    const [selectedAsset, setSelectedAsset] = useState<string>("FOREKS:XU100");
    const [isTefas, setIsTefas] = useState(false);

    // Group assets by symbol
    const groupedAssets = useMemo(() => {
        const groups: Record<string, { symbol: string, type: string, quantity: number, totalCost: number }> = {};
        myAssets.forEach((asset: Asset) => {
            if (!groups[asset.symbol]) {
                groups[asset.symbol] = { symbol: asset.symbol, type: asset.type, quantity: 0, totalCost: 0 };
            }
            groups[asset.symbol].quantity += asset.quantity;
            groups[asset.symbol].totalCost += (asset.quantity * asset.avgCost);
        });
        return Object.values(groups);
    }, [myAssets]);

    const handleAssetSelect = (symbol: string, type: string) => {
        if (type === 'FUND') {
            setSelectedAsset(symbol);
            setIsTefas(true);
        } else {
            const cleanSymbol = symbol.replace('.IS', '').replace('.is', '');
            setSelectedAsset(`BIST:${cleanSymbol}`);
            setIsTefas(false);
        }
    };

    // Loading State with Steps
    const [loadingStep, setLoadingStep] = useState(0);
    const loadingMessages = [
        "Portföy verileri hazırlanıyor...",
        "Piyasa fiyatları güncelleniyor...",
        "Varlık dağılımı hesaplanıyor...",
        "Analiz tamamlanıyor..."
    ];

    useEffect(() => {
        if (!isDataLoaded) {
            const interval = setInterval(() => {
                setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
            }, 1200);
            return () => clearInterval(interval);
        }
    }, [isDataLoaded]);

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-white text-[#0a192f] w-full mx-auto">
            <div className="w-full max-w-[1600px] mx-auto px-6 py-8 md:px-10 lg:py-10 space-y-8 relative z-10 mb-20 bg-white">
            {/* Loading Overlay */}
            <AnimatePresence>
                {!isDataLoaded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm"
                    >
                        <div className="w-full max-w-md p-8 rounded-[2rem] bg-[#0a192f] text-white shadow-2xl relative overflow-hidden text-center">
                            <div className="relative z-10">
                                <div className="w-20 h-20 mx-auto mb-6 relative">
                                    <div className="absolute inset-0 border-4 border-white/10 rounded-full" />
                                    <div className="absolute inset-0 border-4 border-white rounded-full border-t-transparent animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <TrendingUp className="w-8 h-8 text-white animate-pulse" />
                                    </div>
                                </div>
                                <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Senkronize Ediliyor</h2>
                                <p className="text-slate-300 text-sm">Veriler çekiliyor...</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                <div>
                    <h1 className="text-3xl font-black text-[#0a192f] flex items-center gap-3 tracking-tight">
                        Hoşgeldiniz, {userName || userEmail?.split('@')[0]}
                        <motion.span
                            animate={{ rotate: [0, 14, -8, 14, -4, 10, 0, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                        >
                            👋
                        </motion.span>
                    </h1>
                    <p className="text-slate-500 mt-2 text-sm font-medium">Borsa ve fon verilerin canlı senkronizasyonda.</p>
                </div>
                <div className="flex items-center gap-3">
                    <a
                        href="/dashboard/portfolio/correlation"
                        className="flex items-center gap-2 px-4 py-2 bg-[#0a192f] rounded-xl hover:bg-blue-900 transition-colors text-white text-sm font-bold shadow-md"
                    >
                        <Activity className="w-4 h-4" />
                        Korelasyon Analizi
                    </a>
                </div>
            </div>

            {/* 12-Column BENTO GRID LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full auto-rows-max">

                {/* SOL KOLON: YARDIMCI İSTATİSTİKLER (3 Kolon - Dikey Bento Kutuları) */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                    {(!isDataLoaded ? Array(4).fill(null) : stats).map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1, type: "spring", stiffness: 200, damping: 20 }}
                            className="w-full flex-1"
                        >
                            <div className={cn(
                                "bg-[#0a192f] rounded-2xl p-5 relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] h-full min-h-[140px] flex flex-col justify-between"
                            )}>
                                {!isDataLoaded ? (
                                    <div className="animate-pulse space-y-3 relative z-10 w-full h-full">
                                        <div className="h-8 w-8 bg-white/10 rounded-lg" />
                                        <div className="h-6 w-1/2 bg-white/10 rounded mt-auto" />
                                    </div>
                                ) : stat && (
                                    <div className="relative z-10 flex flex-col h-full justify-between">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="p-2 bg-white/10 rounded-xl text-white group-hover:bg-blue-600 transition-colors duration-300 shadow-sm">
                                                <stat.icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                                            </div>
                                            <div className={`flex items-center gap-1 text-[11px] font-black px-2 py-1 text-white rounded-md ${stat.isPositive ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                                                {stat.isPositive ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />}
                                                {stat.change}
                                            </div>
                                        </div>
                                        <div className="mt-auto">
                                            <h3 className="text-slate-400 text-[10px] font-bold mb-0.5 tracking-wider uppercase opacity-80">{stat.title}</h3>
                                            <p className="text-2xl sm:text-3xl font-black text-white tracking-tighter truncate leading-none">{stat.value}</p>
                                        </div>
                                        {/* Background Decoration */}
                                        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors duration-700 pointer-events-none" />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ORTA KOLON: PORTFÖY & AI WIDGET (6 Kolon - Merkez Hero Aracı) */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
                    className="lg:col-span-6 flex flex-col h-full min-h-[600px]"
                >
                    <DashboardPortfolioWidget />
                </motion.div>

                {/* SAĞ KOLON: VARLIK LİSTESİ (3 Kolon - Dikey Sabit Liste) */}
                <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
                    className="lg:col-span-3 h-full max-h-[610px] flex flex-col"
                >
                    <div className="bg-[#0a192f] shadow-2xl rounded-2xl p-5 flex flex-col relative overflow-hidden group h-full">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full blur-2xl pointer-events-none" />

                        <h2 className="text-lg font-black text-white mb-6 relative z-10 tracking-tight flex justify-between items-center">
                            Varlıklarım
                            <span className="text-[10px] font-bold text-blue-300 px-2 py-0.5 rounded bg-blue-900/50 shadow-sm animate-pulse">Senkronize</span>
                        </h2>
                        
                        <div className="space-y-2 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 relative z-10">
                            {!isDataLoaded ? (
                                Array(5).fill(null).map((_, i) => (
                                    <div key={i} className="h-14 w-full animate-pulse bg-white/5 rounded-xl mb-2" />
                                ))
                            ) : groupedAssets.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-sm text-slate-500 font-medium">Henüz varlık eklemediniz.</p>
                                </div>
                            ) : (
                                groupedAssets.map((asset: any, i: number) => {
                                    const currentPrice = prices[asset.symbol.toUpperCase()];
                                    const change = currentPrice ? ((currentPrice - (asset.totalCost / asset.quantity)) / (asset.totalCost / asset.quantity)) * 100 : 0;

                                    return (
                                        <div
                                            key={i}
                                            onClick={() => handleAssetSelect(asset.symbol, asset.type)}
                                            className={cn(
                                                "flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer bg-white/5 border border-transparent",
                                                selectedAsset.includes(asset.symbol.replace('.IS', ''))
                                                    ? "bg-blue-600 border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                                                    : "hover:bg-white/10 hover:border-white/10 hover:-translate-y-0.5"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                                                    {asset.symbol.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-white leading-tight">{asset.symbol}</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{asset.type === 'STOCK' ? 'Hisse' : 'Fon'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={cn(
                                                    "text-xs font-black",
                                                    change >= 0 ? "text-emerald-400" : "text-rose-400"
                                                )}>
                                                    {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                                    {asset.quantity} Adet
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div
                                onClick={() => { setSelectedAsset("FOREKS:XU100"); setIsTefas(false); }}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer mt-4 bg-white/5 border border-dashed border-white/20 hover:border-white/40 group",
                                    selectedAsset === "FOREKS:XU100" ? "bg-blue-600 shadow-md ring-1 ring-blue-400 border-solid" : "hover:bg-white/10"
                                )}
                            >
                                <span className="text-xs font-black text-white tracking-wide group-hover:translate-x-1 transition-transform">BIST 100 Endeksi</span>
                                <Activity className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    </div>
    );
}


