"use client";

import React, { useMemo } from "react";
import { Brain, TrendingUp, Sparkles, LineChart, Info } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";

interface Asset {
  asset: string;
  percentage: number;
  color: string;
  description: string;
}

interface PortfolioData {
  profileName: string;
  aiAnalysis: string;
  expectedAnnualReturn?: number;
  portfolio: Asset[];
  advantages?: string[];
}

interface RecommendationCardProps {
  data?: PortfolioData;
  userName?: string;
  investmentAmount?: string;
}

export function PortfolioRecommendationModal({ data, userName, investmentAmount }: RecommendationCardProps) {
  const displayName = userName?.split(' ')[0] || "Yatırımcı";
  
  const cleanAmount = investmentAmount ? investmentAmount.replace(/[^0-9]/g, '') : "0";
  const monthlyInvestmentAmount = parseFloat(cleanAmount) || 8000; 

  const simulations = useMemo(() => {
    if (!data || !data.expectedAnnualReturn) return null;
    
    const r = data.expectedAnnualReturn / 100; 
    const monthlyRate = r / 12; 

    const calcFV = (months: number) => {
        return monthlyInvestmentAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    };

    const oneMonth = monthlyInvestmentAmount * (1 + monthlyRate);
    const oneYear = calcFV(12);
    const threeYears = calcFV(36);
    const fiveYears = calcFV(60);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val);
    };

    return [
        { label: "1 Aylık", value: formatCurrency(oneMonth), growth: `+%${(monthlyRate*100).toFixed(1)}` },
        { label: "1 Yıllık", value: formatCurrency(oneYear), growth: `+%${(data.expectedAnnualReturn).toFixed(0)}` },
        { label: "3 Yıllık", value: formatCurrency(threeYears), growth: `+%${((Math.pow((1+r),3)-1)*100).toFixed(0)}` },
        { label: "5 Yıllık", value: formatCurrency(fiveYears), growth: `+%${((Math.pow((1+r),5)-1)*100).toFixed(0)}` }
    ];
  }, [data, monthlyInvestmentAmount]);

  const CustomTooltip = ({ active, payload, coordinate, viewBox }: any) => {
    if (active && payload && payload.length && coordinate) {
      const pData = payload[0].payload as Asset;
      const allocatedAmount = (monthlyInvestmentAmount * (pData.percentage / 100)).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
      
      const cx = viewBox?.width ? viewBox.width / 2 : 150;
      const cy = viewBox?.height ? viewBox.height / 2 : 110;
      
      const dx = coordinate.x - cx;
      const dy = coordinate.y - cy;
      const angle = Math.atan2(dy, dx);
      
      // Calculate a shift to push the tooltip box to the outer edges
      const pushDistance = 60;
      const shiftX = Math.cos(angle) * pushDistance;
      const shiftY = Math.sin(angle) * pushDistance;

      return (
        <div 
          className="bg-white/95 backdrop-blur-md p-2.5 border border-slate-100 rounded-xl shadow-2xl min-w-[140px] pointer-events-none transition-transform duration-100"
          style={{ transform: `translate(${shiftX}px, ${shiftY}px)` }}
        >
          <p className="font-black text-slate-800 text-[11px] mb-1.5 leading-tight">{pData.asset}</p>
          <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-400">Oran:</span>
              <span className="text-[11px] font-black" style={{ color: pData.color }}>%{pData.percentage}</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Aktarım:</span>
              <span className="text-[11px] font-black text-[#00008B]">{allocatedAmount}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!data) return null;

  return (
    <div className="w-full bg-white border border-slate-100 rounded-[20px] shadow-sm overflow-hidden flex flex-col mt-4">
        {/* Header - Küçültüldü */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00008B] to-blue-600 flex items-center justify-center shadow-md shadow-[#00008B]/20">
                    <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 className="text-sm md:text-base font-black text-[#00008B] tracking-tight">
                        {displayName}, Özel Portföyün
                    </h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        FinAi • {data.profileName}
                    </p>
                </div>
            </div>
            <Link href="/dashboard/test" className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[9px] font-bold tracking-widest uppercase transition-colors">
                Yenile
            </Link>
        </div>

        {/* Body Layout (2 Columns grid) - Boşluklar Yarıya İndirildi */}
        <div className="flex-1 p-4 md:p-5 bg-white h-full">
            <div className="grid lg:grid-cols-2 gap-5 h-full">
                
                {/* SOL SÜTUN */}
                <div className="flex flex-col gap-5 h-full">
                    {/* AI Analiz Kutusu */}
                    <div className="bg-[#00008B]/[0.02] border border-[#00008B]/10 rounded-2xl p-4 relative">
                        <div className="absolute -top-2.5 -left-2.5 w-6 h-6 rounded-full bg-[#00008B] flex items-center justify-center border-[3px] border-white shadow-md">
                            <Brain className="w-3 h-3 text-white" />
                        </div>
                        <h3 className="text-[9px] font-black text-[#00008B]/50 uppercase tracking-widest mb-2">Yapay Zeka Analizi</h3>
                        <p className="text-[11px] font-medium text-slate-700 leading-relaxed italic">
                            "{data.aiAnalysis}"
                        </p>
                    </div>

                    {/* Dağılım Listesi */}
                    <div className="flex-1 flex flex-col">
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <TrendingUp className="w-3 h-3" /> Dağılım ve Kişisel Uyum
                        </h3>
                        <div className="flex flex-col gap-2 flex-1 justify-between">
                            {data.portfolio.map((item, idx) => {
                                const allocatedAmount = (monthlyInvestmentAmount * (item.percentage / 100)).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
                                
                                return (
                                <div key={idx} className="flex flex-col p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-1.5 h-8 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: item.color }} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="text-xs font-black text-slate-800 pr-2">{item.asset}</span>
                                                <span className="text-sm font-black" style={{ color: item.color }}>%{item.percentage}</span>
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-400">Aylık: <span className="text-[#00008B]">{allocatedAmount}</span></div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-lg p-2 border border-[#00008B]/5 flex items-start gap-1.5">
                                        <Info className="w-3 h-3 text-[#00008B]/60 shrink-0 mt-0.5" />
                                        <p className="text-[9px] text-slate-600 font-medium leading-tight">
                                            <span className="font-bold text-[#00008B]">Neden Önerdik:</span> {item.description}
                                        </p>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* SAĞ SÜTUN */}
                <div className="flex flex-col gap-5 h-full">
                    
                    {/* Pasta Grafik - Yükseklik Yarıya İndi */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center h-[220px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.portfolio}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="percentage"
                                    stroke="none"
                                    cornerRadius={4}
                                >
                                    {data.portfolio.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="text-xl font-black text-[#00008B]">%100</div>
                            <span className="text-[8px] font-bold text-slate-400 tracking-widest uppercase">Toplam</span>
                        </div>
                    </div>

                    {/* Potansiyel (Simülasyon) Modülü */}
                    {simulations && (
                    <div className="bg-gradient-to-br from-[#00008B] to-blue-700 rounded-2xl p-4 shadow-lg shadow-[#00008B]/20 text-white relative overflow-hidden">
                        <div className="absolute -right-5 -top-5 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-[9px] font-black text-blue-200 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                        <LineChart className="w-3 h-3" /> Büyüme Modeli
                                    </h3>
                                    <p className="text-[9px] text-blue-100/70 font-medium">Her ay <span className="font-bold text-white">{monthlyInvestmentAmount.toLocaleString('tr-TR')} ₺</span> ile (Bileşik):</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                                {simulations.map((sim, idx) => (
                                    <div key={idx} className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[8px] font-bold text-blue-200 uppercase tracking-widest">{sim.label}</span>
                                            <span className="text-[8px] font-black text-emerald-300 bg-emerald-400/20 px-1.5 py-0.5 rounded text-center">{sim.growth}</span>
                                        </div>
                                        <div className="text-sm font-black tracking-tight">{sim.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    )}

                    {/* Dağılımın Stratejik Avantajları */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                        <h3 className="text-[9px] font-black text-slate-800 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-emerald-500" /> Dağılımın Avantajları
                        </h3>
                        <ul className="text-[10px] text-slate-600 font-medium space-y-1.5 pl-1">
                            {data.advantages && data.advantages.length > 0 ? (
                                data.advantages.map((adv, idx) => (
                                    <li key={idx} className="flex items-start gap-1.5"><div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" /> {adv}</li>
                                ))
                            ) : (
                                <>
                                    {data.profileName === "Defansif Stratejist" && (
                                        <>
                                            <li className="flex items-start gap-1.5"><div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" /> Ana para garantisine en yakın, stressiz yatırım deneyimi.</li>
                                            <li className="flex items-start gap-1.5"><div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" /> Anlık nakit ihtiyacında kayıpsız çıkış yapabilme özgürlüğü.</li>
                                            <li className="flex items-start gap-1.5"><div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" /> Piyasa paniklerinden ve krizlerden izole edilmiş korunaklı yapı.</li>
                                        </>
                                    )}
                                    {data.profileName === "Optimum Denge" && (
                                        <>
                                            <li className="flex items-start gap-1.5"><div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" /> Düşüşlerde koruyan, yükselişlerde kazandıran "Altın Oran" mimarisi.</li>
                                            <li className="flex items-start gap-1.5"><div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" /> Kupon ve kâr payları ile düzenli, kesintisiz pasif nakit akışı.</li>
                                            <li className="flex items-start gap-1.5"><div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" /> Küresel şoklara karşı döviz ve altın bazlı otomatik sigorta kalkanı.</li>
                                        </>
                                    )}
                                    {data.profileName === "Alfa Odaklı" && (
                                        <>
                                            <li className="flex items-start gap-1.5"><div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" /> Uzun vadede piyasa ortalamasının çok üzerinde agresif kâr maksimizasyonu.</li>
                                            <li className="flex items-start gap-1.5"><div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" /> Geleceğin dev şirketlerine (startup/teknoloji) henüz yolun başındayken ortak olma fırsatı.</li>
                                            <li className="flex items-start gap-1.5"><div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" /> Enflasyonu sadece yenmekle kalmayan, onu katlayarak ezen büyüme gücü.</li>
                                        </>
                                    )}
                                </>
                            )}
                        </ul>
                    </div>

                </div>

            </div>

            {/* Sorumluluk Reddi (Disclaimer) */}
            <div className="mt-5 pt-4 border-t border-slate-50 text-[8px] leading-relaxed text-slate-400 text-center font-medium px-4">
                <strong className="text-slate-500">Yasal Uyarı:</strong> Burada sunulan portföy dağılımı ve potansiyel büyüme simülasyonları, girdiğiniz risk verilerine dayanarak hesaplanmış matematiksel modellemelerdir ve geçmiş verilere dayanır. Gelecekteki getiriler için kesin bir garanti sunmaz. <span className="font-bold">FinAi</span> bir "Yatırım Danışmanlığı" kurumu değil, zeki bir finansal teknoloji (FinTech) asistanıdır. Yatırım kararlarınızı alırken oluşabilecek finansal riskler ve olası kayıplar tamamen size aittir; FinAi ve algoritmaları bu sonuçlardan yasal veya maddi olarak sorumlu tutulamaz.
            </div>
        </div>
    </div>
  );
}
