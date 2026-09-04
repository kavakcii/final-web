/**
 * FinAI Historical Financial Analysis & Multi-Period Ratio Engine - Stage 6
 * Computes multi-period financial ratios, growth rates (YoY/QoQ), margin trends,
 * cash flow evolution, and sector compliance across historical quarters and annuals.
 */

import { ValidatedFinancialData, RatioStatus, FinancialPeriodData, SectorCategory } from '@/types/financials';

export interface EducationalMetricDefinition {
  name: string;
  category: 'profitability' | 'growth' | 'leverage' | 'liquidity' | 'cashFlow' | 'efficiency' | 'valuation';
  unit: '%' | 'x' | '₺' | '$' | 'Oran';
  formatType: 'percent' | 'multiple' | 'currency' | 'ratio';
  whatItMeasures: string;
  howToInterpret: string;
  sectorCaution: string;
  formula: string;
}

export const EDUCATIONAL_METRICS: Record<string, EducationalMetricDefinition> = {
  grossMargin: {
    name: 'Brüt Kâr Marjı',
    category: 'profitability',
    unit: '%',
    formatType: 'percent',
    whatItMeasures: 'Üretim maliyetlerinin düşülmesinden sonra satış gelirlerinin ne kadarlık kısmının brüt kâr olarak kaldığını ölçer.',
    howToInterpret: 'Yüksek veya artış trendindeki brüt marj, şirketin güçlü fiyatlama gücüne ve hammadde maliyetlerini kontrol edebilme yeteneğine işaret eder.',
    sectorCaution: 'Banka ve Sigorta sektörlerinde brüt satış mantığı bulunmadığından uygulanmaz. Perakendede düşük, yazılım ve ilaçta yüksek seyreder.',
    formula: '(Brüt Kâr / Toplam Satışlar) × 100'
  },
  operatingMargin: {
    name: 'Faaliyet Kâr Marjı',
    category: 'profitability',
    unit: '%',
    formatType: 'percent',
    whatItMeasures: 'Şirketin esas faaliyetlerinden operasyonel giderler sonrasında ürettiği kâr marjıdır.',
    howToInterpret: 'Operasyonel verimliliği ve yönetimsel gider disiplinini gösterir. Yükselen faaliyet marjı temel faaliyetlerin güçlendiğini simgeler.',
    sectorCaution: 'Bankalarda ana faaliyet kârı net faiz marjı ile izlenir.',
    formula: '(Faaliyet Kârı / Toplam Satışlar) × 100'
  },
  ebitdaMargin: {
    name: 'FAVÖK Marjı',
    category: 'profitability',
    unit: '%',
    formatType: 'percent',
    whatItMeasures: 'Faiz, vergi, yıpranma ve amortisman öncesi nakit kârlılık oranını yansıtır.',
    howToInterpret: 'Amortisman politikaları ve finansman yapısından bağımsız operasyonel nakit üretim gücünü en saf haliyle gösterir.',
    sectorCaution: 'Finansal kuruluşlarda (Banka/Sigorta) FAVÖK hesaplanmaz.',
    formula: '(FAVÖK / Toplam Satışlar) × 100'
  },
  netMargin: {
    name: 'Net Kâr Marjı',
    category: 'profitability',
    unit: '%',
    formatType: 'percent',
    whatItMeasures: 'Vergiler, finansman giderleri ve tek seferlik kalemler dahil tüm maliyetler düşüldükten sonra kalan nihai kâr oranını gösterir.',
    howToInterpret: 'Nihai kârlılığın göstergesidir. Düzenli ve istikrarlı net marj şirket kâr kalitesinin yüksek olduğuna işaret eder.',
    sectorCaution: 'Tek seferlik duran varlık veya iştirak satış kârları net marjı geçici olarak yapay yükseltebilir.',
    formula: '(Net Dönem Kârı / Toplam Satışlar) × 100'
  },
  roe: {
    name: 'Özkaynak Kârlılığı (ROE)',
    category: 'profitability',
    unit: '%',
    formatType: 'percent',
    whatItMeasures: 'Ortakların sağladığı özsermaye ile şirketin ne oranda net kâr ürettiğini ölçer.',
    howToInterpret: 'Enflasyonun üzerinde ve sürdürülebilir bir ROE, şirketin özsermayesini reel olarak büyüttüğünü gösterir.',
    sectorCaution: 'Aşırı borçlanan şirketlerde kaldıraç etkisiyle ROE yapay yükselebilir; borçlulukla birlikte değerlendirilmelidir.',
    formula: '(Dönem Net Kârı / Toplam Özkaynaklar) × 100'
  },
  roa: {
    name: 'Aktif Kârlılık (ROA)',
    category: 'profitability',
    unit: '%',
    formatType: 'percent',
    whatItMeasures: 'Şirketin kontrolündeki tüm varlıkları (özkaynak + borç) ne kadar kârlı ve etkin kullandığını gösterir.',
    howToInterpret: 'Varlık yoğun sektörlerde sermaye tahsisinin etkinliğini gösterir. Yüksek ROA operasyonel üstünlüğü teyit eder.',
    sectorCaution: 'Bankalarda varlık tabanı çok büyük (krediler) olduğundan ROA %1-3 arasında seyreder.',
    formula: '(Dönem Net Kârı / Toplam Varlıklar) × 100'
  },
  debtToAssets: {
    name: 'Borç / Toplam Varlıklar',
    category: 'leverage',
    unit: '%',
    formatType: 'percent',
    whatItMeasures: 'Şirket aktiflerinin ne kadarlık bölümünün borçlanma ile finanse edildiğini gösterir.',
    howToInterpret: 'Düşük borçluluk finansal kırılganlığı azaltır. Genel kabul gören güvenli seviye %50-60 altıdır.',
    sectorCaution: 'Enerji ve altyapı projelerinde uzun vadeli borçlanma sebebiyle daha yüksek oranlar görülebilir.',
    formula: '(Toplam Finansal Borç / Toplam Varlıklar) × 100'
  },
  debtToEquity: {
    name: 'Finansal Borç / Özkaynak',
    category: 'leverage',
    unit: 'Oran',
    formatType: 'ratio',
    whatItMeasures: 'Finansal borçların hissedar özkaynaklarına oranını gösterir.',
    howToInterpret: '1.00 altı seviyeler finansal riskin dengeli olduğunu gösterirken, 1.50 üzeri borç ağırlıklı sermaye yapısına işaret eder.',
    sectorCaution: 'Bankacılık sektöründe ana kaynak mevduat olduğundan uygulanmaz.',
    formula: 'Toplam Finansal Borç / Toplam Özkaynak'
  },
  netDebtToEBITDA: {
    name: 'Net Borç / FAVÖK',
    category: 'leverage',
    unit: 'x',
    formatType: 'multiple',
    whatItMeasures: 'Mevcut operasyonel nakit akışıyla net borcun kaç yılda geri ödenebileceğini ölçer.',
    howToInterpret: '2.0x altı sağlıklı kabul edilir; 3.5x üzeri borç yükünün operasyonel kârlılığa göre yüksek olduğuna işaret eder. Net nakdi olan şirketlerde negatiftir.',
    sectorCaution: 'Banka ve sigorta şirketlerinde ve negatif FAVÖK açıklayan dönemlerde hesaplanmaz.',
    formula: '(Finansal Borç - Nakit ve Benzerleri) / FAVÖK'
  },
  currentRatio: {
    name: 'Cari Oran',
    category: 'liquidity',
    unit: 'Oran',
    formatType: 'ratio',
    whatItMeasures: '1 yıl içinde nakde dönüşebilecek dönen varlıkların kısa vadeli borçları karşılama kabiliyetini gösterir.',
    howToInterpret: '1.50 - 2.00 arası ideal likidite seviyesidir. 1.00 altı çalışma sermayesi ihtiyacına işaret eder.',
    sectorCaution: 'Bankacılık, Sigorta ve GYO sektörlerinde geleneksel cari oran yorumlanmaz.',
    formula: 'Dönen Varlıklar / Kısa Vadeli Yükümlülükler'
  },
  quickRatio: {
    name: 'Asit-Test (Likidite) Oranı',
    category: 'liquidity',
    unit: 'Oran',
    formatType: 'ratio',
    whatItMeasures: 'Stoklar gibi hemen nakde dönemeyen kalemler hariç tutulduğunda kısa vadeli borçların ne hızla ödenebileceğini ölçer.',
    howToInterpret: '1.00 ve üzeri oran şirketin acil nakit baskısı altında olmadığını teyit eder.',
    sectorCaution: 'Banka, Sigorta ve GYO sektörlerinde uygulanmaz.',
    formula: '(Dönen Varlıklar - Stoklar) / Kısa Vadeli Yükümlülükler'
  },
  freeCashFlow: {
    name: 'Serbest Nakit Akışı (FCF)',
    category: 'cashFlow',
    unit: '₺',
    formatType: 'currency',
    whatItMeasures: 'İşletme faaliyetlerinden üretilen nakitten yatırım harcamaları (CapEx) düşüldükten sonra şirkette kalan nakittir.',
    howToInterpret: 'Temettü ödeme, borç kapatma ve yeni yatırımları özkaynakla finanse edebilme gücünün en net göstergesidir.',
    sectorCaution: 'Büyüme aşamasında yoğun yatırım yapan sanayi şirketlerinde geçici olarak negatif olabilir.',
    formula: 'İşletme Faaliyetlerinden Nakit Akışı - Yatırım Harcamaları (CapEx)'
  },
  fcfMargin: {
    name: 'Serbest Nakit Akış Marjı',
    category: 'cashFlow',
    unit: '%',
    formatType: 'percent',
    whatItMeasures: 'Satış gelirlerinin ne kadarlık kısmının serbest nakit akışına dönüştüğünü gösterir.',
    howToInterpret: 'Nakit üretim verimliliğini gösterir. Pozitif ve artan FCF marjı yüksek kaliteli büyümeyi yansıtır.',
    sectorCaution: 'Finansal kuruluşlarda CapEx ve FCF sanayi modeliyle uygulanmaz.',
    formula: '(Serbest Nakit Akışı / Toplam Satışlar) × 100'
  },
  assetTurnover: {
    name: 'Aktif Devir Hızı',
    category: 'efficiency',
    unit: 'x',
    formatType: 'multiple',
    whatItMeasures: 'Şirketin sahip olduğu 1 birim varlıkla kaç birim satış geliri ürettiğini ölçer.',
    howToInterpret: 'Yüksek aktif devir hızı varlıkların etkin ve üretken çalıştırıldığını simgeler.',
    sectorCaution: 'Perakende sektöründe yüksek, ağır sanayide düşüktür.',
    formula: 'Toplam Satışlar / Toplam Varlıklar'
  },
  inventoryTurnover: {
    name: 'Stok Devir Hızı',
    category: 'efficiency',
    unit: 'x',
    formatType: 'multiple',
    whatItMeasures: 'Şirket stoklarının bir dönem içerisinde kaç kez satılıp yenilendiğini gösterir.',
    howToInterpret: 'Yüksek stok devir hızı stokların depoda beklemeden hızlı nakde döndüğünü gösterir.',
    sectorCaution: 'GYO, Banka ve Sigorta sektörlerinde stok devir hızı uygulanmaz.',
    formula: 'Satışların Maliyeti / Stoklar'
  },
  receivablesTurnover: {
    name: 'Alacak Devir Hızı',
    category: 'efficiency',
    unit: 'x',
    formatType: 'multiple',
    whatItMeasures: 'Müşterilerden ticari alacakların bir dönemde kaç kez tahsil edildiğini gösterir.',
    howToInterpret: 'Yüksek oran vadeli satışların hızla tahsil edildiğini ve nakit akışının korunduğunu gösterir.',
    sectorCaution: 'Bankacılık ve Sigorta sektörlerinde uygulanmaz.',
    formula: 'Toplam Satışlar / Ticari Alacaklar'
  }
};

