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
        <div className="min-h-screen flex text-slate-800 relative selection:bg-blue-500/30 overflow-hidden font-sans bg-slate-50">
            {/* RADIAL BACKGROUND (Merkez Beyaz, Dışlar Lacivert) */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_#ffffff_10%,_#1e3a8a_60%,_#0a192f_100%)]" />

            {/* FROSTED GLASS MAIN WRAPPER (LIGHT APPLE GLASS) */}
            <div className="relative z-10 w-full h-full min-h-screen p-0 md:p-4 lg:p-6 flex max-w-[1920px] mx-auto">
                <div className="flex-1 flex overflow-hidden md:rounded-[2rem] bg-white/60 backdrop-blur-3xl border-0 md:border border-white/60 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)]">
                    
                    {/* Sidebar */}
                    <aside className="w-20 hover:w-64 border-r border-slate-200/50 bg-transparent hidden md:flex flex-col transition-all duration-300 ease-in-out group z-50 shrink-0 h-full relative">
                        <div className="p-6 flex items-center h-20 shrink-0">
                            <Link href="/" className="flex items-center space-x-2 w-full overflow-hidden">
                                <div className="flex-shrink-0">
                                    <TrendingUp className="w-8 h-8 text-blue-500" />
                                </div>
                                <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-900 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-2">
                                    FinAi
                                </span>
                            </Link>
                        </div>

                        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                            {menuItems.map((item, idx) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link key={idx} href={item.href} className={`flex items-center px-4 py-3 text-sm font-semibold rounded-lg transition-colors overflow-hidden whitespace-nowrap h-12 ${isActive ? 'text-blue-700 bg-blue-500/10 border border-blue-500/20 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-900/5'}`}>
                                        <item.icon className="w-5 h-5 flex-shrink-0" />
                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-3">
                                            {item.label}
                                        </span>
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="p-4 border-t border-slate-200/50 shrink-0">
                            <button onClick={handleLogout} className="flex items-center px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors overflow-hidden whitespace-nowrap h-12 w-full text-left">
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
                        <header className="h-16 border-b border-slate-200/50 flex items-center justify-between px-6 sticky top-0 z-40 bg-white/40 backdrop-blur-md flex-shrink-0 shadow-sm">
                            <h1 className="text-lg font-bold text-slate-800 tracking-tight">FinAi</h1>
                    <div className="flex items-center space-x-4">
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Hisse senedi ara..."
                                className="bg-white/80 border border-slate-200 rounded-full py-2 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-64 text-slate-800 placeholder:text-slate-400 shadow-sm transition-all"
                            />
                        </div>

                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold hover:bg-blue-100 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500/20 overflow-hidden shadow-sm"
                            >
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Profil" className="w-full h-full object-cover" />
                                ) : (
                                    userName ? userName.charAt(0).toUpperCase() : <User className="w-4 h-4" />
                                )}
                            </button>

                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                    <div className="px-4 py-3 border-b border-slate-100">
                                        <p className="text-sm font-bold text-slate-800">{userName || "Kullanıcı"}</p>
                                    </div>
                                    <div className="py-1">
                                        <Link href="/dashboard/settings" className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 transition-colors">
                                            <Settings className="w-4 h-4" />
                                            Kullanıcı Ayarları
                                        </Link>
                                    </div>
                                    <div className="border-t border-slate-100 mt-1 py-1">
                                        <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors">
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
