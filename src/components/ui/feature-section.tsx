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
}: FeatureStepsProps) {
  const [currentFeature, setCurrentFeature] = useState(0)

  return (
    <div className={cn("py-12 md:py-16 bg-white", className)}>
      <div className="max-w-7xl mx-auto w-full px-6">
        <h2 className="text-3xl md:text-5xl lg:text-5xl font-black mb-16 text-center text-[#00008B] tracking-tight">
          {title}
        </h2>

        <div className="flex flex-col md:grid md:grid-cols-2 gap-10 md:gap-16 items-stretch">
          
          {/* Sol Kolon - Başlıklar (Accordion) */}
          <div className="order-2 md:order-1 flex flex-col justify-center divide-y divide-slate-100">
            {features.map((feature, index) => {
              const isActive = index === currentFeature
              return (
                <div
                  key={index}
                  className="py-5 cursor-pointer first:pt-0 last:pb-0"
                  onClick={() => {
                    setCurrentFeature(index)
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h3
                      className={cn(
                        "text-xl md:text-2xl font-bold transition-all duration-300 pointer-events-none",
                        isActive ? "text-[#00008B] translate-x-1" : "text-[#00008B]/40 hover:text-[#00008B]/70"
                      )}
                    >
                      {feature.title}
                    </h3>
                    <motion.span
                      animate={{ rotate: isActive ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "text-lg font-bold pointer-events-none transition-colors",
                        isActive ? "text-[#00008B]" : "text-[#00008B]/30"
                      )}
                    >
                      →
                    </motion.span>
                  </div>
                  
                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="mt-3 text-base text-[#00008B]/70 font-medium leading-relaxed pointer-events-none">
                          {feature.content}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>

          {/* Sağ Kolon - Resim */}
          <div className="order-1 md:order-2 relative w-full min-h-[350px] md:min-h-full rounded-3xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border border-slate-100/80 bg-white">
            <div className="absolute inset-0 bg-white flex items-center justify-center">
              {features.map((feature, index) => (
                <Image
                  key={index}
                  src={feature.image}
                  alt={feature.title || feature.step}
                  className={cn(
                    "absolute inset-0 w-full h-full object-contain p-8 transition-opacity duration-300 bg-white",
                    index === currentFeature ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                  )}
                  width={1000}
                  height={1000}
                  priority={index === 0}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
