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
        const islamicIndex = numQuestions === 6 ? 5 : 7;
        const amountIndex = numQuestions === 8 ? 6 : -1;

        Object.entries(answers).forEach(([qIndex, val]) => {
            const idx = parseInt(qIndex);

            if (idx === amountIndex) {
                investmentAmount = parseInt(val) || 0;
            } else {
                const s = parseInt(val);
                totalScore += s;
                if (idx === islamicIndex && s === 0) {
                    isIslamic = true;
                }
            }
        });

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
            <div className="w-full h-full bg-[#050a18]/40 backdrop-blur-3xl rounded-[2rem] p-8 flex items-center justify-center min-h-[600px] border border-white/10">
                <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (recommendation) {
        return (
            <div className="w-full h-full relative glass-widget rounded-[2rem] overflow-hidden group flex flex-col items-center text-center">
                <div className="absolute top-0 left-0 w-32 h-32 bg-blue-600/10 rounded-br-full blur-3xl pointer-events-none" />
                
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
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.8)" strokeWidth={2} />
                                ))}
                            </Pie>
                                <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
                                itemStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                                formatter={(value: any) => [`%${value}`, 'Oran']}
                            />
                        </RechartsPie>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1 opacity-70">Önerilen</span>
                        <span className="text-white font-black text-sm text-center px-4 leading-tight tracking-tighter uppercase">{recommendation.title}</span>
                    </div>
                    <div className="absolute -bottom-4 left-0 w-full flex flex-wrap justify-center gap-3 px-4">
                        {recommendation.allocation.map((item: any, idx: number) => (
                            <div key={idx} className="flex flex-col items-center justify-center gap-1.5 px-3 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg min-w-[80px] group/box hover:scale-105 transition-all duration-300">
                                <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]" style={{ backgroundColor: item.color }}></div>
                                <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap text-center flex flex-col gap-0.5 mt-1 transition-colors group-hover/box:text-white">
                                    {item.name} 
                                    <span className="font-black text-lg leading-none text-white mt-0.5">{`%${item.value}`}</span>
                                    {item.amountStr && (
                                        <span className="text-slate-500 font-bold block mt-0.5">({item.amountStr})</span>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="w-full relative z-10 text-center flex flex-col items-center justify-center max-w-2xl mx-auto">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                            <PieChart className="w-5 h-5" />
                        </div>
                        <span className="text-slate-400 font-black text-[10px] tracking-[0.2em] uppercase">Güçlü AI Analizi</span>
                        <div className="text-[10px] font-black text-white bg-blue-600 px-3 py-1 rounded-full ml-2 uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                            {recommendation.persona}
                        </div>
                    </div>

                    <h3 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">{recommendation.title}</h3>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed max-w-xl text-center font-bold opacity-80">
                        {recommendation.desc}
                    </p>

                    <div className="p-8 bg-white/5 border border-white/10 rounded-[2rem] mb-8 text-sm leading-relaxed text-center shadow-2xl w-full max-w-lg mx-auto relative overflow-hidden group/card">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-right from-blue-600 to-transparent opacity-50" />
                        <strong className="text-white block mb-4 font-black text-xl tracking-tight uppercase">Neden Bu Optimizasyon?</strong>
                        <p className="text-left font-bold text-slate-400 px-2 mt-2 leading-relaxed">
                        {recommendation.reasoning.split("**").map((part: string, i: number) =>
                            i % 2 === 1 ? <span key={i} className="text-[#0a192f] font-black bg-[#0a192f]/5 px-1.5 py-0.5 rounded mx-0.5">{part}</span> : part
                        )}
                        </p>

                        {recommendation.advantages && (
                            <div className="mt-6 pt-5 border-t border-[#0a192f]/5 grid grid-cols-1 sm:grid-cols-2 gap-3 justify-items-center text-center">
                                {recommendation.advantages.map((adv: string, i: number) => (
                                    <div key={i} className="flex flex-col items-center justify-center gap-1.5 text-xs bg-slate-50 p-3 rounded-xl hover:bg-slate-100 transition-colors w-full border border-slate-100">
                                        <CheckCircle2 className="w-5 h-5 text-[#0a192f] flex-shrink-0" />
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
                            className="inline-flex items-center justify-center gap-3 px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_0_30px_rgba(37,99,235,0.4)] group/btn hover:scale-105"
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
        <div className="w-full h-full relative glass-widget rounded-[2rem] overflow-hidden group flex flex-col justify-center min-h-[600px] text-center backdrop-blur-3xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-bl-full blur-[120px] pointer-events-none" />
            <div className="relative flex flex-col justify-center items-center text-center p-12 z-10 w-full h-full">
                <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-[0_20px_60px_rgba(37,99,235,0.5)] animate-bounce border border-blue-400/30">
                    <Wallet className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-6xl font-black text-white mb-8 tracking-tighter leading-[0.9] uppercase">AI Portföyünüzü<br/>Hazırlayalım mı?</h3>
                <p className="text-slate-400 text-lg mb-12 max-w-md font-bold opacity-80 leading-relaxed uppercase tracking-wide">
                    Risk profilinize uygun, yapay zeka tarafından optimize edilmiş stratejinizi saniyeler içinde oluşturun.
                </p>
                <Link
                    href="/dashboard/analysis"
                    className="group relative inline-flex items-center gap-4 px-12 py-6 bg-white text-black rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_20px_50px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95"
                >
                    Hemen Analize Başla
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </Link>
            </div>
        </div>
    );
}