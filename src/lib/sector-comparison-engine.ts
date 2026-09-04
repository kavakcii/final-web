/**
 * FinAI Sector Comparative Analysis Engine - Stage 4
 * Sector Median (Outlier-resistant), Percentile Ranking, Historical Ratio Trends & Growth Engine
 */

import { SectorCategory, ValidatedFinancialData } from '@/types/financials';
import { getSectorCategory, normalizeSymbol } from '@/lib/sector-categorizer';
import { fetchStockFundamentals } from '@/lib/fundamentals-service';
import { calculateFinancialRatios, CalculatedFinancialRatios, RatioItem } from '@/lib/financial-ratio-engine';

export const MIN_SAMPLE_SIZE = 5; // Constant minimum valid peer count required for sector median

export interface MetricComparison {
  key: string;
  name: string;
  unit: string;
  formatType: 'percent' | 'multiple' | 'currency' | 'ratio';
  companyValue: number | null;
  formattedCompanyValue: string;
  sectorMedian: number | null;
  formattedSectorMedian: string;
  difference: number | null;
  formattedDifference: string;
  percentile: number | null; // 0 - 100
  sampleSize: number;
  status: 'available' | 'not_applicable' | 'insufficient_sample' | 'unavailable';
  reason: string;
  positionText: string;
  educationalNote: string;
}

export interface HistoricalTrendPoint {
  periodLabel: string; // e.g. "2025 Q4"
  year: number;
  quarter: number;
  revenue: number | null;
  grossProfit: number | null;
  ebitda: number | null;
  netIncome: number | null;
  eps: number | null;
  roe: number | null;
  roa: number | null;
  netMargin: number | null;
  debtToAssets: number | null;
}

export interface GrowthMetric {
  metricName: string;
  value: number | null;
  formattedValue: string;
  status: 'available' | 'unavailable' | 'uncalculable';
  reason: string;
}

export interface ComparativeAnalysisResponse {
  symbol: string;
  companyName: string;
  sectorDisplayName: string;
  sectorCategory: SectorCategory;
  totalSectorPeerCount: number;
  validPeerCount: number;
  minSampleSize: number;
  asOf: string;
  metrics: Record<string, MetricComparison>;
  historicalTrend: HistoricalTrendPoint[];
  growth: {
    revenueGrowthYoY: GrowthMetric;
    ebitdaGrowthYoY: GrowthMetric;
    netIncomeGrowthYoY: GrowthMetric;
    epsGrowthYoY: GrowthMetric;
  };
}

// In-Memory Sector Median Cache (15 minutes TTL)
interface CachedSectorMedians {
  timestamp: number;
  medians: Record<string, number | null>;
  valuesMap: Record<string, number[]>;
  validPeerCount: number;
  totalPeerCount: number;
}

const sectorMedianCache = new Map<SectorCategory, CachedSectorMedians>();
const SECTOR_CACHE_TTL = 15 * 60 * 1000;

