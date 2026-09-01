import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWebPushNotification } from '@/lib/web-push';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
);

export const dynamic = 'force-dynamic';

async function getUserFromRequest(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return null;

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return null;

    return user;
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ success: false, error: 'Test bildirimi göndermek için giriş yapmalısınız.' }, { status: 401 });
        }

        // Fetch user's active push subscriptions
        const { data: subscriptions, error: subErr } = await supabaseAdmin
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true);

        if (subErr) {
            return NextResponse.json({ success: false, error: subErr.message }, { status: 500 });
        }

        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json({ 
                success: false, 
                error: 'Cihazınızda henüz onaylanmış bir bildirim aboneliği bulunmuyor. Lütfen önce ekonomik bir göstergeyi takip ederek bildirim izni verin.' 
            }, { status: 400 });
        }

        const testPayload = {
            title: 'FinAi Test Bildirimi 🔔',
            body: 'Web Push bildirim altyapınız başarıyla çalışıyor! Ekonomik göstergeler açıklandığında anında bilgilendirileceksiniz.',
            url: '/dashboard/notifications',
            tag: 'finai-test-notification'
        };

        let sentCount = 0;
        let failCount = 0;
        let lastError = '';

        for (const sub of subscriptions) {
            const res = await sendWebPushNotification(
                { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
                testPayload
            );

            if (res.success) {
                sentCount++;
                await supabaseAdmin
                    .from('push_subscriptions')
                    .update({ last_used_at: new Date().toISOString() })
                    .eq('id', sub.id);
            } else {
                failCount++;
                lastError = res.error;
                if (res.statusCode === 404 || res.statusCode === 410) {
                    await supabaseAdmin
                        .from('push_subscriptions')
                        .update({ is_active: false })
                        .eq('id', sub.id);
                }
            }
        }

        if (sentCount > 0) {
            return NextResponse.json({ 
                success: true, 
                message: `Test bildirimi ${sentCount} cihazınıza başarıyla iletildi.`,
                sentCount,
                failCount
            });
        } else {
            return NextResponse.json({ 
                success: false, 
                error: `Bildirim iletilemedi: ${lastError}` 
            }, { status: 500 });
        }
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
