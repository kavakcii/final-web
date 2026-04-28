import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { answers } = await req.json();
    
    const isIslamic = answers[12]?.text?.includes("Evet") || false;
    const timeHorizon = answers[8]?.text || "Orta Vade"; 
    const risk_score = Object.values(answers).reduce((acc: number, curr: any) => acc + (curr.score || 0), 0) as number;
    
    // Add a pseudo-random seed based on the user's risk score and the length of answers 
    // to give slight variations to each user
    const userSeed = risk_score + (answers[10]?.text?.length || 0);

    let profileName = "Optimum Denge";
    let aiAnalysis = "";
    let expectedAnnualReturn = 45;
    let portfolio: any[] = [];

    // Helper to slightly randomize percentages but keep total 100
    const applyVariation = (basePortfolio: any[]) => {
        let currentTotal = 0;
        const varied = basePortfolio.map((item, index) => {
            // vary by -2 to +2 based on seed and index
            let variation = (userSeed + index) % 5 - 2; 
            // ensure we don't go below 5
            if (item.percentage + variation < 5) variation = 0;
            const newPercentage = item.percentage + variation;
            currentTotal += newPercentage;
            return { ...item, percentage: newPercentage };
        });

        // Fix the total to be exactly 100
        let diff = 100 - currentTotal;
        // Add/subtract diff to the largest allocation
        if (diff !== 0) {
            varied[0].percentage += diff;
        }
        return varied;
    };

    if (!isIslamic) {
      if (risk_score <= 14) { 
        profileName = "Defansif Stratejist";
        expectedAnnualReturn = 38;
        aiAnalysis = "Kısa vadeli beklentilerinizi ve riskten kaçınan yapınızı analiz ettim. Sermaye korumasına ve düşük dalgalanmaya büyük önem verdiğiniz için paranızı enflasyona ezdirmeyecek ve stres yaratmayacak varlıklara yönlendirdim.";
        portfolio = applyVariation([
          { asset: "Para Piyasası Fonları", percentage: 40, color: "#00008B", description: "Risk almayı sevmediğiniz için bu fon, paranızı dalgalanmalardan koruyup her gün düzenli, stressiz bir getiri sağlar." },
          { asset: "Temettü Hisseleri (Defansif)", percentage: 30, color: "#3B82F6", description: "Sürdürülebilirlik odaklı karakterinizle uyumlu olarak, köklü şirketlerin her yıl hesabınıza düzenli nakit (temettü) yatırmasını hedefler." },
          { asset: "Kıymetli Madenler (Altın/Gümüş)", percentage: 20, color: "#10B981", description: "Güvenli liman arayışınızı yansıtır. Küresel krizlerde veya enflasyon artışında portföyünüzün değerini korur." },
          { asset: "Kısa Vadeli Borçlanma Araçları", percentage: 10, color: "#F59E0B", description: "Esneklik ihtiyacınıza uygun olarak, paranızı bağlamadan düşük riskle değerlendirmenize olanak tanır." }
        ]);
      } else if (risk_score >= 15 && risk_score <= 21) {
        profileName = "Optimum Denge";
        expectedAnnualReturn = 52;
        aiAnalysis = "Risk ve getiri beklentileriniz arasındaki o muhteşem dengeyi gördüm. Ne fırsatları kaçıran ne de gereksiz riskler alan stratejik karakteriniz için, hem büyüme hem koruma odaklı hibrit bir sepet tasarladım.";
        portfolio = applyVariation([
          { asset: "Büyüme (Growth) Hisseleri", percentage: 30, color: "#00008B", description: "Geleceğe yatırım yapmayı seven vizyoner yönünüz için, piyasa ortalamasının üzerinde büyüme potansiyeli taşıyan şirketler." },
          { asset: "Eurobond / Döviz Fonları", percentage: 25, color: "#3B82F6", description: "Denge arayışınıza hitap eder; kur dalgalanmalarına karşı portföyünüzü hedge ederek döviz bazlı düzenli kupon getirisi sunar." },
          { asset: "Temettü Hisseleri", percentage: 20, color: "#10B981", description: "Planlı yapınızla örtüşür; şirket kârlarından pay alarak yatırımınızın kendi kendini fonlamasını (pasif gelir) sağlar." },
          { asset: "Karma Fonlar", percentage: 15, color: "#F59E0B", description: "Dinamik piyasa koşullarına profesyonellerin hızla ayak uydurmasını sağlayarak, kontrol ihtiyacınızı güvene dönüştürür." },
          { asset: "Emtia Fonları", percentage: 10, color: "#8B5CF6", description: "Çeşitlendirmeye verdiğiniz önemin bir yansıması olarak, genel enflasyona karşı somut varlık koruması yaratır." }
        ]);
      } else {
        profileName = "Alfa Odaklı";
        expectedAnnualReturn = 78;
        aiAnalysis = "Yüksek getiri iştahınızı, cesaretinizi ve dalgalanmaları tolere edebilme gücünüzü analiz ettim. Piyasayı yenme arzunuza uygun olarak, agresif büyüme hisselerine ve teknoloji fonlarına odaklandım.";
        portfolio = applyVariation([
          { asset: "Teknoloji ve Yapay Zeka Hisseleri", percentage: 35, color: "#00008B", description: "Yenilikçi ve fırsat kovalayan yapınıza tam uyar. Geleceği şekillendiren devlerin büyümesinden maksimum alfa getirisi sağlar." },
          { asset: "Yüksek Büyüme (Startup) Fonları", percentage: 20, color: "#3B82F6", description: "Erken aşamada değer yakalama hevesinizi yansıtır. Risk yüksek olsa da, hedeflediğiniz efsanevi kazanç potansiyelini sunar." },
          { asset: "Küresel Hisse Senetleri", percentage: 20, color: "#10B981", description: "Sınır tanımayan vizyonunuzla eşleşir; sadece yerel piyasada kalmayıp dünyadaki fırsatlara ortak olmanızı sağlar." },
          { asset: "Değişken / Serbest Fonlar", percentage: 15, color: "#F59E0B", description: "Agresif taktiklere uygun olarak, profesyonellerin limitsiz stratejilerle düşüşten bile kâr çıkarmasını hedefler." },
          { asset: "Sanayi & Enerji Hisseleri", percentage: 10, color: "#8B5CF6", description: "Güçlü atakların arkasındaki sarsılmaz temeldir; ekonomik büyümenin dinamosu olan ana sektörlerle portföye ivme katar." }
        ]);
      }
    } else { 
      if (risk_score <= 14) { 
        profileName = "Defansif Stratejist";
        expectedAnnualReturn = 38;
        aiAnalysis = "İslami finans prensiplerinize bağlı kalarak riskten kaçınan yapınızı analiz ettim. Helal kazanç çerçevenizden çıkmadan sermayenizi güvenle koruyacak defansif bir yapı tasarladım.";
        portfolio = applyVariation([
          { asset: "Katılım (Kira Sertifikası) Fonları", percentage: 45, color: "#00008B", description: "Hassasiyetlerinizle %100 uyumlu, faizsiz bir şekilde paranızın istikrarlı ve güvenli olarak büyümesini sağlar." },
          { asset: "Katılım Endeksi Temettü Hisseleri", percentage: 30, color: "#3B82F6", description: "Planlı ve muhafazakar yapınıza uygun; reel ticaret yapan şirketlerin helal kârından düzenli pay (pasif gelir) almanızı sağlar." },
          { asset: "Fiziki / Kıymetli Madenler (Altın)", percentage: 25, color: "#10B981", description: "Geleneksel güvenli liman tercihinizdir; paranızın alım gücünü faizsiz olarak koruyup kriz anlarında kalkan olur." }
        ]);
      } else if (risk_score >= 15 && risk_score <= 21) {
        profileName = "Optimum Denge";
        expectedAnnualReturn = 52;
        aiAnalysis = "Faizsiz yatırım prensipleriniz ile makul getiri hedefiniz arasındaki o mantıksal dengeyi analiz ettim. Hem ticari ortaklıklarla büyüyen hem de gayrimenkulle korunan dengeli bir sepet oluşturdum.";
        portfolio = applyVariation([
          { asset: "Katılım Endeksi (Büyüme) Hisseleri", percentage: 35, color: "#00008B", description: "Gelişime açık karakteriniz için; faizsiz finans kriterlerine uyan, sağlam bilançolu şirketlerle uzun vadeli değer artışı sağlar." },
          { asset: "Altın ve Gümüş Fonları", percentage: 25, color: "#10B981", description: "Denge arayışınızla birebir örtüşür; kağıt varlıkların risklerine karşı portföyünüzün dayanıklılığını artırır." },
          { asset: "Kira Sertifikası (Sukuk)", percentage: 25, color: "#F59E0B", description: "Sabit getiri ihtiyacınızı İslami kurallara uygun şekilde, ticari varlıkların kiralanması modeliyle karşılar." },
          { asset: "Gayrimenkul Yatırım Fonları", percentage: 15, color: "#3B82F6", description: "Reel varlıklara duyduğunuz güvene hitap eder; fiziksel mülklerin kira ve değer artışından faizsiz gelir sunar." }
        ]);
      } else {
        profileName = "Alfa Odaklı";
        expectedAnnualReturn = 78;
        aiAnalysis = "Helal kazanç prensibinizden taviz vermeden, uzun vadeli ve efsanevi yüksek büyüme vizyonunuzu analiz ettim. Cesur yapınıza uygun, katılım şartlarını sağlayan agresif şirket hisselerine odaklandım.";
        portfolio = applyVariation([
          { asset: "Teknoloji Hisseleri (Katılım Uyumlu)", percentage: 35, color: "#00008B", description: "İnovasyona olan güçlü inancınız için; geleceği yazan ancak faizsiz prensiplere uyan global/yerel şirketlere yatırım." },
          { asset: "Sanayi & Üretim Hisseleri", percentage: 25, color: "#3B82F6", description: "Risk alabilen dinamik yapınıza tam uyar; ekonominin çarklarını döndüren fabrikalara güçlü ortaklıklar sağlar." },
          { asset: "Girişim Sermayesi (Faizsiz)", percentage: 20, color: "#10B981", description: "Fırsatçı ve vizyoner tarafınızı besler; henüz borsaya açılmamış yüksek potansiyelli startuplara İslami usullere göre yatırım yapar." },
          { asset: "Katılım Hisse Senedi Fonları", percentage: 20, color: "#8B5CF6", description: "Agresif stratejinizin denge unsurudur; profesyonel yöneticilerin anlık fırsatları değerlendirdiği esnek fonlarla kazancı maksimize eder." }
        ]);
      }
    }

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
