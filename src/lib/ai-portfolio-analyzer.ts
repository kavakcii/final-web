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
        Sen kıdemli bir Finansal Stratejist ve Yatırım Dedektifisin. Tarih: ${today}.
        
        GÖREVİN:
        Kullanıcının portföyündeki varlıkları incele ve her bir hareketin (yükseliş/düşüş) altındaki **GERÇEK NEDENİ** bul.
        
        PORTFÖY:
        ${assetSummary}

        ANALİZ KURALLARI (Çok Önemli):
        1. **NEDEN-SONUÇ ZİNCİRİ:** Asla "hisse düştü çünkü satış geldi" deme. Şunu de: "Fed'in faiz kararından sonra küresel risk iştahı azaldı, bu da özellikle teknoloji hisselerini baskıladı ve X hissesinin düşmesine neden oldu."
        2. **MAKRO & MİKRO:** Yorumlarında TCMB kararları, Enflasyon verileri, Bilanço beklentileri, Sektörel haberler (Örn: Havacılık için petrol fiyatları, Bankalar için regülasyonlar) gibi SOMUT verilere atıfta bulun.
        3. **FONLAR:** Fonların (Örn: TTE, IPJ) içeriğini tahmin et (İzahnamesine göre Teknoloji mi, Kıymetli Maden mi?) ve o dayanak varlığın performansına göre analiz yap.
        4. **PUANLAMA (1-10):** Hissenin temeli sağlamsa ama konjonktürden dolayı düştüyse puanını çok kırma (6-7 ver). Şirket kötüyse 1-3 ver.

        İSTENEN ÇIKTI (SADECE JSON):
        {
            "generalMarketOverview": "BIST100, Dolar/TL, Altın ve Küresel piyasalardaki haftalık ana trendlerin özeti. (Sert ve net ol).",
            "portfolioAssessment": "Portföyün risk dağılımı nasıl? Sektörel çeşitlilik var mı? Çok mu riskli? (Eleştirel ol).",
            "assetAnalyses": [
                {
                    "symbol": "ASELS",
                    "score": 9,
                    "trend": "up",
                    "reason": "Artan jeopolitik riskler ve yeni savunma sanayi ihracat anlaşmaları şirketin gelecekteki nakit akışını güçlendirdi.",
                    "impact": "Savunma sanayi endeksindeki pozitif ayrışma, hissenin endeks üstü getiri sağlamasına neden oldu.",
                    "outlook": "Yeni iş anlaşmaları gelmeye devam ederse yükseliş ivmesi korunabilir."
                }
            ],
            "suggestions": [
                "Portföyde enerji sektörü çok ağırlıklı, bunu perakende veya bankacılık ile dengeleyebilirsin.",
                "Altın fonu ekleyerek kur riskini hedge etmeni öneririm."
            ]
        }

        Lütfen yanıtı SADECE saf bir JSON objesi olarak ver. Markdown etiketi ('''json) kullanma.
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanJson) as PortfolioAIAnalysis;
    } catch (error) {
        console.error("AI Portfolio Analysis Error:", error);
        return null;
    }
}

/**
 * Heuristic (kural tabanlı) özetleyici. AI çalışmadığında devreye girer.
 */
function heuristicSummarizer(title: string, description: string): string {
    const cleanDesc = description.replace(/<[^>]*>/g, '').trim();
    const sentences = cleanDesc.split(/[.!?]/).filter(s => s.length > 25);
    
    // Haberin başlığını ve etkilenen varlıkları tahmin etmeye çalış
    let assets = "";
    if (title.toLowerCase().includes("altın")) assets = " [Altın]";
    else if (title.toLowerCase().includes("dolar") || title.toLowerCase().includes("kur")) assets = " [Döviz]";
    else if (title.toLowerCase().includes("hisse") || title.toLowerCase().includes("borsa")) assets = " [Borsa]";

    let finalSummary = `${title}${assets}: `;
    
    if (sentences.length > 0) {
        finalSummary += sentences.slice(0, 2).join('. ') + '.';
    } else {
        finalSummary += "Ekonomi gündemindeki bu kritik gelişme piyasa dinamiklerini ve yatırım araçlarını doğrudan etkileyebilir.";
    }
    
    return finalSummary.length > 300 ? finalSummary.slice(0, 297) + "..." : finalSummary;
}

/**
 * Haber başlığı ve açıklamasını alıp Gemini AI ile 2-4 cümlelik, vurucu bir finansal özet çıkarır.
 */
export async function summarizeNewsWithAI(title: string, description: string): Promise<string> {
    if (!genAI) return heuristicSummarizer(title, description);

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const prompt = `
        Sen profesyonel bir Finansal Analistsin. 
        Aşağıdaki haber başlığını ve içeriğini oku. 
        Kullanıcı için SADECE 2 CÜMLELİK, çok çarpıcı ve profesyonel bir özet yaz.
        
        KURALLAR:
        1. Özet tam olarak 2 cümle olmalı.
        2. Cümlelerden biri mutlaka bu haberin hangi varlıkları (Örn: Altın, Banka Hisseleri, Döviz, Teknoloji Fonları) etkileyebileceğini içermeli.
        3. Dilin keskin, net ve güven verici olsun.
        
        BAŞLIK: ${title}
        İÇERİK: ${description.replace(/<[^>]*>/g, '')}
        
        2 CÜMLELİK ÖZET:
        `;

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error("AI News Summary Error (Falling back to heuristic):", error);
        return heuristicSummarizer(title, description);
    }
}
