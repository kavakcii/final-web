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
import { ToastProvider } from "@/components/providers/ToastProvider";

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
            <div className="min-h-screen bg-white relative flex items-center justify-center">
                <AuthComponent
                    brandName="FinAi"
                    className="w-full"
                />
            </div>
        );
    }

    if (isAuthenticated === null || (isAuthenticated === true && !isDataLoaded)) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0a192f]"></div>
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
        <div className="min-h-screen flex relative selection:bg-emerald-500/30 overflow-hidden font-sans bg-white">
            <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-[#000000] opacity-[0.03] blur-[120px]" />

            {/* MAIN WRAPPER (EDGE-TO-EDGE DASHBOARD) */}
            <div className="relative z-10 w-full h-full min-h-screen flex mx-auto max-w-[1920px]">
                <div className="flex-1 flex overflow-hidden bg-transparent">
                    
                    {/* Sidebar (Radial Gradient Black to White - REVERSED) */}
                    <aside className="w-20 hover:w-64 border-r border-black/5 bg-[radial-gradient(ellipse_at_left,_white_0%,_rgba(230,230,240,0.8)_30%,_rgba(20,20,30,0.95)_75%,_#000000_100%)] hidden md:flex flex-col transition-all duration-300 ease-in-out group z-50 shrink-0 h-full relative shadow-[5px_0_30px_rgba(0,0,0,0.05)]">
                        <div className="p-6 flex items-center h-20 shrink-0 border-b border-[#0a192f]/10">
                            <Link href="/" className="flex items-center space-x-2 w-full overflow-hidden">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#0a192f] shadow-md">
                                        <TrendingUp className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                                <span className="text-xl font-black tracking-tight text-[#0a192f] opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap drop-shadow-sm">
                                    FinAi<span className="text-white drop-shadow-md">.</span>
                                </span>
                            </Link>
                        </div>

                        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-[#0a192f]/20">
                            {menuItems.map((item, idx) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link key={idx} href={item.href} className={`flex items-center px-4 py-3 text-sm font-black rounded-xl transition-all overflow-hidden whitespace-nowrap h-12 relative group/nav ${isActive ? 'text-white bg-[#0a192f] shadow-lg border border-[#0a192f]/20' : 'text-[#0a192f] hover:text-white hover:bg-[#0a192f] hover:shadow-md'}`}>
                                        <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#0a192f] group-hover/nav:text-white transition-colors'}`} />
                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-3 drop-shadow-sm">
                                            {item.label}
                                        </span>
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="p-4 border-t border-[#0a192f]/10 shrink-0">
                            <button onClick={handleLogout} className="flex items-center px-4 py-3 text-sm font-black text-rose-700 hover:text-white hover:bg-rose-600 rounded-xl transition-all overflow-hidden whitespace-nowrap h-12 w-full text-left shadow-sm group/out">
                                <LogOut className="w-5 h-5 flex-shrink-0" />
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-3 drop-shadow-sm">
                                    Çıkış Yap
                                </span>
                            </button>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 relative overflow-hidden flex flex-col min-w-0 bg-transparent">
                        {/* Header */}
                        <header className="h-16 border-b border-[#0a192f]/5 flex items-center justify-between px-6 sticky top-0 z-40 bg-white/80 backdrop-blur-xl flex-shrink-0 relative">
                            <h1 className="text-sm font-bold text-[#0a192f]/40 tracking-wider uppercase">FinAi Workspace</h1>
                            <div className="flex items-center space-x-4">
                                <div className="relative hidden sm:block">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Komut veya varlık ara..."
                                        className="bg-slate-100 border-none rounded-lg py-1.5 pl-9 pr-4 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#0a192f]/10 w-64 text-[#0a192f] placeholder:text-slate-400 transition-all hover:bg-slate-200/50"
                                    />
                                </div>

                                <div className="relative" ref={profileRef}>
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[#0a192f] font-bold hover:bg-slate-200 transition-all focus:outline-none overflow-hidden border border-[#0a192f]/5"
                                    >
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Profil" className="w-full h-full object-cover" />
                                        ) : (
                                            userName ? userName.charAt(0).toUpperCase() : <User className="w-4 h-4" />
                                        )}
                                    </button>

                                    {isProfileOpen && (
                                        <div className="absolute right-0 mt-3 w-56 bg-white border border-[#0a192f]/10 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                            <div className="px-4 py-2 border-b border-slate-100 mb-1">
                                                <p className="text-xs font-bold text-[#0a192f]">{userName || "Kullanıcı"}</p>
                                            </div>
                                            <div className="py-1">
                                                <Link href="/dashboard/settings" className="w-full text-left px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#0a192f] flex items-center gap-2 transition-colors">
                                                    <Settings className="w-4 h-4" />
                                                    Kullanıcı Ayarları
                                                </Link>
                                            </div>
                                            <div className="border-t border-slate-100 mt-1 py-1">
                                                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors">
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            <DashboardShell>{children}</DashboardShell>
        </ToastProvider>
    );
}
