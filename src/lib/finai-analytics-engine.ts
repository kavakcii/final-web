/**
 * FinAi Analytics Engine
 * PDF İsterlerine Göre Backend Sayısal Hesaplama, TWR, Impact Score ve Confidence Score Motoru
 *
 * NOT: PDF Kuralı 40 gereği, AI sayısal veri hesaplayamaz veya değiştiremez.
 * Tüm matematiksel hesaplamalar burada yapılır ve AI'ye tek ham paket olarak iletilir.
 */

import { Asset } from './portfolio-service';

export interface UserTransaction {
    id: string;
    userId: string;
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'BUY' | 'SELL';
    symbol?: string;
    quantity?: number;
    price?: number;
    amount: number; // TL Tutarı
    transactionDate: string; // YYYY-MM-DD
}

export interface PortfolioSnapshotPoint {
    snapshot_date: string;
    total_value: number;
    total_profit: number;
    total_cost: number;
    profit_pct: number;
    asset_count: number;
}

export interface AssetContribution {
    symbol: string;
    name: string;
    startValue: number;
    endValue: number;
    priceChangePct: number;
    quantityChange: number;
    weightPct: number;       // Portföydeki Ağırlığı (%)
    contribTL: number;       // Portföye TL Katkısı (+/- TL)
    contribPct: number;      // Portföye Yüzde Katkısı (+/- %)
}

export interface NewsImpactAnalysis {
    newsId: string;
    title: string;
    symbol?: string;
    eventTime?: string;
    impactScore: number;     // 0 - 100
    confidenceScore: number; // 0 - 100
    isCausalityValid: boolean; // confidenceScore >= 50
    narrativeNote: string;
}

export interface FinAiBackendPayload {
    timeframe: 'weekly' | 'monthly' | 'all-time';
    startValue: number;
    endValue: number;
    diffTL: number;
    diffPct: number;
    twrPct: number;              // Time-Weighted Return (TWR %)
    totalDeposits: number;       // Toplam Sermaye Girişi (TL)
    totalWithdrawals: number;    // Toplam Sermaye Çıkışı (TL)
    netCapitalFlow: number;      // Net Sermaye Akışı (TL)
    periodCashChange: number;    // Nakit Değişimi (TL)
    realizedProfitLoss: number;  // Satılmış Varlıklardan Gerçekleşmiş Kâr/Zarar (TL)
    unrealizedProfitLoss: number;// Hâlâ Tutulan Varlıklardan Gerçekleşmemiş Değişim (TL)
    topPositiveAssets: AssetContribution[];
    topNegativeAssets: AssetContribution[];
    allAssetContributions: AssetContribution[];
    newsAnalyses: NewsImpactAnalysis[];
    uncertainMovements: string[];
    userTransactionSummary?: string;
}

/**
 * 1. TWR (Time-Weighted Return) Hesaplama Motoru
 * Para giriş/çıkışlarının (sermaye hareketlerinin) yarattığı yanılsamayı ortadan kaldırarak
 * gerçek yatırım performansını hesaplar.
 */
export function calculateTWR(
    snapshots: PortfolioSnapshotPoint[],
    transactions: UserTransaction[]
): number {
    if (snapshots.length < 2) return 0;

    // Günlük alt dönem getirilerini hesapla (R_i = (End - NetFlow - Start) / Start)
    let cumulativeProduct = 1.0;

    for (let i = 1; i < snapshots.length; i++) {
        const prevSnap = snapshots[i - 1];
        const currSnap = snapshots[i];
        const dateStr = currSnap.snapshot_date;

        // O gün gerçekleşen net sermaye akışı (Giriş +, Çıkış -)
        const dayFlows = transactions
            .filter(t => t.transactionDate === dateStr)
            .reduce((sum, t) => {
                if (t.type === 'DEPOSIT') return sum + t.amount;
                if (t.type === 'WITHDRAWAL') return sum - t.amount;
                return sum;
            }, 0);

        const startVal = prevSnap.total_value;
        if (startVal <= 0) continue;

        // Günlük net yatırım getirisi
        const dayReturn = (currSnap.total_value - dayFlows - startVal) / startVal;
        cumulativeProduct *= (1 + dayReturn);
    }

    const twrPct = (cumulativeProduct - 1) * 100;
    return isNaN(twrPct) ? 0 : Number(twrPct.toFixed(2));
}

