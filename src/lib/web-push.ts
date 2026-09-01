import webpush from 'web-push';

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa167768875_PLACEHOLDER_KEY';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'PLACEHOLDER_PRIVATE_KEY';
const mailto = process.env.VAPID_MAILTO || 'mailto:info@finai.com';

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    try {
        webpush.setVapidDetails(
            mailto,
            publicVapidKey,
            privateVapidKey
        );
    } catch (err) {
        console.error('[WebPush Init Error]', err);
    }
}

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

export async function sendWebPushNotification(
    subscription: PushSubscriptionItem,
    payload: PushNotificationPayload
): Promise<{ success: boolean; error?: any; statusCode?: number }> {
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

export { publicVapidKey };
