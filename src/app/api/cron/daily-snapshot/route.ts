import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Günlük Portföy Snapshot Cron Job
 * Çalışma zamanı: Her gün 23:59 TSİ (= UTC 20:59)
 * Görev: Siteye girmemiş olsalar bile tüm aktif kullanıcıların
 *        portföy değerini o günkü kapanış fiyatlarına göre hesaplar ve kaydeder.
 *
 * Güvenlik: CRON_SECRET header doğrulaması — Vercel dışından erişim engellenir.
 * İzolasyon: Her kullanıcı için ayrı satır, user_id ile korunur.
 */

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service Role → RLS bypass, sadece server-side
    { auth: { persistSession: false } }
);

async function fetchCurrentPrice(symbol: string): Promise<number | null> {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'https://finalyatirim.com'}/api/finance?symbols=${symbol}`,
            { next: { revalidate: 0 } }
        );
        const json = await res.json();
        const result = json.results?.[0];
        return result?.regularMarketPrice ?? null;
    } catch {
        return null;
    }
}

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

        // Benzersiz sembollerin güncel fiyatlarını çek
        const uniqueSymbols = Array.from(new Set(assets.map((a: any) => a.symbol)));
        const priceMap: Record<string, number> = {};

        for (const symbol of uniqueSymbols) {
            const price = await fetchCurrentPrice(symbol as string);
            if (price !== null) priceMap[symbol as string] = price;
        }

        // Toplam değer ve maliyet hesapla
        let totalValue = 0;
        let totalCost = 0;
        assets.forEach((a: any) => {
            const price = priceMap[a.symbol] ?? Number(a.avg_cost);
            totalValue += price * Number(a.quantity);
            totalCost  += Number(a.avg_cost) * Number(a.quantity);
        });

        const totalProfit = totalValue - totalCost;
        const profitPct   = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
        const assetCount  = uniqueSymbols.length;

        // TSİ bazlı bugünün tarihi
        const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });

        const snapshotData = {
            total_value:  totalValue,
            total_profit: totalProfit,
            total_cost:   totalCost,
            profit_pct:   profitPct,
            asset_count:  assetCount,
            updated_at:   new Date().toISOString()
        };

        // Bugün için zaten kayıt var mı?
        const { data: existing } = await supabaseAdmin
            .from('portfolio_history')
            .select('id')
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
        console.error(`[daily-snapshot] User ${userId} error:`, err);
        return { success: false, value: 0 };
    }
}

export async function GET(req: Request) {
    // Güvenlik: CRON_SECRET doğrulaması
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Portföyü olan tüm kullanıcıları bul (Service Role ile)
        const { data: userRows, error } = await supabaseAdmin
            .from('user_portfolios')
            .select('user_id')
            .limit(500);

        if (error) throw error;

        // Tekrar eden user_id'leri temizle
        const uniqueUserIds = Array.from(new Set((userRows ?? []).map((r: any) => r.user_id)));

        let processed = 0;
        let failed = 0;

        // Her kullanıcı için snapshot al (sıralı — API rate limit koruması)
        for (const userId of uniqueUserIds) {
            const result = await processUser(userId);
            if (result.success) processed++;
            else failed++;

            // Rate limit: her kullanıcı arasında 500ms bekle
            await new Promise(r => setTimeout(r, 500));
        }

        console.log(`[daily-snapshot] Tamamlandı: ${processed} başarılı, ${failed} başarısız`);

        return NextResponse.json({
            success: true,
            message: `Günlük snapshot tamamlandı`,
            processed,
            failed,
            timestamp: new Date().toISOString()
        });
    } catch (err: any) {
        console.error('[daily-snapshot] Cron hatası:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
