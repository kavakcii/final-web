import React from "react";
import { cn } from "@/lib/utils";

export const FinAiLogo = ({ className, showText = true }: { className?: string, showText?: boolean }) => (
  <svg viewBox="0 0 320 100" className={cn("text-[#0a192f] dark:text-white", className || "w-48 h-auto")} fill="none" xmlns="http://www.w3.org/2000/svg">
    
    {/* --- NEW FINAI STYLIZED 'F' ICON --- */}
    <g transform={showText ? "translate(0, 0)" : "translate(110, 0)"}>
        {/* Shadow/Glow */}
        <circle cx="50" cy="50" r="40" fill="#2563eb" opacity="0.05" filter="blur(16px)" />
        
        {/* Bottom Loop / Folded Path */}
        <path 
          d="M48 45C48 45 42 55 38 65C34 75 38 85 45 92C52 99 65 92 65 80C65 68 55 58 48 45Z" 
          fill="url(#logoGradMain)" 
        />
        
        {/* Top Bar (Modern Parallelogram) */}
        <path 
          d="M32 30L82 28C85 28 88 32 86 36L78 48C76 52 72 53 68 53H36C32 53 29 50 30 46L32 30Z" 
          fill="url(#logoGradTop)" 
        />
        
        {/* Sharper Tail / Accent */}
        <path 
          d="M45 92L50 100L55 92H45Z" 
          fill="#1e40af" 
        />
    </g>

    <defs>
      <linearGradient id="logoGradTop" x1="30" y1="30" x2="80" y2="50" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2563eb" />
        <stop offset="1" stopColor="#3b82f6" />
      </linearGradient>
      <linearGradient id="logoGradMain" x1="40" y1="50" x2="65" y2="90" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1e40af" />
        <stop offset="1" stopColor="#3b82f6" />
      </linearGradient>
    </defs>

    {/* --- TEXT: FinAi --- */}
    {showText && (
      <text 
        x="95" 
        y="66" 
        fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif" 
        fontWeight="800" 
        fontSize="54" 
        letterSpacing="-1.5" 
        fill="currentColor" 
      >
        FinAi
      </text>
    )}
  </svg>
);
