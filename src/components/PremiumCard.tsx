"use client";

import React from "react";
import { motion } from "framer-motion";
import { Wifi } from "lucide-react";
import { FinAiLogo } from "./FinAiLogo";
import { useUser } from "@/components/providers/UserProvider";

interface PremiumCardProps {
    userName: string;
    totalBalance?: string;
}

export function PremiumCard({ userName, totalBalance = "₺0,00" }: PremiumCardProps) {
    const { user } = useUser();

    // Format join date as DDMM
    const joinDate = user?.created_at ? new Date(user.created_at) : null;
    const formattedJoinDate = joinDate 
        ? `${joinDate.getDate().toString().padStart(2, '0')}${(joinDate.getMonth() + 1).toString().padStart(2, '0')}`
        : "0101";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative w-full max-w-[280px] aspect-[1.586/1] rounded-[16px] overflow-hidden shadow-2xl cursor-pointer preserve-3d"
        >
            {/* Base Background */}
            <div className="absolute inset-0 bg-[#001a4d] bg-gradient-to-br from-[#001a4d] via-[#00008B] to-[#001a4d]">
                <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
            </div>

            {/* Inner Content */}
            <div className="relative h-full w-full p-5 flex flex-col justify-between text-white select-none">
                {/* Top Row: Logo and Contactless */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1">
                        <FinAiLogo className="w-4 h-4 drop-shadow-lg" />
                        <span className="text-xs font-black tracking-tighter">
                            FinAi<span className="text-blue-400">.</span>
                        </span>
                    </div>
                    <div className="rotate-90">
                        <Wifi className="w-3.5 h-3.5 opacity-50" />
                    </div>
                </div>

                {/* Card Number */}
                <div className="text-[11px] font-mono tracking-[0.15em] drop-shadow-md whitespace-nowrap opacity-80">
                    **** **** **** {formattedJoinDate}
                </div>

                {/* Bottom: Just the balance amount */}
                <p className="text-lg font-black tracking-tight leading-none">{totalBalance}</p>
            </div>

            {/* Reflection Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
        </motion.div>
    );
}
