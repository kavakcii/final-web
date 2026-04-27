"use client";

import React, { useMemo } from "react";
import { Brain, TrendingUp, Sparkles, LineChart } from "lucide-react";
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
}

interface RecommendationCardProps {
  data?: PortfolioData;
  userName?: string;
  investmentAmount?: string;
}

export function PortfolioRecommendationModal({ data, userName, investmentAmount }: RecommendationCardProps) {
  const displayName = userName?.split(' ')[0] || "Yatırımcı";

  const simulations = useMemo(() => {
    if (!data || !data.expectedAnnualReturn) return null;
    
    const cleanAmount = investmentAmount ? investmentAmount.replace(/[^0-9]/g, '') : "0";
    const principal = parseFloat(cleanAmount) || 10000; 
    const r = data.expectedAnnualReturn / 100; 

    const oneMonth = principal * (1 + (r / 12));
    const oneYear = principal * (1 + r);
    const threeYears = principal * Math.pow((1 + r), 3);
    const fiveYears = principal * Math.pow((1 + r), 5);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val);
    };

    return [
        { label: "1 Aylık", value: formatCurrency(oneMonth), growth: `+%${(r/12*100).toFixed(1)}` },
        { label: "1 Yıllık", value: formatCurrency(oneYear), growth: `+%${(r*100).toFixed(0)}` },
        { label: "3 Yıllık", value: formatCurrency(threeYears), growth: `+%${((Math.pow((1+r),3)-1)*100).toFixed(0)}` },
        { label: "5 Yıllık", value: formatCurrency(fiveYears), growth: `+%${((Math.pow((1+r),5)-1)*100).toFixed(0)}` }
    ];
  }, [data, investmentAmount]);

  if (!data) return null;

  return (
    <div className="w-full bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col mt-6">
        {/* Header */}
        <div className="flex items-center justify-between p-6 md:px-8 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00008B] to-blue-600 flex items-center justify-center shadow-lg shadow-[#00008B]/20">
                    <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-[#00008B] tracking-tight">
                        {displayName}, Özel Portföyün Hazır
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                        FinAi • {data.profileName}
                    </p>
                </div>
            </div>
            <Link href="/dashboard/test" className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-colors">
                Testi Yenile
            </Link>
        </div>

        {/* Body Layout (2 Columns grid) */}
        <div className="flex-1 p-6 md:p-8 bg-white">
            <div className="grid lg:grid-cols-2 gap-10">
                
                {/* SOL SÜTUN */}
                <div className="flex flex-col gap-8">
                    {/* AI Analiz Kutusu */}
                    <div className="bg-[#00008B]/[0.02] border border-[#00008B]/10 rounded-3xl p-6 relative">
                        <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-[#00008B] flex items-center justify-center border-4 border-white shadow-md">
                            <Brain className="w-3.5 h-3.5 text-white" />
                        </div>
                        <h3 className="text-[10px] font-black text-[#00008B]/50 uppercase tracking-widest mb-3">Yapay Zeka Analizi</h3>
                        <p className="text-[13px] font-medium text-slate-700 leading-relaxed italic">
                            "{data.aiAnalysis}"
                        </p>
                    </div>

                    {/* Dağılım Listesi */}
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <TrendingUp className="w-3 h-3" /> Önerilen Dağılım
                        </h3>
                        <div className="flex flex-col gap-3">
                            {data.portfolio.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                <div className="w-2 h-10 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: item.color }} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-black text-slate-800 truncate pr-4">{item.asset}</span>
                                        <span className="text-lg font-black" style={{ color: item.color }}>%{item.percentage}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-medium truncate">{item.description}</p>
                                </div>
                            </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* SAĞ SÜTUN */}
                <div className="flex flex-col gap-8">
                    
                    {/* Pasta Grafik */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center h-[300px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.portfolio}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={110}
                                    paddingAngle={3}
                                    dataKey="percentage"
                                    stroke="none"
                                    cornerRadius={4}
                                >
                                    {data.portfolio.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="text-3xl font-black text-[#00008B]">%100</div>
                            <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-1">Dağılım</span>
                        </div>
                    </div>

                    {/* Potansiyel (Simülasyon) Modülü */}
                    {simulations && (
                    <div className="bg-gradient-to-br from-[#00008B] to-blue-700 rounded-3xl p-6 shadow-xl shadow-[#00008B]/20 text-white relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                        <div className="relative z-10">
                            <h3 className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1 flex items-center gap-2">
                                <LineChart className="w-3 h-3" /> Potansiyel Büyüme
                            </h3>
                            <p className="text-xs text-blue-100/70 mb-6 font-medium">Başlangıç tutarınız üzerinden simüle edilmiştir.</p>
                            
                            <div className="grid grid-cols-2 gap-3">
                                {simulations.map((sim, idx) => (
                                    <div key={idx} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">{sim.label}</span>
                                            <span className="text-[10px] font-black text-emerald-300 bg-emerald-400/20 px-2 py-0.5 rounded-md">{sim.growth}</span>
                                        </div>
                                        <div className="text-lg font-black tracking-tight">{sim.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    )}

                </div>

            </div>
        </div>
    </div>
  );
}
