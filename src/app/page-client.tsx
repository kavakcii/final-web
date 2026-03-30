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
      
      {/* 
          21st.dev DYNAMIC BACKGROUND (Dark & Deep)
      */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Dark Grid Texture */}
        <div
          className="absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        
        {/* Huge Animated Glows */}
        <motion.div 
          style={{ y: blobY1 }}
          animate={{ rotate: [0, 90, 180, 270, 360] }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-20%] left-[-10%] w-[100vw] h-[100vw] rounded-full bg-[radial-gradient(circle,_rgba(37,99,235,0.15)_0%,_transparent_70%)] filter blur-[120px]"
        />
        <motion.div 
          style={{ y: blobY2 }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(circle,_rgba(139,92,246,0.15)_0%,_transparent_70%)] filter blur-[100px]"
        />
      </div>

      <Navbar />

      <main className="flex-1 relative z-10 w-full overflow-hidden">
        {/* 
            HERO SECTION
        */}
        <section
          id="hero"
          className="min-h-screen flex flex-col justify-center relative pt-24 pb-32 w-full"
        >
          {/* ORJİNAL HERO (Telefonlarda font 50px'e düşürülerek dizilim bilgisayarla BİREBİR aynı tutuldu) */}
          <div className="max-w-6xl mx-auto w-full px-6 relative">
            {/* Text Content */}
            <div className="text-center relative z-10 space-y-6 max-w-4xl mx-auto mt-10">
              
              {/* Huge H1 with soft radial glow from navy to white */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
                className="text-[65px] sm:text-[80px] md:text-[120px] leading-[1.0] font-black tracking-tighter text-[#0a192f] py-4 relative flex justify-center items-center w-full mx-auto"
              >
                {/* Glow behind the text: soft transition from inner center light to dark edges */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] sm:w-[900px] sm:h-[900px] bg-[radial-gradient(circle,_rgba(255,255,255,0.1)_0%,_rgba(37,99,235,0.05)_40%,_transparent_70%)] -z-10 rounded-full blur-[40px] pointer-events-none" />
                
                <span className="relative inline-block z-10 mt-10 sm:mt-0 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                  FinAi
                </span>
              </motion.h1>

              {/* Badge - Electric Styling */}
              <div className="flex justify-center w-full -mt-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl text-blue-400 text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(37,99,235,0.1)]"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  Finansal Zekanın Yeni Boyutu
                </motion.div>
              </div>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-base sm:text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto leading-relaxed font-medium mt-8 px-4 sm:px-0"
              >
                Geleceğin yatırım dünyasına hoş geldiniz. Verilerle harmanlanmış <span className="text-white font-bold underline decoration-blue-500 decoration-2 underline-offset-4">yapay zeka gücünü</span> tek merkezden yönetmeye başlayın.
              </motion.p>

              {/* CTAs (Sadece Mobilde Görünür) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="flex flex-row gap-4 justify-center items-center pt-12 relative z-[9999]"
              >
                  <Link href="/login?tab=register" className="group relative px-8 py-4 bg-white text-black font-black rounded-2xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                      <span className="relative z-10 flex items-center gap-2 text-lg">
                          Ücretsiz Başla
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                      </span>
                  </Link>
                
                  <Link href="/login" className="px-8 py-4 bg-white/5 backdrop-blur-xl text-white font-bold rounded-2xl border border-white/10 hover:bg-white/10 transition-all text-lg tracking-wide">
                      Giriş Yap
                  </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 
            TESTIMONIALS (Moved out of hero completely)
        */}
        <section className="w-full bg-gradient-to-b from-white via-[#0a192f] to-white pt-24 pb-20 relative z-20 overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-slate-200/50" />
            <div className="text-center mb-12 relative z-30">
               <span className="text-white/80 text-sm font-bold tracking-widest uppercase bg-[#0a192f]/50 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md">Kullanıcılarımız Ne Diyor?</span>
            </div>
            {/* Infinite Moving Cards inside the Gradient Block */}
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

        {/* 
            FAQ SECTION (Accordion Component)
        */}
        <FAQAccordionSection />

        <div className="w-full relative z-10 bg-white">
          <Footer />
        </div>

      </main>
      <FinAiChatWidget />
    </div>
  );
}
