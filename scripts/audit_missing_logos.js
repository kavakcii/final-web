const fs = require('fs');
const path = require('path');

// STOCK_SECTORS
const STOCK_SECTORS = {
  "Savunma": ["ASELS", "ALTNY", "OTKAR", "SDTTR", "PATEK", "KORDS", "PAPIL", "FORTE", "KAREL"],
  "Bankacılık": ["AKBNK", "GARAN", "ISCTR", "YKBNK", "HALKB", "VAKBN", "SKBNK", "TSKB", "ALBRK", "ICBCT", "QNBFK"],
  "Holding": ["KCHOL", "SAHOL", "AGHOL", "ALARK", "DOHOL", "TKFEN", "GSDHO", "BRYAT", "VERUS", "METRO", "INVEO", "KLRHO", "GOZDE", "GLRYH", "IHGZT"],
  "Bilişim ve Yazılım": ["MIATK", "REEDR", "ARDYZ", "PATEK", "KONTR", "LOGO", "KFEIN", "LINK", "FONET", "HTTBT", "AZTEK", "EDATA", "MTRKS", "NETAS", "OBASE", "ODINE", "SMART", "VBTYZ", "ESCOM", "ATATP", "KRON", "KRONT"],
  "Enerji Teknolojileri": ["ASTOR", "CWENE", "EUPWR", "GESAN", "KONTR", "YEOTK", "SMRTG", "ALFAS", "EKOS", "TATEN", "HUNER", "SAYAS"],
  "Enerji Üretim ve Dağıtım": ["TUPRS", "ENJSA", "AKSA", "AKSEN", "ODAS", "ZOREN", "ENERY", "IZENR", "MAGEN", "CANTE", "AYDEM", "CATES", "GWIND", "NATEN", "AKFYE", "AHSGY"],
  "Gıda ve İçecek": ["AEFES", "CCOLA", "ULKER", "TABGD", "TUKAS", "OBAMS", "BALSU", "EFOR", "KTLEV", "TATGD", "AGRO", "AGROT", "BANVT", "ELITE", "EKSUN", "GOKNR", "KAYSE", "KNFRT", "KRVGD", "MERKO", "PENGD", "PETUN", "PINSU", "SELVA", "SOKE", "YYLGD"],
  "Gıda Perakendeciliği": ["BIMAS", "MGROS", "SOKM", "CRFSA", "ADESE"],
  "Ulaştırma ve Lojistik": ["THYAO", "PGSUS", "TAVHL", "PASEU", "TUREX", "GRSEL", "CLEBI", "LIDER", "DOCO", "TLMAN", "RYGYO", "TMSN"],
  "Otomotiv": ["FROTO", "TOASO", "DOAS", "OTKAR", "TTRAK", "ASUZU", "KARSN", "TMSN", "JANTS", "EGEEN", "PARSN"],
  "Ana Metal ve Madencilik": ["EREGL", "KRDMD", "ISDMR", "KOZAL", "CVKMD", "SARKY", "GUBRF", "KOZAA", "ALCAR", "PRKME"],
  "Taş, Toprak, Çimento": ["OYAKC", "CIMSA", "BSOKE", "BTCIM", "QUAGR", "AKCNS", "NUHCM", "AFYON", "BATI", "BUCIM", "LMKDC", "EGSER", "KUTPO"],
  "Gayrimenkul (GYO)": ["EKGYO", "PSGYO", "DAPGM", "KUYAS", "SNGYO", "TRGYO", "VAKGY", "ASGYO", "KZBGY", "SURGY", "MSGYO", "DZGYO", "IDGYO", "PEGYO"],
  "İlaç ve Sağlık": ["ECILC", "GENIL", "MPARK", "TRILC", "ANGEN", "EGEPO", "LKMNH", "RTALB", "TNZTP", "MEDTR", "ONCSM"],
  "Haberleşme": ["TCELL", "TTKOM"],
  "Dayanıklı Tüketim": ["ARCLK", "VESTL", "VESBE", "SILVR", "IHEVA"],
  "Sigorta ve Emeklilik": ["ANSGR", "TURSG", "AKGRT", "AGESA", "ANHYT", "RAYAS"],
  "Kimya, Plastik ve Tekstil": ["SASA", "HEKTS", "PETKM", "AKSA", "KORDS", "BRSAN", "ARSAN", "BOSSA", "KRTEK", "LUKSK", "MNDRS", "RNPOL", "RUBNS", "YUNSA", "EGEEN", "KMPUR", "MERCN"],
  "Spor": ["FENER", "GSRAY", "BJKAS", "TSPOR"],
  "Aracı Kurum ve Finans": ["ISMEN", "OYYAT", "INFO", "TERA", "GEDIK", "GLBMD", "OSMEN", "UNLU", "INVEO"],
  "Teknoloji Donanım ve Ticaret": ["INDES", "ARENA", "PENTA", "ARMDA", "DESPC", "DGATE", "AZTEK"],
  "Turizm ve Konaklama": ["MAALT", "MARTI", "AYCES", "PKENT", "TEKTU", "MERIT"]
};

const allSymbols = new Set();
Object.values(STOCK_SECTORS).forEach(arr => arr.forEach(s => allSymbols.add(s.toUpperCase().trim())));

const logosDir = path.join(__dirname, '..', 'public', 'logos');
const missing = [];
const existing = [];

allSymbols.forEach(sym => {
  const exts = ['.png', '.jpeg', '.jpg', '.svg', '.webp'];
  let found = false;
  for (const ext of exts) {
    const file = path.join(logosDir, `${sym}${ext}`);
    if (fs.existsSync(file) && fs.statSync(file).size > 100) {
      found = true;
      break;
    }
  }

  // Also check aliases/variants like sym + T or sym - T
  if (!found) {
    const alt1 = sym.endsWith('T') ? sym.slice(0, -1) : `${sym}T`;
    const alt2 = sym.endsWith('A') ? sym.slice(0, -1) : `${sym}A`;
    for (const ext of exts) {
      if (fs.existsSync(path.join(logosDir, `${alt1}${ext}`)) || fs.existsSync(path.join(logosDir, `${alt2}${ext}`))) {
        found = true;
        break;
      }
    }
  }

  if (found) {
    existing.push(sym);
  } else {
    missing.push(sym);
  }
});

console.log(`TOTAL APP STOCKS: ${allSymbols.size}`);
console.log(`EXISTING LOGOS: ${existing.length}`);
console.log(`MISSING LOGOS COUNT: ${missing.length}`);
console.log(`MISSING SYMBOLS LIST:`, missing);
