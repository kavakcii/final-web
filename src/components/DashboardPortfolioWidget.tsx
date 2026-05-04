"use client";

import { useState, useEffect } from "react";
import { 
    ArrowUpRight, PieChart, CheckCircle2, RotateCcw, 
    ChevronRight, Wallet, Zap, TrendingUp, BarChart3,
    Landmark, Building2, Scale, LayoutGrid, ArrowLeftRight,
    Brain, X, Info
} from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion, AnimatePresence } from "framer-motion";

interface DashboardPortfolioWidgetProps {
    groupedAssets?: any[];
    prices?: Record<string, number>;
    stats?: any[];
    onAssetSelect?: (symbol: string, type: string) => void;
}

type Path = 'FUND' | 'STOCK' | 'MIXED' | null;

export function DashboardPortfolioWidget({ groupedAssets = [], prices = {}, stats = [], onAssetSelect }: DashboardPortfolioWidgetProps) {
    const [recommendation, setRecommendation] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [surveyStarted, setSurveyStarted] = useState(false);
    const [path, setPath] = useState<Path>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});

    useEffect(() => {
        const savedAnswers = localStorage.getItem("portfolio_answers");
        if (savedAnswers) {
            try {
                const parsed = JSON.parse(savedAnswers);
                if (Object.keys(parsed).length > 0) {
                    const rec = generateRecommendation(parsed, (parsed as any).path || 'MIXED');
                    setRecommendation(rec);
                }
            } catch (e) {
                console.error("Failed to load saved answers", e);
            }
        }
        setIsLoading(false);
    }, []);

    const questions = path ? (path === 'FUND' ? [
        { id: 1, question: "Yatırım vadeniz nedir?", options: [{ label: "1 Yıl", score: 1 }, { label: "3+ Yıl", score: 3 }] },
        { id: 2, question: "Risk toleransınız?", options: [{ label: "Düşük (Bono/Altın)", score: 1 }, { label: "Yüksek (Hisse Fonu)", score: 3 }] }
    ] : path === 'STOCK' ? [
        { id: 1, question: "Stratejiniz nedir?", options: [{ label: "Temettü", score: 1 }, { label: "Büyüme", score: 3 }] },
        { id: 2, question: "Takip sıklığınız?", options: [{ label: "Haftalık", score: 1 }, { label: "Günlük", score: 3 }] }
    ] : [
        { id: 1, question: "Vadeniz nedir?", options: [{ label: "Kısa", score: 1 }, { label: "Uzun", score: 3 }] },
        { id: 2, question: "Risk tercihiniz?", options: [{ label: "Dengeli", score: 2 }, { label: "Agresif", score: 3 }] }
    ]) : [];

    const handleAnswer = (score: number) => {
        const newAnswers = { ...answers, [currentStep]: score.toString() };
        setAnswers(newAnswers);
        if (currentStep < questions.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            const rec = generateRecommendation(newAnswers, path || 'MIXED');
            localStorage.setItem("portfolio_answers", JSON.stringify({ ...newAnswers, path }));
            setRecommendation(rec);
            setSurveyStarted(false);
        }
    };

    const generateRecommendation = (ans: any, selectedPath: Path) => {
        // Simple logic for widget demonstration
        const total = Object.values(ans).reduce((a: any, b: any) => parseInt(a) + parseInt(b), 0) as number;
        
        if (selectedPath === 'FUND') {
            return {
                title: total > 3 ? "Agresif Fon Portföyü" : "Defansif Fon Portföyü",
                persona: total > 3 ? "Fon Avcısı" : "Güvenli Liman",
                desc: total > 3 ? "Yüksek getiri odaklı hisse yoğun fonlar." : "Düşük riskli borçlanma araçları fonları.",
                allocation: [
                    { name: "Hisse Fonları", value: total > 3 ? 70 : 20, color: "#3b82f6" },
                    { name: "Altın/Emtia Fonları", value: 30, color: "#eab308" },
                    { name: "Para Piyasası Fonları", value: total > 3 ? 0 : 50, color: "#10b981" }
                ]
            };
        }
        
        return {
            title: "Dengeli Karma Portföy",
            persona: "Stratejik Mimar",
            desc: "Risk ve getiri dengesini optimize eden yapı.",
            allocation: [
                { name: "Hisse Senetleri", value: 40, color: "#3b82f6" },
                { name: "Yatırım Fonları", value: 30, color: "#6366f1" },
                { name: "Altın", value: 20, color: "#eab308" },
                { name: "Nakit", value: 10, color: "#64748b" }
            ]
        };
    };

    if (isLoading) return <div className="p-8 text-center animate-pulse">Analiz ediliyor...</div>;

    return (
        <div className="w-full">
            <AnimatePresence mode="wait">
                {!surveyStarted && !recommendation ? (
                    /* Initial Empty State */
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-50 rounded-[2.5rem] p-12 text-center border-2 border-dashed border-slate-200"
                    >
                        <PieChart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-[#00008B] mb-2">Yatırım Profilinizi Belirleyin</h3>
                        <p className="text-sm text-slate-400 font-bold mb-8 max-w-xs mx-auto">Size özel fon ve hisse önerileri için 1 dakikalık testi başlatın.</p>
                        <button 
                            onClick={() => setSurveyStarted(true)}
                            className="px-10 py-4 bg-[#00008B] text-white rounded-2xl font-black text-sm shadow-xl hover:scale-105 transition-all flex items-center gap-2 mx-auto"
                        >
                            Anketi Başlat <Zap className="w-4 h-4 fill-white" />
                        </button>
                    </motion.div>
                ) : surveyStarted && !path ? (
                    /* Step 1: Split Path Choice */
                    <motion.div 
                        key="path-choice"
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                        className="space-y-6"
                    >
                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-black text-[#00008B] italic uppercase">Yatırım Yolunuzu Seçin</h3>
                            <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Fon mu, Hisse mi yoksa her ikisi mi?</p>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Fund Option */}
                            <button 
                                onClick={() => setPath('FUND')}
                                className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all text-left group"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Landmark className="w-6 h-6 text-blue-600" />
                                </div>
                                <h4 className="text-lg font-black text-slate-900 mb-2 uppercase italic">Yatırım Fonları</h4>
                                <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">Uzmanlar yönetsin, ben sadece büyümeyi izleyeyim diyenler için.</p>
                                <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                    Seç ve Devam Et <ArrowRightCircle className="w-4 h-4" />
                                </div>
                            </button>

                            {/* Stock Option */}
                            <button 
                                onClick={() => setPath('STOCK')}
                                className="bg-[#00008B] p-8 rounded-[32px] shadow-2xl hover:scale-[1.02] transition-all text-left group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12" />
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6 border border-white/20">
                                    <Building2 className="w-6 h-6 text-white" />
                                </div>
                                <h4 className="text-lg font-black text-white mb-2 uppercase italic">Hisse Senetleri</h4>
                                <p className="text-xs text-blue-200/60 font-medium leading-relaxed mb-6">Şirketlere doğrudan ortak olayım, kontrol bende olsun diyenler için.</p>
                                <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest">
                                    Seç ve Devam Et <ArrowRightCircle className="w-4 h-4" />
                                </div>
                            </button>
                        </div>
                        
                        <button 
                            onClick={() => setPath('MIXED')}
                            className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-black transition-all"
                        >
                            <LayoutGrid className="w-4 h-4" /> Karma (Dengeli) Yoldan İlerle
                        </button>
                    </motion.div>
                ) : surveyStarted && path ? (
                    /* Step 2: Dynamic Questions */
                    <motion.div 
                        key="survey-steps"
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        className="bg-white border border-slate-100 rounded-[32px] p-10 shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">Soru {currentStep + 1} / {questions.length}</span>
                            <button onClick={() => { setPath(null); setCurrentStep(0); }} className="text-[10px] font-black text-slate-400 uppercase">Geri</button>
                        </div>
                        <h4 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">{questions[currentStep].question}</h4>
                        <div className="space-y-3">
                            {questions[currentStep].options.map((opt, i) => (
                                <button 
                                    key={i}
                                    onClick={() => handleAnswer(opt.score)}
                                    className="w-full text-left p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-500 hover:bg-white transition-all group"
                                >
                                    <div className="font-black text-slate-800 group-hover:text-blue-600">{opt.label}</div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                ) : recommendation ? (
                    /* Step 3: Results */
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm"
                    >
                        {/* Summary Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-[#00008B] tracking-tight">{recommendation.title}</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{recommendation.persona}</p>
                                </div>
                            </div>
                            <button onClick={() => { setRecommendation(null); setSurveyStarted(false); setPath(null); setCurrentStep(0); }} className="p-2 hover:bg-slate-100 rounded-full text-slate-300">
                                <RotateCcw className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Chart and Details */}
                        <div className="grid lg:grid-cols-2 gap-8 items-center">
                            <div className="space-y-4">
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">{recommendation.desc}</p>
                                <div className="grid gap-2">
                                    {recommendation.allocation.map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                                <span className="text-[11px] font-black text-slate-700 uppercase">{item.name}</span>
                                            </div>
                                            <span className="text-xs font-black text-[#00008B]">%{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="h-[180px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPie>
                                        <Pie data={recommendation.allocation} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                            {recommendation.allocation.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </RechartsPie>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <PieChart className="w-5 h-5 text-slate-200" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}

function ArrowRightCircle(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /><path d="m12 16 4-4-4-4" /></svg>
    )
}