export interface HistoricalPeriodMetrics {
  periodLabel: string;
  year: number;
  quarter: number;
  periodType: 'QUARTERLY' | 'ANNUAL' | 'Quarter' | 'Annual' | 'TTM' | string;
  endDate: string;
  currency: string;
  isDiscreteQuarter: boolean;

  // Statements Raw
  revenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  ebitda: number | null;
  netIncome: number | null;
  
  operatingCashFlow: number | null;
  capitalExpenditures: number | null;
  freeCashFlow: number | null;

  totalAssets: number | null;
  totalLiabilities: number | null;
  totalEquity: number | null;
  cashAndEquivalents: number | null;
  financialDebt: number | null;
  netDebt: number | null;
  currentAssets: number | null;
  currentLiabilities: number | null;
  inventories: number | null;
  receivables: number | null;

  // Per share
  eps: number | null;
  bvps: number | null;
  sharesCount: number | null;

  // Derived Margins (%)
  grossMargin: number | null;
  operatingMargin: number | null;
  ebitdaMargin: number | null;
  netMargin: number | null;
  fcfMargin: number | null;

  // Profitability (%)
  roe: number | null;
  roa: number | null;

  // Leverage & Liquidity
  debtToAssets: number | null;
  debtToEquity: number | null;
  netDebtToEBITDA: number | null;
  currentRatio: number | null;
  quickRatio: number | null;

