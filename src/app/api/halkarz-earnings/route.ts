import { NextResponse } from "next/server";

export interface HalkarzEarningsItem {
    symbol: string;
    companyName: string;
    link: string;
    earningsDate: string;
    timestamp: number;
    daysLeft: number;
}

export async function GET() {
    try {
        const response = await fetch(`https://halkarz.com/wp-content/themes/halkarz/api/bilanco.php?v=${Date.now()}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*'
            },
            next: { revalidate: 3600 } // 1 saat önbellek
        });

        if (!response.ok) {
            return NextResponse.json({ success: false, error: "HalkArz Bilanço API yanıt vermedi." }, { status: 500 });
        }

        const rawData = await response.json();
        
        if (!Array.isArray(rawData)) {
            return NextResponse.json({ success: false, error: "Geçersiz bilanço verisi alındı." }, { status: 500 });
        }

        const uniqueItemsMap = new Map<string, HalkarzEarningsItem>();

        rawData.forEach((item: any) => {
            const symbol = (item.b_bistkod || '').toUpperCase().trim();
            if (!symbol) return;

            const rawDate = item.b_tarih || '';
            const key = `${symbol}_${rawDate}`;

            if (!uniqueItemsMap.has(key)) {
                let timestamp = Date.now();
                let daysLeft = 0;

                if (rawDate && rawDate.includes('.')) {
                    const parts = rawDate.split('.');
                    if (parts.length === 3) {
                        const parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                        if (!isNaN(parsedDate.getTime())) {
                            timestamp = parsedDate.getTime();
                            daysLeft = Math.ceil((timestamp - Date.now()) / (1000 * 60 * 60 * 24));
                        }
                    }
                }

                uniqueItemsMap.set(key, {
                    symbol,
                    companyName: item.b_sirket || '',
                    link: item.b_link || '',
                    earningsDate: rawDate,
                    timestamp,
                    daysLeft
                });
            }
        });

        const items = Array.from(uniqueItemsMap.values());

        // En yakından uzağa sıralama
        items.sort((a, b) => a.timestamp - b.timestamp);

        return NextResponse.json({
            success: true,
            count: items.length,
            data: items,
            updatedAt: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("HalkArz Bilanço API hatası:", error);
        return NextResponse.json({ success: false, error: error.message || "Bilanço verisi çekilemedi." }, { status: 500 });
    }
}
