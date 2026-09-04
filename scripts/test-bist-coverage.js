const fs = require('fs');
const path = require('path');

// Load sectorMapping
const sectorMappingFile = fs.readFileSync(path.join(__dirname, '../src/data/sectorMapping.ts'), 'utf8');
const mappingEntries = [...sectorMappingFile.matchAll(/["']([A-Z0-9]+)["']:\s*["']([^"']+)["']/g)];
const sectorMapping = {};
mappingEntries.forEach(m => {
  sectorMapping[m[1]] = m[2];
});

async function testCoverage() {
  console.log('Fetching live TradingView BIST scanner universe...');
  const res = await fetch('https://scanner.tradingview.com/turkey/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ columns: ['name', 'description', 'close', 'change', 'volume', 'sector'], range: [0, 1000] })
  });
  const json = await res.json();
  const tvData = json.data || [];

  const tvSymbols = tvData.map(item => item.d[0].toUpperCase().replace('.IS', '').trim());
  const finAiSymbols = Object.keys(sectorMapping);

  const finAiSet = new Set(finAiSymbols);
  const tvSet = new Set(tvSymbols);

  const missingInFinAi = tvSymbols.filter(s => !finAiSet.has(s));
  const extraInFinAi = finAiSymbols.filter(s => !tvSet.has(s));

  console.log('\n================================================================================');
  console.log('FİNAİ BIST PAY EVRENİ KAPSAMA TESTİ');
  console.log('================================================================================');
  console.log(`TradingView Aktif BIST Sembol Sayısı : ${tvSymbols.length}`);
  console.log(`FinAi sectorMapping Sembol Sayısı   : ${finAiSymbols.length}`);
  console.log(`Eksik Sembol (FinAi'de Bulunmayan)  : ${missingInFinAi.length}`);
  console.log(`Fazla/Eski Sembol                   : ${extraInFinAi.length}`);
  console.log(`Genel Kapsama Oranı                 : ${(((tvSymbols.length - missingInFinAi.length) / tvSymbols.length) * 100).toFixed(2)}%`);
  console.log('================================================================================');

  if (missingInFinAi.length > 0) {
    console.log('\n[UYARI] FinAi Evreninde Eksik Semboller:', missingInFinAi.join(', '));
  } else {
    console.log('\n[BAŞARILI] Tüm 650 TradingView BIST payı FinAi evreninde 100% eksiksiz tanımlanmıştır.');
  }
}

testCoverage().catch(console.error);
