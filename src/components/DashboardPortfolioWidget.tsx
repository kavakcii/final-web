"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight, PieChart, Battery, ArrowDownRight, CheckCircle2, RotateCcw, ChevronRight, Wallet, Zap } from "lucide-react";
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
        let investmentAmount = 0;

        const numQuestions = Object.keys(answers).length;
        // If 6 questions (old version), Islamic is index 5.
        // If 8 questions (new version), Islamic is index 7.
        // Amount question is index 6 in new version.
        const islamicIndex = numQuestions === 6 ? 5 : 7;
        const amountIndex = numQuestions === 8 ? 6 : -1;

        Object.entries(answers).forEach(([qIndex, val]) => {
            const idx = parseInt(qIndex);

            if (idx === amountIndex) {
                // This is the amount question, not a score
                investmentAmount = parseInt(val) || 0;
            } else {
                const s = parseInt(val);
                totalScore += s;
                // Check for interest sensitivity based on detected version
                if (idx === islamicIndex && s === 0) {
                    isIslamic = true;
                }
            }
        });

        // Helper to adjust names for Islamic finance
        const adjustForIslamic = (items: any[]) => {
            const formatCurrency = (val: number) => {
                if (!investmentAmount) return "";
                const amount = (investmentAmount * val) / 100;
                return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);
            };

            const processItems = (list: any[]) => list.map(item => ({
                ...item,
                amountStr: formatCurrency(item.value)
            }));

            if (!isIslamic) return processItems(items);
            return processItems(items.map(item => {
                if (item.name === "Tahvil / Bono") return { ...item, name: "Kira Sertifikaları (Sukuk)" };
                if (item.name === "Hisse Senetleri") return { ...item, name: "Katılım Hisseleri" };
                if (item.name === "Hisse (Temettü)") return { ...item, name: "Katılım Temettü Hisseleri" };
                if (item.name === "Yatırım Fonları") return { ...item, name: "Katılım Fonları" };
                if (item.name === "Nakit") return { ...item, name: "Katılım Hesabı" };
                return item;
            }));
        };

        if (totalScore >= 13) {
            return {
                title: "Agresif Büyüme Portföyü",
                persona: "Cesur Kaşif",
                desc: "Maksimum büyüme odaklı, yüksek volatiliteyi tolere edebilen portföy.",
                advantages: [
                    "Uzun vadede en yüksek getiri potansiyeli",
                    "Bileşik getirinin gücünden maksimum faydalanma",
                    "Enflasyon üzerinde ciddi reel getiri şansı"
                ],
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
                desc: "Risk ve getiri arasında ideal dengeyi kuran, piyasa dalgalanmalarına karşı kısmen korumalı yapı.",
                advantages: [
                    "Hem koruma hem büyüme sağlar",
                    "Aşırı piyasa düşüşlerinde tampon görevi görür",
                    "Stresten uzak, sürdürülebilir bir yatırım deneyimi"
                ],
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
                desc: "Sermaye koruma öncelikli, düşük riskli ve düzenli gelir odaklı portföy.",
                advantages: [
                    "Anapara kaybı riski minimumdur",
                    "Piyasa krizlerinden en az etkilenen yapıdır",
                    "Düzenli ve öngörülebilir getiri akışı sağlar"
                ],
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
            <div className="w-full h-full bg-[#0a192f] rounded-[1.5rem] p-8 flex items-center justify-center min-h-[600px] shadow-2xl">
                <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
        );
    }

    if (recommendation) {
        return (
            <div className="w-full h-full relative bg-[radial-gradient(circle_at_center,_white_0%,_#193b82_50%,_#0a192f_100%)] rounded-[1.5rem] overflow-hidden group shadow-2xl transition-all duration-700 hover:shadow-[0_20px_60px_rgba(37,99,235,0.2)] flex flex-col items-center text-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="relative flex flex-col items-center justify-center gap-8 p-10 z-10 w-full h-full">

                <div className="w-full h-[300px] relative z-10 mt-6 group-hover:scale-[1.03] transition-transform duration-700 ease-out">
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie width={400} height={250}>
                            <Pie
                                data={recommendation.allocation}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {recommendation.allocation.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0a192f" strokeWidth={2} />
                                ))}
                            </Pie>
                                <Tooltip
                                contentStyle={{ backgroundColor: '#ffffff', borderColor: 'transparent', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
                                itemStyle={{ color: '#0a192f', fontWeight: 'bold' }}
                                formatter={(value: any) => [`%${value}`, 'Oran']}
                            />
                        </RechartsPie>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[#0a192f] text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">Önerilen</span>
                        <span className="text-[#0a192f] font-black text-sm text-center px-4 leading-tight">{recommendation.title}</span>
                    </div>
                    <div className="absolute -bottom-4 left-0 w-full flex flex-wrap justify-center gap-3 px-4">
                        {recommendation.allocation.map((item: any, idx: number) => (
                            <div key={idx} className="flex flex-col items-center justify-center gap-1.5 px-3 py-2 bg-white/40 backdrop-blur-md rounded-xl shadow-lg border border-white/50 min-w-[80px]">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color, color: item.color }}></div>
                                <span className="text-[10px] text-[#0a192f] font-bold whitespace-nowrap text-center flex flex-col gap-0.5">
                                    {item.name} 
                                    <span className="font-black text-lg leading-none">%{item.value}</span>
                                    {item.amountStr && (
                                        <span className="text-slate-600 block">({item.amountStr})</span>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="w-full relative z-10 text-center flex flex-col items-center justify-center max-w-2xl mx-auto">
                    <div className="flex items-center justify-center gap-2 mb-4 animate-bounce-slow">
                        <div className="p-2 bg-[#0a192f]/10 rounded-xl text-[#0a192f] shadow-sm">
                            <PieChart className="w-5 h-5" />
                        </div>
                        <span className="text-[#0a192f] font-black text-sm tracking-wide">Güçlü AI Analizi</span>
                        <div className="text-[11px] font-black text-white bg-[#0a192f] px-3 py-1 rounded-full ml-2 uppercase tracking-widest shadow-md">
                            {recommendation.persona}
                        </div>
                    </div>

                    <h3 className="text-4xl font-black text-[#0a192f] mb-4 tracking-tighter">{recommendation.title}</h3>
                    <p className="text-slate-700 text-sm mb-6 leading-relaxed max-w-xl text-center font-medium">
                        {recommendation.desc}
                    </p>

                    <div className="p-6 bg-white/40 backdrop-blur-md rounded-2xl mb-8 text-sm text-slate-700 leading-relaxed text-center border border-white/50 shadow-lg w-full max-w-lg mx-auto">
                        <strong className="text-[#0a192f] block mb-3 font-black text-lg">Neden Bu Optimizasyon?</strong>
                        {recommendation.reasoning.split("**").map((part: string, i: number) =>
                            i % 2 === 1 ? <span key={i} className="text-[#0a192f] font-bold bg-[#0a192f]/5 px-1 rounded mx-0.5">{part}</span> : part
                        )}

                        {recommendation.advantages && (
                            <div className="mt-6 pt-5 border-t border-[#0a192f]/10 grid grid-cols-1 sm:grid-cols-2 gap-3 justify-items-center text-center">
                                {recommendation.advantages.map((adv: string, i: number) => (
                                    <div key={i} className="flex flex-col items-center justify-center gap-1.5 text-xs bg-white/50 p-3 rounded-xl hover:bg-white/80 transition-colors shadow-sm w-full">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                        <span className="font-bold text-[#0a192f]">{adv}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                        <button
                            onClick={() => {
                                localStorage.removeItem("portfolio_answers");
                                setRecommendation(null);
                            }}
                            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#0a192f] hover:bg-rose-600 text-white rounded-xl font-black text-sm transition-all duration-300 shadow-xl group/btn"
                        >
                            <RotateCcw className="w-5 h-5 group-hover/btn:-rotate-180 transition-transform duration-500" />
                            Yeni Test Yap
                        </button>
                    </div>
                </div>
            </div>
        </div>
        );
    }

    return (
        <div className="w-full h-full relative bg-[radial-gradient(circle_at_center,_white_0%,_#193b82_30%,_#0a192f_100%)] rounded-[1.5rem] overflow-hidden group shadow-2xl transition-all duration-700 flex flex-col justify-center min-h-[600px] text-center">
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/20 rounded-full blur-[100px] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
            
            <div className="relative flex flex-col justify-center items-center text-center p-12 z-10 w-full h-full">

            <div className="relative z-10 max-w-2xl mx-auto mt-4 px-8 py-14 bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/50 shadow-2xl group transition-all duration-500 hover:bg-white/60">
                <div className="w-24 h-24 bg-[#0a192f] rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-white shadow-2xl ring-4 ring-white/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <Zap className="w-12 h-12 animate-pulse text-blue-300" />
                </div>

                <h2 className="text-4xl md:text-5xl font-black text-[#0a192f] mb-6 tracking-tight leading-tight">
                    Optimum Portföyünüzü Bulun
                </h2>

                <p className="text-slate-700 text-base md:text-lg mb-10 leading-relaxed font-bold px-4">
                    AI Destekli analizimizle risk profilinizi ölçün, saniyeler içinde <strong className="text-[#0a192f]">BIST & TEFAS</strong> piyasasında size en uygun dağılımı keşfedin.
                </p>

                <button
                    onClick={() => window.location.href = "/dashboard/market"}
                    className="group/btn relative inline-flex items-center justify-center gap-3 px-12 py-6 bg-[#0a192f] text-white font-black text-xl rounded-2xl overflow-hidden transition-all hover:bg-blue-700 hover:shadow-2xl hover:-translate-y-2 active:scale-95 shadow-xl"
                >   
                    <span className="relative z-10 flex items-center gap-2">
                        Analizi Şimdi Başlat <ChevronRight className="w-7 h-7 group-hover/btn:translate-x-3 transition-transform duration-300" />
                    </span>
                    <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 delay-100" />
                </button>

                <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-[#0a192f] font-black bg-white/60 py-4 px-8 rounded-full border border-white/50 shadow-sm">
                    <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-sm"></span>
                        Bilimsel Analiz
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm"></span>
                        Kişiselleştirilmiş
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shadow-sm"></span>
                        Ücretsiz Altyapı
                    </span>
                </div>
            </div>
            </div>
        </div>
    );
}