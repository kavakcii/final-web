import { NextResponse } from "next/server";

// Tüm Kategori Havuzu (Kullanıcı tarafından iletilen Fon & Hisse Dağılımları)
const CATEGORY_POOL = {
  conventional: {
    lowRisk: [
      { asset: "Para Piyasası Fonları", percentage: 50, color: "#00008B", description: "Mevduat eşdeğeri, yüksek likidite ve risksiz getiri" },
      { asset: "Kısa Vadeli Borçlanma Araçları", percentage: 30, color: "#3B82F6", description: "Düşük dalgalanmalı sabit getiri" },
      { asset: "Kıymetli Madenler Fonları", percentage: 20, color: "#10B981", description: "Küresel risklere ve enflasyona karşı koruma" },
    ],
    midRisk: [
      { asset: "Orta/Uzun Vadeli Borçlanma Araçları", percentage: 30, color: "#00008B", description: "Dengeli sabit getiri potansiyeli" },
      { asset: "Karma & Değişken Fonlar", percentage: 20, color: "#3B82F6", description: "Piyasa şartlarına göre profesyonel dağılım" },
      { asset: "Eurobond Fonları", percentage: 20, color: "#10B981", description: "Döviz bazlı getiri ve kur koruması" },
      { asset: "Temettü (Dividend) Hisse Fonları", percentage: 20, color: "#F59E0B", description: "Düzenli nakit akışı sağlayan şirketler" },
      { asset: "Fon Sepeti Fonları", percentage: 10, color: "#8B5CF6", description: "Uluslararası ve yerel sepet çeşitliliği" },
    ],
    highRisk: [
      { asset: "Teknoloji & İletişim Hisse Fonları", percentage: 35, color: "#00008B", description: "Yüksek küresel ve yerel büyüme potansiyeli" },
      { asset: "Bankacılık & Sanayi Hisse Fonları", percentage: 25, color: "#3B82F6", description: "Sektörel dinamik getiri fırsatları" },
      { asset: "Girişim Sermayesi Yatırım Fonları", percentage: 15, color: "#10B981", description: "Yeni nesil şirket ve startup yatırımları" },
      { asset: "Serbest Fonlar", percentage: 15, color: "#F59E0B", description: "Esnek ve agresif stratejiler" },
      { asset: "Endeks Fonları", percentage: 10, color: "#EC4899", description: "Borsa performansına paralel yüksek getiri" },
    ]
  },
  islamic: {
    lowRisk: [
      { asset: "Katılım Fonları (Kısa Vadeli)", percentage: 50, color: "#00008B", description: "Faizsiz, düşük riskli nakit yönetimi" },
      { asset: "Kıymetli Madenler Fonları", percentage: 30, color: "#10B981", description: "Altın/Gümüş bazlı reel koruma" },
      { asset: "Gayrimenkul Yatırım Fonları", percentage: 20, color: "#3B82F6", description: "Fiziksel varlıklara dayalı güvenli getiri" },
    ],
    midRisk: [
      { asset: "Katılım Fonları (Orta/Uzun Vadeli)", percentage: 40, color: "#00008B", description: "Faizsiz, dengeli büyüme potansiyeli" },
      { asset: "Kıymetli Madenler Fonları", percentage: 30, color: "#10B981", description: "Küresel enflasyondan korunma" },
      { asset: "Katılım Endeksi Temettü Fonları", percentage: 30, color: "#F59E0B", description: "Helal ve düzenli nakit akışı" },
    ],
    highRisk: [
      { asset: "Katılım Uyumlu Teknoloji Hisse Fonları", percentage: 40, color: "#00008B", description: "Faizsiz kurallara uygun yüksek teknoloji yatırımı" },
      { asset: "Katılım Uyumlu Sanayi & Ulaştırma Fonları", percentage: 30, color: "#3B82F6", description: "Reel üretim yapan şirket ortaklıkları" },
      { asset: "Girişim Sermayesi (Katılım Uyumlu)", percentage: 15, color: "#10B981", description: "İslami prensiplere uygun yeni nesil yatırımlar" },
      { asset: "Katılım Endeks Fonları", percentage: 15, color: "#F59E0B", description: "Faizsiz borsa endeksi getirisi" },
    ]
  }
};

