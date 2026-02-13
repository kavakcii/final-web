"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight, PieChart, Wallet, Zap, RotateCcw } from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Link from "next/link";

export function DashboardPortfolioWidget() {
    const [recommendation, setRecommendation] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const savedAnswers = localStorage.getItem("portfolio_answers");
        if (savedAnswers) {
            try {
                const parsed = JSON.parse(savedAnswers);
                if (Object.keys(parsed).length > 0) {
                    const rec = getPortfolioRecommendation(parsed);
                    setRecommendation(rec);
                }
            } catch (e) {
                console.error("Failed to load saved answers", e);
            }
        }
        setIsLoading(false);
    }, []);

    const getPortfolioRecommendation = (answers: Record<number, string>) => {
        let totalScore = 0;
        let isIslamic = false;

        Object.entries(answers).forEach(([qIndex, score]) => {
            const s = parseInt(score);
            totalScore += s;
            // Question 6 (index 5) checks for interest sensitivity
            if (parseInt(qIndex) === 5 && s === 0) {
                isIslamic = true;
            }
        });

        // Helper to adjust names for Islamic finance
        const adjustForIslamic = (items: any[]) => {
            if (!isIslamic) return items;
            return items.map(item => {
                if (item.name === "Tahvil / Bono") return { ...item, name: "Kira Sertifikaları (Sukuk)" };
                if (item.name === "Hisse Senetleri") return { ...item, name: "Katılım Hisseleri" };
                if (item.name === "Hisse (Temettü)") return { ...item, name: "Katılım Temettü Hisseleri" };
                if (item.name === "Yatırım Fonları") return { ...item, name: "Katılım Fonları" };
                if (item.name === "Nakit") return { ...item, name: "Katılım Hesabı" };
                return item;
            });
        };

        if (totalScore >= 13) {
            return {
                title: "Agresif Büyüme Portföyü",
                persona: "Cesur Kaşif",
                desc: "Risk almaktan korkmayan, uzun vadeli ve yüksek getiri hedefleyen bir yatırımcısınız.",
                reasoning: "Yüksek risk toleransınız ve uzun vade hedefiniz nedeniyle portföyün ağırlığı (%60) büyüme potansiyeli yüksek **" + (isIslamic ? "Katılım Hisselerine" : "Hisse Senetlerine") + "** verildi. Bu varlık sınıfı uzun vadede en yüksek getiriyi sunar. %20'lik **" + (isIslamic ? "Katılım Fonu" : "Fon") + "** kısmı sektörel çeşitlilik sağlarken, %10 **Altın** ve **" + (isIslamic ? "Katılım Hesabı" : "Nakit") + "** ise piyasa düzeltmelerinde 'dipten alım' fırsatı yaratmak ve sigorta görevi görmek için eklendi.",
                allocation: adjustForIslamic([
                    { name: "Hisse Senetleri", value: 60, color: "#3b82f6" },
                    { name: "Yatırım Fonları", value: 20, color: "#6366f1" },
                    { name: "Emtia / Altın", value: 10, color: "#eab308" },
                    { name: "Nakit", value: 10, color: "#64748b" }
                ])
            };
        } else if (totalScore >= 9) {
            return {
                title: "Dengeli Portföy",
                persona: "Stratejik Mimar",
                desc: "Hem kazanmak hem de korumak isteyen, akılcı ve planlı bir yatırımcısınız.",
                reasoning: "Ne paranızı enflasyona ezdiriyorsunuz ne de aşırı risk alıyorsunuz. Portföyün %40'ı ile **" + (isIslamic ? "Katılım Hissesi" : "Hisse Senedi") + "** piyasasının getirisinden faydalanırken, toplamda %50'yi bulan **" + (isIslamic ? "Sukuk" : "Tahvil") + "** ve **Altın** ağırlığı ile piyasa çöküşlerine karşı kalkan oluşturuyorsunuz. Bu yapı, 'geceleri rahat uyuyarak' büyüme sağlar.",
                allocation: adjustForIslamic([
                    { name: "Hisse Senetleri", value: 40, color: "#3b82f6" },
                    { name: "Tahvil / Bono", value: 30, color: "#22c55e" },
                    { name: "Altın", value: 20, color: "#eab308" },
                    { name: "Nakit", value: 10, color: "#64748b" }
                ])
            };
        } else {
            return {
                title: "Koruyucu Portföy",
                persona: "Güvenli Liman",
                desc: "Önceliği elindekini korumak olan, riskten kaçınan temkinli bir yatırımcısınız.",
                reasoning: "Ana parayı kaybetme riskiniz minimize edildi. Portföyün %80'i (**" + (isIslamic ? "Sukuk" : "Tahvil") + "** ve **Altın**) güvenli limanlarda tutularak krizlere karşı tam koruma sağlandı. Sadece %10'luk **" + (isIslamic ? "Katılım Hissesi" : "Hisse (Temettü)") + "** kısmı ile düzenli nakit akışı hedeflendi. Bu portföyün mottosu: 'Önce kaybetme, sonra kazan'.",
                allocation: adjustForIslamic([
                    { name: "Tahvil / Bono", value: 50, color: "#22c55e" },
                    { name: "Altın", value: 30, color: "#eab308" },
                    { name: "Hisse (Temettü)", value: 10, color: "#3b82f6" },
                    { name: "Nakit", value: 10, color: "#64748b" }
                ])
            };
        }
    };

    if (isLoading) {
        return (
            <div className="lg:col-span-2 bg-slate-900/50 border border-white/10 rounded-2xl p-8 flex items-center justify-center min-h-[300px]">
                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (recommendation) {
        return (
            <div className="lg:col-span-2 bg-gradient-to-br from-blue-900/40 to-slate-900 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
                <div className="absolute top-0 right-0 w-64 h-full opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
                
                {/* Chart Side */}
                <div className="w-full md:w-1/2 h-[250px] relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie width={400} height={250}>
                            <Pie
                                data={recommendation.allocation}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                                isAnimationActive={true}
                                activeIndex={-1} // Disable click selection effect
                            >
                                {recommendation.allocation.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                formatter={(value: number) => [`%${value}`, 'Oran']}
                            />
                        </RechartsPie>
                    </ResponsiveContainer>
                    {/* Centered Title */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-slate-400 text-xs font-medium">Önerilen</span>
                        <span className="text-white font-bold text-sm text-center px-4">{recommendation.title}</span>
                    </div>
                    {/* Legend */}
                    <div className="absolute -bottom-4 left-0 w-full flex flex-wrap justify-center gap-3 px-4">
                         {recommendation.allocation.map((item: any, idx: number) => (
                             <div key={idx} className="flex items-center gap-1.5">
                                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                 <span className="text-[10px] text-slate-300 font-medium whitespace-nowrap">
                                     {item.name} <span className="text-slate-500">%{item.value}</span>
                                 </span>
                             </div>
                         ))}
                    </div>
                </div>

                {/* Info Side */}
                <div className="w-full md:w-1/2 relative z-10 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                        <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                            <PieChart className="w-5 h-5" />
                        </div>
                        <span className="text-green-400 font-bold text-sm">Analiz Tamamlandı</span>
                        <div className="text-xs font-medium text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                            {recommendation.persona}
                        </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-2">{recommendation.title}</h3>
                    <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                        {recommendation.desc}
                    </p>
                    
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 mb-6 text-xs text-slate-300 leading-relaxed">
                        <strong className="text-white block mb-1">Neden bu dağılım?</strong>
                        {recommendation.reasoning.split("**").map((part: string, i: number) => 
                            i % 2 === 1 ? <span key={i} className="text-white font-bold">{part}</span> : part
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                        <button 
                            onClick={() => {
                                localStorage.removeItem("portfolio_answers");
                                setRecommendation(null);
                            }}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium text-sm transition-all border border-white/10"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Testi Tekrarla
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Default "Start Test" View
    return (
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-900/40 to-slate-900 border border-blue-500/20 rounded-2xl p-8 relative overflow-hidden flex flex-col justify-center items-center text-center">
            <div className="absolute top-0 right-0 w-64 h-full opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
            
            <div className="relative z-10 max-w-lg mx-auto">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-400 ring-4 ring-blue-500/10">
                    <Wallet className="w-8 h-8" />
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-4">
                    Size Özel Portföy Dağılımını Bulun
                </h2>
                
                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                    Yatırım hedeflerinize ve risk profilinize en uygun dağılımı 1 dakikalık akıllı testimizle belirleyin.
                </p>

                <Link 
                    href="/dashboard/market" 
                    className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-blue-900/30"
                >
                    Teste Başla
                    <ArrowUpRight className="w-5 h-5" />
                </Link>
                
                <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Bilimsel Analiz
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        Kişiselleştirilmiş
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        Ücretsiz
                    </span>
                </div>
            </div>
        </div>
    );
}