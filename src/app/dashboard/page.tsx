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
        <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-white text-[#00008B] w-full mx-auto relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-50/50 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-slate-50 blur-[100px] pointer-events-none" />

            <div className="w-full max-w-[1600px] mx-auto px-6 py-8 md:px-10 lg:py-10 space-y-8 relative z-10 mb-20">
            {/* Loading Overlay */}
            <AnimatePresence>
                {!isDataLoaded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-white/60 backdrop-blur-md"
                    >
                        <div className="w-full max-w-md p-10 rounded-[2.5rem] bg-white border border-slate-100 text-[#00008B] shadow-2xl relative overflow-hidden text-center">
                            <div className="relative z-10">
                                <div className="w-24 h-24 mx-auto mb-8 relative">
                                    <div className="absolute inset-0 border-4 border-slate-50 rounded-full" />
                                    <div className="absolute inset-0 border-4 border-[#00008B] rounded-full border-t-transparent animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <TrendingUp className="w-10 h-10 text-[#00008B] animate-pulse" />
                                    </div>
                                </div>
                                <h2 className="text-2xl font-bold text-[#00008B] mb-3 tracking-tight">Senkronize Ediliyor</h2>
                                <p className="text-[#00008B]/40 text-sm font-bold uppercase tracking-widest">{loadingMessages[loadingStep]}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                <div>
                    <h1 className="text-4xl font-bold text-[#00008B] flex items-center gap-3 tracking-tight">
                        Hoşgeldiniz, {userName || userEmail?.split('@')[0]}
                        <motion.span
                            animate={{ rotate: [0, 14, -8, 14, -4, 10, 0, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                        >
                            👋
                        </motion.span>
                    </h1>
                    <p className="text-[#00008B] mt-2 text-xs font-bold tracking-[0.3em] uppercase opacity-40">Borsa ve fon verilerin canlı senkronizasyonda.</p>
                </div>
                <div className="flex items-center gap-3">
                    <a
                        href="/dashboard/portfolio/correlation"
                        className="flex items-center gap-2 px-6 py-3 bg-[#00008B] rounded-2xl hover:bg-blue-900 transition-all text-white text-[11px] font-bold tracking-[0.15em] uppercase shadow-xl shadow-[#00008B]/20 active:scale-95"
                    >
                        <Activity className="w-4 h-4" />
                        Korelasyon Analizi
                    </a>
                </div>
            </div>

            {/* 12-Column BENTO GRID LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full auto-rows-max">

                {/* SOL KOLON */}
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
                                "rounded-[2.5rem] p-8 relative overflow-hidden group transition-all duration-500 hover:scale-[1.02] h-full min-h-[160px] flex flex-col justify-center items-center text-center",
                                "glass-widget"
                            )}>
                                {!isDataLoaded ? (
                                    <div className="animate-pulse flex flex-col items-center justify-center space-y-3 relative z-10 w-full h-full">
                                        <div className="h-8 w-8 bg-[#00008B]/5 rounded-lg" />
                                        <div className="h-6 w-1/2 bg-[#00008B]/5 rounded mt-auto" />
                                    </div>
                                ) : stat && (
                                    <div className="relative z-10 flex flex-col h-full justify-center items-center w-full">
                                        <div className="flex flex-col items-center justify-center gap-2 mb-3 w-full">
                                            <div className="p-2.5 bg-[#00008B]/5 rounded-xl text-[#00008B] group-hover:bg-[#00008B] group-hover:text-white transition-colors duration-300 shadow-sm border border-[#00008B]/10 group-hover:border-transparent">
                                                <stat.icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                                            </div>
                                            <div className={`flex items-center justify-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-md ${stat.isPositive ? 'text-emerald-700 bg-emerald-500/20' : 'text-rose-700 bg-rose-500/20'}`}>
                                                {stat.isPositive ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />}
                                                {stat.change}
                                            </div>
                                        </div>
                                        <div className="mt-auto w-full text-center">
                                            <h3 className="text-[#00008B] text-[9px] font-bold mb-2 tracking-[0.25em] uppercase opacity-30">{stat.title}</h3>
                                            <p className="text-3xl sm:text-4xl font-black text-[#00008B] tracking-tighter truncate leading-none">{stat.value}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ORTA KOLON */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
                    className="lg:col-span-6 flex flex-col h-full min-h-[600px]"
                >
                    <DashboardPortfolioWidget />
                </motion.div>

                {/* SAĞ KOLON */}
                <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
                    className="lg:col-span-3 h-full max-h-[610px] flex flex-col"
                >
                    <div className="glass-widget shadow-2xl rounded-[2.5rem] p-8 flex flex-col relative overflow-hidden group h-full items-center text-center">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-bl-full blur-[80px] pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />

                        <div className="w-full flex justify-between items-center mb-8 relative z-10">
                            <h2 className="text-[10px] font-bold text-[#00008B] tracking-[0.3em] uppercase opacity-30">
                                Varlıklarım
                            </h2>
                            <span className="text-[8px] font-bold uppercase tracking-widest text-[#00008B] px-3 py-1 rounded-full bg-blue-50 border border-blue-100 animate-pulse">Senkronize</span>
                        </div>
                        
                        <div className="space-y-3 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-400 relative z-10 w-full">
                            {!isDataLoaded ? (
                                Array(5).fill(null).map((_, i) => (
                                    <div key={i} className="h-14 w-full animate-pulse bg-white/10 rounded-xl mb-2" />
                                ))
                            ) : groupedAssets.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-sm text-slate-500 font-bold">Henüz varlık eklemediyseniz başlayın!</p>
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
                                                "flex flex-col items-center justify-center p-6 rounded-[2.2rem] transition-all cursor-pointer bg-slate-50 border border-slate-100 text-center gap-3",
                                                selectedAsset.includes(asset.symbol.replace('.IS', ''))
                                                    ? "bg-[#00008B] border-[#00008B] text-white shadow-[0_15px_40px_-10px_rgba(0,0,139,0.3)] scale-[1.03]"
                                                    : "hover:bg-slate-100/80 hover:-translate-y-1 text-[#00008B]"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-10 h-10 rounded-lg flex items-center justify-center text-[12px] font-black shadow-inner",
                                                selectedAsset.includes(asset.symbol.replace('.IS', '')) ? "bg-white/20 text-white" : "bg-[#00008B]/5 text-[#00008B]"
                                            )}>
                                                {asset.symbol.substring(0, 2)}
                                            </div>
                                            <div className="hover:scale-105 transition-transform duration-300">
                                                <p className="text-[16px] font-black tracking-tighter leading-tight">{asset.symbol}</p>
                                                <p className={cn(
                                                    "text-[10px] font-bold uppercase tracking-[0.2em] mt-0.5 opacity-50",
                                                    selectedAsset.includes(asset.symbol.replace('.IS', '')) ? "text-white" : "text-[#00008B]"
                                                )}>{asset.type === 'STOCK' ? 'Hisse' : 'Fon'}</p>
                                            </div>
                                            <div className="mt-1 flex gap-3 items-center justify-center">
                                                <p className={cn(
                                                    "text-xs font-black px-2 py-0.5 rounded",
                                                    change >= 0 ? "text-emerald-700 bg-emerald-500/20" : "text-rose-700 bg-rose-500/20",
                                                    selectedAsset.includes(asset.symbol.replace('.IS', '')) && (change >= 0 ? "text-emerald-400" : "text-rose-400")
                                                )}>
                                                    {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div
                                onClick={() => { setSelectedAsset("FOREKS:XU100"); setIsTefas(false); }}
                                className={cn(
                                    "flex flex-col items-center justify-center p-3 rounded-xl transition-all cursor-pointer mt-4 bg-slate-50 text-[#00008B] border border-slate-100 shadow-sm",
                                    selectedAsset === "FOREKS:XU100" ? "ring-2 ring-[#00008B] shadow-md" : "hover:bg-slate-100"
                                )}
                            >
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">BIST 100 Endeksi</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
          </div>
        </div>
    );
}
