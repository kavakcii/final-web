"use client";

// Dashboard v1.1.5 - Optimized Build Sequence
import { AuthComponent } from "@/components/ui/sign-up";
import { TrendingUp, Activity, DollarSign, BarChart2, ArrowUpRight, ArrowDownRight, Wallet, Newspaper, Loader2, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/components/providers/UserProvider";
import { cn } from "@/lib/utils";

import TradingViewWidget from "@/components/TradingViewWidget";
import { TefasChart } from "@/components/TefasChart";
import { PortfolioService, Asset } from "@/lib/portfolio-service";
import { DashboardPortfolioWidget } from "@/components/DashboardPortfolioWidget";
import { MiniBalanceHistoryChart } from "@/components/MiniBalanceHistoryChart";
import { VerificationCard } from "@/components/ui/verification-card";
import { GradientCard } from "@/components/ui/gradient-card";
import { RiskTestWidget } from "@/components/RiskTestWidget";
import Link from "next/link";

export default function DashboardPage() {
    const { user, email: userEmail, userName, isAuthenticated, myAssets, prices, stats, portfolioHistory, isDataLoaded, globalNews } = useUser();
    const [selectedAsset, setSelectedAsset] = useState<string>("FOREKS:XU100");
    const [isTefas, setIsTefas] = useState(false);
    const [news, setNews] = useState<any[]>([]);

    const totalBalance = useMemo(() => stats?.[0]?.value || "₺0,00", [stats]);

    const maskedId = useMemo(() => {
        if (!user?.id) return "ID **** 0000";
        return `ID **** ${user.id.slice(-4).toUpperCase()}`;
    }, [user?.id]);

    useEffect(() => {
        const fetchNews = async () => {
            if (!isDataLoaded || !user) return;
            
            try {
                const res = await fetch(`/api/news?userId=${user.id}`);
                const data = await res.json();
                if (data.success) {
                    setNews(data.news);
                } else if (globalNews && globalNews.length > 0) {
                    setNews(globalNews);
                }
            } catch (error) {
                console.error("Dashboard news fetch error:", error);
                if (globalNews && globalNews.length > 0) setNews(globalNews);
            }
        };
        fetchNews();
    }, [isDataLoaded, user, globalNews]);

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

    if (isAuthenticated === false && isDataLoaded) {
        return <AuthComponent />;
    }

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-white text-[#00008B] w-full mx-auto relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-50/50 blur-[120px] pointer-events-none" />
            
            <div className="w-full max-w-[1600px] mx-auto px-6 py-8 md:px-10 lg:py-10 space-y-8 relative z-10 mb-20">
                <AnimatePresence>
                    {!isDataLoaded && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-white/60 backdrop-blur-md"
                        >
                            <div className="w-full max-w-md p-10 rounded-[2.5rem] bg-white border border-slate-100 text-[#00008B] shadow-2xl text-center">
                                <div className="w-24 h-24 mx-auto mb-8 relative">
                                    <Loader2 className="w-24 h-24 text-[#00008B] animate-spin opacity-20" />
                                    <TrendingUp className="w-10 h-10 text-[#00008B] absolute inset-0 m-auto animate-pulse" />
                                </div>
                                <h2 className="text-2xl font-black mb-2 tracking-tighter">FinAi Hazırlanıyor</h2>
                                <p className="text-sm font-bold text-slate-400 animate-pulse">{loadingMessages[loadingStep]}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                    <div>
                        <h1 className="text-4xl font-bold text-[#00008B] flex items-center gap-3 tracking-tight">
                            Hoşgeldiniz, {userName || userEmail?.split('@')[0]}
                            <motion.span animate={{ rotate: [0, 14, -8, 14, -4, 10, 0, 0] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}>👋</motion.span>
                        </h1>
                        <p className="text-[#00008B] mt-2 text-xs font-bold tracking-[0.3em] uppercase opacity-40">Borsa ve fon verilerin canlı senkronizasyonda.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/portfolio/correlation" className="flex items-center gap-2 px-6 py-3 bg-[#00008B] rounded-2xl text-white text-[11px] font-bold tracking-[0.15em] uppercase shadow-xl shadow-[#00008B]/20 active:scale-95">
                            <Activity className="w-4 h-4" />
                            Korelasyon Analizi
                        </Link>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row items-start gap-12">
                    <div className="flex flex-col gap-6">
                        <div className="relative group">
                            <Link href="/dashboard/portfolio" className="relative z-30 shadow-xl rounded-[16px] block transition-transform hover:scale-[1.01] w-56">
                                <VerificationCard 
                                    name={userName?.toUpperCase() || "FINAI USER"} 
                                    idNumber={maskedId}
                                    balance={totalBalance}
                                    label="FINAI PREMIUM"
                                    validThru="12/26"
                                />
                            </Link>
                            <div className="absolute left-0 top-0 w-56 h-36 bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl opacity-0 translate-x-0 z-10 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-x-[110%] transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] hidden lg:block overflow-hidden group/chart">
                                <MiniBalanceHistoryChart history={portfolioHistory} />
                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/20 via-transparent to-transparent pointer-events-none" />
                            </div>
                        </div>

                        {/* Yatırımcı Profil Testi Widget */}
                        <div className="w-full lg:w-[450px]">
                            <RiskTestWidget hasCompletedTest={false} userName={userName || user?.user_metadata?.full_name || userEmail?.split('@')[0]} />
                        </div>

                        <div className="w-full lg:w-[450px] bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Newspaper className="w-4 h-4 text-[#00008B]" />
                                    <h3 className="text-[11px] font-black text-[#00008B] uppercase tracking-widest">Gündem</h3>
                                </div>
                                <Link href="/dashboard/news" className="text-[9px] font-black text-slate-300 hover:text-[#00008B] transition-colors uppercase tracking-widest">Tümünü Gör</Link>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                                {news && news.length > 0 ? news.slice(0, 4).map((item, idx) => (
                                    <Link key={idx} href={`/dashboard/news?url=${encodeURIComponent(item.link)}`} className="group border-b border-slate-50 pb-2 hover:border-[#00008B]/20 transition-all">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[8px] font-black text-[#00008B]/30 uppercase tracking-widest leading-none">{new Date(item.pubDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            <h4 className="text-[10px] font-bold text-slate-600 leading-tight group-hover:text-[#00008B] transition-colors line-clamp-2">{item.title}</h4>
                                        </div>
                                    </Link>
                                )) : (
                                    <p className="text-[10px] text-slate-300 col-span-2 py-4 text-center font-bold">Haberler yükleniyor...</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full space-y-8">
                        <DashboardPortfolioWidget groupedAssets={groupedAssets} prices={prices} stats={stats} onAssetSelect={handleAssetSelect} />
                        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-[#00008B]/5 flex items-center justify-center text-[#00008B]"><BarChart2 className="w-6 h-6" /></div>
                                    <h2 className="text-xl font-black text-[#00008B] tracking-tight">{isTefas ? 'Fon Analizi' : 'Hisse Analizi'}: {selectedAsset?.split(':')[1] || 'XU100'}</h2>
                                </div>
                            </div>
                            <div className="h-[450px] w-full rounded-2xl overflow-hidden border border-slate-50">
                                {isTefas ? <TefasChart fundCode={selectedAsset || ""} /> : <TradingViewWidget symbol={selectedAsset || "FOREKS:XU100"} />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
