import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { answers } = await req.json();
    
    // Verileri Çek
    const isIslamic = answers[12]?.text?.includes("Evet") || false;
    const timeHorizon = answers[8]?.text || "Orta Vade"; 
    const risk_score = Object.values(answers).reduce((acc: number, curr: any) => acc + (curr.score || 0), 0) as number;
    
    let profileName = "Optimum Denge";
    let aiAnalysis = "";
    let expectedAnnualReturn = 45;
    let portfolio: any[] = [];

    // Zeki Kategori Dağıtım Algoritması
    if (!isIslamic) {
      if (risk_score <= 14) { 
        profileName = "Defansif Stratejist";
        expectedAnnualReturn = 38;
        aiAnalysis = "Kısa vadeli beklentilerinizi ve riskten kaçınan yapınızı analiz ettim. Sermaye korumasına ve düşük dalgalanmaya büyük önem verdiğiniz için para piyasası fonları ve kısa vadeli borçlanma araçlarına ağırlık verdim.";
        portfolio = [
          { asset: "Para Piyasası Fonları", percentage: 40, color: "#00008B", description: "Mevduat eşdeğeri, yüksek likidite ve risksiz getiri" },
          { asset: "Kısa Vadeli Borçlanma Araçları Fonları", percentage: 30, color: "#3B82F6", description: "Düşük dalgalanmalı sabit getiri" },
          { asset: "Kıymetli Madenler Fonları", percentage: 20, color: "#10B981", description: "Küresel risklere ve enflasyona karşı koruma" },
          { asset: "Özel Sektör Borçlanma Araçları", percentage: 10, color: "#F59E0B", description: "Ekstra sabit getiri fırsatları" }
        ];
      } else if (risk_score >= 15 && risk_score <= 21) {
        profileName = "Optimum Denge";
        expectedAnnualReturn = 52;
        aiAnalysis = "Risk ve getiri beklentileriniz arasındaki ideal dengeyi analiz ettim. Hem sermaye büyümesi hedefleyen hisse ve eurobond fonları hem de olası düşüşleri dengeleyecek karma bir dağılım hazırladım.";
        portfolio = [
          { asset: "Orta/Uzun Vadeli Borçlanma Araçları Fonları", percentage: 25, color: "#00008B", description: "Dengeli sabit getiri potansiyeli" },
          { asset: "Eurobond Fonları", percentage: 20, color: "#3B82F6", description: "Döviz bazlı getiri ve kur koruması" },
          { asset: "Temettü (Dividend) Hisse Senedi Fonları", percentage: 20, color: "#10B981", description: "Düzenli nakit akışı sağlayan şirketler" },
          { asset: "Karma Fonlar", percentage: 15, color: "#F59E0B", description: "Çeşitlendirilmiş profesyonel dağılım" },
          { asset: "Fon Sepeti Fonları", percentage: 10, color: "#8B5CF6", description: "Uluslararası ve yerel sepet çeşitliliği" },
          { asset: "Gayrimenkul Yatırım Fonları", percentage: 10, color: "#EC4899", description: "Fiziksel varlık koruması" }
        ];
      } else {
        profileName = "Alfa Odaklı";
        expectedAnnualReturn = 78;
        aiAnalysis = "Yüksek getiri iştahınızı ve dalgalanmaları tolere edebilme gücünüzü analiz ettim. Sektörel hisseler, serbest fonlar ve girişim sermayesi ile tamamen agresif büyümeye odaklanmış bir reçete sunuyorum.";
        portfolio = [
          { asset: "Teknoloji Hisse Senedi Fonları", percentage: 25, color: "#00008B", description: "Yüksek küresel ve yerel büyüme potansiyeli" },
          { asset: "Bankacılık Hisse Senedi Fonları", percentage: 20, color: "#3B82F6", description: "Finans sektörü dinamik getirisi" },
          { asset: "Sanayi & Enerji Hisse Senedi Fonları", percentage: 15, color: "#10B981", description: "Reel sektör büyüme potansiyeli" },
          { asset: "Değişken Fonlar", percentage: 15, color: "#F59E0B", description: "Piyasa şartlarına göre profesyonel agresif yönetim" },
          { asset: "Girişim Sermayesi Yatırım Fonları", percentage: 10, color: "#8B5CF6", description: "Yeni nesil şirket ve startup yatırımları" },
          { asset: "Serbest Fonlar", percentage: 10, color: "#EC4899", description: "Esnek riskli stratejiler" },
          { asset: "Endeks Fonları", percentage: 5, color: "#EF4444", description: "Borsa performansına paralel yüksek getiri" }
        ];
      }
    } else { // İslami (Faiz Hassasiyeti)
      if (risk_score <= 14) { 
        profileName = "Defansif Stratejist";
        expectedAnnualReturn = 38;
        aiAnalysis = "İslami finans prensiplerinize uygun olarak riskten kaçınan yapınızı analiz ettim. Faizsiz nakit yönetimi araçları ve reel varlıklardan (Altın, Gayrimenkul) oluşan, sermayenizi güvenle koruyacak defansif bir dağılım tasarladım.";
        portfolio = [
          { asset: "Katılım Fonları", percentage: 50, color: "#00008B", description: "Faizsiz, düşük riskli nakit yönetimi" },
          { asset: "Kıymetli Madenler Fonları", percentage: 30, color: "#10B981", description: "Altın/Gümüş bazlı reel koruma" },
          { asset: "Gayrimenkul Yatırım Fonları", percentage: 20, color: "#3B82F6", description: "Fiziksel varlıklara dayalı güvenli getiri" }
        ];
      } else if (risk_score >= 15 && risk_score <= 21) {
        profileName = "Optimum Denge";
        expectedAnnualReturn = 52;
        aiAnalysis = "Risk ve getiri arasında kurduğunuz mantıksal dengeyi analiz ettim. Katılım endeksi hisseleri ve gayrimenkul gibi faizsiz büyüme potansiyeli sunan hem de enflasyona karşı koruyan dengeli bir reçete oluşturdum.";
        portfolio = [
          { asset: "Katılım Fonları", percentage: 40, color: "#00008B", description: "Faizsiz, dengeli büyüme potansiyeli" },
          { asset: "Kıymetli Madenler Fonları", percentage: 25, color: "#10B981", description: "Küresel enflasyondan korunma" },
          { asset: "Temettü (Dividend) Hisse Senedi Fonları (Katılım Endeksi)", percentage: 20, color: "#F59E0B", description: "Helal ve düzenli nakit akışı" },
          { asset: "Gayrimenkul Yatırım Fonları", percentage: 15, color: "#3B82F6", description: "Reel değer koruması" }
        ];
      } else {
        profileName = "Alfa Odaklı";
        expectedAnnualReturn = 78;
        aiAnalysis = "Helal kazanç ve uzun vadeli yüksek büyüme vizyonunuzu analiz ettim. Tamamen katılım uyumlu teknoloji, sanayi şirketleri ve girişim sermayesine odaklanan oldukça atak bir portföy tasarladım.";
        portfolio = [
          { asset: "Teknoloji Hisse Senedi Fonları (Katılım Uyumlu)", percentage: 30, color: "#00008B", description: "Faizsiz kurallara uygun yüksek teknoloji yatırımı" },
          { asset: "Sanayi Hisse Senedi Fonları (Katılım Uyumlu)", percentage: 25, color: "#3B82F6", description: "Reel üretim yapan şirket ortaklıkları" },
          { asset: "Ulaştırma & Enerji Hisse Senedi Fonları (Katılım Uyumlu)", percentage: 20, color: "#F59E0B", description: "Sektörel dinamik helal büyüme" },
          { asset: "Girişim Sermayesi Yatırım Fonları", percentage: 15, color: "#10B981", description: "İslami prensiplere uygun yeni nesil yatırımlar" },
          { asset: "Katılım Endeksi Fonları", percentage: 10, color: "#8B5CF6", description: "Faizsiz borsa endeksi getirisi" }
        ];
      }
    }

    // Vade Durumuna Göre İnce Ayar
    if (timeHorizon.includes("Uzun Vade")) {
        expectedAnnualReturn += 6; 
    } else if (timeHorizon.includes("Kısa Vade")) {
        expectedAnnualReturn -= 4;
    }

    return NextResponse.json({
        profileName,
        aiAnalysis,
        expectedAnnualReturn,
        portfolio
    });

  } catch (error) {
    console.error("Algoritma Hatası:", error);
    return NextResponse.json({ error: "Sistem Hatası" }, { status: 500 });
  }
}