/**
 * 2. Varlık Katkıları ve Portföy Ağırlıkları Hesaplama Motoru
 */
export function calculateAssetContributions(
    assets: Asset[],
    currentPrices: Record<string, number>,
    totalPortfolioValue: number
): AssetContribution[] {
    if (totalPortfolioValue <= 0 || assets.length === 0) return [];

    const symbolNames: Record<string, string> = {
        "THYAO": "Türk Hava Yolları",
        "GARAN": "Garanti BBVA",
        "TUPRS": "TÜPRAŞ",
        "ASELS": "ASELSAN",
        "PGSUS": "Pegasus",
        "TAVHL": "TAV Havalimanları",
        "ALTIN": "Gram Altın",
        "GUMUS": "Gram Gümüş",
        "BTC": "Bitcoin",
        "ETH": "Ethereum",
        "TRY=X": "Dolar/TL"
    };

    const contributions: AssetContribution[] = assets.map(asset => {
        const symUpper = asset.symbol.toUpperCase();
        const symClean = symUpper.replace(/\.IS$/, '');
        const currentPrice = currentPrices[symUpper] ?? currentPrices[symClean] ?? currentPrices[`${symClean}.IS`] ?? asset.avgCost ?? 0;

        const endValue = currentPrice * asset.quantity;
        const startValue = asset.avgCost * asset.quantity;
        const contribTL = endValue - startValue;
        const priceChangePct = asset.avgCost > 0 ? ((currentPrice - asset.avgCost) / asset.avgCost) * 100 : 0;
        const weightPct = (endValue / totalPortfolioValue) * 100;
        const contribPct = totalPortfolioValue > 0 ? (contribTL / totalPortfolioValue) * 100 : 0;

        return {
            symbol: symClean,
            name: symbolNames[symClean] || symbolNames[symUpper] || symClean,
            startValue,
            endValue,
            priceChangePct: Number(priceChangePct.toFixed(2)),
            quantityChange: 0,
            weightPct: Number(weightPct.toFixed(2)),
            contribTL: Number(contribTL.toFixed(2)),
            contribPct: Number(contribPct.toFixed(2))
        };
    });

    return contributions;
}

/**
 * 3. Impact Score Motoru (0 - 100)
 * Bir olayın portföye GERÇEK finansal etkisini ölçer.
 * Faktörler: Portföye finansal TL etkisi (45%), Varlık Portföy Ağırlığı (35%), Piyasadan Ayrışma/Alpha (20%).
 */
export function calculateImpactScore(
    contribTL: number,
    totalPortfolioChangeTL: number,
    weightPct: number,
    marketReturnPct: number = 0,
    assetReturnPct: number = 0
): number {
    const totalAbsChange = Math.abs(totalPortfolioChangeTL) || 1;
    const financialRatio = Math.min(Math.abs(contribTL) / totalAbsChange, 1.0); // 0 - 1
    const weightRatio = Math.min(weightPct / 100, 1.0); // 0 - 1
    const alphaRatio = Math.min(Math.abs(assetReturnPct - marketReturnPct) / 10, 1.0); // 0 - 1

    const rawScore = (financialRatio * 45) + (weightRatio * 35) + (alphaRatio * 20);
    return Math.min(100, Math.max(0, Math.round(rawScore)));
}

/**
 * 4. Confidence Score Motoru (0 - 100)
 * Bir haber/gelişme ile gözlenen fiyat hareketi arasındaki nedensellik güvenini ölçer.
 * Faktörler: Haber Zamanı Uyumluluğu (35%), Kaynak Güvenilirliği (25%), Piyasa Ayrışması (20%), Kalıcılık (20%).
 * PDF Kuralı 33: Confidence < 50 ise ana rapora nedensellik SOKULMAZ.
 */
export function calculateConfidenceScore(
    hasTimestampMatch: boolean,
    sourceCount: number,
    isMarketIndependent: boolean,
    isMovePersistent: boolean
): number {
    let score = 0;
    if (hasTimestampMatch) score += 35;
    score += Math.min(sourceCount * 10, 25); // Çoklu kaynak doğrulama
    if (isMarketIndependent) score += 20;
    if (isMovePersistent) score += 20;

    return Math.min(100, Math.max(0, Math.round(score)));
}
