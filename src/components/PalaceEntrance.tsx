"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthComponent } from "@/components/ui/sign-up";

export default function PalaceEntrance() {
    const [phase, setPhase] = useState<"building" | "zooming" | "doors" | "form">("building");

    useEffect(() => {
        const t1 = setTimeout(() => setPhase("zooming"), 600);
        const t2 = setTimeout(() => setPhase("doors"), 3200);
        const t3 = setTimeout(() => setPhase("form"), 5000);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, []);

    const isZooming = phase === "zooming" || phase === "doors" || phase === "form";
    const doorsOpen = phase === "doors" || phase === "form";
    const showForm = phase === "form";

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden" style={{ background: "linear-gradient(180deg, #0b1526 0%, #162544 40%, #1a3055 70%, #0d1b2e 100%)" }}>

            {/* ===== ANIMATED STARS ===== */}
            <div className="absolute inset-0 overflow-hidden">
                {Array.from({ length: 60 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full bg-white"
                        style={{
                            width: Math.random() * 2.5 + 0.5,
                            height: Math.random() * 2.5 + 0.5,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 50}%`,
                        }}
                        animate={{ opacity: [0.2, 0.9, 0.2] }}
                        transition={{ duration: Math.random() * 3 + 2, repeat: Infinity, delay: Math.random() * 2 }}
                    />
                ))}
            </div>

            {/* ===== MOON ===== */}
            <motion.div
                className="absolute top-[8%] right-[15%] w-16 h-16 rounded-full"
                style={{
                    background: "radial-gradient(circle at 35% 35%, #fef3c7, #fbbf24)",
                    boxShadow: "0 0 60px rgba(251,191,36,0.3), 0 0 120px rgba(251,191,36,0.15)",
                }}
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* ===== ENTIRE SCENE (ZOOM TARGET) ===== */}
            <motion.div
                className="absolute inset-0 flex items-end justify-center origin-center"
                animate={{
                    scale: isZooming ? 3.2 : 1,
                    y: isZooming ? "-5%" : "0%",
                }}
                transition={{ duration: 2.8, ease: [0.22, 0.61, 0.36, 1] }}
            >

                {/* ===== GROUND ===== */}
                <div className="absolute bottom-0 left-0 right-0 h-[22vh]" style={{
                    background: "linear-gradient(180deg, #1a3a2a 0%, #0f2618 50%, #0a1a10 100%)",
                }}>
                    {/* Grass texture */}
                    {Array.from({ length: 40 }).map((_, i) => (
                        <motion.div
                            key={`grass-${i}`}
                            className="absolute bottom-0"
                            style={{
                                left: `${i * 2.5}%`,
                                width: "3px",
                                height: `${10 + Math.random() * 20}px`,
                                background: `linear-gradient(to top, transparent, ${Math.random() > 0.5 ? '#2d6b3f' : '#3a8f55'})`,
                                borderRadius: "2px 2px 0 0",
                                transformOrigin: "bottom",
                            }}
                            animate={{ rotateZ: [-3, 3, -3] }}
                            transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() }}
                        />
                    ))}
                </div>

                {/* Pathway */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80px] h-[22vh]" style={{
                    background: "linear-gradient(180deg, #8b7355 0%, #6b5a42 50%, #5a4a35 100%)",
                    clipPath: "polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)",
                }} />

                {/* ===== BUILDING ===== */}
                <div className="relative flex flex-col items-center" style={{ marginBottom: "22vh" }}>

                    {/* ---- ROOF ---- */}
                    <div className="relative w-[360px] flex flex-col items-center">
                        {/* Flag pole */}
                        <motion.div className="flex flex-col items-center mb-1"
                            animate={{ rotateZ: [-1, 1, -1] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            <div className="w-[2px] h-10 bg-gradient-to-t from-amber-600 to-amber-300" />
                            <motion.div
                                className="w-8 h-5 -mt-5 ml-1 rounded-sm"
                                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", transformOrigin: "left center" }}
                                animate={{ scaleX: [1, 0.85, 1], rotateZ: [0, -3, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </motion.div>

                        {/* Main roof triangle */}
                        <div className="w-[360px] h-[50px] relative">
                            <div className="absolute inset-0" style={{
                                background: "linear-gradient(180deg, #8B4513 0%, #A0522D 40%, #6B3410 100%)",
                                clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
                            }} />
                            {/* Roof shingle lines */}
                            <div className="absolute w-full h-full" style={{
                                clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
                                background: "repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(0,0,0,0.1) 8px, rgba(0,0,0,0.1) 10px)",
                            }} />
                        </div>
                        {/* Roof edge */}
                        <div className="w-[380px] h-[6px] -mt-[1px] rounded-b-sm" style={{
                            background: "linear-gradient(90deg, #4a3520, #8B6914, #D4A843, #8B6914, #4a3520)",
                        }} />
                    </div>

                    {/* ---- UPPER FLOOR ---- */}
                    <div className="w-[340px] relative" style={{
                        background: "linear-gradient(180deg, #E8DCC8 0%, #D4C4A8 100%)",
                        borderLeft: "4px solid #C4B090",
                        borderRight: "4px solid #C4B090",
                        height: "80px",
                    }}>
                        {/* FinAl sign */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-lg border border-amber-500/40" style={{
                            background: "linear-gradient(135deg, #1a1a2e, #16213e)",
                        }}>
                            <span className="text-white font-extrabold text-xs tracking-wider">Fin</span>
                            <span className="text-blue-400 font-extrabold text-xs tracking-wider">Al</span>
                        </div>

                        {/* Upper windows */}
                        <div className="absolute bottom-3 left-0 right-0 flex justify-evenly px-8">
                            {[0, 1, 2, 3, 4].map((i) => (
                                <div key={i} className="relative">
                                    <div className="w-[28px] h-[32px] rounded-t-[14px] overflow-hidden" style={{
                                        border: "2px solid #8B7355",
                                        background: "linear-gradient(180deg, #1a2744 0%, #0f1a2e 100%)",
                                    }}>
                                        {/* Window glow */}
                                        <motion.div
                                            className="absolute inset-0"
                                            style={{ background: "radial-gradient(circle at center, rgba(251,191,36,0.4), transparent)" }}
                                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                                            transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                                        />
                                        {/* Cross bars */}
                                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-amber-800/60 -translate-x-1/2" />
                                        <div className="absolute top-1/2 left-0 right-0 h-px bg-amber-800/60" />
                                    </div>
                                    {/* Window sill */}
                                    <div className="w-[32px] h-[3px] bg-amber-800/60 rounded-b-sm -mx-[2px]" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ---- DECORATIVE BAND ---- */}
                    <div className="w-[340px] h-[8px]" style={{
                        background: "linear-gradient(90deg, #6B5A42, #D4A843, #F0C75E, #D4A843, #6B5A42)",
                        borderTop: "1px solid #F0D878",
                        borderBottom: "1px solid #8B7355",
                    }} />

                    {/* ---- GROUND FLOOR (with door) ---- */}
                    <div className="w-[340px] relative" style={{
                        background: "linear-gradient(180deg, #D4C4A8 0%, #C4B090 50%, #B8A880 100%)",
                        borderLeft: "4px solid #A89870",
                        borderRight: "4px solid #A89870",
                        height: "100px",
                    }}>
                        {/* Brick-like texture */}
                        <div className="absolute inset-0 opacity-10" style={{
                            background: "repeating-linear-gradient(0deg, transparent, transparent 14px, rgba(0,0,0,0.15) 14px, rgba(0,0,0,0.15) 15px), repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(0,0,0,0.08) 30px, rgba(0,0,0,0.08) 31px)",
                        }} />

                        {/* Side windows */}
                        {[-1, 1].map((side) => (
                            <div key={side} className="absolute top-[15px]" style={{ [side < 0 ? 'left' : 'right']: '24px' }}>
                                <div className="w-[36px] h-[50px] rounded-t-lg overflow-hidden" style={{
                                    border: "3px solid #8B7355",
                                    background: "linear-gradient(180deg, #1a2744, #0f1a2e)",
                                }}>
                                    <motion.div
                                        className="absolute inset-0"
                                        style={{ background: "radial-gradient(circle at center, rgba(59,130,246,0.3), transparent)" }}
                                        animate={{ opacity: [0.2, 0.6, 0.2] }}
                                        transition={{ duration: 4, repeat: Infinity, delay: side < 0 ? 0 : 2 }}
                                    />
                                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-amber-800/50 -translate-x-1/2" />
                                    <div className="absolute top-1/2 left-0 right-0 h-px bg-amber-800/50" />
                                </div>
                                <div className="w-[40px] h-[3px] bg-amber-800/50 rounded-b-sm -ml-[2px]" />
                            </div>
                        ))}

                        {/* ===== MAIN DOOR ===== */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70px] h-[78px] flex flex-col items-center">
                            {/* Door arch */}
                            <div className="w-[74px] h-[82px] absolute -top-1 left-1/2 -translate-x-1/2 rounded-t-[37px]" style={{
                                border: "3px solid #8B6914",
                                borderBottom: "none",
                                background: "transparent",
                            }} />

                            {/* Sensor light */}
                            <motion.div
                                className="absolute -top-5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full z-20"
                                animate={{
                                    backgroundColor: doorsOpen ? "#22c55e" : "#ef4444",
                                    boxShadow: doorsOpen ? "0 0 15px #22c55e" : "0 0 10px #ef4444",
                                }}
                                transition={{ duration: 0.4 }}
                            />

                            {/* Interior glow behind doors */}
                            <motion.div
                                className="absolute inset-0 rounded-t-[34px] z-0"
                                style={{ background: "linear-gradient(180deg, rgba(59,130,246,0.5), rgba(251,191,36,0.3), rgba(59,130,246,0.2))" }}
                                animate={{ opacity: doorsOpen ? 1 : 0 }}
                                transition={{ duration: 0.8 }}
                            />

                            {/* LEFT DOOR */}
                            <motion.div
                                className="absolute left-0 top-0 w-[35px] h-[78px] rounded-tl-[35px] z-10 overflow-hidden"
                                style={{
                                    background: "linear-gradient(135deg, #5C3A1E, #8B5A2B, #6B4226)",
                                    borderLeft: "2px solid #4a2f15",
                                    borderTop: "2px solid #4a2f15",
                                }}
                                animate={{ x: doorsOpen ? -34 : 0 }}
                                transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                            >
                                {/* Door panels */}
                                <div className="absolute top-[20%] left-[15%] w-[60%] h-[25%] border border-amber-700/40 rounded-sm" />
                                <div className="absolute top-[55%] left-[15%] w-[60%] h-[25%] border border-amber-700/40 rounded-sm" />
                                {/* Handle */}
                                <div className="absolute right-[6px] top-[48%] w-[4px] h-[10px] rounded-full bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.6)]" />
                            </motion.div>

                            {/* RIGHT DOOR */}
                            <motion.div
                                className="absolute right-0 top-0 w-[35px] h-[78px] rounded-tr-[35px] z-10 overflow-hidden"
                                style={{
                                    background: "linear-gradient(225deg, #5C3A1E, #8B5A2B, #6B4226)",
                                    borderRight: "2px solid #4a2f15",
                                    borderTop: "2px solid #4a2f15",
                                }}
                                animate={{ x: doorsOpen ? 34 : 0 }}
                                transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                            >
                                <div className="absolute top-[20%] right-[15%] w-[60%] h-[25%] border border-amber-700/40 rounded-sm" />
                                <div className="absolute top-[55%] right-[15%] w-[60%] h-[25%] border border-amber-700/40 rounded-sm" />
                                <div className="absolute left-[6px] top-[48%] w-[4px] h-[10px] rounded-full bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.6)]" />
                            </motion.div>

                            {/* Door step */}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[80px] h-[4px] rounded bg-amber-800/40" />
                        </div>
                    </div>

                    {/* ---- FOUNDATION ---- */}
                    <div className="w-[360px] h-[10px]" style={{
                        background: "linear-gradient(180deg, #6B5A42, #4a3520)",
                        borderTop: "2px solid #8B7355",
                    }} />

                    {/* ===== STAIRS ===== */}
                    <div className="flex flex-col items-center w-[360px]">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div
                                key={`step-${i}`}
                                className="rounded-b-sm"
                                style={{
                                    width: 80 + i * 20 + "px",
                                    height: "5px",
                                    background: `linear-gradient(180deg, ${i % 2 === 0 ? '#9a8a6e' : '#8a7a5e'}, ${i % 2 === 0 ? '#7a6a4e' : '#6a5a3e'})`,
                                    borderLeft: "1px solid rgba(255,255,255,0.1)",
                                    borderRight: "1px solid rgba(255,255,255,0.1)",
                                    borderBottom: "1px solid rgba(0,0,0,0.2)",
                                    marginTop: i === 0 ? "0" : "-1px",
                                }}
                            />
                        ))}
                    </div>

                    {/* ===== LAMPS ===== */}
                    {[-1, 1].map((side) => (
                        <div key={`lamp-${side}`} className="absolute bottom-[6px]" style={{ [side < 0 ? 'left' : 'right']: '-40px' }}>
                            <div className="flex flex-col items-center">
                                {/* Lamp head */}
                                <div className="w-[14px] h-[10px] rounded-t-lg" style={{
                                    background: "linear-gradient(180deg, #2a2a2a, #1a1a1a)",
                                    border: "1px solid #3a3a3a",
                                }} />
                                {/* Lamp glow */}
                                <motion.div
                                    className="w-[10px] h-[8px]"
                                    style={{ background: "linear-gradient(180deg, #fbbf24, #f59e0b)" }}
                                    animate={{
                                        boxShadow: ["0 4px 15px rgba(251,191,36,0.4)", "0 4px 25px rgba(251,191,36,0.7)", "0 4px 15px rgba(251,191,36,0.4)"],
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                                {/* Pole */}
                                <div className="w-[3px] h-[50px] bg-gradient-to-b from-gray-600 to-gray-700" />
                                <div className="w-[12px] h-[3px] bg-gray-700 rounded" />
                            </div>
                        </div>
                    ))}

                    {/* ===== BUSHES ===== */}
                    {[-1, 1].map((side) => (
                        <motion.div
                            key={`bush-${side}`}
                            className="absolute bottom-[5px]"
                            style={{ [side < 0 ? 'left' : 'right']: '-15px' }}
                            animate={{ scaleY: [1, 1.03, 1], scaleX: [1, 0.98, 1] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <div className="w-[30px] h-[20px] rounded-t-full" style={{
                                background: "radial-gradient(ellipse at 50% 80%, #2d5a3a, #1a4028)",
                            }} />
                        </motion.div>
                    ))}

                    {/* ===== FLOATING PARTICLES (fireflies) ===== */}
                    {Array.from({ length: 8 }).map((_, i) => (
                        <motion.div
                            key={`firefly-${i}`}
                            className="absolute w-1 h-1 rounded-full bg-amber-300"
                            style={{
                                left: `${20 + Math.random() * 60}%`,
                                bottom: `${20 + Math.random() * 60}%`,
                            }}
                            animate={{
                                y: [0, -20 - Math.random() * 30, 0],
                                x: [0, (Math.random() - 0.5) * 40, 0],
                                opacity: [0, 0.8, 0],
                            }}
                            transition={{ duration: 3 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 3 }}
                        />
                    ))}
                </div>
            </motion.div>

            {/* ===== AUTH FORM OVERLAY ===== */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.2 }}
                        className="absolute inset-0 z-50 flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.9 }}
                            transition={{ duration: 1.5 }}
                            className="absolute inset-0 bg-[#020817]"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="relative z-10 w-full h-full"
                        >
                            <AuthComponent />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
