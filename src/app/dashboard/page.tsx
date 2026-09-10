"use client";

// Dashboard v1.3.1 - Refined Top Section Faithful to Design Reference
import { AuthComponent } from "@/components/ui/sign-up";
import { TrendingUp, Activity, Newspaper, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/components/providers/UserProvider";

import { DashboardSummaryCards } from "@/components/DashboardSummaryCards";
import { TopAssetDistributionCard } from "@/components/dashboard/TopAssetDistributionCard";
import { FinAiYesterdayReportWidget } from "@/components/FinAiYesterdayReportWidget";
import { MarketOverviewWidget } from "@/components/dashboard/MarketOverviewWidget";
import { DailyAgendaWidget } from "@/components/dashboard/DailyAgendaWidget";
import { LatestNewsWidget } from "@/components/dashboard/LatestNewsWidget";
import { FeaturedNewsWidget } from "@/components/dashboard/FeaturedNewsWidget";
import { FinancialTicker } from "@/components/FinancialTicker";
import Link from "next/link";

export default function DashboardPage() {
    const { user, email: userEmail, userName, isAuthenticated, isDataLoaded, globalNews } = useUser();
    const [news, setNews] = useState<any[]>([]);

    useEffect(() => {
        if (globalNews && globalNews.length > 0 && news.length === 0) {
            setNews(globalNews);
        }
    }, [globalNews, news.length]);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const url = user?.id ? `/api/news?userId=${user.id}` : `/api/news`;
                const res = await fetch(url);
                const data = await res.json();
                if (data.success) {
                    const items = data.news || data.data || [];
                    if (items.length > 0) {
                        setNews(items);
                    }
                } else if (globalNews && globalNews.length > 0) {
                    setNews(globalNews);
                }
            } catch (error) {
                console.error("Dashboard news fetch error:", error);
                if (globalNews && globalNews.length > 0) setNews(globalNews);
            }
        };
        fetchNews();
    }, [user?.id, globalNews]);

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

            <div className="w-full max-w-[1600px] mx-auto px-2.5 py-3 sm:px-6 md:px-10 lg:py-6 flex flex-col justify-between gap-4 sm:gap-6 relative z-10 flex-1 min-h-[calc(100vh-3.5rem)] pb-6 md:pb-10">
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

                {/* Header Welcome Area (Referans Görsel Hiyerarşisi) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 relative z-10 mb-1">
                    <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                            Hoş Geldiniz, {userName || userEmail?.split('@')[0]}
                            <motion.span animate={{ rotate: [0, 14, -8, 14, -4, 10, 0, 0] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}>👋</motion.span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
                            Piyasaları, verileri ve gelişmeleri tek bir yerden takip edin.
                        </p>
                    </div>

                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium self-end sm:self-center">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Son veri güncellemesi: {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>

                {/* DESKTOP LAYOUT (≥1024px) */}
                <div className="hidden lg:flex flex-col gap-6 w-full relative z-10">
                    {/* 1. ÜST BÖLÜM: TOPLAM VARLIK (%50), VARLIK DAĞILIMI (%20), FİNANSAL RAPOR (%30) */}
                    <div className="grid grid-cols-1 lg:grid-cols-[5fr_2fr_3fr] gap-4 xl:gap-5 items-stretch w-full">
                        <div className="flex flex-col min-w-0">
                            <DashboardSummaryCards />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <TopAssetDistributionCard />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <FinAiYesterdayReportWidget />
                        </div>
                    </div>

                    {/* 2. İKİNCİ BÖLÜM: PİYASA GENEL GÖRÜNÜMÜ (%58) & GÜNLÜK AJANDA (%42) */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1.38fr_1fr] gap-4 xl:gap-5 items-stretch w-full">
                        <div className="flex flex-col min-w-0">
                            <MarketOverviewWidget />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <DailyAgendaWidget />
                        </div>
                    </div>

                    {/* 3. ÜÇÜNCÜ BÖLÜM: SON HABERLER (~%70) & ÖNE ÇIKANLAR (~%30) */}
                    <div className="grid grid-cols-1 lg:grid-cols-[2.4fr_1fr] gap-4 xl:gap-5 items-stretch w-full">
                        <div className="flex flex-col min-w-0">
                            <LatestNewsWidget news={news} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <FeaturedNewsWidget news={news} />
                        </div>
                    </div>
                </div>

                {/* TABLET & MOBILE LAYOUT (<1024px) */}
                <div className="flex lg:hidden flex-col gap-3.5 sm:gap-4 w-full relative z-10">
                    {/* 1. TOPLAM VARLIK */}
                    <div className="w-full">
                        <DashboardSummaryCards layout="stacked" />
                    </div>

                    {/* 2. VARLIK DAĞILIMI */}
                    <div className="w-full">
                        <TopAssetDistributionCard />
                    </div>

                    {/* 3. FİNANSAL RAPOR */}
                    <div className="w-full">
                        <FinAiYesterdayReportWidget />
                    </div>

                    {/* 4. PİYASA GENEL GÖRÜNÜMÜ */}
                    <div className="w-full">
                        <MarketOverviewWidget />
                    </div>

                    {/* 5. GÜNLÜK AJANDA */}
                    <div className="w-full">
                        <DailyAgendaWidget />
                    </div>

                    {/* 6. MEVCUT PİYASA ÖZETİ */}
                    <div className="w-full rounded-2xl overflow-hidden border border-slate-100 shadow-2xs">
                        <FinancialTicker />
                    </div>

                    {/* 7. SON HABERLER */}
                    <div className="w-full">
                        <LatestNewsWidget news={news} />
                    </div>

                    {/* 8. ÖNE ÇIKANLAR */}
                    <div className="w-full">
                        <FeaturedNewsWidget news={news} />
                    </div>
                </div>
            </div>
        </div>
    );
}
