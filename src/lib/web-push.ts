import webpush from 'web-push';

export interface PushNotificationPayload {
    title: string;
    body: string;
    url?: string;
    eventId?: string;
    tag?: string;
    icon?: string;
    badge?: string;
}

export interface PushSubscriptionItem {
    endpoint: string;
    p256dh: string;
    auth: string;
}

function ensureVapidInit() {
    const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
    const mailto = process.env.VAPID_MAILTO || 'mailto:finairesmi@gmail.com';

    if (publicVapidKey && privateVapidKey) {
        try {
            webpush.setVapidDetails(mailto, publicVapidKey, privateVapidKey);
        } catch (err) {
            console.error('[WebPush Init Error]', err);
        }
    }
}

export async function sendWebPushNotification(
    subscription: PushSubscriptionItem,
    payload: PushNotificationPayload
): Promise<{ success: boolean; error?: any; statusCode?: number }> {
    ensureVapidInit();

    try {
        const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth
            }
        };

        await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(payload)
        );

        return { success: true };
    } catch (err: any) {
        console.error('[WebPush Send Error]', err);
        return { 
            success: false, 
            error: err.message || err, 
            statusCode: err.statusCode || err.status 
        };
    }
}

export function getPublicVapidKey(): string {
    return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
}
