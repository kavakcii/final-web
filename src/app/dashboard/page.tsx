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
        <div className="p-6 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto relative min-h-screen">
            {/* Loading Overlay */}
            <AnimatePresence>
                {!isDataLoaded && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#020617]/80 backdrop-blur-xl"
                    >
                        <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/50 border border-white/10 shadow-2xl relative overflow-hidden text-center">
                            {/* Animated Background Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent animate-pulse" />

                            <div className="relative z-10 flex flex-col items-center gap-6">
                                {/* Logo / Icon Animation */}
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                                    <div className="w-20 h-20 bg-slate-950 rounded-2xl border border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <motion.h2
                                        key={loadingStep}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="text-2xl font-bold text-white"
                                    >
                                        {loadingMessages[loadingStep]}
                                    </motion.h2>
                                    <p className="text-slate-400 text-sm">Lütfen bekleyin, verileriniz işleniyor.</p>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Hoşgeldin, {userName || userEmail?.split('@')[0]} 👋</h1>
                    <p className="text-slate-400">Piyasa verileri ve portföyün güncel.</p>
                </div>
                <div className="flex items-center gap-3">
                    <a
                        href="/dashboard/correlation-analysis"
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:opacity-90 transition-opacity text-white text-sm font-medium"
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
                        className={cn(
                            "bg-slate-900/50 backdrop-blur-sm border rounded-2xl p-6 relative overflow-hidden group hover:bg-slate-900/80 transition-all duration-300",
                            stat?.border || "border-white/5"
                        )}
                    >
                        {!isDataLoaded ? (
                            <div className="animate-pulse space-y-3">
                                <div className="h-10 w-10 bg-white/5 rounded-lg" />
                                <div className="h-4 w-20 bg-white/5 rounded" />
                                <div className="h-8 w-32 bg-white/5 rounded" />
                            </div>
                        ) : (
                            <>
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
                            </>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Interactive Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <DashboardPortfolioWidget />

                {/* Asset Quick Select (from Portfolio) */}
                <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 flex flex-col">
                    <h2 className="text-lg font-semibold text-white mb-6">Varlıklarım</h2>
                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin scrollbar-thumb-white/10">
                        {!isDataLoaded ? (
                            Array(3).fill(null).map((_, i) => (
                                <div key={i} className="h-16 w-full animate-pulse bg-white/5 rounded-xl" />
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
                                            "flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer border",
                                            selectedAsset.includes(asset.symbol.replace('.IS', ''))
                                                ? "bg-blue-600/20 border-blue-500/50"
                                                : "bg-white/5 border-transparent hover:border-white/10 hover:bg-white/10"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-bold text-blue-400 border border-white/5">
                                                {asset.symbol.substring(0, 2)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{asset.symbol}</p>
                                                <p className="text-[10px] text-slate-500">{asset.type === 'STOCK' ? 'Hisse' : 'Fon'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn(
                                                "text-xs font-bold",
                                                change >= 0 ? "text-green-400" : "text-red-400"
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
                                "flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer border mt-4 opacity-60 hover:opacity-100",
                                selectedAsset === "FOREKS:XU100" ? "bg-slate-800 border-white/20" : "bg-transparent border-dashed border-white/10"
                            )}
                        >
                            <span className="text-xs font-medium text-slate-400">BIST 100 Endeksi</span>
                            <Activity className="w-4 h-4 text-slate-500" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


