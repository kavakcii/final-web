"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { InfiniteMovingCards } from "@/components/ui/InfiniteMovingCards";
import { FinAiChatWidget } from "@/components/FinAiChatWidget";
import { FeatureSteps } from "@/components/ui/feature-section";
import { FAQAccordionSection } from "@/components/ui/accordion-feature-section";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  TrendingUp,
  Brain,
  Target,
  ArrowRight
} from "lucide-react";
import { useRef } from "react";
import ShaderShowcase from "@/components/ui/hero";

export default function HomeClient() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const blobY1 = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const blobY2 = useTransform(scrollYProgress, [0, 1], [0, -200]);

  const testimonialsData = [
    {
      id: 1,
      initials: 'AY',
      name: 'Ahmet Yılmaz',
      role: '',
      quote: "Portföyümdeki riskleri daha iyi yönetiyorum. Uygulama çok yönlendirici ve anlaşılır.",
      tags: [{ text: 'Premium', type: 'featured' as const }, { text: 'BIST', type: 'default' as const }],
      stats: [{ icon: TrendingUp, text: 'Karlı' }],
      avatarGradient: 'linear-gradient(135deg, #0a192f, #1e3a8a)',
    },
    {
      id: 2,
      initials: 'ZK',
      name: 'Zeynep Kara',
      role: '',
      quote: "Borsa verilerini sade bir dille anlatması harika. Karmaşık analizlerle uğraşmıyorum artık.",
      tags: [{ text: 'Bireysel', type: 'featured' as const }, { text: 'Fon', type: 'default' as const }],
      stats: [{ icon: Brain, text: 'AI Destekli' }],
      avatarGradient: 'linear-gradient(135deg, #0284c7, #0369a1)',
    },
    {
      id: 3,
      initials: 'MT',
      name: 'Mehmet Tekin',
      role: '',
      quote: "Yapay zeka asistanı sayesinde piyasa düşerken bile sakin kalıp doğru kararlar verdim.",
      tags: [{ text: 'Yatırımcı', type: 'featured' as const }],
      stats: [{ icon: Target, text: 'İsabetli' }],
      avatarGradient: 'linear-gradient(135deg, #4338ca, #3730a3)',
    },
  ];

  const features = [
    { 
      step: 'Adım 1', 
      title: 'Bütünleşik Portföy Kontrolü',
      content: 'Hisse, Altın ve Fonlarınızı tek bir akıllı ekranda birleştirin. Karmaşıklığı değil, hızı ve sadeliği deneyimleyin.', 
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80' 
    },
    { 
      step: 'Adım 2',
      title: '7/24 Derin Piyasa Analizi',
      content: 'BIST 100 ve küresel endeksleri saniyeler içinde tarayın. Fırsatları kaçırmayın, yapay zekanın öngörüleriyle bir adım öne geçin.',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80'
    },
    { 
      step: 'Adım 3',
      title: 'Stratejik Risk Yönetimi',
      content: 'Yatırımlarınızdaki gizli tehlikeleri yapay zekayla saptayın. Size özel hazırlanan finansal raporlarla rotanızı güvenle çizin.',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80'
    },
  ];

  return (
    <div ref={containerRef} className="min-h-screen w-full bg-[#030303] text-zinc-100 relative font-sans overflow-x-hidden selection:bg-blue-500/30">
      <Navbar />

      <main className="flex-1 relative z-10 w-full overflow-hidden">
        {/* DESKTOP HERO: NEW SHADER EXPERIENCE */}
        <div className="hidden md:block">
           <ShaderShowcase />
        </div>

        {/* MOBILE HERO: ORIGINAL FEEL */}
        <section
          id="hero"
          className="md:hidden min-h-screen flex flex-col justify-center relative pt-24 pb-32 w-full"
        >
          <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
             <motion.div style={{ y: blobY1 }} className="absolute -top-[10%] -left-[10%] w-[100vw] h-[100vw] rounded-full bg-blue-500/10 blur-[100px]" />
          </div>

          <div className="max-w-6xl mx-auto w-full px-6 relative">
            <div className="text-center relative z-10 space-y-6 max-w-4xl mx-auto mt-10">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[65px] font-black tracking-tighter text-white py-4"
              >
                <span className="relative inline-block z-10 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                  FinAi
                </span>
              </motion.h1>

              <div className="flex justify-center w-full -mt-2">
                <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl text-blue-400 text-xs font-bold">
                  Finansal Zekanın Yeni Boyutu
                </div>
              </div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-base text-zinc-400 max-w-3xl mx-auto leading-relaxed font-medium mt-8 px-4"
              >
                Geleceğin yatırım dünyasına hoş geldiniz. Verilerle harmanlanmış <span className="text-white font-bold underline decoration-blue-500 decoration-2 underline-offset-4">yapay zeka gücünü</span> yönetmeye başlayın.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-row gap-4 justify-center items-center pt-12"
              >
                  <Link href="/login?tab=register" className="px-8 py-4 bg-white text-black font-black rounded-2xl shadow-xl">
                      Ücretsiz Başla
                  </Link>
                  <Link href="/login" className="px-8 py-4 bg-white/5 backdrop-blur-xl text-white font-bold rounded-2xl border border-white/10">
                      Giriş Yap
                  </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="w-full bg-gradient-to-b from-white via-[#0a192f] to-white pt-24 pb-20 relative z-20 overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-slate-200/50" />
            <div className="text-center mb-12 relative z-30">
               <span className="text-white/80 text-sm font-bold tracking-widest uppercase bg-[#0a192f]/50 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md">Kullanıcılarımız Ne Diyor?</span>
            </div>
            <InfiniteMovingCards items={testimonialsData} direction="right" speed="slow" />
        </section>

        {/* FEATURES */}
        <section id="features" className="flex flex-col justify-center bg-white overflow-hidden w-full relative z-20 border-t border-slate-100">
             <FeatureSteps 
                features={features} 
                title="Sistem Nasıl Çalışır?" 
                autoPlayInterval={5000} 
                imageHeight="h-[300px] md:h-[450px]" 
              />
        </section>

        {/* FAQ */}
        <FAQAccordionSection />

        <div className="w-full relative z-10 bg-white">
          <Footer />
        </div>
      </main>
      <FinAiChatWidget />
    </div>
  );
}
