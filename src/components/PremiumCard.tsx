"use client";

import React from "react";
import { motion } from "framer-motion";
import { Wifi } from "lucide-react";
import { FinAiLogo } from "./FinAiLogo";
import { useUser } from "@/components/providers/UserProvider";

interface PremiumCardProps {
    userName: string;
}

export function PremiumCard({ userName }: PremiumCardProps) {
    const { user } = useUser();

    // Format join date as DD.MM
    const joinDate = user?.created_at ? new Date(user.created_at) : null;
    const formattedJoinDate = joinDate 
        ? `${joinDate.getDate().toString().padStart(2, '0')}.${(joinDate.getMonth() + 1).toString().padStart(2, '0')}`
        : "01.01";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, rotateY: 5, rotateX: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative w-full max-w-[280px] aspect-[1.586/1] rounded-[16px] overflow-hidden shadow-2xl cursor-pointer group preserve-3d"
        >
            {/* Base Background with Texture */}
            <div className="absolute inset-0 bg-[#001a4d] bg-gradient-to-br from-[#001a4d] via-[#00008B] to-[#001a4d]">
                <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
            </div>

            {/* Inner Content */}
            <div className="relative h-full w-full p-5 flex flex-col justify-between text-white select-none">
                {/* Top Row: Logo and Contactless */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5">
                        <FinAiLogo className="w-6 h-6 drop-shadow-lg" />
                        <span className="text-base font-black tracking-tighter">
                            FinAi<span className="text-blue-400">.</span>
                        </span>
                    </div>
                    <div className="rotate-90">
                        <Wifi className="w-5 h-5 opacity-60" />
                    </div>
                </div>

                {/* Middle: Chip and Card Number in Same Row */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-7 bg-gradient-to-br from-[#ffd700] via-[#fdf5e6] to-[#daa520] rounded-md shadow-inner relative overflow-hidden shrink-0">
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-px opacity-30">
                            {[...Array(9)].map((_, i) => (
                                <div key={i} className="border-[0.5px] border-black/20" />
                            ))}
                        </div>
                    </div>
                    
                    {/* Card Number - standard format */}
                    <div className="text-[13px] font-mono tracking-[0.18em] drop-shadow-md whitespace-nowrap opacity-90">
                        **** **** **** {formattedJoinDate.replace('.', '')}
                    </div>
                </div>

                {/* Bottom spacer for aspect ratio */}
                <div />
            </div>

            {/* Reflection Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
        </motion.div>
    );
}
