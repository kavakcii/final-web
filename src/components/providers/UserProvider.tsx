'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UserContextType {
    avatarUrl: string | null;
    setAvatarUrl: (url: string | null) => void;
    userName: string | null;
    setUserName: (name: string | null) => void;
    email: string | null;
    setEmail: (email: string | null) => void;
    userMetadata: any;
    isAuthenticated: boolean | null;
    updateProfile: (updates: { [key: string]: any }) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [userMetadata, setUserMetadata] = useState<any>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        // Load persisted state if any from localStorage (basic persistence)
        const storedAvatar = localStorage.getItem('user_avatar_url');
        if (storedAvatar) setAvatarUrl(storedAvatar);

        // Initial Auth Check
        const checkAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error("Supabase session error:", error);
                    setIsAuthenticated(false);
                    return;
                }

                if (session) {
                    setIsAuthenticated(true);
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
                } else {
                    setIsAuthenticated(false);
                }
            } catch (err) {
                console.error("Auth check internal error:", err);
                setIsAuthenticated(false);
            }
        };
        checkAuth();

        // Supabase Auth Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                setIsAuthenticated(true);
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
            } else {
                setIsAuthenticated(false);
                setUserName(null);
                setEmail(null);
                setUserMetadata(null);
                setAvatarUrl(null);
                localStorage.removeItem('user_avatar_url');
            }
        });

        // Safety timeout: If auth check hangs for more than 5s, fallback to false
        const safetyTimeout = setTimeout(() => {
            if (isAuthenticated === null) {
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
        <UserContext.Provider value={{ avatarUrl, setAvatarUrl: updateAvatar, userName, setUserName, email, setEmail, userMetadata, isAuthenticated, updateProfile }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
