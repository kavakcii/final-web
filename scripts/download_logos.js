const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Kapsamlı BIST Şirket Sembol Kataloğu
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
  "Otomotiv": ["FROTO", "TOASO", "DOAS", "OTKAR", "TTRAK", "ASUZU", "KARSN", "JANTS", "EGEEN", "PARSN"],
  "Ana Metal ve Madencilik": ["EREGL", "KRDMD", "ISDMR", "KOZAL", "CVKMD", "SARKY", "GUBRF", "KOZAA", "ALCAR", "PRKME"],
  "Taş, Toprak, Çimento": ["OYAKC", "CIMSA", "BSOKE", "BTCIM", "QUAGR", "AKCNS", "NUHCM", "AFYON", "BATI", "BUCIM", "LMKDC", "EGSER", "KUTPO"],
  "Gayrimenkul (GYO)": ["EKGYO", "PSGYO", "DAPGM", "KUYAS", "SNGYO", "TRGYO", "VAKGY", "ASGYO", "KZBGY", "SURGY", "MSGYO", "DZGYO", "IDGYO", "PEGYO"],
  "İlaç ve Sağlık": ["ECILC", "GENIL", "MPARK", "TRILC", "ANGEN", "EGEPO", "LKMNH", "RTALB", "TNZTP", "MEDTR", "ONCSM"],
  "Haberleşme": ["TCELL", "TTKOM"],
  "Dayanıklı Tüketim": ["ARCLK", "VESTL", "VESBE", "SILVR", "IHEVA"],
  "Sigorta ve Emeklilik": ["ANSGR", "TURSG", "AKGRT", "AGESA", "ANHYT", "RAYAS"],
  "Kimya, Plastik ve Tekstil": ["SASA", "HEKTS", "PETKM", "AKSA", "KORDS", "BRSAN", "ARSAN", "BOSSA", "KRTEK", "LUKSK", "MNDRS", "RNPOL", "RUBNS", "YUNSA", "KMPUR", "MERCN"],
  "Spor": ["FENER", "GSRAY", "BJKAS", "TSPOR"],
  "Aracı Kurum ve Finans": ["ISMEN", "OYYAT", "INFO", "TERA", "GEDIK", "GLBMD", "OSMEN", "UNLU", "INVEO"],
  "Teknoloji Donanım ve Ticaret": ["INDES", "ARENA", "PENTA", "ARMDA", "DESPC", "DGATE", "AZTEK"],
  "Turizm ve Konaklama": ["MAALT", "MARTI", "AYCES", "PKENT", "TEKTU", "MERIT"]
};

const allSymbols = new Set();
Object.values(STOCK_SECTORS).forEach(arr => arr.forEach(s => allSymbols.add(s.toUpperCase().trim())));

