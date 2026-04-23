"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { ShieldCheck, Cpu } from "lucide-react";

interface VerificationCardProps {
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
  // 3D Tilt Effect logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "relative h-36 w-56 rounded-xl p-4 shadow-2xl bg-white flex flex-col justify-between overflow-hidden group border border-slate-100 cursor-pointer"
      )}
    >
      {/* 1. Arkadan Geçen Lacivert Şeritler */}
      <div className="absolute top-[-20%] left-[20%] w-[120%] h-[60%] bg-[#00008B]/10 -rotate-[35deg] pointer-events-none" />
      
      {/* Scanline Effect - Sublte tech animation */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,139,0.02)_50%)] bg-[length:100%_4px] pointer-events-none" />
      <motion.div 
        animate={{ y: ["0%", "100%", "0%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 w-full h-[1px] bg-[#00008B]/5 z-20 pointer-events-none"
      />

      {/* Decorative Neural Pattern */}
      <div className="absolute right-[-10%] bottom-[-10%] w-24 h-24 border-[12px] border-[#00008B]/[0.03] rounded-full pointer-events-none" />

      {/* 2. Lacivert Şerit */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-[#00008B]" />

      {/* Card Content */}
      <div className="relative z-10 flex justify-between items-start text-[8px] font-black tracking-[0.15em] uppercase text-[#00008B]" style={{ transform: "translateZ(30px)" }}>
        <span className="bg-[#00008B]/5 px-1.5 py-0.5 rounded-md flex items-center gap-1">
            <ShieldCheck className="w-2.5 h-2.5" />
            {label}
        </span>
        <span className="flex items-center gap-1 opacity-60">
          <div className="w-1 h-1 rounded-full bg-[#00008B] animate-pulse" />
          VERIFIED
        </span>
      </div>

      {/* Holographic Chip - Silver / Platinum */}
      <div className="relative z-10 w-8 h-6 rounded-md bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500 shadow-inner overflow-hidden border border-slate-400/20" style={{ transform: "translateZ(40px)" }}>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,black_100%)]" />
        <div className="grid grid-cols-3 grid-rows-2 h-full w-full opacity-30">
            <div className="border-r border-b border-black/10" />
            <div className="border-r border-b border-black/10" />
            <div className="border-b border-black/10" />
            <div className="border-r border-black/10" />
            <div className="border-r border-black/10" />
            <div className="" />
        </div>
      </div>

      <div className="relative z-10" style={{ transform: "translateZ(20px)" }}>
        <p className="text-sm tracking-[0.2em] font-black mb-2 text-[#00008B]">{idNumber}</p>
        <div className="flex justify-between items-end text-[#00008B]">
          <div className="flex flex-col">
            <span className="text-[6px] font-bold opacity-40 uppercase tracking-widest mb-0.5">Card Holder</span>
            <span className="text-[10px] font-bold tracking-widest">{name}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[6px] font-bold opacity-40 uppercase tracking-widest mb-0.5">Expires</span>
            <span className="text-[10px] font-bold tracking-widest">{validThru}</span>
          </div>
        </div>
      </div>

      {/* Dynamic Shine Effect */}
      <motion.div 
        style={{
            background: "linear-gradient(105deg, transparent 40%, rgba(0,0,139,0.05) 45%, rgba(0,0,139,0.1) 50%, rgba(0,0,139,0.05) 55%, transparent 60%)",
        }}
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        className="absolute inset-0 z-20 pointer-events-none"
      />
    </motion.div>
  );
}
