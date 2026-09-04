/**
 * FinAI Sector Categorizer - Stage 2.1
 * Sector Categorization Engine & Unsupported Metric Mapper
 */

import { SectorCategory, SectorInfo } from '@/types/financials';
import { sectorMapping } from '@/data/sectorMapping';

const KNOWN_BANKS = new Set([
  'GARAN', 'AKBNK', 'YKBNK', 'ISCTR', 'VAKBN', 'HALKB', 'TSKB', 'ALBRK', 'SKBNK', 'ICBCT'
]);

const KNOWN_INSURANCE = new Set([
  'ANHYT', 'ANSGR', 'AGESA', 'AKGRT', 'RAYSG', 'TURSG', 'GARFA'
]);

const KNOWN_HOLDINGS = new Set([
  'KCHOL', 'SAHOL', 'DOHOL', 'AGHOL', 'BERA', 'TKFEN', 'ENKAI', 'GSDHO', 'INVEO', 
  'ECZYT', 'IEYHO', 'DUNYH', 'POLHO', 'INVES', 'HEDEF', 'UNLU', 'DERHL', 'VERUS', 
  'OTTO', 'AVHOL', 'DENGE', 'GLRYH', 'IHYAY', 'LRSHO', 'TAVHL', 'UFUK', 'MARKA', 
  'YESIL', 'METRO', 'BRYAT', 'RALYH', 'GLYHO', 'IHLAS', 'LYDHO', 'TRCAS', 'ALARK', 
  'TEHOL', 'ECILC', 'NTHOL', 'SISE', 'PAHOL', 'BINHO', 'GRTHO', 'KLRHO'
]);

const KNOWN_ENERGY = new Set([
  'TUPRS', 'AKSEN', 'ASTOR', 'BIOEN', 'GWIND', 'CWENE', 'EUPWR', 'AYDEM', 'CANTE',
  'ENJSA', 'NATEN', 'ESEN', 'AHGAZ', 'ENERY', 'TATEN', 'IZENR', 'A1YEN', 'MOGAN',
  'ENTRA', 'CATES', 'BESTE', 'ARFYE', 'ECOGR', 'KLYPV', 'ENDAE', 'BIGEN', 'ZEDUR',
  'AKENR', 'AYEN', 'ZOREN', 'PAMEL', 'AKSUE', 'HUNER', 'MAGEN', 'CONSE', 'SMRTG'
]);

const KNOWN_TELECOM = new Set([
  'TCELL', 'TTKOM'
]);

const KNOWN_TRANSPORTATION = new Set([
  'THYAO', 'PGSUS', 'TAVHL', 'CLEBI', 'GSDDE', 'RYSAS', 'HOROZ', 'HRKET', 'PASEU', 'GRSEL', 'TUREX', 'BEYAZ'
]);

const KNOWN_RETAIL = new Set([
  'BIMAS', 'MGROS', 'SOKM', 'MAVI', 'TKNSA', 'CRFSA', 'EBEBK', 'SUWEN', 'GMTAS', 'KIMMR', 'GENIL', 'ARZUM', 'VAKKO', 'MEPET', 'BIZIM'
]);

const KNOWN_TECH = new Set([
  'ASELS', 'MIATK', 'REEDR', 'ARDYZ', 'LOGO', 'PATEK', 'FORTE', 'SDTTR', 'MCARD', 'EMPAE',
  'NETCD', 'DOFRB', 'BINBN', 'ONRYT', 'ALTNY', 'ODINE', 'AZTEK', 'OBASE', 'HTTBT', 'MOBTL',
  'MANAS', 'VBTYZ', 'EDATA', 'ATATP', 'PENTA', 'MTRKS', 'PAPIL', 'SMART', 'KFEIN', 'FONET',
  'KRONT', 'DESPC', 'KAREL', 'INGRM', 'DGATE', 'PKART', 'INDES', 'ARENA', 'LINK', 'ALCTL'
]);

const KNOWN_AUTOMOTIVE = new Set([
  'FROTO', 'TOASO', 'TTRAK', 'ASUZU', 'KARSN', 'DOAS', 'TMSN', 'BFREN', 'JANTS'
]);

const KNOWN_FOOD = new Set([
  'CCOLA', 'AEFES', 'ULKER', 'BANVT', 'TATGD', 'YYLGD', 'SOKE', 'GOLDA', 'AKHAN', 'MEYSU',
  'BALSU', 'ARMGD', 'DURKN', 'CEMZY', 'GUNDG', 'SEGMN', 'EFOR', 'ALKLC', 'OBAMS', 'BORSK',
  'DMRGD', 'OFSYM', 'ATAKP', 'KAYSE', 'EKSUN', 'GOKNR', 'OZSUB', 'KRVGD', 'FADE', 'AVOD',
  'PENGD', 'KNFRT', 'FRIGO', 'TUKAS', 'MERKO', 'DARDL', 'BESLR', 'TBORG', 'PINSU', 'PETUN', 'PNSUT'
]);

const KNOWN_HEALTH = new Set([
  'DEVA', 'GENIL', 'MPARK', 'MEDTR', 'ECILC', 'TNZTP', 'EGEPO', 'ONCSM', 'RTALB', 'LKMNH'
]);

const KNOWN_CONSTRUCTION = new Set([
  'OYAKC', 'CIMSA', 'BUCIM', 'NUHCM', 'ENKAI', 'BOBET', 'LMKDC', 'KLSER', 'BIENY', 'QUAGR',
  'BSOKE', 'CMBTN', 'AKCNS', 'BTCIM', 'GOLTS', 'AFYON', 'KONYA', 'USAK', 'DAPGM', 'BRLSM', 'GESAN'
]);

