"use client";

import React, { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

// === SHARED DEFINITIONS (FILTERS & PATHS) ===
const Defs = () => (
    <defs>
        {/* GLOW FILTER */}
        <filter id="premiumGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* INNER SHADOW FOR 3D */}
        <filter id="depth3D" x="-20%" y="-20%" width="140%" height="140%">
            <feFlood floodColor="#000" floodOpacity="0.5" result="flood" />
            <feComposite in="flood" in2="SourceAlpha" operator="in" result="shadow" />
            <feOffset dx="2" dy="4" in="shadow" result="offset" />
            <feGaussianBlur in="offset" stdDeviation="3" result="blur" />
            <feComposite in="blur" in2="SourceAlpha" operator="out" result="inset" />
            <feComposite in="SourceGraphic" in2="inset" operator="over" />
        </filter>
    </defs>
);

// THE 3D ARROW 'A' PATH (Reusable)
const ArrowA = ({ primaryFill, secondaryFill, highlightFill }: { primaryFill: string, secondaryFill: string, highlightFill: string }) => (
    <g filter="url(#depth3D)">
        {/* Left Leg (Darker Back) */}
        <path d="M20 85 L 50 15 L 65 15 L 40 85 Z" fill={secondaryFill} opacity="0.9" />

        {/* The Rising Arrow Ribbon */}
        <path d="M30 65 L 70 -5 L 85 5 L 50 70 Z" fill={primaryFill} />

        {/* Arrow Head */}
        <path d="M60 -10 L 100 -20 L 90 20 Z" fill={highlightFill} filter="url(#premiumGlow)" />

        {/* The Fold/Crossbar */}
        <path d="M28 65 L 50 65 L 56 50 L 36 50 Z" fill={secondaryFill} opacity="0.6" />
    </g>
);

// TEXT COMPONENT
const FinText = ({ fill }: { fill: string }) => (
    <g filter="url(#depth3D)">
        <path d="M-90 20 L -65 20 L -65 30 L -78 30 L -78 45 L -68 45 L -68 55 L -78 55 L -78 80 L -90 80 Z" fill={fill} />
        <rect x="-62" y="32" width="10" height="48" fill={fill} />
        <circle cx="-57" cy="22" r="6" fill={fill} />
        <path d="M-45 32 L -35 32 L -35 40 Q -35 32 -22 32 L -10 32 L -10 80 L -20 80 L -20 45 Q -20 40 -25 40 L -25 80 L -35 80 L -45 80 Z" fill={fill} />
    </g>
);

const IText = ({ fill }: { fill: string }) => (
    <g filter="url(#depth3D)" transform="translate(110, 0)">
        <rect x="10" y="32" width="10" height="48" fill={fill} />
        <circle cx="15" cy="22" r="6" fill={fill} />
    </g>
);


// === LOGO VARIANTS ===

// 1. ORIGINAL CYAN
const Logo1 = () => (
    <svg viewBox="-100 -30 250 130" className="w-full h-auto" fill="none">
        <Defs />
        <defs>
            <linearGradient id="grad1Main" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#4ade80" />
            </linearGradient>
            <linearGradient id="grad1Dark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0e7490" />
                <stop offset="100%" stopColor="#155e75" />
            </linearGradient>
        </defs>
        <FinText fill="url(#grad1Main)" />
        <ArrowA primaryFill="url(#grad1Main)" secondaryFill="url(#grad1Dark)" highlightFill="#bbf7d0" />
        <IText fill="url(#grad1Main)" />
        <text x="0" y="105" fontSize="8" fill="#99f6e4" textAnchor="middle" letterSpacing="2" opacity="0.8">GROWTH & SUCCESS</text>
    </svg>
);

// 2. GOLD STANDARD (Luxury)
const Logo2 = () => (
    <svg viewBox="-100 -30 250 130" className="w-full h-auto" fill="none">
        <Defs />
        <defs>
            <linearGradient id="grad2Main" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#ca8a04" /> {/* Dark Gold */}
                <stop offset="50%" stopColor="#facc15" /> {/* Gold */}
                <stop offset="100%" stopColor="#fef08a" /> {/* Light Gold */}
            </linearGradient>
            <linearGradient id="grad2Dark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#854d0e" />
                <stop offset="100%" stopColor="#713f12" />
            </linearGradient>
        </defs>
        <FinText fill="url(#grad2Main)" />
        <ArrowA primaryFill="url(#grad2Main)" secondaryFill="url(#grad2Dark)" highlightFill="#fff" />
        <IText fill="url(#grad2Main)" />
        <text x="0" y="105" fontSize="8" fill="#fde047" textAnchor="middle" letterSpacing="2" opacity="0.7">PREMIUM FINANCE</text>
    </svg>
);

// 3. SAPPHIRE TRUST (Corporate Blue)
const Logo3 = () => (
    <svg viewBox="-100 -30 250 130" className="w-full h-auto" fill="none">
        <Defs />
        <defs>
            <linearGradient id="grad3Main" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
            <linearGradient id="grad3Dark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e3a8a" />
                <stop offset="100%" stopColor="#1e40af" />
            </linearGradient>
        </defs>
        <FinText fill="url(#grad3Main)" />
        <ArrowA primaryFill="url(#grad3Main)" secondaryFill="url(#grad3Dark)" highlightFill="#bfdbfe" />
        <IText fill="url(#grad3Main)" />
        <text x="0" y="105" fontSize="8" fill="#93c5fd" textAnchor="middle" letterSpacing="2" opacity="0.8">GLOBAL TRUST</text>
    </svg>
);

// 4. EMERALD WEALTH (Green)
const Logo4 = () => (
    <svg viewBox="-100 -30 250 130" className="w-full h-auto" fill="none">
        <Defs />
        <defs>
            <linearGradient id="grad4Main" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#16a34a" />
                <stop offset="100%" stopColor="#4ade80" />
            </linearGradient>
            <linearGradient id="grad4Dark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#14532d" />
                <stop offset="100%" stopColor="#166534" />
            </linearGradient>
        </defs>
        <FinText fill="url(#grad4Main)" />
        <ArrowA primaryFill="url(#grad4Main)" secondaryFill="url(#grad4Dark)" highlightFill="#bbf7d0" />
        <IText fill="url(#grad4Main)" />
        <text x="0" y="105" fontSize="8" fill="#86efac" textAnchor="middle" letterSpacing="2" opacity="0.8">SUSTAINABLE GROWTH</text>
    </svg>
);

// 5. FUTURE CRYPTO (Purple/Pink)
const Logo5 = () => (
    <svg viewBox="-100 -30 250 130" className="w-full h-auto" fill="none">
        <Defs />
        <defs>
            <linearGradient id="grad5Main" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>
            <linearGradient id="grad5Dark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4c1d95" />
                <stop offset="100%" stopColor="#5b21b6" />
            </linearGradient>
        </defs>
        <FinText fill="url(#grad5Main)" />
        <ArrowA primaryFill="url(#grad5Main)" secondaryFill="url(#grad5Dark)" highlightFill="#f5d0fe" />
        <IText fill="url(#grad5Main)" />
        <text x="0" y="105" fontSize="8" fill="#e879f9" textAnchor="middle" letterSpacing="2" opacity="0.8">NEXT GEN AI</text>
    </svg>
);

// 6. PLATINUM (Monochrome)
const Logo6 = () => (
    <svg viewBox="-100 -30 250 130" className="w-full h-auto" fill="none">
        <Defs />
        <defs>
            <linearGradient id="grad6Main" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="50%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>
            <linearGradient id="grad6Dark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="100%" stopColor="#475569" />
            </linearGradient>
        </defs>
        <FinText fill="url(#grad6Main)" />
        <ArrowA primaryFill="url(#grad6Main)" secondaryFill="url(#grad6Dark)" highlightFill="#ffffff" />
        <IText fill="url(#grad6Main)" />
        <text x="0" y="105" fontSize="8" fill="#cbd5e1" textAnchor="middle" letterSpacing="2" opacity="0.8">PLATINUM TIER</text>
    </svg>
);

// 7. COPPER & TEAL (Sophisticated)
const Logo7 = () => (
    <svg viewBox="-100 -30 250 130" className="w-full h-auto" fill="none">
        <Defs />
        <defs>
            <linearGradient id="grad7Main" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#c2410c" /> {/* Copper */}
                <stop offset="100%" stopColor="#fb923c" />
            </linearGradient>
            <linearGradient id="grad7Dark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c2d12" />
                <stop offset="100%" stopColor="#9a3412" />
            </linearGradient>
            <linearGradient id="grad7Teal" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#115e59" />
                <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
        </defs>
        <FinText fill="url(#grad7Teal)" /> {/* Teal Text */}
        <ArrowA primaryFill="url(#grad7Main)" secondaryFill="url(#grad7Dark)" highlightFill="#ffedd5" /> {/* Copper Arrow */}
        <IText fill="url(#grad7Teal)" />
        <text x="0" y="105" fontSize="8" fill="#fdba74" textAnchor="middle" letterSpacing="2" opacity="0.8">MODERN CLASSIC</text>
    </svg>
);

// 8. MIDNIGHT NEON (Deep Blue/Electric)
const Logo8 = () => (
    <svg viewBox="-100 -30 250 130" className="w-full h-auto" fill="none">
        <Defs />
        <defs>
            <linearGradient id="grad8Main" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="grad8Dark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e3a8a" />
                <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
        </defs>
        <FinText fill="#3b82f6" />
        <ArrowA primaryFill="url(#grad8Main)" secondaryFill="url(#grad8Dark)" highlightFill="#67e8f9" />
        <IText fill="#3b82f6" />
        <text x="0" y="105" fontSize="8" fill="#60a5fa" textAnchor="middle" letterSpacing="2" opacity="0.8">DEEP TECH</text>
    </svg>
);

// 9. CRIMSON ELITE (Bold Red)
const Logo9 = () => (
    <svg viewBox="-100 -30 250 130" className="w-full h-auto" fill="none">
        <Defs />
        <defs>
            <linearGradient id="grad9Main" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#f87171" />
            </linearGradient>
            <linearGradient id="grad9Dark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7f1d1d" />
                <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
        </defs>
        <FinText fill="#fff" /> {/* White Text for contrast */}
        <ArrowA primaryFill="url(#grad9Main)" secondaryFill="url(#grad9Dark)" highlightFill="#fca5a5" />
        <IText fill="#fff" />
        <text x="0" y="105" fontSize="8" fill="#fca5a5" textAnchor="middle" letterSpacing="2" opacity="0.8">POWER FINANCE</text>
    </svg>
);

// 10. GLASS PRISM (White/Translucent)
const Logo10 = () => (
    <svg viewBox="-100 -30 250 130" className="w-full h-auto" fill="none">
        <Defs />
        <defs>
            <linearGradient id="grad10Main" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="grad10Dark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64748b" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#475569" stopOpacity="0.8" />
            </linearGradient>
        </defs>
        <FinText fill="#fff" />
        <ArrowA primaryFill="url(#grad10Main)" secondaryFill="url(#grad10Dark)" highlightFill="#fff" />
        <IText fill="#fff" />
        <text x="0" y="105" fontSize="8" fill="#fff" textAnchor="middle" letterSpacing="2" opacity="0.6">PURE TRANSPARENCY</text>
    </svg>
);


const logos = [
    { id: 1, C: Logo1, name: "Reference Cyan", desc: "The original premium look." },
    { id: 2, C: Logo2, name: "Gold Standard", desc: "Luxury, wealth, exclusivity." },
    { id: 3, C: Logo3, name: "Sapphire Trust", desc: "Corporate blue, reliable." },
    { id: 4, C: Logo4, name: "Emerald Wealth", desc: "Green for growth & money." },
    { id: 5, C: Logo5, name: "Future Crypto", desc: "Modern, Web3, tech-forward." },
    { id: 6, C: Logo6, name: "Platinum Tier", desc: "Silver/Grey monochrome." },
    { id: 7, C: Logo7, name: "Copper & Teal", desc: "Unique sophisticated mix." },
    { id: 8, C: Logo8, name: "Midnight Neon", desc: "Deep blue with electric pop." },
    { id: 9, C: Logo9, name: "Crimson Elite", desc: "Bold, aggressive growth." },
    { id: 10, C: Logo10, name: "Glass Prism", desc: "Clean, minimal transparency." },
];

export default function LogoShowcase() {
    const [selected, setSelected] = useState<number | null>(null);

    return (
        <div className="min-h-screen bg-[#000] text-slate-100 p-8 font-sans">
            <header className="flex justify-between items-center mb-12 border-b border-slate-900 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Premium FinAI Identities</h1>
                    <p className="text-slate-400">Ten high-end variations of the 3D-Ribbon concept.</p>
                </div>
                <Link href="/dashboard" className="px-4 py-2 bg-slate-900 rounded text-sm hover:bg-slate-800 transition">Exit</Link>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 pb-24">
                {logos.map((logo) => (
                    <motion.div
                        key={logo.id}
                        onClick={() => setSelected(logo.id)}
                        whileHover={{ scale: 1.02 }}
                        className={`
               cursor-pointer bg-[#050505] rounded-xl overflow-hidden border transition-all duration-300
               ${selected === logo.id ? "border-cyan-500 ring-2 ring-cyan-500/50 shadow-2xl shadow-cyan-900/40" : "border-slate-800 hover:border-slate-600"}
            `}
                    >
                        <div className="h-48 bg-gradient-to-b from-[#0a0a0a] to-[#000] flex items-center justify-center p-8 relative">
                            {/* Glow behind logo */}
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className={`
                    absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 blur-3xl opacity-20 pointer-events-none rounded-full
                    ${logo.id === 2 ? "bg-yellow-500" : logo.id === 9 ? "bg-red-600" : "bg-cyan-500"}
                `}></div>

                            <div className="w-full max-w-[320px] relative z-10 transform transition-transform duration-500 group-hover:scale-105">
                                <logo.C />
                            </div>
                        </div>

                        <div className="p-5 border-t border-slate-900">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-white text-lg tracking-wide">{logo.id}. {logo.name}</h3>
                                {selected === logo.id && <Check className="text-cyan-500 w-6 h-6" />}
                            </div>
                            <p className="text-sm text-slate-500">{logo.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {selected && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md px-8 py-4 rounded-full shadow-2xl border border-slate-700 flex items-center gap-6 z-50">
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold text-center">SELECTED</p>
                        <p className="text-white font-bold">{logos.find(l => l.id === selected)?.name}</p>
                    </div>
                    <button className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-cyan-50 transition-colors shadow-lg">
                        Confirm
                    </button>
                </div>
            )}
        </div>
    );
}
