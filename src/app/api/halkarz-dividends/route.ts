import { NextResponse } from "next/server";

export interface HalkarzDividendItem {
    symbol: string;
    companyName: string;
    link: string;
    netAmountPerShare: number;
    netAmountFormatted: string;
    yieldPercent: number;
    paymentDate: string;
    timestamp: number;
}

export async function GET() {
    try {
        const response = await fetch(`https://halkarz.com/wp-content/themes/halkarz/api/temettu.php?v=${Date.now()}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*'
            },
            next: { revalidate: 3600 } // Günlük / saatlik otomatik güncelleme (1 saat önbellek)
        });

        if (!response.ok) {
            return NextResponse.json({ success: false, error: "HalkArz API yanıt vermedi." }, { status: 500 });
        }

        const rawData = await response.json();
        
        if (!Array.isArray(rawData)) {
            return NextResponse.json({ success: false, error: "Geçersiz verisi alındı." }, { status: 500 });
        }

        const items: HalkarzDividendItem[] = rawData.map((item: any) => {
            const rawNet = item.t_temt_net ? String(item.t_temt_net).replace(',', '.') : '0';
            const netAmount = parseFloat(rawNet) || 0;
            const yieldVal = parseFloat(item.t_yuzde) || 0;
            
            // Tarih ayrıştırma (Örn: "13.08.2026")
            let timestamp = Date.now();
            if (item.t_tarih && item.t_tarih.includes('.')) {
                const parts = item.t_tarih.split('.');
                if (parts.length === 3) {
                    const parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                    if (!isNaN(parsedDate.getTime())) {
                        timestamp = parsedDate.getTime();
                    }
                }
            }

            return {
                symbol: (item.t_bistkod || '').toUpperCase().trim(),
                companyName: item.t_sirket || '',
                link: item.t_link || '',
                netAmountPerShare: netAmount,
                netAmountFormatted: `${netAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ₺`,
                yieldPercent: yieldVal,
                paymentDate: item.t_tarih || '',
                timestamp
            };
        });

        // En yakından uzağa sıralama
        items.sort((a, b) => a.timestamp - b.timestamp);

        return NextResponse.json({
            success: true,
            count: items.length,
            data: items,
            updatedAt: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("HalkArz temettü API hatası:", error);
        return NextResponse.json({ success: false, error: error.message || "Veri çekilemedi." }, { status: 500 });
    }
}
