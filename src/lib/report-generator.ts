import { GoogleGenerativeAI } from "@google/generative-ai";
import YahooFinance from 'yahoo-finance2';
import { fetchTefasData, TefasFundData, fetchTefasHistory } from './tefas';
import { getAssetSector } from '../data/sectorMapping';
import { scrapeEconomicCalendar } from './calendar-scraper';

const yahooFinance = new YahooFinance();

// Initialize Gemini safely
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface Asset {
    symbol: string;
    amount: number;
    type: 'stock' | 'fund' | 'gold' | 'crypto' | 'currency';
}

export interface AssetPerformance {
    symbol: string;
    name: string;
    currentPrice: number;
    dailyPrice: number;
    lastWeekPrice: number;
    lastMonthPrice: number;
    dailyChangePercent: number;
    weeklyChangePercent: number;
    monthlyChangePercent: number;
    score: number;
    amount: number;
    value: number;
    sector: string;
}

export interface WeeklyReportData {
    portfolioScore: number;
    totalValue: number;
    
    // Performance metrics
    dailyChange: number;
    dailyChangePercent: number;
    weeklyChange: number;
    weeklyChangePercent: number;
    monthlyChange: number;
    monthlyChangePercent: number;
    
    assets: AssetPerformance[];
    aiSummary: string;
    structuredAnalysis?: {
        lookbackSummary: string;
        assetAnalysisTable: { symbol: string; reason: string }[];
        futureOutlook: string;
        economicCalendarSummary?: string;
    };
    marketContext: string;
    economicCalendar: any[];
}

function calculateScore(changePercent: number): number {
    if (changePercent >= 5) return 10;
    if (changePercent >= 3) return 9;
    if (changePercent >= 1) return 8;
    if (changePercent >= 0) return 7;
    if (changePercent >= -1) return 6;
    if (changePercent >= -3) return 5;
    if (changePercent >= -5) return 4;
    return 3;
}

/**
 * Fetches Yahoo Finance pricing for different timeframes (current, yesterday, 7 days ago, 30 days ago).
 */
async function getYahooPricesForTimeframes(symbol: string, type: string): Promise<{ current: number, dailyPrice: number, weeklyPrice: number, monthlyPrice: number }> {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 45); // 45 days to ensure at least 30 trading days

    try {
        let querySymbol = symbol;
        if (type === 'stock' && !symbol.includes('.')) querySymbol += '.IS';

        const result = await yahooFinance.historical(querySymbol, {
            period1: startDate,
            period2: today,
            interval: '1d'
        });

        if (result && result.length > 0) {
            const current = result[result.length - 1].close;
            
            // Daily change (yesterday's close)
            const dailyPrice = result.length >= 2 ? result[result.length - 2].close : current;
            
            // Weekly change (~7 calendar days ago, find closest date)
            let weeklyPrice = current;
            const targetWeeklyDate = new Date();
            targetWeeklyDate.setDate(today.getDate() - 7);
            const weeklyItem = result.find(r => new Date(r.date) >= targetWeeklyDate);
            if (weeklyItem) weeklyPrice = weeklyItem.close;
            else if (result.length >= 6) weeklyPrice = result[result.length - 6].close;

            // Monthly change (~30 calendar days ago, find closest date)
            let monthlyPrice = result[0].close;
            const targetMonthlyDate = new Date();
            targetMonthlyDate.setDate(today.getDate() - 30);
            const monthlyItem = result.find(r => new Date(r.date) >= targetMonthlyDate);
            if (monthlyItem) monthlyPrice = monthlyItem.close;

            return {
                current: current || 0,
                dailyPrice: dailyPrice || current || 0,
                weeklyPrice: weeklyPrice || current || 0,
                monthlyPrice: monthlyPrice || current || 0
            };
        }

        const quote = await yahooFinance.quote(querySymbol);
        const p = quote.regularMarketPrice || 0;
        return { current: p, dailyPrice: p, weeklyPrice: p, monthlyPrice: p };

    } catch (e) {
        console.error(`Yahoo Price fetch failed for ${symbol}:`, e);
        return { current: 0, dailyPrice: 0, weeklyPrice: 0, monthlyPrice: 0 };
    }
}