const extraSymbols = [
  "A1CAP", "ACSEL", "ADEL", "ADESE", "AFYON", "AGESA", "AGHOL", "AGROT", "AHSGY", "AKBNK",
  "AKCNS", "AKFGY", "AKFYE", "AKGRT", "AKMGY", "AKSA", "AKSEN", "AKSGY", "AKSUE", "AKENR",
  "ALARK", "ALBRK", "ALCAR", "ALCTL", "ALFAS", "ALKA", "ALKIM", "ALMAD", "ALTNY", "ALVES",
  "ANELE", "ANGEN", "ANHYT", "ANSGR", "ARASE", "ARCLK", "ARDYZ", "ARENA", "ARSAN", "ARTMS",
  "ASGYO", "ASELS", "ASTOR", "ASUZU", "ATATP", "ATAGY", "ATEKS", "ATLAS", "ATSYH", "AVOD",
  "AVPGY", "AVTUR", "AYCES", "AYDEM", "AYEN", "AYGAZ", "AZTEK", "BAGFS", "BAKAB", "BALAT",
  "BANVT", "BARMA", "BASGZ", "BASCM", "BATIS", "BAYRK", "BEVTK", "BFREN", "BIENY", "BIGCHEFS",
  "BIMAS", "BINHO", "BIOEN", "BIZIM", "BJKAS", "BLCYT", "BMSKV", "BMSTL", "BNTAS", "BOBET",
  "BOSSA", "BRISA", "BRKO", "BRKSN", "BRKVY", "BRLSM", "BRSAN", "BRYAT", "BSOKE", "BTCIM",
  "BUCIM", "BURCE", "BURVA", "BVSAN", "BYDNR", "CANTE", "CASA", "CATES", "CCOLA", "CELHA",
  "CEMAS", "CEMTS", "CMBTN", "CMENT", "CONSE", "COSMO", "CRFSA", "CRDFA", "CUSAN", "CVKMD",
  "CWENE", "DAGI", "DAGHL", "DAPGM", "DARDL", "DGATE", "DGGYO", "DITAS", "DMRGD", "DMSAS",
  "DNISI", "DOAS", "DOCO", "DOHOL", "DOKTA", "DSRT", "DURDO", "DYOBY", "DZGYO", "EBEBK",
  "ECAP", "ECILC", "ECZYT", "EDATA", "EDIP", "EGEEN", "EGEPO", "EGSER", "EKIZ", "EKGYO",
  "EKOS", "EKSUN", "ELITE", "EMKEL", "ENJSA", "ENKAI", "ENERY", "ERBOS", "EREGL", "ERSU",
  "ESCAR", "ESCOM", "ESEN", "ETILR", "EUPWR", "EYGYO", "FADE", "FENER", "FLAP", "FMIZP",
  "FONET", "FORMT", "FORTE", "FRIGO", "FROTO", "FZLGY", "GARAN", "GARFA", "GEDIK", "GENIL",
  "GEREL", "GESAN", "GIPTA", "GLBMD", "GLYHO", "GMTAS", "GOKNR", "GOLTS", "GOZDE", "GRNYO",
  "GRSEL", "GSDHO", "GSDDE", "GSRAY", "GUBRF", "GWIND", "GZNMI", "HALKB", "HATEK", "HDFGS",
  "HEKTS", "HKTM", "HLGYO", "HTTBT", "HUBVC", "HUNER", "HURGZ", "ICBCT", "IDEAS", "IDGYO",
  "IEYHO", "IHEVA", "IHGZT", "IHAAS", "IMASM", "INDES", "INFO", "INGRM", "INVEO", "INVES",
  "IPEKE", "ISATR", "ISBTR", "ISCTR", "ISDMR", "ISFIN", "ISGSY", "ISGYO", "ISKPL", "ISMEN",
  "ISSEN", "IZENR", "IZINV", "IZMDC", "JANTS", "KAFEIN", "KAREL", "KARSN", "KARTN", "KATMR",
  "KAYSE", "KBORU", "KCAER", "KCHOL", "KENT", "KFEIN", "KGYO", "KIMMR", "KLGYO", "KLMSN",
  "KLSER", "KLRHO", "KMPUR", "KNFRT", "KONTR", "KONYA", "KORDS", "KOZAA", "KOZAL", "KRDMA",
  "KRDMB", "KRDMD", "KRONT", "KRPLS", "KRTEK", "KRVGD", "KSTUR", "KTLEV", "KUTPO", "KUYAS",
  "KZBGY", "KZGYO", "LIDER", "LIDFA", "LINK", "LKMNH", "LOGO", "LUKSK", "MAALT", "MACKO",
  "MAGEN", "MAKIM", "MAKTK", "MANAS", "MARKA", "MARTI", "MEGAP", "MEGMT", "MEPET",
  "MERCN", "MERIT", "MERKO", "METRO", "METUR", "MGROS", "MIATK", "MNDTR", "MOBTL", "MPARK",
  "MRGYO", "MRSHL", "MSGYO", "MTRKS", "MTRYO", "MZHLD", "NATEN", "NETAS", "NIBAS", "NTGAZ",
  "NTHOL", "NUGYO", "NUHCM", "OBASE", "ODAS", "ODINE", "ONCSM", "ORCA", "ORGE", "ORMA",
  "OSMEN", "OSTIM", "OTKAR", "OYAKC", "OYAYO", "OYLUM", "OYYAT", "OZKGY", "OZRDN", "OZSUB",
  "PAGYO", "PAMEL", "PAPIL", "PARSN", "PASEU", "PATEK", "PCILT", "PEKGY", "PENGD", "PENTA",
  "PETKM", "PETUN", "PGSUS", "PINSU", "PKENT", "PKART", "PLTUR", "POLHO", "POLTK", "PRKAB",
  "PRKME", "PRDGS", "PSGYO", "QNBFK", "QNBFL", "QUAGR", "RALYH", "RAYSG", "REEDR", "RNPOL",
  "RODRG", "ROYAL", "RTALB", "RUBNS", "RYGYO", "RYSAS", "SAHOL", "SAMAT", "SANEL", "SANFM",
  "SANKO", "SARKY", "SASA", "SAYAS", "SDTTR", "SEKFK", "SEKUR", "SELEC", "SELVA", "SEYKM",
  "SILVR", "SISE", "SKBNK", "SKTAS", "SMART", "SMRTG", "SNGYO", "SNICA", "SOKE", "SOKM",
  "SONME", "SRVGY", "SUMAS", "SURGY", "SUWEN", "TATEN", "TATGD", "TAVHL", "TBORG", "TCELL",
  "TDGYO", "TEKTU", "TERA", "TETMT", "TFX", "TGSAS", "THYAO", "TKFEN", "TKNSA", "TLMAN",
  "TMSN", "TNZTP", "TOASO", "TRGYO", "TRILC", "TSKB", "TSPOR", "TTKOM", "TTRAK", "TUCLK",
  "TUKAS", "TUPRS", "TUREX", "TURSG", "UFUK", "ULAS", "ULKER", "UNLU", "USAK", "VAKBN",
  "VAKFN", "VAKKO", "VBTYZ", "VERTU", "VERUS", "VESBE", "VESTL", "VKFYO", "VKGYO", "YAPRK",
  "YASAT", "YATAS", "YAYLA", "YEOTK", "YGYO", "YKBNK", "YNGRT", "YONGA", "YUNSA", "YYLGD",
  "ZEDUR", "ZOREN", "ZRGYO"
];
extraSymbols.forEach(s => allSymbols.add(s.toUpperCase().trim()));

