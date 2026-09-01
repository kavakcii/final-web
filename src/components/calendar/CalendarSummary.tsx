"use client";

import { CatalogCalendarEvent } from "@/lib/calendar-catalog";
import { Activity, CheckCircle2, Clock, Flame } from "lucide-react";

interface CalendarSummaryProps {
    events: CatalogCalendarEvent[];
    selectedCountriesCount: number;
}

export default function CalendarSummary({ events, selectedCountriesCount }: CalendarSummaryProps) {
    const totalCount = events.length;

    const highImpactCount = events.filter(
        e => e.impact === 'high' || e.impact === 'critical'
    ).length;

    const releasedCount = events.filter(
        e => e.actual && e.actual !== 'Bekleniyor' && e.actual !== '-'
    ).length;

    const pendingCount = totalCount - releasedCount;

    return (
        <div className="w-full bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#00008B] flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-[#00008B]" /> BUGÜN EKONOMİDE GÜNDEM ÖZETİ
                </h3>
                <span className="text-[10px] font-bold text-slate-400">
                    {selectedCountriesCount} Ülke Takip Ediliyor
                </span>
            </div>

            {totalCount === 0 ? (
                <p className="text-xs font-medium text-slate-500 py-1">
                    Bugün seçili ülkelerde takip edilen ekonomik veri bulunmuyor.
                </p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                            {totalCount}
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Toplam Veri</span>
                            <span className="text-xs font-black text-[#00008B] block">{totalCount} Ekonomik Veri</span>
                        </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-xs">
                            <Flame className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Yüksek Etkili</span>
                            <span className="text-xs font-black text-rose-700 block">{highImpactCount} Yüksek Etki</span>
                        </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Açıklanan</span>
                            <span className="text-xs font-black text-emerald-800 block">{releasedCount} Veri Açıklandı</span>
                        </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-xs">
                            <Clock className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Beklenen</span>
                            <span className="text-xs font-black text-amber-800 block">{pendingCount} Veri Bekliyor</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
