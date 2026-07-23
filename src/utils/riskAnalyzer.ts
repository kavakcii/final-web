import { sectorMapping, getAssetSector } from '../data/sectorMapping';

export function generateDynamicAnalysis(
    viewMode: 'donut' | 'heatmap' | 'sector', 
    groupedAssets: any[], 
    totalValue: number, 
    prices: Record<string, number>,
    userDividends: any[] = []
): { text: string; level: 'LOW' | 'MEDIUM' | 'HIGH'; score: number; title: string; subtitle: string } {
    
    if (!groupedAssets || groupedAssets.length === 0 || totalValue === 0) {
        return { 
            title: "FinAi Analizi",
            subtitle: "Çeşitlendirme",
            text: "Henüz portföyünüzde analiz edilecek yeterli varlık bulunmuyor.", 
            level: 'LOW', 
            score: 10 
        };
    }

    // Sort by market value
    const sorted = [...groupedAssets].sort((a, b) => b.marketVal - a.marketVal);
    const topAsset = sorted[0];
    const topWeight = (topAsset.marketVal / totalValue) * 100;
    const assetCount = sorted.length;

    // Seed for pseudo-random dynamic text (changes every hour)
    const today = new Date();
    const seed = today.getFullYear() + today.getMonth() + today.getDate() + today.getHours();
    
    // Helper to pick random item from array based on seed
    const pickRandom = (arr: string[]) => arr[(seed + assetCount) % arr.length];

    if (viewMode === 'donut') {
        // --- 1. AĞIRLIK (HHI) ANALİZİ ---
        let hhi = 0;
        sorted.forEach(asset => {
            const weight = asset.marketVal / totalValue;
            hhi += (weight * 100) ** 2;
        });

        let hhiScore = 5 - (hhi / 2000); 
        if (hhiScore < 0) hhiScore = 0;
        if (hhiScore > 5) hhiScore = 5;

        let countScore = 0;
        if (assetCount <= 2) countScore = 0;
        else if (assetCount <= 4) countScore = 2;
        else if (assetCount <= 12) countScore = 4;
        else countScore = 3;

        let rawScore = hhiScore + countScore;
        if (rawScore < 1) rawScore = 1;
        if (rawScore > 10) rawScore = 10;
        const score = Math.round(rawScore * 10) / 10;

        let level: 'LOW'|'MEDIUM'|'HIGH' = 'LOW';
        if (score < 5 || hhi > 2500 || topWeight > 50) level = 'HIGH';
        else if (score < 7.5 || hhi > 1500 || topWeight > 30) level = 'MEDIUM';

        const intros = [
            "Ağırlık analizi sonuçlarına göre,",
            "Varlık dağılım haritasına baktığımızda,",
            "Portföyünüzün büyüklük yapısını incelediğimde,"
        ];

        let body = "";
        let advice = "";

        if (level === 'HIGH') {
            body = pickRandom([
                `en büyük hisseniz olan ${topAsset.symbol} (%${topWeight.toFixed(1)}) sepeti tamamen domine ediyor.`,
                `paranızı çok az sayıda hisseye veya tek bir hisseye (${topAsset.symbol}) yığdığınızı görüyorum.`,
                `yoğunlaşma oranınız oldukça yüksek; paranızın büyük kısmı tek bir damara bağlı.`
            ]);
            advice = pickRandom([
                "Olası bir dalgalanmada tüm portföyünüzün sarsılmaması için yatırımlarınızı daha homojen bölmeyi düşünebilirsiniz.",
                "Bu durum olası kârı artırsa da, ters giden bir haberde ana paranızı ciddi riske atar. Dengelemek isteyebilirsiniz.",
                "Tek hisseye bağımlılık büyük bir risktir. Sepetinizdeki riskleri farklı varlıklara dağıtmak defansif bir hamle olacaktır."
            ]);
        } else if (level === 'MEDIUM') {
            body = pickRandom([
                `orta düzeyli bir çeşitlendirmeye sahipsiniz. En ağırlıklı hisseniz ${topAsset.symbol} (%${topWeight.toFixed(1)}).`,
                `${assetCount} farklı hisseye sahip olmanız güzel ancak bazı hisselerin ağırlığı hala çok yüksek.`,
                `dağılımınız fena değil, ancak ${topAsset.symbol} gibi bazı majör kalemler yönü belirliyor.`
            ]);
            advice = pickRandom([
                "Daha stabil bir büyüme eğrisi yakalamak için diğer hisselerinizin ağırlığını biraz artırmayı gözden geçirebilirsiniz.",
                "Piyasa düzeltmelerine karşı daha sağlam durabilmek için ufak ağırlıklı varlıklarınızı güçlendirmek mantıklı olabilir.",
                "Bu yapı sürdürülebilir, ancak çeşitlendirmeyi bir adım daha ileri taşıyarak riski tamamen bölebilirsiniz."
            ]);
        } else {
            body = pickRandom([
                `hiçbir hissenizin (%${topWeight.toFixed(1)} ile ${topAsset.symbol} dahi) portföyü tehlikeli düzeyde domine etmediğini görüyorum.`,
                `varlıklarınızın son derece dengeli ve sağlıklı bölündüğünü tespit ettim.`,
                `risk yoğunlaşması yaşamadığınız, çok homojen bir dağılımınız var.`
            ]);
            advice = pickRandom([
                "Profesyonel fon yöneticilerinin kullandığı bu defansif strateji, uzun vadeli güvenli büyüme için mükemmeldir.",
                "Bu dağılım şekli sizi şirkete özgü olumsuz haber şoklarından çok iyi koruyacaktır. Stratejinizi koruyabilirsiniz.",
                "Riski bu kadar iyi dağıtmanız piyasa fırtınalarında bile ayakta kalmanızı sağlar."
            ]);
        }
        
        let extraContext = "";
        const topSector = getAssetSector(topAsset.symbol);
        const givesDividend = userDividends && userDividends.some(d => d.stock === topAsset.symbol);
        
        if (givesDividend) {
            extraContext = pickRandom([
                ` Ayrıca en büyük hisseniz olan ${topAsset.symbol}, temettü verimliliğiyle portföyünüze düzenli nakit akışı sağlayarak pasif gelirinizi destekliyor.`,
                ` ${topAsset.symbol}'nin temettü ödeme alışkanlığı, düşüşlerde bile elinizde tutmanız için size psikolojik ve maddi bir kalkan sağlıyor.`,
                ` Ağırlıklı hissenizin (${topAsset.symbol}) temettü veriyor olması, bu yoğunlaşmanın getirdiği riski nakit akışıyla bir nebze tolere edilebilir kılıyor.`
            ]);
        } else if (topSector === 'Yatırım Fonu') {
            extraContext = pickRandom([
                ` Ayrıca portföyünüzün aslan payının (${topAsset.symbol}) bir fon tarafından yönetiliyor olması, aslında arka planda sizin yerinize profesyonellerin riski dağıttığı anlamına gelir.`,
                ` En büyük yatırımınız olan ${topAsset.symbol}'nin bir fon olması, tek bir şirkete değil, profesyonel bir sepete yatırım yaptığınızı gösteriyor. Bu çok sağlıklı bir yaklaşımdır.`,
                ` Portföyünüzü sürükleyen kalemin (${topAsset.symbol}) Yatırım Fonu olması riskinizi kendi içinde optimize eden akıllıca bir defans hamlesidir.`
            ]);
        } else if (topSector === 'Emtia') {
            extraContext = pickRandom([
                ` Paranızın büyük bir kısmının güvenli liman olan emtiada (${topAsset.symbol}) olması, krizlere karşı sizi koruyacaktır.`,
                ` Ana varlığınızın ${topAsset.symbol} gibi bir emtia olması, borsadaki sert dalgalanmalardan nispeten daha az yara almanızı sağlar.`
            ]);
        }

        return {
            title: "FinAi Ağırlık Analizi",
            subtitle: "Çeşitlendirme Skoru",
            text: `${pickRandom(intros)} ${body} ${advice}${extraContext}`,
            level,
            score
        };
    }

    if (viewMode === 'heatmap') {
        // --- 2. MOMENTUM & KÂRLILIK ANALİZİ ---
        let totalCost = 0;
        let totalCurrent = 0;
        sorted.forEach(a => {
            totalCost += a.avgCost * a.totalQuantity;
            totalCurrent += (prices[a.symbol] || a.avgCost) * a.totalQuantity;
        });

        const overallProfitPct = totalCost > 0 ? ((totalCurrent - totalCost) / totalCost) * 100 : 0;
        
        let score = 5;
        if (overallProfitPct > 20) score = 9.5;
        else if (overallProfitPct > 10) score = 8.0;
        else if (overallProfitPct > 0) score = 6.5;
        else if (overallProfitPct > -10) score = 4.0;
        else score = 2.0;

        let level: 'LOW'|'MEDIUM'|'HIGH' = 'LOW';
        if (score < 5) level = 'HIGH'; // High risk (losing money)
        else if (score < 7) level = 'MEDIUM';

        const intros = [
            "Isı haritası ve momentum verilerine göre,",
            "Mevcut piyasa performansı ve kârlılık durumunuza baktığımızda,",
            "Güncel fiyatlamalar ışığında,"
        ];

        let body = "";
        let advice = "";

        if (overallProfitPct < 0) {
            body = pickRandom([
                `portföyünüz genel hatlarıyla %${Math.abs(overallProfitPct).toFixed(1)} ekside görünüyor ve ağırlıklı varlıklar kan kaybediyor.`,
                `kırmızı kutuların büyüklüğü ve koyuluğu, yatırımlarınızın baskı altında olduğunu işaret ediyor.`,
                `toplam kârlılığınız negatif bölgede seyrediyor.`
            ]);
            advice = pickRandom([
                "Zararı derinleşen şirketlerin bilançolarını ve temel hikayelerini tekrar gözden geçirmeniz faydalı olabilir.",
                "Piyasa koşulları zorluysa nakit pozisyonuna geçmek veya maliyet düşürme fırsatlarını incelemek gerekebilir.",
                "Geçici bir piyasa düşüşü mü yoksa şirket bazlı bir sorun mu olduğunu iyi analiz etmenizi öneririm."
            ]);
        } else if (overallProfitPct < 15) {
            body = pickRandom([
                `portföyünüz ılımlı bir yeşil bölgede (%${overallProfitPct.toFixed(1)} kâr) ilerliyor.`,
                `bazı hisseler kârda, bazıları zararda olsa da genel toplamda pozitif bölgedesiniz.`,
                `yavaş ama istikrarlı bir momentum yakaladığınızı görüyorum.`
            ]);
            advice = pickRandom([
                "Yeşil (kârlı) olan hisselerde trendi izlerken, kırmızıda kalanların neden geride kaldığını araştırabilirsiniz.",
                "Karlılığınızı artırmak için zayıf halkaları budayıp güçlü trendlere ağırlık vermeyi düşünebilirsiniz.",
                "Mevcut pozisyonlarınızı koruyarak ivmenin devamını takip etmek şu an için mantıklı görünüyor."
            ]);
        } else {
            body = pickRandom([
                `%${overallProfitPct.toFixed(1)} gibi güçlü bir genel kârlılıkla haritanızı koyu yeşile boyamış durumdasınız.`,
                `ağırlıklı hisselerinizin harika bir ivme yakaladığını ve yüksek performans gösterdiğini görüyorum.`,
                `muazzam bir kâr marjı yakalamışsınız, momentum tamamen sizin lehinize işliyor.`
            ]);
            advice = pickRandom([
                "Bu seviyelerde belirli hedeflere ulaşan hisselerde ufak kâr realizasyonları (kâr alımları) yapmak psikolojinizi rahatlatabilir.",
                "Trend sürdüğü müddetçe pozisyonları taşımak iyi olsa da, piyasa döngülerini unutmamak gerekir.",
                "Bu güçlü getirileri korumak adına iz süren stop (trailing stop) seviyelerini belirlemenizi tavsiye ederim."
            ]);
        }

        let extra = "";
        if (userDividends.length > 0) {
            extra = " Ayrıca, temettü gelirleriniz piyasa dalgalanmalarına karşı ekstra bir tampon sağlamaya devam ediyor.";
        }

        return {
            title: "FinAi Momentum Analizi",
            subtitle: "Karlılık Skoru",
            text: `${pickRandom(intros)} ${body} ${advice}${extra}`,
            level,
            score
        };
    }

    if (viewMode === 'sector') {
        // --- 3. SEKTÖR ANALİZİ (Hisse Adet Oranına Göre) ---
        const totalCount = sorted.length;
        const sectorWeights: Record<string, number> = {};

        sorted.forEach(asset => {
            const weight = (1 / totalCount) * 100;
            const sector = getAssetSector(asset.symbol);
            sectorWeights[sector] = (sectorWeights[sector] || 0) + weight;
        });

        // Calculate Sector HHI
        let sectorHhi = 0;
        Object.values(sectorWeights).forEach(w => {
            sectorHhi += w ** 2;
        });

        let score = 10 - (sectorHhi / 1000);
        if (score < 1) score = 1;
        if (score > 10) score = 10;
        score = Math.round(score * 10) / 10;

        let level: 'LOW'|'MEDIUM'|'HIGH' = 'LOW';
        if (score < 4) level = 'HIGH';
        else if (score < 7) level = 'MEDIUM';

        // Find biggest sector
        let topSector = "";
        let topSectorWeight = 0;
        Object.entries(sectorWeights).forEach(([sec, w]) => {
            if (w > topSectorWeight) {
                topSectorWeight = w;
                topSector = sec;
            }
        });
        const topSectorName = topSector;

        const intros = [
            "Sektörel ısı haritasına baktığımızda,",
            "Yatırımlarınızın iş kollarına dağılımını incelediğimde,",
            "Endüstriyel çeşitlendirme analizinize göre,"
        ];

        let body = "";
        let advice = "";

        if (level === 'HIGH') {
            body = pickRandom([
                `büyük oranda tek bir sektöre (örneğin ${topSectorName} sektörüne) yığılmışsınız.`,
                `${topSectorName} sektörü (%${topSectorWeight.toFixed(1)}) portföyünüzün ana damarı haline gelmiş durumda.`,
                `neredeyse tüm varlıklarınızı ${topSectorName} gibi kısıtlı alanlara park etmişsiniz.`
            ]);
            advice = pickRandom([
                "O sektörde yaşanacak sektörel bir kriz tüm kârınızı silebilir. Başka iş kollarına da yatırım yaparak (örneğin teknolojiye karşı gıda) riski bölmelisiniz.",
                "Zıt ekonomik döngülerde kazandıran sektörleri sepetinize katarak portföyünüzün 'kırılganlığını' azaltın.",
                "Bir ülkenin ekonomisi tek sektörle dönmediği gibi, portföyünüz de dönmemeli. Farklı sektörleri araştırmaya başlayın."
            ]);
        } else if (level === 'MEDIUM') {
            body = pickRandom([
                `birkaç farklı sektöre dağılmışsınız ancak '${topSectorName}' sektörü %${topSectorWeight.toFixed(1)} ile hala çok baskın.`,
                `çeşitlendirme çabanız var fakat ${topSectorName} ağırlığınız hala ortalamanın üzerinde risk teşkil ediyor.`,
                `ana gövdeniz ${topSectorName} şirketlerinden oluşsa da yan dallarınız oluşmaya başlamış.`
            ]);
            advice = pickRandom([
                "Farklı ekonomik döngülerde çalışan zıt sektörleri portföye katmak dalgaları yumuşatır.",
                "Örneğin faizlerin arttığı veya azaldığı dönemlerde farklı tepki veren sektörleri bir araya getirmeyi hedefleyin.",
                "Biraz daha 'korelasyonu düşük' (biri düşerken diğeri çıkabilen) sektörler ekleyerek dengeyi kurabilirsiniz."
            ]);
        } else {
            body = pickRandom([
                `yatırımlarınızı '${topSectorName}' gibi sektörler başta olmak üzere birçok farklı alana mükemmel şekilde dağıtmışsınız.`,
                `sanayiden hizmetlere kadar geniş bir yelpazede, birbirini dengeleyen harika bir ekosistem kurmuşsunuz.`,
                `sektörel dağılımınız adeta küçük bir endeks gibi dengeli ve profesyonel.`
            ]);
            advice = pickRandom([
                "Bu strateji, kriz anlarında 'kalkan' görevi görecektir. Mevcut dağılım disiplininizi korumaya devam edin.",
                "Bu sayede bir sektör batarken diğeri portföyünüzü sırtlayabilir. Tam bir defans ustasısınız.",
                "Hiçbir sektörün sizi tek başına aşağı çekemeyeceği kadar sağlıklı bir yapı. Aynen böyle devam."
            ]);
        }

        let extraContext = "";
        if (topSectorName === 'Yatırım Fonu' && topSectorWeight > 20) {
            extraContext = pickRandom([
                ` Portföyünüzün önemli bir kısmının Yatırım Fonlarında toplanması, sektörel çeşitlendirmeyi zaten sizin yerinize profesyonellerin yaptığının güzel bir göstergesi.`,
                ` Ağırlığın fonlarda olması, bu analizdeki yoğunlaşma riskinizi tamamen minimize eden en büyük avantajınızdır.`
            ]);
        }

        return {
            title: "FinAi Sektör Analizi",
            subtitle: "Sektörel Denge",
            text: `${pickRandom(intros)} ${body} ${advice}`,
            level,
            score
        };
    }

    return { 
        title: "FinAi Analizi",
        subtitle: "Çeşitlendirme",
        text: "Analiz edilemedi.", 
        level: 'LOW', 
        score: 0 
    };
}
