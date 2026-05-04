export interface SimulationPoint {
    time: number;
    price: number;
    event?: string;
}

export interface UserAction {
    time: number;
    price: number;
    type: 'BUY' | 'SELL' | 'HOLD';
}

export type InvestorProfile = 'PANIC_SELLER' | 'VALUE_HUNTER' | 'FOMO_FOLLOWER' | 'PATIENT_INVESTOR' | 'OVERCONFIDENT';

// 60 Saniyelik Şok Senaryosu Verisi (BIST Karakterli)
export const SHOCK_SCENARIO: SimulationPoint[] = [
    { time: 0, price: 100 }, { time: 5, price: 102 }, { time: 10, price: 105, event: 'Pozitif Başlangıç' },
    { time: 15, price: 103 }, { time: 20, price: 108 }, { time: 25, price: 115, event: 'Yükseliş Trendi' },
    { time: 30, price: 110 }, { time: 35, price: 95, event: 'BEKLENMEDİK HABER' },
    { time: 40, price: 82, event: 'PANİK SATIŞ BAŞLADI' }, { time: 45, price: 78 },
    { time: 50, price: 85, event: 'DİPTEN DÖNÜŞ' }, { time: 55, price: 92 }, { time: 60, price: 98 }
];

// Linear interpolation to make the chart smooth (60 points)
export const getSmoothScenario = () => {
    const points: SimulationPoint[] = [];
    for (let i = 0; i <= 60; i++) {
        const start = SHOCK_SCENARIO.find(p => p.time <= i && SHOCK_SCENARIO[SHOCK_SCENARIO.indexOf(p) + 1]?.time > i) || SHOCK_SCENARIO[SHOCK_SCENARIO.length - 1];
        const end = SHOCK_SCENARIO[SHOCK_SCENARIO.indexOf(start) + 1] || start;
        
        if (start === end) {
            points.push({ time: i, price: start.price, event: start.event });
            continue;
        }

        const progress = (i - start.time) / (end.time - start.time);
        const price = start.price + (end.price - start.price) * progress;
        points.push({ time: i, price: Number(price.toFixed(2)), event: i === start.time ? start.event : undefined });
    }
    return points;
};

// Quick 15-second scenario (30 points, 0.5s each)
export const getQuickScenario = (): SimulationPoint[] => {
    const points: SimulationPoint[] = [];
    let price = 100;
    
    for (let i = 0; i < 30; i++) {
        let change = (Math.random() - 0.45) * 2; // Slight upward bias initially
        
        // Rapid Crash between 10-20 (Seconds 5-10)
        if (i >= 10 && i <= 20) change = -4 - (Math.random() * 3); 
        // Late Recovery between 21-30 (Seconds 10.5-15)
        if (i > 20) change = 3 + (Math.random() * 4);

        price = Math.max(10, price + change);
        
        let event;
        if (i === 10) event = "ANİ SATIŞ DALGASI!";
        if (i === 15) event = "PANİK ARTIYOR!";
        if (i === 21) event = "DİPTEN TEPKİ GELDİ!";

        points.push({
            time: i,
            price: parseFloat(price.toFixed(2)),
            event
        });
    }
    return points;
};

// KARAR MOTORU: Kullanıcıyı Kararlarına Göre Sınıflandırır
export const analyzeInvestorProfile = (actions: UserAction[]): { profile: InvestorProfile, description: string, recommendation: string } => {
    if (actions.length === 0) {
        return {
            profile: 'PATIENT_INVESTOR',
            description: 'Fırtınalar kopsa da yerinden kıpırdamayan, çelik gibi sinirlere sahipsiniz.',
            recommendation: 'Siz uzun vadeli hisse senedi ve temettü portföyleri için doğmuşsunuz.'
        };
    }

    // Kritik anları kontrol et (Örn: 35-45. saniyeler arası büyük düşüş)
    const panicActions = actions.filter(a => a.time >= 35 && a.time <= 45 && a.type === 'SELL');
    const bottomBuys = actions.filter(a => a.time >= 45 && a.time <= 55 && a.type === 'BUY');
    const fomoBuys = actions.filter(a => a.time >= 20 && a.time <= 30 && a.type === 'BUY');

    if (panicActions.length > 0) {
        return {
            profile: 'PANIC_SELLER',
            description: 'Kayıp anında duygularınız mantığınızın önüne geçiyor, güvenli liman arıyorsunuz.',
            recommendation: 'Sizin için ana paranızı koruyan düşük riskli fonlar ve altın daha uygundur.'
        };
    }

    if (bottomBuys.length > 0) {
        return {
            profile: 'VALUE_HUNTER',
            description: 'Başkaları korkarken siz fırsat görüyorsunuz. Piyasanın gerçek bir avcısısınız.',
            recommendation: 'Hisse senedi piyasalarında ve agresif değişken fonlarda başarılı olabilirsiniz.'
        };
    }

    if (fomoBuys.length > 0 && actions.length > 3) {
        return {
            profile: 'FOMO_FOLLOWER',
            description: 'Yükselen trendleri kaçırma korkusuyla zirvelerde alım yapma riskiniz var.',
            recommendation: 'Duygusal kararlar yerine düzenli ve otomatik (DCA) yatırım yapmalısınız.'
        };
    }

    return {
        profile: 'OVERCONFIDENT',
        description: 'Piyasayı yenebileceğinizi düşünüyorsunuz ve çok sık işlem yapıyorsunuz.',
        recommendation: 'İşlem maliyetlerinizi düşürmek için pasif endeks fonlarına yönelmelisiniz.'
    };
};
