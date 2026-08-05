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

    // 5. TEK AKICI PARAGRAF METNİ OLUŞTURMA (30 GÜNLÜK ROTASYON ŞABLONU İLE)
    let narrative = "";

    if (assets.length === 0) {
        narrative = "Portföyünüzde henüz kaydedilmiş bir varlık bulunmuyor. Varlık ekledikten sonra FinAi günlük raporunuz burada otomatik olarak üretilecektir.";
    } else {
        const groupedMap = new Map<string, { symbol: string; name: string; gain: number }>();
        assetContributions.forEach(c => {
            const key = c.name || c.symbol;
            if (groupedMap.has(key)) {
                groupedMap.get(key)!.gain += c.gain;
            } else {
                groupedMap.set(key, { ...c });
            }
        });

        const groupedContributions = Array.from(groupedMap.values());
        groupedContributions.sort((a, b) => Math.abs(b.gain) - Math.abs(a.gain));
        const topDrivers = groupedContributions.slice(0, 2);

        const names = topDrivers.map(d => d.name).join(' ve ');
        const totalGainSum = groupedContributions.reduce((acc, curr) => acc + Math.max(0, curr.gain), 0);
        const driverGainSum = topDrivers.reduce((acc, curr) => acc + Math.max(0, curr.gain), 0);
        let impactPct = totalGainSum > 0 ? Math.round((driverGainSum / totalGainSum) * 100) : 70;
        if (impactPct <= 0 || impactPct > 100) impactPct = 70;

        let recentText = "";
        if (recentPassed.length > 0) {
            const lastEv = recentPassed[0];
            recentText = `Piyasada son açıklanan ${lastEv.event} verisi (Açıklanan: ${lastEv.actual}) fiyatlamaları destekleyen temel faktörler arasında yer almıştır.`;
        }

        let upcomingText = "";
        if (upcomingEvents.length > 0) {
            const nextEv = upcomingEvents[0];
            upcomingText = `Önümüzdeki günlerde ise saat ${nextEv.time}'de açıklanacak olan ${nextEv.event} verisi takip edilecek olup, portföyünüzdeki ilgili varlıklarda dalgalanma yaratabilir.`;
        }

        const { getRotatedDailyNarrative } = await import('./finai-templates');
        narrative = getRotatedDailyNarrative({
            diffValue: Math.abs(diffValue),
            diffPercent: Math.abs(diffPercent),
            isPositive,
            topDriversNames: names || 'ana varlıklarınız',
            impactPct,
            recentNewsText: recentText,
            upcomingNewsText: upcomingText
        });
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
