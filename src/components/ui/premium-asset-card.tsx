"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { Brain, ArrowUpRight } from "lucide-react";

interface PremiumAssetCardProps {
    symbol: string;
    onClick: () => void;
    className?: string;
}

export function PremiumAssetCard({ symbol, onClick, className }: PremiumAssetCardProps) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <div
            onClick={onClick}
            onMouseMove={handleMouseMove}
            className={cn(
                "group relative h-28 w-full cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 transition-all hover:bg-slate-900/80 hover:border-blue-500/30",
                className
            )}
        >
            {/* Spotlight Effect */}
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                            400px circle at ${mouseX}px ${mouseY}px,
                            rgba(59, 130, 246, 0.15),
                            transparent 80%
                        )
                    `,
                }}
            />

            <div className="relative flex h-full flex-col justify-between p-4 z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 group-hover:bg-blue-500/20 group-hover:scale-110 transition-all duration-500">
                            <Brain className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black tracking-tighter text-white group-hover:text-blue-400 transition-colors">
                                {symbol}
                            </h3>
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold group-hover:text-slate-400">
                                Portföy Varlığı
                            </p>
                        </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 duration-300">
                        <ArrowUpRight className="h-5 w-5 text-blue-400" />
                    </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-xs font-semibold text-blue-200/80 group-hover:text-blue-200">
                            AI ile Analiz Et
                        </span>
                    </div>

                    {/* Visual decor - subtle bars */}
                    <div className="flex gap-0.5 items-end h-3">
                        <div className="w-1 h-full bg-blue-500/20 rounded-full group-hover:bg-blue-500/40 transition-colors" />
                        <div className="w-1 h-2/3 bg-blue-500/20 rounded-full group-hover:bg-blue-500/40 transition-colors" />
                        <div className="w-1 h-1/2 bg-blue-500/20 rounded-full group-hover:bg-blue-500/40 transition-colors" />
                    </div>
                </div>
            </div>

            {/* Bottom Glow */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
}
