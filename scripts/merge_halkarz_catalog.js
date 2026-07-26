const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'halkarz_xu500_data.json');
if (!fs.existsSync(dataPath)) {
  console.error("halkarz_xu500_data.json not found!");
  process.exit(1);
}

const halkarzData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
const targetFile = path.join(__dirname, '..', 'src', 'app', 'dashboard', 'data', 'page.tsx');

let code = fs.readFileSync(targetFile, 'utf-8');

// 1. Build merged STOCK_NAMES dictionary
const stockNamesEntries = Object.entries(halkarzData).map(([sym, name]) => `    "${sym}": "${name.replace(/"/g, '\\"')}"`);

const newStockNamesBlock = `const STOCK_NAMES: Record<string, string> = {\n${stockNamesEntries.join(',\n')}\n};`;

// Replace STOCK_NAMES block
code = code.replace(/const STOCK_NAMES: Record<string, string> = \{[\s\S]*?\};/, newStockNamesBlock);

// 2. Build merged MASTER_BIST_620 array
const allSymbols = Array.from(new Set(Object.keys(halkarzData)));
const masterArrayEntries = allSymbols.map(sym => `  "${sym}"`);

const newMasterBlock = `const MASTER_BIST_620 = [\n${masterArrayEntries.join(',\n')}\n];`;

// Replace MASTER_BIST_620 block
code = code.replace(/const MASTER_BIST_620 = \[[\s\S]*?\];/, newMasterBlock);

fs.writeFileSync(targetFile, code, 'utf-8');
console.log(`Successfully merged ${allSymbols.length} halkarz XU500 stocks into data/page.tsx!`);
