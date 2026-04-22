"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface VerificationCardProps {
  backgroundImage?: string;
  idNumber?: string;
  name?: string;
  validThru?: string;
  label?: string;
}

export function VerificationCard({
  idNumber = "ID **** 4590",
  name = "JANE DOE",
  validThru = "11/29",
  label = "IDENTITY CARD",
}: VerificationCardProps) {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "relative h-52 w-80 rounded-2xl p-6 shadow-2xl bg-white flex flex-col justify-between overflow-hidden group border border-slate-100"
      )}
    >
      {/* 1. Arkadan Geçen Mavi Şerit (Diagonal Blue Stripe) */}
      <div className="absolute top-[-20%] left-[20%] w-[120%] h-[60%] bg-[#00008B]/5 -rotate-[35deg] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[100%] h-[40%] bg-[#00008B]/[0.02] rotate-[15deg] pointer-events-none" />

      {/* 2. Gökkuşağı Çizgisi (Rainbow Line at the top) */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-red-500 via-yellow-400 via-green-400 via-blue-400 to-purple-500" />

      {/* Card Content */}
      <div className="relative z-10 flex justify-between items-start text-[10px] font-black tracking-[0.2em] uppercase text-[#00008B]">
        <span className="bg-[#00008B]/5 px-2 py-1 rounded-lg">{label}</span>
        <span className="flex items-center gap-1 opacity-60">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00008B] animate-pulse" />
          VERIFIED
        </span>
      </div>

      <div className="relative z-10">
        <p className="text-xl tracking-[0.25em] font-black mb-4 text-[#00008B]">{idNumber}</p>
        <div className="flex justify-between items-end text-[#00008B]">
          <div className="flex flex-col">
            <span className="text-[8px] font-bold opacity-40 uppercase tracking-widest mb-0.5">Card Holder</span>
            <span className="text-sm font-bold tracking-widest">{name}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-bold opacity-40 uppercase tracking-widest mb-0.5">Expires</span>
            <span className="text-sm font-bold tracking-widest">{validThru}</span>
          </div>
        </div>
      </div>

      {/* Dynamic Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-50/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
    </motion.div>
  );
}
