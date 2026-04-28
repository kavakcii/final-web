import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { answers } = await req.json();

    // 1. Parse answers
    const q1 = answers[1]?.score || 2; // Horizon
    const q2 = answers[2]?.score || 2; // Drawdown
    const q3 = answers[3]?.score || 2; // Income vs Growth
    const q4 = answers[4]?.score || 2; // Inflation Hedge
    const q5 = answers[5]?.score || 2; // Theme
    const q6 = answers[6]?.score || 2; // Crisis
    const q7 = answers[7]?.score || 2; // Psychology
    const isIslamic = answers[8]?.text?.includes("Evet") || false;
    const initialCapital = Number(answers[10]?.text || 0);

    const totalScore = q1 + q2 + q3 + q4 + q5 + q6 + q7;
    const userSeed = totalScore + initialCapital;

    // 2. Weighting Engine (Lego Model) with Real Sectors
    let assets = {
        // Macro / Temel Varlıklar (Sabit Getirili ve Değerli Madenler)
        "Para Piyasası Fonu / Repo": { weight: 0, color: "#94A3B8", desc: "Sıfır riskle, anlık dalgalanmalardan tamamen uzak, stressiz nakit park alanı." },
        "Tahvil ve Bono Fonları": { weight: 0, color: "#64748B", desc: "Kısa ve orta vadede sermayeyi koruyan, risksiz sabit getiri enstrümanı." },
        "Eurobond": { weight: 0, color: "#3B82F6", desc: "Kur şoklarına karşı kalkan olan döviz bazlı kupon geliri." },
        "Fiziki Altın ve Gümüş": { weight: 0, color: "#EAB308", desc: "Küresel krizler ve enflasyona karşı binlerce yıllık güvenilir liman." },
        "Kira Sertifikası (Sukuk)": { weight: 0, color: "#0F172A", desc: "Faizsiz finansın temel taşı, sıfır riskli helal kazanç." },

        // BIST Sektörleri (Non-Islamic / Karma)
        "Bankacılık Hisseleri": { weight: 0, color: "#00008B", desc: "Ekonominin bel kemiği, güçlü nakit akışı ve temettü potansiyeli yüksek finans devleri." },
        "Holding Hisseleri": { weight: 0, color: "#1D4ED8", desc: "Tek hisseyle onlarca sektöre yayılan doğal çeşitlendirme ve düzenli temettü." },
        "Bilişim ve Yazılım Hisseleri": { weight: 0, color: "#8B5CF6", desc: "Dijital devrimin merkezindeki, kâr marjı devasa yüksek yenilikçi şirketler." },
        "Enerji Teknolojileri ve Üretim": { weight: 0, color: "#10B981", desc: "Geleceğin yenilenebilir gücünü üreten, stratejik ve sarsılmaz büyüme motorları." },
        "Savunma Hisseleri": { weight: 0, color: "#EF4444", desc: "Küresel belirsizliklerde değeri artan, devlet garantili ve inovatif yüksek teknoloji." },
        "Otomotiv ve Yan Sanayi": { weight: 0, color: "#F59E0B", desc: "İhracat rekorları kıran, döviz gelirli köklü sanayi çarkları." },
        "Ana Metal ve İmalat Hisseleri": { weight: 0, color: "#6B7280", desc: "Ekonomik toparlanmalara en agresif tepkiyi veren hammadde devleri." },
        "Gıda ve İçecek / Perakende": { weight: 0, color: "#059669", desc: "Kriz dinlemeyen, enflasyonu anında etiketlere yansıtarak kârını koruyan defansif güç." },
        "İlaç ve Sağlık": { weight: 0, color: "#14B8A6", desc: "Talebi hiçbir ekonomik dalgalanmada düşmeyen kalıcı değer." },
        "Gayrimenkul Yatırım Ortaklıkları": { weight: 0, color: "#8B5CF6", desc: "Fiziki gayrimenkul projelerine ortaklık ve güçlü kira (temettü) verimi." },
        "Taş, Toprak, Çimento Hisseleri": { weight: 0, color: "#9CA3AF", desc: "Büyük altyapı projelerinden ve yeniden inşadan beslenen temel yapı blokları." },
        "Ulaştırma Hisseleri": { weight: 0, color: "#0EA5E9", desc: "Küresel ticareti ve turizmi birbirine bağlayan devasa havacılık ve lojistik ağı." },
        "Girişim Sermayesi Yat. Ort.": { weight: 0, color: "#C084FC", desc: "Henüz bebek aşamasındaki projelere melek yatırımcı olarak girip x10 potansiyel arama." },

        // İslami Katılım Varyasyonları
        "Katılım Bankacılığı Hisseleri": { weight: 0, color: "#00008B", desc: "Faizsiz prensiplerle büyüyen güçlü katılım bankaları." },
        "Faizsiz Bilişim ve Yazılım Hisseleri": { weight: 0, color: "#8B5CF6", desc: "İslami hassasiyetlere tam uyumlu teknoloji ve inovasyon yatırımları." },
        "Faizsiz Enerji ve Sanayi": { weight: 0, color: "#10B981", desc: "Katılım şartlarını sağlayan, reel ekonomi üreten büyük fabrikalar ve enerji tesisleri." },
        "Faizsiz Gıda ve Perakende": { weight: 0, color: "#059669", desc: "Kriz dinlemeyen helal üretim ve perakende zincirleri." },
        "Katılım Gayrimenkul Fonları": { weight: 0, color: "#8B5CF6", desc: "Faizsiz, tamamen kira ve proje gelirine dayalı fiziki varlık ortaklığı." },
        "Faizsiz Girişim Sermayesi": { weight: 0, color: "#C084FC", desc: "Startuplara İslami melek yatırımcı kurallarıyla destek olan fonlar." }
    };

    const addW = (asset: string, w: number) => {
        if (assets[asset as keyof typeof assets]) assets[asset as keyof typeof assets].weight += w;
    };

    // --- WEIGHTING LOGIC ---

    // Q1: Yatırım Vadesi
    if (q1 === 1) { // Kısa Vade
        if (!isIslamic) { addW("Para Piyasası Fonu / Repo", 50); addW("Tahvil ve Bono Fonları", 40); addW("Fiziki Altın ve Gümüş", 10); }
        else { addW("Kira Sertifikası (Sukuk)", 70); addW("Fiziki Altın ve Gümüş", 30); }
    } else if (q1 === 2) { // Orta Vade
        if (!isIslamic) { addW("Tahvil ve Bono Fonları", 20); addW("Eurobond", 20); addW("Holding Hisseleri", 15); addW("Otomotiv ve Yan Sanayi", 15); }
        else { addW("Kira Sertifikası (Sukuk)", 30); addW("Katılım Bankacılığı Hisseleri", 15); addW("Faizsiz Enerji ve Sanayi", 15); }
    } else { // Uzun Vade
        if (!isIslamic) { addW("Bilişim ve Yazılım Hisseleri", 30); addW("Enerji Teknolojileri ve Üretim", 20); addW("Girişim Sermayesi Yat. Ort.", 10); }
        else { addW("Faizsiz Bilişim ve Yazılım Hisseleri", 30); addW("Faizsiz Enerji ve Sanayi", 20); addW("Faizsiz Girişim Sermayesi", 10); }
    }

    // Q2: Drawdown Toleransı
    if (q2 === 1) { // Max %5
        if (!isIslamic) { addW("Para Piyasası Fonu / Repo", 40); addW("Fiziki Altın ve Gümüş", 30); addW("Gıda ve İçecek / Perakende", 10); }
        else { addW("Kira Sertifikası (Sukuk)", 50); addW("Fiziki Altın ve Gümüş", 30); addW("Faizsiz Gıda ve Perakende", 10); }
    } else if (q2 === 2) { // Max %20
        if (!isIslamic) { addW("Bankacılık Hisseleri", 20); addW("Otomotiv ve Yan Sanayi", 20); addW("Eurobond", 20); }
        else { addW("Faizsiz Enerji ve Sanayi", 30); addW("Katılım Gayrimenkul Fonları", 20); }
    } else { // Yüksek Tolerans
        if (!isIslamic) { addW("Bilişim ve Yazılım Hisseleri", 25); addW("Savunma Hisseleri", 20); addW("Girişim Sermayesi Yat. Ort.", 15); }
        else { addW("Faizsiz Bilişim ve Yazılım Hisseleri", 30); addW("Faizsiz Girişim Sermayesi", 20); }
    }

    // Q3: Income vs Growth (Nakit Akışı)
    if (q3 === 1) { // Temettü / Nakit
        if (!isIslamic) { addW("Bankacılık Hisseleri", 30); addW("Holding Hisseleri", 20); addW("Gayrimenkul Yatırım Ortaklıkları", 20); addW("Eurobond", 10); }
        else { addW("Katılım Gayrimenkul Fonları", 30); addW("Kira Sertifikası (Sukuk)", 30); addW("Katılım Bankacılığı Hisseleri", 20); }
    } else if (q3 === 2) { // Dengeli
        if (!isIslamic) { addW("Otomotiv ve Yan Sanayi", 20); addW("Ulaştırma Hisseleri", 20); addW("Enerji Teknolojileri ve Üretim", 10); }
        else { addW("Faizsiz Enerji ve Sanayi", 30); addW("Katılım Gayrimenkul Fonları", 15); }
    } else { // Agresif Sermaye
        if (!isIslamic) { addW("Bilişim ve Yazılım Hisseleri", 30); addW("Savunma Hisseleri", 20); }
        else { addW("Faizsiz Bilişim ve Yazılım Hisseleri", 35); addW("Faizsiz Girişim Sermayesi", 15); }
    }

    // Q4: Makroekonomik Beklenti ve Korunma
    if (q4 === 1) { // Defansif Tüketim
        if (!isIslamic) { addW("Gıda ve İçecek / Perakende", 40); addW("İlaç ve Sağlık", 30); }
        else { addW("Faizsiz Gıda ve Perakende", 60); }
    } else if (q4 === 2) { // İhracat / Döviz
        if (!isIslamic) { addW("Otomotiv ve Yan Sanayi", 40); addW("Ulaştırma Hisseleri", 30); }
        else { addW("Faizsiz Enerji ve Sanayi", 50); } 
    } else { // Stratejik Tekel
        if (!isIslamic) { addW("Savunma Hisseleri", 40); addW("Enerji Teknolojileri ve Üretim", 30); }
        else { addW("Faizsiz Enerji ve Sanayi", 50); }
    }

    // Q5: Şirket Değerleme Felsefesi (Value vs Growth)
    if (q5 === 1) { // Değer & Temettü
        if (!isIslamic) { addW("Bankacılık Hisseleri", 40); addW("Holding Hisseleri", 30); }
        else { addW("Katılım Bankacılığı Hisseleri", 50); addW("Katılım Temettü Hisseleri", 20); }
    } else if (q5 === 2) { // Reel Varlık Koruma
        if (!isIslamic) { addW("Gayrimenkul Yatırım Ortaklıkları", 30); addW("Ana Metal ve İmalat Hisseleri", 20); addW("Taş, Toprak, Çimento Hisseleri", 20); }
        else { addW("Katılım Gayrimenkul Fonları", 50); }
    } else { // Büyüme & İnovasyon
        if (!isIslamic) { addW("Bilişim ve Yazılım Hisseleri", 40); addW("Girişim Sermayesi Yat. Ort.", 30); }
        else { addW("Faizsiz Bilişim ve Yazılım Hisseleri", 50); addW("Faizsiz Girişim Sermayesi", 20); }
    }

    // Q6: Kriz Reaksiyonu
    if (q6 === 1) { // Kaçış / Nakit
        if (!isIslamic) { addW("Para Piyasası Fonu / Repo", 30); addW("Fiziki Altın ve Gümüş", 30); }
        else { addW("Kira Sertifikası (Sukuk)", 40); addW("Fiziki Altın ve Gümüş", 30); }
    } else if (q6 === 2) { // Bekle
        if (!isIslamic) { addW("Holding Hisseleri", 20); addW("Eurobond", 20); }
        else { addW("Katılım Gayrimenkul Fonları", 20); addW("Faizsiz Enerji ve Sanayi", 20); }
    } else { // Maliyet Düşür (Alım Fırsatı)
        if (!isIslamic) { addW("Bilişim ve Yazılım Hisseleri", 20); addW("Ulaştırma Hisseleri", 20); }
        else { addW("Faizsiz Bilişim ve Yazılım Hisseleri", 30); }
    }

    // Q7: Psikoloji
    if (q7 === 1) { // Korkak/Korumacı
        if (!isIslamic) { addW("Para Piyasası Fonu / Repo", 20); addW("Tahvil ve Bono Fonları", 20); }
        else { addW("Kira Sertifikası (Sukuk)", 30); addW("Fiziki Altın ve Gümüş", 10); }
    } else if (q7 === 2) { // Rasyonel
        if (!isIslamic) { addW("Bankacılık Hisseleri", 15); addW("Holding Hisseleri", 15); }
        else { addW("Katılım Bankacılığı Hisseleri", 20); addW("Faizsiz Enerji ve Sanayi", 10); }
    } else { // Cesur
        if (!isIslamic) { addW("Girişim Sermayesi Yat. Ort.", 20); addW("Savunma Hisseleri", 20); }
        else { addW("Faizsiz Girişim Sermayesi", 25); }
    }

    // 3. Normalization (Convert weights to precise percentages summing to 100)
    let selectedAssets = Object.entries(assets)
        .filter(([name, data]) => data.weight > 0)
        .map(([name, data]) => ({ name, ...data }));
    
    // Sort by weight descending
    selectedAssets.sort((a, b) => b.weight - a.weight);

    // Keep top 6 to prevent over-diversification
    selectedAssets = selectedAssets.slice(0, 6);

    let totalWeight = selectedAssets.reduce((acc, curr) => acc + curr.weight, 0);
    
    let portfolio = selectedAssets.map(item => {
        let percentage = Math.round((item.weight / totalWeight) * 100);
        return {
            asset: item.name,
            percentage: percentage,
            color: item.color,
            description: item.desc
        };
    });

    // Fix rounding issues to exact 100
    let currentTotal = portfolio.reduce((acc, curr) => acc + curr.percentage, 0);
    if (currentTotal !== 100 && portfolio.length > 0) {
        portfolio[0].percentage += (100 - currentTotal);
    }
    
    // Eliminate 0% (if any rounding caused it)
    portfolio = portfolio.filter(p => p.percentage > 0);

    // 4. Define Profiles dynamically based on Score
    let profileName = "Optimum Denge";
    let aiAnalysis = "";
    let expectedAnnualReturn = 45;

    if (totalScore <= 11) {
        profileName = "Defansif Stratejist";
        expectedAnnualReturn = 38;
        aiAnalysis = `Analizlerime göre net bir şekilde sermaye korumaya ve düşük volatiliteye odaklanıyorsunuz. Kriz senaryolarındaki ihtiyatlı tutumunuz ve likidite arayışınız doğrultusunda, ${isIslamic ? "İslami prensiplere tam uyumlu," : ""} riskin sıfıra yakınsadığı, enflasyona karşı defansif bir koruma kalkanı inşa ettim.`;
    } else if (totalScore >= 12 && totalScore <= 16) {
        profileName = "Optimum Denge";
        expectedAnnualReturn = 55;
        aiAnalysis = `Tam bir 'rasyonel denge' yatırımcısısınız. Hem riskleri matematiğe dayalı yönetmek istiyor hem de enflasyonun üzerinde kalıcı büyüme arzuluyorsunuz. Sizin için, düşüşlerde hava yastığı görevi görecek nakit akışı araçları ile yükselişte ivme kazandıracak BIST büyüme sektörlerini ${isIslamic ? "İslami finansal süzgeçlerden geçirerek" : ""} birleştirdim.`;
    } else {
        profileName = "Alfa Odaklı";
        expectedAnnualReturn = 82;
        aiAnalysis = `Yüksek getiri iştahınız, uzun vade vizyonunuz ve piyasa krizlerini 'fırsat' olarak gören cesaretiniz olağanüstü. Sıradan ortalamalarla yetinmeyip Alfa'yı (piyasa üstü getiri) hedefleyen yapınız için, portföyünüzün omurgasını ${isIslamic ? "katılım şartlarını sağlayan" : ""} agresif büyüme sektörleri (Bilişim, Savunma, Girişim Sermayesi) üzerine konumlandırdım.`;
    }

    // Adjust return based on capital scale
    if (initialCapital > 1000000) expectedAnnualReturn -= 2; 
    else if (initialCapital < 50000) expectedAnnualReturn += 3; 

    // Select persuasive advantages randomly
    const advantagePools = {
      "Defansif Stratejist": [
        "Sermayenizin erimesini tamamen önleyen, gece rahat uyumanızı sağlayacak stressiz yatırım mimarisi.",
        "Anlık nakit ihtiyacında veya acil durumlarda hiçbir kayıp yaşamadan paranıza anında ulaşabilme özgürlüğü.",
        "Küresel paniklerden ve borsa çöküşlerinden izole edilmiş %100 korunaklı sağlam yapı.",
        "Beklenmedik hayat olaylarına karşı 'finansal bir yastık' görevi gören koruma kalkanı."
      ],
      "Optimum Denge": [
        "Düşüşlerde koruyan, yükselişlerde kazandıran efsanevi 'Altın Oran' mimarisiyle yatırımın akılcı hali.",
        "Güçlü sanayi ve bankacılık temettüleri ile hayatınıza düzenli, kesintisiz bir pasif nakit akışı entegrasyonu.",
        "Borsalar çakılırken zararı durduran, rekor kırarken kârdan mahrum bırakmayan esneklik.",
        "Rasyonel zekanızla uyumlu, farklı BIST sektörlerine ve makro varlıklara yayılan kusursuz çeşitlendirme."
      ],
      "Alfa Odaklı": [
        "Bilişim, Yazılım ve Savunma gibi geleceğin dev şirketlerine ortak olma ayrıcalığı.",
        "Bileşik getirinin gücüyle enflasyonu katlayarak ezen rakipsiz büyüme motoru.",
        "Piyasaların düştüğü günlerde bile cesaretinizi kâra dönüştüren elit strateji yapısı.",
        "Girişim sermayesi ve inovatif sanayi sektörleriyle, finansal özgürlüğünüze giden yolu yıllarca kısaltabilecek muazzam kazanç potansiyeli."
      ]
    };

    const pool = advantagePools[profileName as keyof typeof advantagePools];
    const shuffledPool = [...pool].sort((a, b) => {
        const hashA = (a.length * userSeed) % 100;
        const hashB = (b.length * userSeed) % 100;
        return hashA - hashB;
    });
    const advantages = shuffledPool.slice(0, 3);

    return NextResponse.json({
        profileName,
        aiAnalysis,
        expectedAnnualReturn,
        portfolio,
        advantages
    });

  } catch (error) {
    console.error("Algoritma Hatası:", error);
    return NextResponse.json({ error: "Sistem Hatası" }, { status: 500 });
  }
}
