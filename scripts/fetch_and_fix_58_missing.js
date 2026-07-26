const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const missingList = [
  'GARAN', 'YKBNK', 'HALKB', 'VAKBN', 'QNBFK',
  'KCHOL', 'TKFEN', 'IHGZT', 'LOGO',  'ODINE',
  'ATATP', 'CWENE', 'EUPWR', 'GESAN', 'YEOTK',
  'SMRTG', 'ENJSA', 'AKSEN', 'ENERY', 'IZENR',
  'MAGEN', 'CANTE', 'AHSGY', 'AEFES', 'ULKER',
  'BALSU', 'EFOR',  'KTLEV', 'BIMAS', 'MGROS',
  'TAVHL', 'PASEU', 'TUREX', 'GRSEL', 'LIDER',
  'TOASO', 'EREGL', 'KOZAL', 'CVKMD', 'GUBRF',
  'KOZAA', 'OYAKC', 'CIMSA', 'BTCIM', 'BATI',
  'EKGYO', 'PSGYO', 'DAPGM', 'KUYAS', 'VAKGY',
  'PEGYO', 'RAYAS', 'SASA',  'PETKM', 'BRSAN',
  'ISMEN', 'TERA',  'ARMDA'
];

const slugMap = {
  "GARAN": "garanti-bbva", "YKBNK": "yapi-kredi", "HALKB": "halkbank", "VAKBN": "vakifbank",
  "QNBFK": "qnb-finansbank", "KCHOL": "koc-holding", "TKFEN": "tekfen-holding", "LOGO": "logo-yazilim",
  "CWENE": "cw-enerji", "EUPWR": "europower-enerji", "GESAN": "girisim-elektrik", "YEOTK": "yeo-teknoloji",
  "SMRTG": "smart-gunes-teknolojileri", "ENJSA": "enerjisa", "AKSEN": "aksa-enerji", "AEFES": "anadolu-efes",
  "ULKER": "ulker", "BIMAS": "bim", "MGROS": "migros", "TAVHL": "tav-havalimanlari", "TOASO": "tofas",
  "EREGL": "eregli-demir-celik", "KOZAL": "koza-altin", "GUBRF": "gubre-fabrikalari", "OYAKC": "oyak-cimento",
  "CIMSA": "cimsa", "EKGYO": "emlak-konut-gyo", "SASA": "sasa", "PETKM": "petkim", "BRSAN": "borusan-mannesmann",
  "ISMEN": "is-yatirim"
};

const outputDir = path.join(__dirname, '..', 'public', 'logos');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function downloadFile(url, destPath) {
  return new Promise((resolve) => {
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
  });
}

async function run() {
  console.log(`Eksik olan 58 amblemi indirme işlemi başlatılıyor...`);
  let fixedCount = 0;

  for (const sym of missingList) {
    const destPng = path.join(outputDir, `${sym}.png`);
    const slug = slugMap[sym] || sym.toLowerCase();

    const sources = [
      `https://cdn.ekofin.net/Logos/${sym}.png`,
      `https://cdn.ekofin.net/Front/${sym}.png`,
      `https://s3-symbol-logo.tradingview.com/${slug}--big.svg`,
      `https://s3-symbol-logo.tradingview.com/${slug}.svg`,
      `https://s3-symbol-logo.tradingview.com/country/TR.svg`
    ];

    let success = false;
    for (const src of sources) {
      success = await downloadFile(src, destPng);
      if (success) break;
    }

    if (success) {
      fixedCount++;
      console.log(`[BAŞARILI] ${sym} amblemi indirildi ve kaydedildi.`);
    } else {
      console.log(`[UYARI] ${sym} amblemi bulunamadı.`);
    }
  }

  console.log(`TAMAMLANDI: ${fixedCount} / ${missingList.length} eksik logo yerel klasöre indirildi.`);
}

run();
