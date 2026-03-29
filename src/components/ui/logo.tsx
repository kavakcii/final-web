import React from "react";
import { cn } from "@/lib/utils";

export const FinAiLogo = ({ className, showText = true }: { className?: string, showText?: boolean }) => (
  <svg viewBox="0 0 320 100" className={cn("text-[#0f3eaf] dark:text-white", className || "w-48 h-auto")} fill="none" xmlns="http://www.w3.org/2000/svg">
    
    {/* --- APPLE-STYLE SQUIRCLE ICON --- */}
    <g transform={showText ? "translate(0, 5)" : "translate(110, 5)"}>
        {/* Soft Shadow behind the squircle */}
        <rect x="18" y="20" width="60" height="60" rx="16" fill="black" opacity="0.1" filter="blur(4px)" />
        
        {/* App Icon Base */}
        <rect x="15" y="15" width="60" height="60" rx="16" fill="url(#finAiGrad)" />
        
        {/* Trending Arrow Path (Spark/Activity) */}
        <path d="M 30 55 L 42 42 L 52 50 L 63 32" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 52 32 L 63 32 L 63 43" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>

    <defs>
      <linearGradient id="finAiGrad" x1="15" y1="15" x2="75" y2="75" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2563eb" /> {/* blue-600 */}
        <stop offset="1" stopColor="#4f46e5" /> {/* indigo-600 */}
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
