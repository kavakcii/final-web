import { CatalogCalendarEvent } from './calendar-catalog';
import { INDICATOR_PROFILES_DATABASE, IndicatorProfile } from './indicator-profiles';

export interface BackendCalculations {
    forecastDiffText?: string;
    previousDiffText?: string;
    forecastDiffNumber?: number;
    previousDiffNumber?: number;
    hasActual: boolean;
    hasForecast: boolean;
    hasPrevious: boolean;
}

export interface FinAiNarrativeAnalysis {
    analysisId: string;
    observationId: string;
    version: string;
    status: 'draft' | 'published' | 'superseded' | 'failed';
    generatedAt: string;
    model: string;
    shortExecutiveSummary: string; // FİNAİ'NİN KISA DEĞERLENDİRMESİ (YENİ 7.1 SEVİYESİ)
    whatHappened: string; // 01 — NE OLDU?
    whatItMeans: string; // 02 — NE ANLAMA GELİYOR?
    potentialImpacts: string; // 03 — NELERİ ETKİLEYEBİLİR?
    pointsToConsider: string; // 04 — NELERE DİKKAT EDİLMELİ?
}

function parseNumber(str?: string): number | null {
    if (!str || str === '-' || str === 'Bekleniyor') return null;
    const cleaned = str.replace(/[^0-9\.\,\-]/g, '').replace(',', '.');
    const val = parseFloat(cleaned);
    return isNaN(val) ? null : val;
}

/**
 * 7.1 BACKEND CALCULATION LAYER (AI Yapmayacak, Objektif Backend Hesaplayacak)
 */
export function calculateBackendDifferences(item: CatalogCalendarEvent): BackendCalculations {
    const actualNum = parseNumber(item.actual);
    const forecastNum = parseNumber(item.forecast);
    const previousNum = parseNumber(item.previous);

    const hasActual = actualNum !== null;
    const hasForecast = forecastNum !== null;
    const hasPrevious = previousNum !== null;

    let forecastDiffText: string | undefined;
    let previousDiffText: string | undefined;
    let forecastDiffNumber: number | undefined;
    let previousDiffNumber: number | undefined;

    if (hasActual && hasForecast && actualNum !== null && forecastNum !== null) {
        const diff = Math.abs(actualNum - forecastNum);
        forecastDiffNumber = Number(diff.toFixed(2));
        if (actualNum > forecastNum) {
            forecastDiffText = `Beklentinin ${forecastDiffNumber} puan üzerinde`;
        } else if (actualNum < forecastNum) {
            forecastDiffText = `Beklentinin ${forecastDiffNumber} puan altında`;
        } else {
            forecastDiffText = `Beklentiyle birebir aynı gerçekleşti`;
        }
    }

    if (hasActual && hasPrevious && actualNum !== null && previousNum !== null) {
        const diff = Math.abs(actualNum - previousNum);
        previousDiffNumber = Number(diff.toFixed(2));
        if (actualNum > previousNum) {
            previousDiffText = `Önceki açıklamaya göre ${previousDiffNumber} puan yüksek`;
        } else if (actualNum < previousNum) {
            previousDiffText = `Önceki açıklamaya göre ${previousDiffNumber} puan geriledi`;
        } else {
            previousDiffText = `Önceki açıklama seviyesini korudu`;
        }
    }

    return {
        forecastDiffText,
        previousDiffText,
        forecastDiffNumber,
        previousDiffNumber,
        hasActual,
        hasForecast,
        hasPrevious
    };
}

/**
 * FİNAİ INTELLIGENCE ANALİZ ÜRETİCİ
 * Şartlı, objektif ve kesin yatırım tavsiyesi içermeyen dil kuralları ile.
 */
