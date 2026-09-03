import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOrFetchCachedPrices } from '@/lib/server-price-cache';

/**
 * Günlük Portföy Snapshot Cron Job V2
 * Çalışma zamanı: Her gün 23:59 TSİ (= UTC 20:59)
 * Görev: Kullanıcılar siteye girmemiş olsalar bile tüm aktif kullanıcıların
 *        portföy değerini, nakit dengesini, dış sermaye hareketini ve
 *        sermayeden arındırılmış günlük net yatırım getirisini (TWR) kaydeder.
 */

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service Role → RLS bypass, sadece server-side
    { auth: { persistSession: false } }
);

async function processUser(userId: string): Promise<{ success: boolean; value: number; userId: string; error?: string }> {
    try {
        // 1. Kullanıcının aktif portföy varlıklarını çek
        const { data: assets, error: assetsError } = await supabaseAdmin
            .from('user_portfolios')
            .select('symbol, quantity, avg_cost, asset_type')
            .eq('user_id', userId);

        if (assetsError || !assets) {
            return { success: false, value: 0, userId, error: assetsError?.message || 'No assets found' };
        }

        // 2. Nakit ve Piyasa Varlıklarını Ayrıştır
        const cashAssets = assets.filter(a => (a.symbol === 'NAKİT' && a.asset_type === 'CASH') || a.symbol === 'TRY_CASH');
        const nonCashAssets = assets.filter(a => !((a.symbol === 'NAKİT' && a.asset_type === 'CASH') || a.symbol === 'TRY_CASH'));

        const cashValue = cashAssets.reduce((sum, a) => sum + (Number(a.quantity || 0) * (Number(a.avg_cost) || 1)), 0);

        // Canlı piyasa fiyatlarını çek (Sunucu önbellek kasası ile)
        const uniqueSymbols = Array.from(new Set(nonCashAssets.map((a: any) => (a.symbol || '').toUpperCase())));
        const priceMap = await getOrFetchCachedPrices(uniqueSymbols);

        let investedValue = 0;
        let totalCost = 0;

        nonCashAssets.forEach((a: any) => {
            const qty = Number(a.quantity || 0);
            if (qty <= 0) return;
            const symUpper = (a.symbol || '').toUpperCase();
            const symClean = symUpper.replace(/\.IS$/, '');
            const price = priceMap[symUpper] ?? priceMap[symClean] ?? priceMap[`${symClean}.IS`] ?? Number(a.avg_cost || 0);

            investedValue += price * qty;
            totalCost += Number(a.avg_cost || 0) * qty;
        });

        const totalValue = investedValue + cashValue;
        const unrealizedPnl = investedValue - totalCost;
        const assetCount = nonCashAssets.filter(a => Number(a.quantity || 0) > 0).length;

        // 3. Birikimli Realized PnL Hesapla
        const { data: txPnlData } = await supabaseAdmin
            .from('portfolio_transactions')
            .select('realized_pnl')
            .eq('user_id', userId)
            .not('realized_pnl', 'is', null);

        const realizedPnl = (txPnlData || []).reduce((sum, t) => sum + Number(t.realized_pnl || 0), 0);

        // 4. TSİ bazlı bugünün tarihi (YYYY-MM-DD)
        const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });
        const todayStartISO = new Date(`${todayStr}T00:00:00+03:00`).toISOString();
        const todayEndISO = new Date(`${todayStr}T23:59:59+03:00`).toISOString();

        // 5. O Günlük Dış Sermaye Hareketini (External Cash Flow) Hesapla
        // Formül: CASH_DEPOSIT + OPENING_BALANCE - CASH_WITHDRAW (BUY ve SELL hariçtir)
        const { data: todayTxs } = await supabaseAdmin
            .from('portfolio_transactions')
            .select('transaction_type, net_amount, gross_amount, quantity')
            .eq('user_id', userId)
            .gte('transaction_date', todayStartISO)
            .lte('transaction_date', todayEndISO);

        let externalCashFlow = 0;
        (todayTxs || []).forEach(tx => {
            const amt = Number(tx.net_amount || tx.gross_amount || tx.quantity || 0);
            if (tx.transaction_type === 'CASH_DEPOSIT' || tx.transaction_type === 'OPENING_BALANCE') {
                externalCashFlow += amt;
            } else if (tx.transaction_type === 'CASH_WITHDRAW') {
                externalCashFlow -= amt;
            }
        });

        // 6. Önceki Günün Snapshot Kaydını Çek ve Sermayeden Arındırılmış Günlük Net Getiriyi (TWR) Hesapla
        const { data: prevSnapshot } = await supabaseAdmin
            .from('portfolio_history')
            .select('total_value')
            .eq('user_id', userId)
            .lt('snapshot_date', todayStr)
            .order('snapshot_date', { ascending: false })
            .limit(1)
            .maybeSingle();

        let dailyReturnPct: number | null = null;
        if (prevSnapshot && Number(prevSnapshot.total_value || 0) > 0) {
            const prevVal = Number(prevSnapshot.total_value);
            const adjustedCurrentVal = totalValue - externalCashFlow;
            dailyReturnPct = Number((((adjustedCurrentVal - prevVal) / prevVal) * 100).toFixed(4));
        }

        // 7. V2 Snapshot Verisini UPSERT (UNIQUE: user_id, snapshot_date) ile Kaydet
        const snapshotData = {
            user_id: userId,
            snapshot_date: todayStr,
            total_value: Number(totalValue.toFixed(4)),
            cash_value: Number(cashValue.toFixed(4)),
            invested_value: Number(investedValue.toFixed(4)),
            total_cost: Number(totalCost.toFixed(4)),
            realized_pnl: Number(realizedPnl.toFixed(4)),
            unrealized_pnl: Number(unrealizedPnl.toFixed(4)),
            external_cash_flow: Number(externalCashFlow.toFixed(4)),
            daily_return_pct: dailyReturnPct,
            asset_count: assetCount,
            updated_at: new Date().toISOString()
        };

        const { error: upsertError } = await supabaseAdmin
            .from('portfolio_history')
            .upsert(snapshotData, { onConflict: 'user_id, snapshot_date' });

        if (upsertError) {
            console.error(`Snapshot upsert error for user ${userId}:`, upsertError.message);
            return { success: false, value: totalValue, userId, error: upsertError.message };
        }

        return { success: true, value: totalValue, userId };
    } catch (err: any) {
        console.error(`Snapshot failed for user ${userId}:`, err?.message || err);
        return { success: false, value: 0, userId, error: err?.message || 'Unknown error' };
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
            results: results.map(r => ({ userId: r.userId, success: r.success, value: r.value, error: r.error })),
            timestamp: new Date().toISOString()
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

