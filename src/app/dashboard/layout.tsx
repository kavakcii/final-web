"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
    TrendingUp,
    Home,
    PieChart,
    Settings,
    LogOut,
    Bell,
    Search,
    BarChart3,
    User,
    Database,
    FileText,
    Newspaper,
    Bot
} from "lucide-react";
import { FinancialTicker } from "@/components/FinancialTicker";

import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import { UserProvider, useUser } from "@/components/providers/UserProvider";
import { AuthComponent } from "@/components/ui/sign-up";

function DashboardShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const pathname = usePathname();

    // Consume Context
    const { isAuthenticated, userName, avatarUrl, isDataLoaded } = useUser();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    if (isAuthenticated === false) {
        return (
            <div className="min-h-screen bg-black relative flex items-center justify-center">
                <AuthComponent
                    brandName="FinAi"
                    className="w-full"
                />
            </div>
        );
    }

    if (isAuthenticated === null || (isAuthenticated === true && !isDataLoaded)) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const menuItems = [
        { icon: Home, label: "Ana Sayfa", href: "/dashboard" },
        { icon: PieChart, label: "Portföyüm", href: "/dashboard/portfolio" },
        { icon: BarChart3, label: "Analiz", href: "/dashboard/analysis" },
        { icon: Bot, label: "FinAi Robotum", href: "/dashboard/reports" },
        { icon: Database, label: "Fon Verileri", href: "/dashboard/data" },
        { icon: Newspaper, label: "Haberler", href: "/dashboard/news" },
        { icon: Bell, label: "Bildirimler", href: "/dashboard/notifications" },
        { icon: Settings, label: "Ayarlar", href: "/dashboard/settings" }
    ];

    return (
        <div className="min-h-screen flex text-zinc-100 relative selection:bg-emerald-500/30 overflow-hidden font-sans bg-[#09090b]">
            {/* 21st.dev Aesthetic Backgrounds: Dot matrix or subtle Noise */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-emerald-500 opacity-[0.05] blur-[100px]" />

            {/* MAIN WRAPPER (EDGE-TO-EDGE DASHBOARD) */}
            <div className="relative z-10 w-full h-full min-h-screen flex mx-auto max-w-[1920px]">
                <div className="flex-1 flex overflow-hidden bg-transparent">
                    
                    {/* Sidebar (Solid Navy Blue) */}
                    <aside className="w-20 hover:w-64 border-r border-[#0a192f] bg-[#0a192f] hidden md:flex flex-col transition-all duration-300 ease-in-out group z-50 shrink-0 h-full relative">
                        <div className="p-6 flex items-center h-20 shrink-0 border-b border-white/5">
                            <Link href="/" className="flex items-center space-x-2 w-full overflow-hidden">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10">
                                        <TrendingUp className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                                <span className="text-xl font-bold tracking-tight text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                                    FinAi<span className="text-blue-400">.</span>
                                </span>
                            </Link>
                        </div>

                        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                            {menuItems.map((item, idx) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link key={idx} href={item.href} className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all overflow-hidden whitespace-nowrap h-12 relative group/nav ${isActive ? 'text-[#0a192f] bg-white' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}>
                                        <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#0a192f]' : 'text-slate-300 group-hover/nav:text-white transition-colors'}`} />
                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-3">
                                            {item.label}
                                        </span>
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="p-4 border-t border-white/5 shrink-0">
                            <button onClick={handleLogout} className="flex items-center px-4 py-3 text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-xl transition-all overflow-hidden whitespace-nowrap h-12 w-full text-left">
                                <LogOut className="w-5 h-5 flex-shrink-0" />
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-3">
                                    Çıkış Yap
                                </span>
                            </button>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 relative overflow-hidden flex flex-col min-w-0 bg-transparent">
                        {/* Header */}
                        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur-xl flex-shrink-0 relative">
                            <h1 className="text-sm font-medium text-zinc-400 tracking-wider uppercase">FinAi Workspace</h1>
                    <div className="flex items-center space-x-4">
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Komut veya varlık ara... (⌘K)"
                                className="bg-zinc-900 ring-1 ring-white/5 rounded-lg py-1.5 pl-9 pr-4 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-white/20 w-64 text-zinc-100 placeholder:text-zinc-500 transition-all hover:bg-zinc-800/80"
                            />
                        </div>

                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="w-8 h-8 rounded-full bg-zinc-900 ring-1 ring-white/10 flex items-center justify-center text-zinc-400 font-bold hover:text-white hover:ring-white/20 transition-all focus:outline-none overflow-hidden"
                            >
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Profil" className="w-full h-full object-cover" />
                                ) : (
                                    userName ? userName.charAt(0).toUpperCase() : <User className="w-4 h-4" />
                                )}
                            </button>

                            {isProfileOpen && (
                                <div className="absolute right-0 mt-3 w-56 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                    <div className="px-4 py-2 border-b border-white/5 mb-1">
                                        <p className="text-xs font-semibold text-white">{userName || "Kullanıcı"}</p>
                                    </div>
                                    <div className="py-1">
                                        <Link href="/dashboard/settings" className="w-full text-left px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors">
                                            <Settings className="w-4 h-4" />
                                            Kullanıcı Ayarları
                                        </Link>
                                    </div>
                                    <div className="border-t border-white/5 mt-1 py-1">
                                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm font-medium text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 transition-colors">
                                            <LogOut className="w-4 h-4" />
                                            Çıkış Yap
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <FinancialTicker />

                        <div className="flex-1 overflow-auto bg-transparent p-0 relative custom-scrollbar">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

import { ToastProvider } from "@/components/providers/ToastProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            <DashboardShell>{children}</DashboardShell>
        </ToastProvider>
    );
}
