"use client";

import { useState, useEffect } from "react";
import { Sparkles, Bot, Clock, Loader2, Calendar, AlertTriangle, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";

export function FinAiYesterdayReportWidget() {
    const { user } = useUser();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const url = user ? `/api/finai-daily-report?userId=${user.id}` : '/api/finai-daily-report';
            const res = await fetch(url);
            const json = await res.json();
            if (json.success && json.data) {
                setReport(json.data);
            }
        } catch (e) {
            console.error("Failed to load FinAi report:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [user?.id]);

    const isPositive = report?.dayChange?.isPositive ?? true;

    return (
        <div className="w-full bg-gradient-to-br from-[#00008B] via-[#05059e] to-[#0b0b6b] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between border border-[#00008B]">
            {/* Background Glow Effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-black tracking-tight text-white">FinAi Günlük Rapor</h3>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${report?.moodBadgeColor || 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                    {report?.moodLabel || '🛡️ Dengeli Seyir'}
                                </span>
                            </div>
                            <p className="text-[10px] font-bold text-blue-200/80 uppercase tracking-widest">Akıllı Portföy & Haber Analisti</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-200/70 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                        <Clock className="w-3 h-3 text-amber-300" />
                        <span>{report?.generatedAt || 'Canlı'}</span>
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-7 h-7 text-amber-300 animate-spin" />
                        <span className="text-xs font-bold text-blue-100">FinAi Portföy ve Takvim Analizini Hazırlıyor...</span>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* 1. BÖLÜM: DÜNDEN BUGÜNE DEĞİŞİM & SÜRÜCÜLER */}
                        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                                    <Bot className="w-3.5 h-3.5" /> 1. Portföy Değişimi & Sürücüler
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg border flex items-center gap-1 ${
                                        isPositive
                                            ? 'text-emerald-300 bg-emerald-500/20 border-emerald-400/30'
                                            : 'text-red-300 bg-red-500/20 border-red-400/30'
                                    }`}>
                                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        {isPositive ? '+' : ''}₺{Math.abs(report?.dayChange?.diffValue || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ({isPositive ? '+' : ''}%{report?.dayChange?.diffPercent?.toFixed(2) || '0.00'})
                                    </span>
                                </div>
                            </div>
                            
                            <p className="text-xs font-medium leading-relaxed text-blue-50/90 mb-3">
                                {report?.driversSummary}
                            </p>

                            {/* Ana Sürücü Varlıklar */}
                            {report?.topDrivers && report.topDrivers.length > 0 && (
                                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
                                    {report.topDrivers.map((d: any, idx: number) => (
                                        <div key={idx} className="bg-white/5 p-2 rounded-xl border border-white/10">
                                            <span className="text-[9px] font-black text-blue-200 uppercase tracking-wider block">
                                                {d.symbol}
                                            </span>
                                            <span className={`text-xs font-bold ${d.isPositive ? 'text-emerald-300' : 'text-red-300'}`}>
                                                {d.isPositive ? '+' : ''}₺{Math.abs(d.contributionVal).toFixed(0)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 2. BÖLÜM: HABER & PİYASA ETKİSİ */}
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5">
                            <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest block mb-1">
                                📰 2. Açıklanan Haberlerin Portföye Etkisi
                            </span>
                            <p className="text-xs font-medium leading-relaxed text-white/90">
                                {report?.newsImpactSummary}
                            </p>
                        </div>

                        {/* 3. BÖLÜM: ÖNÜMÜZDEKİ GÜNLER RİSK & FIRSAT KATALOĞU (YALNIZCA İLİŞKİLİ HABERLER) */}
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5">
                            <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" /> 3. Önümüzdeki Günler Takvimi (Sadece İlgili Varlıklar)
                            </span>

                            {report?.hasRelevantUpcomingEvents ? (
                                <div className="space-y-2">
                                    {report.upcomingEvents.map((ev: any, idx: number) => (
                                        <div key={idx} className="bg-white/10 p-2.5 rounded-xl border border-white/10 flex items-start gap-2.5">
                                            <div className="flex flex-col items-center justify-center bg-white/10 px-2 py-1 rounded-lg text-center min-w-[50px]">
                                                <span className="text-[9px] font-black text-amber-300">{ev.dateFormatted}</span>
                                                <span className="text-[10px] font-bold text-white">{ev.time}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <span className="text-xs">{ev.flag}</span>
                                                    <span className="text-xs font-bold text-white">{ev.event}</span>
                                                </div>
                                                <p className="text-[10px] text-blue-100/90 font-medium">
                                                    💡 {ev.impactNote}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-blue-200/80 font-medium">
                                    Önümüzdeki günlerde portföyünüzdeki varlıkları doğrudan etkileyecek kritik bir makro gelişme veya faiz kararı bulunmuyor.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
