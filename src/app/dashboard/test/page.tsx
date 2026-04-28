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
    category: "Yatırım Vadesi (Horizon)",
    question: "Oluşturacağımız bu portföydeki sermayenizi ne kadar süreyle piyasada tutmayı hedefliyorsunuz?",
    type: "choice",
    options: [
      { text: "Kısa Vade (0-1 Yıl) - Beklenmedik nakit ihtiyaçlarım doğabilir, likidite esnekliği benim için kritiktir.", score: 1 },
      { text: "Orta Vade (1-3 Yıl) - Paraya yakın zamanda ihtiyacım olmayacak, stratejik fırsatların olgunlaşmasını bekleyebilirim.", score: 2 },
      { text: "Uzun Vade (3 Yıl ve Üzeri) - Bu tamamen geleceğe yatırımdır. Kısa vadeli döngüleri umursamadan bileşik getiri hedeflerim.", score: 3 }
    ]
  },
  {
    id: 2,
    category: "Maksimum Kayıp Töleransı (Drawdown Limit)",
    question: "Piyasalarda yaşanabilecek şiddetli bir düzeltme hareketinde, portföyünüzün geçici olarak yüzde kaç değer kaybetmesini tolere edebilirsiniz?",
    type: "choice",
    options: [
      { text: "Maksimum %5 - %10 | Sermayemi korumak önceliğimdir. Uykularımı kaçıracak dalgalanmalardan kesinlikle uzak durmak isterim.", score: 1 },
      { text: "Maksimum %15 - %25 | Makul oranda riski kabul ediyorum. Kalıcı getiri için geçici dalgalanmaları göğüsleyebilirim.", score: 2 },
      { text: "%30 ve Üzeri | Yüksek getiri için yüksek riski alırım. Kriz anlarında bile stratejime sadık kalarak satmam, gerekirse ekleme yaparım.", score: 3 }
    ]
  },
  {
    id: 3,
    category: "Getiri Modeli ve Nakit Akışı",
    question: "Yatırımlarınızın size nasıl bir dönüş sağlamasını tercih edersiniz?",
    type: "choice",
    options: [
      { text: "Düzenli Nakit Akışı (Pasif Gelir) - Şirketlerden kâr payı (temettü) veya tahvillerden düzenli kupon ödemesi almayı hedeflerim.", score: 1 },
      { text: "Dengeli Karma - Hem düzenli nakit akışı olsun hem de portföyümün anaparası enflasyon üzerinde büyümeye devam etsin.", score: 2 },
      { text: "Maksimum Sermaye Büyümesi - Nakit akışına ihtiyacım yok. Tüm kâr yatırıma dönerek şirketin piyasa değerinin agresif büyümesine yansısın.", score: 3 }
    ]
  },
  {
    id: 4,
    category: "Makroekonomik Beklenti ve Korunma",
    question: "Olası bir ekonomik daralma (resesyon) ve kur şoku senaryosunda, şirketlerin hangi finansal veya operasyonel özelliğine daha çok güvenirsiniz?",
    type: "choice",
    options: [
      { text: "Zorunlu Tüketim (Defansif) - Sadece zorunlu ihtiyaç ürünleri satmasına ve krizde bile talebin asla sıfırlanmamasına.", score: 1 },
      { text: "Döviz Pozisyonu (İhracat) - Yurt dışına satış yaparak güçlü döviz geliri elde etmesine ve kur şoklarından korunmasına.", score: 2 },
      { text: "Stratejik Tekel - Devlet destekli, sektöründe tekel (fiyat belirleyici) konumunda veya vazgeçilmez bir altyapı sunmasına.", score: 3 }
    ]
  },
  {
    id: 5,
    category: "Şirket Değerleme Felsefesi (Value vs Growth)",
    question: "Bir şirkete uzun vadeli ortak olacaksanız, şirketin finansal rasyoları ve politikası nasıl olmalıdır?",
    type: "choice",
    options: [
      { text: "Değer (Value) ve Temettü - Varlıklarına göre ucuz kalmış (Düşük PD/DD), istikrarlı ve düzenli nakit (temettü) dağıtan köklü şirketler.", score: 1 },
      { text: "Reel Varlık Koruma - Sahip olduğu fiziksel üretim tesisleri, arsalar ve gayrimenkuller ile enflasyona karşı somut/fiziki koruma sağlayan şirketler.", score: 2 },
      { text: "Büyüme (Growth) ve İnovasyon - Kâr dağıtmak yerine tüm gelirini Ar-Ge'ye harcayan, agresif ve devasa büyüme çarpanına sahip şirketler.", score: 3 }
    ]
  },
  {
    id: 6,
    category: "Kriz Yönetimi (Reaksiyon)",
    question: "Küresel bir ekonomik kriz haberiyle borsa endeksleri bir haftada %15 düştüğünde ilk tepkiniz ne olur?",
    type: "choice",
    options: [
      { text: "Derhal zararı keser, kalan paramı nakde veya tamamen güvenli limanlara (altın/para piyasası) park ederim.", score: 1 },
      { text: "Hiçbir şey yapmam. Portföyümün çeşitlendirmesine güvenir ve fırtınanın dinmesini beklerim.", score: 2 },
      { text: "Mükemmel bir alım fırsatı! Kenardaki nakdimi kullanarak maliyet düşürür ve iskontolu hisseleri toplarım.", score: 3 }
    ]
  },
  {
    id: 7,
    category: "Yatırım Psikolojisi",
    question: "Aşağıdaki ifadelerden hangisi sizin yatırımcı kimliğinizi en iyi yansıtır?",
    type: "choice",
    options: [
      { text: "Kaybetme korkum, kazanma arzumdan çok daha ağır basar. Güvende hissetmek benim için en kritik noktadır.", score: 1 },
      { text: "Rasyonel ve analitik düşünürüm. Risk ile getiriyi bir teraziye koyar, matematiğin gösterdiği optimum yoldan ilerlerim.", score: 2 },
      { text: "Büyük oynamayı severim. Risk almadan sıradanlıktan kurtulunamayacağını bilir, cesur pozisyonlar almaktan çekinmem.", score: 3 }
    ]
  },
  {
    id: 8,
    category: "Etik ve Katılım Finans Prensipleri",
    question: "Yatırım kararlarınızda İslami finans kurallarına (faizsiz enstrümanlar) uyum hassasiyetiniz var mı?",
    type: "choice",
    options: [
      { text: "Evet, Kesinlikle. Sadece faizsiz ve katılım esaslarına (Kira sertifikası, Katılım hisseleri) %100 uyumlu portföy oluşturulmalı.", score: 1 },
      { text: "Hayır, böyle bir kısıtlamam yok. Portföyümü maksimize edecek tüm küresel ve yerel finansal araçlar değerlendirilebilir.", score: 2 }
    ]
  },
  {
    id: 9,
    category: "Yatırım Yönetim Modeli",
    question: "Oluşturulacak portföyün yönetimi konusunda nasıl bir otomasyon bekliyorsunuz?",
    type: "choice",
    options: [
      { text: "Tam Otonom - Portföyümüze FinAi algoritmaları ve profesyonel yöneticiler baksın. Ben günlük ekran izlemek istemiyorum.", score: 1 },
      { text: "Dinamik Aktif - Ara sıra trend değişikliklerini görmek, stratejik bildirimler almak ve müdahale etmek hoşuma gider.", score: 2 }
    ]
  },
  {
    id: 10,
    category: "Sermaye Alokasyonu",
    question: "FinAi zeki kural motorunun sizin için yapılandıracağı bu profesyonel portföye ne kadarlık bir başlangıç sermayesi tahsis etmeyi planlıyorsunuz?",
    type: "input",
    placeholder: "Örn: 250000"
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
    setTimeout(() => handleNext(), 400); 
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
    
    // Calculate a basic risk score for visual UI purpose. 
    // The actual heavy lifting is now done inside the new API.
    let totalScore = 0;
    for (let i = 1; i <= 7; i++) {
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

        if (user?.id) {
            await supabase.auth.updateUser({
                data: {
                    riskProfile: profile.title,
                    riskScore: totalScore,
                    investmentAmount: answers[10]?.text || "Belirtilmedi",
                    isIslamicFinance: answers[8]?.text?.includes("Evet") || false,
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
                
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Zeki Motor Tarafından Tasarlandı</h3>
                <h1 className={cn("text-4xl md:text-5xl font-black mb-6 tracking-tight", resultProfile.color)}>
                    {resultProfile.title}
                </h1>
                
                <p className="text-slate-600 font-medium leading-relaxed mb-10 max-w-lg mx-auto">
                    {resultProfile.desc}
                </p>

                <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-10 p-6 bg-slate-50 rounded-3xl">
                    <div className="flex flex-col gap-1">
                        <span>Puan</span>
                        <span className="text-2xl text-slate-800">{resultProfile.score} <span className="text-sm text-slate-400">/ 21</span></span>
                    </div>
                    <div className="w-px h-10 bg-slate-200 mx-4" />
                    <div className="flex flex-col gap-1">
                        <span>Sermaye</span>
                        <span className="text-2xl text-slate-800">{Number(answers[10]?.text || 0).toLocaleString('tr-TR')} <span className="text-sm text-slate-400">TL</span></span>
                    </div>
                </div>

                <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-[#00008B] text-white rounded-2xl text-sm font-bold tracking-[0.15em] uppercase shadow-xl shadow-[#00008B]/20 hover:-translate-y-1 transition-transform group">
                    Portföy Dağılımını İncele
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
            </motion.div>
        </div>
    );
  }

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
                                    Portföyü Hesapla
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