/**
 * Fetches TEFAS fund pricing for different timeframes.
 */
async function getTefasPricesForTimeframes(symbol: string): Promise<{ current: number, dailyPrice: number, weeklyPrice: number, monthlyPrice: number }> {
    try {
        const history = await fetchTefasHistory(symbol, 2); // Fetch last 2 months of history
        if (history && history.length > 0) {
            const current = history[history.length - 1].price;
            const dailyPrice = history.length >= 2 ? history[history.length - 2].price : current;
            
            const today = new Date();
            
            // Find closest date for 7 days ago
            const weeklyDate = new Date();
            weeklyDate.setDate(today.getDate() - 7);
            const weeklyDateStr = weeklyDate.toISOString().split('T')[0];
            const weeklyItem = history.find(h => h.date >= weeklyDateStr);
            const weeklyPrice = weeklyItem ? weeklyItem.price : (history.length >= 6 ? history[history.length - 6].price : current);

            // Find closest date for 30 days ago
            const monthlyDate = new Date();
            monthlyDate.setDate(today.getDate() - 30);
            const monthlyDateStr = monthlyDate.toISOString().split('T')[0];
            const monthlyItem = history.find(h => h.date >= monthlyDateStr);
            const monthlyPrice = monthlyItem ? monthlyItem.price : history[0].price;

            return {
                current: current || 0,
                dailyPrice: dailyPrice || current || 0,
                weeklyPrice: weeklyPrice || current || 0,
                monthlyPrice: monthlyPrice || current || 0
            };
        }
    } catch (e) {
        console.error(`Tefas History fetch failed for ${symbol}:`, e);
    }
    return { current: 0, dailyPrice: 0, weeklyPrice: 0, monthlyPrice: 0 };
}

