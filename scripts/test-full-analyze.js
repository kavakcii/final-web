const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyA0vVOu9ke1GvzHFfSUNiEFl-tZ36Xmd8k";
const genAI = new GoogleGenerativeAI(API_KEY);

async function testFullAnalyze() {
    console.log("Testing full analysis logic...");
    
    const assetName = "ALC";
    const today = new Date().toLocaleDateString('tr-TR');
    
    // Mocking the context info and news for the test
    const contextInfo = `
    Kullanıcı bu varlığı listeden seçti. Detayları:
    - Sembol: ALC
    - Tam İsim: Albaraka Portföy Katılım Fonu (Örnek)
    - Borsa/Piyasa: TEFAS
    - Tip: MUTUALFUND
    `;
    
    const newsContext = ""; // Empty for now to simplify

    const prompt = `
    Sen uzman bir finansal analistsin. Kullanıcının girdiği varlık (${assetName}) için detaylı bir analiz yapman gerekiyor.
    
    BUGÜNÜN TARİHİ: ${today} (Analizlerini bu tarihe göre yap, eski yılları "geçmiş" olarak değerlendir).
    
    ${contextInfo}

    ${newsContext}

    ÖNEMLİ: Eğer kullanıcı 3-4 harfli bir kod girdiyse (Örn: IPJ, ALC, TCD, AFT) ve yukarıda detay verilmediyse, bunun bir "TEFAS Yatırım Fonu" veya "Borsa İstanbul Hisse Senedi" olduğunu varsay.
    1. Önce bu kodun hangi fona veya şirkete ait olduğunu tespit et. (Örn: IPJ -> İş Portföy Elektrikli Araçlar Karma Fon, ALC -> Albaraka Portföy Katılım Fonu vb.)
    2. Sonra bu fonun/şirketin yatırım yaptığı sektörü veya temayı (Örn: Elektrikli Araçlar, Teknoloji, Altın, Bankacılık) baz alarak faktör analizi yap.
    
    Bu varlığı etkileyen ana faktörleri (Örn: Sektörel gelişmeler, Döviz kurları, Mevsimsellik, Makroekonomik veriler, Faiz kararları vb.) belirle.
    
    Her bir faktör için aşağıdaki JSON formatında bir çıktı üret. Sadece saf JSON döndür, markdown veya ek açıklama kullanma.
    
    İstenen JSON Yapısı:
    {
        "summary": "Varlığın durumunu özetleyen, jargon içermeyen, net sebep-sonuç ilişkisine dayalı 2-3 cümlelik açıklama.",
        "analysis": [
            {
                "id": 1,
                "title": "Faktör Başlığı",
                "date": "Zaman Görünümü",
                "description": "Faktörün genel açıklaması.",
                "scenarios": [
                    {
                        "condition": "Olası Senaryo Başlığı",
                        "impact": "Detaylı açıklama.",
                        "sentiment": "positive" | "negative" | "neutral",
                        "assetsAffected": []
                    }
                ],
                "relatedAssets": []
            }
        ],
        "topHoldings": []
    }
    `;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log("Raw Response:", text);
        
        let jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }

        const data = JSON.parse(jsonStr);
        console.log("Parsed JSON Success!");
        console.log(JSON.stringify(data, null, 2));

    } catch (error) {
        console.error("Error during full analysis:", error);
    }
}

testFullAnalyze();