// Sector Universe Peer List Mapping (All Active BIST Stocks grouped by SectorCategory)
const SECTOR_PEER_MAP: Record<SectorCategory, string[]> = {
  BANK: ['GARAN', 'AKBNK', 'YKBNK', 'ISCTR', 'VAKBN', 'HALKB', 'TSKB', 'ALBRK', 'SKBNK', 'ICBCT', 'QNBFK', 'QNBTR', 'KLNMA'],
  INSURANCE: ['ANHYT', 'ANSGR', 'AGESA', 'AKGRT', 'RAYSG', 'TURSG'],
  REIT: ['EKGYO', 'SNGYO', 'TRGYO', 'OZKGY', 'AKFGY', 'ISGYO', 'VKGYO', 'KLGYO', 'HLGYO', 'PSGYO', 'RYGYO', 'KZGYO', 'AGYO', 'SURGY'],
  HOLDING: ['KCHOL', 'SAHOL', 'DOHOL', 'AGHOL', 'BERA', 'TKFEN', 'ENKAI', 'GSDHO', 'INVEO', 'ECZYT', 'POLHO', 'INVES', 'HEDEF', 'VERUS', 'TAVHL', 'ALARK', 'ECILC', 'NTHOL', 'SISE'],
  ENERGY: ['TUPRS', 'AKSEN', 'ASTOR', 'BIOEN', 'GWIND', 'CWENE', 'EUPWR', 'AYDEM', 'CANTE', 'ENJSA', 'NATEN', 'ESEN', 'AHGAZ', 'ENERY', 'TATEN', 'IZENR', 'A1YEN', 'MOGAN', 'ENTRA', 'CATES', 'SMRTG', 'ODAS', 'AKENR', 'ZOREN'],
  TELECOM: ['TCELL', 'TTKOM'],
  TRANSPORTATION: ['THYAO', 'PGSUS', 'TAVHL', 'CLEBI', 'GSDDE', 'RYSAS', 'HOROZ', 'HRKET', 'PASEU', 'GRSEL', 'TUREX', 'LIDER', 'TLMAN'],
  RETAIL: ['BIMAS', 'MGROS', 'SOKM', 'MAVI', 'TKNSA', 'CRFSA', 'EBEBK', 'SUWEN', 'GMTAS', 'KIMMR', 'GENIL', 'ARZUM', 'VAKKO', 'BIZIM', 'KOTON'],
  TECHNOLOGY: ['ASELS', 'MIATK', 'REEDR', 'ARDYZ', 'LOGO', 'PATEK', 'FORTE', 'SDTTR', 'ALTNY', 'ODINE', 'AZTEK', 'OBASE', 'HTTBT', 'MOBTL', 'VBTYZ', 'EDATA', 'ATATP', 'PENTA', 'MTRKS', 'KFEIN', 'FONET', 'KRONT', 'DESPC', 'KAREL', 'INDES', 'ARENA', 'LINK', 'ALCTL', 'NETAS'],
  AUTOMOTIVE: ['FROTO', 'TOASO', 'TTRAK', 'ASUZU', 'KARSN', 'DOAS', 'TMSN', 'BFREN', 'JANTS', 'PARSN', 'DITAS', 'DOKTA'],
  FOOD: ['CCOLA', 'AEFES', 'ULKER', 'BANVT', 'TATGD', 'YYLGD', 'SOKE', 'GOLDA', 'OFSYM', 'ATAKP', 'KAYSE', 'EKSUN', 'GOKNR', 'KRVGD', 'TUKAS', 'DARDL', 'PETUN', 'PNSUT', 'TABGD', 'BYDNR', 'BIGCH'],
  HEALTHCARE: ['DEVA', 'GENIL', 'MPARK', 'MEDTR', 'ECILC', 'TNZTP', 'EGEPO', 'ONCSM', 'RTALB', 'LKMNH', 'TRILC', 'ANGEN'],
  CONSTRUCTION: ['OYAKC', 'CIMSA', 'BUCIM', 'NUHCM', 'ENKAI', 'BOBET', 'LMKDC', 'KLSER', 'BIENY', 'QUAGR', 'BSOKE', 'AKCNS', 'BTCIM', 'GOLTS', 'AFYON', 'KONYA', 'GESAN'],
  INDUSTRIAL: ['EREGL', 'KRDMD', 'ISDMR', 'SASA', 'HEKTS', 'ARCLK', 'VESBE', 'VESTL', 'EGEEN', 'BRISA', 'GOODY', 'CEMTS', 'KORDS', 'ALARK', 'DITTM', 'PRKME', 'KOZAL', 'KOZAA', 'IPEKE'],
  OTHER: ['Z30KE', 'ZPBDL', 'USDTR', 'GMSTR']
};

/**
 * Calculates median of a sorted array of numbers
 */
