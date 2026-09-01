import { NextRequest, NextResponse } from "next/server";
import { scrapeEconomicCalendar } from "@/lib/calendar-scraper";
import { CalendarDbService } from "@/lib/calendar-db-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Server-Side Otomatik Ekonomik Takvim Senkronizasyon Rotası
 * Her Pazar 21:00 TSİ (18:00 UTC) Vercel Cron tarafından veya yetkili istekle tetiklenir.
 */
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Eğer CRON_SECRET ortam değişkeni tanımlıysa güvenlik kontrolü yap
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        // Vercel Cron dahili x-vercel-cron başlığı da kontrol edilir
        const isVercelCron = request.headers.get('x-vercel-cron') === '1';
        if (!isVercelCron) {
            return NextResponse.json({ success: false, error: "Yetkisiz istek" }, { status: 401 });
        }
    }

    try {
        // 1. Canlı ve dinamik kataloğu kazı / çek
        const events = await scrapeEconomicCalendar();

        if (!events || events.length === 0) {
            // Hata Yönetimi: Boş array geldiğinde veritabanını silmeyip uyarı döndür
            console.warn("[CRON SYNC WARNING] Scraper returned empty events array. Skipping DB overwrite.");
            return NextResponse.json({
                success: false,
                message: "Kaynak API boş veri döndürdü, veritabanı korundu.",
                eventCount: 0
            }, { status: 200 });
        }

        // 2. Supabase Veritabanına Idempotent Senkronize Et
        const stats = await CalendarDbService.syncCalendarData(events);

        return NextResponse.json({
            success: true,
            message: "Ekonomik takvim otomatik senkronizasyonu tamamlandı.",
            stats
        });
    } catch (error: any) {
        console.error("[CRON SYNC ERROR]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
