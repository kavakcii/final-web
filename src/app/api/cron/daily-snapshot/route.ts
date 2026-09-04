import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOrFetchCachedPrices } from '@/lib/server-price-cache';

/**
 * Günlük Portföy Snapshot Cron Job
 * Çalışma zamanı: Her gün 23:59 TSİ (= UTC 20:59)
 * Görev: Kullanıcılar siteye girmemiş olsalar bile tüm aktif kullanıcıların
 *        portföy değerini o günkü canlı/kapanış fiyatlarına göre yetkili olarak kaydeder.
 */

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service Role → RLS bypass, sadece server-side
    { auth: { persistSession: false } }
);

async function processUser(userId: string): Promise<{ success: boolean; value: number }> {
    try {
        // Kullanıcının portföyünü çek
        const { data: assets, error: assetsError } = await supabaseAdmin
            .from('user_portfolios')
            .select('symbol, quantity, avg_cost, asset_type')
            .eq('user_id', userId);

        if (assetsError || !assets || assets.length === 0) {
            return { success: false, value: 0 };
        }

        // Benzersiz sembollerin güncel fiyatlarını çek (Sunucu önbellek kasası ile)
        const uniqueSymbols = Array.from(new Set(assets.map((a: any) => (a.symbol || '').toUpperCase())));
        const priceMap = await getOrFetchCachedPrices(uniqueSymbols);

        // Toplam değer ve maliyet hesapla
        let totalValue = 0;
        let totalCost = 0;

        assets.forEach((a: any) => {
            const symUpper = (a.symbol || '').toUpperCase();
            const symClean = symUpper.replace(/\.IS$/, '');
            const price = priceMap[symUpper] ?? priceMap[symClean] ?? priceMap[`${symClean}.IS`] ?? Number(a.avg_cost || 0);

            totalValue += price * Number(a.quantity);
            totalCost  += Number(a.avg_cost) * Number(a.quantity);
        });

        // Eğer toplam değer mantıksız şekilde 0 ise snapshot atma
        if (totalValue <= 0) {
            return { success: false, value: 0 };
        }

        const totalProfit = totalValue - totalCost;
        const profitPct   = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
        const assetCount  = uniqueSymbols.length;

        // TSİ bazlı bugünün tarihi (YYYY-MM-DD)
        const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });

        const snapshotData = {
            total_value:  totalValue,
            total_profit: totalProfit,
            total_cost:   totalCost,
            profit_pct:   profitPct,
            asset_count:  assetCount,
            updated_at:   new Date().toISOString()
        };

        // Bugün için kayıt kontrolü
        const { data: existing } = await supabaseAdmin
            .from('portfolio_history')
            .select('id, total_value')
            .eq('user_id', userId)
            .eq('snapshot_date', today)
            .maybeSingle();

        if (existing) {
            await supabaseAdmin
                .from('portfolio_history')
                .update(snapshotData)
                .eq('id', existing.id);
        } else {
            await supabaseAdmin
                .from('portfolio_history')
                .insert([{ user_id: userId, snapshot_date: today, ...snapshotData }]);
        }

        return { success: true, value: totalValue };
    } catch (err) {
        console.error(`Snapshot failed for user ${userId}:`, err);
        return { success: false, value: 0 };
    }
}

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        // Güvenlik doğrulaması
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            const { searchParams } = new URL(request.url);
            const key = searchParams.get('key');
            if (key !== cronSecret && process.env.NODE_ENV === 'production') {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        // Tüm aktif portföy sahibi kullanıcıları getir
        const { data: users, error } = await supabaseAdmin
            .from('user_portfolios')
            .select('user_id');

        if (error || !users) {
            return NextResponse.json({ error: 'No users found' }, { status: 500 });
        }

        const uniqueUserIds = Array.from(new Set(users.map(u => u.user_id)));
        const results = await Promise.all(uniqueUserIds.map(processUser));

        const successCount = results.filter(r => r.success).length;

        return NextResponse.json({
            status: 'ok',
            processedUsers: uniqueUserIds.length,
            successCount,
            timestamp: new Date().toISOString()
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
