const fs = require('fs');
const path = require('path');

async function updateSectorMapping() {
  const res = await fetch('https://scanner.tradingview.com/turkey/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ columns: ['name', 'description', 'sector'], range: [0, 1000] })
  });
  const json = await res.json();
  const tvData = json.data || [];

  // Existing sectorMapping file
  const filePath = path.join(__dirname, '../src/data/sectorMapping.ts');
  const content = fs.readFileSync(filePath, 'utf8');

  // Parse existing key-values
  const matches = [...content.matchAll(/["']([A-Z0-9]+)["']:\s*["']([^"']+)["']/g)];
  const existingMap = {};
  matches.forEach(m => {
    existingMap[m[1]] = m[2];
  });

  tvData.forEach(item => {
    const sym = item.d[0].toUpperCase().replace('.IS', '').trim();
    const desc = item.d[1] || '';
    const rawSector = item.d[2] || '';

    if (!existingMap[sym]) {
      let assignedSector = 'Diğer / Çeşitli';
      if (sym.endsWith('GYO') || sym.endsWith('GMYO') || desc.includes('GAYRIMENKUL YATIRIM ORTAKLIGI') || desc.includes('REAL ESTATE')) {
        assignedSector = 'Gayrimenkul Yatırım Ortaklığı';
      } else if (desc.includes('SIGORTA') || desc.includes('INSURANCE')) {
        assignedSector = 'Sigorta';
      } else if (desc.includes('FAKTORING') || desc.includes('FINANSAL') || desc.includes('MENKUL') || desc.includes('YATIRIM ORTAKLIGI')) {
        assignedSector = 'Aracı Kurum ve Finans';
      } else if (desc.includes('BORSA YATIRIM FONU') || desc.includes('ETF') || desc.includes('SERTIFIKA') || sym.startsWith('Z30') || sym.startsWith('ZSR') || sym.startsWith('ZPL') || sym.startsWith('ZRE') || sym.startsWith('ZPT') || sym.startsWith('AP') || sym.startsWith('OP')) {
        assignedSector = 'Borsa Yatırım Fonu / Sertifika';
      } else if (desc.includes('TURIZM') || desc.includes('OTEL')) {
        assignedSector = 'Turizm';
      } else if (desc.includes('HOLDING')) {
        assignedSector = 'Holding ve Yatırım';
      } else if (desc.includes('ENERJI') || desc.includes('ELEKTRIK')) {
        assignedSector = 'Enerji ve Elektrik';
      } else if (desc.includes('TEKNOLOJI') || desc.includes('YAZILIM')) {
        assignedSector = 'Teknoloji ve Bilişim';
      } else if (desc.includes('CIMENTO') || desc.includes('INSAAT')) {
        assignedSector = 'İnşaat ve Çimento';
      } else if (rawSector) {
        assignedSector = rawSector;
      }
      existingMap[sym] = assignedSector;
    }
  });

  // Sort keys alphabetically
  const sortedKeys = Object.keys(existingMap).sort();

  let newTsContent = `export const sectorMapping: Record<string, string> = {\n`;
  sortedKeys.forEach(k => {
    newTsContent += `  "${k}": "${existingMap[k]}",\n`;
  });
  newTsContent += `};\n\n`;

  newTsContent += `export const getAssetSector = (symbol: string): string => {\n`;
  newTsContent += `    const commodities = ["ALTIN", "GUMUS", "ALTIN.S1"];\n`;
  newTsContent += `    const cleanSym = symbol.toUpperCase().replace(/\\.IS$/, '');\n`;
  newTsContent += `    if (commodities.includes(cleanSym) || cleanSym.includes("XAU") || cleanSym.includes("XAG")) return "Emtia";\n`;
  newTsContent += `    if (cleanSym.includes("BTC") || cleanSym.includes("ETH") || cleanSym.includes("SOL") || cleanSym.includes("USDT")) return "Kripto";\n`;
  newTsContent += `    if (cleanSym.endsWith("GYO") || cleanSym.includes("GMYO")) return "Gayrimenkul";\n`;
  newTsContent += `    if (sectorMapping[cleanSym]) return sectorMapping[cleanSym];\n`;
  newTsContent += `    if (sectorMapping[symbol]) return sectorMapping[symbol];\n`;
  newTsContent += `    return "Yatırım Fonu";\n`;
  newTsContent += `};\n`;

  fs.writeFileSync(filePath, newTsContent, 'utf8');
  console.log(`Updated sectorMapping.ts with ${sortedKeys.length} total symbols and exported getAssetSector!`);
}

updateSectorMapping().catch(console.error);
