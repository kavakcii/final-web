const fs = require('fs');
const path = require('path');

// Load sectorMapping
const sectorMappingFile = fs.readFileSync(path.join(__dirname, '../src/data/sectorMapping.ts'), 'utf8');
const sectorMappingMatches = sectorMappingFile.match(/["']([A-Z0-9]+)["']:\s*["']([^"']+)["']/g) || [];

const sectorMapping = {};
sectorMappingMatches.forEach(m => {
  const parts = m.match(/["']([A-Z0-9]+)["']:\s*["']([^"']+)["']/);
  if (parts && parts[1] && parts[2]) {
    sectorMapping[parts[1]] = parts[2];
  }
});

const KNOWN_BANKS = new Set(['GARAN', 'AKBNK', 'YKBNK', 'ISCTR', 'VAKBN', 'HALKB', 'TSKB', 'ALBRK', 'SKBNK', 'ICBCT', 'QNBFK']);
const KNOWN_INSURANCE = new Set(['ANHYT', 'ANSGR', 'AGESA', 'AKGRT', 'RAYSG', 'TURSG', 'GARFA', 'RAYAS']);
const KNOWN_HOLDINGS = new Set(['KCHOL', 'SAHOL', 'DOHOL', 'AGHOL', 'BERA', 'TKFEN', 'ENKAI', 'GSDHO', 'INVEO', 'ECZYT', 'IEYHO', 'DUNYH', 'POLHO', 'INVES', 'HEDEF', 'UNLU', 'DERHL', 'VERUS', 'OTTO', 'AVHOL', 'DENGE', 'GLRYH', 'IHYAY', 'LRSHO', 'TAVHL', 'UFUK', 'MARKA', 'YESIL', 'METRO', 'BRYAT', 'RALYH', 'GLYHO', 'IHLAS', 'LYDHO', 'TRCAS', 'ALARK', 'TEHOL', 'ECILC', 'NTHOL', 'SISE', 'PAHOL', 'BINHO', 'GRTHO', 'KLRHO', 'MZHLD', 'TRHOL', 'COSMO', 'AKYHO']);
const KNOWN_ENERGY = new Set(['TUPRS', 'AKSEN', 'ASTOR', 'BIOEN', 'GWIND', 'CWENE', 'EUPWR', 'AYDEM', 'CANTE', 'ENJSA', 'NATEN', 'ESEN', 'AHGAZ', 'ENERY', 'TATEN', 'IZENR', 'A1YEN', 'MOGAN', 'ENTRA', 'CATES', 'BESTE', 'ARFYE', 'ECOGR', 'KLYPV', 'ENDAE', 'BIGEN', 'ZEDUR', 'AKENR', 'AYEN', 'ZOREN', 'PAMEL', 'AKSUE', 'HUNER', 'MAGEN', 'CONSE', 'SMRTG', 'ODAS', 'LYDYE']);
const KNOWN_TELECOM = new Set(['TCELL', 'TTKOM']);
const KNOWN_TRANSPORTATION = new Set(['THYAO', 'PGSUS', 'TAVHL', 'CLEBI', 'GSDDE', 'RYSAS', 'HOROZ', 'HRKET', 'PASEU', 'GRSEL', 'TUREX', 'BEYAZ', 'LIDER', 'TLMAN']);
const KNOWN_RETAIL = new Set(['BIMAS', 'MGROS', 'SOKM', 'MAVI', 'TKNSA', 'CRFSA', 'EBEBK', 'SUWEN', 'GMTAS', 'KIMMR', 'GENIL', 'ARZUM', 'VAKKO', 'MEPET', 'BIZIM', 'ADESE', 'KOTON', 'SEGMN', 'EFOR', 'ALKLC', 'MOPAS', 'DAGI', 'VANGD', 'PSDTC']);
const KNOWN_TECH = new Set(['ASELS', 'MIATK', 'REEDR', 'ARDYZ', 'LOGO', 'PATEK', 'FORTE', 'SDTTR', 'MCARD', 'EMPAE', 'NETCD', 'DOFRB', 'BINBN', 'ONRYT', 'ALTNY', 'ODINE', 'AZTEK', 'OBASE', 'HTTBT', 'MOBTL', 'MANAS', 'VBTYZ', 'EDATA', 'ATATP', 'PENTA', 'MTRKS', 'PAPIL', 'SMART', 'KFEIN', 'FONET', 'KRONT', 'DESPC', 'KAREL', 'INGRM', 'DGATE', 'PKART', 'INDES', 'ARENA', 'LINK', 'ALCTL', 'ESCOM', 'KRON']);
const KNOWN_AUTOMOTIVE = new Set(['FROTO', 'TOASO', 'TTRAK', 'ASUZU', 'KARSN', 'DOAS', 'TMSN', 'BFREN', 'JANTS', 'PARSN', 'DITAS', 'DOKTA']);
const KNOWN_FOOD = new Set(['CCOLA', 'AEFES', 'ULKER', 'BANVT', 'TATGD', 'YYLGD', 'SOKE', 'GOLDA', 'AKHAN', 'MEYSU', 'BALSU', 'ARMGD', 'DURKN', 'CEMZY', 'GUNDG', 'SEGMN', 'EFOR', 'ALKLC', 'OBAMS', 'BORSK', 'DMRGD', 'OFSYM', 'ATAKP', 'KAYSE', 'EKSUN', 'GOKNR', 'OZSUB', 'KRVGD', 'FADE', 'AVOD', 'PENGD', 'KNFRT', 'FRIGO', 'TUKAS', 'MERKO', 'DARDL', 'BESLR', 'TBORG', 'PINSU', 'PETUN', 'PNSUT', 'ERSU', 'OYLUM', 'KRSTL']);
const KNOWN_HEALTH = new Set(['DEVA', 'GENIL', 'MPARK', 'MEDTR', 'ECILC', 'TNZTP', 'EGEPO', 'ONCSM', 'RTALB', 'LKMNH', 'TRILC', 'ANGEN']);
const KNOWN_CONSTRUCTION = new Set(['OYAKC', 'CIMSA', 'BUCIM', 'NUHCM', 'ENKAI', 'BOBET', 'LMKDC', 'KLSER', 'BIENY', 'QUAGR', 'BSOKE', 'CMBTN', 'AKCNS', 'BTCIM', 'GOLTS', 'AFYON', 'KONYA', 'USAK', 'DAPGM', 'BRLSM', 'GESAN', 'SANEL', 'YAYLA', 'TURGG', 'KUYAS', 'UCAYM', 'AKFIS', 'GLRMK', 'EGSER', 'KUTPO', 'CGCAM', 'BATI']);

function getCategory(cleanSym, rawSec = '') {
  if (KNOWN_BANKS.has(cleanSym) || rawSec === 'Banka') return 'BANK';
  if (KNOWN_INSURANCE.has(cleanSym) || rawSec === 'Sigorta') return 'INSURANCE';
  if (cleanSym.endsWith('GYO') || cleanSym.endsWith('GMYO') || rawSec === 'Gayrimenkul') return 'REIT';
  if (KNOWN_HOLDINGS.has(cleanSym) || rawSec === 'Holding') return 'HOLDING';
  if (KNOWN_ENERGY.has(cleanSym) || rawSec === 'Elektrik' || rawSec === 'Enerji') return 'ENERGY';
  if (KNOWN_TELECOM.has(cleanSym) || rawSec === 'İletişim' || rawSec === 'Haberleşme') return 'TELECOM';
  if (KNOWN_TRANSPORTATION.has(cleanSym) || rawSec === 'Ulaştırma') return 'TRANSPORTATION';
  if (KNOWN_AUTOMOTIVE.has(cleanSym) || rawSec === 'Otomotiv') return 'AUTOMOTIVE';
  if (KNOWN_RETAIL.has(cleanSym) || rawSec === 'Ticaret' || rawSec === 'Gıda Perakendeciliği') return 'RETAIL';
  if (KNOWN_TECH.has(cleanSym) || rawSec === 'Teknoloji' || rawSec === 'Bilişim') return 'TECHNOLOGY';
  if (KNOWN_HEALTH.has(cleanSym) || rawSec === 'Sağlık' || rawSec === 'İlaç ve Sağlık') return 'HEALTHCARE';
  if (KNOWN_CONSTRUCTION.has(cleanSym) || rawSec === 'İnşaat' || rawSec === 'Taş, Toprak, Çimento') return 'CONSTRUCTION';
  if (KNOWN_FOOD.has(cleanSym) || rawSec === 'Gıda' || rawSec === 'Gıda ve İçecek') return 'FOOD';
  if (rawSec === 'Sınai' || rawSec === 'Metal Ana' || rawSec === 'Madencilik' || rawSec === 'Tekstil' || rawSec === 'Kimya, Plastik ve Tekstil' || rawSec === 'Ana Metal ve Madencilik') return 'INDUSTRIAL';
  return 'OTHER';
}

async function auditUniverse() {
  const res = await fetch('https://scanner.tradingview.com/turkey/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ columns: ['name', 'description', 'close', 'change', 'volume'], range: [0, 1000] })
  });
  const json = await res.json();
  const tvData = json.data || [];

  const finAiSymbols = new Set(Object.keys(sectorMapping).map(s => s.toUpperCase()));
  const tvSymbols = new Set();
  const missingInFinAi = [];
  const sectorCounts = {};
  const otherList = [];

  tvData.forEach(item => {
    const rawSym = String(item.d[0]).toUpperCase().replace('.IS', '').trim();
    const compName = item.d[1] || '';
    tvSymbols.add(rawSym);

    if (!finAiSymbols.has(rawSym)) {
      missingInFinAi.push({ symbol: rawSym, companyName: compName });
    }

    const cat = getCategory(rawSym, sectorMapping[rawSym]);
    sectorCounts[cat] = (sectorCounts[cat] || 0) + 1;

    if (cat === 'OTHER') {
      otherList.push({ symbol: rawSym, companyName: compName, rawSector: sectorMapping[rawSym] || 'Unmapped' });
    }
  });

  console.log('================================================================================');
  console.log('FİNAİ BIST PAY EVRENİ & VERİ KAPSAMA AUDİT RAPORU');
  console.log('================================================================================');
  console.log(`TradingView Aktif BIST Pay Sayısı : ${tvData.length}`);
  console.log(`FinAi sectorMapping.ts Sembol Sayısı: ${Object.keys(sectorMapping).length}`);
  console.log(`Eksik (sectorMapping'de Olmayan)   : ${missingInFinAi.length}`);
  console.log(`OTHER Kategorisindeki Sembol Sayısı : ${otherList.length}`);
  console.log('\nSektör Dağılımı:');
  console.log(sectorCounts);

  if (missingInFinAi.length > 0) {
    console.log(`\n--- EKSİK SEMBOLLER (FinAi Katalogunda Eksik Olanlar - ${missingInFinAi.length} Hisse) ---`);
    missingInFinAi.forEach((m, idx) => {
      console.log(`${idx+1}. ${m.symbol} - ${m.companyName}`);
    });
  }

  if (otherList.length > 0) {
    console.log(`\n--- OTHER KATEGORİSİNDEKİ HİSSELER (${otherList.length} Hisse) ---`);
    otherList.forEach((o, idx) => {
      console.log(`${idx+1}. ${o.symbol} - ${o.companyName} (RawSector: ${o.rawSector})`);
    });
  }
}

auditUniverse();
