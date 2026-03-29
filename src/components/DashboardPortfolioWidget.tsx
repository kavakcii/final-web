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
            <div className="lg:col-span-2 bg-[#0a192f] rounded-[1.5rem] p-8 flex items-center justify-center min-h-[300px] shadow-2xl">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
        );
    }

    if (recommendation) {
        return (
            <div className="lg:col-span-2 relative bg-[#0a192f] rounded-[1.5rem] overflow-hidden group shadow-2xl">
                <div className="relative flex flex-col md:flex-row items-center gap-8 p-8 z-10 w-full h-full">

                <div className="w-full md:w-1/2 h-[250px] relative z-10">
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
                        <span className="text-slate-300 text-[10px] font-bold uppercase tracking-widest mt-1">Önerilen</span>
                        <span className="text-white font-black text-sm text-center px-4 leading-tight">{recommendation.title}</span>
                    </div>
                    <div className="absolute -bottom-4 left-0 w-full flex flex-wrap justify-center gap-3 px-4">
                        {recommendation.allocation.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 px-2.5 py-1 bg-white/10 rounded-full">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color, color: item.color }}></div>
                                <span className="text-[10px] text-white font-bold whitespace-nowrap">
                                    {item.name} <span className="font-black ml-1">%{item.value}</span>
                                    {item.amountStr && (
                                        <span className="text-slate-300 ml-1">({item.amountStr})</span>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="w-full md:w-1/2 relative z-10 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                        <div className="p-1.5 bg-white/10 rounded-lg text-white">
                            <PieChart className="w-4 h-4" />
                        </div>
                        <span className="text-white font-black text-xs tracking-wide">AI Analizi</span>
                        <div className="text-[10px] font-bold text-[#0a192f] bg-white px-2 py-0.5 rounded-full ml-2 uppercase tracking-widest">
                            {recommendation.persona}
                        </div>
                    </div>

                    <h3 className="text-2xl font-black text-white mb-2 tracking-tight">{recommendation.title}</h3>
                    <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                        {recommendation.desc}
                    </p>

                    <div className="p-5 bg-white/5 rounded-xl mb-6 text-sm text-slate-300 leading-relaxed">
                        <strong className="text-white block mb-2 font-black">Neden Bu?</strong>
                        {recommendation.reasoning.split("**").map((part: string, i: number) =>
                            i % 2 === 1 ? <span key={i} className="text-white font-bold">{part}</span> : part
                        )}

                        {recommendation.advantages && (
                            <div className="mt-5 pt-4 border-t border-white/10">
                                <ul className="space-y-2">
                                    {recommendation.advantages.map((adv: string, i: number) => (
                                        <li key={i} className="flex items-start gap-2 text-xs">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                            <span>{adv}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                        <button
                            onClick={() => {
                                localStorage.removeItem("portfolio_answers");
                                setRecommendation(null);
                            }}
                            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-all"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Testi Tekrarla
                        </button>
                    </div>
                </div>
            </div>
        </div>
        );
    }

    return (
        <div className="lg:col-span-2 relative bg-[#0a192f] rounded-[1.5rem] overflow-hidden group shadow-2xl">
            
            <div className="relative flex flex-col justify-center items-center text-center p-12 z-10 w-full h-full">

            <div className="relative z-10 max-w-lg mx-auto mt-4">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white">
                    <Wallet className="w-8 h-8" />
                </div>

                <h2 className="text-3xl font-black text-white mb-4 tracking-tight">
                    Optimum Portföyünüzü Bulun
                </h2>

                <p className="text-slate-300 text-sm mb-8 leading-relaxed">
                    AI Destekli analizimizle risk profilinizi ölçün, saniyeler içinde BIST & TEFAS piyasasında size en uygun dağılımı keşfedin.
                </p>

                <button
                    onClick={() => window.location.href = "/dashboard/market"}
                    className="group relative inline-flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-lg overflow-hidden transition-all hover:bg-blue-500 active:scale-95"
                >   
                    <span className="relative z-10 flex items-center gap-2">
                        Analizi Başlat <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                </button>

                <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-300 font-bold">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        Bilimsel Analiz
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        Kişiselleştirilmiş
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        Ücretsiz
                    </span>
                </div>
            </div>
            </div>
        </div>
    );
}