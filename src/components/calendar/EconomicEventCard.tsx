"use client";

import { CatalogCalendarEvent } from "@/lib/calendar-catalog";
import { calculateBackendDifferences } from "@/lib/finai-calendar-analysis-engine";
import { INDICATOR_PROFILES_DATABASE } from "@/lib/indicator-profiles";
import { Clock, ArrowRight, Activity, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import FollowIndicatorButton from "@/components/calendar/FollowIndicatorButton";

interface EconomicEventCardProps {
    item: CatalogCalendarEvent;
    statusInfo: { status: string; text: string; badgeClass: string };
    isRecentlyUpdated: boolean;
}

export default function EconomicEventCard({ item, statusInfo, isRecentlyUpdated }: EconomicEventCardProps) {
    const calc = calculateBackendDifferences(item);
    const targetId = encodeURIComponent(item.id || item.event);

    const profile = INDICATOR_PROFILES_DATABASE[item.event] || 
        INDICATOR_PROFILES_DATABASE[Object.keys(INDICATOR_PROFILES_DATABASE).find(k => item.event.includes(k)) || ""] || 
        INDICATOR_PROFILES_DATABASE["Default"];

    return (
        <div className={`p-4 rounded-3xl border transition-all duration-500 space-y-3 shadow-sm ${
            isRecentlyUpdated 
                ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400' 
                : 'bg-white border-slate-200 hover:border-slate-300'
        }`}>
            {/* Header: Time, Country, Impact Badge */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-[#00008B] flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-blue-600" /> {item.time}
                    </span>
                    <span className="text-sm">{item.flag || '🌐'}</span>
                    <span className="text-xs font-black text-slate-700">{item.country}</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-xl text-[10px] font-black border ${statusInfo.badgeClass}`}>
                    {statusInfo.text}
                </span>
            </div>

            {/* Event Title & Follow Button */}
            <div className="flex items-start justify-between gap-2">
                <div>
                    <h4 className="text-sm font-black text-[#00008B] leading-snug">
                        {item.event}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                        {profile.whyItMatters}
                    </p>
                </div>
                <FollowIndicatorButton indicatorName={item.event} compact />
            </div>

            {/* Metrics: Actual, Forecast, Previous */}
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Açıklanan</span>
                    <span className="font-black text-[#00008B] block mt-0.5">
                        {item.actual || 'Bekleniyor'}
                    </span>
                </div>
                <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Beklenti</span>
                    <span className="font-semibold text-slate-700 block mt-0.5">
                        {item.forecast || '-'}
                    </span>
                </div>
                <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Önceki</span>
                    <span className="font-semibold text-slate-500 block mt-0.5">
                        {item.previous || '-'}
                    </span>
                </div>
            </div>

            {/* Backend Difference Badge */}
            {calc.forecastDiffText && (
                <div className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-xl border border-blue-100 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> {calc.forecastDiffText}
                </div>
            )}

            {/* FinAi Intelligence CTA Link */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">
                    Ekonomik Yorum & Etki Zinciri
                </span>
                <Link
                    href={`/dashboard/economic-calendar/${targetId}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#00008B] font-black text-xs border border-blue-200 transition-all"
                >
                    FinAi Intelligence'ı incele <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                </Link>
            </div>
        </div>
    );
}
