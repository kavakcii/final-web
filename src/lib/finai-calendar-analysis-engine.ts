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
    whatHappened: string; // 1. Ne oldu?
    whatItMeans: string; // 2. Ne anlama geliyor?
    potentialImpacts: string; // 3. Neleri etkileyebilir?
    pointsToConsider: string; // 4. Nelere dikkat edilmeli?
}

function parseNumber(str?: string): number | null {
    if (!str || str === '-' || str === 'Bekleniyor') return null;
    const cleaned = str.replace(/[^0-9\.\,\-]/g, '').replace(',', '.');
    const val = parseFloat(cleaned);
    return isNaN(val) ? null : val;
}

/**
 * 7.2 BACKEND CALCULATION LAYER (AI Yapmayacak, Backend Hesaplayacak)
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
            previousDiffText = `Önceki açıklamaya göre ${previousDiffNumber} puan yükseldi`;
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
 * 7.4 & 7.5 FİNAİ YORUMU ÜRETİCİ (Dil Kuralları & Guardrails İle)
 * Kesin Yatırım Dili Yasak ("destekleyebilir", "baskı oluşturabilir", "diğer koşullar değişmediği takdirde")
 */
export function generateFinAiAnalysis(item: CatalogCalendarEvent): FinAiNarrativeAnalysis {
    const calc = calculateBackendDifferences(item);
    const profile = INDICATOR_PROFILES_DATABASE[item.event] || 
        INDICATOR_PROFILES_DATABASE[Object.keys(INDICATOR_PROFILES_DATABASE).find(k => item.event.includes(k)) || ""] || 
        INDICATOR_PROFILES_DATABASE["Default"];

    const nowIso = new Date().toISOString();
    const obsId = item.id || `obs_${item.country}_${item.time.replace(':', '')}`;

    if (!calc.hasActual) {
        return {
            analysisId: `anl_${obsId}_v1`,
            observationId: obsId,
            version: 'v1',
            status: 'published',
            generatedAt: nowIso,
            model: 'FinAi-Economic-Logic-Engine-v2',
            whatHappened: `Veri henüz açıklanmadı. Piyasa beklentisi ${item.forecast || 'belirtilmedi'} seviyesindedir.`,
            whatItMeans: `Verinin açıklanmasıyla birlikte ${profile.category.toLowerCase()} patikasındaki mevcut görünüm netlik kazanacaktır.`,
            potentialImpacts: `${profile.name} verisi açıklandığında ${profile.impactChannels.map(c => c.title.toLowerCase()).join(', ')} alanlarında hareketlilik yaratabilir.`,
            pointsToConsider: `Açıklanacak rakamın beklentiden sapma derecesi piyasa fiyatlamaları açısından belirleyici olacaktır.`
        };
    }

    // 1. Ne oldu?
    let whatHappened = `Açıklanan ${profile.name} değeri ${item.actual} seviyesinde gerçekleşti. `;
    if (calc.forecastDiffText) {
        whatHappened += `Bu sonuç ${calc.forecastDiffText.toLowerCase()} gerçekleştiğine işaret ediyor (Piyasa Beklentisi: ${item.forecast}). `;
    }
    if (calc.previousDiffText) {
        whatHappened += `${calc.previousDiffText} (Önceki Veri: ${item.previous}).`;
    }

    // 2. Ne anlama geliyor?
    let whatItMeans = '';
    if (calc.forecastDiffNumber !== undefined && calc.hasForecast && parseNumber(item.actual)! < parseNumber(item.forecast)!) {
        whatItMeans = `Sonuç, ${profile.category.toLowerCase()} tarafındaki baskının piyasanın öngördüğünden daha sınırlı seyrettiğini gösterebilir. Fiyat artış hızındaki bu görünüm dezenflasyonist beklentileri destekleyebilir.`;
    } else if (calc.forecastDiffNumber !== undefined && calc.hasForecast && parseNumber(item.actual)! > parseNumber(item.forecast)!) {
        whatItMeans = `Sonuç, ${profile.category.toLowerCase()} üzerindeki baskıların devam ettiğine ve piyasa tahminlerinden daha güçlü seyrettiğine işaret edebilir.`;
    } else {
        whatItMeans = `Verinin piyasa beklentileriyle tam uyum göstermesi, mevcut makroekonomik projeksiyonların korunduğunu ve sürpriz bir şok oluşmadığını gösterebilir.`;
    }

    // 3. Neleri etkileyebilir?
    const potentialImpacts = `Diğer koşullar değişmediği takdirde bu gelişme, ${profile.impactChannels.map(c => c.title).join(' ve ')} üzerinde hassasiyet yaratabilir, politika yapıcıların karar alma esnekliğini etkileyebilir.`;

    // 4. Nelere dikkat edilmeli?
    const pointsToConsider = `Ancak tek bir dönem açıklaması, genel trendin kalıcı olarak değiştiğini kanıtlamak için yeterli olmayabilir. Gelecek dönem verileri ve yardımcı makro göstergelerle birlikte değerlendirilmelidir.`;

    return {
        analysisId: `anl_${obsId}_v1`,
        observationId: obsId,
        version: 'v1',
        status: 'published',
        generatedAt: nowIso,
        model: 'FinAi-Economic-Logic-Engine-v2',
        whatHappened,
        whatItMeans,
        potentialImpacts,
        pointsToConsider
    };
}
