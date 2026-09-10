"use client";

import { TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import TradingViewMarketOverview from "@/components/dashboard/TradingViewMarketOverview";

export function MarketOverviewWidget() {
    return (
        <div className="bg-white border border-slate-100 hover:border-slate-200/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-xs hover:shadow-sm transition-all duration-300 h-[395px] flex flex-col justify-between group overflow-hidden">
            {/* 1. Üst Başlık */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100/80 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
                            Piyasa Genel Görünümü
                        </h3>
                    </div>
                </div>

                <Link
                    href="/dashboard/market"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors group/link"
                >
                    <span>Tümü</span>
                    <ArrowRight className="w-3 h-3 transform group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
            </div>

            {/* 2. TradingView Symbol Overview Entegrasyonu */}
            <div className="flex-1 min-h-0 w-full pt-1 overflow-hidden">
                <TradingViewMarketOverview />
            </div>
        </div>
    );
}
