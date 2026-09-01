import { createClient } from '@supabase/supabase-js';
import { sendWebPushNotification, PushNotificationPayload } from './web-push';
import { calculateBackendDifferences } from './finai-calendar-analysis-engine';
import { CatalogCalendarEvent, ECONOMIC_CALENDAR_CATALOG } from './calendar-catalog';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
);

export interface ProcessNotificationsStats {
    events_scanned: number;
    notifications_sent: number;
    notifications_failed: number;
    duplicates_prevented: number;
    inactive_subs_cleaned: number;
}

export async function processNotificationEngine(): Promise<ProcessNotificationsStats> {
    const stats: ProcessNotificationsStats = {
        events_scanned: 0,
        notifications_sent: 0,
        notifications_failed: 0,
        duplicates_prevented: 0,
        inactive_subs_cleaned: 0
    };

    try {
        // 1. Fetch current events from Supabase DB or Catalog
        const { data: dbEvents } = await supabaseAdmin
            .from('economic_calendar_events')
            .select('*');

        const eventsToProcess: CatalogCalendarEvent[] = (dbEvents && dbEvents.length > 0)
            ? dbEvents.map(e => ({
                id: e.id,
                country: e.country_code,
                flag: e.flag,
                event: e.event_name,
                impact: e.impact_level,
                time: e.event_time,
                dateFormatted: e.event_date.split('-').reverse().join('.'),
                dateDayName: '',
                weekOffset: 0,
                actual: e.actual_value || undefined,
                forecast: e.forecast_value || undefined,
                previous: e.previous_value || undefined
            }))
            : ECONOMIC_CALENDAR_CATALOG;

        stats.events_scanned = eventsToProcess.length;

        // 2. Fetch all followed indicators and active push subscriptions
        const { data: follows } = await supabaseAdmin.from('followed_indicators').select('*');
        if (!follows || follows.length === 0) return stats;

        const { data: preferences } = await supabaseAdmin.from('notification_preferences').select('*');
        const { data: subscriptions } = await supabaseAdmin.from('push_subscriptions').select('*').eq('is_active', true);
        if (!subscriptions || subscriptions.length === 0) return stats;

        const prefMap = new Map<string, any>();
        (preferences || []).forEach(p => prefMap.set(p.user_id, p));

        const subMap = new Map<string, any[]>();
        subscriptions.forEach(s => {
            const existing = subMap.get(s.user_id) || [];
            subMap.set(s.user_id, [...existing, s]);
        });

        const now = new Date();
        const todayFormatted = now.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric' });

        for (const item of eventsToProcess) {
            // Find users following this indicator
            const matchingFollows = follows.filter(f => 
                f.indicator_name === item.event || 
                f.indicator_name.includes(item.event) || 
                item.event.includes(f.indicator_name)
            );

            if (matchingFollows.length === 0) continue;

            const isReleased = item.actual && item.actual !== 'Bekleniyor' && item.actual !== '-';
            const calc = calculateBackendDifferences(item);

            // Compute remaining minutes to event time
            let diffMinutes: number | null = null;
            try {
                const parts = (item.dateFormatted || todayFormatted).split('.');
                const [timeH, timeM] = item.time.split(':').map(Number);
                const eventDate = new Date(Date.UTC(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), timeH - 3, timeM));
                diffMinutes = Math.round((eventDate.getTime() - now.getTime()) / (1000 * 60));
            } catch {
                diffMinutes = null;
            }

            for (const follow of matchingFollows) {
                const userId = follow.user_id;
                const userSubs = subMap.get(userId) || [];
                if (userSubs.length === 0) continue;

                const userPref = prefMap.get(userId) || {
                    min_30_before: false,
                    min_10_before: true,
                    on_release: true,
                    on_update: true,
                    on_revision: true
                };

                const eventId = item.id || `${item.country}_${item.event}_${item.dateFormatted}`;
                const targetUrl = `/dashboard/economic-calendar/${encodeURIComponent(eventId)}`;

                // EVALUATE NOTIFICATION TYPES:

                // A) 30 MINUTES BEFORE
                if (userPref.min_30_before && diffMinutes !== null && diffMinutes >= 25 && diffMinutes <= 35) {
                    await sendNotificationToUser(userId, eventId, 'min_30', {
                        title: `${item.event} 30 dakika içinde açıklanacak`,
                        body: `Piyasanın takip ettiği ${item.country} verisi yaklaşıyor. Detayları FinAi'de incele.`,
                        url: targetUrl,
                        eventId
                    }, userSubs, stats);
                }

                // B) 10 MINUTES BEFORE
                if (userPref.min_10_before && diffMinutes !== null && diffMinutes >= 0 && diffMinutes <= 12) {
                    await sendNotificationToUser(userId, eventId, 'min_10', {
                        title: `${item.event} 10 dakika içinde açıklanacak`,
                        body: `Piyasanın takip ettiği ${item.country} verisi yaklaşıyor. Detayları FinAi'de incele.`,
                        url: targetUrl,
                        eventId
                    }, userSubs, stats);
                }

                // C) VERİ AÇIKLANDI (RELEASED)
                if (userPref.on_release && isReleased) {
                    let bodyText = `Gerçekleşen: ${item.actual}`;
                    if (item.forecast) bodyText += ` · Beklenti: ${item.forecast}`;
                    if (calc.forecastDiffText) bodyText += ` · ${calc.forecastDiffText}`;

                    await sendNotificationToUser(userId, eventId, 'released', {
                        title: `${item.event} açıklandı`,
                        body: bodyText,
                        url: targetUrl,
                        eventId
                    }, userSubs, stats);
                }
            }
        }
    } catch (e) {
        console.error('[Notification Engine Fatal Exception]', e);
    }

    return stats;
}

async function sendNotificationToUser(
    userId: string,
    eventId: string,
    notifType: 'min_30' | 'min_10' | 'released' | 'updated' | 'revision',
    payload: PushNotificationPayload,
    subs: any[],
    stats: ProcessNotificationsStats
) {
    // Check Duplicate Log
    const { data: existingLog } = await supabaseAdmin
        .from('notification_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .eq('notification_type', notifType)
        .maybeSingle();

    if (existingLog) {
        stats.duplicates_prevented++;
        return;
    }

    let sentAny = false;
    let lastError = '';

    for (const sub of subs) {
        const res = await sendWebPushNotification(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            payload
        );

        if (res.success) {
            sentAny = true;
            stats.notifications_sent++;
            await supabaseAdmin.from('push_subscriptions').update({ last_used_at: new Date().toISOString() }).eq('id', sub.id);
        } else {
            stats.notifications_failed++;
            lastError = res.error;
            if (res.statusCode === 404 || res.statusCode === 410) {
                await supabaseAdmin.from('push_subscriptions').update({ is_active: false }).eq('id', sub.id);
                stats.inactive_subs_cleaned++;
            }
        }
    }

    // Write Notification Log
    await supabaseAdmin.from('notification_logs').insert({
        user_id: userId,
        event_id: eventId,
        notification_type: notifType,
        title: payload.title,
        body: payload.body,
        sent_at: new Date().toISOString(),
        status: sentAny ? 'sent' : 'failed',
        error_message: sentAny ? null : lastError
    });
}
