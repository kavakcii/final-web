/**
 * FinAI Financial Ratio Engine - Stage 3
 * Comprehensive Financial Ratio Calculator, Sector Adaptor & Educational Tooltip Engine
 */

import { ValidatedFinancialData } from '@/types/financials';

export type RatioStatus =
  | 'available'
  | 'unavailable'
  | 'not_applicable'
  | 'insufficient_history'
  | 'low_quality';

export interface EducationalTooltip {
  whatItMeasures: string;
  howToInterpret: string;
  sectorCaution: string;
  finaiFormula: string;
}

export interface RatioItem {
  key: string;
  name: string;
  value: number | null;
  formattedValue: string;
  unit: string;
  status: RatioStatus;
  reason: string;
  methodology: string;
  periodLabel: string;
  educationalTooltip: EducationalTooltip;
}

export interface CategoryRatios {
  categoryKey: string;
  categoryName: string;
  description: string;
  ratios: RatioItem[];
}

export interface CalculatedFinancialRatios {
  symbol: string;
  companyName: string;
  sector: string;
  asOf: string;
  livePrice: number | null;
  marketCap: number | null;
  enterpriseValue: number | null;
  categories: {
    profitability: CategoryRatios;
    liquidity: CategoryRatios;
    leverage: CategoryRatios;
    valuation: CategoryRatios;
    perShare: CategoryRatios;
    operational: CategoryRatios;
  };
  quality: {
    status: string;
    completeness: number;
    warnings: string[];
    availableRatioCount: number;
    totalRatioCount: number;
  };
  sourceMetadata: {
    source: string;
    fetchedAt: string;
    verifiedAt: string;
    quality: string;
  };
}

// Format Helper
function formatRatioValue(val: number | null, type: 'percent' | 'multiple' | 'currency' | 'ratio'): string {
  if (val == null || isNaN(val) || !isFinite(val)) return '—';
  if (type === 'percent') return `%${val.toFixed(2)}`;
  if (type === 'multiple') return `${val.toFixed(2)}x`;
  if (type === 'currency') return `${val.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺`;
  return val.toFixed(2);
}

/**
 * Calculates complete financial ratios for a stock with strict sector awareness and educational tooltips
 */
