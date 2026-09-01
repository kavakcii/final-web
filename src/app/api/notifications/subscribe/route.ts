import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
            return NextResponse.json({ success: false, error: 'Yetkisiz erişim. Lütfen önce giriş yapın.' }, { status: 401 });
        }

        const body = await request.json();
        const { endpoint, p256dh, auth, user_agent } = body;

        if (!endpoint || !p256dh || !auth) {
            return NextResponse.json({ success: false, error: 'Eksik push subscription parametreleri.' }, { status: 400 });
        }

        const nowIso = new Date().toISOString();

        // Upsert subscription for user
        const { data, error } = await supabaseAdmin
            .from('push_subscriptions')
            .upsert({
                user_id: user.id,
                endpoint,
                p256dh,
                auth,
                user_agent: user_agent || request.headers.get('user-agent') || 'Unknown',
                is_active: true,
                updated_at: nowIso,
                last_used_at: nowIso
            }, { onConflict: 'endpoint' })
            .select()
            .single();

        if (error) {
            console.error('[Push Subscription Save Error]', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, subscription: data });
    } catch (e: any) {
        console.error('[Push Subscribe Exception]', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });
        }

        const body = await request.json();
        const { endpoint } = body;

        if (!endpoint) {
            return NextResponse.json({ success: false, error: 'Endpoint parametresi zorunludur.' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('push_subscriptions')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('endpoint', endpoint);

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Abonelik pasife alındı.' });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
