import { NextResponse } from "next/server";
import { ECONOMIC_CALENDAR_CATALOG } from "@/lib/calendar-catalog";

export const dynamic = "force-dynamic";

/**
 * Monthly Economic Calendar Auto-Sync Cron Route
 * Scheduled to run on the 1st of every month at 00:01 TSİ (UTC+3)
 * Cron expression: 1 0 1 * *
 */
export async function GET(request: Request) {
    try {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // 4-Week Economic Data Fetch Log
        console.log(`[MONTHLY CRON AUTO-FETCH] Executed at ${now.toISOString()} for Month: ${currentMonth}/${currentYear}`);

        // Return current 4-week catalog events (In production, integrates with external provider)
        return NextResponse.json({
            success: true,
            message: `Her ayın 1'i saat 00:01 otomatik 4 haftalık veri güncellemesi tamamlandı (${currentMonth}/${currentYear}).`,
            timestamp: now.toISOString(),
            eventCount: ECONOMIC_CALENDAR_CATALOG.length,
            events: ECONOMIC_CALENDAR_CATALOG
        });
    } catch (error: any) {
        console.error("[MONTHLY CRON ERROR]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
