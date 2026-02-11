import { NextResponse } from 'next/server';
import { generateWeeklyReport, generateEmailHtml, Asset } from '@/lib/report-generator';

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        
        let assets: Asset[] = body.assets;

        // Mock data if no assets provided (for testing purposes)
        if (!assets || assets.length === 0) {
            assets = [
                { symbol: 'IPJ', type: 'fund', amount: 1000 },
                { symbol: 'TCD', type: 'fund', amount: 500 },
                { symbol: 'THYAO', type: 'stock', amount: 100 },
                { symbol: 'XAU', type: 'gold', amount: 10 }
            ];
        }

        const reportData = await generateWeeklyReport(assets);
        const html = generateEmailHtml(reportData);

        // In a real scenario, we would send the email here.
        // For now, we return the HTML and data so the frontend can display it or we can verify it.
        
        return NextResponse.json({
            success: true,
            data: reportData,
            htmlPreview: html
        });

    } catch (error) {
        console.error("Weekly Report Generation Error:", error);
        return NextResponse.json({ success: false, error: "Rapor oluşturulamadı." }, { status: 500 });
    }
}