  // Efficiency
  assetTurnover: number | null;
  inventoryTurnover: number | null;
  receivablesTurnover: number | null;

  // Status mapping
  statuses: Record<string, { status: RatioStatus; reason: string }>;
}

export interface GrowthRecord {
  metricKey: string;
  metricName: string;
  currentPeriodLabel: string;
  previousPeriodLabel: string;
  currentValue: number | null;
  previousValue: number | null;
  growthRatePercent: number | null;
  formattedGrowthRate: string;
  status: 'available' | 'uncalculable' | 'unavailable' | 'not_applicable';
  specialLabel?: string; // e.g. "Zarardan Kâra Geçiş"
  reason: string;
}

export interface HistoricalFinancialAnalysis {
  symbol: string;
  normalizedSymbol: string;
  companyName: string;
  sectorDisplayName: string;
  sectorCategory: SectorCategory;
  currency: string;
  periodTypeRequested: 'quarterly' | 'annual';
  totalPeriodsAvailable: number;
  asOf: string;
  lastUpdated: string;
  periods: HistoricalPeriodMetrics[]; // Chronological (oldest -> newest) for plotting & trends
  growthAnalysis: {
    periodToPeriodGrowth: Record<string, GrowthRecord[]>; // Keyed by metric (revenue, ebitda, netIncome, fcf)
    latestGrowthSummary: Record<string, GrowthRecord>;
  };
  marginTrends: {
    periods: string[];
    grossMargin: (number | null)[];
    operatingMargin: (number | null)[];
    ebitdaMargin: (number | null)[];
    netMargin: (number | null)[];
    fcfMargin: (number | null)[];
  };
  leverageTrends: {
    periods: string[];
    debtToAssets: (number | null)[];
    debtToEquity: (number | null)[];
    netDebtToEBITDA: (number | null)[];
    currentRatio: (number | null)[];
    quickRatio: (number | null)[];
  };
  cashFlowTrends: {
    periods: string[];
    operatingCashFlow: (number | null)[];
    capitalExpenditures: (number | null)[];
    freeCashFlow: (number | null)[];
  };
  educationalDefinitions: Record<string, EducationalMetricDefinition>;
}

