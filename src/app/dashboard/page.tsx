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
import { GundemMarketAgendaWidget } from "@/components/GundemMarketAgendaWidget";
import { FinancialTicker } from "@/components/FinancialTicker";
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
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-1 md:gap-4 relative z-10 mb-1">
                    <div>
                        <h1 className="text-lg sm:text-2xl md:text-4xl font-bold text-[#00008B] flex items-center gap-1.5 sm:gap-3 tracking-tight">
                            Hoşgeldiniz, {userName || userEmail?.split('@')[0]}
                            <motion.span animate={{ rotate: [0, 14, -8, 14, -4, 10, 0, 0] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}>👋</motion.span>
                        </h1>
                        <p className="text-[#00008B] mt-0.5 text-[8px] sm:text-xs font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase opacity-40">Borsa ve fon verilerin canlı senkronizasyonda.</p>
                    </div>
                </div>

                {/* DESKTOP LAYOUT (≥1024px) */}
                <div className="hidden lg:flex flex-col gap-6 w-full relative z-10">
                    {/* 1. ÜST BÖLÜM: TOPLAM VARLIK & KÂR/ZARAR (2 Yan Yana Kart) */}
                    <div className="w-full">
                        <DashboardSummaryCards layout="grid" />
                    </div>

                    {/* 2. İKİNCİ BÖLÜM: VARLIK GELİŞİMİ (%60) & FİNAİ RAPORU (%40) */}
                    <div className="grid grid-cols-12 gap-6 items-stretch w-full">
                        <div className="col-span-7 flex flex-col min-w-0">
                            <BalanceGrowthChartWidget />
                        </div>
                        <div className="col-span-5 flex flex-col min-w-0">
                            <FinAiYesterdayReportWidget />
                        </div>
                    </div>

                    {/* 3. ÜÇÜNCÜ BÖLÜM: PİYASA GÜNDEMİ & EKONOMİK TAKVİM (YAN YANA %50-%50) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch w-full">
                        <div className="flex flex-col min-w-0">
                            <GundemMarketAgendaWidget news={news} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <EconomicCalendarWidget />
                        </div>
                    </div>
                </div>

                {/* TABLET & MOBILE LAYOUT (<1024px) */}
                <div className="flex lg:hidden flex-col gap-3.5 sm:gap-4 w-full relative z-10">
                    {/* 1. TOPLAM VARLIK & KÂR/ZARAR */}
                    <div className="w-full">
                        <DashboardSummaryCards layout="stacked" />
                    </div>

                    {/* 2. MEVCUT PİYASA ÖZETİ */}
                    <div className="w-full rounded-2xl overflow-hidden border border-slate-100 shadow-2xs">
                        <FinancialTicker />
                    </div>

                    {/* 3. GÜNDEM */}
                    <div className="w-full">
                        <GundemMarketAgendaWidget news={news} />
                    </div>

                    {/* 4. VARLIK GELİŞİMİ */}
                    <div className="w-full">
                        <BalanceGrowthChartWidget />
                    </div>

                    {/* 5. FİNAİ RAPORU */}
                    <div className="w-full">
                        <FinAiYesterdayReportWidget />
                    </div>

                    {/* 6. EKONOMİK TAKVİM */}
                    <div className="w-full">
                        <EconomicCalendarWidget />
                    </div>
                </div>
            </div>
        </div>
    );
}
