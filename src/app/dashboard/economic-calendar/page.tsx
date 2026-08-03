"use client";

import { EconomicCalendarWidget } from "@/components/EconomicCalendarWidget";
import { ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";

export default function EconomicCalendarPage() {
    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-white text-[#00008B] w-full mx-auto relative overflow-hidden">
            <div className="w-full max-w-[1600px] mx-auto px-6 py-8 md:px-10 lg:py-10 space-y-8 relative z-10 mb-20">
                {/* Top Navigation */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#00008B] font-bold text-xs transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
                    </Link>
                    <div className="flex items-center gap-2 text-xs font-black text-[#00008B]/60 uppercase tracking-widest">
                        <Calendar className="w-4 h-4" /> Detaylı Ekonomik Takvim Sayfası
                    </div>
                </div>

                {/* Main Content */}
                <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-[#00008B]">
                        Ekonomik Takvim & Makro Veriler
                    </h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                        Türkiye Saati (TSİ UTC+3) ile Anlık Açıklanan ve Beklenen Piyasa Haberleri
                    </p>

                    <div className="w-full">
                        <EconomicCalendarWidget isDetailedPage={true} />
                    </div>
                </div>
            </div>
        </div>
    );
}