export function calculateFinancialRatios(
  fundamentals: ValidatedFinancialData,
  livePriceInput: number | null = null
): CalculatedFinancialRatios {
  const { symbol, companyName, sectorInfo, quality, ttm, quarters } = fundamentals;
  const sectorCat = sectorInfo.category;
  const isBank = sectorCat === 'BANK';
  const isInsurance = sectorCat === 'INSURANCE';
  const isREIT = sectorCat === 'REIT';
  const isETF = sectorCat === 'OTHER' || sectorInfo.displayName.includes('Borsa Yatırım Fonu') || sectorInfo.displayName.includes('Sertifika');

  const latestBs = ttm?.latestBalanceSheetSnapshot || (quarters && quarters.length > 0 ? quarters[0].balanceSheet : null);
  const latestIsTTM = ttm?.incomeStatementTTM || null;
  const latestPs = quarters && quarters.length > 0 ? quarters[0].perShare : null;

  const periodLabel = ttm ? `TTM · ${quarters[0]?.period?.year || ''} Q${quarters[0]?.period?.quarter || ''}` : (quarters && quarters.length > 0 ? `${quarters[0].period.year} Q${quarters[0].period.quarter}` : 'Dönem Bilgisi Yok');
  const hasTTM = ttm != null && ttm.isVerified;

  // Live Price and Shares Calculation (STRICT: NO FAKE SYNTHETIC PRICE FALLBACK)
  const totalShares = latestPs?.weightedAverageShares || latestPs?.totalShares || null;
  const livePrice = (livePriceInput != null && livePriceInput > 0) ? livePriceInput : null;
  
  const marketCap = (livePrice != null && totalShares != null && totalShares > 0) ? livePrice * totalShares : null;
  const financialDebt = latestBs?.financialDebt ?? null;
  const cash = latestBs?.cashAndEquivalents ?? null;
  const netDebt = latestBs?.netDebt ?? (isBank || isInsurance ? null : (financialDebt != null && cash != null ? financialDebt - cash : null));
  
  // EV Calculation (STRICT: Requires valid market cap, financial debt, and cash)
  const enterpriseValue = (marketCap != null && financialDebt != null && cash != null) 
    ? marketCap + financialDebt - cash 
    : null;

  let availableCount = 0;
  let totalCount = 0;

  function createRatio(
    key: string,
    name: string,
    rawVal: number | null,
    formatType: 'percent' | 'multiple' | 'currency' | 'ratio',
    unit: string,
    isSectorDisabled: boolean,
    sectorDisabledReason: string,
    methodology: string,
    tooltip: EducationalTooltip,
    requiresTTM: boolean = false,
    customOverrideReason?: string
  ): RatioItem {
    totalCount++;
    let status: RatioStatus = 'available';
    let reason = 'Başarıyla hesaplandı.';
    let val: number | null = rawVal;

    if (isETF) {
      status = 'not_applicable';
      reason = 'Borsa Yatırım Fonu / Sertifika - Bilanço Rasyoları Uygulanamaz.';
      val = null;
    } else if (isSectorDisabled) {
      status = 'not_applicable';
      reason = sectorDisabledReason;
      val = null;
    } else if (requiresTTM && !hasTTM) {
      status = 'insufficient_history';
      reason = 'TTM hesabı için 4 çeyreklik bilanço geçmişi henüz tamamlanmadı.';
      val = null;
    } else if (customOverrideReason) {
      status = 'unavailable';
      reason = customOverrideReason;
      val = null;
    } else if (val == null || isNaN(val) || !isFinite(val)) {
      status = 'unavailable';
      reason = 'Gerekli bilanço veya gelir tablosu verisi temin edilemedi.';
      val = null;
    } else {
      availableCount++;
    }

    return {
      key,
      name,
      value: val,
      formattedValue: formatRatioValue(val, formatType),
      unit,
      status,
      reason,
      methodology,
      periodLabel,
      educationalTooltip: tooltip
    };
  }

  // Income Statement TTM Metrics
  const revenue = latestIsTTM?.revenue ?? null;
  const grossProfit = latestIsTTM?.grossProfit ?? null;
  const operatingIncome = latestIsTTM?.operatingIncome ?? null;
  const ebitda = latestIsTTM?.ebitda ?? null;
  const netIncome = latestIsTTM?.netIncome ?? null;

  // Balance Sheet Items for ROE & ROA (Average calculation if 2+ periods available)
  const endingEquity = latestBs?.totalEquity ?? null;
  const endingAssets = latestBs?.totalAssets ?? null;

  const beginningPeriod = quarters && quarters.length >= 4 
    ? quarters[3] 
    : (quarters && quarters.length >= 2 ? quarters[quarters.length - 1] : null);

  const beginningEquity = beginningPeriod?.balanceSheet?.totalEquity ?? null;
  const beginningAssets = beginningPeriod?.balanceSheet?.totalAssets ?? null;

  // ROE (Net Income / Average Equity)
  let roeVal: number | null = null;
  let roeMethodology = 'TTM Net Kâr / Ortalama Özkaynak';
  if (netIncome != null) {
    if (endingEquity != null && beginningEquity != null && (endingEquity + beginningEquity) > 0) {
      const avgEquity = (endingEquity + beginningEquity) / 2;
      roeVal = (netIncome / avgEquity) * 100;
      roeMethodology = 'TTM Net Kâr / Ortalama Özkaynak ((Başlangıç + Bitiş) / 2)';
    } else if (endingEquity != null && endingEquity > 0) {
      roeVal = (netIncome / endingEquity) * 100;
      roeMethodology = 'TTM Net Kâr / Dönem Sonu Özkaynak (Tek Dönem Fallback)';
    }
  }

  // ROA (Net Income / Average Assets)
  let roaVal: number | null = null;
  let roaMethodology = 'TTM Net Kâr / Ortalama Toplam Varlıklar';
  if (netIncome != null) {
    if (endingAssets != null && beginningAssets != null && (endingAssets + beginningAssets) > 0) {
      const avgAssets = (endingAssets + beginningAssets) / 2;
      roaVal = (netIncome / avgAssets) * 100;
      roaMethodology = 'TTM Net Kâr / Ortalama Toplam Varlıklar ((Başlangıç + Bitiş) / 2)';
    } else if (endingAssets != null && endingAssets > 0) {
      roaVal = (netIncome / endingAssets) * 100;
      roaMethodology = 'TTM Net Kâr / Dönem Sonu Varlıklar (Tek Dönem Fallback)';
    }
  }

  // Margins
  const grossMarginVal = (grossProfit != null && revenue != null && revenue > 0) ? (grossProfit / revenue) * 100 : null;
  const operatingMarginVal = (operatingIncome != null && revenue != null && revenue > 0) ? (operatingIncome / revenue) * 100 : null;
  const ebitdaMarginVal = (ebitda != null && revenue != null && revenue > 0) ? (ebitda / revenue) * 100 : null;
  const netMarginVal = (netIncome != null && revenue != null && revenue > 0) ? (netIncome / revenue) * 100 : null;

  // A) PROFITABILITY RATIOS (KÂRLILIK)
  const profitability: CategoryRatios = {
    categoryKey: 'profitability',
    categoryName: 'Kârlılık Oranları',
    description: 'Şirketin satışlarından ve varlıklarından ne derece etkin kâr ürettiğini ölçer.',
    ratios: [
      createRatio(
        'grossMargin',
        'Brüt Kâr Marjı',
        grossMarginVal,
        'percent',
        '%',
        isBank || isInsurance,
        'Bankacılık ve Sigortacılık sektörlerinde Brüt Kâr Marjı yerine Net Faiz / Prim Gelirleri takip edilir.',
        'TTM Brüt Kâr / TTM Toplam Satışlar',
        {
          whatItMeasures: 'Şirketin ürün ve hizmetlerini üretim maliyetinin ne kadar üzerinde satabildiğini gösterir.',
          howToInterpret: 'Yüksek brüt kâr marjı güçlü fiyatlama gücünü ve operasyonel verimliliği simgeler.',
          sectorCaution: 'Sanayi şirketlerinde marj seviyesi hammadde maliyetlerine bağlıyken perakendede daha düşük seyredebilir.',
          finaiFormula: 'Brüt Kâr Marjı (%) = (TTM Brüt Kâr / TTM Toplam Satışlar) × 100'
        },
        true
      ),
      createRatio(
        'operatingMargin',
        'Faaliyet Kâr Marjı',
        operatingMarginVal,
        'percent',
        '%',
        isBank,
        'Bankacılık sektöründe ana faaliyet kârı Net Faiz ve Komisyon Gelirleri ile takip edilir.',
        'TTM Faaliyet Kârı / TTM Toplam Satışlar',
        {
          whatItMeasures: 'Şirketin esas faaliyetlerinden elde ettiği kârlılık performansını ölçer.',
          howToInterpret: 'Yüksek faaliyet kâr marjı, şirketin operasyonel giderlerini etkin yönettiğini gösterir.',
          sectorCaution: 'Teknoloji şirketlerinde yüksek marjlar görülebilirken sanayide sektörel döngüler etkilidir.',
          finaiFormula: 'Faaliyet Kâr Marjı (%) = (TTM Faaliyet Kârı / TTM Toplam Satışlar) × 100'
        },
        true
      ),
      createRatio(
        'ebitdaMargin',
        'FAVÖK Marjı',
        ebitdaMarginVal,
        'percent',
        '%',
        isBank || isInsurance,
        'Bankacılık ve Sigortacılık sektörlerinde FAVÖK kalemi hesaplanmaz.',
        'TTM FAVÖK / TTM Toplam Satışlar',
        {
          whatItMeasures: 'Faiz, vergi ve amortisman öncesi nakit kârlılık kapasitesini ölçer.',
          howToInterpret: 'Nakit akış kalitesini ve operasyonel nakit üretimini gösteren temel finansal göstergedir.',
          sectorCaution: 'Sermaye yoğun sanayi ve enerji sektörlerinde kritik önem taşır.',
          finaiFormula: 'FAVÖK Marjı (%) = (TTM FAVÖK / TTM Toplam Satışlar) × 100'
        },
        true
      ),
      createRatio(
        'netMargin',
        'Net Kâr Marjı',
        netMarginVal,
        'percent',
        '%',
        false,
        '',
        'TTM Net Kâr / TTM Toplam Satışlar',
        {
          whatItMeasures: 'Satılan ürünlerden tüm giderler ve vergiler düşüldükten sonra kalan kâr oranını gösterir.',
          howToInterpret: 'Net kâr marjının artması nihai kârlılığın yükseldiğini teyit eder.',
          sectorCaution: 'Tek seferlik gayrimenkul veya iştirak satış kârları net marjı geçici olarak yükseltebilir.',
          finaiFormula: 'Net Kâr Marjı (%) = (TTM Net Kâr / TTM Toplam Satışlar) × 100'
        },
        true
      ),
      createRatio(
        'roe',
        'Özkaynak Kârlılığı (ROE)',
        roeVal,
        'percent',
        '%',
        false,
        '',
        roeMethodology,
        {
          whatItMeasures: 'Ortakların koyduğu sermaye karşılığında şirketin ürettiği kâr getiri oranını gösterir.',
          howToInterpret: 'Enflasyonun üzerinde bir ROE oranı şirketin özsermayesini koruduğunu gösterir.',
          sectorCaution: 'Aşırı borçlanan şirketlerde ROE yüksek çıkabilir; borçlulukla birlikte incelenmelidir.',
          finaiFormula: 'ROE (%) = (TTM Net Kâr / Ortalama Özkaynaklar) × 100'
        },
        true
      ),
      createRatio(
        'roa',
        'Aktif Kârlılık (ROA)',
        roaVal,
        'percent',
        '%',
        false,
        '',
        roaMethodology,
        {
          whatItMeasures: 'Şirketin yönetimindeki tüm varlıkları (aktifleri) ne kadar kârlı kullandığını ölçer.',
          howToInterpret: 'ROA oranının yüksekliği varlık verimliliğinin ve operasyonel kalitenin göstergesidir.',
          sectorCaution: 'Bankalarda varlık yapısı kredi odaklı olduğundan ROA %1-3 bandında seyreder.',
          finaiFormula: 'ROA (%) = (TTM Net Kâr / Ortalama Toplam Varlıklar) × 100'
        },
        true
      )
    ]
  };

  // B) LIQUIDITY RATIOS (LİKİDİTE)
  const currentAssets = latestBs?.currentAssets ?? null;
  const currentLiabilities = latestBs?.currentLiabilities ?? null;
  const inventories = latestBs?.inventories ?? null;

  const currentRatioVal = (currentAssets != null && currentLiabilities != null && currentLiabilities > 0) ? currentAssets / currentLiabilities : null;
  const quickRatioVal = (currentAssets != null && currentLiabilities != null && currentLiabilities > 0 && inventories != null) 
    ? (currentAssets - inventories) / currentLiabilities 
    : null;

  const liquidity: CategoryRatios = {
    categoryKey: 'liquidity',
    categoryName: 'Likidite Oranları',
    description: 'Şirketin kısa vadeli borçlarını ödeme ve likit varlık yeterliliğini gösterir.',
    ratios: [
      createRatio(
        'currentRatio',
        'Cari Oran',
        currentRatioVal,
        'ratio',
        '',
        isBank || isInsurance || isREIT,
        'Bankacılık, Sigorta ve GYO bilançolarında dönen/duran varlık ayrımı sanayi modeli gibi yorumlanmaz.',
        'Dönen Varlıklar / Kısa Vadeli Yükümlülükler',
        {
          whatItMeasures: 'Şirketin 1 yıl içinde nakde dönebilecek varlıklarının kısa vadeli borçlarını karşılama oranını ölçer.',
          howToInterpret: 'Genel kabul gören seviye 1.50 - 2.00 arasıdır. 1.00 altı kısa vadeli likidite takibi gerektirir.',
          sectorCaution: 'Perakende sektöründe hızlı stok devri nedeniyle 1.00 seviyesine yakın oranlar normal karşılanabilir.',
          finaiFormula: 'Cari Oran = Dönen Varlıklar / Kısa Vadeli Yükümlülükler'
        }
      ),
      createRatio(
        'quickRatio',
        'Asit-Test (Hızlı) Oranı',
        quickRatioVal,
        'ratio',
        '',
        isBank || isInsurance || isREIT,
        'Banka, Sigorta ve GYO sektörlerinde Asit-Test oranı uygulanmaz.',
        '(Dönen Varlıklar - Stoklar) / Kısa Vadeli Yükümlülükler',
        {
          whatItMeasures: 'Stoklar hemen satılamayacağı varsayımıyla, en likit varlıkların borç ödeme kapasitesini gösterir.',
          howToInterpret: '1.00 ve üzeri olması şirketin nakit borç ödeme baskısı altında olmadığını simgeler.',
          sectorCaution: 'Hızlı nakit akışı olan sektörlerde 0.80-1.00 arası kabul edilebilir.',
          finaiFormula: 'Asit-Test Oranı = (Dönen Varlıklar - Stoklar) / Kısa Vadeli Yükümlülükler'
        }
      )
    ]
  };

  // C) LEVERAGE RATIOS (BORÇLULUK)
  const debtToAssetsVal = (financialDebt != null && endingAssets != null && endingAssets > 0) 
    ? (financialDebt / endingAssets) * 100 
    : ((latestBs?.totalLiabilities != null && endingAssets != null && endingAssets > 0) ? (latestBs.totalLiabilities / endingAssets) * 100 : null);
  
  const debtToEquityVal = (financialDebt != null && endingEquity != null && endingEquity > 0) ? financialDebt / endingEquity : null;

  // Net Debt / EBITDA Rule: EBITDA <= 0 => NULL
  let netDebtToEBITDAVal: number | null = null;
  let netDebtToEBITDAReason: string | undefined = undefined;

  if (ebitda != null && ebitda <= 0) {
    netDebtToEBITDAVal = null;
    netDebtToEBITDAReason = 'Net Borç / FAVÖK hesaplanamıyor — TTM FAVÖK negatif veya sıfır.';
  } else if (netDebt != null && ebitda != null && ebitda > 0) {
    netDebtToEBITDAVal = netDebt / ebitda;
  } else if (netDebt == null) {
    netDebtToEBITDAReason = 'Net borç verisi temin edilemedi.';
  }

  const leverage: CategoryRatios = {
    categoryKey: 'leverage',
    categoryName: 'Borçluluk & Kaldıraç',
    description: 'Şirketin borç yükünü, finansal risk seviyesini ve sermaye yapısını değerlendirir.',
    ratios: [
      createRatio(
        'debtToAssets',
        'Borç / Toplam Varlıklar',
        debtToAssetsVal,
        'percent',
        '%',
        false,
        '',
        'Toplam Borçlar / Toplam Varlıklar',
        {
          whatItMeasures: 'Şirket varlıklarının ne kadarlık kısmının borçlanma ile finanse edildiğini gösterir.',
          howToInterpret: 'Oranın %50-60 seviyelerinde olması makul kabul edilir; sektör yapısına göre değişir.',
          sectorCaution: 'Sermaye yoğun sektörlerde borçluluk oranı doğal olarak daha yüksek seyrebilir.',
          finaiFormula: 'Borç / Varlıklar (%) = (Toplam Borçlar / Toplam Varlıklar) × 100'
        }
      ),
      createRatio(
        'debtToEquity',
        'Finansal Borç / Özkaynak',
        debtToEquityVal,
        'ratio',
        '',
        isBank,
        'Bankacılık sektöründe mevduat ana kaynak olduğu için Finansal Borç / Özkaynak sanayi mantığıyla uygulanmaz.',
        'Finansal Borçlar / Toplam Özkaynaklar',
        {
          whatItMeasures: 'Banka kredileri ve ihraç edilen tahvillerin özsermayeye oranını ölçer.',
          howToInterpret: '0.50 - 1.00 arası seviyeler genel kabul görür. 1.50 üzeri yüksek borçluluk takibi gerektirir.',
          sectorCaution: 'Altyapı ve enerji şirketleri uzun vadeli proje kredileri kullandığından oran yüksek çıkabilir.',
          finaiFormula: 'Finansal Borç / Özkaynak = Finansal Borçlar / Toplam Özkaynaklar'
        }
      ),
      createRatio(
        'netDebtToEBITDA',
        'Net Borç / FAVÖK',
        netDebtToEBITDAVal,
        'multiple',
        'x',
        isBank || isInsurance,
        'Bankacılık ve Sigortacılık sektörlerinde Net Borç / FAVÖK kalemi hesaplanmaz.',
        'Net Borç / TTM FAVÖK',
        {
          whatItMeasures: 'Mevcut operasyonel kârlılıkla net borcun kaç yılda kapatılabileceğini gösterir.',
          howToInterpret: '2.0x altı makul, 3.5x üzeri yüksek borç yükü göstergesi olarak incelenir.',
          sectorCaution: 'Net nakit pozisyonunda olan (nakdi borcundan fazla) şirketlerde oran negatif/sıfır olarak değerlendirilir.',
          finaiFormula: 'Net Borç / FAVÖK = (Finansal Borç - Nakit) / TTM FAVÖK'
        },
        true,
        netDebtToEBITDAReason
      )
    ]
  };

  // D) VALUATION RATIOS (DEĞERLEME)
  const weightedShares = latestPs?.weightedAverageShares || latestPs?.totalShares || null;
  const shareCount = latestPs?.totalShares || latestPs?.weightedAverageShares || null;

  // EPS Method: TTM Net Profit / Weighted Average Shares
  let epsVal: number | null = null;
  let epsReason: string | undefined = undefined;
  if (netIncome != null && weightedShares != null && weightedShares > 0) {
    epsVal = netIncome / weightedShares;
  } else if (latestPs?.basicEPS != null) {
    epsVal = latestPs.basicEPS;
  } else {
    epsVal = null;
    epsReason = 'Yeterli hisse adedi veya TTM net kâr verisi bulunamadı.';
  }

  // BVPS Method: Equity / Share Count
  let bvpsVal: number | null = null;
  if (endingEquity != null && shareCount != null && shareCount > 0) {
    bvpsVal = endingEquity / shareCount;
  } else if (latestPs?.bookValuePerShare != null) {
    bvpsVal = latestPs.bookValuePerShare;
  }

  // P/E Rule: Net Income <= 0 or EPS <= 0 => NULL
  let peVal: number | null = null;
  let peReason: string | undefined = undefined;
  if (netIncome != null && netIncome <= 0) {
    peVal = null;
    peReason = 'F/K hesaplanamıyor — TTM net kâr negatif veya sıfır.';
  } else if (epsVal != null && epsVal <= 0) {
    peVal = null;
    peReason = 'F/K hesaplanamıyor — Hisse başı kâr (EPS) negatif veya sıfır.';
  } else if (livePrice != null && epsVal != null && epsVal > 0) {
    peVal = livePrice / epsVal;
  } else if (marketCap != null && netIncome != null && netIncome > 0) {
    peVal = marketCap / netIncome;
  } else if (livePrice == null) {
    peReason = 'Canlı fiyat verisi bekleniyor.';
  }

  // P/B Rule: Equity <= 0 or BVPS <= 0 => NULL
  let pbVal: number | null = null;
  let pbReason: string | undefined = undefined;
  if (endingEquity != null && endingEquity <= 0) {
    pbVal = null;
    pbReason = 'PD/DD hesaplanamıyor — Toplam özkaynaklar negatif veya sıfır.';
  } else if (bvpsVal != null && bvpsVal <= 0) {
    pbVal = null;
    pbReason = 'PD/DD hesaplanamıyor — Hisse başı defter değeri (BVPS) negatif veya sıfır.';
  } else if (livePrice != null && bvpsVal != null && bvpsVal > 0) {
    pbVal = livePrice / bvpsVal;
  } else if (marketCap != null && endingEquity != null && endingEquity > 0) {
    pbVal = marketCap / endingEquity;
  } else if (livePrice == null) {
    pbReason = 'Canlı fiyat verisi bekleniyor.';
  }

  // EV/EBITDA Rule: EBITDA <= 0 or EV == null => NULL
  let evToEBITDAVal: number | null = null;
  let evToEBITDAReason: string | undefined = undefined;
  if (isBank || isInsurance) {
    evToEBITDAVal = null;
  } else if (ebitda != null && ebitda <= 0) {
    evToEBITDAVal = null;
    evToEBITDAReason = 'FD/FAVÖK hesaplanamıyor — TTM FAVÖK negatif veya sıfır.';
  } else if (enterpriseValue != null && ebitda != null && ebitda > 0) {
    evToEBITDAVal = enterpriseValue / ebitda;
  } else if (enterpriseValue == null) {
    evToEBITDAReason = 'Firma Değeri (EV) için gerekli borç/nakit veya piyasa değeri eksik.';
  }

  // EV/Sales Rule: Revenue <= 0 or EV == null => NULL
  let evToSalesVal: number | null = null;
  let evToSalesReason: string | undefined = undefined;
  if (isBank || isInsurance) {
    evToSalesVal = null;
  } else if (revenue != null && revenue <= 0) {
    evToSalesVal = null;
    evToSalesReason = 'FD/Satışlar hesaplanamıyor — TTM satışlar negatif veya sıfır.';
  } else if (enterpriseValue != null && revenue != null && revenue > 0) {
    evToSalesVal = enterpriseValue / revenue;
  } else if (enterpriseValue == null) {
    evToSalesReason = 'Firma Değeri (EV) için gerekli veriler eksik.';
  }

  const valuation: CategoryRatios = {
    categoryKey: 'valuation',
    categoryName: 'Değerleme Oranları (Çarpanlar)',
    description: 'Hissenin piyasa fiyatının kâr, özkaynak ve satışlara göre ucuz veya pahalı olduğunu gösterir.',
    ratios: [
      createRatio(
        'pe',
        'Fiyat / Kâr (F/K)',
        peVal,
        'multiple',
        'x',
        false,
        '',
        'Hisse Fiyatı / TTM Hisse Başı Kâr (EPS)',
        {
          whatItMeasures: 'Şirketin 1 ₺ net kârı için yatırımcıların piyasada ödemeye razı olduğu katı gösterir.',
          howToInterpret: 'Düşük F/K ucuzluk göstergesi olabilir; ancak büyüme beklentileri ve sektör ortalaması ile değerlendirilmelidir.',
          sectorCaution: 'Zarar eden şirketlerde F/K hesaplanmaz. Bankalarda 4-8x bandı sıklıkla gözlemlenir.',
          finaiFormula: 'F/K = Canlı Hisse Fiyatı / TTM Hisse Başı Kâr (EPS)'
        },
        true,
        peReason
      ),
      createRatio(
        'pb',
        'Piyasa Değeri / Defter Değeri (PD/DD)',
        pbVal,
        'multiple',
        'x',
        false,
        '',
        'Piyasa Değeri / Toplam Özkaynaklar',
        {
          whatItMeasures: 'Şirketin borsa değerinin muhasebe defter değerine oranını gösterir.',
          howToInterpret: '1.0x altı defter değerinin altında işlem gördüğüne işaret eder. Yüksek ROE üreten hisselerde PD/DD yüksek seyredebilir.',
          sectorCaution: 'GYO ve Bankacılık sektörlerinde PD/DD temel değerleme ölçütlerindendir.',
          finaiFormula: 'PD/DD = Canlı Hisse Fiyatı / Hisse Başı Defter Değeri (BVPS)'
        },
        false,
        pbReason
      ),
      createRatio(
        'evToEBITDA',
        'Firma Değeri / FAVÖK (FD/FAVÖK)',
        evToEBITDAVal,
        'multiple',
        'x',
        isBank || isInsurance,
        'Bankacılık ve Sigortacılık şirketlerinde Firma Değeri / FAVÖK çarpanı uygulanmaz.',
        'Firma Değeri (EV) / TTM FAVÖK',
        {
          whatItMeasures: 'Şirketin net borçları dahil toplam değerinin operasyonel nakit üretimine oranını gösterir.',
          howToInterpret: 'F/K oranına kıyasla sermaye yapısı ve borçluluk farklarını nötralize eden daha tarafsız bir çarpandır.',
          sectorCaution: 'Sanayi ve üretim şirketlerinde 6.0x - 10.0x arası uluslararası standart kabul edilir.',
          finaiFormula: 'FD/FAVÖK = (Piyasa Değeri + Net Borç) / TTM FAVÖK'
        },
        true,
        evToEBITDAReason
      ),
      createRatio(
        'evToSales',
        'Firma Değeri / Satışlar (FD/Satışlar)',
        evToSalesVal,
        'multiple',
        'x',
        isBank || isInsurance,
        'Bankacılık ve Sigortacılık sektörlerinde FD/Satışlar çarpanı kullanılmaz.',
        'Firma Değeri (EV) / TTM Toplam Satışlar',
        {
          whatItMeasures: 'Şirketin toplam piyasa ve borç değerinin yıllık ciroya oranını gösterir.',
          howToInterpret: 'Geçici zarar açıklayan ancak yüksek ciro üreten şirketlerin değerlemesinde tercih edilir.',
          sectorCaution: 'Perakende sektöründe düşük marj ve yüksek ciro nedeniyle 0.3x-0.8x arası seviyeler yaygındır.',
          finaiFormula: 'FD/Satışlar = (Piyasa Değeri + Net Borç) / TTM Toplam Satışlar'
        },
        true,
        evToSalesReason
      )
    ]
  };

  // E) PER SHARE RATIOS (HİSSE BAŞINA)
  const perShare: CategoryRatios = {
    categoryKey: 'perShare',
    categoryName: 'Hisse Başına Metrikler',
    description: 'Tek bir hisse senedine düşen kâr, defter değeri ve temettü miktarını gösterir.',
    ratios: [
      createRatio(
        'eps',
        'Hisse Başı Kâr (EPS)',
        epsVal,
        'currency',
        '₺',
        false,
        '',
        'TTM Net Kâr / Ağırlıklı Ortalama Hisse Adedi',
        {
          whatItMeasures: 'Tek bir adet hisse senedinin son 1 yılda ürettiği net kâr tutarını gösterir.',
          howToInterpret: 'EPS değerinin düzenli artması şirket kârlılığının büyüdüğünü teyit eder.',
          sectorCaution: 'Sermaye artırımlarında (bedelsiz/bedelli) pay sayısı değiştiğinden ağırlıklı ortalama hisse adedi kullanılır.',
          finaiFormula: 'EPS = TTM Net Kâr / Ağırlıklı Ortalama Hisse Adedi'
        },
        true,
        epsReason
      ),
      createRatio(
        'bvps',
        'Hisse Başı Defter Değeri (BVPS)',
        bvpsVal,
        'currency',
        '₺',
        false,
        '',
        'Toplam Özkaynaklar / Toplam Hisse Adedi',
        {
          whatItMeasures: 'Şirket tasfiye edilse hisse başına düşen teorik net özkaynak değerini gösterir.',
          howToInterpret: 'Hisse fiyatının BVPS üzerinde olması piyasanın gelecekteki kâr büyümesi beklentisini yansıtır.',
          sectorCaution: 'Gayrimenkul ve varlık yoğun şirketlerde BVPS değerlemesi kritik önem taşır.',
          finaiFormula: 'BVPS = Toplam Özkaynaklar / Toplam Hisse Adedi'
        }
      )
    ]
  };

  // F) OPERATIONAL RATIOS (OPERASYONEL VERİMLİLİK)
  let assetTurnoverVal: number | null = null;
  if (!isBank && !isInsurance) {
    if (revenue != null && endingAssets != null && beginningAssets != null && (endingAssets + beginningAssets) > 0) {
      const avgAssets = (endingAssets + beginningAssets) / 2;
      assetTurnoverVal = revenue / avgAssets;
    } else if (revenue != null && endingAssets != null && endingAssets > 0) {
      assetTurnoverVal = revenue / endingAssets;
    }
  }

  let inventoryTurnoverVal: number | null = null;
  const beginningInventories = beginningPeriod?.balanceSheet?.inventories ?? null;
  const cogs = (revenue != null && grossProfit != null) ? (revenue - grossProfit) : null;

  if (!isBank && !isInsurance && !isREIT) {
    if (cogs != null && inventories != null && beginningInventories != null && (inventories + beginningInventories) > 0) {
      const avgInv = (inventories + beginningInventories) / 2;
      inventoryTurnoverVal = cogs / avgInv;
    } else if (cogs != null && inventories != null && inventories > 0) {
      inventoryTurnoverVal = cogs / inventories;
    }
  }

  let receivablesTurnoverVal: number | null = null;
  const receivables = latestBs?.receivables ?? null;
  const beginningReceivables = beginningPeriod?.balanceSheet?.receivables ?? null;

  if (!isBank && !isInsurance) {
    if (revenue != null && receivables != null && beginningReceivables != null && (receivables + beginningReceivables) > 0) {
      const avgRec = (receivables + beginningReceivables) / 2;
      receivablesTurnoverVal = revenue / avgRec;
    } else if (revenue != null && receivables != null && receivables > 0) {
      receivablesTurnoverVal = revenue / receivables;
    }
  }

  const operational: CategoryRatios = {
    categoryKey: 'operational',
    categoryName: 'Operasyonel Verimlilik',
    description: 'Şirketin varlıklarını, stoklarını ve alacaklarını ne hızla nakde dönüştürdüğünü gösterir.',
    ratios: [
      createRatio(
        'assetTurnover',
        'Aktif Devir Hızı',
        assetTurnoverVal,
        'multiple',
        'x',
        isBank || isInsurance,
        'Bankacılık ve Sigorta şirketlerinde Aktif Devir Hızı uygulanmaz.',
        'TTM Satışlar / Ortalama Toplam Varlıklar',
        {
          whatItMeasures: 'Şirketin sahip olduğu 1 ₺ tutarındaki varlıkla kaç ₺ ciro ürettiğini gösterir.',
          howToInterpret: 'Yüksek aktif devir hızı varlıkların verimli işletildiğini gösterir.',
          sectorCaution: 'Perakende sektöründe yüksek oranlar görülürken ağır sanayide oran daha düşüktür.',
          finaiFormula: 'Aktif Devir Hızı = TTM Toplam Satışlar / Ortalama Varlıklar'
        },
        true
      ),
      createRatio(
        'inventoryTurnover',
        'Stok Devir Hızı',
        inventoryTurnoverVal,
        'multiple',
        'x',
        isBank || isInsurance || isREIT,
        'Banka, Sigorta ve GYO şirketlerinde stok kalemi bulunmadığından Stok Devir Hızı uygulanmaz.',
        'TTM Satılan Malın Maliyeti / Ortalama Stoklar',
        {
          whatItMeasures: 'Şirketin stoklarını yılda kaç kez yenilediğini gösterir.',
          howToInterpret: 'Yüksek stok devir hızı stokların depoda beklemeden nakde çevrildiğini gösterir.',
          sectorCaution: 'Gıda perakendeciliğinde stok devir hızı çok yüksek, otomotivde daha düşüktür.',
          finaiFormula: 'Stok Devir Hızı = TTM Satılan Malın Maliyeti / Ortalama Stoklar'
        },
        true
      ),
      createRatio(
        'receivablesTurnover',
        'Alacak Devir Hızı',
        receivablesTurnoverVal,
        'multiple',
        'x',
        isBank || isInsurance,
        'Bankacılık ve Sigorta sektörlerinde Alacak Devir Hızı uygulanmaz.',
        'TTM Toplam Satışlar / Ortalama Ticari Alacaklar',
        {
          whatItMeasures: 'Şirketin ticari alacaklarını yılda kaç kez tahsil ettiğini ölçer.',
          howToInterpret: 'Yüksek alacak devir hızı güçlü tahsilat kabiliyetine işaret eder.',
          sectorCaution: 'Uzun vadeli taksitli satış yapan sektörlerde alacak devir hızı daha düşük seyreder.',
          finaiFormula: 'Alacak Devir Hızı = TTM Toplam Satışlar / Ortalama Alacaklar'
        },
        true
      )
    ]
  };

  return {
    symbol: fundamentals.symbol,
    companyName: fundamentals.companyName,
    sector: sectorInfo.displayName,
    asOf: new Date().toISOString(),
    livePrice,
    marketCap,
    enterpriseValue,
    categories: {
      profitability,
      liquidity,
      leverage,
      valuation,
      perShare,
      operational
    },
    quality: {
      status: quality.status,
      completeness: quality.completenessScore,
      warnings: quality.warnings,
      availableRatioCount: availableCount,
      totalRatioCount: totalCount
    },
    sourceMetadata: {
      source: quality.sourceMetadata.source || 'FinAI Primary Gateway',
      fetchedAt: quality.sourceMetadata.fetchedAt,
      verifiedAt: quality.sourceMetadata.verifiedAt,
      quality: quality.sourceMetadata.quality || 'high'
    }
  };
}
