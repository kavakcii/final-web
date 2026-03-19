"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface Feature {
  step: string
  title?: string
  content: string
  image: string
}

interface FeatureStepsProps {
  features: Feature[]
  className?: string
  title?: string
  autoPlayInterval?: number
  imageHeight?: string
}

export function FeatureSteps({
  features,
  className,
  title = "Nasıl Çalışır?",
  autoPlayInterval = 4000,
  imageHeight = "h-[400px]",
}: FeatureStepsProps) {
  const [currentFeature, setCurrentFeature] = useState(0)
  const [progress, setProgress] = useState(0)

  // Auto-play interval logic
  useEffect(() => {
    const timer = setInterval(() => {
      if (progress < 100) {
        setProgress((prev) => prev + 100 / (autoPlayInterval / 100))
      } else {
        setCurrentFeature((prev) => (prev + 1) % features.length)
        setProgress(0)
      }
    }, 100)

    return () => clearInterval(timer)
  }, [progress, features.length, autoPlayInterval])

  return (
    <div className={cn("py-12 md:py-16 bg-white", className)}>
      <div className="max-w-7xl mx-auto w-full px-6">
        <h2 className="text-3xl md:text-5xl lg:text-5xl font-black mb-16 text-center text-[#0a192f] tracking-tight">
          {title}
        </h2>

        <div className="flex flex-col md:grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          
          {/* Sol Kolon - Adımlar */}
          <div className="order-2 md:order-1 space-y-10">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-start gap-6 -mx-4 p-4 md:-mx-6 md:p-6 rounded-3xl hover:bg-slate-50/80 active:bg-slate-100 transition-colors cursor-pointer"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: index === currentFeature ? 1 : 0.4 }}
                transition={{ duration: 0.5 }}
                onClick={() => {
                   setCurrentFeature(index);
                   setProgress(0);
                }}
              >
                {/* Daire (Icon/No) */}
                <motion.div
                  className={cn(
                    "w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center border-2 transition-colors duration-300",
                    index === currentFeature
                      ? "bg-[#0a192f] border-[#0a192f] text-white scale-110 shadow-lg shadow-[#0a192f]/20"
                      : "bg-slate-50 border-slate-200 text-slate-400",
                  )}
                >
                  {index <= currentFeature ? (
                    <span className="text-xl font-bold">✓</span>
                  ) : (
                    <span className="text-xl font-bold">{index + 1}</span>
                  )}
                </motion.div>

                {/* İçerik */}
                <div className="flex-1 mt-1">
                  <h3 className={cn(
                      "text-2xl font-bold transition-colors duration-300 pointer-events-none",
                      index === currentFeature ? "text-[#0a192f]" : "text-slate-600"
                  )}>
                    {feature.title || feature.step}
                  </h3>
                  <p className="mt-2 text-base md:text-lg text-slate-500 font-medium leading-relaxed pointer-events-none">
                    {feature.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Sağ Kolon - Resim */}
          <div
            className={cn(
              "order-1 md:order-2 relative w-full overflow-hidden rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] ring-1 ring-slate-100",
              imageHeight
            )}
          >
            <AnimatePresence mode="wait">
              {features.map(
                (feature, index) =>
                  index === currentFeature && (
                    <motion.div
                      key={index}
                      className="absolute inset-0 rounded-3xl overflow-hidden bg-slate-100"
                      initial={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Image
                        src={feature.image}
                        alt={feature.title || feature.step}
                        className="w-full h-full object-cover transition-transform duration-[10s] hover:scale-110"
                        width={1000}
                        height={800}
                        priority
                      />
                      {/* Gradient overlay to make borders blend nicely */}
                      <div className="absolute inset-0 border border-black/5 rounded-3xl rounded-3xl pointer-events-none" />
                      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#0a192f]/40 to-transparent pointer-events-none" />
                    </motion.div>
                  ),
              )}
            </AnimatePresence>
            
            {/* İlerleme Çubuğu */}
            <div className="absolute bottom-0 left-0 h-1.5 bg-[#0a192f]/10 w-full z-10">
               <motion.div 
                 className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-r-full" 
                 style={{ width: `${progress}%` }} 
                 transition={{ ease: "linear", duration: 0.1 }} 
               />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
