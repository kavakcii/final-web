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
      quote: "Hisse ve fonlarımı tek ekrandan takip ediyorum. Portföy yönetimi artık çok daha kolay.",
      tags: [{ text: 'BIST', type: 'featured' as const }, { text: 'Portföy', type: 'default' as const }],
      stats: [{ icon: TrendingUp, text: 'Aktif' }],
      avatarGradient: 'linear-gradient(135deg, #00008B, #1e3a8a)',
    },
    {
      id: 2,
      initials: 'ZK',
      name: 'Zeynep Kara',
      role: '',
      quote: "TEFAS fonlarını kolayca analiz edip portföyüme ekliyorum. Arayüzü çok sade ve kullanışlı.",
      tags: [{ text: 'Bireysel', type: 'featured' as const }, { text: 'TEFAS', type: 'default' as const }],
      stats: [{ icon: Brain, text: 'AI Asistan' }],
      avatarGradient: 'linear-gradient(135deg, #0284c7, #0369a1)',
    },
    {
      id: 3,
      initials: 'MT',
      name: 'Mehmet Tekin',
      role: '',
      quote: "AI asistan sayesinde korelasyon analizlerimi hızlıca yapıp portföyümü dengeliyorum.",
      tags: [{ text: 'Yatırımcı', type: 'featured' as const }],
      stats: [{ icon: Target, text: 'Verimli' }],
      avatarGradient: 'linear-gradient(135deg, #4338ca, #3730a3)',
    },
  ];

  const features = [
    { 
      step: 'Adım 1', 
      title: 'Tek Ekranda Portföy Takibi',
      content: 'BIST hisselerinizi ve TEFAS fonlarınızı tek bir panoda toplayın. Anlık fiyatlarla portföyünüzü canlı izleyin.', 
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80' 
    },
    { 
      step: 'Adım 2',
      title: 'AI Destekli Analiz',
      content: 'Yapay zeka asistanınıza portföyünüzle ilgili sorular sorun, korelasyon analizleri yapın ve piyasa haberlerini takip edin.',
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80'
    },
    { 
      step: 'Adım 3',
      title: 'Detaylı Raporlama',
      content: 'Portföy performansınızı grafikler ve raporlarla analiz edin. Varlık dağılımınızı ve getiri oranlarınızı net bir şekilde görün.',
      image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80'
    },
  ];

  return (
    <div ref={containerRef} className="min-h-screen w-full bg-white text-slate-800 relative font-sans overflow-x-hidden">
      
      {/* 
          FULL WHITE BACKGROUND (Clean)
      */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-white" />

      <Navbar />

      <main className="flex-1 relative z-10 w-full overflow-hidden">
        {/* 
            HERO SECTION
        */}
        <section
          id="hero"
          className="min-h-screen flex flex-col justify-center relative pt-24 pb-32 w-full"
        >
          {/* ORJİNAL HERO */}
          <div className="max-w-6xl mx-auto w-full px-6 relative">
            {/* Text Content */}
            <div className="text-center relative z-10 space-y-6 max-w-4xl mx-auto mt-10">
              
              {/* Huge H1 with soft radial glow from navy to white */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
                className="text-[65px] sm:text-[80px] md:text-[120px] leading-[1.0] font-black tracking-tighter text-[#00008B] py-4 relative flex justify-center items-center w-full mx-auto"
              >
                <span className="relative inline-block z-10 mt-10 sm:mt-0">
                  <span className="text-[#00008B] px-2 font-black">
                    FinAi
                  </span>
                  <svg className="absolute w-full h-2 sm:h-3 -bottom-1 left-0 text-[#00008B] opacity-80" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="6" fill="transparent" />
                  </svg>
                </span>
              </motion.h1>

              {/* Badge moved here - Perfectly centered below FinAi */}
              <div className="flex justify-center w-full sm:-mt-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-50/80 border border-blue-200/50 backdrop-blur-md text-blue-700 text-xs sm:text-sm font-bold shadow-sm"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                  </span>
                  Akıllı Portföy Yönetimi
                </motion.div>
              </div>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-base sm:text-xl md:text-2xl text-[#00008B]/70 max-w-2xl mx-auto leading-relaxed font-medium mt-6 px-4 sm:px-0"
              >
                BIST hisseleri ve TEFAS fonlarını tek bir panoda takip edin. <b className="text-[#00008B]">AI destekli analizlerle</b> portföyünüzü yönetin.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="flex md:hidden flex-row gap-3 justify-center items-center pt-8"
              >
                  <Link href="/login?tab=register" className="flex items-center justify-center gap-1.5 px-6 py-3 bg-[#00008B] hover:bg-[#0b2d82] text-white font-bold rounded-full shadow-lg transition-all text-sm tracking-wide">
                      Ücretsiz Dene
                      <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/login" className="flex items-center justify-center px-6 py-3 bg-white hover:bg-slate-50 text-[#00008B] font-bold rounded-full border border-slate-200 hover:border-[#00008B] shadow-sm transition-all text-sm tracking-wide">
                      Giriş Yap
                  </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 
            TESTIMONIALS
        */}
        <section className="w-full bg-white pt-24 pb-20 relative z-20">
            <InfiniteMovingCards items={testimonialsData} direction="right" speed="slow" />
        </section>

        {/* 
            FEATURES SECTION
        */}
        <section id="features" className="flex flex-col justify-center bg-white overflow-hidden w-full relative z-20 border-t border-slate-100">
             <FeatureSteps 
                features={features} 
                title="Sistem Nasıl Çalışır?" 
                autoPlayInterval={5000} 
                imageHeight="h-[300px] md:h-[450px]" 
              />
        </section>

        <FAQAccordionSection />

        <div className="w-full relative z-10 bg-white">
          <Footer />
        </div>
      </main>
      <FinAiChatWidget />
    </div>
  );
}
