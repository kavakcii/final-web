"use client";

import { useState } from "react";
import { Calendar, Globe2, AlertCircle, ChevronRight, Filter } from "lucide-react";

export interface CalendarEvent {
    id?: string;
    time: string;
    country: string;
    flag?: string;
    event: string;
    actual?: string;
    previous?: string;
    forecast?: string;
    impact: 'low' | 'medium' | 'high' | 'critical';
}

const INITIAL_MOCK_EVENTS: CalendarEvent[] = [
    { id: '1', time: "10:00", country: "TR", flag: "🇹🇷", event: "TCMB Piyasa Katılımcıları Anketi", actual: "%42.8", previous: "%44.1", forecast: "%43.0", impact: "high" },
    { id: '2', time: "15:30", country: "US", flag: "🇺🇸", event: "ABD Çekirdek TÜFE (Aylık)", actual: "%0.3", previous: "%0.3", forecast: "%0.2", impact: "critical" },
    { id: '3', time: "16:00", country: "US", flag: "🇺🇸", event: "İşsizlik Haklarından Yararlanma Başvuruları", actual: "215K", previous: "220K", forecast: "218K", impact: "medium" },
    { id: '4', time: "17:00", country: "EU", flag: "🇪🇺", event: "Tüketici Güven Endeksi", actual: "-14.2", previous: "-15.0", forecast: "-14.5", impact: "low" },
];

export function EconomicCalendarWidget() {
    const [filter, setFilter] = useState<'all' | 'TR' | 'US'>('all');

    const filteredEvents = INITIAL_MOCK_EVENTS.filter(e => {
        if (filter === 'all') return true;
        return e.country === filter;
    });

    const getImpactBadge = (impact: string) => {
        switch (impact) {
            case 'critical':
                return <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500/10 text-rose-600 border border-rose-200">Kritik</span>;
            case 'high':
                return <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/10 text-amber-600 border border-amber-200">Yüksek</span>;
            case 'medium':
                return <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-500/10 text-blue-600 border border-blue-200">Orta</span>;
            default:
                return <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-100 text-slate-500 border border-slate-200">Düşük</span>;
        }
    };

    return (
        <div className="w-full bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-all">
            <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-[#00008B]/5 border border-[#00008B]/10 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-[#00008B]" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-[#00008B] tracking-tight">Ekonomik Takvim</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kritik Makroekonomik Veriler</p>
                        </div>
                    </div>

                    {/* Filter buttons */}
                    <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1 text-[10px] font-extrabold rounded-xl transition-all ${filter === 'all' ? 'bg-[#00008B] text-white shadow-sm' : 'text-slate-500 hover:text-[#00008B]'}`}
                        >
                            Tümü
                        </button>
                        <button
                            onClick={() => setFilter('TR')}
                            className={`px-2.5 py-1 text-[10px] font-extrabold rounded-xl transition-all ${filter === 'TR' ? 'bg-[#00008B] text-white shadow-sm' : 'text-slate-500 hover:text-[#00008B]'}`}
                        >
                            🇹🇷 TR
                        </button>
                        <button
                            onClick={() => setFilter('US')}
                            className={`px-2.5 py-1 text-[10px] font-extrabold rounded-xl transition-all ${filter === 'US' ? 'bg-[#00008B] text-white shadow-sm' : 'text-slate-500 hover:text-[#00008B]'}`}
                        >
                            🇺🇸 US
                        </button>
                    </div>
                </div>

                {/* Event List */}
                <div className="space-y-3">
                    {filteredEvents.map((item, idx) => (
                        <div
                            key={idx}
                            className="p-3.5 rounded-2xl border border-slate-100 hover:border-[#00008B]/20 bg-slate-50/50 hover:bg-white transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-black text-[#00008B] bg-white border border-slate-200 px-2.5 py-1 rounded-xl shadow-2xs">
                                    {item.time}
                                </span>
                                <span className="text-base">{item.flag}</span>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#00008B] transition-colors leading-tight">
                                        {item.event}
                                    </h4>
                                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                                        Beklenen: {item.forecast || '-'} | Önceki: {item.previous || '-'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                                <div className="text-right">
                                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Açıklanan</span>
                                    <span className="text-xs font-black text-[#00008B]">{item.actual || 'Bekleniyor'}</span>
                                </div>
                                {getImpactBadge(item.impact)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span className="flex items-center gap-1">
                    <Globe2 className="w-3 h-3 text-[#00008B]/40" /> Canlı Veri Akışı Hazır
                </span>
                <span className="text-[#00008B]/60 hover:text-[#00008B] cursor-pointer">Tüm Haftayı Gör →</span>
            </div>
        </div>
    );
}
