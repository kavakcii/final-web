const fs = require('fs');
const path = require('path');

async function runAudit() {
  const res = await fetch('https://scanner.tradingview.com/turkey/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      columns: ['name', 'description', 'close', 'change', 'volume', 'sector'],
      range: [0, 1000]
    })
  });
  const json = await res.json();
  const tvData = json.data || [];

  const sectorMappingFile = fs.readFileSync(path.join(__dirname, '../src/data/sectorMapping.ts'), 'utf8');
  const matches = [...sectorMappingFile.matchAll(/["']([A-Z0-9]+)["']:\s*["']([^"']+)["']/g)];
  const sectorMapping = {};
  matches.forEach(m => {
    sectorMapping[m[1]] = m[2];
  });

  const tvSymbols = tvData.map(item => item.d[0].toUpperCase().replace('.IS', '').trim());
  const finAiSymbols = Object.keys(sectorMapping);
  const finAiSet = new Set(finAiSymbols);

  const missing = tvSymbols.filter(s => !finAiSet.has(s));

  console.log('================================================================');
  console.log('FULL BIST AUDIT METRICS FOR STAGE 2.1A REPORT');
  console.log('================================================================');
  console.log(`1. Total BIST Equities in TradingView : ${tvData.length}`);
  console.log(`2. Total Symbols in FinAi Mapping      : ${finAiSymbols.length}`);
  console.log(`3. Missing Symbols (Dropped)           : ${missing.length}`);
  console.log(`4. Coverage Percentage                 : ${(((tvData.length - missing.length) / tvData.length) * 100).toFixed(2)}%`);
  console.log('================================================================');

  // Sector breakdown count
  const sectorCounts = {};
  tvData.forEach(item => {
    const sym = item.d[0].toUpperCase().replace('.IS', '').trim();
    const rawSector = sectorMapping[sym] || item.d[5] || 'Unmapped';
    
    let cat = 'Diğer / Özel Pay';
    if (['GARAN', 'AKBNK', 'YKBNK', 'ISCTR', 'VAKBN', 'HALKB', 'TSKB', 'ALBRK', 'SKBNK', 'ICBCT', 'QNBFK', 'QNBTR', 'KLNMA'].includes(sym) || rawSector === 'Banka' || rawSector.includes('Banka')) cat = 'Bankacılık & Finans';
    else if (['ANHYT', 'ANSGR', 'AGESA', 'AKGRT', 'RAYSG', 'TURSG', 'GARFA', 'RAYAS'].includes(sym) || rawSector.includes('Sigorta')) cat = 'Sigortacılık';
    else if (sym.endsWith('GYO') || sym.endsWith('GMYO') || rawSector.includes('Gayrimenkul')) cat = 'Gayrimenkul Yatırım Ortaklığı (GYO)';
    else if (['KCHOL', 'SAHOL', 'DOHOL', 'AGHOL', 'BERA', 'TKFEN', 'ENKAI', 'GSDHO', 'INVEO', 'ECZYT', 'POLHO', 'SISE', 'ALARK'].includes(sym) || rawSector.includes('Holding')) cat = 'Holding & Yatırım';
    else if (rawSector.includes('Aracı Kurum')) cat = 'Aracı Kurum & Finansal Hizmetler';
    else if (['TUPRS', 'AKSEN', 'ASTOR', 'BIOEN', 'GWIND', 'CWENE', 'EUPWR', 'AYDEM', 'CANTE', 'ENJSA', 'NATEN', 'SMRTG', 'ODAS', 'ZOREN'].includes(sym) || rawSector.includes('Elektrik') || rawSector.includes('Enerji')) cat = 'Enerji & Elektrik';
    else if (['TCELL', 'TTKOM'].includes(sym) || rawSector.includes('İletişim')) cat = 'Telekomünikasyon & İletişim';
    else if (['THYAO', 'PGSUS', 'TAVHL', 'CLEBI', 'GSDDE', 'RYSAS'].includes(sym) || rawSector.includes('Ulaştırma')) cat = 'Ulaştırma & Lojistik';
    else if (['FROTO', 'TOASO', 'TTRAK', 'ASUZU', 'KARSN', 'DOAS', 'TMSN', 'BFREN', 'JANTS'].includes(sym) || rawSector.includes('Otomotiv')) cat = 'Otomotiv & Yan Sanayi';
    else if (['BIMAS', 'MGROS', 'SOKM', 'MAVI', 'TKNSA', 'CRFSA', 'EBEBK', 'VAKKO'].includes(sym) || rawSector.includes('Ticaret') || rawSector.includes('Perakende')) cat = 'Perakende & Mağazacılık';
    else if (['ASELS', 'MIATK', 'REEDR', 'ARDYZ', 'LOGO', 'PATEK', 'SDTTR', 'MTRKS', 'INDES', 'KAREL'].includes(sym) || rawSector.includes('Teknoloji') || rawSector.includes('Bilişim')) cat = 'Teknoloji & Yazılım';
    else if (['DEVA', 'GENIL', 'MPARK', 'MEDTR', 'ECILC', 'TNZTP', 'RTALB'].includes(sym) || rawSector.includes('Sağlık') || rawSector.includes('İlaç')) cat = 'Sağlık & İlaç';
    else if (['OYAKC', 'CIMSA', 'BUCIM', 'NUHCM', 'BOBET', 'LMKDC', 'KLSER', 'BIENY', 'QUAGR'].includes(sym) || rawSector.includes('İnşaat') || rawSector.includes('Çimento')) cat = 'İnşaat & Çimento';
    else if (['CCOLA', 'AEFES', 'ULKER', 'BANVT', 'TATGD', 'YYLGD', 'SOKE', 'DARDL', 'TUKAS', 'PETUN', 'PNSUT'].includes(sym) || rawSector.includes('Gıda')) cat = 'Gıda & İçecek';
    else if (rawSector.includes('Borsa Yatırım Fonu') || rawSector.includes('Sertifika')) cat = 'Borsa Yatırım Fonu / Sertifika';
    else cat = 'Sanayi & Üretim';

    sectorCounts[cat] = (sectorCounts[cat] || 0) + 1;
  });

  console.log('\nSector Distribution Breakdown:');
  console.table(sectorCounts);
}

runAudit().catch(console.error);
