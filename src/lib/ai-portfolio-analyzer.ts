
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface DetailedAssetAnalysis {
    symbol: string;
    score: number;
    reason: string;      // Neden arttı/azaldı? (Temel analiz)
    trend: 'up' | 'down' | 'neutral';
    impact: string;      // Neden-Sonuç ilişkisi (Örn: Faiz kararı sonrası bankalar yükseldi)
    outlook: string;     // Kısa vadeli beklenti
}

export interface PortfolioAIAnalysis {
    generalMarketOverview: string;
    portfolioAssessment: string; // Genel portföy yorumu
    assetAnalyses: DetailedAssetAnalysis[];
    suggestions: string[]; // Kullanıcıya öneriler
}

/**
 * Portföy verilerini alıp Gemini AI ile detaylı analiz yapar.
 * JSON formatında yapılandırılmış veri döner.
 */
export async function analyzePortfolioWithAI(assets: { symbol: string, changePercent: number, type: string }[]): Promise<PortfolioAIAnalysis | null> {
    if (!genAI) {
        console.warn("GEMINI_API_KEY eksik");
        return null;
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // Varlıkları özetle
        const assetSummary = assets.map(a =>
            `- ${a.symbol} (${a.type}): %${a.changePercent.toFixed(2)} değişim`
        ).join('\n');

        const prompt = `
        Sen uzman bir finansal analistsin. Aşağıdaki portföy verilerini analiz et ve yapılandırılmış JSON formatında bir rapor oluştur.
        
        PORTFÖY VARLIKLARI:
        ${assetSummary}

        GÖREVLER:
        1. "generalMarketOverview": Piyasanın genel durumu hakkında kısa bir paragraf (BIST, Altın, Döviz genel trendi).
        2. "assetAnalyses": Her bir varlık için detaylı analiz:
           - "symbol": Varlık sembolü.
           - "score": 1-10 arası performans puanı.
           - "reason": Neden yükseldi veya düştü? (Haberler, bilanço, teknik durum vb. tahmini nedenler).
           - "trend": "up", "down" veya "neutral".
           - "impact": Neden-sonuç ilişkisi (Örn: "X haberi nedeniyle Y sektörü etkilendi").
           - "outlook": Önümüzdeki hafta için kısa beklenti.
        3. "portfolioAssessment": Portföyün genel sağlık durumu ve çeşitliliği hakkında kısa yorum.
        4. "suggestions": Portföyü iyileştirmek için 2-3 kısa öneri.

        Lütfen yanıtı SADECE geçerli bir JSON objesi olarak ver. Markdown formatı kullanma.
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // JSON temizleme (bazen markdown ```json ... ``` içinde gelebilir)
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanJson) as PortfolioAIAnalysis;

    } catch (error) {
        console.error("AI Portfolio Analysis Error:", error);
        return null;
    }
}