/**
 * Helper to compute period growth rate with robust negative base handling
 */
function calculatePeriodGrowth(
  metricKey: string,
  metricName: string,
  currVal: number | null,
  prevVal: number | null,
  currPeriodLabel: string,
  prevPeriodLabel: string,
  isNotApplicable: boolean = false
): GrowthRecord {
  if (isNotApplicable) {
    return {
      metricKey,
      metricName,
      currentPeriodLabel: currPeriodLabel,
      previousPeriodLabel: prevPeriodLabel,
      currentValue: null,
      previousValue: null,
      growthRatePercent: null,
      formattedGrowthRate: '—',
      status: 'not_applicable',
      reason: 'Sektörel olarak bu finansal kalem uygulanmaz.'
    };
  }

  if (currVal == null || prevVal == null || isNaN(currVal) || isNaN(prevVal)) {
    return {
      metricKey,
      metricName,
      currentPeriodLabel: currPeriodLabel,
      previousPeriodLabel: prevPeriodLabel,
      currentValue: currVal,
      previousValue: prevVal,
      growthRatePercent: null,
      formattedGrowthRate: '—',
      status: 'unavailable',
      reason: 'Karşılaştırma için gerekli dönem verisi eksik.'
    };
  }

  if (prevVal === 0) {
    return {
      metricKey,
      metricName,
      currentPeriodLabel: currPeriodLabel,
      previousPeriodLabel: prevPeriodLabel,
      currentValue: currVal,
      previousValue: prevVal,
      growthRatePercent: null,
      formattedGrowthRate: 'Baz Değer Sıfır',
      status: 'uncalculable',
      specialLabel: 'Baz Değer Sıfır',
      reason: 'Önceki dönem baz değeri sıfır olduğu için oransal büyüme hesaplanamaz.'
    };
  }

  if (prevVal < 0) {
    if (currVal > 0) {
      return {
        metricKey,
        metricName,
        currentPeriodLabel: currPeriodLabel,
        previousPeriodLabel: prevPeriodLabel,
        currentValue: currVal,
        previousValue: prevVal,
        growthRatePercent: null,
        formattedGrowthRate: 'Zarardan Kâra Geçiş',
        status: 'uncalculable',
        specialLabel: 'Zarardan Kâra Geçiş',
        reason: `${prevPeriodLabel} dönemindeki zarardan (${prevVal.toLocaleString('tr-TR')} ₺), ${currPeriodLabel} döneminde kâra (${currVal.toLocaleString('tr-TR')} ₺) geçilmiştir.`
      };
    } else {
      return {
        metricKey,
        metricName,
        currentPeriodLabel: currPeriodLabel,
        previousPeriodLabel: prevPeriodLabel,
        currentValue: currVal,
        previousValue: prevVal,
        growthRatePercent: null,
        formattedGrowthRate: 'Zarar Devam Ediyor',
        status: 'uncalculable',
        specialLabel: 'Zarar Devam Ediyor',
        reason: `Her iki dönemde de zarar açıklanmıştır (${prevPeriodLabel}: ${prevVal.toLocaleString('tr-TR')} ₺, ${currPeriodLabel}: ${currVal.toLocaleString('tr-TR')} ₺).`
      };
    }
  }

  const rate = ((currVal - prevVal) / Math.abs(prevVal)) * 100;
  const sign = rate >= 0 ? '+' : '';
  const formatted = `${sign}%${rate.toFixed(2)}`;

  return {
    metricKey,
    metricName,
    currentPeriodLabel: currPeriodLabel,
    previousPeriodLabel: prevPeriodLabel,
    currentValue: currVal,
    previousValue: prevVal,
    growthRatePercent: rate,
    formattedGrowthRate: formatted,
    status: 'available',
    reason: `${prevPeriodLabel} -> ${currPeriodLabel} Karşılaştırmalı Büyüme`
  };
}

