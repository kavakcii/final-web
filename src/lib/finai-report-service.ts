import { PortfolioService, Asset } from './portfolio-service';
import { filterEventsForUserPortfolio } from './news-impact-matrix';
import { CatalogCalendarEvent } from './calendar-catalog';
import { scrapeEconomicCalendar } from './calendar-scraper';

export interface AssetDriver {
    symbol: string;
    name?: string;
    contributionVal: number;
    contributionPct: number;
    isPositive: boolean;
}

export interface UpcomingImpactEvent {
    id?: string;
    dateFormatted: string;
    time: string;
    country: string;
    flag: string;
    event: string;
    impact: 'low' | 'medium' | 'high' | 'critical';
    impactNote: string;
}

export interface FinAiReportData {
    mood: 'bullish' | 'neutral' | 'volatile';
    moodLabel: string;
    moodBadgeColor: string;
    dayChange: {
        currentTotal: number;
        diffValue: number;
        diffPercent: number;
        isPositive: boolean;
    };
    driversSummary: string;
    topDrivers: AssetDriver[];
    newsImpactSummary: string;
    upcomingEvents: UpcomingImpactEvent[];
    hasRelevantUpcomingEvents: boolean;
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
    const assetContributions: { symbol: string; val: number; cost: number; gain: number }[] = [];

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

    // 3. Varlık Sürücüleri (Top Contributors)
    assetContributions.sort((a, b) => Math.abs(b.gain) - Math.abs(a.gain));
    const topDrivers: AssetDriver[] = assetContributions.slice(0, 3).map(a => ({
        symbol: a.symbol,
        name: SYMBOL_NAMES[a.symbol] || a.symbol,
        contributionVal: a.gain,
        contributionPct: a.cost > 0 ? (a.gain / a.cost) * 100 : 0,
        isPositive: a.gain >= 0
    }));

    // 4. Sürücüler Özeti Metni
    let driversSummary = "";
    if (assets.length === 0) {
        driversSummary = "Henüz portföyünüzde kayıtlı varlık bulunmuyor.";
    } else if (topDrivers.length > 0) {
        const topOne = topDrivers[0];
        const stateWord = isPositive ? "kazancın" : "kaybın";
        driversSummary = `Portföyünüz dünden bugüne ${isPositive ? '+' : ''}₺${Math.abs(diffValue).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (${isPositive ? '+' : ''}%${diffPercent.toFixed(2)}) ${isPositive ? 'değer kazandı' : 'değer kaybetti'}. Bu harekette en belirgin etkiyi ${topOne.name || topOne.symbol} sağladı.`;
    }

    // 5. Ekonomik Takvim Çek & YALNIZCA İlişkili Haberleri Filtrele
    let rawEvents: CatalogCalendarEvent[] = [];
    try {
        rawEvents = await scrapeEconomicCalendar();
    } catch {
        rawEvents = [];
    }

    const { relevantEvents, impactNotes } = filterEventsForUserPortfolio(rawEvents, assets);

    // Gelecek İlişkili Haberler
    const todayStr = new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric' });
    const upcomingEvents: UpcomingImpactEvent[] = relevantEvents
        .filter(e => e.dateFormatted >= todayStr && e.actual === 'Bekleniyor')
        .slice(0, 3)
        .map(e => ({
            id: e.id,
            dateFormatted: e.dateFormatted,
            time: e.time,
            country: e.country,
            flag: e.flag,
            event: e.event,
            impact: e.impact,
            impactNote: impactNotes[e.id || ''] || 'Bu makro veri portföyünüzdeki varlıkları etkileyebilir.'
        }));

    // 6. Haber Etkisi Özeti
    const recentPassedEvents = relevantEvents.filter(e => e.actual !== 'Bekleniyor');
    let newsImpactSummary = "";

    if (recentPassedEvents.length > 0) {
        const lastEv = recentPassedEvents[0];
        newsImpactSummary = `Piyasada son açıklanan "${lastEv.event}" verisi (Açıklanan: ${lastEv.actual}) sonrasındaki fiyatlamalar portföyünüze doğrudan yansıdı.`;
    } else {
        newsImpactSummary = "Piyasalarda portföyünüzü doğrudan etkileyen yüksek volatilite yaratıcı yeni haber bulunmuyor. Fiyatlamalar dengeli seyrediyor.";
    }

    // 7. Mood Tespiti
    let mood: 'bullish' | 'neutral' | 'volatile' = 'neutral';
    let moodLabel = '🛡️ Dengeli Seyir';
    let moodBadgeColor = 'bg-blue-50 text-blue-700 border-blue-200';

    if (upcomingEvents.some(e => e.impact === 'critical' || e.impact === 'high')) {
        mood = 'volatile';
        moodLabel = '⚠️ Volatilite Uyarısı';
        moodBadgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (diffPercent >= 0.75) {
        mood = 'bullish';
        moodLabel = '🚀 Yükseliş Trendi';
        moodBadgeColor = 'bg-[#00008B] text-white border-[#00008B]';
    }

    return {
        mood,
        moodLabel,
        moodBadgeColor,
        dayChange: {
            currentTotal,
            diffValue,
            diffPercent,
            isPositive
        },
        driversSummary,
        topDrivers,
        newsImpactSummary,
        upcomingEvents,
        hasRelevantUpcomingEvents: upcomingEvents.length > 0,
        generatedAt: new Date().toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' })
    };
}
