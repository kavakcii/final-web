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
        <div className="flex flex-col h-full bg-transparent text-white w-full max-w-[1600px] mx-auto overflow-y-auto">
            {/* Dark Aesthetic Glow Behind Header */}
            <div className="absolute top-0 left-1/2 -ml-[40rem] w-[80rem] h-[20rem] opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/20 via-zinc-900/0 to-transparent pointer-events-none" />

            <div className="px-6 py-8 md:px-10 lg:py-10 space-y-8 relative z-10 w-full mb-20">
            {/* Loading Overlay */}
            <AnimatePresence>
                {!isDataLoaded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-xl"
                    >
                        <div className="w-full max-w-md p-8 rounded-[2rem] bg-zinc-900 border border-white/10 shadow-[0_0_100px_rgba(255,255,255,0.02)] relative overflow-hidden text-center">
                            {/* Animated Background Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent animate-pulse" />

                            <div className="relative z-10">
                                <div className="w-20 h-20 mx-auto mb-6 relative">
                                    <div className="absolute inset-0 border-4 border-zinc-800 rounded-full" />
                                    <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <TrendingUp className="w-8 h-8 text-emerald-500 animate-pulse" />
                                    </div>
                                </div>
                                <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Veriler Senkronize Ediliyor</h2>
                                <p className="text-zinc-400 text-sm">FinAi algoritmaları en güncel verileri çekiyor...</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
                        Hoşgeldiniz, {userName || userEmail?.split('@')[0]}
                        <motion.span
                            animate={{ rotate: [0, 14, -8, 14, -4, 10, 0, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                        >
                            👋
                        </motion.span>
                    </h1>
                    <p className="text-zinc-400 mt-2 text-sm font-medium">Borsa ve fon verilerin canlı senkronizasyonda.</p>
                </div>
                <div className="flex items-center gap-3">
                    <a
                        href="/dashboard/correlation-analysis"
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-white/10 rounded-xl hover:bg-zinc-700 transition-colors text-white text-sm font-medium"
                    >
                        <Activity className="w-4 h-4" />
                        Korelasyon Analizi
                    </a>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(!isDataLoaded ? Array(3).fill(null) : stats).map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-zinc-900/50 border border-white/5 backdrop-blur-sm rounded-[1.5rem] p-6 relative overflow-hidden group transition-all duration-500 hover:-translate-y-1 hover:border-emerald-500/20"
                    >
                        {!isDataLoaded ? (
                            <div className="animate-pulse space-y-3 relative z-10">
                                <div className="h-10 w-10 bg-zinc-800 rounded-lg" />
                                <div className="h-4 w-20 bg-zinc-800 rounded" />
                                <div className="h-8 w-32 bg-zinc-800 rounded" />
                            </div>
                        ) : (
                            <>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-2.5 bg-[#f4f6f8] rounded-xl text-blue-600 transition-colors group-hover:scale-110 duration-500">
                                            <stat.icon className="w-5 h-5 flex-shrink-0" />
                                        </div>
                                        <div className={`flex items-center gap-1.5 text-[0.8rem] font-bold px-3 py-1.5 rounded-xl ${stat.isPositive ? 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-600/10' : 'text-rose-700 bg-rose-50 ring-1 ring-rose-600/10'}`}>
                                            {stat.isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                            {stat.change}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-slate-500 text-[0.8rem] font-bold mb-1.5 uppercase tracking-widest">{stat.title}</h3>
                                        <p className="text-3xl font-black text-[#0a192f] tracking-tight">{stat.value}</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Interactive Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <DashboardPortfolioWidget />

                {/* Asset Quick Select (from Portfolio) */}
                <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 shadow-2xl rounded-2xl p-6 flex flex-col relative overflow-hidden group">
                    {/* Inner texture */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

                    <h2 className="text-lg font-bold text-white mb-6 relative z-10 tracking-tight flex justify-between items-center">
                        Varlıklarım
                        <span className="text-xs font-normal text-zinc-500 border border-white/10 px-2 py-1 rounded-md bg-zinc-800/50">Senkronize</span>
                    </h2>
                    <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin scrollbar-thumb-zinc-700 relative z-10">
                        {!isDataLoaded ? (
                            Array(3).fill(null).map((_, i) => (
                                <div key={i} className="h-16 w-full animate-pulse bg-slate-50 rounded-xl" />
                            ))
                        ) : groupedAssets.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-sm text-slate-500">Henüz varlık eklemediniz.</p>
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
                                            "flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer bg-zinc-900 border",
                                            selectedAsset.includes(asset.symbol.replace('.IS', ''))
                                                ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                                                : "border-white/5 hover:border-white/10 hover:bg-zinc-800"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 ring-1 ring-white/5">
                                                {asset.symbol.substring(0, 2)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-white">{asset.symbol}</p>
                                                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{asset.type === 'STOCK' ? 'Hisse' : 'Fon'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn(
                                                "text-[13px] font-bold",
                                                change >= 0 ? "text-emerald-400" : "text-rose-400"
                                            )}>
                                                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                                            </p>
                                            <p className="text-[10px] text-slate-500">
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
                                "flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer border mt-4 bg-zinc-900",
                                selectedAsset === "FOREKS:XU100" ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/5 border-dashed hover:border-white/10 hover:bg-zinc-800"
                            )}
                        >
                            <span className="text-xs font-semibold text-zinc-300 tracking-wide">BIST 100 Endeksi</span>
                            <Activity className="w-4 h-4 text-zinc-500" />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
    );
}


