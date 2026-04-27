import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { answers } = await req.json();
    
    const isIslamic = answers[12]?.text?.includes("Evet") || false;
    const timeHorizon = answers[8]?.text || "Orta Vade"; 
    const risk_score = Object.values(answers).reduce((acc: number, curr: any) => acc + (curr.score || 0), 0) as number;
    
    let profileName = "Optimum Denge";
    let aiAnalysis = "";
    let expectedAnnualReturn = 45;
    let portfolio: any[] = [];

    if (!isIslamic) {
      if (risk_score <= 14) { 
        profileName = "Defansif Stratejist";
        expectedAnnualReturn = 38;
        aiAnalysis = "Kısa vadeli beklentilerinizi ve riskten kaçınan yapınızı analiz ettim. Sermaye korumasına ve düşük dalgalanmaya büyük önem verdiğiniz için para piyasası fonları ve kısa vadeli borçlanma araçlarına ağırlık verdim.";
        portfolio = [
          { asset: "Para Piyasası Fonları", percentage: 40, color: "#00008B", description: "Piyasadaki sert rüzgarlardan asla etkilenmez. Borsa düştüğünde bile paranız güvende kalır ve her gün istikrarlı şekilde artmaya devam eder." },
          { asset: "Kısa Vadeli Borçlanma Araçları Fonları", percentage: 30, color: "#3B82F6", description: "Olası piyasa krizlerinde kalkan görevi görür. Ana paranızı koruyarak risksiz, sağlam ve dalgalanmadan uzak bir büyüme garantiler." },
          { asset: "Kıymetli Madenler Fonları", percentage: 20, color: "#10B981", description: "Tarihin en güvenli limanı. Ani enflasyon şoklarında veya küresel kriz anlarında portföyünüzün erimesini engelleyen mükemmel bir sigortadır." },
          { asset: "Özel Sektör Borçlanma Araçları", percentage: 10, color: "#F59E0B", description: "Piyasa faizinin üzerinde, tahmin edilebilir ve güçlü nakit akışları yaratarak sürpriz düşüşlerde portföyünüzü dengeler." }
        ];
      } else if (risk_score >= 15 && risk_score <= 21) {
        profileName = "Optimum Denge";
        expectedAnnualReturn = 52;
        aiAnalysis = "Risk ve getiri beklentileriniz arasındaki ideal dengeyi analiz ettim. Hem sermaye büyümesi hedefleyen hisse ve eurobond fonları hem de olası düşüşleri dengeleyecek karma bir dağılım hazırladım.";
        portfolio = [
          { asset: "Orta/Uzun Vadeli Borçlanma Araçları Fonları", percentage: 25, color: "#00008B", description: "Piyasa paniğe kapıldığında size düzenli nakit sağlar. Hisseler düştüğünde bile paranızın belirli bir kısmı kârlı kalmaya devam eder." },
          { asset: "Eurobond Fonları", percentage: 20, color: "#3B82F6", description: "Döviz kurlarındaki ani fırlamalara karşı muazzam bir kalkan! TL değer kaybetse bile döviz bazlı kupon ödemeleriyle portföyünüzü korur." },
          { asset: "Temettü (Dividend) Hisse Senedi Fonları", percentage: 20, color: "#10B981", description: "Borsada hisseler düşse dahi, bu köklü şirketler her yıl hesabınıza nakit kâr payı yatırmaya devam eder. Krizlerde bile pasif gelir sağlar." },
          { asset: "Karma Fonlar", percentage: 15, color: "#F59E0B", description: "Yönetici zekası sayesinde piyasa düşerken hemen savunmaya geçer, piyasa yükselirken hisse ağırlığını artırarak kayıpları engeller." },
          { asset: "Fon Sepeti Fonları", percentage: 10, color: "#8B5CF6", description: "Tüm paranızı tek bir ülkeye bağlamaz. Türkiye borsası düşerken, dünyadaki farklı varlıklardan kazanç sağlayarak riskinizi adeta sıfırlar." },
          { asset: "Gayrimenkul Yatırım Fonları", percentage: 10, color: "#EC4899", description: "Gerçek ve somut varlıklara (bina, AVM vb.) yatırım yaparak, borsadaki sanal düşüşlerden korunmanızı sağlayan taş gibi bir yatırımdır." }
        ];
      } else {
        profileName = "Alfa Odaklı";
        expectedAnnualReturn = 78;
        aiAnalysis = "Yüksek getiri iştahınızı ve dalgalanmaları tolere edebilme gücünüzü analiz ettim. Sektörel hisseler, serbest fonlar ve girişim sermayesi ile tamamen agresif büyümeye odaklanmış bir reçete sunuyorum.";
        portfolio = [
          { asset: "Teknoloji Hisse Senedi Fonları", percentage: 25, color: "#00008B", description: "Anlık düşüşler yaşansa da, uzun vadede yapay zeka ve dev teknoloji şirketlerinin milyar dolarlık kârlılıklarından maksimum pay almanızı sağlar." },
          { asset: "Bankacılık Hisse Senedi Fonları", percentage: 20, color: "#3B82F6", description: "Piyasa faizleri değiştiğinde anında tepki verir. Dalgalanmaları doğru yakaladığınızda portföyünüze çok kısa sürede muazzam bir ivme katar." },
          { asset: "Sanayi & Enerji Hisse Senedi Fonları", percentage: 15, color: "#10B981", description: "Ülke ekonomisinin belkemiğidir. Kriz anlarında sarsılsalar da, kriz bitiminde en hızlı toparlanan ve en agresif büyüyen şirketlerdir." },
          { asset: "Değişken Fonlar", percentage: 15, color: "#F59E0B", description: "Profesyonel yöneticiler, borsa çakılırken saniyeler içinde paranızı güvenli limanlara taşıyarak zararı durdurur; yükselişte tekrar atağa geçer." },
          { asset: "Girişim Sermayesi Yatırım Fonları", percentage: 10, color: "#8B5CF6", description: "Geleceğin Trendyol'larına veya Getir'lerine çok erken aşamada ortak olursunuz. Kısa vadeli borsa düşüşlerinden tamamen bağımsız, efsanevi kazanç potansiyeli taşır." },
          { asset: "Serbest Fonlar", percentage: 10, color: "#EC4899", description: "Kurallar ve sınırlar yoktur. Piyasa çökerken bile 'açığa satış' gibi karmaşık stratejilerle düşüşten bile para kazanabilen elit bir araçtır." },
          { asset: "Endeks Fonları", percentage: 5, color: "#EF4444", description: "Hiçbir yöneticinin inisiyatifine kalmadan, doğrudan borsanın uzun vadeli yükseliş trendini portföyünüze kopyalar." }
        ];
      }
    } else { 
      if (risk_score <= 14) { 
        profileName = "Defansif Stratejist";
        expectedAnnualReturn = 38;
        aiAnalysis = "İslami finans prensiplerinize uygun olarak riskten kaçınan yapınızı analiz ettim. Faizsiz nakit yönetimi araçları ve reel varlıklardan (Altın, Gayrimenkul) oluşan, sermayenizi güvenle koruyacak defansif bir dağılım tasarladım.";
        portfolio = [
          { asset: "Katılım Fonları", percentage: 50, color: "#00008B", description: "Piyasalar çakılsa bile paranız erimez. Faizsiz, katılım esaslarına dayalı sistemle ana paranızı güvenle muhafaza eder ve büyütür." },
          { asset: "Kıymetli Madenler Fonları", percentage: 30, color: "#10B981", description: "Enflasyon fırladığında paranızın alım gücünü anında korur. Küresel krizlerde değerini ikiye, üçe katlama potansiyeline sahiptir." },
          { asset: "Gayrimenkul Yatırım Fonları", percentage: 20, color: "#3B82F6", description: "Somut tuğlaya yatırımdır. Borsa endeksleri düşerken, gayrimenkulün kira gelirleri hesabınıza akmaya devam eder." }
        ];
      } else if (risk_score >= 15 && risk_score <= 21) {
        profileName = "Optimum Denge";
        expectedAnnualReturn = 52;
        aiAnalysis = "Risk ve getiri arasında kurduğunuz mantıksal dengeyi analiz ettim. Katılım endeksi hisseleri ve gayrimenkul gibi faizsiz büyüme potansiyeli sunan hem de enflasyona karşı koruyan dengeli bir reçete oluşturdum.";
        portfolio = [
          { asset: "Katılım Fonları", percentage: 40, color: "#00008B", description: "Hisse senedi piyasalarında panik satışları yaşandığında, portföyünüzün bu kısmı kaya gibi sağlam durarak toplam bakiyenizi dengeler." },
          { asset: "Kıymetli Madenler Fonları", percentage: 25, color: "#10B981", description: "Her dönem değerlidir. Kağıt paraların pul olduğu günlerde, altın gümüş yatırımlarınız portföyünüzün kahramanı olur." },
          { asset: "Temettü (Dividend) Hisse Senedi Fonları (Katılım Endeksi)", percentage: 20, color: "#F59E0B", description: "Katılım şartlarını sağlayan dev şirketler, borsa düşse dahi elde ettikleri reel kârları nakit olarak her yıl hesabınıza yatırır." },
          { asset: "Gayrimenkul Yatırım Fonları", percentage: 15, color: "#3B82F6", description: "Borsadaki anlık krizlerden tamamen izoledir. Fiziksel mülklerin kira ve değer artışıyla sarsılmaz bir defans duvarı örer." }
        ];
      } else {
        profileName = "Alfa Odaklı";
        expectedAnnualReturn = 78;
        aiAnalysis = "Helal kazanç ve uzun vadeli yüksek büyüme vizyonunuzu analiz ettim. Tamamen katılım uyumlu teknoloji, sanayi şirketleri ve girişim sermayesine odaklanan oldukça atak bir portföy tasarladım.";
        portfolio = [
          { asset: "Teknoloji Hisse Senedi Fonları (Katılım Uyumlu)", percentage: 30, color: "#00008B", description: "Kısa süreli düzeltmelere takılmayın! İslami şartlara uygun milyar dolarlık teknoloji devlerinin büyüme serüveninden efsanevi kârlar sağlar." },
          { asset: "Sanayi Hisse Senedi Fonları (Katılım Uyumlu)", percentage: 25, color: "#3B82F6", description: "Borsa dalgalansa bile bu şirketler gerçek fabrikalarda üretim yapar, ihracat yapar. Kriz sonrası en agresif yükselen sektörlerdir." },
          { asset: "Ulaştırma & Enerji Hisse Senedi Fonları (Katılım Uyumlu)", percentage: 20, color: "#F59E0B", description: "Maliyet artışlarını direkt fiyatlarına yansıtabildikleri için enflasyon şoklarına karşı mükemmel koruma ve büyüme fırsatı sunarlar." },
          { asset: "Girişim Sermayesi Yatırım Fonları", percentage: 15, color: "#10B981", description: "Borsada işlem görmeyen muazzam startuplara ortak olursunuz. Borsadaki düşüşlerden zerre etkilenmeden değerine değer katar." },
          { asset: "Katılım Endeksi Fonları", percentage: 10, color: "#8B5CF6", description: "Tek tek hisse seçme stresini sıfırlar. Borsa toparlandığında endeksin tüm coşkusunu zahmetsizce portföyünüze taşır." }
        ];
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