export async function generateWeeklyReport(assets: Asset[], days: number = 7): Promise<WeeklyReportData> {
    const today = new Date();
    
    // 1. Fetch prices and calculate daily/weekly/monthly performance per asset
    const performanceData: AssetPerformance[] = [];
    let totalValue = 0;
    let totalYesterdayValue = 0;
    let totalWeeklyOldValue = 0;
    let totalMonthlyOldValue = 0;

    for (const asset of assets) {
        let prices = { current: 0, dailyPrice: 0, weeklyPrice: 0, monthlyPrice: 0 };
        const sector = getAssetSector(asset.symbol);

        try {
            if (asset.type === 'fund' && asset.symbol.length === 3) {
                prices = await getTefasPricesForTimeframes(asset.symbol);
            } else {
                prices = await getYahooPricesForTimeframes(asset.symbol, asset.type);
            }
        } catch (e) {
            console.error(`Price calculation failed for ${asset.symbol}:`, e);
        }

        // Handle fallback if prices are 0
        if (prices.current === 0) prices.current = prices.dailyPrice || prices.weeklyPrice || prices.monthlyPrice || 0;
        if (prices.dailyPrice === 0) prices.dailyPrice = prices.current;
        if (prices.weeklyPrice === 0) prices.weeklyPrice = prices.current;
        if (prices.monthlyPrice === 0) prices.monthlyPrice = prices.current;

        const dailyChangePercent = prices.dailyPrice > 0 ? ((prices.current - prices.dailyPrice) / prices.dailyPrice) * 100 : 0;
        const weeklyChangePercent = prices.weeklyPrice > 0 ? ((prices.current - prices.weeklyPrice) / prices.weeklyPrice) * 100 : 0;
        const monthlyChangePercent = prices.monthlyPrice > 0 ? ((prices.current - prices.monthlyPrice) / prices.monthlyPrice) * 100 : 0;

        const value = prices.current * asset.amount;
        const yesterdayValue = prices.dailyPrice * asset.amount;
        const weeklyOldValue = prices.weeklyPrice * asset.amount;
        const monthlyOldValue = prices.monthlyPrice * asset.amount;

        const score = calculateScore(weeklyChangePercent);

        performanceData.push({
            symbol: asset.symbol,
            name: asset.symbol, // Symbol fallback
            currentPrice: prices.current,
            dailyPrice: prices.dailyPrice,
            lastWeekPrice: prices.weeklyPrice,
            lastMonthPrice: prices.monthlyPrice,
            dailyChangePercent,
            weeklyChangePercent,
            monthlyChangePercent,
            score,
            amount: asset.amount,
            value,
            sector
        });

        totalValue += value;
        totalYesterdayValue += yesterdayValue;
        totalWeeklyOldValue += weeklyOldValue;
        totalMonthlyOldValue += monthlyOldValue;
    }

    // Adjust names using asset-catalog or known maps
    try {
        const { assetCatalog } = await import('./asset-catalog');
        performanceData.forEach(p => {
            const found = assetCatalog.find((c: any) => c.symbol.toUpperCase() === p.symbol.toUpperCase());
            if (found) p.name = found.name;
        });
    } catch (e) {
        console.warn("Asset catalog import failed, using symbols as names");
    }

    // 2. Portfolio Overall Changes
    const dailyChange = totalValue - totalYesterdayValue;
    const dailyChangePercent = totalYesterdayValue > 0 ? (dailyChange / totalYesterdayValue) * 100 : 0;
    
    const weeklyChange = totalValue - totalWeeklyOldValue;
    const weeklyChangePercent = totalWeeklyOldValue > 0 ? (weeklyChange / totalWeeklyOldValue) * 100 : 0;

    const monthlyChange = totalValue - totalMonthlyOldValue;
    const monthlyChangePercent = totalMonthlyOldValue > 0 ? (monthlyChange / totalMonthlyOldValue) * 100 : 0;

    const portfolioScore = calculateScore(weeklyChangePercent);

    // 3. Fetch Economic Calendar (Timing included)
    let calendarEvents: any[] = [];
    try {
        const events = await scrapeEconomicCalendar();
        // Keep events for today and next 5 days
        const todayStr = today.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric' });
        calendarEvents = (events || [])
            .filter(e => e.dateFormatted >= todayStr)
            .slice(0, 10);
    } catch (e) {
        console.error("Failed to fetch economic calendar:", e);
    }

    // 4. Fetch Medium-Scope News (Macro + Geopolitical + Ticker-specific)
    let recentNews: any[] = [];
    try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const newsRes = await fetch(`${appUrl}/api/news?limit=30`, { next: { revalidate: 0 } });
        if (newsRes.ok) {
            const json = await newsRes.json();
            recentNews = json.data || json.news || [];
        }
    } catch (e) {
        console.warn("Failed to fetch news from API, falling back to empty news feed", e.message);
    }

    // Filter news into macro/geopolitical and ticker-specific
    const userTickers = new Set(assets.map(a => a.symbol.toUpperCase().replace('.IS', '')));
    const tickerNews = recentNews.filter(n => 
        n.tickers?.some((t: string) => userTickers.has(t.toUpperCase())) ||
        n.affectedAssets?.some((t: string) => userTickers.has(t.toUpperCase()))
    );

    // Grab important geopolitical or macro news
    const macroKeywords = /(fed|faiz|enflasyon|tcmb|savaş|jeopolitik|iran|israil|gerilim|açıklama|başkan|dolar|petrol)/i;
    const macroNews = recentNews.filter(n => 
        macroKeywords.test(n.title) || macroKeywords.test(n.description)
    ).slice(0, 10);

    // Combine and deduplicate
    const combinedNews = [...tickerNews, ...macroNews].filter((value, index, self) =>
        self.findIndex(v => v.id === value.id) === index
    ).slice(0, 15);

    // 5. AI Causal Analysis with Gemini
    let aiSummary = "";
    let structuredAnalysis: any = null;

    if (genAI && assets.length > 0) {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const assetSummaryText = performanceData.map(p =>
                `- ${p.symbol} (${p.name} - Sektör: ${p.sector}): Günlük: %${p.dailyChangePercent.toFixed(2)}, Haftalık: %${p.weeklyChangePercent.toFixed(2)}, Aylık: %${p.monthlyChangePercent.toFixed(2)}. Fiyat: ${p.currentPrice.toFixed(2)} TL.`
            ).join('\n');

            const newsSummaryText = combinedNews.map(n =>
                `* [${n.source}] ${n.title}: ${n.description?.slice(0, 200)} (İlişkili Varlıklar: ${n.affectedAssets?.join(', ')}, Sentiment: ${n.sentiment})`
            ).join('\n');

            const calendarSummaryText = calendarEvents.map(e =>
                `- Saat: ${e.time}, Tarih: ${e.dateFormatted}, Ülke: ${e.country}, Olay: ${e.event}, Beklenti: ${e.forecast || 'Belirsiz'}, Önceki: ${e.previous || 'Belirsiz'}, Önem: ${e.impact || 'Normal'}`
            ).join('\n');

            const prompt = `
            Sen kıdemli bir Finansal Stratejist ve Makroekonomik Analistsin. 
            Kullanıcıya portföyündeki varlık değişimleri ile dünyadaki haber akışları arasındaki neden-sonuç ilişkilerini (nedensel çıkarım) kuran profesyonel bir rapor hazırlayacaksın.

            PORTFÖY VERİLERİ:
            ${assetSummaryText}
            Genel Değişimler: Günlük: %${dailyChangePercent.toFixed(2)}, Haftalık: %${weeklyChangePercent.toFixed(2)}, Aylık: %${monthlyChangePercent.toFixed(2)}
            Genel Değer: ${totalValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
            Genel Puan: ${portfolioScore}/10

            GÜNCEL FİNANS & JEOPOLİTİK HABERLER (ORTA KAPSAM):
            ${newsSummaryText}

            EKONOMİK TAKVİM:
            ${calendarSummaryText}

            GÖREVLERİN:
            1. **GENEL ÖZET (lookbackSummary):** Portföyün dünden bugüne, haftalık ve aylık gidişatının ve piyasayı etkileyen makro/jeopolitik ana gelişmelerin kısa ve vurucu bir özeti (Maksimum 3-4 cümle).
            2. **NEDEN-SONUÇ ANALİZİ (assetAnalysisTable):** Her bir hissenin/varlığın değişim nedenlerini haberlerle ve sektörel etkilerle bağdaştır. 
               *Önemli Kural:* Kesinlikle "X hissesi düştü çünkü satış geldi" gibi yüzeysel yorumlar yapma! Cümleyi sektörel bağlama oturt. 
               Örnek: "Konut satış faizlerindeki artış beklentisi gayrimenkul talebini azalttığı için portföyünüzdeki EKGYO bu ay negatif etkilendi."
               Örnek: "Ortadoğu'daki jeopolitik gerginliğin tırmanmasıyla Brent petrol fiyatları yükseldi, bu durum ulaştırma maliyet endişeleriyle THYAO hissenizi baskıladı."
            3. **GELECEK SENARYOLARI (futureOutlook):** Gelecek dönemdeki jeopolitik, makroekonomik (FED, TCMB vb.) senaryolara dair somut olasılıklar.
            4. **TAKTAK TAKVİM ÖZETİ (economicCalendarSummary):** Yaklaşan ekonomik takvimdeki kritik verilerin hangi saatte açıklanacağını ve portföy sektörlerini nasıl etkileyebileceğini 2 cümlede özetle.

            YASAL UYARI: SPK kurallarına uy, "yatırım tavsiyesi değildir" sınırlarında kalarak olasılık dili kullan.

            İSTENEN JSON FORMATI (SADECE saf JSON, \`\`\`json etiketleri OLMADAN ver):
            {
                "lookbackSummary": "Gelişmelerin ve genel seyrin özeti.",
                "assetAnalysisTable": [
                    { "symbol": "SEMBOL", "reason": "Sektörel ve makro nedensel analiz açıklaması." }
                ],
                "futureOutlook": "Gelecek dönemdeki makro senaryolar.",
                "economicCalendarSummary": "Saat bazlı takvim ve etki özeti."
            }
            `;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            structuredAnalysis = JSON.parse(cleanJson);
            aiSummary = structuredAnalysis.lookbackSummary;
        } catch (error) {
            console.error("AI Analysis Failed:", error);
            aiSummary = "Piyasalardaki hızlı değişimler nedeniyle detaylı AI analizi geçici olarak üretilemedi, ancak fiyat verileriniz başarıyla güncellendi.";
            structuredAnalysis = {
                lookbackSummary: aiSummary,
                assetAnalysisTable: performanceData.map(p => ({
                    symbol: p.symbol,
                    reason: `${p.sector} sektöründe yer alan varlığınız günlük %${p.dailyChangePercent.toFixed(2)}, haftalık %${p.weeklyChangePercent.toFixed(2)} değişim kaydetmiştir.`
                })),
                futureOutlook: "Takip eden dönemde faiz kararları ve küresel jeopolitik akışlar portföy üzerinde belirleyici olmaya devam edecektir.",
                economicCalendarSummary: "Ekonomik takvimdeki veri saatleri seans içi oynaklığı artırabilir, takvim tablosunu inceleyiniz."
            };
        }
    }

    return {
        portfolioScore,
        totalValue,
        dailyChange,
        dailyChangePercent,
        weeklyChange,
        weeklyChangePercent,
        monthlyChange,
        monthlyChangePercent,
        assets: performanceData,
        aiSummary,
        structuredAnalysis,
        marketContext: "",
        economicCalendar: calendarEvents
    };
}

