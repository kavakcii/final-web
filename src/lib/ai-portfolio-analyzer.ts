
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface DetailedAssetAnalysis {
    symbol: string;
    score: number;
    reason: string;      // Neden arttı/azaldı? Tamamen nedensel açıklama.
    trend: 'up' | 'down' | 'neutral';
    impact: string;      // Piyasa etkisi ve neden-sonuç (Örn: Faiz artışı -> Banka hissesi düşüşü)
    outlook: string;     // Gelecek hafta için somut beklenti
}

export interface PortfolioAIAnalysis {
    generalMarketOverview: string;
    portfolioAssessment: string; // Portföyün risk/getiri dengesi ve genel durumu
    assetAnalyses: DetailedAssetAnalysis[];
    suggestions: string[]; // Aksiyon odaklı öneriler
}

/**
 * Portföy verilerini alıp Gemini AI ile detaylı, neden-sonuç ilişkili analiz yapar.
 */
export async function analyzePortfolioWithAI(assets: { symbol: string, changePercent: number, type: string }[]): Promise<PortfolioAIAnalysis | null> {
    if (!genAI) {
        console.warn("GEMINI_API_KEY eksik");
        return null;
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const today = new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });

        // Varlıkları özetle
        const assetSummary = assets.map(a =>
            `- ${a.symbol} (${a.type === 'fund' ? 'Yatırım Fonu' : 'Hisse Senedi'}): %${a.changePercent.toFixed(2)} haftalık değişim`
        ).join('\n');

        const prompt = `
        Sen dünyanın en iyi finansal analisti ve portföy yöneticisisin. Tarih: ${today}.
        
        GÖREVİN:
        Aşağıdaki portföydeki varlıkları tek tek incele ve neden yükselip düştüklerini **neden-sonuç ilişkisi** kurarak açıkla.
        Sadece "yükseldi" deme, "neden" yükseldiğini finansal, sektörel veya makroekonomik sebeplerle ilişkilendir.
        
        PORTFÖY:
        ${assetSummary}

        KURALLAR:
        1. **Neden-Sonuç İlişkisi Şart:** Her analizde mutlaka "X olduğu için Y oldu" yapısını kullan. (Örn: "Merkez Bankası'nın faiz kararı beklentisiyle bankacılık endeksi baskılandı, bu yüzden AKBNK düştü.")
        2. **Puanlama:** 1 ile 10 arasında hisseye puan ver. (1: Çok Kötü, 10: Mükemmel). Puanı sadece değişime göre değil, şirketin/fonun potansiyeline göre ver.
        3. **Fon Analizi:** Eğer varlık bir FON ise (örn: IPJ, TTE), fonun içeriğini (Teknoloji, Altın, Eurobond vb.) tahmin et ve o sektörün durumuna göre yorum yap.
        4. **Samimi ve Profesyonel:** Kullanıcıya doğrudan hitap et.

        İSTENEN ÇIKTI (JSON FORMATINDA):
        {
            "generalMarketOverview": "BIST100, Altın ve Dolar piyasalarının güncel durumu ve haftalık özeti.",
            "portfolioAssessment": "Portföyün çeşitliliği, risk seviyesi ve genel performansı hakkında eleştirel yorum.",
            "assetAnalyses": [
                {
                    "symbol": "THYAO",
                    "score": 8,
                    "trend": "up",
                    "reason": "Petrol fiyatlarındaki düşüş havacılık maliyetlerini azalttığı için kârlılık beklentisi arttı.",
                    "impact": "Turizm sezonunun açılmasıyla yolcu sayısındaki artış beklentisi hisseyi yukarı taşıdı.",
                    "outlook": "Petrol fiyatları yatay seyrederse yükseliş trendi korunabilir."
                }
            ],
            "suggestions": [
                "Enerji sektörü riskli görünüyor, savunma sanayine ağırlık verilebilir.",
                "Portföyde altın oranı artırılarak risk dağıtılabilir."
            ]
        }

        Lütfen yanıtı SADECE saf bir JSON objesi olarak ver. Markdown etiketi ('''json) kullanma.
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // JSON temizleme
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanJson) as PortfolioAIAnalysis;

    } catch (error) {
        console.error("AI Portfolio Analysis Error:", error);
        return null;
    }
}
