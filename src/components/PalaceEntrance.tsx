"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthComponent } from "@/components/ui/sign-up";

interface PalaceEntranceProps {
    onComplete?: () => void;
}

export default function PalaceEntrance({ onComplete }: PalaceEntranceProps) {
    const [phase, setPhase] = useState<"idle" | "zooming" | "doors" | "form">("idle");

    useEffect(() => {
        // Start the animation sequence
        const t1 = setTimeout(() => setPhase("zooming"), 300);
        const t2 = setTimeout(() => setPhase("doors"), 2800);
        const t3 = setTimeout(() => setPhase("form"), 4500);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, []);

    const isZooming = phase === "zooming" || phase === "doors" || phase === "form";
    const doorsOpen = phase === "doors" || phase === "form";
    const showForm = phase === "form";

    return (
        <div className="fixed inset-0 z-[100] bg-[#020817] overflow-hidden">
            {/* Starry background */}
            <div className="absolute inset-0">
                {Array.from({ length: 80 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full bg-white"
                        style={{
                            width: Math.random() * 2 + 1 + "px",
                            height: Math.random() * 2 + 1 + "px",
                            left: Math.random() * 100 + "%",
                            top: Math.random() * 100 + "%",
                            opacity: Math.random() * 0.6 + 0.2,
                            animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
                            animationDelay: Math.random() * 2 + "s",
                        }}
                    />
                ))}
            </div>

            {/* Palace Scene - zooms in */}
            <motion.div
                className="absolute inset-0 flex items-end justify-center"
                animate={{
                    scale: isZooming ? 2.5 : 1,
                    y: isZooming ? "15%" : "0%",
                }}
                transition={{ duration: 2.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
                {/* Ground / Floor */}
                <div className="absolute bottom-0 left-0 right-0 h-[15vh] bg-gradient-to-t from-[#0a1628] to-transparent" />

                {/* Floor tiles */}
                <div className="absolute bottom-0 left-0 right-0 h-[8vh]" style={{
                    background: "repeating-linear-gradient(90deg, #0d1f3a 0px, #0d1f3a 48px, #0a192f 48px, #0a192f 50px), linear-gradient(to top, #0a192f, #0d1f3a)",
                    backgroundSize: "50px 100%, 100% 100%",
                }} />

                {/* === PALACE BUILDING === */}
                <div className="relative flex flex-col items-center" style={{ marginBottom: "8vh" }}>

                    {/* Main Palace Body */}
                    <div className="relative">
                        {/* Roof / Dome */}
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[280px] flex flex-col items-center">
                            {/* Spire */}
                            <div className="w-1 h-8 bg-gradient-to-t from-amber-400 to-amber-200 rounded-t-full mb-1 shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                            {/* Dome */}
                            <div className="w-[120px] h-[40px] rounded-t-full bg-gradient-to-b from-amber-500/60 to-slate-800 border-t border-x border-amber-500/30" />
                            {/* Roof bar */}
                            <div className="w-[280px] h-3 bg-gradient-to-r from-slate-700 via-amber-600/40 to-slate-700 border-b border-amber-500/20" />
                        </div>

                        {/* Upper Facade */}
                        <div className="w-[280px] bg-gradient-to-b from-[#0f2744] to-[#0a1e38] border-x border-t border-white/5 flex flex-col items-center pt-4 pb-2">
                            {/* FinAl Text on building */}
                            <div className="text-center mb-3">
                                <span className="text-amber-400/80 text-[10px] tracking-[4px] uppercase font-light">Welcome to</span>
                                <div className="flex items-center justify-center gap-1 mt-1">
                                    <span className="text-white text-lg font-extrabold tracking-tight">Fin</span>
                                    <span className="text-blue-400 text-lg font-extrabold tracking-tight">Al</span>
                                </div>
                            </div>

                            {/* Upper windows row */}
                            <div className="flex gap-6 mb-3">
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="w-6 h-10 rounded-t-full bg-amber-400/10 border border-amber-500/20 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent" />
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-full bg-amber-500/10" />
                                    </div>
                                ))}
                            </div>

                            {/* Decorative line */}
                            <div className="w-[240px] h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                        </div>

                        {/* === COLUMNS & DOOR AREA === */}
                        <div className="w-[280px] h-[120px] bg-gradient-to-b from-[#0a1e38] to-[#081830] border-x border-white/5 relative flex items-end justify-center">
                            {/* Left Column */}
                            <div className="absolute left-4 top-0 bottom-0 w-5 bg-gradient-to-r from-slate-600/20 to-slate-700/10 rounded-t-sm border-x border-white/5">
                                <div className="absolute top-0 left-0 right-0 h-3 bg-slate-600/30 rounded-t-sm" />
                                <div className="absolute bottom-0 left-0 right-0 h-3 bg-slate-600/30" />
                            </div>
                            {/* Right Column */}
                            <div className="absolute right-4 top-0 bottom-0 w-5 bg-gradient-to-r from-slate-700/10 to-slate-600/20 rounded-t-sm border-x border-white/5">
                                <div className="absolute top-0 left-0 right-0 h-3 bg-slate-600/30 rounded-t-sm" />
                                <div className="absolute bottom-0 left-0 right-0 h-3 bg-slate-600/30" />
                            </div>

                            {/* Inner columns */}
                            <div className="absolute left-[60px] top-0 bottom-0 w-3 bg-gradient-to-r from-slate-700/15 to-slate-800/10 border-x border-white/3" />
                            <div className="absolute right-[60px] top-0 bottom-0 w-3 bg-gradient-to-r from-slate-800/10 to-slate-700/15 border-x border-white/3" />

                            {/* Door frame */}
                            <div className="relative w-[100px] h-[90px] flex items-end justify-center">
                                {/* Door arch */}
                                <div className="absolute -top-1 left-0 right-0 h-[92px] rounded-t-[50px] border-t-2 border-x-2 border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent" />

                                {/* Sensor light */}
                                <motion.div
                                    className="absolute -top-4 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
                                    animate={{
                                        backgroundColor: doorsOpen ? "#22c55e" : "#ef4444",
                                        boxShadow: doorsOpen
                                            ? "0 0 12px rgba(34,197,94,0.6)"
                                            : "0 0 8px rgba(239,68,68,0.4)",
                                    }}
                                    transition={{ duration: 0.3 }}
                                />

                                {/* Inside glow (visible when doors open) */}
                                <motion.div
                                    className="absolute inset-1 rounded-t-[45px] bg-gradient-to-b from-blue-500/20 via-blue-400/10 to-amber-400/5"
                                    animate={{ opacity: doorsOpen ? 1 : 0 }}
                                    transition={{ duration: 0.8 }}
                                />

                                {/* LEFT DOOR */}
                                <motion.div
                                    className="absolute left-[2px] top-[2px] w-[48px] h-[86px] rounded-tl-[48px] bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 z-10 origin-left overflow-hidden"
                                    animate={{ rotateY: doorsOpen ? -85 : 0 }}
                                    transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                                    style={{ transformStyle: "preserve-3d", perspective: "800px" }}
                                >
                                    {/* Door panel details */}
                                    <div className="absolute inset-2 rounded-tl-[40px] border border-white/5" />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full bg-amber-500/40 shadow-[0_0_6px_rgba(251,191,36,0.3)]" />
                                    {/* Glass panel */}
                                    <div className="absolute inset-4 rounded-tl-[35px] bg-blue-400/5 border border-blue-300/5" />
                                </motion.div>

                                {/* RIGHT DOOR */}
                                <motion.div
                                    className="absolute right-[2px] top-[2px] w-[48px] h-[86px] rounded-tr-[48px] bg-gradient-to-bl from-slate-700 to-slate-800 border border-white/10 z-10 origin-right overflow-hidden"
                                    animate={{ rotateY: doorsOpen ? 85 : 0 }}
                                    transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                                    style={{ transformStyle: "preserve-3d", perspective: "800px" }}
                                >
                                    <div className="absolute inset-2 rounded-tr-[40px] border border-white/5" />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full bg-amber-500/40 shadow-[0_0_6px_rgba(251,191,36,0.3)]" />
                                    <div className="absolute inset-4 rounded-tr-[35px] bg-blue-400/5 border border-blue-300/5" />
                                </motion.div>
                            </div>
                        </div>

                        {/* Base / Platform */}
                        <div className="w-[320px] -ml-5 h-4 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 border-t border-amber-500/10 rounded-b-sm" />
                    </div>

                    {/* === STAIRS === */}
                    <div className="absolute -bottom-4 flex items-end justify-center w-full" style={{ pointerEvents: "none" }}>
                        {/* Left Staircase */}
                        <div className="absolute left-1/2 -translate-x-[190px] bottom-0">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div
                                    key={`left-${i}`}
                                    className="bg-gradient-to-r from-slate-700/60 to-slate-800/40 border border-white/5"
                                    style={{
                                        width: 40 + i * 6 + "px",
                                        height: "6px",
                                        marginTop: i === 0 ? "0" : "-1px",
                                        marginLeft: -(i * 6) + "px",
                                        borderRadius: "1px",
                                        transform: `translateX(${-i * 2}px)`,
                                    }}
                                />
                            ))}
                            {/* Left railing */}
                            <div className="absolute -left-1 bottom-0 w-px bg-gradient-to-t from-amber-500/30 to-transparent" style={{ height: 8 * 6 + "px" }} />
                        </div>

                        {/* Right Staircase */}
                        <div className="absolute left-1/2 translate-x-[110px] bottom-0">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div
                                    key={`right-${i}`}
                                    className="bg-gradient-to-l from-slate-700/60 to-slate-800/40 border border-white/5"
                                    style={{
                                        width: 40 + i * 6 + "px",
                                        height: "6px",
                                        marginTop: i === 0 ? "0" : "-1px",
                                        borderRadius: "1px",
                                        transform: `translateX(${i * 2}px)`,
                                    }}
                                />
                            ))}
                            {/* Right railing */}
                            <div className="absolute -right-1 bottom-0 w-px bg-gradient-to-t from-amber-500/30 to-transparent" style={{ height: 8 * 6 + "px" }} />
                        </div>
                    </div>

                    {/* Lamp posts */}
                    <div className="absolute -left-20 bottom-8 flex flex-col items-center">
                        <motion.div
                            className="w-3 h-3 rounded-full bg-amber-400/60"
                            animate={{ boxShadow: ["0 0 8px rgba(251,191,36,0.3)", "0 0 20px rgba(251,191,36,0.6)", "0 0 8px rgba(251,191,36,0.3)"] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <div className="w-px h-16 bg-slate-600/40" />
                        <div className="w-4 h-1 bg-slate-600/40 rounded" />
                    </div>
                    <div className="absolute -right-20 bottom-8 flex flex-col items-center">
                        <motion.div
                            className="w-3 h-3 rounded-full bg-amber-400/60"
                            animate={{ boxShadow: ["0 0 8px rgba(251,191,36,0.3)", "0 0 20px rgba(251,191,36,0.6)", "0 0 8px rgba(251,191,36,0.3)"] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                        />
                        <div className="w-px h-16 bg-slate-600/40" />
                        <div className="w-4 h-1 bg-slate-600/40 rounded" />
                    </div>
                </div>
            </motion.div>

            {/* Vignette overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: "radial-gradient(ellipse at center, transparent 40%, rgba(2,8,23,0.8) 100%)"
            }} />

            {/* Auth Form overlay - appears after doors open */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0 z-50 flex items-center justify-center"
                    >
                        {/* Dark overlay to fade out palace */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.85 }}
                            transition={{ duration: 1.5 }}
                            className="absolute inset-0 bg-[#020817]"
                        />

                        {/* Auth form */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="relative z-10 w-full h-full"
                        >
                            <AuthComponent />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CSS for stars twinkle */}
            <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }
      `}</style>
        </div>
    );
}
