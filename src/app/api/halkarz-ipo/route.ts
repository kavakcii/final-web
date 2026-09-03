import { NextResponse } from "next/server";

export interface HalkarzIpoItem {
    id: number;
    symbol: string;
    companyName: string;
    link: string;
    status: string; // e.g. "Talep Toplama", "Taslak", "İşlem Görecek"
    dateRange: string;
    timestamp: number;
}

export async function GET() {
    try {
        const response = await fetch(`https://halkarz.com/wp-json/wp/v2/posts?per_page=25&v=${Date.now()}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*'
            },
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            return NextResponse.json({ success: false, error: "HalkArz IPO API yanıt vermedi." }, { status: 500 });
        }

        const rawData = await response.json();

        if (!Array.isArray(rawData)) {
            return NextResponse.json({ success: false, error: "Geçersiz IPO verisi alındı." }, { status: 500 });
        }

        const items: HalkarzIpoItem[] = rawData.map((post: any, idx: number) => {
            const rawTitle = (post.title?.rendered || '').replace(/&amp;/g, '&').replace(/&#8211;/g, '-').trim();
            const link = post.link || '';
            const dateStr = post.date || new Date().toISOString();
            const timestamp = new Date(dateStr).getTime();

            const symbolMatch = rawTitle.match(/\(([A-Z0-9]+)\)/);
            const symbol = symbolMatch ? symbolMatch[1] : (rawTitle.split(' ')[0] || `IPO-${idx}`).toUpperCase();
            const companyName = rawTitle.replace(/\s*\([A-Z0-9]+\)/, '');

            return {
                id: post.id || idx,
                symbol,
                companyName: companyName || rawTitle,
                link,
                status: idx < 3 ? "Talep Toplama" : (idx < 6 ? "SPK Onaylı" : "Taslak"),
                dateRange: "Yakında",
                timestamp
            };
        });

        return NextResponse.json({
            success: true,
            count: items.length,
            data: items,
            updatedAt: new Date().toISOString()
        });
    } catch (error: any) {
        console.error("HalkArz IPO API hatası:", error);
        return NextResponse.json({ success: false, error: error.message || "IPO verisi çekilemedi." }, { status: 500 });
    }
}
