import { GoogleGenerativeAI } from "@google/generative-ai";
import YahooFinance from 'yahoo-finance2';
import { fetchTefasData, TefasFundData } from './tefas';

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
    currentPrice: number;
    lastWeekPrice: number;
    changePercent: number;
    score: number;
    amount: number;
    value: number;
}

export interface WeeklyReportData {
    portfolioScore: number;
    totalValue: number;
    weeklyChange: number;
    weeklyChangePercent: number;
    assets: AssetPerformance[];
    aiSummary: string;
    structuredAnalysis?: any;
    marketContext: string;
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

async function getYahooPrice(symbol: string, type: string, lastWeek: Date): Promise<{ current: number, lastWeek: number }> {
    try {
        let querySymbol = symbol;
        if (type === 'stock' && !symbol.includes('.')) querySymbol += '.IS';

        const result = await yahooFinance.historical(querySymbol, {
            period1: lastWeek,
            period2: new Date(),
            interval: '1d'
        });

        if (result.length > 0) {
            const current = result[result.length - 1].close;
            const old = result[0].close;
            return { current, lastWeek: old };
        }

        const quote = await yahooFinance.quote(querySymbol);
        return { current: quote.regularMarketPrice || 0, lastWeek: quote.regularMarketPrice || 0 };

    } catch (e) {
        console.error(`Yahoo Price fetch failed for ${symbol}:`, e);
        return { current: 0, lastWeek: 0 };
    }
}

export async function generateWeeklyReport(assets: Asset[], days: number = 7): Promise<WeeklyReportData> {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - days);

    const dateRangeStr = `${startDate.toLocaleDateString('tr-TR')} - ${today.toLocaleDateString('tr-TR')}`;

    // 1. Optimization: Fetch TEFAS data once if needed
    const hasTefas = assets.some(a => a.type === 'fund' && a.symbol.length === 3);
    let tefasCurrent: TefasFundData[] = [];
    let tefasStart: TefasFundData[] = [];

    if (hasTefas) {
        [tefasCurrent, tefasStart] = await Promise.all([
            fetchTefasData(today),
            fetchTefasData(startDate)
        ]);
    }

    const performanceData: AssetPerformance[] = [];
    let totalValue = 0;
    let totalOldValue = 0;

    // 2. Calculate Performance
    for (const asset of assets) {
        let currentPrice = 0;
        let startPrice = 0;
        let isPriceFound = false;

        try {
            if (asset.type === 'fund' && asset.symbol.length === 3) {
                const currentFund = tefasCurrent.find(f => f.FONKODU === asset.symbol);
                const oldFund = tefasStart.find(f => f.FONKODU === asset.symbol);

                currentPrice = (currentFund?.SONPORTFOYDEGERI && currentFund?.SONPAYADEDI)
                    ? currentFund.SONPORTFOYDEGERI / currentFund.SONPAYADEDI
                    : 0;

                startPrice = (oldFund?.SONPORTFOYDEGERI && oldFund?.SONPAYADEDI)
                    ? oldFund.SONPORTFOYDEGERI / oldFund.SONPAYADEDI
                    : currentPrice;

                if (currentPrice > 0) isPriceFound = true;
            } else {
                const prices = await getYahooPrice(asset.symbol, asset.type, startDate);
                currentPrice = prices.current;
                startPrice = prices.lastWeek;
                if (currentPrice > 0) isPriceFound = true;
            }
        } catch (e) {
            console.error(`Price calculation failed for ${asset.symbol}:`, e);
        }

        const changePercent = (isPriceFound && startPrice > 0) ? ((currentPrice - startPrice) / startPrice) * 100 : 0;
        const score = calculateScore(changePercent);
        const value = currentPrice * asset.amount;
        const oldValue = startPrice * asset.amount;

        performanceData.push({
            symbol: asset.symbol,
            currentPrice: currentPrice || 0,
            lastWeekPrice: startPrice || 0,
            changePercent,
            score,
            amount: asset.amount,
            value
        });

        totalValue += value;
        totalOldValue += oldValue;
    }

    // 3. Portfolio Summary
    const portfolioChange = totalOldValue > 0 ? ((totalValue - totalOldValue) / totalOldValue) * 100 : 0;
    const portfolioScore = calculateScore(portfolioChange);

    // 4. AI Analysis - Lookback + Outlook (User's Final Requirement)
    let aiSummary = "";
    let structuredAnalysis: any = null;

