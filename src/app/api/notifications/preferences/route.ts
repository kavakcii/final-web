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

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });
        }

        const { data, error } = await supabaseAdmin
            .from('notification_preferences')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        const defaults = {
            user_id: user.id,
            min_30_before: false,
            min_10_before: true,
            on_release: true,
            on_update: true,
            on_revision: true
        };

        return NextResponse.json({ success: true, preferences: data || defaults });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });
        }

        const body = await request.json();
        const { min_30_before, min_10_before, on_release, on_update, on_revision } = body;

        const payload = {
            user_id: user.id,
            min_30_before: typeof min_30_before === 'boolean' ? min_30_before : false,
            min_10_before: typeof min_10_before === 'boolean' ? min_10_before : true,
            on_release: typeof on_release === 'boolean' ? on_release : true,
            on_update: typeof on_update === 'boolean' ? on_update : true,
            on_revision: typeof on_revision === 'boolean' ? on_revision : true,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabaseAdmin
            .from('notification_preferences')
            .upsert(payload, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, preferences: data });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