/**
 * Normalizes ticker symbol to uppercase without suffixes like .IS
 */
export function normalizeSymbol(symbol: string): string {
  if (!symbol) return '';
  return symbol.toUpperCase().replace(/\.IS$/, '').trim();
}

/**
 * Classifies a stock symbol into a normalized SectorCategory & builds SectorInfo
 */
export function getSectorCategory(symbol: string, customSectorName?: string): SectorInfo {
  const cleanSym = normalizeSymbol(symbol);
  const rawSector = customSectorName || sectorMapping[cleanSym] || '';

  let category: SectorCategory = 'INDUSTRIAL';
  let displayName = rawSector || 'Sanayi & Üretim';

  // 1. BANK DETECTION
  if (KNOWN_BANKS.has(cleanSym) || rawSector === 'Banka') {
    category = 'BANK';
    displayName = 'Bankacılık & Finans';
  }
  // 2. INSURANCE DETECTION
  else if (KNOWN_INSURANCE.has(cleanSym) || rawSector === 'Sigorta') {
    category = 'INSURANCE';
    displayName = 'Sigortacılık';
  }
  // 3. REIT (GYO) DETECTION
  else if (cleanSym.endsWith('GYO') || cleanSym.endsWith('GMYO') || rawSector === 'Gayrimenkul') {
    category = 'REIT';
    displayName = 'Gayrimenkul Yatırım Ortaklığı (GYO)';
  }
  // 4. HOLDING DETECTION
  else if (KNOWN_HOLDINGS.has(cleanSym) || rawSector === 'Holding') {
    category = 'HOLDING';
    displayName = 'Holding & Yatırım';
  }
  // 5. ENERGY DETECTION
  else if (KNOWN_ENERGY.has(cleanSym) || rawSector === 'Elektrik' || rawSector === 'Enerji') {
    category = 'ENERGY';
    displayName = 'Enerji & Elektrik';
  }
  // 6. TELECOM DETECTION
  else if (KNOWN_TELECOM.has(cleanSym) || rawSector === 'İletişim') {
    category = 'TELECOM';
    displayName = 'Telekomünikasyon & İletişim';
  }
  // 7. TRANSPORTATION DETECTION
  else if (KNOWN_TRANSPORTATION.has(cleanSym) || rawSector === 'Ulaştırma') {
    category = 'TRANSPORTATION';
    displayName = 'Ulaştırma & Lojistik';
  }
  // 8. AUTOMOTIVE DETECTION
  else if (KNOWN_AUTOMOTIVE.has(cleanSym) || rawSector === 'Otomotiv') {
    category = 'AUTOMOTIVE';
    displayName = 'Otomotiv & Yan Sanayi';
  }
  // 9. RETAIL DETECTION
  else if (KNOWN_RETAIL.has(cleanSym) || rawSector === 'Ticaret' || rawSector === 'Gıda Perakendeciliği') {
    category = 'RETAIL';
    displayName = 'Perakende & Mağazacılık';
  }
  // 10. TECHNOLOGY DETECTION
  else if (KNOWN_TECH.has(cleanSym) || rawSector === 'Teknoloji' || rawSector === 'Bilişim') {
    category = 'TECHNOLOGY';
    displayName = 'Teknoloji & Yazılım';
  }
  // 11. HEALTHCARE DETECTION
  else if (KNOWN_HEALTH.has(cleanSym) || rawSector === 'Sağlık') {
    category = 'HEALTHCARE';
    displayName = 'Sağlık & İlaç';
  }
  // 12. CONSTRUCTION & CEMENT DETECTION
  else if (KNOWN_CONSTRUCTION.has(cleanSym) || rawSector === 'İnşaat' || rawSector === 'Taş, Toprak, Çimento') {
    category = 'CONSTRUCTION';
    displayName = 'İnşaat & Çimento';
  }
  // 13. FOOD & BEVERAGE DETECTION
  else if (KNOWN_FOOD.has(cleanSym) || rawSector === 'Gıda') {
    category = 'FOOD';
    displayName = 'Gıda & İçecek';
  }

  const isFinancialInstitution = category === 'BANK' || category === 'INSURANCE';
  const isREIT = category === 'REIT';
  const isHolding = category === 'HOLDING';
  const isIndustrial = !isFinancialInstitution && !isREIT && !isHolding;

  // Build list of metrics that cannot/should not be calculated for this sector
  const unsupportedMetrics: string[] = [];

  if (category === 'BANK') {
    unsupportedMetrics.push(
      'netDebt',
      'netDebtToEBITDA',
      'currentRatio',
      'quickRatio',
      'ebitda',
      'ebitdaMargin',
      'grossProfitMargin',
      'operatingMargin',
      'inventoryTurnover',
      'receivablesTurnover'
    );
  } else if (category === 'INSURANCE') {
    unsupportedMetrics.push(
      'netDebt',
      'netDebtToEBITDA',
      'currentRatio',
      'quickRatio',
      'ebitda',
      'ebitdaMargin',
      'grossProfitMargin'
    );
  } else if (category === 'REIT') {
    unsupportedMetrics.push(
      'currentRatio',
      'quickRatio',
      'netDebtToEBITDA'
    );
  }

  return {
    category,
    displayName,
    isFinancialInstitution,
    isREIT,
    isHolding,
    isIndustrial,
    unsupportedMetrics
  };
}
