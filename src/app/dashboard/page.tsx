"use client";

// Dashboard v1.2.1 - Cleaned Main Page Layout with Economic Calendar & yesterday report
import { AuthComponent } from "@/components/ui/sign-up";
import { TrendingUp, Activity, Newspaper, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/components/providers/UserProvider";

import { DashboardSummaryCards } from "@/components/DashboardSummaryCards";
import { EconomicCalendarWidget } from "@/components/EconomicCalendarWidget";
import { BalanceGrowthChartWidget } from "@/components/BalanceGrowthChartWidget";
import { FinAiYesterdayReportWidget } from "@/components/FinAiYesterdayReportWidget";
import Link from "next/link";

export default function DashboardPage() {
    const { user, email: userEmail, userName, isAuthenticated, isDataLoaded, globalNews } = useUser();
    const [news, setNews] = useState<any[]>([]);

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

                {/* Header Welcome Area */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                    <div>
                        <h1 className="text-4xl font-bold text-[#00008B] flex items-center gap-3 tracking-tight">
                            Hoşgeldiniz, {userName || userEmail?.split('@')[0]}
                            <motion.span animate={{ rotate: [0, 14, -8, 14, -4, 10, 0, 0] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}>👋</motion.span>
                        </h1>
                        <p className="text-[#00008B] mt-2 text-xs font-bold tracking-[0.3em] uppercase opacity-40">Borsa ve fon verilerin canlı senkronizasyonda.</p>
                    </div>
                </div>

                {/* Synchronized Summary Cards Row (Birebir Portföyüm Özeti) */}
                <div className="w-full">
                    <DashboardSummaryCards />
                </div>

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left & Middle Column (8 Cols) */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Varlık Gelişim Grafiği Widget */}
                        <BalanceGrowthChartWidget />

                        {/* Ekonomik Takvim Widget */}
                        <EconomicCalendarWidget />
                    </div>

                    {/* Right Column (4 Cols) */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* FinAI Dünün Özeti & Günlük Analiz Kutusu */}
                        <FinAiYesterdayReportWidget />

                        {/* Son Gündem Haber Özeti */}
                        <div className="w-full bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Newspaper className="w-4 h-4 text-[#00008B]" />
                                    <h3 className="text-[11px] font-black text-[#00008B] uppercase tracking-widest">Gündem</h3>
                                </div>
                                <Link href="/dashboard/news" className="text-[9px] font-black text-slate-300 hover:text-[#00008B] transition-colors uppercase tracking-widest">Tümünü Gör</Link>
                            </div>
                            <div className="grid grid-cols-1 gap-y-3">
                                {news && news.length > 0 ? news.slice(0, 4).map((item, idx) => (
                                    <Link key={idx} href={`/dashboard/news?url=${encodeURIComponent(item.link)}`} className="group border-b border-slate-50 pb-2 hover:border-[#00008B]/20 transition-all">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[8px] font-black text-[#00008B]/30 uppercase tracking-widest leading-none">{new Date(item.pubDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            <h4 className="text-[10px] font-bold text-slate-600 leading-tight group-hover:text-[#00008B] transition-colors line-clamp-2">{item.title}</h4>
                                        </div>
                                    </Link>
                                )) : (
                                    <p className="text-[10px] text-slate-300 py-4 text-center font-bold">Haberler yükleniyor...</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