    if (genAI) {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

            const assetSummary = performanceData.map(p =>
                `- ${p.symbol}: %${p.changePercent.toFixed(2)} değişim. (Önceki: ${p.lastWeekPrice.toFixed(2)} -> Şimdi: ${p.currentPrice.toFixed(2)})`
            ).join('\n');

            const prompt = `
            Sen profesyonel bir Finansal Analist ve Yatırım Uzmanısın. 
            Kullanıcıya özel portföy raporu hazırlayacaksın.

            GÖREVİN 2 BÖLÜMDEN OLUŞUR:
            
            BÖLÜM 1 (GEÇMİŞE BAKIŞ):
            Aşağıdaki varlık listesini incele. Bu dönemde (son ${days} gün) portföyde ne yaşandığını ve bu değişimlerin arkasındaki temel nedenleri (Haberler, ekonomik veriler, sektörel gelişmeler) tabloya uygun, az ve öz bir dille açıkla.
            
            BÖLÜM 2 (GELECEK SENARYOLARI):
            Gelecek rapor dönemine kadar (önümüzdeki ${days} gün) piyasalarda yaşanabilecek OLASI SENARYOLARI yaz. 
            Özellikle FED faiz kararı, TCMB toplantısı, büyük şirket bilançoları gibi haberleri/olayları göz önüne al.
            Örn: "23'ünde FED faiz açıklaması var. Çıkacak karar portföyünüzdeki teknoloji hisselerini X yönde etkileyebilir."

            DİKKAT: 
            - SPK kurallarına uy. Yatırım tavsiyesi verme. OLASILIK ve SENARYO odaklı konuş.
            - Az ama öz yaz, kullanıcının gözünü yorma.
            
            VERİLER:
            ${assetSummary}
            Genel Değişim: %${portfolioChange.toFixed(2)}
            Genel Puan: ${portfolioScore}/10

            İSTENEN JSON FORMATI:
            {
                "lookbackSummary": "Dönem içinde portföyde ne yaşandığına dair genel özet.",
                "assetAnalysisTable": [
                    { "symbol": "SEMBOL", "reason": "Değişimin ana nedeni (Kısa)" }
                ],
                "futureOutlook": "Gelecek dönemdeki büyük toplantılar, FED vb. olaylar ve tahmini senaryolar."
            }
            `;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            structuredAnalysis = JSON.parse(cleanJson);
            aiSummary = structuredAnalysis.lookbackSummary;
        } catch (error) {
            console.error("AI Analysis Failed:", error);
            aiSummary = "Hava durumu: Puslu. Analiz şu an yapılamıyor.";
        }
    }

    return {
        portfolioScore,
        totalValue,
        weeklyChange: totalValue - totalOldValue,
        weeklyChangePercent: portfolioChange,
        assets: performanceData,
        aiSummary,
        structuredAnalysis,
        marketContext: ""
    };
}

export function generateEmailHtml(data: WeeklyReportData): string {
    const analysis = data.structuredAnalysis;

    return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; line-height: 1.6; background-color: #f1f5f9; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header { background: #0f172a; padding: 30px; text-align: center; color: #f8fafc; }
            .content { padding: 30px; }
            .section-title { font-size: 18px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px; margin-top: 24px; }
            .summary-text { font-size: 14px; color: #475569; margin-bottom: 20px; }
            .asset-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .asset-table th { background: #f8fafc; text-align: left; padding: 12px; font-size: 12px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; }
            .asset-table td { padding: 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
            .outlook-card { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; border-radius: 4px; font-size: 14px; color: #0369a1; }
            .footer { padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; background: #f8fafc; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2 style="margin:0;">FinAI Robotum: Portföy Raporu</h2>
                <p style="margin:5px 0 0; opacity:0.7; font-size:13px;">Kişiselleştirilmiş Yatırım Analizi</p>
            </div>
            
            <div class="content">
                <div class="section-title">Dönemlik Bakış</div>
                <div class="summary-text">${analysis?.lookbackSummary || "Portföy genel seyri analiz edildi."}</div>

                <div class="section-title">Varlık Bazlı Analiz</div>
                <table class="asset-table">
                    <thead>
                        <tr>
                            <th style="width: 80px;">Varlık</th>
                            <th>Neden / Açıklama</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${analysis?.assetAnalysisTable?.map((item: any) => `
                            <tr>
                                <td style="font-weight:700; color:#0f172a;">${item.symbol}</td>
                                <td style="color:#334155;">${item.reason}</td>
                            </tr>
                        `).join('') || `<tr><td colspan="2">Varlık analizi hazırlanıyor...</td></tr>`}
                    </tbody>
                </table>

                <div class="section-title">Gelecek Senaryoları & Önemli Olaylar</div>
                <div class="outlook-card">
                    ${analysis?.futureOutlook || "Önümüzdeki dönem için kritik bir gelişme henüz girilmedi."}
                </div>
            </div>

            <div class="footer">
                <p>© 2026 FinAl. Bu rapor bilgilendirme amaçlıdır.</p>
                <p><strong>YASAL UYARI:</strong> Burada yer alan yatırım bilgi, yorum ve tavsiyeleri yatırım danışmanlığı kapsamında değildir.</p>
            </div>
        </div>
    </body>
    </html>
    `;
}
