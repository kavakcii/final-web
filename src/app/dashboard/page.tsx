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
                    const items = data.news || data.data || [];
                    setNews(items);
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
        <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-white text-[#00008B] w-full mx-auto relative overflow-x-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-50/50 blur-[120px] pointer-events-none" />

            <div className="w-full max-w-[1600px] mx-auto px-2.5 py-3 sm:px-6 md:px-10 lg:py-6 flex flex-col justify-between gap-3 sm:gap-4 md:gap-6 relative z-10 flex-1 min-h-[calc(100vh-3.5rem)] pb-4 md:pb-8">
                <AnimatePresence>
                    {!isDataLoaded && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-white/60 backdrop-blur-md"
                        >
                            <div className="w-full max-w-md p-8 sm:p-10 rounded-[2.5rem] bg-white border border-slate-100 text-[#00008B] shadow-2xl text-center">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 sm:mb-8 relative">
                                    <Loader2 className="w-20 h-20 sm:w-24 sm:h-24 text-[#00008B] animate-spin opacity-20" />
                                    <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-[#00008B] absolute inset-0 m-auto animate-pulse" />
                                </div>
                                <h2 className="text-xl sm:text-2xl font-black mb-2 tracking-tighter">FinAi Hazırlanıyor</h2>
                                <p className="text-xs sm:text-sm font-bold text-slate-400 animate-pulse">{loadingMessages[loadingStep]}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header Welcome Area */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-1 md:gap-4 relative z-10">
                    <div>
                        <h1 className="text-lg sm:text-2xl md:text-4xl font-bold text-[#00008B] flex items-center gap-1.5 sm:gap-3 tracking-tight">
                            Hoşgeldiniz, {userName || userEmail?.split('@')[0]}
                            <motion.span animate={{ rotate: [0, 14, -8, 14, -4, 10, 0, 0] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}>👋</motion.span>
                        </h1>
                        <p className="text-[#00008B] mt-0.5 text-[8px] sm:text-xs font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase opacity-40">Borsa ve fon verilerin canlı senkronizasyonda.</p>
                    </div>
                </div>

                {/* 1. KATMAN: %60 Varlık Kartları (Alt Alta) / %40 Gündem Haberleri */}
                <div className="grid grid-cols-12 gap-2.5 sm:gap-4 md:gap-6 items-stretch w-full flex-1">
                    {/* %60 Sol Bölüm (Toplam Varlık ve Net Kâr/Zarar) */}
                    <div className="col-span-12 md:col-span-7 flex flex-col min-w-0">
                        <DashboardSummaryCards layout="stacked" />
                    </div>

                    {/* %40 Sağ Bölüm (Gündem Son Haberler) */}
                    <div className="col-span-12 md:col-span-5 flex flex-col min-w-0">
                        <div className="w-full h-full bg-white border border-slate-100 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-sm flex flex-col justify-between overflow-hidden min-h-[230px] sm:min-h-[270px]">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <Newspaper className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00008B]" />
                                        <h3 className="text-[9px] sm:text-[11px] font-black text-[#00008B] uppercase tracking-widest">Gündem</h3>
                                    </div>
                                    <Link href="/dashboard/news" className="text-[8px] sm:text-[9px] font-black text-slate-300 hover:text-[#00008B] transition-colors uppercase tracking-widest">Tümü</Link>
                                </div>
                                <div className="grid grid-cols-1 gap-y-2 overflow-y-auto max-h-[185px] sm:max-h-[220px] scrollbar-none pr-0.5">
                                    {news && news.length > 0 ? news.slice(0, 4).map((item, idx) => (
                                        <Link key={idx} href={`/dashboard/news?url=${encodeURIComponent(item.link)}`} className="group border-b border-slate-50 pb-1.5 hover:border-[#00008B]/20 transition-all">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[7px] sm:text-[8px] font-black text-[#00008B]/30 uppercase tracking-widest leading-none">{new Date(item.pubDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                <h4 className="text-[9px] sm:text-[10px] font-bold text-slate-600 leading-snug group-hover:text-[#00008B] transition-colors line-clamp-2">{item.title}</h4>
                                            </div>
                                        </Link>
                                    )) : (
                                        <p className="text-[9px] text-slate-300 py-3 text-center font-bold">Haberler yükleniyor...</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. KATMAN: %100 Satır içinde %60 Varlık Gelişim Grafiği / %40 FinAi Raporu */}
                <div className="grid grid-cols-12 gap-2.5 sm:gap-4 md:gap-6 items-stretch w-full flex-1">
                    {/* %60 Sol Bölüm (Varlık Gelişim Çizgi Grafiği) */}
                    <div className="col-span-12 md:col-span-7 flex flex-col min-w-0">
                        <BalanceGrowthChartWidget />
                    </div>

                    {/* %40 Sağ Bölüm (FinAi Raporu) */}
                    <div className="col-span-12 md:col-span-5 flex flex-col min-w-0">
                        <FinAiYesterdayReportWidget />
                    </div>
                </div>

                {/* 3. KATMAN: %100 Ekonomik Takvim */}
                <div className="w-full min-w-0 flex-1">
                    <EconomicCalendarWidget />
                </div>
            </div>
        </div>
    );
}
