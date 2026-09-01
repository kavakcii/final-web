import { NextRequest, NextResponse } from "next/server";
import { processNotificationEngine } from "@/lib/notification-engine";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Web Push Notification Processing Cron Endpoint
 * Scheduled via Vercel Cron or called after live calendar updates.
 */
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        const isVercelCron = request.headers.get('x-vercel-cron') === '1';
        if (!isVercelCron) {
            return NextResponse.json({ success: false, error: "Yetkisiz istek" }, { status: 401 });
        }
    }

    try {
        const stats = await processNotificationEngine();

        return NextResponse.json({
            success: true,
            message: "Notification Engine taraması tamamlandı.",
            stats
        });
    } catch (error: any) {
        console.error("[PROCESS NOTIFICATIONS CRON ERROR]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
