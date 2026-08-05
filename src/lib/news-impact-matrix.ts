import { CatalogCalendarEvent } from './calendar-catalog';
import { Asset } from './portfolio-service';

export type AssetCategory = 'BIST' | 'GOLD' | 'FX' | 'CRYPTO' | 'US_STOCKS';

export interface NewsImpactRule {
    keywordRegex: RegExp;
    categories: AssetCategory[];
    specificSymbols?: string[];
    description: string;
}

/**
 * Ekonomik Takvim ve Piyasa Haberleri Duyarlılık Matrisi
 * Haber başlıklarını ve ülkelerini ilgili varlık sınıflarına ve sembollerine bağlar.
 */
export const NewsImpactRules: NewsImpactRule[] = [
    // Türkiye Enflasyon & Faiz (TÜFE / ÜFE / TCMB)
    {
        keywordRegex: /(tüfe|üfe|enflasyon|cpi|ppi|tcmb|faiz oranı|piyasa katılımcıları)/i,
        categories: ['BIST', 'FX'],
        description: 'Türkiye enflasyon ve faiz kararları BIST hisselerini ve TL kurunu etkiler.'
    },
    // ABD Enflasyon & FED (CPI, PPI, FED, FOMC, Tarım Dışı İstihdam)
    {
        keywordRegex: /(fed|fomc|tarım dışı|istihdam|abd çekirdek|işsizlik haklarından|ism imalat)/i,
        categories: ['GOLD', 'FX', 'CRYPTO', 'US_STOCKS'],
        description: 'ABD makro verileri küresel likiditeyi, ons altını, doları ve kripto varlıkları etkiler.'
    },
    // Petrol & Enerji Kararları (OPEC, Petrol Stokları)
    {
        keywordRegex: /(opec|petrol|ham petrol|benzin|enerji)/i,
        categories: ['BIST'],
        specificSymbols: ['THYAO', 'PGSUS', 'TUPRS'],
        description: 'Petrol fiyatları havacılık şirketlerinin yakıt maliyetlerini ve Tupras marjlarını etkiler.'
    },
    // AB & İngiltere Faiz / PMI
    {
        keywordRegex: /(ecb|boe|eurozone|ingiltere faiz|almanya pmi)/i,
        categories: ['FX', 'BIST'],
        description: 'Avrupa verileri Euro/TL kurunu ve Avrupa’ya ihracat yapan BIST şirketlerini etkiler.'
    },
    // Dış Ticaret & İhracat
    {
        keywordRegex: /(dış ticaret|cari denge|ihracat|ithalat)/i,
        categories: ['BIST', 'FX'],
        description: 'Cari denge verileri döviz rezervlerini ve ihracatçı şirketleri etkiler.'
    }
];

/**
 * Kullanıcının portföyündeki varlıklardan kategorilerini tespit eder.
 */
export function getUserAssetCategories(assets: Asset[]): Set<AssetCategory> {
    const categories = new Set<AssetCategory>();

    assets.forEach(asset => {
        const type = (asset.type || '').toUpperCase();
        const symbol = (asset.symbol || '').toUpperCase();

        if (type === 'STOCK' || symbol.endsWith('.IS') || !symbol.includes('=')) {
            categories.add('BIST');
        }
        if (type === 'GOLD' || symbol.includes('ALTIN') || symbol.includes('GUMUS') || symbol.includes('XAU') || symbol.includes('XAG')) {
            categories.add('GOLD');
        }
        if (type === 'CRYPTO' || symbol.includes('BTC') || symbol.includes('ETH')) {
            categories.add('CRYPTO');
        }
        if (symbol.includes('TRY=X') || symbol.includes('EURTRY=X') || symbol.includes('GBPTRY=X')) {
            categories.add('FX');
        }
    });

    return categories;
}

/**
 * Kullanıcı portföyüne YALNIZCA doğrudan etki eden haberleri filtreler.
 * İlgisiz haberleri (nüfus sayımı, bağlantısız makro haberler) %100 eler.
 */
export function filterEventsForUserPortfolio(
    events: CatalogCalendarEvent[],
    assets: Asset[]
): { relevantEvents: CatalogCalendarEvent[]; impactNotes: Record<string, string> } {
    const userCategories = getUserAssetCategories(assets);
    const userSymbols = new Set(assets.map(a => a.symbol.toUpperCase().replace('.IS', '')));

    const relevantEvents: CatalogCalendarEvent[] = [];
    const impactNotes: Record<string, string> = {};

    events.forEach(event => {
        const textToTest = `${event.event} ${event.country || ''}`.toLowerCase();

        let matched = false;
        let note = '';

        for (const rule of NewsImpactRules) {
            if (rule.keywordRegex.test(textToTest)) {
                // Kategori çakışması var mı?
                const hasCategoryMatch = rule.categories.some(cat => userCategories.has(cat));

                // Özel sembol çakışması var mı? (örn THYAO için petrol haberi)
                const hasSymbolMatch = rule.specificSymbols?.some(sym => userSymbols.has(sym));

                if (hasCategoryMatch || hasSymbolMatch) {
                    matched = true;
                    note = rule.description;
                    break;
                }
            }
        }

        if (matched) {
            relevantEvents.push(event);
            if (event.id) {
                impactNotes[event.id] = note;
            }
        }
    });

    return { relevantEvents, impactNotes };
}
