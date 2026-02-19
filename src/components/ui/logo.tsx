import React from "react";

export const FinAiLogo = ({ className = "w-48 h-auto", showText = true }: { className?: string, showText?: boolean }) => (
  <svg viewBox="0 0 320 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      {/* 1. Main Cyan Gradient for Text */}
      <linearGradient id="textGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#22d3ee" /> {/* Cyan-400 */}
        <stop offset="100%" stopColor="#0891b2" /> {/* Cyan-600 */}
      </linearGradient>

      {/* 2. The 3D Arrow Gradient (The showstopper) */}
      <linearGradient id="arrowGrad" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stopColor="#06b6d4" /> {/* Cyan */}
        <stop offset="50%" stopColor="#22d3ee" /> {/* Bright Cyan */}
        <stop offset="100%" stopColor="#4ade80" /> {/* Neon Green */}
      </linearGradient>

      {/* 3. Shadow for 3D depth */}
      <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      
      <filter id="innerDepth" x="-10%" y="-10%" width="120%" height="120%">
          <feFlood floodColor="#000" floodOpacity="0.3" result="flood"/>
          <feComposite in="flood" in2="SourceAlpha" operator="in" result="shadow"/>
          <feOffset dx="1" dy="2" in="shadow" result="offset"/>
          <feGaussianBlur in="offset" stdDeviation="1" result="blur"/>
          <feComposite in="blur" in2="SourceAlpha" operator="out" result="inset"/>
          <feComposite in="SourceGraphic" in2="inset" operator="over"/>
      </filter>
    </defs>

    {/* --- TEXT: Fin --- */}
    {showText && (
      <g filter="url(#innerDepth)">
        {/* F */}
        <path d="M10 20 L 35 20 L 35 30 L 22 30 L 22 45 L 32 45 L 32 55 L 22 55 L 22 80 L 10 80 Z" fill="url(#textGrad)" />
        {/* i */}
        <rect x="38" y="32" width="10" height="48" fill="url(#textGrad)" />
        <circle cx="43" cy="22" r="6" fill="url(#textGrad)" />
        {/* n */}
        <path d="M55 32 L 65 32 L 65 40 Q 65 32 78 32 L 90 32 L 90 80 L 80 80 L 80 45 Q 80 40 75 40 L 75 80 L 65 80 L 55 80 Z" fill="url(#textGrad)" />
      </g>
    )}

    {/* --- THE 3D LOGO MARK: A with Arrow --- */}
    <g transform={showText ? "translate(100, 10)" : "translate(0, 10) scale(1.2)"} filter="url(#softGlow)">
       {/* Left Leg of A (Darker backing) */}
       <path d="M20 80 L 50 15 L 60 15 L 35 80 Z" fill="#155e75" />
       
       {/* The Ribbon Arrow wrapping around */}
       {/* Rising Part */}
       <path d="M30 60 L 65 -5 L 80 5 L 45 65 Z" fill="url(#arrowGrad)" />
       
       {/* Arrow Head */}
       <path d="M58 -10 L 95 -20 L 88 15 Z" fill="#4ade80" />
       
       {/* The Crossbar / Fold effect */}
       <path d="M28 60 L 45 60 L 50 50 L 32 50 Z" fill="#0e7490" opacity="0.8" />
    </g>

    {/* --- TEXT: i (End) --- */}
    {showText && (
      <g filter="url(#innerDepth)" transform="translate(110, 0)">
        <rect x="90" y="32" width="10" height="48" fill="url(#textGrad)" />
        <circle cx="95" cy="22" r="6" fill="url(#textGrad)" />
      </g>
    )}
  </svg>
);
