const fs = require('fs');

const content = `"use client";

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

export default function Home() {
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
      title: 'Akıllı Portföy Yönetimi',
      content: 'Hisse, Altın ve Fonlarınızı tek yerden anlık takip edin. Karmaşık ekranlar yerine temiz bir özet görün.', 
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2426&auto=format&fit=crop' 
    },
    { 
      step: 'Adım 2',
      title: 'Kapsamlı Piyasa Analizi',
      content: 'BIST 100 ve küresel piyasaları sizin için 7/24 tarar. Size sadece fırsatları değerlendirmek kalır.',
      image: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?q=80&w=2426&auto=format&fit=crop'
    },
    { 
      step: 'Adım 3',
      title: 'Risk Raporlama ve Öngörü',
      content: 'Yapay zeka destekli gizli risk tespiti ve stratejik finansal raporlar sunar.',
      image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2426&auto=format&fit=crop'
    },
  ];

  return (
    <div ref={containerRef} className="min-h-screen w-full bg-white text-slate-800 relative scroll-smooth font-sans">
      
      {/* ═══════════════════════════════
          DYNAMIC BACKGROUND
      ═══════════════════════════════ */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-white">
        {/* Soft dot grid texture */}
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage: \`radial-gradient(circle, #cbd5e1 1.5px, transparent 1px)\`,
            backgroundSize: '32px 32px',
          }}
        />
        
        {/* Animated Orbs/Blobs */}
        <motion.div 
          style={{ y: blobY1 }}
          animate={{ x: [0, 50, -20, 0], scale: [1, 1.1, 0.9, 1] }} 
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-blue-100/50 mix-blend-multiply filter blur-[100px] opacity-70"
        />
        <motion.div 
          style={{ y: blobY2 }}
          animate={{ x: [0, -60, 30, 0], scale: [1, 1.2, 0.8, 1] }} 
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[20%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-indigo-100/50 mix-blend-multiply filter blur-[100px] opacity-60"
        />
      </div>

      <Navbar />

      <main className="flex-1 relative z-10 w-full overflow-hidden">
        {/* ═══════════════════════════════
            HERO SECTION
        ═══════════════════════════════ */}
        <section
          id="hero"
          className="min-h-screen flex flex-col justify-center relative pt-24 pb-32 w-full"
        >
          {/* ═════ DESKTOP HERO (Tablet & Laptap) ═════ */}
          <div className="hidden md:block max-w-6xl mx-auto w-full px-6 relative">
            {/* Text Content */}
            <div className="text-center relative z-10 space-y-8 max-w-4xl mx-auto mt-10">
              
              {/* Huge H1 with soft radial glow from navy to white */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
                className="text-[4rem] leading-[1.1] sm:text-8xl md:text-9xl font-black tracking-tighter text-[#0a192f] py-4 relative flex justify-center items-center w-full mx-auto"
              >
                {/* Glow behind the text: soft transition from inner white to outer navy */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,_rgba(255,255,255,1)_10%,_rgba(10,25,47,0.15)_50%,_transparent_80%)] -z-10 rounded-full blur-[40px] pointer-events-none" />
                
                <span className="relative inline-block z-10">
                  <span className="bg-gradient-to-br from-[#0a192f] via-blue-700 to-blue-500 bg-clip-text text-transparent px-2">
                    FinAi
                  </span>
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-blue-500 opacity-80" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="6" fill="transparent" />
                  </svg>
                </span>
              </motion.h1>

              {/* Badge moved here - Perfectly centered below FinAi */}
              <div className="flex justify-center w-full mt-4">
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
                  Yatırımın Geleceğiyle Tanışın
                </motion.div>
              </div>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-lg md:text-2xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium mt-6"
              >
                Karmaşık piyasa verilerini unutun. Güçlü algoritmalarla portföyünüzü <b className="text-[#0a192f]">profesyonel bir fon yöneticisi</b> gibi kontrol edin.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
              >
                <Link href="/login?tab=register" className="w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#0a192f] hover:bg-black text-white font-bold rounded-2xl shadow-[0_10px_40px_-10px_rgba(10,25,47,0.5)] transition-all text-base tracking-wide"
                  >
                    Ücretsiz Başla
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-slate-50 text-[#0a192f] font-bold rounded-2xl border-2 border-slate-200 hover:border-[#0a192f] shadow-sm transition-all text-base tracking-wide"
                  >
                    Giriş Yap
                  </motion.button>
                </Link>
              </motion.div>
            </div>
          </div>

          {/* ═════ MOBILE HERO (Phones Only) ═════ */}
          <div className="block md:hidden absolute inset-0 bg-[#0a192f] z-30 flex flex-col justify-center px-6 pt-10 pb-32 overflow-hidden">
             {/* Deep glow from top-right down */}
             <div className="absolute top-0 right-[-20%] w-[120%] h-[300px] bg-[radial-gradient(circle,_#1d4ed8_0%,_transparent_70%)] blur-[80px] opacity-40 rounded-full pointer-events-none" />
             <div className="absolute -bottom-10 -left-[10%] w-[120%] h-[200px] bg-[radial-gradient(circle,_#1e3a8a_0%,_transparent_70%)] blur-[60px] opacity-30 rounded-full pointer-events-none" />
             
             <div className="relative z-10 flex flex-col items-start space-y-5">
               <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md text-blue-200 text-xs font-bold shadow-2xl"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  Yatırımın Geleceğiyle Tanışın
               </motion.div>
               
               {/* Punchy Typo */}
               <motion.h1
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.6, delay: 0.1 }}
                 className="text-[6rem] leading-[0.85] font-black tracking-tighter text-white"
               >
                 FinAi
               </motion.h1>
               
               <motion.p
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.6, delay: 0.2 }}
                 className="text-lg text-slate-400 leading-snug font-medium max-w-[90%] mt-4"
               >
                 Karmaşık piyasaları unutun. Güçlü algoritmalarla portföyünüzü <b className="text-white">profesyonel bir fon yöneticisi</b> gibi kontrol edin.
               </motion.p>
             </div>
          </div>

          {/* Sticky Mobile CTA (Only visible on scroll on mobile) */}
          <div className="md:hidden fixed bottom-6 left-4 right-4 z-[99] pointer-events-auto">
             <Link href="/login?tab=register" className="block w-full">
               <motion.button
                 whileTap={{ scale: 0.96 }}
                 className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-[0_15px_30px_-5px_rgba(37,99,235,0.6)] backdrop-blur-xl border border-blue-500/50 transition-all text-lg tracking-wide uppercase"
               >
                 Ücretsiz Başla
                 <ArrowRight className="w-5 h-5" />
               </motion.button>
             </Link>
          </div>
        </section>

        {/* ═══════════════════════════════
            TESTIMONIALS (Moved out of hero completely)
        ═══════════════════════════════ */}
        <section className="w-full bg-gradient-to-b from-white via-[#0a192f] to-white pt-24 pb-20 relative z-20 overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-slate-200/50" />
            <div className="text-center mb-12 relative z-30">
               <span className="text-white/80 text-sm font-bold tracking-widest uppercase bg-[#0a192f]/50 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md">Kullanıcılarımız Ne Diyor?</span>
            </div>
            {/* Infinite Moving Cards inside the Gradient Block */}
            <InfiniteMovingCards items={testimonialsData} direction="right" speed="slow" />
        </section>

        {/* ═══════════════════════════════
            FEATURES SECTION
        ═══════════════════════════════ */}
        <section id="features" className="flex flex-col justify-center bg-white overflow-hidden w-full relative z-20 border-t border-slate-100">
             <FeatureSteps 
                features={features} 
                title="Sistem Nasıl Çalışır?" 
                autoPlayInterval={5000} 
                imageHeight="h-[300px] md:h-[450px]" 
              />
        </section>

        {/* ═══════════════════════════════
            FAQ SECTION (Accordion Component)
        ═══════════════════════════════ */}
        {/* We just drop in the newly created FAQAccordionSection, it already contains its own wrapper. */}
        <FAQAccordionSection />

        <div className="w-full relative z-10 bg-white">
          <Footer />
        </div>

      </main>
      <FinAiChatWidget />
    </div>
  );
"`;

fs.writeFileSync('d:\\Salih KAVAKCI\\Yeni klasör\\FinAl\\final-web\\src\\app\\page.tsx', content, 'utf8');
console.log('Saved page.tsx correctly!');
