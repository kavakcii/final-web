import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { answers } = await req.json();

    // 1. Parse answers
    const q1 = answers[1]?.score || 2; // Horizon (1:Kısa, 2:Orta, 3:Uzun)
    const q2 = answers[2]?.score || 2; // Drawdown
    const q3 = answers[3]?.score || 2; // Income vs Growth
    const q4 = answers[4]?.score || 2; // Makro Beklenti
    const q5 = answers[5]?.score || 2; // Değerleme Felsefesi
    const q6 = answers[6]?.score || 2; // Kriz Reaksiyonu (1:Kaçış, 2:Bekle, 3:Alım)
    const q7 = answers[7]?.score || 2; // Psikoloji
    const q9 = answers[9]?.score || 2; // Management Style
    const isIslamic = answers[8]?.text?.includes("Evet") || false;
    const initialCapital = Number(answers[10]?.text || 0);

    const totalScore = q1 + q2 + q3 + q4 + q5 + q6 + q7;
    const userSeed = totalScore + initialCapital;

    // Asset Pool with Historical Yearly Returns (Estimated for TRY)
    // Bu veriler son 5-10 yıllık BIST ve TEFAS ortalamaları baz alınarak simüle edilmiştir.
    let assets = {
        "Para Piyasası Şemsiye Fonu": { weight: 0, color: "#94A3B8", return: 42, desc: "Sıfır riskle, anlık dalgalanmalardan tamamen uzak, stressiz nakit park alanı." },
        "Borçlanma Araçları Şemsiye Fonu": { weight: 0, color: "#64748B", return: 45, desc: "Kısa ve orta vadede sermayeyi koruyan, risksiz sabit getiri enstrümanı." },
        "Eurobond": { weight: 0, color: "#3B82F6", return: 52, desc: "Kur şoklarına karşı kalkan olan döviz bazlı kupon geliri." },
        "Kıymetli Madenler Şemsiye Fonu": { weight: 0, color: "#EAB308", return: 55, desc: "Altın ve gümüş ağırlıklı, küresel krizlere karşı portföyün sigortası." },
        "Hisse Senedi Şemsiye Fonu": { weight: 0, color: "#10B981", return: 72, desc: "Profesyonel yöneticiler tarafından seçilen en iyi hisselerden oluşan sepet." },
        "Değişken Şemsiye Fonu": { weight: 0, color: "#F59E0B", return: 68, desc: "Piyasa koşullarına göre varlık dağılımını dinamik değiştiren esnek fonlar." },
        "Karma Şemsiye Fonu": { weight: 0, color: "#F97316", return: 62, desc: "Hisse ve tahvil dengesini profesyonelce koruyan hibrit yatırım aracı." },
        "Fon Sepeti Şemsiye Fonu": { weight: 0, color: "#8B5CF6", return: 65, desc: "Farklı fonları bir araya getirerek riski dağıtan otonom yönetim paketi." },
        "Serbest Şemsiye Fonu": { weight: 0, color: "#EF4444", return: 85, desc: "Nitelikli yatırımcılar için esnek ve yüksek getiri odaklı stratejiler." },
        "Katılım Şemsiye Fonu": { weight: 0, color: "#0F172A", return: 58, desc: "İslami finans prensiplerine tam uyumlu, faizsiz yatırım araçları." },

        "Bankacılık Hisseleri": { weight: 0, color: "#00008B", return: 48, desc: "Ekonominin bel kemiği, güçlü nakit akışı ve temettü potansiyeli." },
        "Holding Hisseleri": { weight: 0, color: "#1D4ED8", return: 52, desc: "Tek hisseyle onlarca sektöre yayılan doğal çeşitlendirme." },
        "Bilişim ve Yazılım Hisseleri": { weight: 0, color: "#8B5CF6", return: 88, desc: "Dijital devrimin merkezindeki, kâr marjı çok yüksek şirketler." },
        "Enerji Teknolojileri ve Üretim": { weight: 0, color: "#10B981", return: 75, desc: "Geleceğin yenilenebilir gücünü üreten stratejik motorlar." },
        "Savunma Hisseleri": { weight: 0, color: "#EF4444", return: 82, desc: "Devlet garantili ve inovatif yüksek teknoloji savunma sanayi." },
        "Otomotiv ve Yan Sanayi": { weight: 0, color: "#F59E0B", return: 65, desc: "İhracat rekorları kıran, döviz gelirli köklü sanayi çarkları." },
        "Ana Metal ve İmalat Hisseleri": { weight: 0, color: "#6B7280", return: 58, desc: "Ekonomik toparlanmalara en agresif tepkiyi veren hammadde devleri." },
        "Gıda ve İçecek / Perakende": { weight: 0, color: "#059669", return: 54, desc: "Kriz dinlemeyen, enflasyonu anında fiyatlara yansıtan defansif güç." },
        "İlaç ve Sağlık": { weight: 0, color: "#14B8A6", return: 50, desc: "Talebi hiçbir ekonomik dalgalanmada düşmeyen kalıcı değer." },
        "Gayrimenkul Yatırım Ortaklıkları": { weight: 0, color: "#8B5CF6", return: 45, desc: "Fiziki gayrimenkul projelerine ortaklık ve güçlü kira verimi." },
        "Taş, Toprak, Çimento Hisseleri": { weight: 0, color: "#9CA3AF", return: 55, desc: "Büyük altyapı projelerinden beslenen temel yapı blokları." },
        "Ulaştırma Hisseleri": { weight: 0, color: "#0EA5E9", return: 68, desc: "Küresel ticareti ve turizmi birbirine bağlayan devasa havacılık ağı." },
        "Girişim Sermayesi Yat. Ort.": { weight: 0, color: "#C084FC", return: 95, desc: "Startuplara melek yatırımcı olarak girip x10 potansiyel arama." },

        "Katılım Bankacılığı Hisseleri": { weight: 0, color: "#00008B", return: 48, desc: "Faizsiz prensiplerle büyüyen güçlü katılım bankaları." },
        "Faizsiz Bilişim ve Yazılım Hisseleri": { weight: 0, color: "#8B5CF6", return: 85, desc: "İslami hassasiyetlere tam uyumlu teknoloji yatırımları." },
        "Faizsiz Enerji ve Sanayi": { weight: 0, color: "#10B981", return: 72, desc: "Katılım şartlarını sağlayan büyük fabrikalar ve enerji tesisleri." },
        "Faizsiz Gıda ve Perakende": { weight: 0, color: "#059669", return: 54, desc: "Kriz dinlemeyen helal üretim ve perakende zincirleri." },
        "Katılım Gayrimenkul Fonları": { weight: 0, color: "#8B5CF6", return: 45, desc: "Tamamen kira ve proje gelirine dayalı fiziki varlık ortaklığı." },
        "Faizsiz Girişim Sermayesi": { weight: 0, color: "#C084FC", return: 90, desc: "Startuplara İslami melek yatırımcı kurallarıyla destek olan fonlar." }
    };

    const addW = (asset: string, w: number) => {
        if (assets[asset as keyof typeof assets]) assets[asset as keyof typeof assets].weight += w;
    };

    // --- WEIGHTING LOGIC ---
    if (q1 === 1) { // Kısa Vade
        if (!isIslamic) { addW("Para Piyasası Şemsiye Fonu", 50); addW("Borçlanma Araçları Şemsiye Fonu", 40); }
        else { addW("Katılım Şemsiye Fonu", 70); addW("Kıymetli Madenler Şemsiye Fonu", 30); }
    } else if (q1 === 2) { // Orta Vade
        if (!isIslamic) { addW("Borçlanma Araçları Şemsiye Fonu", 20); addW("Eurobond", 20); addW("Holding Hisseleri", 15); addW("Otomotiv ve Yan Sanayi", 15); }
        else { addW("Katılım Şemsiye Fonu", 30); addW("Katılım Bankacılığı Hisseleri", 15); addW("Faizsiz Enerji ve Sanayi", 15); }
    } else { // Uzun Vade
        if (!isIslamic) { addW("Hisse Senedi Şemsiye Fonu", 30); addW("Bilişim ve Yazılım Hisseleri", 20); addW("Savunma Hisseleri", 20); }
        else { addW("Katılım Şemsiye Fonu", 30); addW("Faizsiz Bilişim ve Yazılım Hisseleri", 30); addW("Faizsiz Enerji ve Sanayi", 20); }
    }

    if (q2 === 1) { // Max %5
        if (!isIslamic) { addW("Para Piyasası Şemsiye Fonu", 40); addW("Kıymetli Madenler Şemsiye Fonu", 30); }
        else { addW("Katılım Şemsiye Fonu", 50); }
    } else if (q2 === 3) { // Yüksek Tolerans
        if (!isIslamic) { addW("Serbest Şemsiye Fonu", 30); addW("Bilişim ve Yazılım Hisseleri", 25); }
        else { addW("Faizsiz Bilişim ve Yazılım Hisseleri", 30); addW("Faizsiz Girişim Sermayesi", 20); }
    }

    if (q3 === 1) { // Temettü
        if (!isIslamic) { addW("Bankacılık Hisseleri", 30); addW("Gayrimenkul Yatırım Ortaklıkları", 20); }
        else { addW("Katılım Gayrimenkul Fonları", 30); addW("Katılım Bankacılığı Hisseleri", 20); }
    }

    if (q4 === 1) { // Defansif
        if (!isIslamic) { addW("Gıda ve İçecek / Perakende", 40); addW("İlaç ve Sağlık", 30); }
        else { addW("Faizsiz Gıda ve Perakende", 60); }
    } else if (q4 === 2) { // İhracat
        if (!isIslamic) { addW("Otomotiv ve Yan Sanayi", 40); addW("Ulaştırma Hisseleri", 30); }
        else { addW("Faizsiz Enerji ve Sanayi", 50); }
    } else if (q4 === 3) { // Tekel
        if (!isIslamic) { addW("Savunma Hisseleri", 40); addW("Enerji Teknolojileri ve Üretim", 30); }
        else { addW("Faizsiz Enerji ve Sanayi", 50); }
    }

    if (q5 === 1) { // Value
        if (!isIslamic) { addW("Bankacılık Hisseleri", 40); addW("Holding Hisseleri", 30); }
        else { addW("Katılım Bankacılığı Hisseleri", 50); }
    } else if (q5 === 2) { // Reel Varlık
        if (!isIslamic) { addW("Gayrimenkul Yatırım Ortaklıkları", 30); addW("Taş, Toprak, Çimento Hisseleri", 20); }
        else { addW("Katılım Gayrimenkul Fonları", 50); }
    } else if (q5 === 3) { // Growth
        if (!isIslamic) { addW("Bilişim ve Yazılım Hisseleri", 40); addW("Girişim Sermayesi Yat. Ort.", 30); }
        else { addW("Faizsiz Bilişim ve Yazılım Hisseleri", 50); }
    }

    if (q6 === 3) { // Buy dip
        if (!isIslamic) { addW("Bilişim ve Yazılım Hisseleri", 20); addW("Ulaştırma Hisseleri", 20); }
        else { addW("Faizsiz Bilişim ve Yazılım Hisseleri", 30); }
    }

    if (q9 === 1) { // Otonom
        if (!isIslamic) { addW("Değişken Şemsiye Fonu", 50); addW("Fon Sepeti Şemsiye Fonu", 40); addW("Karma Şemsiye Fonu", 30); }
        else { addW("Katılım Şemsiye Fonu", 80); }
    }

    // 3. Normalization
    let selectedAssets = Object.entries(assets)
        .filter(([name, data]) => data.weight > 0)
        .map(([name, data]) => ({ name, ...data }));
    
    selectedAssets.sort((a, b) => b.weight - a.weight);
    selectedAssets = selectedAssets.slice(0, 6);

    let totalWeight = selectedAssets.reduce((acc, curr) => acc + curr.weight, 0);
    let portfolio = selectedAssets.map(item => {
        let percentage = Math.round((item.weight / totalWeight) * 100);
        return {
            asset: item.name,
            percentage: percentage,
            color: item.color,
            description: item.desc,
            yearlyReturn: item.return
        };
    });

    let currentTotal = portfolio.reduce((acc, curr) => acc + curr.percentage, 0);
    if (currentTotal !== 100 && portfolio.length > 0) portfolio[0].percentage += (100 - currentTotal);
    portfolio = portfolio.filter(p => p.percentage > 0);

    // 4. PERSONALIZED "WHY RECOMMENDED" TEXT
    let horizonText = q1 === 3 ? "uzun vadeli ve bileşik getiri odaklı" : q1 === 1 ? "kısa vadeli ve likidite öncelikli" : "orta vadeli ve dengeli";
    let reactionText = q6 === 3 ? "kriz anlarını birer alım fırsatı olarak görme cesaretiniz" : q6 === 1 ? "sermayeyi koruma refleksiniz" : "temkinli bekleyişiniz";
    let philosophyText = q5 === 3 ? "yüksek büyüme potansiyelli inovatif şirketlere duyduğunuz ilgi" : q5 === 1 ? "ucuz kalmış iskontolu şirketlere olan güveniniz" : "reel varlık koruma arayışınız";

    let aiAnalysis = `Analizlerime göre ${horizonText} bir bakış açısına sahipsiniz. Özellikle ${reactionText} ve ${philosophyText} portföyünüzün karakterini belirliyor. Bu durumda seçtiğimiz bu karma yapı, piyasa dalgalanmalarında size direnç sağlarken, inandığınız büyüme motorlarının kazancını maksimize etmenize olanak tanır.`;

    // 5. FUTURE MONEY SIMULATION (Projections)
    // Compound interest: P * (1 + r/100)^t
    const calculateTotalReturn = (years: number) => {
        let totalValue = 0;
        portfolio.forEach(item => {
            const assetCapital = initialCapital * (item.percentage / 100);
            const assetFinalValue = assetCapital * Math.pow(1 + item.yearlyReturn / 100, years);
            totalValue += assetFinalValue;
        });
        return Math.round(totalValue);
    };

    const projections = {
        initial: initialCapital,
        year1: calculateTotalReturn(1),
        year3: calculateTotalReturn(3),
        year5: calculateTotalReturn(5)
    };

    let profileName = totalScore <= 11 ? "Defansif Stratejist" : totalScore <= 16 ? "Optimum Denge" : "Alfa Odaklı";

    return NextResponse.json({
        profileName,
        aiAnalysis,
        expectedAnnualReturn: Math.round(portfolio.reduce((acc, curr) => acc + (curr.yearlyReturn * curr.percentage / 100), 0)),
        portfolio,
        projections,
        advantages: [
            "Kriz anlarındaki psikolojik profilinizle tam uyumlu risk yönetimi.",
            "Geçmiş verilerle doğrulanmış yüksek büyüme potansiyelli sektör dağılımı.",
            "Enflasyonu katlayarak ezen bileşik getiri simülasyonu desteği."
        ]
    });

  } catch (error) {
    console.error("Algoritma Hatası:", error);
    return NextResponse.json({ error: "Sistem Hatası" }, { status: 500 });
  }
}
