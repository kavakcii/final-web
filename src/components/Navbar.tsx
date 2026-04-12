"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/components/providers/UserProvider";
import { usePathname } from "next/navigation";

// Import new Tubelight Navbar and Icons
import { TubelightNavbar } from "@/components/ui/tubelight-navbar";
import { Home, Compass, Info, ShieldCheck } from "lucide-react";
import { Menu as LucideMenu, X } from "lucide-react";
import { FinAiLogo } from "@/components/ui/logo";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { isAuthenticated } = useUser();
    const pathname = usePathname();
    const isAuthPage = pathname === "/login" || pathname === "/register";

    // Scroll efekti için
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navItems = [
        { name: 'Ana Sayfa', url: '#hero', icon: Home },
        { name: 'Neler Var?', url: '#features', icon: Compass },
        { name: 'Merak Ettikleriniz', url: '#faq', icon: Info },
    ];

    if (isAuthPage) return null;

    return (
        <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-4' : 'py-6'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative flex items-center justify-between">
                
                {/* Sol Taraf - Logo */}
                <Link href="/" className="flex items-center group relative z-50 transition-transform hover:scale-105">
                    <FinAiLogo className="h-10 sm:h-12 w-auto" />
                </Link>

                {/* Orta Taraf - Tubelight Menu (Sadece Desktoptan Görünür) */}
                <div className="hidden md:block">
                    <TubelightNavbar items={navItems} />
                </div>

                {/* Sağ Taraf - Butonlar / Mobil Menü Butonu */}
                <div className="flex items-center gap-3 relative z-50">
                    {isAuthenticated ? (
                        <Link href="/dashboard" passHref legacyBehavior>
                            <motion.a
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="cursor-pointer px-6 py-2.5 text-sm font-bold text-white bg-[#00008B] hover:bg-black rounded-full shadow-[0_8px_30px_-5px_rgba(0,0,139,0.4)] transition-all hidden sm:block"
                            >
                                Giriş Yap
                            </motion.a>
                        </Link>
                    ) : (
                        <div className="hidden sm:flex items-center gap-3">
                            <Link href="/login" passHref legacyBehavior>
                                <motion.a
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="cursor-pointer px-6 py-2.5 text-sm font-bold text-[#00008B] hover:bg-slate-100 rounded-full border-2 border-slate-200 hover:border-[#00008B] transition-all bg-white relative z-50 block"
                                >
                                    Giriş Yap
                                </motion.a>
                            </Link>
                            <Link href="/login?tab=register" passHref legacyBehavior>
                                <motion.a
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="cursor-pointer px-6 py-2.5 text-sm font-bold text-white bg-[#00008B] hover:bg-black rounded-full shadow-[0_8px_30px_-5px_rgba(0,0,139,0.4)] transition-all relative z-50 block"
                                >
                                    Kaydol
                                </motion.a>
                            </Link>
                        </div>
                    )}

                    {/* Mobile Hamburger Button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2.5 bg-white/80 backdrop-blur-md rounded-xl border border-slate-200/50 shadow-sm text-[#00008B] sm:hidden"
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <LucideMenu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Content (Hamburger açıldığında) */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="sm:hidden absolute top-[80px] left-4 right-4 bg-white/95 backdrop-blur-2xl border border-slate-200/50 rounded-3xl shadow-2xl overflow-hidden z-[60]"
                    >
                        <div className="px-5 py-6 space-y-3">
                            {navItems.map((item) => (
                                <Link key={item.name} href={item.url} onClick={() => setIsOpen(false)} className="flex items-center gap-4 px-4 py-3.5 text-base font-bold text-[#0a192f] hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-2xl transition-all">
                                    <item.icon className="w-5 h-5 text-blue-600" />
                                    {item.name}
                                </Link>
                            ))}
                            <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col gap-3 px-2">
                                {!isAuthenticated && (
                                    <Link
                                        href="/login?tab=register"
                                        onClick={() => setIsOpen(false)}
                                        className="block w-full text-center px-4 py-3.5 text-base font-bold text-white bg-[#0a192f] hover:bg-black rounded-2xl shadow-lg shadow-[#0a192f]/20 transition-all"
                                    >
                                        Kaydol
                                    </Link>
                                )}
                                <Link
                                    href={isAuthenticated ? "/dashboard" : "/login"}
                                    onClick={() => setIsOpen(false)}
                                    className="block w-full text-center px-4 py-3.5 text-base font-bold text-[#0a192f] bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 rounded-2xl transition-all"
                                >
                                    {isAuthenticated ? "Giriş Yap" : "Giriş Yap"}
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