/**
 * Main Historical Financial Analysis Calculation Function
 */
export function calculateHistoricalFinancialAnalysis(
  fundamentals: ValidatedFinancialData,
  periodType: 'quarterly' | 'annual' = 'quarterly'
): HistoricalFinancialAnalysis {
  const { symbol, normalizedSymbol, companyName, sectorInfo } = fundamentals;
  const sectorCat = sectorInfo.category;
  const isBank = sectorCat === 'BANK';
  const isInsurance = sectorCat === 'INSURANCE';
  const isREIT = sectorCat === 'REIT';

  // Select target dataset (Quarters or Annuals)
  const rawPeriods: FinancialPeriodData[] = periodType === 'annual'
    ? (fundamentals.annuals || [])
    : (fundamentals.quarters || []);

  const currency = rawPeriods.length > 0 ? (rawPeriods[0].period.currency || 'TRY') : 'TRY';

  // Parse each period into HistoricalPeriodMetrics
  const periodMetricsList: HistoricalPeriodMetrics[] = [];

  for (let i = 0; i < rawPeriods.length; i++) {
    const p = rawPeriods[i];
    const is = p.incomeStatement;
    const bs = p.balanceSheet;
    const cf = p.cashFlowStatement;
    const ps = p.perShare;

    const periodLabel = p.period.periodType === 'ANNUAL' || p.period.periodType === 'Annual'
      ? `${p.period.year} Yıllık`
      : `${p.period.year} Q${p.period.quarter}`;

    const statuses: Record<string, { status: RatioStatus; reason: string }> = {};

    // Helper to register ratio status
    const setStatus = (key: string, status: RatioStatus, reason: string) => {
      statuses[key] = { status, reason };
    };

    // Raw Values
    const revenue = is?.revenue ?? null;
    const grossProfit = is?.grossProfit ?? null;
    const operatingIncome = is?.operatingIncome ?? null;
    const ebitda = is?.ebitda ?? null;
    const netIncome = is?.netIncome ?? null;

    const ocf = cf?.operatingCashFlow ?? null;
    const capex = cf?.capitalExpenditures ?? null;
    let fcf = cf?.freeCashFlow ?? null;
    if (fcf == null && ocf != null && capex != null) {
      fcf = ocf - Math.abs(capex);
    }

    const totalAssets = bs?.totalAssets ?? null;
    const totalLiabilities = bs?.totalLiabilities ?? null;
    const totalEquity = bs?.totalEquity ?? null;
    const cash = bs?.cashAndEquivalents ?? null;
    const finDebt = bs?.financialDebt ?? null;
    const currentAssets = bs?.currentAssets ?? null;
    const currentLiabilities = bs?.currentLiabilities ?? null;
    const inventories = bs?.inventories ?? null;
    const receivables = bs?.receivables ?? null;

    const shares = ps?.weightedAverageShares || ps?.totalShares || null;

    // Derived EPS & BVPS
    let epsVal: number | null = null;
    if (netIncome != null && shares != null && shares > 0) {
      epsVal = netIncome / shares;
      setStatus('eps', 'available', 'Hesaplandı');
    } else if (ps?.basicEPS != null) {
      epsVal = ps.basicEPS;
      setStatus('eps', 'available', 'Hesaplandı');
    } else {
      setStatus('eps', 'insufficient_data', 'Net kâr veya hisse adedi bulunamadı.');
    }

    let bvpsVal: number | null = null;
    if (totalEquity != null && totalEquity > 0 && shares != null && shares > 0) {
      bvpsVal = totalEquity / shares;
      setStatus('bvps', 'available', 'Hesaplandı');
    } else if (ps?.bookValuePerShare != null) {
      bvpsVal = ps.bookValuePerShare;
      setStatus('bvps', 'available', 'Hesaplandı');
    } else {
      setStatus('bvps', 'insufficient_data', 'Özkaynak veya hisse adedi bulunamadı.');
    }

    // Margins
    let grossMargin: number | null = null;
    if (isBank || isInsurance) {
      setStatus('grossMargin', 'not_applicable', 'Banka ve Sigorta sektörlerinde Brüt Kâr Marjı uygulanmaz.');
    } else if (revenue != null && revenue > 0 && grossProfit != null) {
      grossMargin = (grossProfit / revenue) * 100;
      setStatus('grossMargin', 'available', 'Hesaplandı');
    } else if (revenue != null && revenue <= 0) {
      setStatus('grossMargin', 'negative_input', 'Satış geliri negatif veya sıfırdır.');
    } else {
      setStatus('grossMargin', 'insufficient_data', 'Satış geliri veya brüt kâr eksik.');
    }

    let operatingMargin: number | null = null;
    if (isBank) {
      setStatus('operatingMargin', 'not_applicable', 'Bankacılık sektöründe Faaliyet Kâr Marjı uygulanmaz.');
    } else if (revenue != null && revenue > 0 && operatingIncome != null) {
      operatingMargin = (operatingIncome / revenue) * 100;
      setStatus('operatingMargin', 'available', 'Hesaplandı');
    } else if (revenue != null && revenue <= 0) {
      setStatus('operatingMargin', 'negative_input', 'Satış geliri negatif veya sıfırdır.');
    } else {
      setStatus('operatingMargin', 'insufficient_data', 'Satış geliri veya faaliyet kârı eksik.');
    }

    let ebitdaMargin: number | null = null;
    if (isBank || isInsurance) {
      setStatus('ebitdaMargin', 'not_applicable', 'Banka ve Sigorta sektörlerinde FAVÖK Marjı uygulanmaz.');
    } else if (revenue != null && revenue > 0 && ebitda != null) {
      ebitdaMargin = (ebitda / revenue) * 100;
      setStatus('ebitdaMargin', 'available', 'Hesaplandı');
    } else if (revenue != null && revenue <= 0) {
      setStatus('ebitdaMargin', 'negative_input', 'Satış geliri negatif veya sıfırdır.');
    } else {
      setStatus('ebitdaMargin', 'insufficient_data', 'Satış geliri veya FAVÖK eksik.');
    }

    let netMargin: number | null = null;
    if (revenue != null && revenue > 0 && netIncome != null) {
      netMargin = (netIncome / revenue) * 100;
      setStatus('netMargin', 'available', 'Hesaplandı');
    } else if (revenue != null && revenue <= 0) {
      setStatus('netMargin', 'negative_input', 'Satış geliri negatif veya sıfırdır.');
    } else {
      setStatus('netMargin', 'insufficient_data', 'Satış geliri veya net kâr eksik.');
    }

    let fcfMargin: number | null = null;
    if (isBank || isInsurance) {
      setStatus('fcfMargin', 'not_applicable', 'Banka ve Sigorta sektörlerinde Serbest Nakit Akışı uygulanmaz.');
    } else if (revenue != null && revenue > 0 && fcf != null) {
      fcfMargin = (fcf / revenue) * 100;
      setStatus('fcfMargin', 'available', 'Hesaplandı');
    } else if (revenue != null && revenue <= 0) {
      setStatus('fcfMargin', 'negative_input', 'Satış geliri negatif veya sıfırdır.');
    } else {
      setStatus('fcfMargin', 'insufficient_data', 'Satış geliri veya serbest nakit akışı eksik.');
    }

    // Profitability (ROE, ROA)
    let roe: number | null = null;
    if (totalEquity != null && totalEquity <= 0) {
      setStatus('roe', 'negative_input', 'Özkaynaklar negatif veya sıfır olduğu için ROE hesaplanmadı.');
    } else if (netIncome != null && totalEquity != null && totalEquity > 0) {
      roe = (netIncome / totalEquity) * 100;
      setStatus('roe', 'available', 'Hesaplandı');
    } else {
      setStatus('roe', 'insufficient_data', 'Net kâr veya özkaynak verisi eksik.');
    }

    let roa: number | null = null;
    if (totalAssets != null && totalAssets <= 0) {
      setStatus('roa', 'negative_input', 'Toplam varlıklar negatif veya sıfır olduğu için ROA hesaplanmadı.');
    } else if (netIncome != null && totalAssets != null && totalAssets > 0) {
      roa = (netIncome / totalAssets) * 100;
      setStatus('roa', 'available', 'Hesaplandı');
    } else {
      setStatus('roa', 'insufficient_data', 'Net kâr veya toplam aktif verisi eksik.');
    }

    // Leverage
    let debtToAssets: number | null = null;
    if (finDebt != null && totalAssets != null && totalAssets > 0) {
      debtToAssets = (finDebt / totalAssets) * 100;
      setStatus('debtToAssets', 'available', 'Hesaplandı');
    } else if (totalLiabilities != null && totalAssets != null && totalAssets > 0) {
      debtToAssets = (totalLiabilities / totalAssets) * 100;
      setStatus('debtToAssets', 'available', 'Toplam Borç / Aktifler üzerinden hesaplandı');
    } else {
      setStatus('debtToAssets', 'insufficient_data', 'Borç veya varlık verisi eksik.');
    }

    let debtToEquity: number | null = null;
    if (isBank) {
      setStatus('debtToEquity', 'not_applicable', 'Bankacılık sektöründe Finansal Borç / Özkaynak uygulanmaz.');
    } else if (totalEquity != null && totalEquity <= 0) {
      setStatus('debtToEquity', 'negative_input', 'Özkaynaklar negatif veya sıfırdır.');
    } else if (finDebt != null && totalEquity != null && totalEquity > 0) {
      debtToEquity = finDebt / totalEquity;
      setStatus('debtToEquity', 'available', 'Hesaplandı');
    } else {
      setStatus('debtToEquity', 'insufficient_data', 'Finansal borç veya özkaynak eksik.');
    }

    let netDebt: number | null = null;
    let netDebtToEBITDA: number | null = null;
    if (isBank || isInsurance) {
      setStatus('netDebtToEBITDA', 'not_applicable', 'Banka ve Sigorta sektörlerinde Net Borç / FAVÖK uygulanmaz.');
    } else {
      if (finDebt != null && cash != null) {
        netDebt = finDebt - cash;
      }
      if (ebitda != null && ebitda <= 0) {
        setStatus('netDebtToEBITDA', 'negative_input', 'FAVÖK negatif veya sıfır olduğu için Net Borç / FAVÖK hesaplanmadı.');
      } else if (netDebt != null && ebitda != null && ebitda > 0) {
        netDebtToEBITDA = netDebt / ebitda;
        setStatus('netDebtToEBITDA', 'available', 'Hesaplandı');
      } else {
        setStatus('netDebtToEBITDA', 'insufficient_data', 'Net borç veya FAVÖK eksik.');
      }
    }

    // Liquidity
    let currentRatio: number | null = null;
    let quickRatio: number | null = null;
    if (isBank || isInsurance || isREIT) {
      setStatus('currentRatio', 'not_applicable', 'Banka, Sigorta ve GYO sektörlerinde Cari Oran uygulanmaz.');
      setStatus('quickRatio', 'not_applicable', 'Banka, Sigorta ve GYO sektörlerinde Asit-Test Oranı uygulanmaz.');
    } else {
      if (currentAssets != null && currentLiabilities != null && currentLiabilities > 0) {
        currentRatio = currentAssets / currentLiabilities;
        setStatus('currentRatio', 'available', 'Hesaplandı');
      } else {
        setStatus('currentRatio', 'insufficient_data', 'Dönen varlık veya kısa vadeli borç eksik.');
      }

      if (currentAssets != null && currentLiabilities != null && currentLiabilities > 0 && inventories != null) {
        quickRatio = (currentAssets - inventories) / currentLiabilities;
        setStatus('quickRatio', 'available', 'Hesaplandı');
      } else {
        setStatus('quickRatio', 'insufficient_data', 'Stok veya likidite verisi eksik.');
      }
    }

    // Efficiency
    let assetTurnover: number | null = null;
    let inventoryTurnover: number | null = null;
    let receivablesTurnover: number | null = null;

    if (isBank || isInsurance) {
      setStatus('assetTurnover', 'not_applicable', 'Banka ve Sigortacılıkta Aktif Devir Hızı uygulanmaz.');
      setStatus('inventoryTurnover', 'not_applicable', 'Banka ve Sigortacılıkta Stok Devir Hızı uygulanmaz.');
      setStatus('receivablesTurnover', 'not_applicable', 'Banka ve Sigortacılıkta Alacak Devir Hızı uygulanmaz.');
    } else {
      if (revenue != null && totalAssets != null && totalAssets > 0) {
        assetTurnover = revenue / totalAssets;
        setStatus('assetTurnover', 'available', 'Hesaplandı');
      }

      if (revenue != null && grossProfit != null && inventories != null && inventories > 0) {
        const cogs = revenue - grossProfit;
        if (cogs > 0) {
          inventoryTurnover = cogs / inventories;
          setStatus('inventoryTurnover', 'available', 'Hesaplandı');
        }
      }

      if (revenue != null && receivables != null && receivables > 0) {
        receivablesTurnover = revenue / receivables;
        setStatus('receivablesTurnover', 'available', 'Hesaplandı');
      }
    }

    periodMetricsList.push({
      periodLabel,
      year: p.period.year,
      quarter: p.period.quarter,
      periodType: p.period.periodType,
      endDate: p.period.endDate,
      currency: p.period.currency || currency,
      isDiscreteQuarter: p.period.isDiscreteQuarter,

      revenue,
      grossProfit,
      operatingIncome,
      ebitda,
      netIncome,

      operatingCashFlow: ocf,
      capitalExpenditures: capex,
      freeCashFlow: fcf,

      totalAssets,
      totalLiabilities,
      totalEquity,
      cashAndEquivalents: cash,
      financialDebt: finDebt,
      netDebt,
      currentAssets,
      currentLiabilities,
      inventories,
      receivables,

      eps: epsVal,
      bvps: bvpsVal,
      sharesCount: shares,

      grossMargin,
      operatingMargin,
      ebitdaMargin,
      netMargin,
      fcfMargin,

      roe,
      roa,

      debtToAssets,
      debtToEquity,
      netDebtToEBITDA,
      currentRatio,
      quickRatio,

      assetTurnover,
      inventoryTurnover,
      receivablesTurnover,

      statuses
    });
  }

  // Sort chronologically (oldest -> newest) for trends and growth series
  const chronologicalPeriods = [...periodMetricsList].reverse();

  // Growth Analysis across chronological periods
  const growthMetricsMap: Record<string, GrowthRecord[]> = {
    revenue: [],
    grossProfit: [],
    operatingIncome: [],
    ebitda: [],
    netIncome: [],
    freeCashFlow: [],
    eps: []
  };

  const metricLabelMap: Record<string, { name: string; isNotApplicable: boolean }> = {
    revenue: { name: 'Satış Gelirleri', isNotApplicable: false },
    grossProfit: { name: 'Brüt Kâr', isNotApplicable: isBank || isInsurance },
    operatingIncome: { name: 'Faaliyet Kârı', isNotApplicable: isBank },
    ebitda: { name: 'FAVÖK', isNotApplicable: isBank || isInsurance },
    netIncome: { name: 'Net Dönem Kârı', isNotApplicable: false },
    freeCashFlow: { name: 'Serbest Nakit Akışı (FCF)', isNotApplicable: isBank || isInsurance },
    eps: { name: 'Hisse Başı Kâr (EPS)', isNotApplicable: false }
  };

  for (let i = 1; i < chronologicalPeriods.length; i++) {
    const prev = chronologicalPeriods[i - 1];
    const curr = chronologicalPeriods[i];

    for (const key of Object.keys(growthMetricsMap)) {
      const cfg = metricLabelMap[key];
      const prevVal = (prev as any)[key] ?? null;
      const currVal = (curr as any)[key] ?? null;

      const record = calculatePeriodGrowth(
        key,
        cfg.name,
        currVal,
        prevVal,
        curr.periodLabel,
        prev.periodLabel,
        cfg.isNotApplicable
      );

      growthMetricsMap[key].push(record);
    }
  }

  // Latest Growth Summary
  const latestGrowthSummary: Record<string, GrowthRecord> = {};
  for (const key of Object.keys(growthMetricsMap)) {
    const list = growthMetricsMap[key];
    if (list.length > 0) {
      latestGrowthSummary[key] = list[list.length - 1];
    }
  }

  // Margin Trends
  const marginTrends = {
    periods: chronologicalPeriods.map(p => p.periodLabel),
    grossMargin: chronologicalPeriods.map(p => p.grossMargin),
    operatingMargin: chronologicalPeriods.map(p => p.operatingMargin),
    ebitdaMargin: chronologicalPeriods.map(p => p.ebitdaMargin),
    netMargin: chronologicalPeriods.map(p => p.netMargin),
    fcfMargin: chronologicalPeriods.map(p => p.fcfMargin)
  };

  // Leverage Trends
  const leverageTrends = {
    periods: chronologicalPeriods.map(p => p.periodLabel),
    debtToAssets: chronologicalPeriods.map(p => p.debtToAssets),
    debtToEquity: chronologicalPeriods.map(p => p.debtToEquity),
    netDebtToEBITDA: chronologicalPeriods.map(p => p.netDebtToEBITDA),
    currentRatio: chronologicalPeriods.map(p => p.currentRatio),
    quickRatio: chronologicalPeriods.map(p => p.quickRatio)
  };

  // Cash Flow Trends
  const cashFlowTrends = {
    periods: chronologicalPeriods.map(p => p.periodLabel),
    operatingCashFlow: chronologicalPeriods.map(p => p.operatingCashFlow),
    capitalExpenditures: chronologicalPeriods.map(p => p.capitalExpenditures),
    freeCashFlow: chronologicalPeriods.map(p => p.freeCashFlow)
  };

  const nowIso = new Date().toISOString();

  return {
    symbol,
    normalizedSymbol,
    companyName,
    sectorDisplayName: sectorInfo.displayName,
    sectorCategory: sectorCat,
    currency,
    periodTypeRequested: periodType,
    totalPeriodsAvailable: periodMetricsList.length,
    asOf: nowIso,
    lastUpdated: nowIso,
    periods: chronologicalPeriods,
    growthAnalysis: {
      periodToPeriodGrowth: growthMetricsMap,
      latestGrowthSummary
    },
    marginTrends,
    leverageTrends,
    cashFlowTrends,
    educationalDefinitions: EDUCATIONAL_METRICS
  };
}
