import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Zeki Kural Motoru (Deterministik Fallback)
function generateFallbackPortfolio(answers: any) {
  const isIslamic = answers[12]?.text?.includes("Evet") || false;
  const age_or_period = answers[8]?.text || ""; // Vade (kısa, orta, uzun)
  const risk_score = Object.values(answers).reduce((acc: number, curr: any) => acc + (curr.score || 0), 0) as number;
  
  let profileName = "Optimum Denge";
  let portfolio = [];
  let aiAnalysis = "";

  if (risk_score <= 14) {
    profileName = "Defansif Stratejist";
    if (isIslamic) {
        aiAnalysis = "Riskten kaçınan ve sermayesini korumak isteyen yapınızı analiz ettim. İslami finans prensiplerinize uygun olarak, düşük dalgalanmalı ve güvenli limanlardan oluşan bir portföy hazırladım.";
        portfolio = [
            { asset: "Kamu/Özel Sektör Kira Sertifikaları (Sukuk)", percentage: 50, color: "#00008B", description: "Düşük riskli, faizsiz sabit getiri alternatifi" },
            { asset: "Kıymetli Madenler (Altın/Gümüş)", percentage: 30, color: "#10B981", description: "Enflasyona karşı koruma" },
            { asset: "Katılım Havuzu (Nakit)", percentage: 20, color: "#3B82F6", description: "Anlık fırsatlar için likidite" }
        ];
    } else {
        aiAnalysis = "Sermaye korumasına ve düşük dalgalanmaya önem verdiğinizi analiz ettim. Bu doğrultuda riskin minimumda tutulduğu, güvenli limanlara odaklanan defansif bir dağılım hazırladım.";
        portfolio = [
            { asset: "Para Piyasası Fonları", percentage: 50, color: "#00008B", description: "Mevduat eşdeğeri risksiz getiri" },
            { asset: "Altın ve Kıymetli Madenler", percentage: 30, color: "#10B981", description: "Küresel risklere karşı sigorta" },
            { asset: "Kısa Vadeli Borçlanma Araçları", percentage: 20, color: "#3B82F6", description: "Sabit getirili enstrümanlar" }
        ];
    }
  } else if (risk_score >= 15 && risk_score <= 21) {
    profileName = "Optimum Denge";
    if (isIslamic) {
        aiAnalysis = "Hem büyüme fırsatlarını yakalamak hem de riskleri dengelemek istediğinizi görüyorum. İslami finans prensipleriniz doğrultusunda, faizsiz büyüme potansiyeli sunan dengeli bir reçete oluşturdum.";
        portfolio = [
            { asset: "Katılım Hisse Senedi Fonları", percentage: 40, color: "#00008B", description: "Faizsiz kazanç sağlayan şirketler" },
            { asset: "Kira Sertifikaları (Sukuk)", percentage: 30, color: "#3B82F6", description: "Dengeli getiri" },
            { asset: "Kıymetli Madenler", percentage: 30, color: "#10B981", description: "Risk dağılımı" }
        ];
    } else {
        aiAnalysis = "Risk ve getiri arasında kurduğunuz mantıksal dengeyi analiz ettim. Hem sermaye büyümesi hem de enflasyon üstü getiri hedefleyen, optimum bir varlık dağılımı hazırladım.";
        portfolio = [
            { asset: "Yerli Hisse Senedi Fonları", percentage: 40, color: "#00008B", description: "Büyüme odaklı yatırımlar" },
            { asset: "Eurobond / Yabancı Borçlanma", percentage: 30, color: "#3B82F6", description: "Döviz bazlı getiri" },
            { asset: "Altın Fonları", percentage: 30, color: "#10B981", description: "Dengeleyici varlık" }
        ];
    }
  } else {
    profileName = "Alfa Odaklı";
    if (isIslamic) {
        aiAnalysis = "Piyasa ortalamasının üzerinde getiri aradığınızı ve uzun vadeli vizyonunuzu analiz ettim. İslami hassasiyetinize uygun, tamamen büyüme ve yüksek teknoloji odaklı atak bir portföy tasarladım.";
        portfolio = [
            { asset: "Katılım Endeksi Hisse Fonları", percentage: 60, color: "#00008B", description: "Agresif büyüme potansiyeli" },
            { asset: "Yabancı Katılım Fonları", percentage: 30, color: "#3B82F6", description: "Küresel helal fırsatlar" },
            { asset: "Kıymetli Madenler", percentage: 10, color: "#10B981", description: "Minimum koruma" }
        ];
    } else {
        aiAnalysis = "Yüksek getiri iştahınızı ve kısa vadeli dalgalanmaları tolere edebilme gücünüzü analiz ettim. Agresif büyüme potansiyeli sunan, teknoloji ve global piyasalara odaklı bir portföy hazırladım.";
        portfolio = [
            { asset: "Yabancı Teknoloji Hisse Fonları", percentage: 50, color: "#00008B", description: "Küresel agresif büyüme" },
            { asset: "Yerli Hisse Senedi Fonları", percentage: 30, color: "#3B82F6", description: "Dinamik piyasa fırsatları" },
            { asset: "Girişim Sermayesi / Değişken Fon", percentage: 20, color: "#10B981", description: "Alternatif yüksek getiri" }
        ];
    }
  }

  return { profileName, aiAnalysis, portfolio };
}

export async function POST(req: Request) {
  try {
    const { answers } = await req.json();
    
    // 1. Google Gemini API'yi Deniyoruz
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY eksik, fallback motoruna geçiliyor.");
      }
      
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Veya uygun olan hızlı model
      
      const prompt = `
      Sen 'FinAi' adında profesyonel, yapay zeka tabanlı üst düzey bir yatırım asistanısın.
      Kullanıcının yatırım testi cevapları: ${JSON.stringify(answers)}
      
      Görev: Bu cevaplara bakarak kullanıcının risk profilini ("Defansif Stratejist", "Optimum Denge" veya "Alfa Odaklı") belirle.
      Kullanıcının "Faiz Hassasiyeti" olup olmadığına 12. soruya bakarak karar ver. Eğer faiz hassasiyeti (İslami Finans) VARSA kesinlikle Para Piyasası, Tahvil, Eurobond önerme; bunların yerine Kira Sertifikası (Sukuk), Katılım Hesabı, Katılım Hisse Senedi ve Altın öner.
      Eğer hassasiyeti YOKSA standart araçları önerebilirsin.
      
      Dönüş formatı SADECE geçerli bir JSON objesi olmalıdır:
      {
        "profileName": "Profil Adı",
        "aiAnalysis": "FinAi ağzından profesyonel, doğrudan kullanıcıya hitap eden 2-3 cümlelik özel analiz metni.",
        "portfolio": [
          { "asset": "Varlık Adı", "percentage": Yüzde_Sayısı, "color": "#00008B", "description": "Kısa açıklama" }
        ]
      }
      Toplam percentage 100 olmalıdır. Renkleri #00008B, #3B82F6 ve #10B981 olarak kullan.
      Asla markdown blokları veya ekstra metin koyma, sadece pür JSON dön.
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsedData = JSON.parse(responseText);
      return NextResponse.json(parsedData);
      
    } catch (geminiError) {
      console.warn("Gemini API hatası veya kota dolumu:", geminiError);
      // 2. Fallback Kural Motoruna Geçiş
      const fallbackResult = generateFallbackPortfolio(answers);
      return NextResponse.json(fallbackResult);
    }
    
  } catch (error) {
    console.error("Genel API hatası:", error);
    return NextResponse.json({ error: "İşlem gerçekleştirilemedi" }, { status: 500 });
  }
}
