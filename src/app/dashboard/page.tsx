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
import { PremiumCard } from "@/components/PremiumCard";
import { BalanceChart } from "@/components/BalanceChart";
import { GradientCard } from "@/components/ui/gradient-card";
import Link from "next/link";

export default function Dashboard() {
    const { email: userEmail, userName, isAuthenticated, myAssets, prices, stats, portfolioHistory, isDataLoaded } = useUser();
    const [selectedAsset, setSelectedAsset] = useState<string>("FOREKS:XU100");
    const [isTefas, setIsTefas] = useState(false);
    const [topNews, setTopNews] = useState<any>(null);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await fetch('/api/news');
                const data = await res.json();
                if (data.success && data.news && data.news.length > 0) {
                    setTopNews(data.news[0]);
                }
            } catch (error) {
                console.error("Dashboard news fetch error:", error);
            }
        };
        fetchNews();
    }, []);

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
            {/* Top Right Widget Area */}
            <div className="absolute top-8 right-10 z-50 hidden lg:block">
                {topNews && (
                    <GradientCard 
                        title={topNews.title} 
                        description={topNews.description} 
                        link={topNews.link} 
                        source={topNews.source}
                    />
                )}
            </div>

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

            {/* INTERACTIVE HEADER SECTION */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col lg:flex-row items-start gap-6 relative">
                    {/* LEFT: PREMIUM CARD + HOVER CHART */}
                    <div className="relative z-20 group">
                        <Link href="/dashboard/portfolio" className="relative z-30 shadow-[10px_0_30px_-10px_rgba(0,0,139,0.3)] rounded-[16px] block transition-transform hover:scale-[1.01] active:scale-[0.99]">
                            <PremiumCard 
                                userName={userName || ""} 
                                totalBalance={stats[0]?.value || "₺0,00"}
                            />
                        </Link>
                        
                        {/* Chart panel - slides out from behind the card on hover */}
                        <div className="absolute left-0 top-0 w-[420px] aspect-[1.586/1] bg-white border border-slate-100 rounded-[24px] shadow-2xl opacity-0 translate-x-0 z-10 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-x-[105%] transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] hidden lg:block overflow-hidden">
                            <BalanceChart 
                                totalBalance={stats[0]?.value || "₺0,00"} 
                                changePercent={stats[0]?.change || "%0"}
                                isPositive={stats[0]?.isPositive ?? true}
                                history={portfolioHistory}
                            />
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
    );
}
