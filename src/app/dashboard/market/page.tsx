"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, ChevronRight, PieChart, ShieldCheck, Target, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MarketPage() {
    const [testStarted, setTestStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);

    const questions = [
        {
            id: 1,
            question: "Yatırım hedefiniz nedir?",
            options: [
                { label: "Sermaye Koruma", desc: "Paramın değerini korumak önceliğim." },
                { label: "Dengeli Büyüme", desc: "Hem büyüme hem koruma istiyorum." },
                { label: "Agresif Büyüme", desc: "Maksimum getiri için riske hazırım." }
            ]
        },
        {
            id: 2,
            question: "Yatırım süreniz ne kadar?",
            options: [
                { label: "0–1 Yıl", desc: "Kısa vadeli düşünüyorum." },
                { label: "1–3 Yıl", desc: "Orta vadeli hedeflerim var." },
                { label: "3+ Yıl", desc: "Uzun vadeli yatırımcıyım." }
            ]
        },
        {
            id: 3,
            question: "Risk toleransınız?",
            options: [
                { label: "Düşük", desc: "Kaybetmeye tahammülüm yok." },
                { label: "Orta", desc: "Makul dalgalanmaları kabul ederim." },
                { label: "Yüksek", desc: "Büyük düşüşler beni korkutmaz." }
            ]
        },
        {
            id: 4,
            question: "Piyasa dalgalanmalarına tepkiniz?",
            options: [
                { label: "Çok Endişeli", desc: "Hemen satıp çıkmak isterim." },
                { label: "Biraz Endişeli", desc: "Takip ederim ama panik yapmam." },
                { label: "Rahat", desc: "Fırsat olarak görürüm." }
            ]
        },
        {
            id: 5,
            question: "Deneyim seviyeniz?",
            options: [
                { label: "Yeni", desc: "Daha önce hiç yatırım yapmadım." },
                { label: "Orta", desc: "Temel bilgilere sahibim." },
                { label: "İleri", desc: "Piyasaları yakından takip ederim." }
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
        // Simple logic based on answers (can be enhanced)
        // Count aggressive vs conservative answers
        let score = 0;
        Object.values(answers).forEach(a => {
            if (a.includes("Agresif") || a.includes("3+") || a.includes("Yüksek") || a.includes("Rahat") || a.includes("İleri")) score += 2;
            else if (a.includes("Dengeli") || a.includes("1–3") || a.includes("Orta")) score += 1;
        });

        if (score >= 8) {
            return {
                title: "Agresif Büyüme Portföyü",
                desc: "Yüksek getiri potansiyeli için tasarlanmış, hisse senedi ağırlıklı dinamik bir portföy.",
                allocation: [
                    { name: "Hisse Senetleri (Yerli/Yabancı)", percent: 60, color: "bg-blue-500" },
                    { name: "Yatırım Fonları (Değişken/Hisse)", percent: 20, color: "bg-indigo-500" },
                    { name: "Emtia / Altın", percent: 10, color: "bg-yellow-500" },
                    { name: "Nakit / Mevduat", percent: 10, color: "bg-slate-500" }
                ]
            };
        } else if (score >= 4) {
            return {
                title: "Dengeli Portföy",
                desc: "Risk ve getiri dengesini gözeten, çeşitlendirilmiş modern bir portföy.",
                allocation: [
                    { name: "Hisse Senetleri", percent: 40, color: "bg-blue-500" },
                    { name: "Tahvil / Bono", percent: 30, color: "bg-green-500" },
                    { name: "Altın / Kıymetli Madenler", percent: 20, color: "bg-yellow-500" },
                    { name: "Nakit", percent: 10, color: "bg-slate-500" }
                ]
            };
        } else {
            return {
                title: "Koruyucu Portföy",
                desc: "Sermaye koruma odaklı, düşük volatiliteli ve düzenli getiri hedefleyen portföy.",
                allocation: [
                    { name: "Tahvil / Bono / Mevduat", percent: 50, color: "bg-green-500" },
                    { name: "Altın", percent: 30, color: "bg-yellow-500" },
                    { name: "Hisse Senetleri (Temettü)", percent: 10, color: "bg-blue-500" },
                    { name: "Nakit", percent: 10, color: "bg-slate-500" }
                ]
            };
        }
    };

    const recommendation = showResults ? getPortfolioRecommendation() : null;

    return (
        <div className="p-6 h-full flex flex-col items-center justify-center min-h-[600px]">
            <AnimatePresence mode="wait">
                {!testStarted ? (
                    <motion.div 
                        key="intro"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center max-w-2xl"
                    >
                        <div className="bg-blue-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <PieChart className="w-10 h-10 text-blue-400" />
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-4">
                            Size Özel Portföy Dağılımını Bulun
                        </h1>
                        <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                            Her yatırımcı farklı hedeflere, risk algısına ve zamana sahip. 
                            Kısa bir testle ihtiyaçlarınızı anlayıp sizin için en uygun portföy dağılım oranlarını önerelim. 
                            Bilime dayalı, sade ve kişiselleştirilmiş önerilerle daha güvenli adımlar atın.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 text-left">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <Target className="w-6 h-6 text-emerald-400 mb-2" />
                                <h3 className="font-semibold text-white">Hedef Odaklı</h3>
                                <p className="text-xs text-slate-400 mt-1">Sizin hedefleriniz için optimize edilmiş.</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <ShieldCheck className="w-6 h-6 text-blue-400 mb-2" />
                                <h3 className="font-semibold text-white">Risk Yönetimi</h3>
                                <p className="text-xs text-slate-400 mt-1">Toleransınıza uygun dengeli dağılım.</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <Zap className="w-6 h-6 text-yellow-400 mb-2" />
                                <h3 className="font-semibold text-white">Hızlı & Kolay</h3>
                                <p className="text-xs text-slate-400 mt-1">Sadece 1 dakikada sonuç alın.</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => setTestStarted(true)}
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg transition-all hover:scale-105 flex items-center gap-2 mx-auto shadow-lg shadow-blue-900/20"
                        >
                            Teste Başla
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </motion.div>
                ) : !showResults ? (
                    <motion.div 
                        key="question"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full max-w-xl"
                    >
                        <div className="mb-8">
                            <div className="flex justify-between text-xs text-slate-400 mb-2">
                                <span>Soru {currentQuestion + 1}/{questions.length}</span>
                                <span>%{(currentQuestion / questions.length) * 100} Tamamlandı</span>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-500 transition-all duration-500 ease-out"
                                    style={{ width: `${((currentQuestion) / questions.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-6">
                            {questions[currentQuestion].question}
                        </h2>

                        <div className="space-y-3">
                            {questions[currentQuestion].options.map((opt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(opt.label)}
                                    className="w-full text-left p-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                                                {opt.label}
                                            </div>
                                            <div className="text-sm text-slate-400 mt-1">
                                                {opt.desc}
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="results"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-4xl"
                    >
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-full text-sm font-medium mb-4 border border-green-500/20">
                                <CheckCircle2 className="w-4 h-4" />
                                Analiz Tamamlandı
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">
                                Sonuç: {recommendation?.title}
                            </h2>
                            <p className="text-slate-400 max-w-xl mx-auto">
                                {recommendation?.desc}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            {/* Chart Visualization (Simple CSS Bars) */}
                            <div className="bg-slate-900 rounded-2xl p-8 border border-white/10 shadow-xl">
                                <div className="space-y-6">
                                    {recommendation?.allocation.map((item, idx) => (
                                        <div key={idx}>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="font-medium text-white">{item.name}</span>
                                                <span className="text-slate-400">{item.percent}%</span>
                                            </div>
                                            <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${item.percent}%` }}
                                                    transition={{ duration: 1, delay: 0.2 + (idx * 0.1) }}
                                                    className={`h-full ${item.color}`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Card */}
                            <div className="bg-gradient-to-br from-blue-900/50 to-slate-900 border border-blue-500/30 rounded-2xl p-8">
                                <h3 className="text-xl font-bold text-white mb-4">
                                    Nasıl Başlamalı?
                                </h3>
                                <ul className="space-y-4 mb-8">
                                    <li className="flex items-start gap-3 text-slate-300 text-sm">
                                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 text-xs font-bold">1</div>
                                        Önerilen oranlara yakın bir dağılım hedefleyin.
                                    </li>
                                    <li className="flex items-start gap-3 text-slate-300 text-sm">
                                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 text-xs font-bold">2</div>
                                        Tek bir varlığa tüm paranızı yatırmaktan kaçının.
                                    </li>
                                    <li className="flex items-start gap-3 text-slate-300 text-sm">
                                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 text-xs font-bold">3</div>
                                        Piyasa Analizi sayfamızdan ilgili fon ve hisseleri detaylı inceleyin.
                                    </li>
                                </ul>
                                
                                <button 
                                    onClick={() => {
                                        setTestStarted(false);
                                        setCurrentQuestion(0);
                                        setShowResults(false);
                                        setAnswers({});
                                    }}
                                    className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors border border-white/10"
                                >
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
