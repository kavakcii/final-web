// FinAi Web Push Service Worker
self.addEventListener('push', function (event) {
    if (!event.data) return;

    try {
        const payload = event.data.json();
        const title = payload.title || 'FinAi Ekonomik Takvim';
        const options = {
            body: payload.body || 'Ekonomik gösterge bildirimi',
            icon: payload.icon || '/icon.png',
            badge: payload.badge || '/icon.png',
            data: {
                url: payload.url || '/dashboard/economic-calendar',
                eventId: payload.eventId
            },
            tag: payload.tag || 'finai-notification',
            renotify: true
        };

        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    } catch (e) {
        console.error('[Service Worker] Push event parse error:', e);
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const rawUrl = (event.notification.data && event.notification.data.url) 
        ? event.notification.data.url 
        : '/dashboard/economic-calendar';

    const fullUrl = new URL(rawUrl, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(fullUrl);
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(fullUrl);
            }
        })
    );
});
