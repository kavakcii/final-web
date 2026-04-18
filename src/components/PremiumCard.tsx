"use client";

import React from "react";
import { motion } from "framer-motion";
import { Wifi } from "lucide-react";
import { FinAiLogo } from "./FinAiLogo";
import { useUser } from "@/components/providers/UserProvider";

interface PremiumCardProps {
    userName: string;
}

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
            className="relative w-full max-w-[380px] aspect-[1.586/1] rounded-[20px] overflow-hidden shadow-2xl cursor-pointer group preserve-3d"
        >
            {/* Base Background with Texture */}
            <div className="absolute inset-0 bg-[#001a4d] bg-gradient-to-br from-[#001a4d] via-[#00008B] to-[#001a4d]">
                <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
            </div>

            {/* Inner Content */}
            <div className="relative h-full w-full p-8 flex flex-col justify-between text-white select-none">
                {/* Top Row: Logo and Contactless */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <FinAiLogo className="w-10 h-10 drop-shadow-lg" />
                        <span className="text-2xl font-black tracking-tighter">
                            FinAi<span className="text-blue-400">.</span>
                        </span>
                    </div>
                    <div className="rotate-90">
                        <Wifi className="w-8 h-8 opacity-60" />
                    </div>
                </div>

                {/* Middle: Chip */}
                <div className="mt-4">
                    <div className="w-14 h-11 bg-gradient-to-br from-[#ffd700] via-[#fdf5e6] to-[#daa520] rounded-lg shadow-inner relative overflow-hidden">
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-px opacity-30">
                            {[...Array(9)].map((_, i) => (
                                <div key={i} className="border-[0.5px] border-black/20" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom: Card Details */}
                <div className="mt-auto space-y-6">
                    {/* Card Number */}
                    <div className="text-2xl font-mono tracking-[0.2em] drop-shadow-md">
                        **** **** **** {formattedJoinDate}
                    </div>

                    {/* Footer: Name and Expiry */}
                    <div className="flex justify-between items-end uppercase tracking-widest">
                        <div className="space-y-1">
                            <span className="text-[10px] opacity-50 font-bold">Card Holder</span>
                            <p className="text-lg font-bold drop-shadow-sm">{userName || "FINAI USER"}</p>
                        </div>
                        <div className="text-right space-y-1">
                            <span className="text-[10px] opacity-50 font-bold">Valid Thru</span>
                            <p className="text-sm font-bold">12/30</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reflection Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
        </motion.div>
    );
}
