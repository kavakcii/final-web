"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Target, ShieldCheck, Zap, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/providers/UserProvider";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const QUESTIONS = [
  {
    id: 1,
    category: "Davranışsal",
    question: "Elinize geçen birikimi nasıl değerlendirirsiniz?",
    type: "choice",
    options: [
      { text: "Tatil ve eğlence için biriktirdiğim parayı harcarım. Bu kadar uzun vadeli bir yatırımı tercih etmem.", score: 1 },
      { text: "Birikimlerimi son model dev ekran bir televizyon için kullanırım. Ev yatırımını şimdilik düşünmem.", score: 2 },
      { text: "İyi bir yatırım fırsatı. Bir miktar kredi kullanıp kemer sıkmam gerekir ama ev için buna değer.", score: 3 }
    ]
  },
  {
    id: 2,
    category: "Davranışsal",
    question: "Tuttuğunuz takımın yöneticisi olsanız önceliğiniz ne olurdu?",
    type: "choice",
    options: [
      { text: "Kulübün geleceğini garanti altına alacak alt yapı oyuncularıyla kadroyu sağlamlaştırmayı tercih ederim.", score: 1 },
      { text: "Kulübümü bu sene şampiyonluğa götürecek stratejik transferler yapılmasını tercih ederim.", score: 2 },
      { text: "Kulübümün önümüzdeki haftaki derbi maçını her ne pahasına olursa olsun kazanmasını isterim.", score: 3 }
    ]
  },
  {
    id: 3,
    category: "Risk Toleransı",
    question: "Yatırım kararlarında risk ve getiri tercihiniz nasıldır?",
    type: "choice",
    options: [
      { text: "Anaparanızın tamamı kadar kesin kazanç.", score: 1 },
      { text: "%25 ihtimal ile anaparanızın 4 katını kazanma ya da %75 ihtimal ile tamamını kaybetme.", score: 2 },
      { text: "%10 ihtimal ile anaparanızın 10 katını kazanma ya da %90 ihtimal ile tamamını kaybetme.", score: 3 }
    ]
  },
  {
    id: 4,
    category: "Davranışsal",
    question: "Beklenmedik bir finansal krizde (örn. işten çıkma) tatil planınızı ne yaparsınız?",
    type: "choice",
    options: [
      { text: "Tatilimi iptal eder, hemen yeni bir iş aramaya başlarım.", score: 1 },
      { text: "Planladığım gibi tatile giderim ancak tatilde ekstra masraflardan kaçınırım.", score: 2 },
      { text: "Tatilimi uzatırım, yeterli birikimim var.", score: 3 }
    ]
  },
  {
    id: 5,
    category: "Davranışsal",
    question: "İşe giderken trafikte sıkıştığınızı fark ettiğinizde ne yaparsınız?",
    type: "choice",
    options: [
      { text: "İşe geç kalacağımı bilsem de bildiğim yoldan devam ederim.", score: 1 },
      { text: "Navigasyonu açıp alternatif yol aramaya başlarım.", score: 2 },
      { text: "Önümdeki aracın saptığı ilk ara yola ben de saparım.", score: 3 }
    ]
  },
  {
    id: 6,
    category: "Risk Toleransı",
    question: "Yeni aldığınız bir varlığın değeri kısa sürede çok artarsa ne yaparsınız?",
    type: "choice",
    options: [
      { text: "Satmayı düşünmem, değerini korusun yeter.", score: 1 },
      { text: "Satar ve kârımı cebime koyarak farklı bir yatırıma yönlendiririm.", score: 2 },
      { text: "Fiyatın daha da yükseleceğini düşündüğümden satmak için beklemeyi tercih ederim.", score: 3 }
    ]
  },
  {
    id: 7,
    category: "Teknoloji",
    question: "Blokzincir ve yeni nesil teknolojilere yatırım bakış açınız nedir?",
    type: "choice",
    options: [
      { text: "Yaygınlaşacağını düşünmediğim için yatırım yapmayı planlamıyorum.", score: 1 },
      { text: "İlgi artıyor ancak çok bilgi sahibi değilim. Yeterli bilgi edindiğimde karar veririm.", score: 2 },
      { text: "Yakın gelecekte günlük hayatımızı şekillendireceğini düşündüğüm için yatırım yaparım.", score: 3 }
    ]
  },
  {
    id: 8,
    category: "Finansal Hedef",
    question: "Yatırımlarınızı ne kadar süreyle (hangi vadede) değerlendirmeyi düşünüyorsunuz?",
    type: "choice",
    options: [
      { text: "Kısa Vade (0 - 1 Yıl) - Paramı her an çekebilirim.", score: 1 },
      { text: "Orta Vade (1 - 3 Yıl) - Birkaç yıl boyunca dokunmayı düşünmüyorum.", score: 2 },
      { text: "Uzun Vade (3 Yıl ve üzeri) - Emekliliğim veya uzun vadeli hedeflerim için.", score: 3 }
    ]
  },
  {
    id: 9,
    category: "Kriz Tepkisi",
    question: "Piyasada sert bir düşüş yaşandı ve portföyünüz %20 değer kaybetti. Ne yaparsınız?",
    type: "choice",
    options: [
      { text: "Daha fazla zarar etmemek için panik yapmadan tüm yatırımlarımı nakde çeviririm.", score: 1 },
      { text: "Piyasaların toparlanmasını bekler, portföyümde hiçbir değişiklik yapmam.", score: 2 },
      { text: "Bu düşüşü bir alım fırsatı olarak görür, ucuzlayan varlıklara daha fazla yatırım yaparım.", score: 3 }
    ]
  },
  {
    id: 10,
    category: "Finansal Hedef",
    question: "FinAi ile yatırıma başlayacağınız ilk tutar ne kadar olacak? (TL)",
    type: "input",
    placeholder: "Örn: 50000"
  },
  {
    id: 11,
    category: "Finansal Hedef",
    question: "Yatırımlarınızı hangi aralıklarla yapmayı planlıyorsunuz?",
    type: "choice",
    options: [
      { text: "Tek Seferlik Toplu Yatırım", score: 0 },
      { text: "Her Ay Düzenli Yatırım", score: 0 },
      { text: "Üç Ayda Bir veya Yıllık Yatırım", score: 0 }
    ]
  },
  {
    id: 12,
    category: "Tercihler",
    question: "Yatırımlarınızda faiz hassasiyetiniz (İslami finans prensiplerine uygunluk) var mı?",
    type: "choice",
    options: [
      { text: "Evet, sadece faizsiz Katılım enstrümanlarına (Kira sertifikası, Altın, Katılım Endeksi) yatırım yaparım.", score: 0 },
      { text: "Hayır, böyle bir hassasiyetim yok. Tüm piyasa enstrümanlarını değerlendirebilirim.", score: 0 }
    ]
  }
];

