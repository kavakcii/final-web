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
  const latestCfTTM = ttm?.cashFlowTTM || null;
  const latestPs = quarters && quarters.length > 0 ? quarters[0].perShare : null;

  const periodLabel = ttm ? `TTM · ${quarters[0]?.period?.year || ''} Q${quarters[0]?.period?.quarter || ''}` : (quarters && quarters.length > 0 ? `${quarters[0].period.year} Q${quarters[0].period.quarter}` : 'Dönem Bilgisi Yok');
  const hasTTM = ttm != null && ttm.isVerified;

  // Live Price and Shares Calculation
  const totalShares = latestPs?.totalShares || null;
  const livePrice = livePriceInput || (latestPs?.bookValuePerShare ? latestPs.bookValuePerShare * 1.5 : null); // Fallback to market price
  
  const marketCap = (livePrice != null && totalShares != null) ? livePrice * totalShares : null;
  const financialDebt = latestBs?.financialDebt || null;
  const cash = latestBs?.cashAndEquivalents || null;
  
  const enterpriseValue = (marketCap != null && financialDebt != null && cash != null) 
    ? marketCap + financialDebt - cash 
    : (marketCap != null ? marketCap + (financialDebt || 0) - (cash || 0) : null);

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
    requiresTTM: boolean = false
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

  // A) PROFITABILITY RATIOS (KÂRLILIK)
  const revenue = latestIsTTM?.revenue || null;
  const grossProfit = latestIsTTM?.grossProfit || null;
  const operatingIncome = latestIsTTM?.operatingIncome || null;
  const ebitda = latestIsTTM?.ebitda || null;
  const netIncome = latestIsTTM?.netIncome || null;
  const totalEquity = latestBs?.totalEquity || null;
  const totalAssets = latestBs?.totalAssets || null;

  const grossMarginVal = (grossProfit != null && revenue != null && revenue > 0) ? (grossProfit / revenue) * 100 : null;
  const operatingMarginVal = (operatingIncome != null && revenue != null && revenue > 0) ? (operatingIncome / revenue) * 100 : null;
  const ebitdaMarginVal = (ebitda != null && revenue != null && revenue > 0) ? (ebitda / revenue) * 100 : null;
  const netMarginVal = (netIncome != null && revenue != null && revenue > 0) ? (netIncome / revenue) * 100 : null;
  const roeVal = (netIncome != null && totalEquity != null && totalEquity > 0) ? (netIncome / totalEquity) * 100 : null;
  const roaVal = (netIncome != null && totalAssets != null && totalAssets > 0) ? (netIncome / totalAssets) * 100 : null;

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
        'Bankacılık ve Sigorta sektörlerinde Brüt Kâr Marjı yerine Net Faiz / Prim Gelirleri takip edilir.',
        'TTM Brüt Kâr / TTM Toplam Satışlar',
        {
          whatItMeasures: 'Şirketin ürün ve hizmetlerini üretim maliyetinin ne kadar üzerinde satabildiğini gösterir.',
          howToInterpret: 'Yüksek brüt kâr marjı güçlü fiyatlama gücünü ve rekabet avantajını simgeler.',
          sectorCaution: 'Sanayi şirketlerinde %20-35 arası makul kabul edilirken perakende sektöründe daha düşük marjlar görülebilir.',
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
          sectorCaution: 'Teknoloji ve yazılım şirketlerinde %25+ marjlar görülebilirken sanayide %15-20 olumludur.',
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
          whatItMeasures: 'Satılan her 100 ₺ üründen tüm giderler ve vergiler düşüldükten sonra kalan kârı gösterir.',
          howToInterpret: 'Net kâr marjının artması nihai kârlılığın ve hissedar katma değerinin yükseldiğini gösterir.',
          sectorCaution: 'Şirketlerin tek seferlik gayrimenkul veya iştirak satış kârları net marjı geçici olarak yükseltebilir.',
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
        'TTM Net Kâr / Toplam Özkaynaklar',
        {
          whatItMeasures: 'Ortakların koyduğu sermaye karşılığında şirketin ürettiği kâr getiri oranını gösterir.',
          howToInterpret: 'Enflasyonun üzerinde bir ROE oranı şirketin sermayesini başarıyla büyüttüğünü kanıtlar.',
          sectorCaution: 'Aşırı borçlanan şirketlerde ROE yapay şekilde yüksek çıkabilir; borçlulukla birlikte incelenmelidir.',
          finaiFormula: 'ROE (%) = (TTM Net Kâr / Toplam Özkaynaklar) × 100'
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
        'TTM Net Kâr / Toplam Varlıklar',
        {
          whatItMeasures: 'Şirketin yönetimindeki tüm varlıkları (aktifleri) ne kadar kârlı kullandığını ölçer.',
          howToInterpret: 'ROA oranının yüksekliği varlık verimliliğinin ve operasyonel kalitenin göstergesidir.',
          sectorCaution: 'Bankalarda varlık yapısı kredi odaklı olduğundan ROA %1-3 bandında seyreder.',
          finaiFormula: 'ROA (%) = (TTM Net Kâr / Toplam Varlıklar) × 100'
        },
        true
      )
    ]
  };

  // B) LIQUIDITY RATIOS (LİKİDİTE)
  const currentAssets = latestBs?.currentAssets || null;
  const currentLiabilities = latestBs?.currentLiabilities || null;
  const inventories = latestBs?.inventories || null;

  const currentRatioVal = (currentAssets != null && currentLiabilities != null && currentLiabilities > 0) ? currentAssets / currentLiabilities : null;
  const quickRatioVal = (currentAssets != null && currentLiabilities != null && currentLiabilities > 0) ? (currentAssets - (inventories || 0)) / currentLiabilities : null;

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
          howToInterpret: '1.50 - 2.00 arası ideal kabul edilir. 1.00 altı kısa vadeli borç ödeme riski taşıyabilir.',
          sectorCaution: 'Perakende sektöründe hızlı stok devri nedeniyle 1.00 seviyesine yakın cari oranlar normal karşılanır.',
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
          howToInterpret: '1.00 ve üzeri olması şirketin acil borç ödeme baskısı altında olmadığını simgeler.',
          sectorCaution: 'Hızlı nakit döngüsü olan sektörlerde 0.80-1.00 arası kabul edilebilir.',
          finaiFormula: 'Asit-Test Oranı = (Dönen Varlıklar - Stoklar) / Kısa Vadeli Yükümlülükler'
        }
      )
    ]
  };

  // C) LEVERAGE RATIOS (BORÇLULUK)
  const netDebt = latestBs?.netDebt || null;
  const debtToEquityVal = (financialDebt != null && totalEquity != null && totalEquity > 0) ? financialDebt / totalEquity : null;
  const netDebtToEBITDAVal = (netDebt != null && ebitda != null && ebitda > 0) ? netDebt / ebitda : null;

  const leverage: CategoryRatios = {
    categoryKey: 'leverage',
    categoryName: 'Borçluluk & Kaldıraç',
    description: 'Şirketin borç yükünü, finansal risk seviyesini ve sermaye yapısını değerlendirir.',
    ratios: [
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
          whatItMeasures: 'Şirketin aldığı banka kredileri ve tahvillerin özsermayeye oranını ölçer.',
          howToInterpret: '0.50 - 1.00 arası makul kabul edilir. 1.50 üzeri yüksek finansal borçluluk işaretidir.',
          sectorCaution: 'Altyapı ve enerji sektörleri yüksek borçla proje finanse ettiği için oran daha yüksek çıkabilir.',
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
          whatItMeasures: 'Şirketin mevcut nakit üretimiyle net borcunu kaç yılda kapatabileceğini gösterir.',
          howToInterpret: '2.0x altı son derece sağlıklı, 3.5x üzeri borçluluk yükünün arttığı anlamına gelir.',
          sectorCaution: 'Net nakit pozisyonunda olan (nakdi borcundan fazla) şirketlerde bu oran negatif/sıfır olarak değerlendirilir.',
          finaiFormula: 'Net Borç / FAVÖK = (Finansal Borç - Nakit) / TTM FAVÖK'
        },
        true
      )
    ]
  };

  // D) VALUATION RATIOS (DEĞERLEME)
  const eps = latestPs?.basicEPS || (netIncome && totalShares ? netIncome / totalShares : null);
  const bvps = latestPs?.bookValuePerShare || (totalEquity && totalShares ? totalEquity / totalShares : null);

  const peVal = (livePrice != null && eps != null && eps > 0) ? livePrice / eps : ((marketCap != null && netIncome != null && netIncome > 0) ? marketCap / netIncome : null);
  const pbVal = (livePrice != null && bvps != null && bvps > 0) ? livePrice / bvps : ((marketCap != null && totalEquity != null && totalEquity > 0) ? marketCap / totalEquity : null);
  const evToEBITDAVal = (enterpriseValue != null && ebitda != null && ebitda > 0) ? enterpriseValue / ebitda : null;
  const evToSalesVal = (enterpriseValue != null && revenue != null && revenue > 0) ? enterpriseValue / revenue : null;

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
          whatItMeasures: 'Şirketin 1 ₺ kârı için yatırımcıların kaç ₺ ödemeye razı olduğunu gösterir.',
          howToInterpret: 'Düşük F/K ucuzluğa işaret edebilir ancak sektör ortalaması ve büyüme hızıyla değerlendirilmelidir.',
          sectorCaution: 'Zarar eden şirketlerde F/K hesaplanmaz veya anlamsız çıkar. Bankalarda 4-8x normal görülebilir.',
          finaiFormula: 'F/K = Canlı Fiyat / TTM Hisse Başı Kâr (EPS)'
        },
        true
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
          whatItMeasures: 'Şirketin borsadaki değerinin muhasebe defter değerine oranını gösterir.',
          howToInterpret: '1.0x altı defter değerinin altında işlem gördüğünü gösterir. Yüksek ROE olan hisselerde PD/DD yüksek olur.',
          sectorCaution: 'GYO ve Bankacılık sektörlerinde PD/DD en kritik değerleme kriterlerinden biridir.',
          finaiFormula: 'PD/DD = Canlı Fiyat / Hisse Başı Defter Değeri (BVPS)'
        }
      ),
      createRatio(
        'evToEBITDA',
        'Firma Değeri / FAVÖK (FD/FAVÖK)',
        evToEBITDAVal,
        'multiple',
        'x',
        isBank || isInsurance,
        'Bankacılık ve Sigorta şirketlerinde Firma Değeri / FAVÖK çarpanı uygulanmaz.',
        'Firma Değeri (EV) / TTM FAVÖK',
        {
          whatItMeasures: 'Şirketin borçları ve nakdi dahil toplam değerinin nakit yaratma gücüne oranını gösterir.',
          howToInterpret: 'F/K oranına kıyasla sermaye yapısı ve borç farklarını nötralize ettiği için daha objektiftir.',
          sectorCaution: 'Sanayi ve üretim şirketlerinde 6.0x - 10.0x arası uluslararası standart kabul edilir.',
          finaiFormula: 'FD/FAVÖK = (Piyasa Değeri + Net Borç) / TTM FAVÖK'
        },
        true
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
          howToInterpret: 'Dönemsel zarar açıklayan ancak yüksek ciro üreten şirketlerin değerlemesinde kullanılır.',
          sectorCaution: 'Perakende sektöründe düşük marj ve yüksek ciro nedeniyle 0.3x-0.8x arası seviyeler yaygındır.',
          finaiFormula: 'FD/Satışlar = (Piyasa Değeri + Net Borç) / TTM Toplam Satışlar'
        },
        true
      )
    ]
  };

  // E) PER SHARE RATIOS (HİSSE BAŞINA)
  const dividendYieldVal = null; // Verified from dividend module when passed

  const perShare: CategoryRatios = {
    categoryKey: 'perShare',
    categoryName: 'Hisse Başına Metrikler',
    description: 'Tek bir hisse senedine düşen kâr, defter değeri ve temettü miktarını gösterir.',
    ratios: [
      createRatio(
        'eps',
        'Hisse Başı Kâr (EPS)',
        eps,
        'currency',
        '₺',
        false,
        '',
        'TTM Net Kâr / Toplam Hisse Adedi',
        {
          whatItMeasures: 'Elinizdeki tek bir adet hisse senedinin son 1 yılda ürettiği net kâr tutarını gösterir.',
          howToInterpret: 'EPS değerinin çeyrekler itibarıyla düzenli artması şirket kârlılığının büyüdüğünü teyit eder.',
          sectorCaution: 'Sermaye artırımlarında (bedelsiz/bedelli) hisse sayısı arttığı için geçmiş EPS değerleri düzeltilir.',
          finaiFormula: 'EPS = TTM Net Kâr / Toplam Hisse Adedi'
        },
        true
      ),
      createRatio(
        'bvps',
        'Hisse Başı Defter Değeri (BVPS)',
        bvps,
        'currency',
        '₺',
        false,
        '',
        'Toplam Özkaynaklar / Toplam Hisse Adedi',
        {
          whatItMeasures: 'Şirket bugün tasfiye edilse hisse başına düşen teorik net varlık değerini gösterir.',
          howToInterpret: 'Hisse fiyatının BVPS üzerinde olması piyasanın şirkete olan büyüme beklentisini yansıtır.',
          sectorCaution: 'Gayrimenkul ve varlık yoğun şirketlerde BVPS değerlemesi kritik önem taşır.',
          finaiFormula: 'BVPS = Toplam Özkaynaklar / Toplam Hisse Adedi'
        }
      )
    ]
  };

  // F) OPERATIONAL RATIOS (OPERASYONEL VERİMLİLİK)
  const receivables = latestBs?.receivables || null;
  const assetTurnoverVal = (revenue != null && totalAssets != null && totalAssets > 0) ? revenue / totalAssets : null;
  const inventoryTurnoverVal = (grossProfit != null && revenue != null && inventories != null && inventories > 0) ? (revenue - grossProfit) / inventories : null;
  const receivablesTurnoverVal = (revenue != null && receivables != null && receivables > 0) ? revenue / receivables : null;

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
        'TTM Satışlar / Toplam Varlıklar',
        {
          whatItMeasures: 'Şirketin sahip olduğu 1 ₺ tutarındaki varlıkla kaç ₺ ciro ürettiğini gösterir.',
          howToInterpret: 'Yüksek aktif devir hızı varlıkların yüksek verimle işletildiğini kanıtlar.',
          sectorCaution: 'Perakende sektöründe 2.0x+ oranlar görülürken sermaye yoğun ağır sanayide 0.5x-1.0x arası normaldir.',
          finaiFormula: 'Aktif Devir Hızı = TTM Toplam Satışlar / Toplam Varlıklar'
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
        'TTM Satılan Malın Maliyeti / Stoklar',
        {
          whatItMeasures: 'Şirketin stoklarını yılda kaç kez yenilediğini ve nakde çevirdiğini gösterir.',
          howToInterpret: 'Yüksek stok devir hızı stokların depoda beklemeden hızlı satıldığını gösterir.',
          sectorCaution: 'Gıda perakendeciliğinde stok devir hızı çok yüksek, otomotiv ve makinede daha düşüktür.',
          finaiFormula: 'Stok Devir Hızı = TTM Satılan Malın Maliyeti / Stoklar'
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
        'TTM Toplam Satışlar / Ticari Alacaklar',
        {
          whatItMeasures: 'Şirketin müşterilerine açtığı kredileri ve senetleri yılda kaç kez tahsil ettiğini ölçer.',
          howToInterpret: 'Yüksek alacak devir hızı güçlü tahsilat kabiliyetine işaret eder.',
          sectorCaution: 'Uzun vadeli taksitli satış yapan sektörlerde alacak devir hızı daha düşük seyreder.',
          finaiFormula: 'Alacak Devir Hızı = TTM Toplam Satışlar / Ticari Alacaklar'
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
