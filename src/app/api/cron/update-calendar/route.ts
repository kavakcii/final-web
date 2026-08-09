import { NextResponse } from "next/server";
import { scrapeEconomicCalendar } from "@/lib/calendar-scraper";

export const dynamic = "force-dynamic";

/**
 * Nokta Atışı Tam Haber Saati & Otomatik Takvim Güncelleme Cron Rotası
 * Haber saati geldiğinde (10:00, 11:30, 14:00, 15:30, 17:30 TSİ)
 * canlı verileri kazıyıp açıklanan rakamları sisteme kaydeder.
 */
export async function GET(request: Request) {
    try {
        const events = await scrapeEconomicCalendar();
        const now = new Date();

        return NextResponse.json({
            success: true,
            message: `Nokta atışı haber saati güncellemesi tamamlandı.`,
            timestamp: now.toISOString(),
            eventCount: events.length
        });
    } catch (error: any) {
        console.error("[EVENT CRON ERROR]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
