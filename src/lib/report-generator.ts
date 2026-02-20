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

    // 4. Structured AI Analysis
    let aiSummary = "Yapay zeka analizi şu anda hazır değil.";
    let structuredAnalysis: any = null;

    if (genAI) {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

            const assetSummary = performanceData.map(p =>
                `- ${p.symbol}: %${p.changePercent.toFixed(2)} değişim. (${startDate.toLocaleDateString('tr-TR')} Fiyatı: ${p.lastWeekPrice.toFixed(2)} -> Bugün: ${p.currentPrice.toFixed(2)})`
            ).join('\n');

            const prompt = `
            Sen kıdemli bir Finansal Stratejist ve Yatırım Dedektifisin. 
            ANALİZ DÖNEMİ: ${dateRangeStr} (${days} GÜNLÜK ARALIK)

            GÖREVİN:
            Kullanıcının portföyündeki her bir varlık için bu ${days} günlük periyodu özel olarak analiz et.
            
            ADIM 1 (GEÇMİŞ ANALİZİ): 
            Her varlık için ${startDate.toLocaleDateString('tr-TR')} tarihinden bu yana gerçekleşen değişimin GERÇEK nedenini bul. "Neden düştü?" veya "Neden yükseldi?" sorularına makro (FED, enflasyon, faiz) veya mikro (şirket haberi, fon içeriği) verilerle kesin cevap ver.
            
            ADIM 2 (GELECEK İHTİMALLERİ): 
            Önümüzdeki ${days} günlük yeni aralık için ihtimalleri değerlendir. "Şu olursa yükseliş sürer, şu veriye dikkat edilmeli" şeklinde olasılık bazlı gelecek projeksiyonu çiz.

            PORTFÖY DURUMU:
            - Toplam Değer: ${totalValue.toFixed(2)} TL
            - Dönemlik Değişim: %${portfolioChange.toFixed(2)}
            - Genel Puan: ${portfolioScore}/10
            
            VARLIKLAR:
            ${assetSummary}
            
            İSTENEN ÇIKTI (SADECE JSON FORMATINDA):
            {
                "marketOverview": "Bu ${days} günlük dönemde genel piyasa trendleri özeti.",
                "portfolioAssessment": "Portföyün genel performansı ve risk dengesi yorumu.",
                "assetAnalyses": [
                    {
                        "symbol": "Sembol",
                        "reason": "${startDate.toLocaleDateString('tr-TR')} tarihinden bugüne bu varlığın hareketinin ANA NEDENİ nedir? (Detaylı analiz)",
                        "outlook": "Önümüzdeki ${days} günlük periyot için olasılıklar ve ihtimaller.",
                        "score": 1-10 puan
                    }
                ]
            }

            SADECE saf JSON objesi olarak cevap ver. Markdown etiketi ('''json) kullanma. Türkçe yaz.
            `;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            structuredAnalysis = JSON.parse(cleanJson);
            aiSummary = structuredAnalysis.portfolioAssessment;
        } catch (error) {
            console.error("AI Analysis Failed:", error);
            aiSummary = "Yapay zeka analizi şu anda yapılamıyor.";
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
        marketContext: `${dateRangeStr} dönemi analiz edildi.`
    };
}

export function generateEmailHtml(data: WeeklyReportData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.6; background-color: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 32px 24px; text-align: center; color: white; }
            .header h2 { margin: 0; font-size: 24px; font-weight: 700; }
            .header p { margin: 8px 0 0; color: #94a3b8; font-size: 14px; }
            
            .content { padding: 32px 24px; }
            
            .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
            .stat-card { background: #f8fafc; padding: 16px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0; }
            .stat-label { font-size: 12px; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
            .stat-value { font-size: 24px; font-weight: 800; margin-top: 4px; color: #0f172a; }
            
            .score-badge { display: inline-block; padding: 6px 12px; border-radius: 9999px; font-size: 14px; font-weight: 700; color: white; }
            
            .ai-insight { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin-bottom: 32px; }
            .ai-insight h3 { margin: 0 0 12px; color: #1e40af; font-size: 16px; display: flex; items-align: center; gap: 8px; }
            .ai-text { font-size: 14px; color: #1e3a8a; white-space: pre-line; }
            
            .asset-table { width: 100%; border-collapse: collapse; font-size: 14px; }
            .asset-table th { text-align: left; padding: 12px; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
            .asset-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155; }
            .asset-table tr:last-child td { border-bottom: none; }
            
            .footer { background: #f1f5f9; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
            
            .text-green { color: #16a34a; }
            .text-red { color: #dc2626; }
            .bg-green { background-color: #16a34a; }
            .bg-yellow { background-color: #ca8a04; }
            .bg-red { background-color: #dc2626; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>FinAi Haftalık Bülten</h2>
                <p>Yapay Zeka Destekli Portföy Analizi</p>
            </div>

            <div class="content">
                <div class="stats-grid" style="display: flex; gap: 10px;">
                    <div class="stat-card" style="flex: 1;">
                        <div class="stat-label">Genel Puan</div>
                        <div class="stat-value" style="color: #3b82f6;">${data.portfolioScore}/10</div>
                    </div>
                    <div class="stat-card" style="flex: 1;">
                        <div class="stat-label">Haftalık Değişim</div>
                        <div class="stat-value ${data.weeklyChangePercent >= 0 ? 'text-green' : 'text-red'}">
                            ${data.weeklyChangePercent > 0 ? '+' : ''}%${data.weeklyChangePercent.toFixed(2)}
                        </div>
                    </div>
                </div>

                <div class="ai-insight">
                    <h3>✨ Yapay Zeka Özeti</h3>
                    <div class="ai-text">${data.aiSummary}</div>
                </div>

                <h3 style="margin-bottom: 16px; color: #0f172a;">Varlık Performansları</h3>
                <table class="asset-table">
                    <thead>
                        <tr>
                            <th>Varlık</th>
                            <th style="text-align: right;">Değişim</th>
                            <th style="text-align: right;">Puan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.assets.map(asset => `
                            <tr>
                                <td style="font-weight: 600;">${asset.symbol}</td>
                                <td style="text-align: right;" class="${asset.changePercent >= 0 ? 'text-green' : 'text-red'}">
                                    ${asset.changePercent > 0 ? '+' : ''}%${asset.changePercent.toFixed(2)}
                                </td>
                                <td style="text-align: right;">
                                    <span class="score-badge ${asset.score >= 7 ? 'bg-green' : asset.score >= 5 ? 'bg-yellow' : 'bg-red'}" 
                                          style="padding: 4px 8px; font-size: 12px;">
                                        ${asset.score}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="footer">
                <p>© 2026 FinAi — Yapay Zeka ile Akıllı Yatırım</p>
                <p>Bu rapor bilgilendirme amaçlıdır, yatırım tavsiyesi değildir.</p>
            </div>
        </div>
    </body>
    </html>
    `;
}