const outputDir = path.join(__dirname, '..', 'public', 'logos');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function downloadSingleUrl(url, destPath) {
  return new Promise((resolve) => {
    try {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, { timeout: 8000 }, (res) => {
        if (res.statusCode === 200) {
          const file = fs.createWriteStream(destPath);
          res.pipe(file);
          file.on('finish', () => {
            file.close(() => resolve(true));
          });
          file.on('error', () => {
            fs.unlink(destPath, () => {});
            resolve(false);
          });
        } else {
          resolve(false);
        }
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
    } catch (e) {
      resolve(false);
    }
  });
}

async function run() {
  const symbols = Array.from(allSymbols);
  let downloadedCount = 0;

  for (const sym of symbols) {
    const dest = path.join(outputDir, `${sym}.png`);
    
    if (fs.existsSync(dest) && fs.statSync(dest).size > 100) {
      downloadedCount++;
      continue;
    }

    const slugMap = {
      "KORDS": "kordsa", "THYAO": "turk-hava-yollari", "ASELS": "aselsan",
      "EREGL": "eregli-demir-celik", "TUPRS": "tupras", "KCHOL": "koc-holding",
      "SAHOL": "sabanci-holding", "GARAN": "garanti-bbva", "AKBNK": "akbank",
      "ISCTR": "is-bankasi", "YKBNK": "yapi-kredi", "BIMAS": "bim",
      "MGROS": "migros", "SISE": "sisecam", "FROTO": "ford-otosan",
      "TOASO": "tofas", "TCELL": "turkcell", "TTKOM": "turk-telekom",
      "SASA": "sasa", "HEKTS": "hektas", "ASTOR": "astor-enerji",
      "MIATK": "mia-teknoloji", "PGSUS": "pegasus", "ARCLK": "arcelik"
    };
    const slug = slugMap[sym] || sym.toLowerCase();

    const sources = [
      `https://cdn.ekofin.net/Logos/${sym}.png`,
      `https://cdn.ekofin.net/Front/${sym}.png`,
      `https://s3-symbol-logo.tradingview.com/${slug}--big.svg`,
      `https://s3-symbol-logo.tradingview.com/${slug}.svg`
    ];

    for (const src of sources) {
      const ok = await downloadSingleUrl(src, dest);
      if (ok) {
        downloadedCount++;
        break;
      }
    }
  }

  console.log(`BIST Amblem İndirme İşlemi TAMAMLANDI: Toplam ${downloadedCount} adet amblem "public/logos/" klasörüne yerleştirildi.`);
}

run();
