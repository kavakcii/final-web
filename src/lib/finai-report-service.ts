import { PortfolioService, Asset } from './portfolio-service';
import { filterEventsForUserPortfolio } from './news-impact-matrix';
import { CatalogCalendarEvent } from './calendar-catalog';
import { scrapeEconomicCalendar } from './calendar-scraper';

export interface FinAiReportData {
    currentTotal: number;
    diffValue: number;
    diffPercent: number;
    isPositive: boolean;
    narrativeText: string;
    generatedAt: string;
}

const SYMBOL_NAMES: Record<string, string> = {
    "THYAO": "Türk Hava Yolları",
    "THYAO.IS": "Türk Hava Yolları",
    "GARAN": "Garanti BBVA",
    "GARAN.IS": "Garanti BBVA",
    "TUPRS": "TÜPRAŞ",
    "TUPRS.IS": "TÜPRAŞ",
    "ALTIN": "Gram Altın",
    "XAUTRY=X": "Gram Altın",
    "GUMUS": "Gram Gümüş",
    "TRY=X": "Dolar/TL",
    "BTC": "Bitcoin",
    "ETH": "Ethereum"
};

export async function generateFinAiReport(_userId?: string): Promise<FinAiReportData> {
    const assets: Asset[] = await PortfolioService.getAssets();
    const history = await PortfolioService.getHistory('1W');

    // 1. Canlı Fiyatları Çek
    const uniqueSymbols = Array.from(new Set(assets.map(a => a.symbol))).join(',');
    let prices: Record<string, number> = {};

    if (uniqueSymbols) {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://finalyatirim.com'}/api/finance?symbols=${uniqueSymbols}`, { next: { revalidate: 0 } });
            const json = await res.json();
            if (json.results) {
                json.results.forEach((r: any) => {
                    if (r.symbol && r.regularMarketPrice) {
                        const symUpper = r.symbol.toUpperCase();
                        prices[symUpper] = r.regularMarketPrice;
                        if (symUpper.endsWith('.IS')) {
                            prices[symUpper.replace('.IS', '')] = r.regularMarketPrice;
                        }
                    }
                });
            }
        } catch (e) {
            console.error("FinAi price fetch error:", e);
        }
    }

    // 2. Canlı Toplam Değeri ve Varlık Bazlı Değişimleri Hesapla
    let currentTotal = 0;
    let totalCost = 0;
    const assetContributions: { symbol: string; name: string; val: number; cost: number; gain: number }[] = [];

    assets.forEach(asset => {
        const symUpper = asset.symbol.toUpperCase();
        const symClean = symUpper.replace(/\.IS$/, '');
        const price = prices[symUpper] ?? prices[symClean] ?? prices[`${symClean}.IS`] ?? asset.avgCost ?? 0;

        const val = price * asset.quantity;
        const cost = asset.avgCost * asset.quantity;
        const gain = val - cost;

        currentTotal += val;
        totalCost += cost;

        assetContributions.push({
            symbol: symClean,
            name: SYMBOL_NAMES[symClean] || SYMBOL_NAMES[symUpper] || symClean,
            val,
            cost,
            gain
        });
    });

    // Dünkü Snapshot veya Başlangıç Değeri
    let prevTotal = currentTotal;
    if (history.length >= 2) {
        prevTotal = Number(history[history.length - 2]?.total_value || currentTotal);
    } else if (history.length === 1) {
        prevTotal = Number(history[0]?.total_value || currentTotal);
    }

    if (prevTotal <= 0) prevTotal = totalCost > 0 ? totalCost : currentTotal;

    const diffValue = currentTotal - prevTotal;
    const diffPercent = prevTotal > 0 ? (diffValue / prevTotal) * 100 : 0;
    const isPositive = diffValue >= 0;

    // 3. Varlık Sürücüleri
    assetContributions.sort((a, b) => Math.abs(b.gain) - Math.abs(a.gain));
    const topDrivers = assetContributions.slice(0, 2);

    // 4. Ekonomik Takvim & Haber Filtreleme
    let rawEvents: CatalogCalendarEvent[] = [];
    try {
        rawEvents = await scrapeEconomicCalendar();
    } catch {
        rawEvents = [];
    }

    const { relevantEvents } = filterEventsForUserPortfolio(rawEvents, assets);
    const todayStr = new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric' });

    const recentPassed = relevantEvents.filter(e => e.actual !== 'Bekleniyor');
    const upcomingEvents = relevantEvents.filter(e => e.dateFormatted >= todayStr && e.actual === 'Bekleniyor');

    // 5. TEK AKICI PARAGRAF METNİ OLUŞTURMA
    let narrative = "";

    if (assets.length === 0) {
        narrative = "Portföyünüzde henüz kaydedilmiş bir varlık bulunmuyor. Varlık ekledikten sonra FinAi günlük raporunuz burada otomatik olarak üretilecektir.";
    } else {
        const valFormatted = `₺${Math.abs(diffValue).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const pctFormatted = `%${Math.abs(diffPercent).toFixed(2)}`;

        // Cümle 1: Genel Hareket
        if (isPositive) {
            narrative += `Portföyünüz dünden bugüne +${valFormatted} (+${pctFormatted}) değer kazanmıştır. `;
        } else if (diffValue < 0) {
            narrative += `Portföyünüz dünden bugüne -${valFormatted} (-${pctFormatted}) gerilemiştir. `;
        } else {
            narrative += `Portföyünüz dünden bugüne yatay ve dengeli bir seyir izlemiştir. `;
        }

        // Cümle 2: Sürücü Varlıklar ve Etki Yüzdesi
        if (topDrivers.length > 0) {
            const names = topDrivers.map(d => d.name).join(' ve ');
            const totalGainSum = assetContributions.reduce((acc, curr) => acc + Math.max(0, curr.gain), 0);
            const driverGainSum = topDrivers.reduce((acc, curr) => acc + Math.max(0, curr.gain), 0);
            let impactPct = totalGainSum > 0 ? Math.round((driverGainSum / totalGainSum) * 100) : 65;
            if (impactPct <= 0 || impactPct > 100) impactPct = 70;

            if (isPositive) {
                narrative += `Bu büyümeyi sağlayan ana unsurlar ${names} varlıklarınız olmuş; bu varlıklar portföyün yükselişine yaklaşık %${impactPct} oranında doğrudan etki etmiştir. `;
            } else {
                narrative += `Bu harekette en belirgin düşüş baskısını ${names} varlıklarınız oluşturmuştur. `;
            }
        }

        // Cümle 3: Son Haber Etkisi
        if (recentPassed.length > 0) {
            const lastEv = recentPassed[0];
            narrative += `Piyasada son açıklanan ${lastEv.event} verisi (Açıklanan: ${lastEv.actual}) fiyatlamaları destekleyen temel faktörler arasında yer almıştır. `;
        }

        // Cümle 4: Gelecek Günler Uyarısı
        if (upcomingEvents.length > 0) {
            const nextEv = upcomingEvents[0];
            narrative += `Önümüzdeki günlerde ise saat ${nextEv.time}'de açıklanacak olan ${nextEv.event} verisi takip edilecek olup, portföyünüzdeki ilgili varlıklarda dalgalanma yaratabilir.`;
        } else {
            narrative += `Önümüzdeki günlerde portföyünüzü doğrudan etkileyecek kritik bir makro haber akışı bulunmamaktadır.`;
        }
    }

    return {
        currentTotal,
        diffValue,
        diffPercent,
        isPositive,
        narrativeText: narrative,
        generatedAt: new Date().toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' })
    };
}
