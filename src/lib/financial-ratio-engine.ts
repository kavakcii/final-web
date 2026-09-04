/**
 * FinAI Financial Ratio Engine - Stage 3
 * Comprehensive Financial Ratio Calculator, Sector Adaptor & Educational Tooltip Engine
 */

import { ValidatedFinancialData, RatioStatus } from '@/types/financials';

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

  // FX Currency Awareness (e.g. THYAO reports in USD, stock trades in TRY)
  const financialCurrency = quarters && quarters.length > 0 ? (quarters[0].period.currency || 'TRY') : 'TRY';
  const isUSD = financialCurrency === 'USD';
  const isEUR = financialCurrency === 'EUR';
  // Approximate FX conversion rate when stock trades in TRY but reports in USD/EUR
  const fxMultiplier = isUSD ? 48.44 : (isEUR ? 50.80 : 1.0);

  // Live Price and Shares Calculation (STRICT: NO FAKE SYNTHETIC PRICE FALLBACK)
  const totalShares = latestPs?.weightedAverageShares || latestPs?.totalShares || null;
  const livePrice = (livePriceInput != null && livePriceInput > 0) ? livePriceInput : null;
  
  const marketCap = (livePrice != null && totalShares != null && totalShares > 0) ? livePrice * totalShares : null;
  const financialDebtRaw = latestBs?.financialDebt ?? null;
  const cashRaw = latestBs?.cashAndEquivalents ?? null;

  const financialDebtTRY = financialDebtRaw != null ? financialDebtRaw * fxMultiplier : null;
  const cashTRY = cashRaw != null ? cashRaw * fxMultiplier : null;

  const netDebtTRY = isBank || isInsurance ? null : (financialDebtTRY != null && cashTRY != null ? financialDebtTRY - cashTRY : null);
  
  // EV Calculation in TRY
  const enterpriseValue = (marketCap != null && financialDebtTRY != null && cashTRY != null) 
    ? marketCap + financialDebtTRY - cashTRY 
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
    customOverrideStatus?: RatioStatus,
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
    } else if (customOverrideStatus) {
      status = customOverrideStatus;
      reason = customOverrideReason || 'Şartlar sağlanmadı.';
      val = null;
    } else if (requiresTTM && !hasTTM) {
      status = 'insufficient_history';
      reason = 'TTM hesabı için 4 çeyreklik bilanço geçmişi henüz tamamlanmadı.';
      val = null;
    } else if (val == null || isNaN(val) || !isFinite(val)) {
      status = 'insufficient_data';
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

  // Income Statement TTM Metrics (converted to TRY if needed)
  const revenueRaw = latestIsTTM?.revenue ?? null;
  const grossProfitRaw = latestIsTTM?.grossProfit ?? null;
  const operatingIncomeRaw = latestIsTTM?.operatingIncome ?? null;
  const ebitdaRaw = latestIsTTM?.ebitda ?? null;
  const netIncomeRaw = latestIsTTM?.netIncome ?? null;

  const revenueTRY = revenueRaw != null ? revenueRaw * fxMultiplier : null;
  const grossProfitTRY = grossProfitRaw != null ? grossProfitRaw * fxMultiplier : null;
  const operatingIncomeTRY = operatingIncomeRaw != null ? operatingIncomeRaw * fxMultiplier : null;
  const ebitdaTRY = ebitdaRaw != null ? ebitdaRaw * fxMultiplier : null;
  const netIncomeTRY = netIncomeRaw != null ? netIncomeRaw * fxMultiplier : null;

  // Balance Sheet Items for ROE & ROA
  const endingEquityRaw = latestBs?.totalEquity ?? null;
  const endingAssetsRaw = latestBs?.totalAssets ?? null;

  const endingEquityTRY = endingEquityRaw != null ? endingEquityRaw * fxMultiplier : null;
  const endingAssetsTRY = endingAssetsRaw != null ? endingAssetsRaw * fxMultiplier : null;

  const beginningPeriod = quarters && quarters.length >= 4 
    ? quarters[3] 
    : (quarters && quarters.length >= 2 ? quarters[quarters.length - 1] : null);

  const beginningEquityRaw = beginningPeriod?.balanceSheet?.totalEquity ?? null;
  const beginningAssetsRaw = beginningPeriod?.balanceSheet?.totalAssets ?? null;

  const beginningEquityTRY = beginningEquityRaw != null ? beginningEquityRaw * fxMultiplier : null;
  const beginningAssetsTRY = beginningAssetsRaw != null ? beginningAssetsRaw * fxMultiplier : null;

  // ROE (Net Income / Average Equity - unitless %)
  let roeVal: number | null = null;
  let roeStatus: RatioStatus | undefined = undefined;
  let roeReason: string | undefined = undefined;
  let roeMethodology = 'TTM Net Kâr / Ortalama Özkaynak';

  if (endingEquityRaw != null && endingEquityRaw <= 0) {
    roeStatus = 'negative_input';
    roeReason = 'Özkaynaklar negatif veya sıfır olduğu için ROE hesaplanmadı.';
  } else if (netIncomeRaw != null) {
    if (endingEquityRaw != null && beginningEquityRaw != null && (endingEquityRaw + beginningEquityRaw) > 0) {
      const avgEquity = (endingEquityRaw + beginningEquityRaw) / 2;
      roeVal = (netIncomeRaw / avgEquity) * 100;
      roeMethodology = 'TTM Net Kâr / Ortalama Özkaynak ((Başlangıç + Bitiş) / 2)';
    } else if (endingEquityRaw != null && endingEquityRaw > 0) {
      roeVal = (netIncomeRaw / endingEquityRaw) * 100;
      roeMethodology = 'ending_equity_single_period';
    }
  }

  // ROA (Net Income / Average Assets - unitless %)
  let roaVal: number | null = null;
  let roaStatus: RatioStatus | undefined = undefined;
  let roaReason: string | undefined = undefined;
  let roaMethodology = 'TTM Net Kâr / Ortalama Toplam Varlıklar';

  if (endingAssetsRaw != null && endingAssetsRaw <= 0) {
    roaStatus = 'negative_input';
    roaReason = 'Toplam varlıklar negatif veya sıfır olduğu için ROA hesaplanmadı.';
  } else if (netIncomeRaw != null) {
    if (endingAssetsRaw != null && beginningAssetsRaw != null && (endingAssetsRaw + beginningAssetsRaw) > 0) {
      const avgAssets = (endingAssetsRaw + beginningAssetsRaw) / 2;
      roaVal = (netIncomeRaw / avgAssets) * 100;
      roaMethodology = 'TTM Net Kâr / Ortalama Toplam Varlıklar ((Başlangıç + Bitiş) / 2)';
    } else if (endingAssetsRaw != null && endingAssetsRaw > 0) {
      roaVal = (netIncomeRaw / endingAssetsRaw) * 100;
      roaMethodology = 'ending_assets_single_period';
    }
  }

  // Margins
  const grossMarginVal = (grossProfitRaw != null && revenueRaw != null && revenueRaw > 0) ? (grossProfitRaw / revenueRaw) * 100 : null;
  const operatingMarginVal = (operatingIncomeRaw != null && revenueRaw != null && revenueRaw > 0) ? (operatingIncomeRaw / revenueRaw) * 100 : null;
  const ebitdaMarginVal = (ebitdaRaw != null && revenueRaw != null && revenueRaw > 0) ? (ebitdaRaw / revenueRaw) * 100 : null;
  const netMarginVal = (netIncomeRaw != null && revenueRaw != null && revenueRaw > 0) ? (netIncomeRaw / revenueRaw) * 100 : null;

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
        true,
        roeStatus,
        roeReason
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
        true,
        roaStatus,
        roaReason
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
  const debtToAssetsVal = (financialDebtRaw != null && endingAssetsRaw != null && endingAssetsRaw > 0) 
    ? (financialDebtRaw / endingAssetsRaw) * 100 
    : ((latestBs?.totalLiabilities != null && endingAssetsRaw != null && endingAssetsRaw > 0) ? (latestBs.totalLiabilities / endingAssetsRaw) * 100 : null);
  
  const debtToEquityVal = (financialDebtRaw != null && endingEquityRaw != null && endingEquityRaw > 0) ? financialDebtRaw / endingEquityRaw : null;

  // Net Debt / EBITDA Rule: EBITDA <= 0 => negative_input
  let netDebtToEBITDAVal: number | null = null;
  let netDebtToEBITDAStatus: RatioStatus | undefined = undefined;
  let netDebtToEBITDAReason: string | undefined = undefined;

  if (ebitdaRaw != null && ebitdaRaw <= 0) {
    netDebtToEBITDAVal = null;
    netDebtToEBITDAStatus = 'negative_input';
    netDebtToEBITDAReason = 'TTM FAVÖK negatif veya sıfır olduğu için Net Borç / FAVÖK hesaplanmadı.';
  } else if (netDebtTRY != null && ebitdaTRY != null && ebitdaTRY > 0) {
    netDebtToEBITDAVal = netDebtTRY / ebitdaTRY;
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
        netDebtToEBITDAStatus,
        netDebtToEBITDAReason
      )
    ]
  };

  // D) VALUATION RATIOS (DEĞERLEME)
  const weightedShares = latestPs?.weightedAverageShares || latestPs?.totalShares || null;

  // EPS Method: TTM Net Profit / Weighted Average Shares
  let epsVal: number | null = null;
  if (netIncomeRaw != null && weightedShares != null && weightedShares > 0) {
    epsVal = netIncomeRaw / weightedShares;
  } else if (latestPs?.basicEPS != null) {
    epsVal = latestPs.basicEPS;
  }
  const epsValTRY = epsVal != null ? epsVal * fxMultiplier : null;

  // BVPS Method: Equity / Share Count
  let bvpsVal: number | null = null;
  if (endingEquityRaw != null && weightedShares != null && weightedShares > 0) {
    bvpsVal = endingEquityRaw / weightedShares;
  } else if (latestPs?.bookValuePerShare != null) {
    bvpsVal = latestPs.bookValuePerShare;
  }
  const bvpsValTRY = bvpsVal != null ? bvpsVal * fxMultiplier : null;

  // P/E Rule: Net Income <= 0 or EPS <= 0 => negative_input
  let peVal: number | null = null;
  let peStatus: RatioStatus | undefined = undefined;
  let peReason: string | undefined = undefined;

  if (netIncomeRaw != null && netIncomeRaw <= 0) {
    peVal = null;
    peStatus = 'negative_input';
    peReason = 'TTM net kâr negatif olduğu için F/K hesaplanmadı.';
  } else if (epsValTRY != null && epsValTRY <= 0) {
    peVal = null;
    peStatus = 'negative_input';
    peReason = 'Hisse başı kâr (EPS) negatif olduğu için F/K hesaplanmadı.';
  } else if (livePrice == null) {
    peStatus = 'source_unavailable';
    peReason = 'Canlı hisse fiyatı bekleniyor.';
  } else if (epsValTRY != null && epsValTRY > 0) {
    peVal = livePrice / epsValTRY;
  } else if (marketCap != null && netIncomeTRY != null && netIncomeTRY > 0) {
    peVal = marketCap / netIncomeTRY;
  } else {
    peStatus = 'insufficient_data';
    peReason = 'Doğrulanmış hisse sayısı veya TTM net kâr verisi bulunamadı.';
  }

  // P/B Rule: Equity <= 0 or BVPS <= 0 => negative_input
  let pbVal: number | null = null;
  let pbStatus: RatioStatus | undefined = undefined;
  let pbReason: string | undefined = undefined;

  if (endingEquityRaw != null && endingEquityRaw <= 0) {
    pbVal = null;
    pbStatus = 'negative_input';
    pbReason = 'Toplam özkaynaklar negatif veya sıfır olduğu için PD/DD hesaplanmadı.';
  } else if (bvpsValTRY != null && bvpsValTRY <= 0) {
    pbVal = null;
    pbStatus = 'negative_input';
    pbReason = 'Hisse başı defter değeri (BVPS) negatif veya sıfır olduğu için PD/DD hesaplanmadı.';
  } else if (livePrice == null) {
    pbStatus = 'source_unavailable';
    pbReason = 'Canlı hisse fiyatı bekleniyor.';
  } else if (bvpsValTRY != null && bvpsValTRY > 0) {
    pbVal = livePrice / bvpsValTRY;
  } else if (marketCap != null && endingEquityTRY != null && endingEquityTRY > 0) {
    pbVal = marketCap / endingEquityTRY;
  } else {
    pbStatus = 'insufficient_data';
    pbReason = 'Toplam özkaynak veya hisse sayısı bulunamadı.';
  }

  // EV/EBITDA Rule: EBITDA <= 0 or EV == null => negative_input / insufficient_data
  let evToEBITDAVal: number | null = null;
  let evToEBITDAStatus: RatioStatus | undefined = undefined;
  let evToEBITDAReason: string | undefined = undefined;

  if (isBank || isInsurance) {
    evToEBITDAVal = null;
  } else if (ebitdaRaw != null && ebitdaRaw <= 0) {
    evToEBITDAVal = null;
    evToEBITDAStatus = 'negative_input';
    evToEBITDAReason = 'TTM FAVÖK negatif veya sıfır olduğu için FD/FAVÖK hesaplanmadı.';
  } else if (enterpriseValue != null && ebitdaTRY != null && ebitdaTRY > 0) {
    evToEBITDAVal = enterpriseValue / ebitdaTRY;
  } else if (enterpriseValue == null) {
    evToEBITDAStatus = 'insufficient_data';
    evToEBITDAReason = 'Firma Değeri (EV) için gerekli borç/nakit veya piyasa değeri eksik.';
  }

  // EV/Sales Rule: Revenue <= 0 or EV == null => negative_input / insufficient_data
  let evToSalesVal: number | null = null;
  let evToSalesStatus: RatioStatus | undefined = undefined;
  let evToSalesReason: string | undefined = undefined;

  if (isBank || isInsurance) {
    evToSalesVal = null;
  } else if (revenueRaw != null && revenueRaw <= 0) {
    evToSalesVal = null;
    evToSalesStatus = 'negative_input';
    evToSalesReason = 'TTM satışlar negatif veya sıfır olduğu için FD/Satışlar hesaplanmadı.';
  } else if (enterpriseValue != null && revenueTRY != null && revenueTRY > 0) {
    evToSalesVal = enterpriseValue / revenueTRY;
  } else if (enterpriseValue == null) {
    evToSalesStatus = 'insufficient_data';
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
        peStatus,
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
        pbStatus,
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
        evToEBITDAStatus,
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
        evToSalesStatus,
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
        'TTM Ana Ortaklık Net Kârı / Ağırlıklı Ortalama Hisse Adedi',
        {
          whatItMeasures: 'Tek bir adet hisse senedinin son 1 yılda ürettiği net kâr tutarını gösterir.',
          howToInterpret: 'EPS değerinin düzenli artması şirket kârlılığının büyüdüğünü teyit eder.',
          sectorCaution: 'Sermaye artırımlarında pay adedi değiştiğinden ağırlıklı ortalama hisse adedi (weightedAverageShares) kullanılır; nominal ödenmiş sermaye tutarı bölen olarak kullanılmaz.',
          finaiFormula: 'EPS = TTM Ana Ortaklık Net Kârı / Ağırlıklı Ortalama Hisse Adedi'
        },
        true,
        epsVal == null ? 'insufficient_data' : undefined,
        epsVal == null ? 'Doğrulanmış hisse sayısı veya TTM net kâr verisi bulunamadı.' : undefined
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
    if (revenueRaw != null && endingAssetsRaw != null && beginningAssetsRaw != null && (endingAssetsRaw + beginningAssetsRaw) > 0) {
      const avgAssets = (endingAssetsRaw + beginningAssetsRaw) / 2;
      assetTurnoverVal = revenueRaw / avgAssets;
    } else if (revenueRaw != null && endingAssetsRaw != null && endingAssetsRaw > 0) {
      assetTurnoverVal = revenueRaw / endingAssetsRaw;
    }
  }

  let inventoryTurnoverVal: number | null = null;
  const beginningInventories = beginningPeriod?.balanceSheet?.inventories ?? null;
  const cogs = (revenueRaw != null && grossProfitRaw != null) ? (revenueRaw - grossProfitRaw) : null;

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
    if (revenueRaw != null && receivables != null && beginningReceivables != null && (receivables + beginningReceivables) > 0) {
      const avgRec = (receivables + beginningReceivables) / 2;
      receivablesTurnoverVal = revenueRaw / avgRec;
    } else if (revenueRaw != null && receivables != null && receivables > 0) {
      receivablesTurnoverVal = revenueRaw / receivables;
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
