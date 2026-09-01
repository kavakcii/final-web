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
            return NextResponse.json({ success: false, error: 'Takip etmek için giriş yapmalısınız.' }, { status: 401 });
        }

        const body = await request.json();
        const { indicator_name } = body;

        if (!indicator_name || typeof indicator_name !== 'string') {
            return NextResponse.json({ success: false, error: 'Gösterge adı geçersiz.' }, { status: 400 });
        }

        const cleanName = indicator_name.trim();

        const { data, error } = await supabaseAdmin
            .from('followed_indicators')
            .upsert({
                user_id: user.id,
                indicator_name: cleanName
            }, { onConflict: 'user_id,indicator_name' })
            .select()
            .single();

        if (error) {
            console.error('[Follow Indicator Error]', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // Auto-create default notification preferences if not exists
        await supabaseAdmin
            .from('notification_preferences')
            .upsert({
                user_id: user.id,
                min_30_before: false,
                min_10_before: true,
                on_release: true,
                on_update: true
            }, { onConflict: 'user_id' });

        return NextResponse.json({ success: true, follow: data });
    } catch (e: any) {
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
        const { indicator_name } = body;

        if (!indicator_name) {
            return NextResponse.json({ success: false, error: 'Gösterge adı belirtilmelidir.' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('followed_indicators')
            .delete()
            .eq('user_id', user.id)
            .eq('indicator_name', indicator_name.trim());

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Gösterge takipten çıkarıldı.' });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
