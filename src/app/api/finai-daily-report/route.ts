import { NextRequest, NextResponse } from 'next/server';
import { generateFinAiReport } from '@/lib/finai-report-service';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get('userId') || undefined;
        const report = await generateFinAiReport(userId);
        return NextResponse.json({ success: true, data: report });
    } catch (error: any) {
        console.error("FinAi report route error:", error);
        return NextResponse.json({ success: false, error: "Rapor üretilemedi" }, { status: 500 });
    }
}
