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
                        <div className="w-full max-w-md p-8 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,_#ffffff_0%,_rgba(10,25,47,0.12)_120%)] ring-1 ring-[#0a192f]/5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.12)] relative overflow-hidden text-center">
                            {/* Animated Background Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[#0a192f]/5 via-transparent to-transparent animate-pulse" />

                            <div className="relative z-10 flex flex-col items-center gap-6">
                                {/* Logo / Icon Animation */}
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-100 blur-xl rounded-full animate-pulse" />
                                    <div className="w-20 h-20 bg-white rounded-2xl border border-blue-200 flex items-center justify-center shadow-lg shadow-blue-500/10">
                                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <motion.h2
                                        key={loadingStep}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="text-2xl font-bold text-[#0a192f]"
                                    >
                                        {loadingMessages[loadingStep]}
                                    </motion.h2>
                                    <p className="text-slate-500 text-sm">Lütfen bekleyin, verileriniz işleniyor.</p>
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
                    <h1 className="text-3xl font-bold text-[#0a192f] mb-2">Hoşgeldin, {userName || userEmail?.split('@')[0]} 👋</h1>
                    <p className="text-slate-500">Piyasa verileri ve portföyün güncel.</p>
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
                            "bg-[radial-gradient(ellipse_at_center,_#ffffff_0%,_rgba(10,25,47,0.12)_120%)] ring-1 ring-[#0a192f]/[0.08] hover:ring-[#0a192f]/15 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] rounded-[1.5rem] p-6 relative overflow-hidden group transition-all duration-500 hover:-translate-y-1 shadow-sm"
                        )}
                    >
                        {!isDataLoaded ? (
                            <div className="animate-pulse space-y-3 relative z-10">
                                <div className="h-10 w-10 bg-slate-100 rounded-lg" />
                                <div className="h-4 w-20 bg-slate-100 rounded" />
                                <div className="h-8 w-32 bg-slate-100 rounded" />
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
                <div className="bg-[radial-gradient(ellipse_at_center,_#ffffff_0%,_rgba(10,25,47,0.12)_120%)] ring-1 ring-[#0a192f]/[0.08] shadow-[0_15px_30px_-15px_rgba(0,0,0,0.06)] rounded-[1.5rem] p-7 flex flex-col relative overflow-hidden transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]">
                    <h2 className="text-xl font-black text-[#0a192f] mb-6 relative z-10 tracking-tight">Varlıklarım</h2>
                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin scrollbar-thumb-slate-200 relative z-10">
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
                                            "flex items-center justify-between p-3.5 rounded-2xl transition-all cursor-pointer bg-white/50 group hover:bg-white hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.1)]",
                                            selectedAsset.includes(asset.symbol.replace('.IS', ''))
                                                ? "ring-2 ring-blue-500/30 shadow-sm bg-white"
                                                : "ring-1 ring-slate-900/5 hover:ring-slate-900/10"
                                        )}
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-10 h-10 rounded-[0.8rem] bg-[#f4f6f8] group-hover:bg-blue-50 flex items-center justify-center text-[11px] font-black text-[#0a192f] group-hover:text-blue-700 transition-colors">
                                                {asset.symbol.substring(0, 2)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-[#0a192f]">{asset.symbol}</p>
                                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{asset.type === 'STOCK' ? 'Hisse' : 'Fon'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn(
                                                "text-[13px] font-black",
                                                change >= 0 ? "text-emerald-600" : "text-rose-600"
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
                                "flex items-center justify-between p-3.5 rounded-2xl transition-all cursor-pointer bg-white/50 group hover:bg-white hover:shadow-md mt-4",
                                selectedAsset === "FOREKS:XU100" ? "ring-2 ring-blue-500/30 shadow-sm bg-white" : "ring-1 ring-slate-900/5 ring-dashed hover:ring-slate-900/10"
                            )}
                        >
                            <span className="text-xs font-black text-[#0a192f] uppercase tracking-wider">BIST 100 Endeksi</span>
                            <Activity className="w-4 h-4 text-slate-400 group-hover:text-[#0a192f] transition-colors" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


