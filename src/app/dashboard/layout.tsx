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
    LayoutGrid,
    ChevronDown,
    Calendar,
    Coins,
    Activity,
    Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FinancialTicker } from "@/components/FinancialTicker";

import { supabase } from "@/lib/supabase";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { UserProvider, useUser } from "@/components/providers/UserProvider";
import { AuthComponent } from "@/components/ui/sign-up";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { FinAiLogo } from "@/components/ui/logo";

function DashboardShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isPortfolioExpanded, setIsPortfolioExpanded] = useState(false);
    const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentFocus = searchParams ? searchParams.get("focus") : null;
    const currentTab = searchParams ? searchParams.get("tab") : null;

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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const portfolioSubItems = [
        { label: "Portföy Tablosu", href: "/dashboard/portfolio?focus=table", isSubActive: pathname === "/dashboard/portfolio" && currentFocus === "table", icon: FileText },
        { label: "Bilanço Takvimi", href: "/dashboard/portfolio?focus=earnings", isSubActive: pathname === "/dashboard/portfolio" && currentFocus === "earnings", icon: Calendar },
        { label: "Temettü Takvimi", href: "/dashboard/portfolio?focus=dividends", isSubActive: pathname === "/dashboard/portfolio" && currentFocus === "dividends", icon: Coins },
        { label: "Fiyat Analizi (52H)", href: "/dashboard/portfolio?focus=extremes", isSubActive: pathname === "/dashboard/portfolio" && currentFocus === "extremes", icon: Activity },
        { label: "Varlık Dağılımı", href: "/dashboard/portfolio?focus=distribution", isSubActive: pathname === "/dashboard/portfolio" && currentFocus === "distribution", icon: PieChart }
    ];

    const settingsSubItems = [
        { label: "Profil & Kimlik", href: "/dashboard/settings?tab=account", isSubActive: pathname === "/dashboard/settings" && (currentTab === "account" || !currentTab), icon: User },
        { label: "Bildirim & Alarmlar", href: "/dashboard/settings?tab=notifications", isSubActive: pathname === "/dashboard/settings" && currentTab === "notifications", icon: Bell },
        { label: "Güvenlik & Hesap", href: "/dashboard/settings?tab=security", isSubActive: pathname === "/dashboard/settings" && currentTab === "security", icon: Shield }
    ];

    const menuItems = [
        { icon: Home, label: "Ana Sayfa", href: "/dashboard" },
        { 
            icon: PieChart, 
            label: "Portföyüm", 
            href: "/dashboard/portfolio",
            subItems: portfolioSubItems,
            isExpanded: isPortfolioExpanded,
            toggleExpand: () => setIsPortfolioExpanded(prev => !prev)
        },
        { icon: BarChart3, label: "Analiz", href: "/dashboard/analysis" },
        { icon: LayoutGrid, label: "Varlıklar", href: "/dashboard/data" },
        { icon: Newspaper, label: "Haberler", href: "/dashboard/news" },
        { 
            icon: Settings, 
            label: "Ayarlar", 
            href: "/dashboard/settings",
            subItems: settingsSubItems,
            isExpanded: isSettingsExpanded,
            toggleExpand: () => setIsSettingsExpanded(prev => !prev)
        }
    ];

    return (
        <div className="min-h-screen flex relative selection:bg-blue-500/30 font-sans bg-slate-50/50">
            {/* Luminous Light Leaks & Glowing Spheres Behind Sidebar */}
            <div className="fixed left-[-5%] top-[-10%] -z-10 h-[600px] w-[600px] rounded-full bg-blue-300/30 blur-[150px] pointer-events-none animate-pulse" />
            <div className="fixed left-[15%] bottom-[-10%] -z-10 h-[500px] w-[500px] rounded-full bg-indigo-300/20 blur-[130px] pointer-events-none" />

            {/* MAIN WRAPPER (EDGE-TO-EDGE DASHBOARD) */}
            <div className="relative z-10 w-full flex mx-auto max-w-[1920px] overflow-x-hidden min-h-screen">
                <div className="flex-1 flex bg-transparent min-w-0">
                    
                    {/* Desktop Sidebar (Ultra-Crystal Glassmorphism Aesthetic - Hidden on Mobile) */}
                    <aside className="hidden md:flex md:w-24 md:hover:w-80 border-r border-white/60 bg-white/30 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.12)] flex-col transition-all duration-500 ease-in-out group z-50 shrink-0 min-h-screen sticky top-0 h-screen overflow-hidden relative">
                        {/* Glass Reflection & Ambient Glow */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/10 to-white/40 pointer-events-none" />
                        <div className="absolute -left-16 top-1/4 w-36 h-36 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />

                        <div className="p-6 flex items-center h-20 shrink-0 border-b border-white/40 relative z-10 bg-white/10 backdrop-blur-md">
                            <Link href="/" className="flex items-center gap-3 w-full overflow-hidden group/logo">
                                <FinAiLogo showText={false} className="h-10 w-10 shrink-0 transition-transform duration-500 group-hover/logo:scale-110 drop-shadow-[0_0_15px_rgba(0,0,139,0.15)]" />
                                <span className="text-xl md:text-2xl font-black tracking-tighter text-[#00008B] opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-500 transform translate-x-0 md:translate-x-[-10px] md:group-hover:translate-x-0 whitespace-nowrap">
                                    FinAi<span className="text-blue-600">.</span>
                                </span>
                            </Link>
                        </div>

                        <nav className="flex-1 px-3 py-4 space-y-2.5 overflow-y-auto scrollbar-none relative z-10">
                            {menuItems.map((item, idx) => {
                                const isActive = pathname === item.href;
                                
                                if (item.subItems) {
                                    return (
                                        <div key={idx} className="space-y-1">
                                            <div className={`flex items-center justify-between px-3.5 py-3 text-sm font-semibold rounded-2xl transition-all overflow-hidden whitespace-nowrap h-12 relative group/nav ${
                                                isActive 
                                                    ? 'text-white bg-[#00008B] shadow-[0_10px_25px_-5px_rgba(0,0,139,0.35)]' 
                                                    : 'text-[#00008B] hover:text-[#00008B] hover:bg-[#00008B]/10'
                                            }`}>
                                                {/* Direct Link to Portfolio Page */}
                                                <Link 
                                                    href={item.href} 
                                                    className="flex items-center flex-1 min-w-0 pr-2"
                                                >
                                                    <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#00008B]/80 group-hover/nav:text-[#00008B] transition-colors'}`} />
                                                    <span className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 ml-2 md:ml-3 uppercase tracking-tight md:tracking-widest text-[9px] md:text-[10px] truncate font-extrabold">
                                                        {item.label}
                                                    </span>
                                                </Link>

                                                {/* Chevron Dropdown Toggle Button */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        item.toggleExpand();
                                                    }}
                                                    title="Alt Başlıkları Aç/Kapat"
                                                    className={`opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all p-1.5 rounded-xl flex items-center justify-center shrink-0 ${
                                                        isActive 
                                                            ? 'hover:bg-white/20 text-white' 
                                                            : 'hover:bg-[#00008B]/15 text-[#00008B]'
                                                    }`}
                                                >
                                                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${item.isExpanded ? 'rotate-180 text-blue-600' : ''}`} />
                                                </button>
                                            </div>

                                            {/* Sub Menu Items - Clean Nested Tree List */}
                                            <AnimatePresence>
                                                {item.isExpanded && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="ml-6 pl-3 border-l-2 border-[#00008B]/20 space-y-1 py-1 overflow-hidden transition-all duration-300 hidden group-hover:block"
                                                    >
                                                        {item.subItems.map((sub, sIdx) => {
                                                            const SubIcon = sub.icon;
                                                            return (
                                                                <Link
                                                                    key={sIdx}
                                                                    href={sub.href}
                                                                    className={`flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all whitespace-nowrap ${
                                                                        sub.isSubActive 
                                                                            ? 'bg-[#00008B] text-white shadow-sm font-bold' 
                                                                            : 'text-[#00008B]/80 hover:text-[#00008B] hover:bg-[#00008B]/10'
                                                                    }`}
                                                                >
                                                                    <SubIcon className={`w-3.5 h-3.5 flex-shrink-0 ${sub.isSubActive ? 'text-white' : 'text-[#00008B]/70'}`} />
                                                                    <span className="truncate">{sub.label}</span>
                                                                </Link>
                                                            );
                                                        })}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                }

                                return (
                                    <Link key={idx} href={item.href} className={`flex items-center px-4 py-3 text-sm font-semibold rounded-2xl transition-all overflow-hidden whitespace-nowrap h-12 relative group/nav ${
                                        isActive 
                                            ? 'text-white bg-[#00008B] shadow-[0_10px_25px_-5px_rgba(0,0,139,0.35)]' 
                                            : 'text-[#00008B] hover:text-[#00008B] hover:bg-[#00008B]/10'
                                    }`}>
                                        <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#00008B]/80 group-hover/nav:text-[#00008B] transition-colors'}`} />
                                        <span className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 ml-2 md:ml-3 uppercase tracking-tight md:tracking-widest text-[9px] md:text-[10px] truncate font-extrabold">
                                            {item.label}
                                        </span>
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="p-4 border-t border-white/10 shrink-0">
                            <button onClick={handleLogout} className="flex items-center px-4 py-4 text-sm font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all overflow-hidden whitespace-nowrap h-12 w-full text-left group/out">
                                <LogOut className="w-5 h-5 flex-shrink-0" />
                                <span className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 ml-2 md:ml-3 uppercase tracking-tight md:tracking-wider text-[9px] md:text-[11px] truncate">
                                    Çıkış Yap
                                </span>
                            </button>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 relative flex flex-col min-w-0 bg-transparent overflow-x-hidden">
                        {/* Header (Glassified) */}
                        <header className="h-14 md:h-16 border-b border-slate-100 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 bg-white/60 backdrop-blur-xl flex-shrink-0 relative">
                            <div className="flex items-center gap-2.5">
                                <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
                                    <FinAiLogo showText={false} className="h-7 w-7 shrink-0 drop-shadow-[0_0_10px_rgba(0,0,139,0.15)]" />
                                    <span className="text-lg font-black tracking-tight text-[#00008B]">FinAi</span>
                                </Link>
                                <h1 className="hidden md:block text-[10px] font-bold text-[#00008B] tracking-[0.3em] uppercase opacity-40">FinAi Workspace</h1>
                            </div>
                            
                            <div className="flex items-center space-x-3 md:space-x-4">
                                <div className="relative hidden sm:block">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00008B]/40" />
                                    <input
                                        type="text"
                                        placeholder="Komut veya varlık ara..."
                                        className="bg-slate-50 border border-slate-100 rounded-xl py-2 pl-10 pr-4 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#00008B]/20 w-48 lg:w-72 text-[#00008B] placeholder:text-[#00008B]/30 transition-all hover:bg-slate-100/50"
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

                        <div className="flex-1 bg-transparent p-0 relative min-w-0">
                            {children}
                        </div>
                    </main>
                </div>
            </div>

            {/* Mobile Bottom Navigation Bar (Modern Mobile App Navigation) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_25px_rgba(0,0,139,0.08)] px-2 py-1.5 pb-safe">
                <nav className="flex items-center justify-around">
                    {menuItems.map((item, idx) => {
                        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                        const Icon = item.icon;
                        return (
                            <Link
                                key={idx}
                                href={item.href}
                                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
                                    isActive 
                                        ? 'text-[#00008B] font-extrabold' 
                                        : 'text-slate-400 hover:text-slate-600 font-medium'
                                }`}
                            >
                                <div className={`p-1 rounded-xl transition-all ${
                                    isActive ? 'bg-[#00008B]/10 scale-105' : ''
                                }`}>
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-[#00008B]' : 'text-slate-400'}`} />
                                </div>
                                <span className="text-[9px] tracking-tight mt-0.5 whitespace-nowrap">
                                    {item.label}
                                </span>
                                {isActive && (
                                    <motion.div 
                                        layoutId="mobileActiveIndicator"
                                        className="w-1 h-1 bg-[#00008B] rounded-full mt-0.5"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}

import { Suspense } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            <Suspense fallback={null}>
                <DashboardShell>{children}</DashboardShell>
            </Suspense>
        </ToastProvider>
    );
}
