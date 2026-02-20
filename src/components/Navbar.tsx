"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu as LucideMenu, X } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { isAuthenticated } = useUser();

    return (
        <div className="fixed top-0 left-0 right-0 z-50">
            {/* Mobile Navbar Background & Border */}
            <div className="block md:hidden bg-black/50 backdrop-blur-md border-b border-white/10">
                <div className="flex items-center justify-between h-16 px-4">
                    <Link href="/" className="flex items-center space-x-2">
                        <Image src="/logo.png" alt="FinAi" width={36} height={36} className="rounded" />
                        <span className="text-xl font-bold text-white">FinAi</span>
                    </Link>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <LucideMenu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Desktop Navbar */}
            <div className="hidden md:flex items-center justify-between px-10 py-4 bg-[#0a192f]/90 border-b border-blue-900/30 backdrop-blur-md shadow-lg transition-all duration-300">
                <Link href="/" className="flex items-center space-x-2 group">
                    <Image src="/logo.png" alt="FinAi" width={40} height={40} className="rounded-lg group-hover:opacity-90 transition-opacity" />
                    <span className="text-xl font-bold text-white tracking-tight group-hover:text-blue-200 transition-colors">FinAi</span>
                </Link>

                <div className="flex items-center space-x-8">
                    {['Biz Kimiz?', 'Neler Yapabiliriz?'].map((text, idx) => {
                        const hrefs = ['#hero', '#features'];
                        return (
                            <Link key={idx} href={hrefs[idx]} className="relative group px-2 py-1">
                                <span className="relative z-10 text-sm font-medium text-slate-300 group-hover:text-white transition-colors duration-300">{text}</span>
                                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500 transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-out"></span>
                            </Link>
                        );
                    })}
                </div>

                <div>
                    <Link href={isAuthenticated ? "/dashboard" : "/login"} passHref>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="cursor-pointer px-6 py-2.5 text-sm font-bold text-[#0a192f] bg-white hover:bg-blue-50 rounded-full shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_-5px_rgba(255,255,255,0.5)] transition-all flex items-center justify-center"
                        >
                            {isAuthenticated ? "Giriş" : "Giriş Yap"}
                        </motion.div>
                    </Link>
                </div>
            </div>

            {/* Mobile Menu Content */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-black border-b border-white/10 overflow-hidden"
                    >
                        <div className="px-6 py-6 space-y-6">
                            <Link href="#features" onClick={() => setIsOpen(false)} className="block text-lg font-medium text-neutral-300">Özellikler</Link>
                            <Link href="#" onClick={() => setIsOpen(false)} className="block text-lg font-medium text-neutral-300">Piyasalar</Link>
                            <Link
                                href={isAuthenticated ? "/dashboard" : "/login"}
                                onClick={() => setIsOpen(false)}
                                className="block w-full text-center px-4 py-3 text-base font-bold text-black bg-white rounded-xl"
                            >
                                {isAuthenticated ? "Giriş" : "Giriş Yap"}
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
