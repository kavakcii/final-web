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
        <div className="min-h-screen flex text-white relative selection:bg-blue-500/30 overflow-hidden font-sans bg-black">
            {/* FULL BACKGROUND GRADIENT */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0a192f] to-white opacity-100 mix-blend-normal" />
            
            {/* Ambient Lighting Orbs */}
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-blue-500/20 blur-[130px] rounded-full mix-blend-overlay -translate-y-1/3 pointer-events-none z-0" />

            {/* FROSTED GLASS MAIN WRAPPER */}
            <div className="relative z-10 w-full h-full min-h-screen p-0 md:p-4 lg:p-6 flex max-w-[1920px] mx-auto">
                <div className="flex-1 flex overflow-hidden md:rounded-[2rem] bg-slate-950/80 backdrop-blur-3xl border-0 md:border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
                    
                    {/* Sidebar */}
                    <aside className="w-20 hover:w-64 border-r border-white/10 bg-transparent hidden md:flex flex-col transition-all duration-300 ease-in-out group z-50 shrink-0 h-full relative">
                        <div className="p-6 flex items-center h-20 shrink-0">
                            <Link href="/" className="flex items-center space-x-2 w-full overflow-hidden">
                                <div className="flex-shrink-0">
                                    <TrendingUp className="w-8 h-8 text-blue-500" />
                                </div>
                                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-2">
                                    FinAi
                                </span>
                            </Link>
                        </div>

                        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                            {menuItems.map((item, idx) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link key={idx} href={item.href} className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors overflow-hidden whitespace-nowrap h-12 ${isActive ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                                        <item.icon className="w-5 h-5 flex-shrink-0" />
                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-3">
                                            {item.label}
                                        </span>
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="p-4 border-t border-white/10 shrink-0">
                            <button onClick={handleLogout} className="flex items-center px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors overflow-hidden whitespace-nowrap h-12 w-full text-left">
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
                        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-40 bg-transparent flex-shrink-0">
                            <h1 className="text-lg font-semibold text-white">FinAi</h1>
                    <div className="flex items-center space-x-4">
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Hisse senedi ara..."
                                className="bg-slate-900 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64 text-white placeholder:text-slate-600"
                            />
                        </div>

                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold hover:bg-blue-600/30 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 overflow-hidden"
                            >
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Profil" className="w-full h-full object-cover" />
                                ) : (
                                    userName ? userName.charAt(0).toUpperCase() : <User className="w-4 h-4" />
                                )}
                            </button>

                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-white/10 rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                                    <div className="px-4 py-3 border-b border-white/10">
                                        <p className="text-sm font-medium text-white">{userName || "Kullanıcı"}</p>
                                    </div>
                                    <div className="py-1">
                                        <Link href="/dashboard/settings" className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors">
                                            <Settings className="w-4 h-4" />
                                            Kullanıcı Ayarları
                                        </Link>
                                    </div>
                                    <div className="border-t border-white/10 mt-1 py-1">
                                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors">
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
