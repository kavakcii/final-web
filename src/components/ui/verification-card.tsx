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
  backgroundImage = "https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/ruixen_moon.png",
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
        "relative h-52 w-80 rounded-2xl p-6 shadow-2xl text-white flex flex-col justify-between bg-cover bg-center overflow-hidden group border border-white/10"
      )}
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-500 rounded-2xl" />

      {/* Card Content */}
      <div className="relative z-10 flex justify-between items-start text-[10px] font-black tracking-[0.2em] uppercase opacity-80">
        <span className="bg-white/10 px-2 py-1 rounded-lg backdrop-blur-md">{label}</span>
        <span className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          VALID
        </span>
      </div>

      <div className="relative z-10">
        <p className="text-xl tracking-[0.25em] font-black mb-4 drop-shadow-lg">{idNumber}</p>
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-[8px] font-bold opacity-50 uppercase tracking-widest mb-0.5">Card Holder</span>
            <span className="text-sm font-bold tracking-widest">{name}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-bold opacity-50 uppercase tracking-widest mb-0.5">Expires</span>
            <span className="text-sm font-bold tracking-widest">{validThru}</span>
          </div>
        </div>
      </div>

      {/* Decorative Shine Effect */}
      <div className="absolute -inset-full h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent -rotate-45 translate-y-full group-hover:translate-y-[-100%] transition-transform duration-1000" />
    </motion.div>
  );
}
