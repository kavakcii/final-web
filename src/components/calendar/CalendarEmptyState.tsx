"use client";

import { Calendar as CalendarIcon, ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";

interface CalendarEmptyStateProps {
    selectedDateLabel?: string;
    onResetFilters: () => void;
}

export default function CalendarEmptyState({ selectedDateLabel, onResetFilters }: CalendarEmptyStateProps) {
    return (
        <div className="w-full bg-white border border-slate-200 rounded-3xl p-8 md:p-12 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-3xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-[#00008B]">
                <CalendarIcon className="w-7 h-7" />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-base sm:text-lg font-black text-[#00008B]">
                    Seçili Tarihte ve Ülkelerde Veri Bulunmuyor
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {selectedDateLabel ? `${selectedDateLabel} tarihi` : 'Seçtiğiniz filtre aralığında'} için takip edilen resmi bir ekonomik gösterge yayın takviminde yer almamaktadır.
                </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                    onClick={onResetFilters}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#00008B] text-white font-bold text-xs shadow-md hover:bg-[#0808a3] transition-all"
                >
                    <RotateCcw className="w-3.5 h-3.5" /> Tüm Filtreleri Sıfırla
                </button>
            </div>
        </div>
    );
}
