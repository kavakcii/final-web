import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOrFetchCachedPrices } from '@/lib/server-price-cache';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || undefined;

        // 1. Portföy geçmişini çek
        let query = supabaseAdmin.from('portfolio_history').select('*').order('snapshot_date', { ascending: true });
        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data: history, error: histError } = await query;
        if (histError || !history || history.length === 0) {
            return NextResponse.json({ success: false, message: 'Geçmiş bulunamadı' });
        }

        const repairedIds: string[] = [];

        // 2. Her kullanıcı için anomalileri saptayıp onar
        const userHistMap = new Map<string, any[]>();
        history.forEach((h: any) => {
            const list = userHistMap.get(h.user_id) || [];
            list.push(h);
            userHistMap.set(h.user_id, list);
        });

        for (const [uId, uHist] of Array.from(userHistMap.entries())) {
            // Kullanıcının varlıklarını çek
            const { data: assets } = await supabaseAdmin
                .from('user_portfolios')
                .select('symbol, quantity, avg_cost')
                .eq('user_id', uId);

            if (!assets || assets.length === 0) continue;

            const uniqueSymbols = Array.from(new Set(assets.map((a: any) => (a.symbol || '').toUpperCase())));
            const priceMap = await getOrFetchCachedPrices(uniqueSymbols);

            let realCurrentTotal = 0;
            let realTotalCost = 0;
            assets.forEach((a: any) => {
                const symUpper = (a.symbol || '').toUpperCase();
                const symClean = symUpper.replace(/\.IS$/, '');
                const price = priceMap[symUpper] ?? priceMap[symClean] ?? priceMap[`${symClean}.IS`] ?? Number(a.avg_cost || 0);

                realCurrentTotal += price * Number(a.quantity);
                realTotalCost += Number(a.avg_cost) * Number(a.quantity);
            });

            // Geçmiş verilerde ortalamadan %25'ten fazla sapan veya geçici çöken kayıtları düzelt
            for (let i = 0; i < uHist.length; i++) {
                const item = uHist[i];
                const prevItem = uHist[i - 1];
                const nextItem = uHist[i + 1];

                const currentVal = Number(item.total_value || 0);

                // Eğer tek günlük geçici çöküş varsa (örn: 340k -> 130k -> 340k)
                let isAnomaly = false;
                if (prevItem && nextItem) {
                    const prevVal = Number(prevItem.total_value || 0);
                    const nextVal = Number(nextItem.total_value || 0);
                    if (prevVal > 0 && nextVal > 0 && currentVal < (prevVal * 0.6) && nextVal > (currentVal * 1.3)) {
                        isAnomaly = true;
                    }
                } else if (realCurrentTotal > 0 && currentVal < (realCurrentTotal * 0.5)) {
                    isAnomaly = true;
                }

                if (isAnomaly) {
                    const targetVal = prevItem ? Number(prevItem.total_value) : realCurrentTotal;
                    const profit = targetVal - realTotalCost;
                    const profitPct = realTotalCost > 0 ? (profit / realTotalCost) * 100 : 0;

                    await supabaseAdmin
                        .from('portfolio_history')
                        .update({
                            total_value: targetVal,
                            total_profit: profit,
                            total_cost: realTotalCost,
                            profit_pct: profitPct,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', item.id);

                    repairedIds.push(item.id);
                }
            }
        }

        return NextResponse.json({
            success: true,
            repairedCount: repairedIds.length,
            repairedIds,
            message: `${repairedIds.length} adet hatalı/anomalili snapshot kaydı düzeltildi.`
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
