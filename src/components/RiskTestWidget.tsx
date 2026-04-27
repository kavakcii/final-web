import React, { useState } from "react";
import { Brain, ArrowRight, Target, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PortfolioRecommendationModal } from "./PortfolioRecommendationModal";

interface RiskTestWidgetProps {
  className?: string;
  hasCompletedTest?: boolean;
  userName?: string;
  userProfile?: string;
  userScore?: number;
  investmentAmount?: string;
  aiPortfolio?: any;
}

export function RiskTestWidget({ className, hasCompletedTest = false, userName, userProfile, userScore, investmentAmount, aiPortfolio }: RiskTestWidgetProps) {
  const displayName = userName || "Yatırımcı";
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getProfileData = (profile?: string) => {
    if (profile?.includes("Korumacı")) return { color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100", icon: ShieldCheck };
    if (profile?.includes("Cesur")) return { color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-100", icon: Zap };
    return { color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100", icon: Target };
  };

  if (!hasCompletedTest) {
    return (
      <div className={cn("w-full h-full flex flex-col bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm relative overflow-hidden group", className)}>
        {/* Üst Kısım - Haber widget'ı ile uyumlu başlık yapısı */}
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#00008B]/5 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-[#00008B]" />
                </div>
                <h3 className="text-[11px] font-black text-[#00008B] uppercase tracking-widest">FinAi Risk Testi</h3>
            </div>
        </div>
        
        {/* Orta Kısım */}
        <div className="text-center flex-1 flex flex-col justify-center py-4">
          <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight leading-tight">
            {displayName}, <span className="text-[#00008B]">Gerçek Potansiyelini</span> Keşfet!
          </h2>
          <p className="text-[11px] font-medium text-slate-500 leading-relaxed max-w-[90%] mx-auto">
            Sana özel en kârlı ve güvenli portföyü oluşturmamız için risk toleransını bilmemiz gerekiyor. 
            Sadece <span className="font-bold text-[#00008B]">2 dakikanı ayırarak</span> yapay zeka destekli testimizi tamamla; 
            hemen ardından sana özel stratejini sunalım.
          </p>
        </div>

        {/* Alt Kısım - Teste Başla Butonu */}
        <div className="mt-auto pt-2">
          <Link href="/dashboard/test" className="w-full relative flex items-center justify-center gap-2 px-6 py-3.5 bg-[#00008B] text-white rounded-xl text-xs font-bold tracking-[0.15em] uppercase shadow-lg shadow-[#00008B]/20 hover:shadow-[#00008B]/30 hover:-translate-y-0.5 transition-all duration-300 active:scale-95 group/btn overflow-hidden">
            <Target className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Teste Başla</span>
            <ArrowRight className="w-4 h-4 relative z-10 group-hover/btn:translate-x-1.5 transition-transform" />
            <div className="absolute inset-0 -translate-x-full group-hover/btn:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
          </Link>
        </div>
      </div>
    );
  }

  const pData = getProfileData(userProfile);
  const Icon = pData.icon;

  // Testi YAPTIYSA gösterilecek UI
  return (
    <div className={cn("w-full h-full bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col relative overflow-hidden group", className)}>
        
        {/* Başlık */}
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", pData.bg)}>
                    <Icon className={cn("w-4 h-4", pData.color)} />
                </div>
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Yatırımcı Profiliniz</h3>
            </div>
            <Link href="/dashboard/test" className="text-[10px] font-bold text-slate-400 hover:text-[#00008B] underline underline-offset-2 transition-colors">Testi Yenile</Link>
        </div>

        {/* Sonuç Merkezi */}
        <div className="flex-1 flex flex-col items-center justify-center py-6">
            <h2 className={cn("text-3xl font-black mb-3 tracking-tight", pData.color)}>
                {userProfile || "Ilımlı (Dengeli)"}
            </h2>
            <p className="text-[11px] font-medium text-slate-500 max-w-sm text-center leading-relaxed">
                Yapay zeka asistanınız, belirttiğiniz <strong className="text-slate-700">{investmentAmount || "0"} TL</strong> hedefine ve <strong className="text-slate-700">{userScore || 0}</strong> risk skorunuza en uygun portföy bileşenlerini sizin için arka planda optimize ediyor.
            </p>
        </div>

        {/* Veriler */}
        <div className="mt-auto grid grid-cols-2 gap-3 pt-2">
             <div className={cn("border bg-white p-4 rounded-2xl flex flex-col items-center justify-center", pData.border)}>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Risk Skoru</span>
                 <span className={cn("text-2xl font-black", pData.color)}>{userScore || 0}<span className="text-[10px] text-slate-400 ml-1">/ 27</span></span>
             </div>
             <div className={cn("border bg-white p-4 rounded-2xl flex flex-col items-center justify-center", pData.border)}>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Başlangıç</span>
                 <span className={cn("text-xl font-black tracking-tight", pData.color)}>{investmentAmount || "0"} <span className="text-[10px] text-slate-400 ml-0.5">TL</span></span>
             </div>
        </div>

        {/* AI Butonu */}
        <button 
            onClick={() => setIsModalOpen(true)}
            disabled={!aiPortfolio}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#00008B] to-blue-600 text-white rounded-xl text-xs font-bold tracking-[0.15em] uppercase shadow-lg shadow-[#00008B]/20 hover:-translate-y-0.5 transition-transform disabled:opacity-50 disabled:cursor-not-allowed group/ai"
        >
            <Brain className="w-4 h-4 group-hover/ai:scale-110 transition-transform" />
            Yapay Zeka Portföy Önerimi Gör
        </button>

        <PortfolioRecommendationModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            data={aiPortfolio}
        />
    </div>
  );
}
