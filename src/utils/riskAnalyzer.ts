export function generateRiskAnalysisText(groupedAssets: any[], totalValue: number): { text: string; level: 'LOW' | 'MEDIUM' | 'HIGH'; score: number } {
    if (!groupedAssets || groupedAssets.length === 0 || totalValue === 0) {
        return { text: "Henüz portföyünüzde analiz edilecek yeterli varlık bulunmuyor.", level: 'LOW', score: 10 };
    }

    // Sort by market value descending
    const sorted = [...groupedAssets].sort((a, b) => b.marketVal - a.marketVal);
    
    // Calculate Herfindahl-Hirschman Index (HHI) for concentration
    let hhi = 0;
    sorted.forEach(asset => {
        const weight = asset.marketVal / totalValue;
        hhi += (weight * 100) ** 2; // HHI is sum of squares of percentages
    });

    const topAsset = sorted[0];
    const topWeight = (topAsset.marketVal / totalValue) * 100;

    // Risk Categories based on HHI and Top Asset Weight
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let rawScore = 10 - (hhi / 1000); // Inverse relationship: higher HHI = lower score
    if (rawScore < 1) rawScore = 1;
    if (rawScore > 10) rawScore = 10;
    const score = Math.round(rawScore * 10) / 10;

    if (hhi > 2500 || topWeight > 50) riskLevel = 'HIGH';
    else if (hhi > 1500 || topWeight > 30) riskLevel = 'MEDIUM';

    // Randomize text variations to avoid repetitive, robotic responses
    const variations = {
        HIGH: [
            `Portföyünüzün %${topWeight.toFixed(1)}'i tek bir varlıkta (${topAsset.symbol}) toplanmış durumda. Bu durum potansiyel kârı artırsa da, dalgalanmalara karşı kırılganlığınızı önemli ölçüde yükseltiyor. Çeşitlendirme yapmanız riski dağıtmanıza yardımcı olabilir.`,
            `Varlıklarınızın büyük çoğunluğunun tek bir hissede (${topAsset.symbol}) konumlanması, sektörel ve şirkete özgü riskleri doğrudan üstlenmenize neden oluyor. Çeşitlendirme skorunuz düşük görünüyor.`,
            `Dikkat çeken bir yoğunlaşma mevcut. ${topAsset.symbol} hissesindeki %${topWeight.toFixed(1)}'lik ağırlık, portföyünüzün kaderini büyük ölçüde bu varlığa bağlıyor. Farklı sektörlere yönelmek daha dengeli bir büyüme sağlayabilir.`
        ],
        MEDIUM: [
            `Portföyünüz orta seviye bir dağılıma sahip. En büyük ağırlığınız %${topWeight.toFixed(1)} ile ${topAsset.symbol} tarafında. Bir miktar daha çeşitlendirme ile daha stabil bir getiri eğrisi yakalayabilirsiniz.`,
            `Dağılımınız fena değil ancak ${topAsset.symbol} üzerindeki yoğunluk dikkate değer. Piyasa düzeltmelerine karşı defansif kalabilmek için farklı varlık sınıfları eklenebilir.`,
            `Çeşitlendirme skorunuz dengeli sayılır. Yine de ${topAsset.symbol} oranını yakından takip etmekte fayda var; piyasa yön değişimlerinde portföyünüzü en çok etkileyecek kalem bu görünüyor.`
        ],
        LOW: [
            `Tebrikler, portföyünüz oldukça sağlıklı ve geniş bir alana yayılmış durumda. En yüksek ağırlıklı varlığınız (${topAsset.symbol}) bile toplamı domine etmiyor. Dalgalanmalara karşı güçlü bir kalkanınız var.`,
            `Profesyonel bir fon yöneticisi gibi çeşitlendirme yapmışsınız. Varlıklarınız dengeli dağılmış, bu da spesifik şirket risklerini minimize ediyor. Uzun vadede en güvenli stratejilerden biri.`,
            `Risk dağılımınız harika. Hiçbir hissenin ağırlığı portföyünüzü tek başına tehdit edecek boyutta değil. Bu strateji ile sürdürülebilir büyüme hedefinize emin adımlarla ilerleyebilirsiniz.`
        ]
    };

    const list = variations[riskLevel];
    // Seeded random based on today's date so it changes daily but doesn't flicker on every re-render
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const randomIndex = (seed + sorted.length) % list.length;
    
    return { text: list[randomIndex], level: riskLevel, score };
}