export async function POST(req: Request) {
  try {
    const { answers } = await req.json();
    
    // 1. Verileri Çek ve Temizle
    const isIslamic = answers[12]?.text?.includes("Evet") || false;
    const timeHorizon = answers[8]?.text || "Orta Vade"; // Kısa, Orta, Uzun
    const risk_score = Object.values(answers).reduce((acc: number, curr: any) => acc + (curr.score || 0), 0) as number;
    
    let profileName = "Optimum Denge";
    let aiAnalysis = "";
    let expectedAnnualReturn = 45;
    let portfolio: any[] = [];

    // 2. Risk Skoru ve Faiz Hassasiyetine Göre Zeki Kural Motoru
    if (risk_score <= 14) {
      profileName = "Defansif Stratejist";
      expectedAnnualReturn = 38;
      
      portfolio = isIslamic ? CATEGORY_POOL.islamic.lowRisk : CATEGORY_POOL.conventional.lowRisk;

      aiAnalysis = isIslamic 
        ? "Kısa vadeli beklentilerinizi ve riskten kaçınan yapınızı analiz ettim. İslami finans prensiplerinize uygun olarak; faizsiz nakit yönetimi araçları ve reel varlıklardan (Altın, Gayrimenkul) oluşan, sermayenizi güvenle koruyacak defansif bir dağılım tasarladım."
        : "Sermaye korumasına ve düşük dalgalanmaya büyük önem verdiğinizi analiz ettim. Bu doğrultuda riskin minimumda tutulduğu, para piyasası fonları ve kısa vadeli güvenli limanlara odaklanan defansif bir portföy hazırladım.";
        
    } else if (risk_score >= 15 && risk_score <= 21) {
      profileName = "Optimum Denge";
      expectedAnnualReturn = 52;
      
      portfolio = isIslamic ? CATEGORY_POOL.islamic.midRisk : CATEGORY_POOL.conventional.midRisk;

      aiAnalysis = isIslamic
        ? "Risk ve getiri arasında kurduğunuz mantıksal dengeyi analiz ettim. İslami finans ilkelerinize uygun olarak; hem faizsiz büyüme potansiyeli sunan hem de kıymetli madenlerle enflasyona karşı koruyan dengeli bir reçete oluşturdum."
        : "Risk ve getiri beklentileriniz arasındaki ideal dengeyi analiz ettim. Hem sermaye büyümesi hedefleyen hisse ve eurobond fonları hem de olası düşüşleri dengeleyecek borçlanma araçlarını içeren optimum bir dağılım hazırladım.";

    } else {
      profileName = "Alfa Odaklı";
      expectedAnnualReturn = 78;
      
      portfolio = isIslamic ? CATEGORY_POOL.islamic.highRisk : CATEGORY_POOL.conventional.highRisk;

      aiAnalysis = isIslamic
        ? "Piyasadaki fırsatları değerlendirme gücünüzü ve uzun vadeli büyüme vizyonunuzu analiz ettim. Helal/Katılım prensiplerinize tamamen sadık kalarak; yüksek teknoloji, sanayi şirketleri ve girişim sermayesine odaklanan oldukça atak bir portföy tasarladım."
        : "Yüksek getiri iştahınızı ve kısa vadeli piyasa dalgalanmalarını tolere edebilme gücünüzü analiz ettim. Küresel teknoloji, bankacılık ve girişim sermayesi fonlarıyla maksimum agresif büyüme potansiyeli sunan bir portföy hazırladım.";
    }

    // 3. Vade Durumuna Göre İnce Ayar (Dynamic Tweak)
    if (timeHorizon.includes("Uzun Vade")) {
        expectedAnnualReturn += 6; 
    } else if (timeHorizon.includes("Kısa Vade")) {
        expectedAnnualReturn -= 4;
    }

    // Sıfır gecikmeli, %100 yerel ve deterministik sonuç döndürülür
    return NextResponse.json({
        profileName,
        aiAnalysis,
        expectedAnnualReturn,
        portfolio
    });

  } catch (error) {
    console.error("Kural Motoru Hatası:", error);
    return NextResponse.json({ error: "Sistem Hatası" }, { status: 500 });
  }
}
