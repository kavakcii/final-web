import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWebPushNotification } from '@/lib/web-push';
import { CatalogCalendarEvent, ECONOMIC_CALENDAR_CATALOG } from '@/lib/calendar-catalog';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
    return handleDailySummary(request);
}

export async function POST(request: NextRequest) {
    return handleDailySummary(request);
}

async function handleDailySummary(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const { searchParams } = new URL(request.url);
    const isTestMode = searchParams.get('test') === 'true';
    const targetUserId = searchParams.get('user_id');

    // 1. Strict Authorization Check
    // If CRON_SECRET is configured:
    // - In test mode (test=true), authorization MUST be Bearer ${CRON_SECRET}.
    // - In normal cron execution, authorization must be Bearer ${CRON_SECRET} OR Vercel Cron header (x-vercel-cron: 1).
    if (cronSecret) {
        const hasValidSecret = authHeader === `Bearer ${cronSecret}`;
        const isVercelCron = !isTestMode && request.headers.get('x-vercel-cron') === '1';

        if (!hasValidSecret && !isVercelCron) {
            return NextResponse.json({ 
                success: false, 
                error: 'Yetkisiz istek. Geçerli CRON_SECRET gereklidir.' 
            }, { status: 401 });
        }
    }

    // 2. Strict Test Mode Validation
    // If test=true is requested, user_id parameter is MANDATORY to prevent accidental broadcast.
    if (isTestMode && !targetUserId) {
        return NextResponse.json({ 
            success: false, 
            error: 'Test modunda targetUserId (user_id) parametresi zorunludur.' 
        }, { status: 400 });
    }

    const stats = {
        date: '',
        is_test_mode: isTestMode,
        target_user_id: targetUserId || null,
        events_found: 0,
        top_news_title: '',
        ai_headline_used: false,
        users_processed: 0,
        notifications_sent: 0,
        notifications_failed: 0,
        duplicates_prevented: 0
    };

    try {
        // 3. Timezone calculation: Europe/Istanbul (YYYY-MM-DD)
        const now = new Date();
        const todayIso = now.toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });
        const todayFormatted = now.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric' });
        stats.date = todayIso;

        // 4. Fetch today's economic calendar events from DB or Catalog
        const { data: dbEvents } = await supabaseAdmin
            .from('economic_calendar_events')
            .select('*')
            .eq('event_date', todayIso);

        let todayEvents: CatalogCalendarEvent[] = [];

        if (dbEvents && dbEvents.length > 0) {
            todayEvents = dbEvents.map(e => ({
                id: e.id,
                country: e.country_code,
                flag: e.flag,
                event: e.event_name,
                impact: e.impact_level,
                time: e.event_time,
                dateFormatted: todayFormatted,
                dateDayName: '',
                weekOffset: 0,
                actual: e.actual_value || undefined,
                forecast: e.forecast_value || undefined,
                previous: e.previous_value || undefined
            }));
        } else {
            // Fallback to Catalog events matching date
            todayEvents = ECONOMIC_CALENDAR_CATALOG.filter(e => e.dateFormatted === todayFormatted || !e.dateFormatted);
        }

        stats.events_found = todayEvents.length;

        // 5. Fetch Top Morning Headline News from /api/news
        let topNewsHeadline = '';
        try {
            const host = request.headers.get('host') || 'localhost:3000';
            const protocol = host.includes('localhost') ? 'http' : 'https';
            const newsRes = await fetch(`${protocol}://${host}/api/news?limit=10`, { cache: 'no-store' });
            if (newsRes.ok) {
                const newsJson = await newsRes.json();
                const newsItems = newsJson.news || newsJson.data || [];
                if (newsItems.length > 0) {
                    const meaningfulNews = newsItems.find((n: any) => n.impact === 'critical' || n.impact === 'high') || newsItems[0];
                    if (meaningfulNews && meaningfulNews.title) {
                        topNewsHeadline = meaningfulNews.title;
                        stats.top_news_title = topNewsHeadline;
                    }
                }
            }
        } catch (newsErr) {
            console.error('[Daily Summary News Fetch Error]', newsErr);
        }

        // 6. Single Global Gemini AI Call (AT MOST ONCE FOR ALL USERS)
        let globalAiHeadline = '';
        const geminiApiKey = process.env.GEMINI_API_KEY;

        if (geminiApiKey && (todayEvents.length > 0 || topNewsHeadline)) {
            try {
                const genAI = new GoogleGenerativeAI(geminiApiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

                const eventsSummary = todayEvents.slice(0, 4).map(e => `${e.country} ${e.event} (${e.time})`).join(', ');
                const prompt = `Sen FinAi finans yapay zekasısın. Bugünün ekonomisi için 1 CÜMLELİK (en fazla 15 kelime) kısa, özgün ve ilgi çekici bir sabah manşeti yaz. 
Veriler: ${eventsSummary || 'Ekonomik göstergeler'}. Haber: ${topNewsHeadline || 'Piyasalar güne hazırlanıyor'}. 
Yanıtında sadece Türkçe 1 cümle olsun.`;

                const aiRes = await model.generateContent(prompt);
                const text = aiRes.response.text().trim().replace(/^["']/g, '').replace(/["']$/g, '');
                if (text && text.length < 120) {
                    globalAiHeadline = text;
                    stats.ai_headline_used = true;
                }
            } catch (aiErr) {
                console.error('[Daily Summary Gemini AI Error - Graceful Fallback Used]', aiErr);
            }
        }

        // 7. Fetch Users with Push Subscriptions and daily_morning_summary = true
        const { data: preferences } = await supabaseAdmin
            .from('notification_preferences')
            .select('*')
            .eq('daily_morning_summary', true);

        // Query active subscriptions (strictly filtered at DB level in test mode)
        let subQuery = supabaseAdmin
            .from('push_subscriptions')
            .select('*')
            .eq('is_active', true);

        if (isTestMode && targetUserId) {
            subQuery = subQuery.eq('user_id', targetUserId);
        }

        const { data: subscriptions } = await subQuery;

        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json({
                success: true,
                message: isTestMode ? 'Hedef kullanıcının aktif push aboneliği bulunamadı.' : 'Aktif push aboneliği olan kullanıcı bulunamadı.',
                stats
            });
        }

        const { data: follows } = await supabaseAdmin
            .from('followed_indicators')
            .select('*');

        const prefMap = new Map<string, any>();
        (preferences || []).forEach(p => prefMap.set(p.user_id, p));

        const followMap = new Map<string, string[]>();
        (follows || []).forEach(f => {
            const list = followMap.get(f.user_id) || [];
            followMap.set(f.user_id, [...list, f.indicator_name]);
        });

        // Group active subscriptions by user_id
        const userSubsMap = new Map<string, any[]>();
        subscriptions.forEach(s => {
            if (targetUserId && s.user_id !== targetUserId) return;
            const list = userSubsMap.get(s.user_id) || [];
            userSubsMap.set(s.user_id, [...list, s]);
        });

        // Event log ID and notification type differentiation
        const dailyEventLogId = isTestMode 
            ? `daily_summary_test_${todayIso}_${Date.now()}`
            : `daily_summary_${todayIso}`;

        const notificationType = isTestMode
            ? 'daily_summary_test'
            : 'daily_summary';

        // 8. Process Each User (Personalize Payload Deterministically)
        for (const [userId, userSubs] of userSubsMap.entries()) {
            stats.users_processed++;

            // Check Preference
            const userPref = prefMap.get(userId);
            if (userPref && userPref.daily_morning_summary === false && !isTestMode) {
                continue;
            }

            // Duplicate Protection Check (Normal cron run)
            if (!isTestMode) {
                const { data: existingLog } = await supabaseAdmin
                    .from('notification_logs')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('event_id', dailyEventLogId)
                    .eq('notification_type', notificationType)
                    .maybeSingle();

                if (existingLog) {
                    stats.duplicates_prevented++;
                    continue;
                }
            }

            // User's followed indicators
            const userFollowedNames = followMap.get(userId) || [];
            const userTodayEvents = todayEvents.filter(e => 
                userFollowedNames.some(fn => e.event === fn || e.event.includes(fn) || fn.includes(e.event))
            );

            // Construct Deterministic Short Notification Body
            let bodyParts: string[] = [];

            if (todayEvents.length > 0) {
                bodyParts.push(`Bugün ${todayEvents.length} ekonomik veri açıklanıyor.`);
            } else {
                bodyParts.push(`Bugün piyasalarda takip edilen yayınlar var.`);
            }

            if (userTodayEvents.length > 0) {
                const namesText = userTodayEvents.slice(0, 2).map(e => e.event).join(' ve ');
                bodyParts.push(`Takip ettiğiniz ${namesText} bugün yayında.`);
            } else if (todayEvents.length > 0) {
                const topEvent = todayEvents[0];
                bodyParts.push(`Öne çıkan: ${topEvent.country} ${topEvent.event} (${topEvent.time}).`);
            }

            if (globalAiHeadline) {
                bodyParts.push(globalAiHeadline);
            } else if (topNewsHeadline) {
                bodyParts.push(topNewsHeadline.slice(0, 60) + '...');
            }

            let finalBody = bodyParts.join(' ');
            if (finalBody.length > 180) {
                finalBody = finalBody.slice(0, 177) + '...';
            }

            const payload = {
                title: isTestMode ? 'FinAi Gün Başlangıcı (Test) ☀️' : 'FinAi Gün Başlangıcı ☀️',
                body: finalBody,
                url: '/dashboard/economic-calendar',
                tag: `daily-summary-${todayIso}`
            };

            // Send Push to user's active devices
            let sentAny = false;
            let lastError = '';

            for (const sub of userSubs) {
                const pushRes = await sendWebPushNotification(
                    { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
                    payload
                );

                if (pushRes.success) {
                    sentAny = true;
                    stats.notifications_sent++;
                    await supabaseAdmin
                        .from('push_subscriptions')
                        .update({ last_used_at: new Date().toISOString() })
                        .eq('id', sub.id);
                } else {
                    stats.notifications_failed++;
                    lastError = pushRes.error;
                    if (pushRes.statusCode === 404 || pushRes.statusCode === 410) {
                        await supabaseAdmin
                            .from('push_subscriptions')
                            .update({ is_active: false })
                            .eq('id', sub.id);
                    }
                }
            }

            // Log notification entry
            await supabaseAdmin.from('notification_logs').insert({
                user_id: userId,
                event_id: dailyEventLogId,
                notification_type: notificationType,
                title: payload.title,
                body: payload.body,
                sent_at: new Date().toISOString(),
                status: sentAny ? 'sent' : 'failed',
                error_message: sentAny ? null : lastError
            });
        }

        return NextResponse.json({
            success: true,
            message: isTestMode ? 'FinAi Gün Başlangıcı Özeti (Test Modu) başarıyla iletildi.' : 'FinAi Gün Başlangıcı Özeti başarıyla işlendi.',
            stats
        });
    } catch (e: any) {
        console.error('[Daily Morning Summary Fatal Exception]', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
