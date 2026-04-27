import React from "react";
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

  // Eğer test tamamlandıysa ve AI portföyü veritabanında varsa direkt raporu gösteriyoruz.
  if (hasCompletedTest && aiPortfolio) {
    return (
        <PortfolioRecommendationModal 
            data={aiPortfolio}
            userName={userName}
            investmentAmount={investmentAmount}
        />
    );
  }

  // Eğer test yapılmadıysa veya eski sistemse (aiPortfolio yoksa) testi çözmeye yönlendir:
  return (
    <div className={cn("w-full h-full flex flex-col bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm relative overflow-hidden group", className)}>
    {/* Üst Kısım */}
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