function calculateMedian(arr: number[]): number | null {
  if (!arr || arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculates percentile rank of a target value within a sorted array of numbers (0 - 100)
 */
function calculatePercentile(targetVal: number | null, arr: number[]): number | null {
  if (targetVal == null || !arr || arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  let countBelow = 0;
  let countEqual = 0;

  for (const v of sorted) {
    if (v < targetVal) countBelow++;
    else if (v === targetVal) countEqual++;
  }

  const percentile = ((countBelow + 0.5 * countEqual) / sorted.length) * 100;
  return Math.min(100, Math.max(0, Math.round(percentile)));
}

/**
 * Fetches or computes sector medians for all metrics within a SectorCategory
 */
async function getOrComputeSectorMedians(sectorCat: SectorCategory): Promise<CachedSectorMedians> {
  const now = Date.now();
  const cached = sectorMedianCache.get(sectorCat);
  if (cached && (now - cached.timestamp < SECTOR_CACHE_TTL)) {
    return cached;
  }

  const peers = SECTOR_PEER_MAP[sectorCat] || ['EREGL', 'KARSN', 'THYAO', 'ASELS', 'TUPRS'];
  const valuesMap: Record<string, number[]> = {
    pe: [],
    pb: [],
    roe: [],
    roa: [],
    netMargin: [],
    grossMargin: [],
    ebitdaMargin: [],
    debtToAssets: [],
    debtToEquity: [],
    netDebtToEBITDA: [],
    evToEBITDA: [],
    evToSales: [],
    eps: [],
    bvps: [],
    assetTurnover: [],
    inventoryTurnover: []
  };

  let validCount = 0;

  // Process peer fundamentals in parallel batch
  await Promise.all(peers.map(async (peerSymbol) => {
    try {
      const peerData = await fetchStockFundamentals(peerSymbol);
      if (peerData && peerData.quality.status !== 'unavailable' && peerData.quality.status !== 'invalid') {
        const peerRatios = calculateFinancialRatios(peerData, null);
        validCount++;

        // Helper to extract clean numeric value
        const extractVal = (categoryKey: 'profitability' | 'liquidity' | 'leverage' | 'valuation' | 'perShare' | 'operational', ratioKey: string) => {
          const ratio = peerRatios.categories[categoryKey]?.ratios.find((r: RatioItem) => r.key === ratioKey);
          if (ratio && ratio.status === 'available' && ratio.value != null && !isNaN(ratio.value) && isFinite(ratio.value)) {
            return ratio.value;
          }
          return null;
        };

        const pe = extractVal('valuation', 'pe');
        if (pe != null && pe > 0) valuesMap.pe.push(pe);

        const pb = extractVal('valuation', 'pb');
        if (pb != null && pb > 0) valuesMap.pb.push(pb);

        const roe = extractVal('profitability', 'roe');
        if (roe != null) valuesMap.roe.push(roe);

        const roa = extractVal('profitability', 'roa');
        if (roa != null) valuesMap.roa.push(roa);

        const netMargin = extractVal('profitability', 'netMargin');
        if (netMargin != null) valuesMap.netMargin.push(netMargin);

        const grossMargin = extractVal('profitability', 'grossMargin');
        if (grossMargin != null) valuesMap.grossMargin.push(grossMargin);

        const ebitdaMargin = extractVal('profitability', 'ebitdaMargin');
        if (ebitdaMargin != null) valuesMap.ebitdaMargin.push(ebitdaMargin);

        const debtToAssets = extractVal('leverage', 'debtToAssets');
        if (debtToAssets != null) valuesMap.debtToAssets.push(debtToAssets);

        const debtToEquity = extractVal('leverage', 'debtToEquity');
        if (debtToEquity != null) valuesMap.debtToEquity.push(debtToEquity);

        const netDebtToEBITDA = extractVal('leverage', 'netDebtToEBITDA');
        if (netDebtToEBITDA != null) valuesMap.netDebtToEBITDA.push(netDebtToEBITDA);

        const evToEBITDA = extractVal('valuation', 'evToEBITDA');
        if (evToEBITDA != null && evToEBITDA > 0) valuesMap.evToEBITDA.push(evToEBITDA);

        const evToSales = extractVal('valuation', 'evToSales');
        if (evToSales != null && evToSales > 0) valuesMap.evToSales.push(evToSales);

        const eps = extractVal('perShare', 'eps');
        if (eps != null) valuesMap.eps.push(eps);

        const bvps = extractVal('perShare', 'bvps');
        if (bvps != null) valuesMap.bvps.push(bvps);

        const assetTurnover = extractVal('operational', 'assetTurnover');
        if (assetTurnover != null) valuesMap.assetTurnover.push(assetTurnover);

        const inventoryTurnover = extractVal('operational', 'inventoryTurnover');
        if (inventoryTurnover != null) valuesMap.inventoryTurnover.push(inventoryTurnover);
      }
    } catch (e) {
      // Ignore individual peer fetch error
    }
  }));

  const medians: Record<string, number | null> = {};
  for (const k of Object.keys(valuesMap)) {
    medians[k] = calculateMedian(valuesMap[k]);
  }

  const result: CachedSectorMedians = {
    timestamp: now,
    medians,
    valuesMap,
    validPeerCount: validCount,
    totalPeerCount: peers.length
  };

  sectorMedianCache.set(sectorCat, result);
  return result;
}

/**
 * Executes complete sector comparative analysis & historical trend breakdown for a stock
 */
export async function getSectorComparativeAnalysis(rawSymbol: string): Promise<ComparativeAnalysisResponse> {
  const cleanSymbol = normalizeSymbol(rawSymbol);

  // 1. Fetch Target Fundamentals & Compute Stage 3 Financial Ratios
  const fundamentals = await fetchStockFundamentals(cleanSymbol);
  const targetRatios = calculateFinancialRatios(fundamentals, null);
  const sectorCat = fundamentals.sectorInfo.category;

  // 2. Fetch Sector Peers Data & Compute Sector Medians
  const sectorMedianData = await getOrComputeSectorMedians(sectorCat);

  // Define Comparative Metrics to Compare
  const metricConfigs: {
    key: string;
    categoryKey: 'profitability' | 'liquidity' | 'leverage' | 'valuation' | 'perShare' | 'operational';
    name: string;
    formatType: 'percent' | 'multiple' | 'currency' | 'ratio';
    unit: string;
    educationalNote: string;
  }[] = [
    {
      key: 'pe',
      categoryKey: 'valuation',
      name: 'Fiyat / Kâr (F/K)',
      formatType: 'multiple',
      unit: 'x',
      educationalNote: 'F/K oranı, şirket kârına göre hisse fiyatının göreli seviyesini gösterir. Sektör medyanı, aynı sektördeki şirketlerin ortanca değerleme hizasını temsil eder.'
    },
    {
      key: 'pb',
      categoryKey: 'valuation',
      name: 'Piyasa Değeri / Defter Değeri (PD/DD)',
      formatType: 'multiple',
      unit: 'x',
      educationalNote: 'PD/DD oranı, borsa değerinin muhasebe defter değerine oranını yansıtır. Yüksek ROE üreten şirketlerde sektör medyanının üzerinde gerçekleşebilir.'
    },
    {
      key: 'roe',
      categoryKey: 'profitability',
      name: 'Özkaynak Kârlılığı (ROE)',
      formatType: 'percent',
      unit: '%',
      educationalNote: 'ROE, ortakların koyduğu özsermaye karşılığında üretilen kâr oranını ölçer. Sektör medyanının üzerinde olması şirketin sermaye verimliliğini işaret eder.'
    },
    {
      key: 'roa',
      categoryKey: 'profitability',
      name: 'Aktif Kârlılık (ROA)',
      formatType: 'percent',
      unit: '%',
      educationalNote: 'ROA, şirketin toplam varlıklarıyla ne derece kâr ürettiğini ölçer. Sektör medyanı ile karşılaştırılması operasyonel varlık verimliliğini ortaya koyar.'
    },
    {
      key: 'netMargin',
      categoryKey: 'profitability',
      name: 'Net Kâr Marjı',
      formatType: 'percent',
      unit: '%',
      educationalNote: 'Net kâr marjı, satış gelirlerinin ne kadarının nihai kâra dönüştüğünü gösterir. Sektör medyanından yüksek marj maliyet yönetim gücünü yansıtır.'
    },
    {
      key: 'grossMargin',
      categoryKey: 'profitability',
      name: 'Brüt Kâr Marjı',
      formatType: 'percent',
      unit: '%',
      educationalNote: 'Brüt kâr marjı, üretim ve hammadde maliyetlerinin üzerindeki fiyatlama gücünü gösterir. Banka ve Sigorta sektörlerinde uygulanmaz.'
    },
    {
      key: 'ebitdaMargin',
      categoryKey: 'profitability',
      name: 'FAVÖK Marjı',
      formatType: 'percent',
      unit: '%',
      educationalNote: 'FAVÖK marjı operasyonel nakit kârlılığını ölçer. Sermaye yoğun sanayi şirketlerinde sektör medyanı referansı kritik önem taşır.'
    },
    {
      key: 'debtToAssets',
      categoryKey: 'leverage',
      name: 'Borç / Toplam Varlıklar',
      formatType: 'percent',
      unit: '%',
      educationalNote: 'Varlıkların ne kadarlık kısmının borçla finanse edildiğini ölçer. Sektör medyanının altında borçluluk finansal riski azaltır.'
    },
    {
      key: 'netDebtToEBITDA',
      categoryKey: 'leverage',
      name: 'Net Borç / FAVÖK',
      formatType: 'multiple',
      unit: 'x',
      educationalNote: 'Net borcun yıllık nakit üretimiyle kaç yılda ödenebileceğini gösterir. Negatif FAVÖK açıklayan şirketlerde ve bankalarda hesaplanmaz.'
    },
    {
      key: 'evToEBITDA',
      categoryKey: 'valuation',
      name: 'Firma Değeri / FAVÖK (FD/FAVÖK)',
      formatType: 'multiple',
      unit: 'x',
      educationalNote: 'Firma değerinin nakit üretim gücüne oranını gösterir. Borç yapısından arındırıldığı için sektör karşılaştırmasında objektif bir çarpandır.'
    }
  ];

  const metrics: Record<string, MetricComparison> = {};

  for (const cfg of metricConfigs) {
    const targetItem = targetRatios.categories[cfg.categoryKey]?.ratios.find((r: RatioItem) => r.key === cfg.key);
    
    if (!targetItem || targetItem.status === 'not_applicable') {
      metrics[cfg.key] = {
        key: cfg.key,
        name: cfg.name,
        unit: cfg.unit,
        formatType: cfg.formatType,
        companyValue: null,
        formattedCompanyValue: '—',
        sectorMedian: null,
        formattedSectorMedian: '—',
        difference: null,
        formattedDifference: '—',
        percentile: null,
        sampleSize: 0,
        status: 'not_applicable',
        reason: targetItem?.reason || 'Bu sektör için metodolojik olarak uygulanmaz (N/A).',
        positionText: 'Sektör dışı metrik.',
        educationalNote: cfg.educationalNote
      };
      continue;
    }

    const val = targetItem.value;
    const peerValues = sectorMedianData.valuesMap[cfg.key] || [];
    const sampleSize = peerValues.length;

    if (sampleSize < MIN_SAMPLE_SIZE) {
      metrics[cfg.key] = {
        key: cfg.key,
        name: cfg.name,
        unit: cfg.unit,
        formatType: cfg.formatType,
        companyValue: val,
        formattedCompanyValue: targetItem.formattedValue,
        sectorMedian: null,
        formattedSectorMedian: '—',
        difference: null,
        formattedDifference: '—',
        percentile: null,
        sampleSize,
        status: 'insufficient_sample',
        reason: `Sektör karşılaştırması için yeterli veri bulunmuyor (Mevcut geçerli şirket: ${sampleSize}, Minimum gerekli: ${MIN_SAMPLE_SIZE}).`,
        positionText: 'Yetersiz sektör örneklemi.',
        educationalNote: cfg.educationalNote
      };
      continue;
    }

    const median = sectorMedianData.medians[cfg.key] ?? null;
    const percentile = calculatePercentile(val, peerValues);

    let diff: number | null = null;
    let formattedDiff = '—';
    let positionText = 'Şirket verisi hesaplanamadı.';

    if (val != null && median != null) {
      diff = val - median;
      if (cfg.formatType === 'percent') {
        const sign = diff >= 0 ? '+' : '';
        formattedDiff = `${sign}${diff.toFixed(2)} puan`;
        if (diff > 0.01) {
          positionText = `Şirket ${cfg.name} değeri (%${val.toFixed(2)}), sektör medyanının (%${median.toFixed(2)}) ${Math.abs(diff).toFixed(2)} puan üzerindedir.`;
        } else if (diff < -0.01) {
          positionText = `Şirket ${cfg.name} değeri (%${val.toFixed(2)}), sektör medyanının (%${median.toFixed(2)}) ${Math.abs(diff).toFixed(2)} puan altındadır.`;
        } else {
          positionText = `Şirket ${cfg.name} değeri (%${val.toFixed(2)}), sektör medyanı (%${median.toFixed(2)}) ile aynı seviyededir.`;
        }
      } else {
        const sign = diff >= 0 ? '+' : '';
        formattedDiff = `${sign}${diff.toFixed(2)}x`;
        if (diff > 0.01) {
          positionText = `Şirket ${cfg.name} değeri (${val.toFixed(2)}x), sektör medyanının (${median.toFixed(2)}x) ${Math.abs(diff).toFixed(2)}x üzerindedir.`;
        } else if (diff < -0.01) {
          positionText = `Şirket ${cfg.name} değeri (${val.toFixed(2)}x), sektör medyanının (${median.toFixed(2)}x) ${Math.abs(diff).toFixed(2)}x altındadır.`;
        } else {
          positionText = `Şirket ${cfg.name} değeri (${val.toFixed(2)}x), sektör medyanı (${median.toFixed(2)}x) ile aynı seviyededir.`;
        }
      }
    } else if (val == null) {
      positionText = targetItem.reason || 'Şirket verisi mevcut değil.';
    }

    metrics[cfg.key] = {
      key: cfg.key,
      name: cfg.name,
      unit: cfg.unit,
      formatType: cfg.formatType,
      companyValue: val,
      formattedCompanyValue: targetItem.formattedValue,
      sectorMedian: median,
      formattedSectorMedian: median != null ? (cfg.formatType === 'percent' ? `%${median.toFixed(2)}` : `${median.toFixed(2)}x`) : '—',
      difference: diff,
      formattedDifference: formattedDiff,
      percentile,
      sampleSize,
      status: targetItem.status === 'available' ? 'available' : 'unavailable',
      reason: targetItem.reason,
      positionText,
      educationalNote: cfg.educationalNote
    };
  }

  // 3. Calculate Historical Trend across real reporting quarters (Last 4-5 quarters)
  const historicalTrend: HistoricalTrendPoint[] = [];
  const quarters = fundamentals.quarters || [];

  for (let i = 0; i < Math.min(6, quarters.length); i++) {
    const q = quarters[i];
    const is = q.incomeStatement;
    const bs = q.balanceSheet;
    const ps = q.perShare;

    const periodLabel = `${q.period.year} Q${q.period.quarter}`;
    const totalEq = bs.totalEquity ?? null;
    const totalAss = bs.totalAssets ?? null;
    const rev = is.revenue ?? null;
    const netInc = is.netIncome ?? null;

    const roe = (netInc != null && totalEq != null && totalEq > 0) ? (netInc / totalEq) * 100 : null;
    const roa = (netInc != null && totalAss != null && totalAss > 0) ? (netInc / totalAss) * 100 : null;
    const netMargin = (netInc != null && rev != null && rev > 0) ? (netInc / rev) * 100 : null;
    const debtToAssets = (bs.financialDebt != null && totalAss != null && totalAss > 0) ? (bs.financialDebt / totalAss) * 100 : null;

    historicalTrend.push({
      periodLabel,
      year: q.period.year,
      quarter: q.period.quarter,
      revenue: rev,
      grossProfit: is.grossProfit ?? null,
      ebitda: is.ebitda ?? null,
      netIncome: netInc,
      eps: ps.basicEPS ?? null,
      roe,
      roa,
      netMargin,
      debtToAssets
    });
  }

  // Reverse so chronological order (oldest -> newest) for trends
  historicalTrend.reverse();

  // 4. YoY Growth Metrics Calculation (Guarded against negative/zero previous period)
  function computeYoYGrowth(metricKey: 'revenue' | 'ebitda' | 'netIncome' | 'eps', label: string): GrowthMetric {
    if (historicalTrend.length < 2) {
      return { metricName: label, value: null, formattedValue: '—', status: 'unavailable', reason: 'Tarihsel dönem verisi yetersiz.' };
    }

    const current = historicalTrend[historicalTrend.length - 1][metricKey];
    const previous = historicalTrend[0][metricKey];

    if (current == null || previous == null) {
      return { metricName: label, value: null, formattedValue: '—', status: 'unavailable', reason: 'İlgili finansal kalem eksik.' };
    }

    if (previous <= 0) {
      return { metricName: label, value: null, formattedValue: '—', status: 'uncalculable', reason: 'Anlamlı büyüme oranı hesaplanamıyor (Önceki dönem negatif veya sıfır).' };
    }

    const growthVal = ((current - previous) / Math.abs(previous)) * 100;
    const sign = growthVal >= 0 ? '+' : '';
    return {
      metricName: label,
      value: growthVal,
      formattedValue: `${sign}%${growthVal.toFixed(2)}`,
      status: 'available',
      reason: `${historicalTrend[0].periodLabel} -> ${historicalTrend[historicalTrend.length - 1].periodLabel} Karşılaştırmalı Büyüme`
    };
  }

  return {
    symbol: cleanSymbol,
    companyName: fundamentals.companyName,
    sectorDisplayName: fundamentals.sectorInfo.displayName,
    sectorCategory: sectorCat,
    totalSectorPeerCount: sectorMedianData.totalPeerCount,
    validPeerCount: sectorMedianData.validPeerCount,
    minSampleSize: MIN_SAMPLE_SIZE,
    asOf: new Date().toISOString(),
    metrics,
    historicalTrend,
    growth: {
      revenueGrowthYoY: computeYoYGrowth('revenue', 'Satış Gelirleri Büyümesi'),
      ebitdaGrowthYoY: computeYoYGrowth('ebitda', 'FAVÖK Büyümesi'),
      netIncomeGrowthYoY: computeYoYGrowth('netIncome', 'Net Kâr Büyümesi'),
      epsGrowthYoY: computeYoYGrowth('eps', 'Hisse Başı Kâr (EPS) Büyümesi')
    }
  };
}
