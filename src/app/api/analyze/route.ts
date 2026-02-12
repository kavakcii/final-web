import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import YahooFinance from 'yahoo-finance2';
import { fetchTefasData } from "../../../lib/tefas";

const yahooFinance = new YahooFinance();
// yahooFinance.suppressNotices(['yahooSurvey']);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    try {
        const { assetName, assetContext } = await req.json();

        if (!assetName) {
            return NextResponse.json({ error: "Asset name is required" }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // Auto-detect TEFAS Fund if context is missing
        let enhancedContext = assetContext;
        
        // Check if it looks like a TEFAS code (3 uppercase letters) and no context provided
        if (!enhancedContext && /^[A-Z]{3}$/.test(assetName)) {
            try {
                // Fetch recent TEFAS data to find this fund
                const today = new Date();
                const fundDataList = await fetchTefasData(today);
                const foundFund = fundDataList.find(f => f.FONKODU === assetName);

                if (foundFund) {
                    console.log(`Found TEFAS fund: ${assetName} -> ${foundFund.FONUNVAN}`);
                    enhancedContext = {
                        symbol: assetName,
                        longname: foundFund.FONUNVAN,
                        exchange: "TEFAS",
                        typeDisp: "Yatırım Fonu",
                        // Infer more specific type from name
                        quoteType: foundFund.FONUNVAN.includes("Hisse") ? "EQUITY" : 
                                  foundFund.FONUNVAN.includes("Borçlanma") ? "BOND" : 
                                  foundFund.FONUNVAN.includes("Altın") ? "GOLD" : "MUTUALFUND"
                    };
                }
            } catch (err) {
                console.warn("Failed to auto-fetch TEFAS info:", err);
            }
        }

        // Fetch real-time news
        let newsContext = "";
        try {
            let searchSymbol = enhancedContext?.symbol || assetName;
            
            // If it's a known TEFAS fund (synthetic or explicit), try to find relevant news
            // Searching just "ALC" gives Alcon. Searching "ALC Fon" might be better.
            if (enhancedContext?.exchange === 'TEFAS' || enhancedContext?.isSynthetic) {
                 searchSymbol = `${enhancedContext.symbol} Yatırım Fonu`;
            }

            const newsResult = await yahooFinance.search(searchSymbol, { newsCount: 5 });
            
            if (newsResult.news && newsResult.news.length > 0) {
                const newsItems = newsResult.news.map((n: any) => {
                    const time = n.providerPublishTime ? new Date(n.providerPublishTime * 1000).toLocaleDateString('tr-TR') : 'Güncel';
                    return `- [${time}] ${n.title} (${n.publisher})`;
                }).join('\n');
                
                newsContext = `
                SON DAKİKA GELİŞMELERİ VE HABERLER (Analizini MUTLAKA bu gerçek verilere dayandır):
                ${newsItems}
                
                YUKARIDAKİ HABERLERİ DİKKATE ALARAK GÜNCEL BİR YORUM YAP.
                `;
            }
        } catch (e) {
            console.warn("News fetch failed:", e);
        }

        // Build context string if available
        let contextInfo = "";
        if (enhancedContext) {
            contextInfo = `
            Kullanıcı bu varlığı listeden seçti. Detayları:
            - Sembol: ${enhancedContext.symbol}
            - Tam İsim: ${enhancedContext.longname || enhancedContext.shortname || "Bilinmiyor"}
            - Borsa/Piyasa: ${enhancedContext.exchDisp || enhancedContext.exchange || "Bilinmiyor"}
            - Tip: ${enhancedContext.typeDisp || enhancedContext.quoteType || "Bilinmiyor"}
            
            Lütfen analizi GENEL bir sembol analizi yerine, YUKARIDAKİ TAM İSİM ve DETAYLARA sahip varlığa ÖZEL olarak yap.
            Örneğin eğer bu bir "Elektrikli Araçlar Fonu" ise, içindeki hisseleri (Tesla, BYD vb.) ve sektörü düşün.
            Eğer bir "BIST 30 Hissesi" ise, Türkiye ekonomisi ve şirket bilançosunu düşün.
            `;
        }

        const today = new Date().toLocaleDateString('tr-TR');

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
            "summary": "Varlığın durumunu özetleyen, jargon içermeyen, net sebep-sonuç ilişkisine dayalı 2-3 cümlelik açıklama. (Örn: Faizler düşerse altın değerlenir, aksi halde baskılanır.)",
            "analysis": [
                {
                    "id": 1,
                    "title": "Faktör Başlığı (Örn: Lityum ve Batarya Maliyetleri - IPJ için)",
                    "date": "Zaman Görünümü (Örn: Şubat 2026 Görünümü, 2025 Sonu Beklentisi)",
                    "description": "Faktörün genel açıklaması ve fonun içeriğiyle ilişkisi.",
                    "scenarios": [
                        {
                            "condition": "Olası Senaryo Başlığı (Örn: Faizler Düşerse)",
                            "impact": "Detaylı açıklama (Örn: Elektrikli araç üreticilerinin kar marjı artar, fon pozitif etkilenir).",
                            "sentiment": "positive" | "negative" | "neutral",
                            "assetsAffected": ["İlgili diğer varlıklar", "TSLA", "NIO"]
                        },
                         {
                            "condition": "Olası Senaryo Başlığı (Örn: Faiz İndirimi Ertelenirse)",
                            "impact": "Detaylı açıklama (Örn: Dolar güçlenir ve altın fiyatları bir miktar geri çekilebilir).",
                            "sentiment": "positive" | "negative" | "neutral",
                            "assetsAffected": []
                        }
                    ],
                    "relatedAssets": ["TSLA", "NIO", "LIT"]
                }
            ],
            "topHoldings": [
                 { "symbol": "THYAO", "name": "Türk Hava Yolları", "percent": "%8.5 (Tahmini)" },
                 { "symbol": "KCHOL", "name": "Koç Holding", "percent": "%6.2 (Tahmini)" }
            ]
        }
        
        NOT: "scenarios" dizisi içinde MÜMKÜNSE bir adet "positive" ve bir adet "negative" senaryo üretmeye çalış. Böylece kullanıcı hem iyi hem kötü ihtimali görebilsin.
        NOT: "date" alanı "Ay Yıl Görünümü" formatında olsun (Örn: "Şubat 2026 Görünümü").
        NOT: "summary" alanı çok önemlidir. Finansal okuryazarlığı düşük bir kullanıcı için varlığın neyden etkilendiğini BASİTÇE anlatmalıdır.
        NOT: "topHoldings" alanı eğer bu bir YATIRIM FONU veya ETF ise (Örn: MAC, IPJ, AFT) ve içeriği hakkında bilgin varsa doldur. Eğer bilmiyorsan veya bu bir hisse senedi/emtia ise boş dizi [] bırak.
        
        Kurallar:
        1. Analizler SPK kurallarına uygun, tarafsız ve yatırım tavsiyesi içermeyen bir dille yazılmalı.
        2. "Kesin yükselir/düşer" yerine "olumlu etkilenebilir", "baskı görebilir" gibi ifadeler kullan.
        3. En az 2, en fazla 4 farklı faktör (obje) üret. Mutlaka analiz (analysis) dizisini doldur.
        4. Varlığın tam ismini başlıkta veya açıklamada mutlaka geçir (Örn: "IPJ (Elektrikli Araçlar Fonu) için...").
        5. Türkçe yanıt ver.
        6. Eğer güncel haberler varsa, analizlerinde bu haberlere atıfta bulun (Örn: "Son gelişmelere göre...").
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if present
        let jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        // Attempt to find the first '{' and last '}' to extract the JSON object
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }

        const data = JSON.parse(jsonStr);

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("AI Analysis Error:", error);
        
        // Fallback for demo/error cases if API fails - RETURN MOCK DATA instead of just error
        // This ensures the user always sees the structure they expect, even if the AI service is temporarily unavailable.
        const mockData = {
            summary: "Piyasa verilerine şu an erişilemiyor ancak genel piyasa beklentileri ışığında, mevcut belirsizlik ortamının varlık fiyatlamaları üzerinde baskı oluşturmaya devam etmesi beklenebilir.",
            analysis: [
                {
                    id: 1,
                    title: "Küresel Piyasa Görünümü ve Risk İştahı",
                    date: new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }) + " Görünümü",
                    description: "Küresel piyasalardaki volatilite ve merkez bankalarının faiz politikalarındaki belirsizlik, yatırımcıların risk iştahını etkilemektedir.",
                    scenarios: [
                        {
                            condition: "Piyasa Koşulları İyileşirse",
                            impact: "Risk iştahının artmasıyla birlikte değerlemelerde yukarı yönlü bir ivmelenme görülebilir.",
                            sentiment: "positive",
                            assetsAffected: []
                        },
                        {
                            condition: "Belirsizlik Devam Ederse",
                            impact: "Yatırımcıların güvenli limanlara yönelmesiyle volatilitenin yüksek kalması muhtemeldir.",
                            sentiment: "negative",
                            assetsAffected: []
                        }
                    ],
                    relatedAssets: []
                }
            ],
            topHoldings: []
        };

        return NextResponse.json({ 
            success: true, 
            data: mockData,
            isMock: true
        });
    }
}
