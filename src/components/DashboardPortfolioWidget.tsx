"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight, PieChart, Battery, ArrowDownRight, CheckCircle2, RotateCcw, ChevronRight, Wallet, Zap, TrendingUp, BarChart3 } from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Link from "next/link";
import { motion } from "framer-motion";

interface DashboardPortfolioWidgetProps {
    groupedAssets?: any[];
    prices?: Record<string, number>;
    stats?: any[];
    onAssetSelect?: (symbol: string, type: string) => void;
}

export function DashboardPortfolioWidget({ groupedAssets = [], prices = {}, stats = [], onAssetSelect }: DashboardPortfolioWidgetProps) {
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
                desc: "Risk ve getiri arasında ideal dengeyi kuran, piyasa dalgalanmasına karşı kısmen korumalı yapı.",
                advantages: [
                    "Hem koruma hem büyüme sağlar",
                    "Aşırı piyasa düşüşlerinde tampon görevi görür",
                    "Stresten uzak, sürdürülebilir bir yatırım deneyimi"
                ],
                reasoning: "Dengeli bir risk profiliniz olduğu için portföyün %40'ı **" + (isIslamic ? "Katılım Hisselerine" : "Hisse Senetlerine") + "**, %30'u ise daha stabil olan **" + (isIslamic ? "Kira Sertifikalarına" : "Tahvil/Bono") + "** ve **Altın**'a paylaştırıldı. %20'lik **" + (isIslamic ? "Katılım Fonu" : "Fon") + "** sepeti ile getiri potansiyeli artırılırken, riskler minimize edildi.",
                allocation: adjustForIslamic([
                    { name: "Hisse Senetleri", value: 40, color: "#3b82f6" },
                    { name: "Tahvil / Bono", value: 20, color: "#10b981" },
                    { name: "Yatırım Fonları", value: 20, color: "#6366f1" },
                    { name: "Emtia / Altın", value: 10, color: "#eab308" },
                    { name: "Nakit", value: 10, color: "#64748b" }
                ])
            };
        } else {
            return {
                title: "Muhafazakar Portföy",
                persona: "Güvenli Liman",
                desc: "Ana parayı koruma odaklı, düşük riskli ve düzenli getiri hedefleyen yapı.",
                advantages: [
                    "Düşük volatilite ve huzurlu uyku",
                    "Düzenli temettü veya faiz/kira getirisi",
                    "Piyasa krizlerinden en az etkilenen yapı"
                ],
                reasoning: "Düşük risk toleransınız nedeniyle portföyün %50'si en güvenli varlıklar olan **" + (isIslamic ? "Kira Sertifikaları" : "Tahvil/Bono") + "** ve **Altın**'a ayrıldı. %20'lik **" + (isIslamic ? "Katılım Hesabı" : "Nakit") + "** likidite sağlarken, %30'luk **" + (isIslamic ? "Katılım Temettü Hisseleri" : "Temettü Hisseleri") + "** ile enflasyon üzerinde getiri hedeflendi.",
                allocation: adjustForIslamic([
                    { name: "Hisse (Temettü)", value: 30, color: "#3b82f6" },
                    { name: "Tahvil / Bono", value: 30, color: "#10b981" },
                    { name: "Emtia / Altın", value: 20, color: "#eab308" },
                    { name: "Nakit", value: 20, color: "#64748b" }
                ])
            };
        }
    };

    if (isLoading) return <div className="p-8 text-center"><RotateCcw className="w-8 h-8 animate-spin mx-auto text-[#00008B] opacity-20" /></div>;

    return (
        <div className="space-y-6">
            {/* Real Portfolio Status */}
            {groupedAssets.length > 0 && (
                <div className="bg-[#00008B] rounded-[2.5rem] p-8 text-white shadow-2xl shadow-[#00008B]/20 relative overflow-hidden">
                    <div className="absolute right-[-20px] top-[-20px] opacity-10">
                        <TrendingUp className="w-48 h-48" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-tight">Canlı Portföy Durumu</h3>
                                <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Gerçek Zamanlı Varlık Analizi</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {groupedAssets.slice(0, 4).map((asset, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => onAssetSelect?.(asset.symbol, asset.type)}
                                    className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all text-left group"
                                >
                                    <p className="text-[10px] font-black opacity-40 mb-1 uppercase">{asset.symbol.split(':')[1] || asset.symbol}</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-black">{asset.quantity} Adet</p>
                                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Recommendation Logic */}
            {recommendation ? (
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-[#00008B] tracking-tight">{recommendation.title}</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Stratejik Öneri: {recommendation.persona}</p>
                            </div>
                        </div>
                        <Link href="/reports" className="px-5 py-2.5 bg-slate-50 text-[#00008B] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00008B] hover:text-white transition-all">Detaylı Rapor</Link>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <p className="text-slate-600 font-medium leading-relaxed italic border-l-4 border-emerald-500 pl-4">
                                {recommendation.desc}
                            </p>
                            <div className="grid gap-3">
                                {recommendation.advantages.map((adv: string, i: number) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                        <Zap className="w-4 h-4 text-yellow-500" />
                                        <span className="text-xs font-bold text-slate-700">{adv}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="h-[220px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPie>
                                    <Pie
                                        data={recommendation.allocation}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {recommendation.allocation.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                </RechartsPie>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-xs font-bold text-slate-400 uppercase">Dağılım</span>
                                <span className="text-xl font-black text-[#00008B]">Hedef</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-50 rounded-[2.5rem] p-12 text-center border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6">
                        <PieChart className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-black text-[#00008B] mb-2">Henüz Bir Öneriniz Yok</h3>
                    <p className="text-sm text-slate-400 font-bold mb-8 max-w-sm mx-auto">Size özel yatırım stratejisi oluşturmak için anketi tamamlayın.</p>
                    <Link href="/reports" className="inline-flex items-center gap-2 px-8 py-4 bg-[#00008B] text-white rounded-2xl font-black text-sm shadow-xl shadow-[#00008B]/20 hover:scale-105 transition-all">
                        Anketi Başlat <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            )}
        </div>
    );
}