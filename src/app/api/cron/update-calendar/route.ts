import { NextRequest, NextResponse } from "next/server";
import { runAdaptiveLiveSync } from "@/lib/calendar-adaptive-engine";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Adaptive Server-Side Otomatik Ekonomik Takvim Senkronizasyon Rotası
 * Yaklaşan olayların saatlerine göre canlı verileri tarar ve Supabase veritabanına işler.
 */
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Güvenlik Doğrulaması
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        const isVercelCron = request.headers.get('x-vercel-cron') === '1';
        if (!isVercelCron) {
            return NextResponse.json({ success: false, error: "Yetkisiz istek" }, { status: 401 });
        }
    }

    try {
        // Adaptive Live Sync Motorunu Çalıştır
        const stats = await runAdaptiveLiveSync();

        return NextResponse.json({
            success: stats.status === 'success' || stats.status === 'concurrency_locked',
            message: "Adaptive Live Sync Engine senkronizasyonu tamamlandı.",
            stats
        });
    } catch (error: any) {
        console.error("[ADAPTIVE CRON SYNC ERROR]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
