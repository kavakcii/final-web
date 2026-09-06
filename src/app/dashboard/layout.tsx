"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
    Home,
    PieChart,
    Settings,
    LogOut,
    Bell,
    BarChart3,
    User,
    FileText,
    Newspaper,
    LayoutGrid,
    ChevronDown,
    Calendar,
    Coins,
    Activity,
    X,
    History,
    Globe,
    Building2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FinancialTicker } from "@/components/FinancialTicker";
import { SidebarMarketWidgets } from "@/components/SidebarMarketWidgets";

import { supabase } from "@/lib/supabase";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { UserProvider, useUser } from "@/components/providers/UserProvider";
import { AuthComponent } from "@/components/ui/sign-up";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { FinAiLogo } from "@/components/ui/logo";
import { GlobalSearch } from "@/components/GlobalSearch";

function DashboardShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname() || "";
    const searchParams = useSearchParams();
    const currentFocus = searchParams ? searchParams.get("focus") : null;
    const currentType = searchParams ? (searchParams.get("type") || searchParams.get("focus")) : null;

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isPortfolioExpanded, setIsPortfolioExpanded] = useState(() => pathname.startsWith("/dashboard/portfolio"));
    const [isCalendarExpanded, setIsCalendarExpanded] = useState(() => pathname.startsWith("/dashboard/calendar") || pathname.startsWith("/dashboard/economic-calendar"));
    const profileRef = useRef<HTMLDivElement>(null);
    const hamburgerRef = useRef<HTMLButtonElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    // Mobil drawer açıldığında kapatma butonuna focus ver
    useEffect(() => {
        if (isMobileMenuOpen) {
            const timer = setTimeout(() => {
                closeButtonRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isMobileMenuOpen]);

    const handleCloseMobileMenu = () => {
        setIsMobileMenuOpen(false);
        hamburgerRef.current?.focus();
    };

    // Mobil drawer açıkken arka plan kaydırmasını kilitle (Body Scroll Lock)
    useEffect(() => {
        if (isMobileMenuOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isMobileMenuOpen]);

    // Rota değiştiğinde mobil menüyü ve profil açılır menüsünü otomatik kapat
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsProfileOpen(false);
    }, [pathname, searchParams]);

    // Aktif sayfaya göre ilgili alt menüyü otomatik açık tut ve diğerlerini kapat
    useEffect(() => {
        if (pathname.startsWith("/dashboard/portfolio")) {
            setIsPortfolioExpanded(true);
            setIsCalendarExpanded(false);
        } else if (pathname.startsWith("/dashboard/calendar") || pathname.startsWith("/dashboard/economic-calendar")) {
            setIsCalendarExpanded(true);
            setIsPortfolioExpanded(false);
        } else {
            // Kullanıcı başka bir ana menüye geçtiğinde (Haberler, Ayarlar, Analiz, Varlıklar vb.)
            // açık kalan submenu'ler kapatılır
            setIsPortfolioExpanded(false);
            setIsCalendarExpanded(false);
        }
    }, [pathname]);

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
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setIsMobileMenuOpen(false);
                setIsProfileOpen(false);
                hamburgerRef.current?.focus();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("keydown", handleKeyDown);
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
        { 
            label: "Portföy Özeti & Tablosu", 
            href: "/dashboard/portfolio", 
            isSubActive: pathname === "/dashboard/portfolio" && (!currentFocus || currentFocus === "table"), 
            icon: FileText 
        },
        { 
            label: "Varlık Dağılımı", 
            href: "/dashboard/portfolio?focus=distribution", 
            isSubActive: pathname === "/dashboard/portfolio" && currentFocus === "distribution", 
            icon: PieChart 
        },
        { 
            label: "Fiyat & 52H Analizi", 
            href: "/dashboard/portfolio?focus=extremes", 
            isSubActive: pathname === "/dashboard/portfolio" && currentFocus === "extremes", 
            icon: Activity 
        },
        { 
            label: "İşlem Geçmişi", 
            href: "/dashboard/portfolio/transactions", 
            isSubActive: pathname.startsWith("/dashboard/portfolio/transactions"), 
            icon: History 
        }
    ];

    const calendarSubItems = [
        {
            label: "Genel Takvim",
            href: "/dashboard/calendar",
            isSubActive: pathname === "/dashboard/calendar" && (!currentType || currentType === "all"),
            icon: Calendar
        },
        {
            label: "Ekonomik Takvim",
            href: "/dashboard/calendar?type=economic",
            isSubActive: (pathname === "/dashboard/calendar" && currentType === "economic") || pathname.startsWith("/dashboard/economic-calendar"),
            icon: Globe
        },
        {
            label: "Temettü Takvimi",
            href: "/dashboard/calendar?type=dividend",
            isSubActive: pathname === "/dashboard/calendar" && (currentType === "dividend" || currentType === "dividends" || currentType === "temettu"),
            icon: Coins
        },
        {
            label: "Bilanço Takvimi",
            href: "/dashboard/calendar?type=earnings",
            isSubActive: pathname === "/dashboard/calendar" && (currentType === "earnings" || currentType === "earning" || currentType === "bilanco"),
            icon: Building2
        }
    ];

    const menuItems = [
        { 
            icon: Home, 
            label: "Ana Sayfa", 
            href: "/dashboard",
            isActive: pathname === "/dashboard"
        },
        { 
            icon: PieChart, 
            label: "Portföyüm", 
            href: "/dashboard/portfolio",
            isActive: pathname.startsWith("/dashboard/portfolio"),
            subItems: portfolioSubItems,
            isExpanded: isPortfolioExpanded,
            toggleExpand: () => setIsPortfolioExpanded(prev => !prev)
        },
        { 
            icon: LayoutGrid, 
            label: "Varlıklar", 
            href: "/dashboard/data",
            isActive: pathname === "/dashboard/data" || pathname.startsWith("/dashboard/varlik") || pathname.startsWith("/varlik")
        },
        { 
            icon: BarChart3, 
            label: "Analiz", 
            href: "/dashboard/analysis",
            isActive: pathname.startsWith("/dashboard/analysis") || pathname.startsWith("/dashboard/correlation-analysis") || pathname.startsWith("/dashboard/behavioral") || pathname.startsWith("/dashboard/test")
        },
        { 
            icon: Calendar, 
            label: "Takvim", 
            href: "/dashboard/calendar",
            isActive: pathname.startsWith("/dashboard/calendar") || pathname.startsWith("/dashboard/economic-calendar"),
            subItems: calendarSubItems,
            isExpanded: isCalendarExpanded,
            toggleExpand: () => setIsCalendarExpanded(prev => !prev)
        },
        { 
            icon: Newspaper, 
            label: "Haberler", 
            href: "/dashboard/news",
            isActive: pathname.startsWith("/dashboard/news")
        },
        { 
            icon: Bell, 
            label: "Bildirimler", 
            href: "/dashboard/notifications",
            isActive: pathname.startsWith("/dashboard/notifications")
        },
        { 
            icon: Settings, 
            label: "Ayarlar", 
            href: "/dashboard/settings",
            isActive: pathname.startsWith("/dashboard/settings") || pathname.startsWith("/dashboard/account")
        }
    ];

    return (
        <div className="min-h-screen flex relative selection:bg-blue-500/30 font-sans bg-slate-50/50 overflow-x-hidden">
            {/* MAIN WRAPPER (EDGE-TO-EDGE DASHBOARD) */}
            <div className="relative z-10 w-full flex mx-auto max-w-[1920px] overflow-x-hidden min-h-screen">
                <div className="flex-1 flex bg-transparent min-w-0">
                    
                    {/* Desktop Sidebar Layout Placeholder: fixed w-24 (96px) footprint so main content never shifts */}
                    <div className="hidden md:block w-24 shrink-0 pointer-events-none" aria-hidden="true" />

                    {/* Fixed Viewport Sidebar: anchored to viewport (top-0 left-0 h-[100dvh]) so scrolling the page never moves the sidebar */}
                    <aside className="hidden md:flex fixed top-0 left-0 2xl:left-[max(0px,calc((100vw-1920px)/2))] h-[100dvh] w-24 hover:w-80 focus-within:w-80 z-50 border-r border-slate-200/80 bg-white shadow-sm md:shadow-md hover:shadow-xl flex-col transition-[width,box-shadow] duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group overflow-hidden pointer-events-auto">
                        <div className="p-3 md:p-6 flex items-center justify-start h-14 md:h-20 shrink-0 border-b border-slate-100 relative z-10 bg-white">
                            <Link href="/" className="flex items-center justify-start gap-3 w-full overflow-hidden group/logo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00008B]/40 rounded-xl">
                                <FinAiLogo showText={false} className="h-8 w-8 md:h-10 md:w-10 shrink-0 transition-opacity duration-200 motion-reduce:transition-none" />
                                <span className="text-xl md:text-2xl font-black tracking-tighter text-[#00008B] opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-[opacity,transform] duration-200 ease-out transform -translate-x-1.5 md:group-hover:translate-x-0 md:group-focus-within:translate-x-0 whitespace-nowrap hidden md:inline-block motion-reduce:transition-none">
                                    FinAi<span className="text-blue-600">.</span>
                                </span>
                            </Link>
                        </div>

                        <nav className="shrink-0 px-2 md:px-3 py-3 md:py-4 space-y-2 overflow-y-auto scrollbar-none relative z-10 max-h-[calc(100dvh-340px)]">
                            {menuItems.map((item, idx) => {
                                const isActive = item.isActive;
                                
                                if (item.subItems) {
                                    return (
                                        <div key={idx} className="space-y-1">
                                            <div className={`flex items-center justify-between px-3 md:px-3.5 py-2.5 md:py-3 text-sm font-semibold rounded-xl md:rounded-2xl transition-[background-color,color,box-shadow] duration-180 ease-out overflow-hidden whitespace-nowrap h-11 md:h-12 relative group/nav motion-reduce:transition-none ${
                                                isActive 
                                                    ? 'text-white bg-[#00008B] shadow-[0_4px_14px_rgba(0,0,139,0.25)]' 
                                                    : 'text-slate-700 hover:text-[#00008B] hover:bg-[#00008B]/10'
                                            }`}>
                                                {/* Direct Link to Portfolio/Calendar Page */}
                                                <Link 
                                                    href={item.href} 
                                                    onClick={(e) => {
                                                        if (pathname === item.href && item.toggleExpand) {
                                                            e.preventDefault();
                                                            item.toggleExpand();
                                                        }
                                                    }}
                                                    className="flex items-center justify-start flex-1 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-lg"
                                                >
                                                    <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-150 ${isActive ? 'text-white' : 'text-slate-600 group-hover/nav:text-[#00008B]'}`} />
                                                    <span className="opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-[opacity,transform] duration-200 ease-out transform -translate-x-1 md:group-hover:translate-x-0 md:group-focus-within:translate-x-0 ml-2 md:ml-3 uppercase tracking-tight md:tracking-widest text-[9px] md:text-[10px] truncate font-extrabold hidden md:inline-block motion-reduce:transition-none">
                                                        {item.label}
                                                    </span>
                                                </Link>

                                                {/* Chevron Dropdown Toggle Button (Desktop hover only) */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        if (item.toggleExpand) item.toggleExpand();
                                                    }}
                                                    aria-expanded={item.isExpanded}
                                                    aria-controls={`submenu-${item.label.toLowerCase()}`}
                                                    aria-label={`${item.label} alt menüsünü ${item.isExpanded ? "kapat" : "aç"}`}
                                                    title={`${item.label} alt menüsünü ${item.isExpanded ? "kapat" : "aç"}`}
                                                    className={`hidden md:group-hover:flex md:group-focus-within:flex transition-colors duration-150 p-1.5 rounded-xl items-center justify-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00008B]/40 ${
                                                        isActive 
                                                            ? 'hover:bg-white/20 text-white focus-visible:ring-white/60' 
                                                            : 'hover:bg-[#00008B]/15 text-slate-600 hover:text-[#00008B]'
                                                    }`}
                                                >
                                                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ease-out motion-reduce:transition-none ${item.isExpanded ? 'rotate-180' : ''}`} />
                                                </button>
                                            </div>

                                            {/* Sub Menu Items - Clean Nested Tree List */}
                                            <AnimatePresence initial={false}>
                                                {item.isExpanded && (
                                                    <motion.div
                                                        id={`submenu-${item.label.toLowerCase()}`}
                                                        role="region"
                                                        aria-label={`${item.label} alt menüsü`}
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                                        className="ml-6 pl-3 border-l-2 border-[#00008B]/20 space-y-1 py-1 overflow-hidden hidden group-hover:block group-focus-within:block"
                                                    >
                                                        {item.subItems.map((sub, sIdx) => {
                                                            const SubIcon = sub.icon;
                                                            return (
                                                                <Link
                                                                    key={sIdx}
                                                                    href={sub.href}
                                                                    className={`flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00008B]/40 ${
                                                                        sub.isSubActive 
                                                                            ? 'bg-[#00008B] text-white shadow-sm font-bold' 
                                                                            : 'text-slate-600 hover:text-[#00008B] hover:bg-[#00008B]/10'
                                                                    }`}
                                                                >
                                                                    <SubIcon className={`w-3.5 h-3.5 flex-shrink-0 transition-colors duration-150 ${sub.isSubActive ? 'text-white' : 'text-slate-500 group-hover:text-[#00008B]'}`} />
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
                                    <Link key={idx} href={item.href} className={`flex items-center justify-start px-3 md:px-4 py-2.5 md:py-3 text-sm font-semibold rounded-xl md:rounded-2xl transition-[background-color,color,box-shadow] duration-180 ease-out overflow-hidden whitespace-nowrap h-11 md:h-12 relative group/nav focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00008B]/40 motion-reduce:transition-none ${
                                        isActive 
                                            ? 'text-white bg-[#00008B] shadow-[0_4px_14px_rgba(0,0,139,0.25)]' 
                                            : 'text-slate-700 hover:text-[#00008B] hover:bg-[#00008B]/10'
                                    }`}>
                                        <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-150 ${isActive ? 'text-white' : 'text-slate-600 group-hover/nav:text-[#00008B]'}`} />
                                        <span className="opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-[opacity,transform] duration-200 ease-out transform -translate-x-1 md:group-hover:translate-x-0 md:group-focus-within:translate-x-0 ml-2 md:ml-3 uppercase tracking-tight md:tracking-widest text-[9px] md:text-[10px] truncate font-extrabold hidden md:inline-block motion-reduce:transition-none">
                                            {item.label}
                                        </span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Native FinAi Market Mini Widgets - Vertically centered in the space between Ayarlar and Çıkış Yap */}
                        {/* Collapsed (96px): hidden; Expanded (320px hover/focus): visible */}
                        <div className="flex-1 flex flex-col justify-center min-h-0 relative z-10">
                            <div className="shrink-0 my-auto opacity-0 pointer-events-none invisible md:group-hover:opacity-100 md:group-hover:pointer-events-auto md:group-hover:visible md:group-focus-within:opacity-100 md:group-focus-within:pointer-events-auto md:group-focus-within:visible transition-[opacity,visibility] duration-200 ease-out delay-75 md:group-hover:delay-100 motion-reduce:transition-none">
                                <SidebarMarketWidgets />
                            </div>
                        </div>

                        <div className="p-3 md:px-4 md:py-3 border-t border-slate-200/80 shrink-0 relative z-10 bg-white mt-auto">
                            <button onClick={handleLogout} className="flex items-center justify-start px-3 md:px-4 py-2.5 md:py-3 text-sm font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors duration-180 overflow-hidden whitespace-nowrap h-11 md:h-12 w-full text-left group/out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 motion-reduce:transition-none">
                                <LogOut className="w-5 h-5 flex-shrink-0 transition-colors duration-150" />
                                <span className="opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-[opacity,transform] duration-200 ease-out transform -translate-x-1 md:group-hover:translate-x-0 md:group-focus-within:translate-x-0 ml-2 md:ml-3 uppercase tracking-tight md:tracking-wider text-[9px] md:text-[11px] truncate hidden md:inline-block motion-reduce:transition-none">
                                    Çıkış Yap
                                </span>
                            </button>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 relative flex flex-col min-w-0 bg-transparent overflow-x-hidden">
                        {/* Header (Glassified & Safe-Area Aware) */}
                        <header className={`h-12 md:h-16 border-b border-slate-100 flex items-center justify-between px-3 md:px-6 sticky top-0 ${isProfileOpen ? "z-[60]" : "z-40"} bg-white/60 backdrop-blur-xl flex-shrink-0 relative pt-[env(safe-area-inset-top,0px)] transition-none`}>
                            <div className="flex items-center gap-2.5">
                                {/* Hamburger Butonu (Dokunmatik Hedef >= 44x44px) */}
                                <button
                                    ref={hamburgerRef}
                                    onClick={() => setIsMobileMenuOpen(true)}
                                    className="md:hidden flex flex-col items-center justify-center gap-1.5 w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-[#00008B] text-white shadow-sm active:scale-95 transition-[transform,background-color] duration-150 shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00008B]/40 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:active:scale-100"
                                    aria-label="Menüyü aç"
                                    aria-expanded={isMobileMenuOpen}
                                    aria-controls="mobile-nav-drawer"
                                >
                                    <span className="w-5 h-0.5 bg-white rounded-full block" />
                                    <span className="w-5 h-0.5 bg-white rounded-full block" />
                                    <span className="w-5 h-0.5 bg-white rounded-full block" />
                                </button>
                                <h1 className="text-[9px] md:text-[10px] font-bold text-[#00008B] tracking-[0.2em] md:tracking-[0.3em] uppercase opacity-40 select-none">FinAi Workspace</h1>
                            </div>
                            
                            <div className="flex items-center space-x-2 md:space-x-4">
                                <div className="hidden sm:block">
                                    <GlobalSearch className="w-56 lg:w-80" />
                                </div>

                                <div className="relative" ref={profileRef}>
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        aria-label="Kullanıcı Profili ve Ayarlar"
                                        aria-expanded={isProfileOpen}
                                        aria-controls="profile-dropdown-menu"
                                        aria-haspopup="true"
                                        className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-100 flex items-center justify-center text-[#0a192f] font-bold hover:bg-slate-200 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00008B]/40 focus-visible:ring-offset-2 overflow-hidden border border-[#0a192f]/5"
                                    >
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Profil" className="w-full h-full object-cover" />
                                        ) : (
                                            userName ? userName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                        )}
                                    </button>

                                    {isProfileOpen && (
                                        <div 
                                            id="profile-dropdown-menu"
                                            role="menu"
                                            aria-label="Kullanıcı Menüsü"
                                            className="absolute right-0 mt-3 w-56 bg-white border border-[#0a192f]/10 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right focus:outline-none"
                                        >
                                            <div className="px-4 py-2 border-b border-slate-100 mb-1">
                                                <p className="text-xs font-bold text-[#0a192f]">{userName || "Kullanıcı"}</p>
                                            </div>
                                            <div className="py-1">
                                                <Link 
                                                    href="/dashboard/settings" 
                                                    onClick={() => setIsProfileOpen(false)}
                                                    role="menuitem"
                                                    className="w-full text-left px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#0a192f] flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00008B]/30"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                    Kullanıcı Ayarları
                                                </Link>
                                            </div>
                                            <div className="border-t border-slate-100 mt-1 py-1">
                                                <button 
                                                    onClick={() => {
                                                        setIsProfileOpen(false);
                                                        handleLogout();
                                                    }} 
                                                    role="menuitem"
                                                    className="w-full text-left px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Çıkış Yap
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </header>

                        {/* Mobile Drawer (FinAi Kurumsal Beyaz & Cam Tasarım Dili) */}
                        <AnimatePresence>
                            {isMobileMenuOpen && (
                                <>
                                    {/* Arka Plan Karartması (Backdrop) */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.22, ease: "easeOut" }}
                                        onClick={handleCloseMobileMenu}
                                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[70] md:hidden"
                                    />

                                    {/* Soldan Kayan Drawer */}
                                    <motion.div
                                        id="mobile-nav-drawer"
                                        role="dialog"
                                        aria-modal="true"
                                        aria-label="Mobil Gezinme Menüsü"
                                        initial={{ x: "-100%" }}
                                        animate={{ x: 0 }}
                                        exit={{ x: "-100%" }}
                                        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                                        className="fixed inset-y-0 left-0 w-[min(320px,86vw)] h-[100dvh] max-h-[100dvh] bg-white/95 backdrop-blur-2xl text-slate-900 shadow-2xl z-[80] flex flex-col p-4 md:hidden border-r border-slate-200/80 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
                                    >
                                        {/* Drawer Başlık & Kapatma Butonu */}
                                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 flex-shrink-0">
                                            <FinAiLogo showText={true} className="h-7" />
                                            <button
                                                ref={closeButtonRef}
                                                onClick={handleCloseMobileMenu}
                                                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors duration-150 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00008B]/30 motion-reduce:transition-none motion-reduce:active:scale-100"
                                                aria-label="Menüyü kapat"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Mobil Arama */}
                                        <div className="my-3 flex-shrink-0">
                                            <GlobalSearch onSelect={() => setIsMobileMenuOpen(false)} />
                                        </div>

                                        {/* Menü Linkleri */}
                                        <nav className="flex-1 py-1 space-y-1 overflow-y-auto scrollbar-none" aria-label="Mobil Ana Menü">
                                            {menuItems.map((item, idx) => {
                                                const isActive = item.isActive;
                                                const ItemIcon = item.icon;

                                                if (item.subItems) {
                                                    const submenuId = item.label === "Portföyüm" ? "mobile-portfolio-submenu" : "mobile-calendar-submenu";
                                                    return (
                                                        <div key={idx} className="space-y-0.5">
                                                            <div className={`flex items-center justify-between px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-[background-color,color,box-shadow] duration-180 ease-out motion-reduce:transition-none ${
                                                                isActive 
                                                                    ? 'text-white bg-[#00008B] shadow-[0_4px_14px_rgba(0,0,139,0.25)] font-bold' 
                                                                    : 'text-slate-700 hover:text-[#00008B] hover:bg-slate-100/80 font-medium'
                                                            }`}>
                                                                <Link
                                                                    href={item.href}
                                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                                    className="flex items-center gap-3 flex-1 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-lg"
                                                                >
                                                                    <ItemIcon className={`w-4.5 h-4.5 flex-shrink-0 transition-colors duration-150 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                                                                    <span className="text-xs uppercase font-extrabold tracking-wider truncate">{item.label}</span>
                                                                </Link>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        if (item.toggleExpand) item.toggleExpand();
                                                                    }}
                                                                    aria-expanded={item.isExpanded}
                                                                    aria-controls={submenuId}
                                                                    aria-label={`${item.label} alt menüsünü ${item.isExpanded ? "kapat" : "aç"}`}
                                                                    className={`w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00008B]/40 ${
                                                                        isActive 
                                                                            ? 'hover:bg-white/20 text-white focus-visible:ring-white/60' 
                                                                            : 'hover:bg-slate-200 text-slate-400 hover:text-slate-700'
                                                                    }`}
                                                                >
                                                                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ease-out motion-reduce:transition-none ${item.isExpanded ? 'rotate-180' : ''}`} />
                                                                </button>
                                                            </div>

                                                            <AnimatePresence initial={false}>
                                                                {item.isExpanded && (
                                                                    <motion.div 
                                                                        id={submenuId} 
                                                                        role="region" 
                                                                        aria-label={`${item.label} Alt Menüsü`}
                                                                        initial={{ opacity: 0, height: 0 }}
                                                                        animate={{ opacity: 1, height: "auto" }}
                                                                        exit={{ opacity: 0, height: 0 }}
                                                                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                                                        className="ml-5 pl-3 border-l-2 border-[#00008B]/20 space-y-0.5 py-1 overflow-hidden"
                                                                    >
                                                                        {item.subItems.map((sub, sIdx) => {
                                                                            const SubIcon = sub.icon;
                                                                            return (
                                                                                <Link
                                                                                    key={sIdx}
                                                                                    href={sub.href}
                                                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                                                    className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors duration-150 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00008B]/40 ${
                                                                                        sub.isSubActive
                                                                                            ? 'bg-[#00008B]/10 text-[#00008B] font-bold'
                                                                                            : 'text-slate-600 hover:text-[#00008B] hover:bg-slate-50 font-medium'
                                                                                    }`}
                                                                                >
                                                                                    <SubIcon className={`w-4 h-4 flex-shrink-0 transition-colors duration-150 ${sub.isSubActive ? 'text-[#00008B]' : 'text-slate-400'}`} />
                                                                                    <span>{sub.label}</span>
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
                                                    <Link
                                                        key={idx}
                                                        href={item.href}
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                        className={`flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-[background-color,color,box-shadow] duration-180 ease-out min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00008B]/40 motion-reduce:transition-none ${
                                                            isActive
                                                                ? 'text-white bg-[#00008B] shadow-[0_4px_14px_rgba(0,0,139,0.25)] font-bold'
                                                                : 'text-slate-700 hover:text-[#00008B] hover:bg-slate-100/80 font-medium'
                                                        }`}
                                                    >
                                                        <ItemIcon className={`w-4.5 h-4.5 flex-shrink-0 transition-colors duration-150 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                                                        <span className="text-xs uppercase font-extrabold tracking-wider truncate">{item.label}</span>
                                                    </Link>
                                                );
                                            })}
                                        </nav>

                                        {/* Çıkış Yap */}
                                        <div className="pt-3 border-t border-slate-100 flex-shrink-0">
                                            <button
                                                onClick={() => {
                                                    setIsMobileMenuOpen(false);
                                                    handleLogout();
                                                }}
                                                className="flex items-center gap-3 px-3.5 py-2.5 text-sm font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors duration-150 w-full text-left min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 motion-reduce:transition-none"
                                            >
                                                <LogOut className="w-4.5 h-4.5 flex-shrink-0 transition-colors duration-150" />
                                                <span className="text-xs uppercase tracking-wider">Çıkış Yap</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>

                        <FinancialTicker />

                        <div className="flex-1 bg-transparent p-0 relative min-w-0">
                            {children}
                        </div>
                    </main>
                </div>
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
