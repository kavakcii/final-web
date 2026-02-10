"use client";

import React from "react";
import { Check, X, ArrowRight, Brain, Zap, ShieldCheck, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function CleanPricing() {
    return (
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
            {/* Plan 1: Başlangıç (Free) */}
            <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4">
                    <h3 className="text-xl font-bold text-slate-900">Başlangıç</h3>
                    <p className="text-sm text-slate-500 mt-2">Finans dünyasına ilk adımınızı atın.</p>
                </div>
                <div className="mb-6">
                    <span className="text-4xl font-bold text-slate-900">Ücretsiz</span>
                </div>
                <button className="w-full py-2 px-4 rounded-full border-2 border-slate-900 text-slate-900 font-medium hover:bg-slate-50 transition-colors mb-8">
                    Hemen Başla
                </button>

                <div className="space-y-4 flex-1">
                    <FeatureItem icon={<Activity className="w-5 h-5 text-slate-400" />} text="5 Adet Varlık Takibi" />
                    <FeatureItem icon={<Zap className="w-5 h-5 text-slate-400" />} text="15 Dk Gecikmeli Veri" />
                    <FeatureItem icon={<Brain className="w-5 h-5 text-slate-300" />} text="Temel Piyasa Özeti" disabled />
                    <FeatureItem icon={<ShieldCheck className="w-5 h-5 text-slate-300" />} text="Risk Raporu Yok" disabled />
                </div>
            </div>

            {/* Plan 2: Standart */}
            <div className="flex flex-col h-full bg-white rounded-2xl border border-blue-100 p-6 shadow-lg shadow-blue-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                    POPÜLER
                </div>
                <div className="mb-4">
                    <h3 className="text-xl font-bold text-slate-900">Standart</h3>
                    <p className="text-sm text-slate-500 mt-2">Aktif yatırımcılar için ideal araçlar.</p>
                </div>
                <div className="mb-6">
                    <span className="text-4xl font-bold text-slate-900">₺100</span>
                    <span className="text-slate-500">/ay</span>
                </div>
                <button className="w-full py-2 px-4 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors mb-8 shadow-lg shadow-blue-600/20">
                    Satın Al
                </button>

                <div className="space-y-4 flex-1">
                    <FeatureItem icon={<Activity className="w-5 h-5 text-blue-500" />} text="Sınırsız Varlık Takibi" />
                    <FeatureItem icon={<Zap className="w-5 h-5 text-blue-500" />} text="Canlı Borsa Verisi" />
                    <FeatureItem icon={<Brain className="w-5 h-5 text-blue-500" />} text="Günlük AI Analizi" />
                    <FeatureItem icon={<ShieldCheck className="w-5 h-5 text-slate-300" />} text="Risk Raporu Yok" disabled />
                </div>
            </div>

            {/* Plan 3: Premium */}
            <div className="flex flex-col h-full bg-[#0a192f] rounded-2xl border border-blue-900 p-6 shadow-2xl relative text-white">
                <div className="mb-4">
                    <h3 className="text-xl font-bold text-white">Premium</h3>
                    <p className="text-sm text-slate-400 mt-2">Profesyoneller için tam kapsamlı set.</p>
                </div>
                <div className="mb-6">
                    <span className="text-4xl font-bold text-white">₺250</span>
                    <span className="text-slate-400">/ay</span>
                </div>
                <button className="w-full py-2 px-4 rounded-full bg-white text-[#0a192f] font-bold hover:bg-slate-100 transition-colors mb-8 shadow-lg shadow-white/10">
                    Premium'a Geç
                </button>

                <div className="space-y-4 flex-1">
                    <FeatureItem icon={<Activity className="w-5 h-5 text-blue-400" />} text="Sınırsız Varlık Takibi" darkMode />
                    <FeatureItem icon={<Zap className="w-5 h-5 text-blue-400" />} text="Anlık Canlı Veri" darkMode />
                    <FeatureItem icon={<Brain className="w-5 h-5 text-purple-400" />} text="Gelişmiş AI Asistanı" darkMode />
                    <FeatureItem icon={<ShieldCheck className="w-5 h-5 text-green-400" />} text="Detaylı Risk & Sentiment Raporu" darkMode />
                </div>
            </div>
        </div>
    );
}

function FeatureItem({ icon, text, disabled = false, darkMode = false }: { icon: React.ReactNode, text: string, disabled?: boolean, darkMode?: boolean }) {
    return (
        <div className={cn("flex items-center gap-3 py-2 border-b border-dashed",
            darkMode ? "border-slate-700/50" : "border-slate-100",
            disabled && "opacity-50"
        )}>
            <div className="shrink-0">{icon}</div>
            <span className={cn("text-sm",
                darkMode ? "text-slate-300" : "text-slate-600",
                disabled && "line-through"
            )}>{text}</span>
        </div>
    )
}
