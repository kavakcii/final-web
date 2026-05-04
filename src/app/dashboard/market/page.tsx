"use client";

import { useState, useEffect } from "react";
import { 
    ArrowRight, CheckCircle2, ChevronRight, PieChart, ShieldCheck, 
    Target, Zap, RotateCcw, Trophy, Brain, Loader2, X, Info, 
    Building2, Landmark, Scale, LayoutGrid, ArrowLeftRight 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PortfolioService, Asset } from "@/lib/portfolio-service";

type Path = 'FUND' | 'STOCK' | 'MIXED' | null;

export default function MarketPage() {
    const [testStarted, setTestStarted] = useState(false);
    const [path, setPath] = useState<Path>(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Dynamic questions based on chosen path
    const getQuestions = () => {
        const baseQuestions = [
            {
                id: 1,
                question: "Yatırım vadeniz nedir?",
                options: [
                    { label: "Kısa Vade (1 Yıl)", desc: "Hızlı nakit ihtiyacı.", score: 1 },
                    { label: "Orta Vade (1-3 Yıl)", desc: "Birikim odaklı.", score: 2 },
                    { label: "Uzun Vade (3+ Yıl)", desc: "Servet inşası.", score: 3 }
                ]
            }
        ];

        if (path === 'FUND') {
            return [
                ...baseQuestions,
                {
                    id: 2,
                    question: "Fon yönetim ücretleri hakkındaki düşünceniz?",
                    options: [
                        { label: "Maliyet Odaklı", desc: "En düşük ücretli fonları tercih ederim.", score: 1 },
                        { label: "Performans Odaklı", desc: "Getiri yüksekse ücret önemli değil.", score: 3 }
                    ]
                },
                {
                    id: 3,
                    question: "Hangi fon türü ilginizi çekiyor?",
                    options: [
                        { label: "Para Piyasası / Borçlanma", desc: "Düşük riskli, sabit getiri.", score: 1 },
                        { label: "Hisse Senedi Fonları", desc: "Yüksek getiri, yüksek risk.", score: 3 }
                    ]
                }
            ];
        } else if (path === 'STOCK') {
            return [
                ...baseQuestions,
                {
                    id: 2,
                    question: "Hisse seçim stratejiniz nedir?",
                    options: [
                        { label: "Temettü Emekliliği", desc: "Düzenli nakit akışı sağlayan dev şirketler.", score: 1 },
                        { label: "Büyüme Hisseleri", desc: "Yüksek teknoloji ve potansiyelli küçük şirketler.", score: 3 }
                    ]
                },
                {
                    id: 3,
                    question: "Günlük fiyat takibi yapar mısınız?",
                    options: [
                        { label: "Evet, Aktifim", desc: "Fiyat hareketlerine göre aksiyon alırım.", score: 3 },
                        { label: "Hayır, Pasifim", desc: "Alır ve uzun süre unuturum.", score: 1 }
                    ]
                }
            ];
        }

        // Mixed Path default questions
        return [
            ...baseQuestions,
            {
                id: 2,
                question: "Piyasa düşerken tepkiniz ne olur?",
                options: [
                    { label: "Korkarım", desc: "Hemen satış yaparım.", score: 1 },
                    { label: "Fırsat Görürüm", desc: "Ekleme yaparım.", score: 3 }
                ]
            }
        ];
    };

    const questions = getQuestions();

    const handleAnswer = (score: number | string) => {
        const newAnswers = { ...answers, [currentQuestion]: score.toString() };
        setAnswers(newAnswers);

        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(curr => curr + 1);
        } else {
            setShowResults(true);
        }
    };

    return (
        <div className="p-4 md:p-8 min-h-screen bg-[#F8FAFC]">
            <AnimatePresence mode="wait">
                {!testStarted ? (
                    <motion.div 
                        key="intro"
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="max-w-7xl mx-auto space-y-12"
                    >
                        {/* Split Comparison Screen */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
                            {/* VS Icon */}
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden lg:flex w-16 h-16 rounded-full bg-white border-8 border-[#F8FAFC] items-center justify-center shadow-xl">
                                <ArrowLeftRight className="w-6 h-6 text-[#00008B]" />
                            </div>

                            {/* LEFT: FUNDS */}
                            <motion.div 
                                whileHover={{ scale: 1.01 }}
                                className="bg-white rounded-[40px] p-8 md:p-12 border border-slate-100 shadow-sm space-y-8 relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                                        <Landmark className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Yatırım Fonları</h2>
                                </div>
                                <p className="text-slate-500 leading-relaxed font-medium">Profesyonel portföy yöneticileri tarafından yönetilen, binlerce kişinin birikimiyle oluşan dev havuzlar.</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                                        <h4 className="text-emerald-900 font-black text-xs uppercase tracking-widest mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Avantajlar</h4>
                                        <ul className="text-emerald-800 text-sm space-y-2 font-bold opacity-80">
                                            <li>• Profesyonel Yönetim</li>
                                            <li>• Risk Dağılımı (Çeşitlilik)</li>
                                            <li>• Küçük bütçelerle büyük sepet</li>
                                        </ul>
                                    </div>
                                    <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
                                        <h4 className="text-red-900 font-black text-xs uppercase tracking-widest mb-3 flex items-center gap-2"><X className="w-4 h-4" /> Dezavantajlar</h4>
                                        <ul className="text-red-800 text-sm space-y-2 font-bold opacity-80">
                                            <li>• Yönetim Ücretleri</li>
                                            <li>• Kontrol Yöneticidedir</li>
                                            <li>• Alım/Satım Valörü (Süre)</li>
                                        </ul>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => { setPath('FUND'); setTestStarted(true); }}
                                    className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black uppercase tracking-widest text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3"
                                >
                                    Sadece Fonlardan Devam Et <ArrowRight className="w-5 h-5" />
                                </button>
                            </motion.div>

                            {/* RIGHT: STOCKS */}
                            <motion.div 
                                whileHover={{ scale: 1.01 }}
                                className="bg-[#00008B] rounded-[40px] p-8 md:p-12 shadow-2xl space-y-8 relative overflow-hidden group text-white"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                                        <Building2 className="w-8 h-8 text-white" />
                                    </div>
                                    <h2 className="text-3xl font-black tracking-tight italic uppercase">Hisse Senetleri</h2>
                                </div>
                                <p className="text-blue-100/70 leading-relaxed font-medium">Şirketlere doğrudan ortak olarak, büyüme ve temettü potansiyeline doğrudan sahip olma gücü.</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white/10 p-6 rounded-3xl border border-white/10">
                                        <h4 className="text-emerald-300 font-black text-xs uppercase tracking-widest mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Avantajlar</h4>
                                        <ul className="text-emerald-50 text-sm space-y-2 font-bold opacity-80">
                                            <li>• Tam Kontrol</li>
                                            <li>• Temettü Geliri</li>
                                            <li>• Sıfır Yönetim Ücreti</li>
                                        </ul>
                                    </div>
                                    <div className="bg-white/10 p-6 rounded-3xl border border-white/10">
                                        <h4 className="text-red-300 font-black text-xs uppercase tracking-widest mb-3 flex items-center gap-2"><X className="w-4 h-4" /> Dezavantajlar</h4>
                                        <ul className="text-red-50 text-sm space-y-2 font-bold opacity-80">
                                            <li>• Yüksek Volatilite</li>
                                            <li>• Sürekli Takip Gerektirir</li>
                                            <li>• Duygusal Karar Riski</li>
                                        </ul>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => { setPath('STOCK'); setTestStarted(true); }}
                                    className="w-full py-5 bg-white text-[#00008B] rounded-[24px] font-black uppercase tracking-widest text-sm hover:bg-blue-50 transition-all shadow-xl flex items-center justify-center gap-3"
                                >
                                    Sadece Hisselerden Devam Et <ArrowRight className="w-5 h-5" />
                                </button>
                            </motion.div>
                        </div>

                        {/* Middle Action: MIXED */}
                        <div className="flex flex-col items-center gap-6">
                            <button 
                                onClick={() => { setPath('MIXED'); setTestStarted(true); }}
                                className="px-12 py-6 bg-slate-900 text-white rounded-[32px] font-black uppercase tracking-[0.2em] text-sm hover:scale-105 transition-all shadow-2xl flex items-center gap-4 border border-white/20"
                            >
                                <LayoutGrid className="w-6 h-6" /> Her İkisini De İçeren Karma Portföy Kur
                            </button>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                <Info className="w-4 h-4" /> Karar veremiyor musunuz? Karma seçeneği en dengeli olanıdır.
                            </p>
                        </div>

                        {/* Comparison Table */}
                        <div className="max-w-4xl mx-auto bg-white rounded-[40px] border border-slate-100 p-8 md:p-12 shadow-sm overflow-hidden">
                            <h3 className="text-xl font-black text-slate-900 mb-8 uppercase italic flex items-center gap-3">
                                <Scale className="w-6 h-6 text-[#00008B]" /> Profesyonel Karşılaştırma
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-50">
                                            <th className="py-4 text-xs font-black uppercase tracking-widest text-slate-400">Kriter</th>
                                            <th className="py-4 text-xs font-black uppercase tracking-widest text-blue-600">Yatırım Fonu</th>
                                            <th className="py-4 text-xs font-black uppercase tracking-widest text-[#00008B]">Hisse Senedi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {[
                                            ["Yönetim", "Uzman Portföy Yöneticisi", "Yatırımcının Kendisi"],
                                            ["Minimum Tutar", "1 Adet Katılım Payı (Çok Düşük)", "Hisse Fiyatı Kadar"],
                                            ["Gereken Zaman", "Çok Az (Ayda 1 Takip)", "Yüksek (Günlük Takip)"],
                                            ["Vergi Teşviki", "Birçok fonda %0 Stopaj", "Hissede %0 (BIST)"],
                                            ["Çeşitlendirme", "Tek fonla yüzlerce varlık", "Yatırımcı kendi kurmalı"]
                                        ].map(([crit, fund, stock], i) => (
                                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-5 font-black text-slate-900 text-sm">{crit}</td>
                                                <td className="py-5 text-slate-600 text-sm font-medium">{fund}</td>
                                                <td className="py-5 text-slate-600 text-sm font-medium">{stock}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                ) : !showResults ? (
                    <motion.div 
                        key="test"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="max-w-xl mx-auto space-y-8"
                    >
                        {/* Question View */}
                        <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-2xl space-y-8">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-4 py-1.5 rounded-full">
                                    Adım {currentQuestion + 1} / {questions.length}
                                </span>
                                <button onClick={() => setTestStarted(false)} className="text-slate-400 hover:text-slate-900 transition-colors text-xs font-bold uppercase tracking-widest">Geri Dön</button>
                            </div>
                            
                            <h2 className="text-3xl font-black text-slate-900 leading-tight">{questions[currentQuestion].question}</h2>
                            
                            <div className="space-y-4">
                                {questions[currentQuestion].options.map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleAnswer(opt.score)}
                                        className="w-full text-left p-6 rounded-[28px] bg-slate-50 border border-slate-100 hover:border-blue-300 hover:bg-white hover:shadow-xl transition-all group flex items-center justify-between"
                                    >
                                        <div>
                                            <div className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">{opt.label}</div>
                                            <div className="text-xs text-slate-400 font-medium mt-1">{opt.desc}</div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="results"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-4xl mx-auto text-center space-y-8"
                    >
                        <Trophy className="w-20 h-20 text-emerald-500 mx-auto" />
                        <h2 className="text-4xl font-black text-slate-900 uppercase italic">Profiliniz Hazır</h2>
                        <p className="text-slate-500 font-medium">Seçtiğiniz <strong>{path === 'FUND' ? 'FON' : path === 'STOCK' ? 'HİSSE' : 'KARMA'}</strong> yoluna göre size en uygun portföyü hazırladık.</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="px-12 py-5 bg-blue-600 text-white rounded-full font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                        >
                            Sonuçları Gör ve Uygula
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
