'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { PortfolioService, Asset } from '@/lib/portfolio-service';
import { Wallet, Activity, BarChart2 } from 'lucide-react';

interface UserContextType {
    user: User | null;
    avatarUrl: string | null;
    setAvatarUrl: (url: string | null) => void;
    userName: string | null;
    setUserName: (name: string | null) => void;
    email: string | null;
    setEmail: (email: string | null) => void;
    userMetadata: any;
    isAuthenticated: boolean | null;
    updateProfile: (updates: { [key: string]: any }) => Promise<void>;
    // Data states
    myAssets: Asset[];
    prices: Record<string, number>;
    stats: any[];
    isDataLoaded: boolean;
    refreshDashboardData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [userMetadata, setUserMetadata] = useState<any>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [myAssets, setMyAssets] = useState<Asset[]>([]);
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [stats, setStats] = useState<any[]>([]);
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    // Use a ref to track if auth check has completed to avoid closure staleness in timeout
    const isAuthCheckCompleted = React.useRef(false);

    useEffect(() => {
        // Load persisted state if any from localStorage (basic persistence)
        const storedAvatar = localStorage.getItem('user_avatar_url');
        if (storedAvatar) setAvatarUrl(storedAvatar);
    }, []);

    const refreshDashboardData = async () => {
        try {
            const assets = await PortfolioService.getAssets();
            setMyAssets(assets);

            if (assets.length > 0) {
                const uniqueSymbols = Array.from(new Set(assets.map(a => a.symbol))).join(',');
                const res = await fetch(`/api/finance?symbols=${uniqueSymbols}`);
                const json = await res.json();

                const priceMap: Record<string, number> = {};
                if (json.results) {
                    json.results.forEach((r: any) => {
                        if (r.symbol && r.regularMarketPrice) {
                            priceMap[r.symbol.toUpperCase()] = r.regularMarketPrice;
                        }
                    });
                    setPrices(priceMap);
                }

                // Calculate stats
                let totalVal = 0;
                let totalCost = 0;
                assets.forEach(a => {
                    const currentPrice = priceMap[a.symbol.toUpperCase()] || a.avgCost;
                    totalVal += currentPrice * a.quantity;
                    totalCost += a.avgCost * a.quantity;
                });

                const profit = totalVal - totalCost;
                const profitPercent = totalCost > 0 ? (profit / totalCost) * 100 : 0;

                setStats([
                    {
                        title: "Toplam Portföy",
                        value: `₺${totalVal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        change: `${profitPercent >= 0 ? '+' : ''}%${profitPercent.toFixed(1)}`,
                        isPositive: profit >= 0,
                        icon: Wallet,
                        gradient: "from-blue-500/20 to-purple-500/20",
                        border: "border-blue-500/20"
                    },
                    {
                        title: "Toplam Kar/Zarar",
                        value: `₺${profit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        change: "Net",
                        isPositive: profit >= 0,
                        icon: Activity,
                        gradient: profit >= 0 ? "from-green-500/20 to-emerald-500/20" : "from-red-500/20 to-orange-500/20",
                        border: profit >= 0 ? "border-green-500/20" : "border-red-500/20"
                    },
                    {
                        title: "Varlık Sayısı",
                        value: Array.from(new Set(assets.map(a => a.symbol))).length.toString(),
                        change: "Aktif",
                        isPositive: true,
                        icon: BarChart2,
                        gradient: "from-orange-500/20 to-red-500/20",
                        border: "border-orange-500/20"
                    }
                ]);
            } else {
                setStats([
                    { title: "Toplam Portföy", value: "₺0,00", change: "%0", isPositive: true, icon: Wallet, gradient: "from-blue-500/20 to-purple-500/20", border: "border-blue-500/20" },
                    { title: "Toplam Kar/Zarar", value: "₺0,00", change: "Net", isPositive: true, icon: Activity, gradient: "from-green-500/20 to-emerald-500/20", border: "border-green-500/20" },
                    { title: "Varlık Sayısı", value: "0", change: "Yok", isPositive: true, icon: BarChart2, gradient: "from-orange-500/20 to-red-500/20", border: "border-orange-500/20" }
                ]);
            }
            setIsDataLoaded(true);
        } catch (error) {
            console.error("Error refreshing dashboard data:", error);
            setIsDataLoaded(true); // Still set to true to unlock screen
        }
    };

    useEffect(() => {

        // Initial Auth Check
        const checkAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error("Supabase session error:", error);
                    setIsAuthenticated(false);
                    isAuthCheckCompleted.current = true;
                    return;
                }

                if (session) {
                    setIsAuthenticated(true);
                    setUser(session.user);
                    const user = session.user;
                    const metadata = user.user_metadata;
                    setUserMetadata(metadata);

                    setEmail(user.email || null);

                    let name = "Kullanıcı";
                    if (metadata?.full_name) {
                        name = metadata.full_name;
                    } else if (metadata?.first_name && metadata?.last_name) {
                        name = `${metadata.first_name} ${metadata.last_name}`;
                    } else {
                        name = user.email?.split('@')[0] || "Kullanıcı";
                    }
                    setUserName(name);

                    if (metadata?.avatar_url) {
                        setAvatarUrl(metadata.avatar_url);
                        localStorage.setItem('user_avatar_url', metadata.avatar_url);
                    }
                    refreshDashboardData();
                } else {
                    setIsAuthenticated(false);
                }
                isAuthCheckCompleted.current = true;
            } catch (err) {
                console.error("Auth check internal error:", err);
                setIsAuthenticated(false);
                isAuthCheckCompleted.current = true;
            }
        };
        checkAuth();