export default function RiskTestPage() {
  const router = useRouter();
  const { user } = useUser();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [direction, setDirection] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [resultProfile, setResultProfile] = useState<{title: string, desc: string, icon: any, color: string, score: number} | null>(null);

  const currentQ = QUESTIONS[currentStep];
  const progress = ((currentStep) / QUESTIONS.length) * 100;

  const handleSelectOption = (score: number, text: string) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: { score, text } }));
    setTimeout(() => handleNext(), 400); // Otomatik geçiş
  };

  const handleInputNext = (val: string) => {
    if (!val) return;
    setAnswers(prev => ({ ...prev, [currentQ.id]: { text: val, score: 0 } }));
    handleNext();
  };

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    } else {
      finishTest();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    } else {
        router.push("/dashboard");
    }
  };

  const finishTest = async () => {
    setIsCompleted(true);
    setIsSaving(true);
    
    // Puan hesaplama (1'den 9'a kadar olan sorular)
    let totalScore = 0;
    for (let i = 1; i <= 9; i++) {
        totalScore += (answers[i]?.score || 0);
    }

    let profile = { title: "", desc: "", icon: ShieldCheck, color: "", score: totalScore };
    
    try {
        const aiResponse = await fetch("/api/ai-portfolio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answers })
        });
        const aiData = await aiResponse.json();
        
        if (aiData.profileName === "Defansif Stratejist") {
            profile = { title: aiData.profileName, desc: aiData.aiAnalysis, icon: ShieldCheck, color: "text-emerald-500", score: totalScore };
        } else if (aiData.profileName === "Optimum Denge") {
            profile = { title: aiData.profileName, desc: aiData.aiAnalysis, icon: Target, color: "text-blue-500", score: totalScore };
        } else {
            profile = { title: aiData.profileName, desc: aiData.aiAnalysis, icon: Zap, color: "text-purple-500", score: totalScore };
        }

        setResultProfile(profile);

        // Supabase'e kaydet
        if (user?.id) {
            await supabase.auth.updateUser({
                data: {
                    riskProfile: profile.title,
                    riskScore: totalScore,
                    investmentAmount: answers[10]?.text || "Belirtilmedi",
                    investmentPeriod: answers[11]?.text || "Belirtilmedi",
                    isIslamicFinance: answers[12]?.text?.includes("Evet") || false,
                    aiPortfolio: aiData,
                    hasCompletedTest: true
                }
            });
        }
    } catch (error) {
        console.error("AI Profil hesaplanırken hata:", error);
    }
    
    setIsSaving(false);
  };

  const pageVariants: any = {
    initial: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    animate: { x: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
    exit: (direction: number) => ({ x: direction > 0 ? -50 : 50, opacity: 0, transition: { duration: 0.3 } })
  };

  // Sonuç Ekranı
  if (isCompleted && resultProfile) {
    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-slate-50 items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-100/50 blur-[120px] pointer-events-none" />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-2xl bg-white border border-slate-100 rounded-[3rem] p-10 md:p-14 shadow-2xl text-center relative z-10"
            >
                <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-slate-50 border-4 border-white shadow-xl flex items-center justify-center">
                    <resultProfile.icon className={cn("w-12 h-12", resultProfile.color)} />
                </div>
                
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-2">SİZE EN UYGUN PROFİL</h3>
                <h1 className={cn("text-4xl md:text-5xl font-black mb-6 tracking-tight", resultProfile.color)}>
                    {resultProfile.title}
                </h1>
                
                <p className="text-slate-600 font-medium leading-relaxed mb-10 max-w-lg mx-auto">
                    {resultProfile.desc}
                </p>

                <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-10 p-6 bg-slate-50 rounded-3xl">
                    <div className="flex flex-col gap-1">
                        <span>Risk Skoru</span>
                        <span className="text-2xl text-slate-800">{resultProfile.score} <span className="text-sm text-slate-400">/ 27</span></span>
                    </div>
                    <div className="w-px h-10 bg-slate-200 mx-4" />
                    <div className="flex flex-col gap-1">
                        <span>Başlangıç</span>
                        <span className="text-2xl text-slate-800">{answers[10]?.text || "-"} <span className="text-sm text-slate-400">TL</span></span>
                    </div>
                </div>

                <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-[#00008B] text-white rounded-2xl text-sm font-bold tracking-[0.15em] uppercase shadow-xl shadow-[#00008B]/20 hover:-translate-y-1 transition-transform group">
                    Kontrol Paneline Dön
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
            </motion.div>
        </div>
    );
  }

  // Test Ekranı
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-white text-[#00008B] w-full relative overflow-hidden">
        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-100 absolute top-0 left-0 z-50">
            <motion.div 
                className="h-full bg-gradient-to-r from-blue-500 to-[#00008B]" 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
            />
        </div>

        <div className="flex-1 w-full max-w-3xl mx-auto px-6 py-12 md:py-20 flex flex-col relative z-10">
            <button onClick={handleBack} className="self-start flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-[#00008B] transition-colors uppercase tracking-widest mb-12">
                <ChevronLeft className="w-4 h-4" />
                {currentStep === 0 ? "İptal Et" : "Geri Dön"}
            </button>

            <div className="flex-1 relative">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentStep}
                        custom={direction}
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="w-full"
                    >
                        <div className="mb-10">
                            <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-[#00008B] text-[10px] font-black uppercase tracking-widest mb-6">
                                Soru {currentStep + 1} / {QUESTIONS.length} • {currentQ.category}
                            </span>
                            <h2 className="text-3xl md:text-4xl font-black text-slate-800 leading-tight tracking-tight">
                                {currentQ.question}
                            </h2>
                        </div>

                        {currentQ.type === "choice" && (
                            <div className="flex flex-col gap-4">
                                {currentQ.options?.map((opt, idx) => {
                                    const isSelected = answers[currentQ.id]?.text === opt.text;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleSelectOption(opt.score, opt.text)}
                                            className={cn(
                                                "text-left p-6 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group",
                                                isSelected 
                                                    ? "border-[#00008B] bg-blue-50/50" 
                                                    : "border-slate-100 hover:border-[#00008B]/30 hover:bg-slate-50"
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-4 relative z-10">
                                                <span className={cn("text-base font-medium", isSelected ? "text-[#00008B] font-bold" : "text-slate-600")}>
                                                    {opt.text}
                                                </span>
                                                <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors", isSelected ? "border-[#00008B] bg-[#00008B]" : "border-slate-200")}>
                                                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {currentQ.type === "input" && (
                            <div className="flex flex-col gap-6">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                        <span className="text-2xl font-black text-slate-300">₺</span>
                                    </div>
                                    <input 
                                        type="number" 
                                        placeholder={currentQ.placeholder}
                                        value={answers[currentQ.id]?.text || ""}
                                        onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: { text: e.target.value, score: 0 } }))}
                                        className="w-full pl-14 pr-6 py-6 rounded-3xl border-2 border-slate-100 focus:border-[#00008B] focus:ring-4 focus:ring-[#00008B]/10 outline-none text-3xl font-black text-[#00008B] transition-all bg-slate-50/50"
                                        autoFocus
                                    />
                                </div>
                                <button 
                                    onClick={() => handleInputNext(answers[currentQ.id]?.text)}
                                    disabled={!answers[currentQ.id]?.text}
                                    className="w-full flex items-center justify-center gap-2 py-5 bg-[#00008B] disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl text-sm font-bold tracking-[0.15em] uppercase shadow-xl shadow-[#00008B]/20 transition-all"
                                >
                                    Devam Et
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    </div>
  );
}
