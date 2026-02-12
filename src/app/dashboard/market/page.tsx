"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, ChevronRight, PieChart, ShieldCheck, Target, Zap, RotateCcw, Trophy, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function MarketPage() {
    const [testStarted, setTestStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);

    const questions = [
        {
            id: 1,
            question: "Yatırım hedefiniz nedir?",
            emoji: "🎯",
            options: [
                { label: "Sermaye Koruma", desc: "Paramın değerini korumak önceliğim.", icon: "🛡️" },
                { label: "Dengeli Büyüme", desc: "Hem büyüme hem koruma istiyorum.", icon: "⚖️" },
                { label: "Agresif Büyüme", desc: "Maksimum getiri için riske hazırım.", icon: "🚀" }
            ]
        },
        {
            id: 2,
            question: "Yatırım süreniz ne kadar?",
            emoji: "⏳",
            options: [
                { label: "0–1 Yıl", desc: "Kısa vadeli düşünüyorum.", icon: "🏃" },
                { label: "1–3 Yıl", desc: "Orta vadeli hedeflerim var.", icon: "🚶" },
                { label: "3+ Yıl", desc: "Uzun vadeli yatırımcıyım.", icon: "🧘" }
            ]
        },
        {
            id: 3,
            question: "Risk toleransınız?",
            emoji: "🎢",
            options: [
                { label: "Düşük", desc: "Kaybetmeye tahammülüm yok.", icon: "🧊" },
                { label: "Orta", desc: "Makul dalgalanmaları kabul ederim.", icon: "🌊" },
                { label: "Yüksek", desc: "Büyük düşüşler beni korkutmaz.", icon: "🔥" }
            ]
        },
        {
            id: 4,
            question: "Piyasa dalgalanmalarına tepkiniz?",
            emoji: "😱",
            options: [
                { label: "Çok Endişeli", desc: "Hemen satıp çıkmak isterim.", icon: "😰" },
                { label: "Biraz Endişeli", desc: "Takip ederim ama panik yapmam.", icon: "🤔" },
                { label: "Rahat", desc: "Fırsat olarak görürüm.", icon: "😎" }
            ]
        },
        {
            id: 5,
            question: "Deneyim seviyeniz?",
            emoji: "🧠",
            options: [
                { label: "Yeni", desc: "Daha önce hiç yatırım yapmadım.", icon: "👶" },
                { label: "Orta", desc: "Temel bilgilere sahibim.", icon: "🧑‍🎓" },
                { label: "İleri", desc: "Piyasaları yakından takip ederim.", icon: "👨‍💼" }
            ]
        }
    ];

    const handleAnswer = (answer: string) => {
        setAnswers({ ...answers, [currentQuestion]: answer });
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(curr => curr + 1);
        } else {
            setShowResults(true);
        }
    };

    const getPortfolioRecommendation = () => {
        let score = 0;
        Object.values(answers).forEach(a => {
            if (a.includes("Agresif") || a.includes("3+") || a.includes("Yüksek") || a.includes("Rahat") || a.includes("İleri")) score += 2;
            else if (a.includes("Dengeli") || a.includes("1–3") || a.includes("Orta")) score += 1;
        });

        if (score >= 8) {
            return {
                title: "Agresif Büyüme Portföyü",
                persona: "Cesur Kaşif 🦁",
                desc: "Risk almaktan korkmayan, uzun vadeli ve yüksek getiri hedefleyen bir yatırımcısınız.",
                allocation: [
                    { name: "Hisse Senetleri", value: 60, color: "#3b82f6" },
                    { name: "Yatırım Fonları", value: 20, color: "#6366f1" },
                    { name: "Emtia / Altın", value: 10, color: "#eab308" },
                    { name: "Nakit", value: 10, color: "#64748b" }
                ]
            };
        } else if (score >= 4) {
            return {
                title: "Dengeli Portföy",
                persona: "Stratejik Mimar 🦉",
                desc: "Hem kazanmak hem de korumak isteyen, akılcı ve planlı bir yatırımcısınız.",
                allocation: [
                    { name: "Hisse Senetleri", value: 40, color: "#3b82f6" },
                    { name: "Tahvil / Bono", value: 30, color: "#22c55e" },
                    { name: "Altın", value: 20, color: "#eab308" },
                    { name: "Nakit", value: 10, color: "#64748b" }
                ]
            };
        } else {
            return {
                title: "Koruyucu Portföy",
                persona: "Güvenli Liman 🐢",
                desc: "Önceliği elindekini korumak olan, riskten kaçınan temkinli bir yatırımcısınız.",
                allocation: [
                    { name: "Tahvil / Bono", value: 50, color: "#22c55e" },
                    { name: "Altın", value: 30, color: "#eab308" },
                    { name: "Hisse (Temettü)", value: 10, color: "#3b82f6" },
                    { name: "Nakit", value: 10, color: "#64748b" }
                ]
            };
        }
    };

    const recommendation = showResults ? getPortfolioRecommendation() : null;

    return (
        <div className="p-6 h-full flex flex-col items-center justify-center min-h-[600px] overflow-hidden">
            <AnimatePresence mode="wait">
                {!testStarted ? (
                    <motion.div 
                        key="intro"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center max-w-2xl relative"
                    >
                        <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>

                        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-500/10 border border-white/10 backdrop-blur-sm">
                            <span className="text-5xl">🧭</span>
                        </div>
                        <h1 className="text-5xl font-bold text-white mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                            Yatırım Pusulanızı Bulun
                        </h1>
                        <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                            Sadece 1 dakikada risk profilinizi analiz edelim ve size en uygun <span className="text-blue-400 font-bold">bilimsel portföy dağılımını</span> sunalım.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 text-left">
                            <div className="bg-white/5 p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="text-3xl mb-3">🎯</div>
                                <h3 className="font-bold text-white">Hedef Odaklı</h3>
                                <p className="text-xs text-slate-400 mt-1">Hayallerinize giden en kısa yol.</p>
                            </div>
                            <div className="bg-white/5 p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="text-3xl mb-3">🛡️</div>
                                <h3 className="font-bold text-white">Güvenli</h3>
                                <p className="text-xs text-slate-400 mt-1">Risk toleransınıza %100 uyumlu.</p>
                            </div>
                            <div className="bg-white/5 p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="text-3xl mb-3">⚡</div>
                                <h3 className="font-bold text-white">Hızlı</h3>
                                <p className="text-xs text-slate-400 mt-1">Karmaşık terimler yok, sadece sonuç.</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => setTestStarted(true)}
                            className="group relative px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xl transition-all hover:scale-105 flex items-center gap-3 mx-auto shadow-2xl shadow-blue-900/40 overflow-hidden"
                        >
                            <span className="relative z-10">Teste Başla</span>
                            <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform" />
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[length:200%_auto] animate-gradient"></div>
                        </button>
                    </motion.div>
                ) : !showResults ? (
                    <motion.div 
                        key="question"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="w-full max-w-xl"
                    >
                        <div className="mb-8">
                            <div className="flex justify-between text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
                                <span>Adım {currentQuestion + 1} / {questions.length}</span>
                                <span>{questions[currentQuestion].emoji}</span>
                            </div>
                            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
                                <motion.div 
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                    initial={{ width: `${((currentQuestion) / questions.length) * 100}%` }}
                                    animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold text-white mb-8 leading-tight">
                            {questions[currentQuestion].question}
                        </h2>

                        <div className="space-y-4">
                            {questions[currentQuestion].options.map((opt, idx) => (
                                <motion.button
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    onClick={() => handleAnswer(opt.label)}
                                    className="w-full text-left p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 transition-all group flex items-center gap-4 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <div className="text-4xl bg-white/5 p-3 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                                        {opt.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">
                                            {opt.label}
                                        </div>
                                        <div className="text-sm text-slate-400 mt-1 font-medium">
                                            {opt.desc}
                                        </div>
                                    </div>
                                    <ChevronRight className="w-6 h-6 text-slate-500 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="results"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-5xl"
                    >
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 px-6 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-bold mb-6 border border-green-500/30 shadow-lg shadow-green-900/20">
                                <Trophy className="w-4 h-4" />
                                Analiz Tamamlandı
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                {recommendation?.title}
                            </h2>
                            <div className="text-2xl font-medium text-blue-400 mb-4 bg-blue-500/10 inline-block px-4 py-2 rounded-lg border border-blue-500/20">
                                {recommendation?.persona}
                            </div>
                            <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
                                {recommendation?.desc}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                            {/* Chart Visualization (Recharts Pie) */}
                            <div className="bg-slate-900/80 backdrop-blur-sm rounded-3xl p-8 border border-white/10 shadow-2xl flex flex-col items-center justify-center min-h-[400px]">
                                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                    <PieChart className="w-5 h-5 text-blue-400" />
                                    Önerilen Dağılım
                                </h3>
                                <div className="w-full h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPie
                                            data={recommendation?.allocation}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={110}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {recommendation?.allocation.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                        </RechartsPie>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-2 gap-4 w-full mt-4">
                                    {recommendation?.allocation.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                                            <div className="flex justify-between w-full text-sm">
                                                <span className="text-slate-300 font-medium">{item.name}</span>
                                                <span className="text-white font-bold">%{item.value}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Card */}
                            <div className="bg-gradient-to-br from-blue-900/40 to-slate-900 border border-blue-500/30 rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                        <Target className="w-6 h-6 text-blue-400" />
                                        Nasıl Başlamalı?
                                    </h3>
                                    <ul className="space-y-6 mb-8">
                                        <li className="flex items-start gap-4 text-slate-300">
                                            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 font-bold border border-blue-500/30">1</div>
                                            <div>
                                                <span className="text-white font-bold block mb-1">Dağılımı Uygula</span>
                                                Önerilen oranlara sadık kalarak portföyünüzü çeşitlendirin.
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-4 text-slate-300">
                                            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 font-bold border border-blue-500/30">2</div>
                                            <div>
                                                <span className="text-white font-bold block mb-1">Fonları İncele</span>
                                                Piyasa Analizi sayfasından ilgili kategorideki fonları (Örn: IPJ, TCD) araştırın.
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-4 text-slate-300">
                                            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 font-bold border border-blue-500/30">3</div>
                                            <div>
                                                <span className="text-white font-bold block mb-1">Sabırlı Ol</span>
                                                Uzun vadeli düşünün ve panik satışlardan kaçının.
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                                
                                <button 
                                    onClick={() => {
                                        setTestStarted(false);
                                        setCurrentQuestion(0);
                                        setShowResults(false);
                                        setAnswers({});
                                    }}
                                    className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all border border-white/10 flex items-center justify-center gap-2 hover:scale-[1.02]"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                    Testi Tekrarla
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
