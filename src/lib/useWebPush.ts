"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function useWebPush() {
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
    const [isSupported, setIsSupported] = useState<boolean>(true);
    const [followedIndicators, setFollowedIndicators] = useState<string[]>([]);
    const [loadingFollowed, setLoadingFollowed] = useState<boolean>(true);
    const [userSession, setUserSession] = useState<any>(null);

    // Initial checks for SW support & Notification permission
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        setIsSupported(supported);

        if (supported) {
            setPermissionStatus(Notification.permission);
        }

        // Fetch User Session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUserSession(session);
            if (session?.access_token) {
                fetchFollowedIndicators(session.access_token);
            } else {
                setLoadingFollowed(false);
            }
        });
    }, []);

    // Fetch followed indicators from backend
    const fetchFollowedIndicators = async (token?: string) => {
        try {
            const accessToken = token || (await supabase.auth.getSession()).data.session?.access_token;
            if (!accessToken) {
                setLoadingFollowed(false);
                return;
            }

            const res = await fetch('/api/indicators/followed', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const json = await res.json();
            if (json.success && Array.isArray(json.followed)) {
                setFollowedIndicators(json.followed);
            }
        } catch (e) {
            console.error('[Fetch Followed Error]', e);
        } finally {
            setLoadingFollowed(false);
        }
    };

    // Register SW & Subscribe to Web Push
    const registerAndSubscribe = async (): Promise<boolean> => {
        if (!isSupported) return false;

        try {
            const permission = await Notification.requestPermission();
            setPermissionStatus(permission);

            if (permission !== 'granted') return false;

            // 1. Get VAPID public key
            const keyRes = await fetch('/api/notifications/vapid-key');
            const { publicKey } = await keyRes.json();

            if (!publicKey) {
                console.warn('VAPID public key is missing.');
                return true;
            }

            // 2. Register Service Worker
            const registration = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;

            // 3. Subscribe via PushManager
            const applicationServerKey = urlBase64ToUint8Array(publicKey);
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey
                });
            }

            // 4. Send subscription to backend
            const session = (await supabase.auth.getSession()).data.session;
            if (session?.access_token) {
                const subJson = subscription.toJSON();
                await fetch('/api/notifications/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({
                        endpoint: subJson.endpoint,
                        p256dh: subJson.keys?.p256dh,
                        auth: subJson.keys?.auth,
                        user_agent: navigator.userAgent
                    })
                });
            }

            return true;
        } catch (e) {
            console.error('[WebPush Subscribe Error]', e);
            return false;
        }
    };

    // Toggle follow indicator
    const toggleFollowIndicator = async (indicatorName: string): Promise<{ success: boolean; isFollowed: boolean; message?: string }> => {
        const session = (await supabase.auth.getSession()).data.session;
        if (!session) {
            return { success: false, isFollowed: false, message: 'Takip etmek için giriş yapmalısınız.' };
        }

        const cleanName = indicatorName.trim();
        const currentlyFollowed = followedIndicators.includes(cleanName);

        try {
            if (currentlyFollowed) {
                // Unfollow
                const res = await fetch('/api/indicators/follow', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({ indicator_name: cleanName })
                });
                const json = await res.json();
                if (json.success) {
                    setFollowedIndicators(prev => prev.filter(item => item !== cleanName));
                    return { success: true, isFollowed: false };
                }
            } else {
                // Follow -> Trigger Push Permission flow
                if (permissionStatus !== 'granted' && isSupported) {
                    await registerAndSubscribe();
                }

                const res = await fetch('/api/indicators/follow', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({ indicator_name: cleanName })
                });
                const json = await res.json();
                if (json.success) {
                    setFollowedIndicators(prev => [...prev, cleanName]);
                    return { success: true, isFollowed: true };
                }
            }
            return { success: false, isFollowed: currentlyFollowed };
        } catch (e: any) {
            return { success: false, isFollowed: currentlyFollowed, message: e.message };
        }
    };

    const isFollowing = useCallback((indicatorName: string) => {
        return followedIndicators.includes(indicatorName.trim());
    }, [followedIndicators]);

    return {
        permissionStatus,
        isSupported,
        followedIndicators,
        loadingFollowed,
        userSession,
        registerAndSubscribe,
        toggleFollowIndicator,
        isFollowing,
        refreshFollowed: fetchFollowedIndicators
    };
}
