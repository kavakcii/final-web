"use client"
import { useEffect, useRef, useState } from "react"
import { MeshGradient, PulsingBorder } from "@paper-design/shaders-react"
import { motion } from "framer-motion"
import { TrendingUp, ArrowRight, PieChart, Activity, Zap } from "lucide-react"
import Link from "next/link"

export default function ShaderShowcase() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const handleMouseEnter = () => setIsActive(true)
    const handleMouseLeave = () => setIsActive(false)

    const container = containerRef.current
    if (container) {
      container.addEventListener("mouseenter", handleMouseEnter)
      container.addEventListener("mouseleave", handleMouseLeave)
    }

    return () => {
      if (container) {
        container.removeEventListener("mouseenter", handleMouseEnter)
        container.removeEventListener("mouseleave", handleMouseLeave)
      }
    }
  }, [])

  return (
    <div ref={containerRef} className="min-h-screen bg-black relative overflow-hidden font-sans uppercase-none selection:bg-cyan-500/30">
      <svg className="absolute inset-0 w-0 h-0">
        <defs>
          <filter id="glass-effect" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence baseFrequency="0.005" numOctaves="1" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.3" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0.02
                      0 1 0 0 0.02
                      0 0 1 0 0.05
                      0 0 0 0.9 0"
              result="tint"
            />
          </filter>
          <filter id="gooey-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="gooey"
            />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
          <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
          <filter id="text-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* FinAi Temalı Mesh Gradient (Siyah, Cyan ve Koyu Mavi) */}
      <MeshGradient
        className="absolute inset-0 w-full h-full"
        colors={["#000000", "#0891b2", "#1e40af", "#020617", "#0ea5e9"]}
        speed={0.2}
        backgroundColor="#000000"
      />
      
      {/* Finansal Veri Grid Katmanı */}
      <div 
        className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none"
        style={{
            backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
        }}
      />

      <header className="relative z-30 flex items-center justify-between p-8">
        <motion.div
          className="flex items-center group cursor-pointer space-x-3"
          whileHover={{ scale: 1.05 }}
        >
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            <TrendingUp className="w-6 h-6 text-black" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white">FinAi</span>
        </motion.div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {['Piyasalar', 'Analizler', 'Portföy', 'Eğitim'].map((item) => (
              <a key={item} href="#" className="text-white/60 hover:text-white text-sm font-bold tracking-wide transition-colors">
                  {item}
              </a>
          ))}
        </nav>

        {/* Login Button Group */}
        <div id="gooey-btn" className="relative flex items-center group" style={{ filter: "url(#gooey-filter)" }}>
          <Link href="/login" className="px-8 py-2.5 rounded-full bg-white text-black font-black text-sm transition-all duration-300 hover:bg-zinc-200 cursor-pointer h-10 flex items-center z-10">
            Giriş Yap
          </Link>
          <div className="absolute right-0 w-8 h-8 rounded-full bg-white flex items-center justify-center -translate-x-4 opacity-0 group-hover:opacity-100 group-hover:-translate-x-12 transition-all duration-500 z-0">
             <ArrowRight className="w-4 h-4 text-black" />
          </div>
        </div>
      </header>

      <main className="absolute inset-0 flex items-center z-20 px-12 md:px-24">
        <div className="text-left w-full max-w-4xl pt-20">
          <motion.div
            className="inline-flex items-center px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md mb-8 border border-white/20"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Zap className="w-4 h-4 text-cyan-400 mr-2 fill-cyan-400" />
            <span className="text-white text-xs font-black tracking-[0.2em] uppercase">
              Yapay Zeka Destekli Yatırım Çağı
            </span>
          </motion.div>

          <motion.h1
            className="text-7xl md:text-8xl lg:text-[140px] font-black text-white mb-8 leading-[0.85] tracking-tighter"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.span
              className="block font-medium text-white/40 text-4xl md:text-5xl lg:text-6xl mb-4 tracking-normal"
              style={{
                filter: "url(#text-glow)",
              }}
            >
              Akıllı Finansal
            </motion.span>
            <span className="block text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">Strateji.</span>
          </motion.h1>

          <motion.p
            className="text-xl font-medium text-white/50 mb-12 leading-relaxed max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Verileri saniyeler içinde analiz edin, risklerinizi yönetin ve portföyünüzü yapay zekanın gücüyle geleceğe hazırlayın. Basit, hızlı ve <span className="text-white border-b-2 border-white/30">profesyonel</span>.
          </motion.p>

          <motion.div
            className="flex items-center gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Link href="/login?tab=register" className="group relative px-12 py-5 bg-white text-black font-black text-lg rounded-2xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
               <span className="relative z-10 flex items-center gap-3">
                   Şimdi Başla
                   <Activity className="w-5 h-5 group-hover:rotate-12 transition-transform" />
               </span>
            </Link>
            <button className="hidden md:block px-10 py-5 bg-white/5 backdrop-blur-xl text-white font-black text-lg rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                Nasıl Çalışır?
            </button>
          </motion.div>
        </div>
      </main>

      {/* Sağ Alt Kısımdaki Pulsing Finans Merkezi */}
      <div className="absolute bottom-12 right-12 z-30 hidden lg:block">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <PulsingBorder
            colors={["#06b6d4", "#ffffff", "#0ea5e9", "#1e40af", "#ffffff"]}
            colorBack="#00000000"
            speed={2}
            roundness={1}
            thickness={0.15}
            softness={0.1}
            intensity={8}
            scale={0.8}
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
            }}
          />

          {/* Dönen Veri Halkası */}
          <motion.svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            animate={{ rotate: -360 }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            style={{ transform: "scale(1.8)" }}
          >
            <defs>
              <path id="circle-path" d="M 50, 50 m -40, 0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0" />
            </defs>
            <text className="text-[7px] fill-white/40 font-black uppercase tracking-[0.2em]">
              <textPath href="#circle-path" startOffset="0%">
                Real-Time Data • AI Analysis • Portfolio Optimization • Market Intelligence • Smart Investing •
              </textPath>
            </text>
          </motion.svg>
          
          <div className="absolute inset-0 flex items-center justify-center">
              <PieChart className="w-8 h-8 text-white animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