        // Supabase Auth Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                setIsAuthenticated(true);
                setUser(session.user);
                const user = session.user;
                const metadata = user.user_metadata;
                setUserMetadata(metadata);

                // Refresh Email
                setEmail(user.email || null);

                // Refresh Name
                let name = "Kullanıcı";
                if (metadata?.full_name) {
                    name = metadata.full_name;
                } else if (metadata?.first_name && metadata?.last_name) {
                    name = `${metadata.first_name} ${metadata.last_name}`;
                } else {
                    name = user.email?.split('@')[0] || "Kullanıcı";
                }
                setUserName(name);

                if (metadata?.avatar_url) {
                    setAvatarUrl(metadata.avatar_url);
                    localStorage.setItem('user_avatar_url', metadata.avatar_url);
                }
                refreshDashboardData();
            } else {
                setIsAuthenticated(false);
                setUser(null);
                setUserName(null);
                setEmail(null);
                setUserMetadata(null);
                setAvatarUrl(null);
                localStorage.removeItem('user_avatar_url');
            }
            isAuthCheckCompleted.current = true;
        });

        // Safety timeout: If auth check hangs for more than 5s, fallback to false
        const safetyTimeout = setTimeout(() => {
            if (!isAuthCheckCompleted.current) {
                console.warn("Auth check timed out, falling back to unauthenticated state.");
                setIsAuthenticated(false);
            }
        }, 5000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(safetyTimeout);
        };
    }, []);

    // Wrap setAvatarUrl to handle persistence
    const updateAvatar = (url: string | null) => {
        setAvatarUrl(url);
        if (url) {
            localStorage.setItem('user_avatar_url', url);
        } else {
            localStorage.removeItem('user_avatar_url');
        }
    };

    const updateProfile = async (updates: { [key: string]: any }) => {
        try {
            const { error } = await supabase.auth.updateUser({
                data: updates
            });

            if (error) throw error;

            // Optimistic update for specific fields we track
            if (updates.full_name) setUserName(updates.full_name);
            // Optimistic metadata update
            setUserMetadata((prev: any) => ({ ...prev, ...updates }));

        } catch (error) {
            console.error("Error updating profile:", error);
            throw error;
        }
    };

    return (
        <UserContext.Provider value={{
            user,
            avatarUrl,
            setAvatarUrl: updateAvatar,
            userName,
            setUserName,
            email,
            setEmail,
            userMetadata,
            isAuthenticated,
            updateProfile,
            myAssets,
            prices,
            stats,
            isDataLoaded,
            refreshDashboardData
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);

    // If we're on the server, return a mock context to avoid SSR errors
    if (typeof window === 'undefined') {
        return {
            user: null,
            avatarUrl: null,
            setAvatarUrl: () => { },
            userName: null,
            setUserName: () => { },
            email: null,
            setEmail: () => { },
            userMetadata: null,
            isAuthenticated: null,
            updateProfile: async () => { },
            myAssets: [],
            prices: {},
            stats: [],
            isDataLoaded: false,
            refreshDashboardData: async () => { }
        } as UserContextType;
    }

    if (context === undefined) {
        // Returning a default state for server-side rendering or outside provider
        return {
            user: null,
            avatarUrl: null,
            setAvatarUrl: () => { },
            userName: null,
            setUserName: () => { },
            email: null,
            setEmail: () => { },
            userMetadata: null,
            isAuthenticated: null,
            updateProfile: async () => { },
            myAssets: [],
            prices: {},
            stats: [],
            isDataLoaded: false,
            refreshDashboardData: async () => { }
        } as UserContextType;
    }
    return context;
}