export function generateEmailHtml(data: WeeklyReportData): string {
    const analysis = data.structuredAnalysis;
    const todayStr = new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', year: 'numeric', month: 'long', day: 'numeric' });

    // Performance format helpers
    const formatChange = (val: number, pct: number) => {
        const isPositive = val >= 0;
        const sign = isPositive ? '+' : '';
        const color = isPositive ? '#10b981' : '#ef4444';
        return `<span style="color: ${color}; font-weight: bold;">${sign}${pct.toFixed(2)}% (${sign}${val.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL)</span>`;
    };

    const formatAssetChange = (pct: number) => {
        if (pct === 0) return `<span style="color: #64748b;">0.00%</span>`;
        const isPositive = pct >= 0;
        const sign = isPositive ? '+' : '';
        const color = isPositive ? '#10b981' : '#ef4444';
        return `<span style="color: ${color}; font-weight: 600;">${sign}${pct.toFixed(2)}%</span>`;
    };

    return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FinAi Finansal Bülten</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.6; background-color: #f8fafc; margin: 0; padding: 0; }
            .wrapper { width: 100%; background-color: #f8fafc; padding: 20px 0; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05); border: 1px solid #e2e8f0; }
            .header { background: #0f172a; padding: 32px 24px; text-align: center; color: #f8fafc; }
            .logo-text { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #3b82f6; margin: 0; }
            .logo-sub { font-size: 13px; color: #94a3b8; margin: 4px 0 0 0; }
            .content { padding: 32px 24px; }
            
            .card-summary { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
            .summary-title { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 700; margin: 0 0 8px 0; letter-spacing: 0.5px; }
            .summary-val { font-size: 28px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; }
            .summary-grid { display: table; width: 100%; margin-top: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
            .summary-col { display: table-cell; width: 33.33%; font-size: 13px; }
            .col-label { color: #64748b; margin-bottom: 4px; font-weight: 500; }
            
            .section-title { font-size: 16px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 16px; margin-top: 32px; text-transform: uppercase; letter-spacing: 0.5px; }
            .ai-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 4px; font-size: 14px; color: #14532d; margin-bottom: 24px; }
            
            .asset-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            .asset-table th { background: #f8fafc; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; font-weight: 700; }
            .asset-table td { padding: 12px 10px; font-size: 13px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
            
            .reason-list { margin-bottom: 24px; padding: 0; list-style: none; }
            .reason-item { background: #fcfdfe; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin-bottom: 12px; }
            .reason-sym { font-weight: 700; color: #0f172a; font-size: 14px; margin-bottom: 4px; display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 2px 6px; border-radius: 4px; }
            .reason-text { font-size: 13.5px; color: #475569; margin: 4px 0 0 0; line-height: 1.5; }
            
            .calendar-item { padding: 10px 0; border-bottom: 1px dashed #e2e8f0; }
            .calendar-time { font-size: 12px; font-weight: 700; color: #1e40af; background: #dbeafe; padding: 2px 6px; border-radius: 4px; }
            .calendar-impact { font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 2px 5px; border-radius: 3px; margin-left: 5px; }
            .impact-high { background: #fee2e2; color: #991b1b; }
            .impact-medium { background: #fef3c7; color: #92400e; }
            .impact-low { background: #f1f5f9; color: #475569; }
            
            .outlook-box { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; border-radius: 4px; font-size: 14px; color: #0c4a6e; }
            
            .footer { padding: 24px; text-align: center; font-size: 11px; color: #94a3b8; background: #f8fafc; border-top: 1px solid #e2e8f0; }
            .footer p { margin: 6px 0; }
            .disclaimer { font-style: italic; color: #cbd5e1; margin-top: 12px !important; }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="container">
                <!-- Header -->
                <div class="header">
                    <p class="logo-text">FinAi Robotum</p>
                    <p class="logo-sub">Yapay Zeka Destekli Portföy ve Makro Bülteni</p>
                    <p style="font-size: 12px; color: #64748b; margin-top: 8px; margin-bottom: 0;">${todayStr}</p>
                </div>
                
                <!-- Content -->
                <div class="content">
                    <!-- Portfolio Snapshot -->
                    <div class="card-summary">
                        <p class="summary-title">Portföy Net Değeri</p>
                        <p class="summary-val">${data.totalValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</p>
                        
                        <div class="summary-grid">
                            <div class="summary-col">
                                <div class="col-label">Günlük Değişim</div>
                                <div>${formatChange(data.dailyChange, data.dailyChangePercent)}</div>
                            </div>
                            <div class="summary-col">
                                <div class="col-label">Haftalık Değişim</div>
                                <div>${formatChange(data.weeklyChange, data.weeklyChangePercent)}</div>
                            </div>
                            <div class="summary-col">
                                <div class="col-label">Aylık Değişim</div>
                                <div>${formatChange(data.monthlyChange, data.monthlyChangePercent)}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- General AI Summary -->
                    <div class="section-title">Piyasa ve Portföy Özeti</div>
                    <div class="ai-box">
                        ${analysis?.lookbackSummary || data.aiSummary || "Portföyünüzün bu dönemdeki performansı hesaplanmıştır."}
                    </div>
                    
                    <!-- Asset Table -->
                    <div class="section-title">Varlık Dağılımı ve Değişimler</div>
                    <table class="asset-table">
                        <thead>
                            <tr>
                                <th>Varlık</th>
                                <th>Sektör</th>
                                <th style="text-align: right;">Günlük</th>
                                <th style="text-align: right;">Haftalık</th>
                                <th style="text-align: right;">Aylık</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.assets.map(a => `
                                <tr>
                                    <td>
                                        <div style="font-weight: 700; color: #0f172a;">${a.symbol}</div>
                                        <div style="font-size: 11px; color: #64748b;">${a.amount} Adet</div>
                                    </td>
                                    <td>
                                        <span style="font-size: 11px; color: #475569; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${a.sector}</span>
                                    </td>
                                    <td style="text-align: right;">${formatAssetChange(a.dailyChangePercent)}</td>
                                    <td style="text-align: right;">${formatAssetChange(a.weeklyChangePercent)}</td>
                                    <td style="text-align: right;">${formatAssetChange(a.monthlyChangePercent)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <!-- Causal Analysis (Why did it change?) -->
                    <div class="section-title">Neden-Sonuç İlişkili Varlık Yorumları</div>
                    <div class="reason-list">
                        ${analysis?.assetAnalysisTable?.map((item: any) => `
                            <div class="reason-item">
                                <span class="reason-sym">${item.symbol}</span>
                                <p class="reason-text">${item.reason}</p>
                            </div>
                        `).join('') || `<p style="font-size: 13px; color: #64748b;">Varlıklarınız için nedensel analiz yükleniyor...</p>`}
                    </div>
                    
                    <!-- Timing Economic Calendar -->
                    ${data.economicCalendar && data.economicCalendar.length > 0 ? `
                        <div class="section-title">Ekonomik Takvim ve Beklenen Veriler</div>
                        <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">${analysis?.economicCalendarSummary || "Önümüzdeki seanslarda açıklanacak kritik makroekonomik veriler ve saatleri:"}</p>
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                            ${data.economicCalendar.map(e => {
                                const impactClass = e.impact?.toLowerCase() === 'high' ? 'impact-high' : (e.impact?.toLowerCase() === 'medium' ? 'impact-medium' : 'impact-low');
                                const impactLabel = e.impact?.toLowerCase() === 'high' ? 'Yüksek' : (e.impact?.toLowerCase() === 'medium' ? 'Orta' : 'Düşük');
                                return `
                                    <div class="calendar-item">
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                            <div>
                                                <span class="calendar-time">${e.time}</span>
                                                <span class="calendar-impact ${impactClass}">${impactLabel} Etki</span>
                                                <strong style="font-size: 12px; color: #475569; margin-left: 6px;">[${e.country}]</strong>
                                            </div>
                                            <span style="font-size: 11px; color: #64748b;">${e.dateFormatted}</span>
                                        </div>
                                        <div style="font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 2px;">${e.event}</div>
                                        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Beklenti: ${e.forecast || 'Açıklanmadı'} | Önceki: ${e.previous || 'Açıklanmadı'}</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : ''}
                    
                    <!-- Future Outlook -->
                    <div class="section-title">Gelecek Senaryoları & Beklentiler</div>
                    <div class="outlook-box">
                        ${analysis?.futureOutlook || "Önümüzdeki dönemde faiz ve jeopolitik gelişmeler portföy seyrini etkilemeye devam edecektir."}
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="footer">
                    <p>© 2026 FinAl Yatırım Teknolojileri. Tüm hakları saklıdır.</p>
                    <p>Bu rapor, portföy ayarlarınız doğrultusunda otomatik olarak üretilmiştir. Ayarlarınızı değiştirmek için <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://finalyatirim.com'}/dashboard/reports" style="color: #3b82f6; text-decoration: none; font-weight: 600;">buraya tıklayabilirsiniz</a>.</p>
                    <p class="disclaimer"><strong>YASAL UYARI:</strong> Burada yer alan yatırım bilgi, yorum ve tavsiyeleri yatırım danışmanlığı kapsamında değildir. Bu rapor sadece bilgilendirme amaçlıdır.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}