export function generateFinAiAnalysis(item: CatalogCalendarEvent): FinAiNarrativeAnalysis {
    const calc = calculateBackendDifferences(item);
    const profile = INDICATOR_PROFILES_DATABASE[item.event] || 
        INDICATOR_PROFILES_DATABASE[Object.keys(INDICATOR_PROFILES_DATABASE).find(k => item.event.includes(k)) || ""] || 
        INDICATOR_PROFILES_DATABASE["Default"];

    const nowIso = new Date().toISOString();
    const obsId = item.id || `obs_${item.country}_${item.time.replace(':', '')}`;

    if (!calc.hasActual) {
        const shortExecutiveSummary = `Açıklanması beklenen ${profile.name} verisi için piyasa konsensüs tahmini ${item.forecast || 'belirtilmedi'} seviyesindedir. Önceki dönem gerçekleşmesi ${item.previous || 'bulunmamaktadır'}. Veri açıklandığında beklenti ile gerçekleşme arasındaki fark makroekonomik duruş üzerinde belirleyici olabilir.`;

        return {
            analysisId: `anl_${obsId}_v2`,
            observationId: obsId,
            version: 'v2.0',
            status: 'published',
            generatedAt: nowIso,
            model: 'FinAi-Economic-Intelligence-Engine-v2',
            shortExecutiveSummary,
            whatHappened: `Veri henüz açıklanmadı. Piyasa beklentisi ${item.forecast || 'belirtilmedi'} seviyesindedir.`,
            whatItMeans: `Verinin açıklanmasıyla birlikte ${profile.category.toLowerCase()} patikasındaki mevcut görünüm netlik kazanacaktır.`,
            potentialImpacts: `${profile.name} verisi açıklandığında ${profile.impactChannels.map(c => c.title.toLowerCase()).join(', ')} alanlarında hareketlilik yaratabilir.`,
            pointsToConsider: `Açıklanacak rakamın beklentiden sapma derecesi piyasa fiyatlamaları açısından belirleyici olacaktır.`
        };
    }

    // FİNAİ'NİN KISA DEĞERLENDİRMESİ (Dinamik Özet Metin)
    let shortExecutiveSummary = `Açıklanan ${profile.name} ${item.actual} gerçekleşerek `;
    if (calc.forecastDiffText) {
        shortExecutiveSummary += `${item.forecast || 'tahmin'}'lik piyasa beklentisinin ${calc.forecastDiffNumber} puan ${parseNumber(item.actual)! < parseNumber(item.forecast)! ? 'altında kalmıştır' : parseNumber(item.actual)! > parseNumber(item.forecast)! ? 'üzerinde gerçekleşmiştir' : 'paralelinde seyretmiştir'}. `;
    }
    if (calc.previousDiffText) {
        shortExecutiveSummary += `Önceki döneme (${item.previous}) göre ise ${calc.previousDiffNumber} puanlık bir ${parseNumber(item.actual)! > parseNumber(item.previous)! ? 'yükseliş' : parseNumber(item.actual)! < parseNumber(item.previous)! ? 'gerileme' : 'değişimsizlik'} görülmüştür. `;
    }
    shortExecutiveSummary += `Bu sonuç, mevcut koşullar altında ${profile.category.toLowerCase()} patikasının beklentiye kıyasla daha ${parseNumber(item.actual)! < (parseNumber(item.forecast) || 0) ? 'sınırlı' : 'güçlü'} olduğunu gösterirken, tek başına kalıcı eğilimin değiştiği sonucunu ortaya koymaz.`;

    // 01 — NE OLDU?
    let whatHappened = `Açıklanan ${profile.name} değeri ${item.actual} seviyesinde gerçekleşti. `;
    if (calc.forecastDiffText) {
        whatHappened += `Bu sonuç ${calc.forecastDiffText.toLowerCase()} gerçekleştiğine işaret ediyor (Piyasa Beklentisi: ${item.forecast}). `;
    }
    if (calc.previousDiffText) {
        whatHappened += `${calc.previousDiffText} (Önceki Veri: ${item.previous}).`;
    }

    // 02 — NE ANLAMA GELİYOR?
    let whatItMeans = '';
    if (calc.forecastDiffNumber !== undefined && calc.hasForecast && parseNumber(item.actual)! < parseNumber(item.forecast)!) {
        whatItMeans = `Sonuç, ${profile.category.toLowerCase()} tarafındaki artış hızının piyasanın öngördüğünden daha sınırlı kaldığını gösterebilir. Fiyat basamaklarındaki bu yavaşlama dezenflasyonist veya esnetici beklentileri destekleyebilir.`;
    } else if (calc.forecastDiffNumber !== undefined && calc.hasForecast && parseNumber(item.actual)! > parseNumber(item.forecast)!) {
        whatItMeans = `Sonuç, ${profile.category.toLowerCase()} üzerindeki baskıların devam ettiğine ve piyasa tahminlerinden daha güçlü seyrettiğine işaret edebilir.`;
    } else {
        whatItMeans = `Verinin piyasa beklentileriyle tam uyum göstermesi, mevcut makroekonomik projeksiyonların korunduğunu ve sürpriz bir şok oluşmadığını gösterebilir.`;
    }

    // 03 — NELERİ ETKİLEYEBİLİR?
    const potentialImpacts = `Diğer koşullar değişmediği takdirde bu gelişme, ${profile.impactChannels.map(c => c.title).slice(0, 3).join(', ')} üzerinde hassasiyet yaratabilir, politika yapıcıların karar alma esnekliğini etkileyebilir.`;

    // 04 — NELERE DİKKAT EDİLMELİ?
    const pointsToConsider = `Ancak tek bir dönem açıklaması, genel trendin kalıcı olarak değiştiğini kanıtlamak için yeterli olmayabilir. Gelecek dönem verileri ve yardımcı makro göstergelerle birlikte değerlendirilmelidir.`;

    return {
        analysisId: `anl_${obsId}_v2`,
        observationId: obsId,
        version: 'v2.0',
        status: 'published',
        generatedAt: nowIso,
        model: 'FinAi-Economic-Intelligence-Engine-v2',
        shortExecutiveSummary,
        whatHappened,
        whatItMeans,
        potentialImpacts,
        pointsToConsider
    };
}
