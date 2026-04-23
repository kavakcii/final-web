"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

interface VerificationCardProps {
  idNumber?: string;
  name?: string;
  validThru?: string;
  balance?: string;
  label?: string;
}

export function VerificationCard({
  idNumber = "ID **** 4590",
  name = "JANE DOE",
  validThru = "11/29",
  balance = "₺0,00",
  label = "FINAI PREMIUM",
}: VerificationCardProps) {
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
      {/* Background Patterns */}
      <div className="absolute top-[-20%] left-[20%] w-[120%] h-[60%] bg-[#00008B]/10 -rotate-[35deg] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,139,0.01)_50%)] bg-[length:100%_4px] pointer-events-none" />
      
      {/* Navy Line at the top */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-[#00008B]" />

      {/* TOP: User Name & Verified Status */}
      <div className="relative z-10 flex justify-between items-start text-[8px] font-black tracking-[0.1em] uppercase text-[#00008B]" style={{ transform: "translateZ(30px)" }}>
        <span className="bg-[#00008B]/5 px-1.5 py-0.5 rounded-md truncate max-w-[100px]">{name}</span>
        <span className="flex items-center gap-1 opacity-60 shrink-0">
          <div className="w-1 h-1 rounded-full bg-[#00008B] animate-pulse" />
          {label}
        </span>
      </div>

      {/* MIDDLE: BALANCE (THE HEART) */}
      <div className="relative z-10 my-1" style={{ transform: "translateZ(50px)" }}>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 opacity-60">Toplam Bakiye</p>
        <p className="text-xl font-black text-[#00008B] tracking-tight">{balance}</p>
      </div>

      {/* BOTTOM: ID & Expiry */}
      <div className="relative z-10 flex justify-between items-end text-[#00008B]" style={{ transform: "translateZ(20px)" }}>
        <div className="flex flex-col">
          <span className="text-[6px] font-bold opacity-40 uppercase tracking-widest mb-0.5">Account ID</span>
          <span className="text-[8px] font-black tracking-[0.15em]">{idNumber}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[6px] font-bold opacity-40 uppercase tracking-widest mb-0.5">Expires</span>
          <span className="text-[8px] font-black">{validThru}</span>
        </div>
      </div>

      {/* Silver Chip */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-5 rounded-sm bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500 shadow-inner opacity-40 grayscale pointer-events-none" />

      {/* Dynamic Shine Effect */}
      <motion.div 
        style={{
            background: "linear-gradient(105deg, transparent 40%, rgba(0,0,139,0.02) 45%, rgba(0,0,139,0.05) 50%, rgba(0,0,139,0.02) 55%, transparent 60%)",
        }}
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
        className="absolute inset-0 z-20 pointer-events-none"
      />
    </motion.div>
  );
}
