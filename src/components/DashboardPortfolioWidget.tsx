"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight, PieChart, Wallet, Zap, RotateCcw, CheckCircle2 } from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Link from "next/link";
import { GlowCard } from "@/components/ui/spotlight-card";

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
            <div className="lg:col-span-2 bg-white border border-[#0a192f]/10 shadow-lg rounded-2xl p-8 flex items-center justify-center min-h-[300px]">
                <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (recommendation) {
        return (
            <GlowCard customSize glowColor="primary" className="lg:col-span-2 h-auto text-[#0a192f]">
                <div className="relative overflow-hidden flex flex-col md:flex-row items-center gap-8 p-6 bg-white rounded-2xl">
                    {/* Köşeden Gelen Soft Lacivert Geçiş (Kullanıcı İsteği) */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle_at_top_right,_rgba(10,25,47,0.06)_0%,_transparent_60%)] pointer-events-none mix-blend-multiply" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[radial-gradient(circle_at_bottom_left,_rgba(10,25,47,0.04)_0%,_transparent_60%)] pointer-events-none mix-blend-multiply" />

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
                                isAnimationActive={true}
                            >
                                {recommendation.allocation.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
                                ))}
                            </Pie>
                                <Tooltip
                                contentStyle={{ backgroundColor: '#ffffff', borderColor: 'rgba(10,25,47,0.1)', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                itemStyle={{ color: '#0a192f', fontWeight: 'bold' }}
                                formatter={(value: any) => [`%${value}`, 'Oran']}
                            />
                        </RechartsPie>
                    </ResponsiveContainer>
                    {/* Centered Title */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Önerilen</span>
                        <span className="text-[#0a192f] font-black text-sm text-center px-4 mt-1">{recommendation.title}</span>
                    </div>
                    {/* Legend */}
                    <div className="absolute -bottom-4 left-0 w-full flex flex-wrap justify-center gap-3 px-4">
                        {recommendation.allocation.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-[#0a192f]/5 rounded-full">
                                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                                <span className="text-[10px] text-[#0a192f] font-bold whitespace-nowrap">
                                    {item.name} <span className="text-blue-700 font-black">%{item.value}</span>
                                    {item.amountStr && (
                                        <span className="text-slate-500 ml-1">({item.amountStr})</span>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Info Side */}
                <div className="w-full md:w-1/2 relative z-10 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                        <div className="p-2 bg-green-100 rounded-lg text-green-700 border border-green-200">
                            <PieChart className="w-5 h-5" />
                        </div>
                        <span className="text-green-700 font-black text-sm">Analiz Tamamlandı</span>
                        <div className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full border border-blue-200 ml-2">
                            {recommendation.persona}
                        </div>
                    </div>

                    <h3 className="text-2xl font-black text-[#0a192f] mb-2">{recommendation.title}</h3>
                    <p className="text-slate-600 text-sm mb-5 leading-relaxed font-medium">
                        {recommendation.desc}
                    </p>

                    <div className="p-4 bg-slate-50 rounded-xl border border-[#0a192f]/10 mb-6 text-xs text-slate-600 leading-relaxed shadow-inner">
                        <strong className="text-[#0a192f] block mb-2 font-black">Neden bu dağılım?</strong>
                        {recommendation.reasoning.split("**").map((part: string, i: number) =>
                            i % 2 === 1 ? <span key={i} className="text-blue-700 font-bold">{part}</span> : part
                        )}

                        {recommendation.advantages && (
                            <div className="mt-4 pt-4 border-t border-[#0a192f]/10">
                                <strong className="text-[#0a192f] block mb-2 font-black">Avantajlar:</strong>
                                <ul className="space-y-1.5">
                                    {recommendation.advantages.map((adv: string, i: number) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                                            <span className="font-medium">{adv}</span>
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
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-[#0a192f] rounded-xl font-bold text-sm transition-all border-2 border-slate-200 hover:border-blue-300 hover:text-blue-700 shadow-sm"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Testi Tekrarla
                        </button>
                    </div>
                    </div>
                </div>
            </GlowCard>
        );
    }

    // Default "Start Test" View
    return (
        <GlowCard customSize glowColor="primary" className="lg:col-span-2 h-auto text-[#0a192f]">
            <div className="relative overflow-hidden flex flex-col justify-center items-center text-center p-8 bg-white rounded-2xl">
                {/* Köşeden Gelen Soft Lacivert Geçiş */}
                <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(circle_at_top_left,_rgba(10,25,47,0.06)_0%,_transparent_60%)] pointer-events-none mix-blend-multiply" />
                <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-[radial-gradient(circle_at_bottom_right,_rgba(10,25,47,0.04)_0%,_transparent_60%)] pointer-events-none mix-blend-multiply" />

            <div className="relative z-10 max-w-lg mx-auto mt-4">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 ring-4 ring-blue-100 shadow-inner">
                    <Wallet className="w-8 h-8" />
                </div>

                <h2 className="text-3xl font-black text-[#0a192f] mb-4 tracking-tight">
                    Size Özel Portföy Dağılımını Bulun
                </h2>

                <p className="text-slate-500 text-lg mb-8 leading-relaxed font-medium">
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
        </GlowCard>
    );
}