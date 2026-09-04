const yfModule = require('yahoo-finance2');
const YahooFinanceClass = yfModule.YahooFinance || yfModule.default?.YahooFinance || yfModule.default;
const yahooFinance = new YahooFinanceClass({ suppressNotices: ['yahooSurvey'] });

const sectorMapping = {
  "GARAN": "Banka", "AKBNK": "Banka", "YKBNK": "Banka", "ISCTR": "Banka", "VAKBN": "Banka",
  "EREGL": "Metal Ana", "KARSN": "Sınai", "TUPRS": "Sınai", "AKSEN": "Elektrik",
  "SAHOL": "Holding", "KCHOL": "Holding", "TCELL": "İletişim"
};

const KNOWN_BANKS = new Set(['GARAN', 'AKBNK', 'YKBNK', 'ISCTR', 'VAKBN', 'HALKB', 'TSKB', 'ALBRK', 'SKBNK', 'ICBCT']);
const KNOWN_HOLDINGS = new Set(['KCHOL', 'SAHOL', 'DOHOL', 'AGHOL', 'BERA', 'TKFEN', 'ENKAI']);
const KNOWN_ENERGY = new Set(['TUPRS', 'AKSEN', 'ASTOR', 'BIOEN', 'GWIND', 'CWENE', 'EUPWR']);
const KNOWN_TELECOM = new Set(['TCELL', 'TTKOM']);

function getSectorInfo(sym) {
  const clean = sym.replace('.IS', '').toUpperCase();
  const rawSec = sectorMapping[clean] || '';
  
  let category = 'INDUSTRIAL';
  if (KNOWN_BANKS.has(clean) || rawSec === 'Banka') category = 'BANK';
  else if (KNOWN_HOLDINGS.has(clean) || rawSec === 'Holding') category = 'HOLDING';
  else if (KNOWN_ENERGY.has(clean) || rawSec === 'Elektrik') category = 'ENERGY';
  else if (KNOWN_TELECOM.has(clean) || rawSec === 'İletişim') category = 'TELECOM';

  const isFinancialInstitution = category === 'BANK';
  const isREIT = category === 'REIT';
  const isHolding = category === 'HOLDING';
  const isIndustrial = !isFinancialInstitution && !isREIT && !isHolding;

  const unsupportedMetrics = [];
  if (category === 'BANK') {
    unsupportedMetrics.push('netDebt', 'netDebtToEBITDA', 'currentRatio', 'quickRatio', 'ebitda', 'grossProfitMargin');
  }

  return { category, isFinancialInstitution, isREIT, isHolding, isIndustrial, unsupportedMetrics };
}

async function auditSymbol(sym) {
  const yahooSymbol = `${sym}.IS`;
  const sectorInfo = getSectorInfo(sym);
  let summary = null;

  try {
    summary = await yahooFinance.quoteSummary(yahooSymbol, {
      modules: ['price', 'financialData', 'defaultKeyStatistics', 'incomeStatementHistoryQuarterly', 'balanceSheetHistoryQuarterly']
    });
  } catch (e) {
    console.error(`Fetch error for ${sym}:`, e.message);
    return;
  }

  const qIncome = summary?.incomeStatementHistoryQuarterly?.incomeStatementHistory || [];
  const qBalance = summary?.balanceSheetHistoryQuarterly?.balanceSheetStatements || [];
  
  const latestBs = qBalance[0] || {};
  const totalAssets = latestBs.totalAssets || null;
  const totalLiab = latestBs.totalLiab || null;
  const totalEquity = latestBs.totalStockholderEquity || (totalAssets && totalLiab ? totalAssets - totalLiab : null);

  const cash = latestBs.cash || latestBs.cashAndCashEquivalents || null;
  const shortDebt = latestBs.shortLongTermDebt || 0;
  const longDebt = latestBs.longTermDebt || 0;
  const finDebt = (shortDebt + longDebt) > 0 ? (shortDebt + longDebt) : (latestBs.totalDebt || null);

  // Sector-Aware Net Debt Rule
  let netDebt = null;
  if (!sectorInfo.isFinancialInstitution) {
    netDebt = (finDebt != null && cash != null) ? finDebt - cash : null;
  }

  // Accounting Identity Check
  let assetsCheck = false;
  if (totalAssets && totalLiab && totalEquity) {
    assetsCheck = Math.abs(totalAssets - (totalLiab + totalEquity)) < Math.max(totalAssets * 0.02, 100000);
  }

  console.log(`\n==================================================`);
  console.log(`SYMBOL: ${sym}`);
  console.log(`Sector Category: ${sectorInfo.category} (FinancialInst: ${sectorInfo.isFinancialInstitution})`);
  console.log(`Unsupported Metrics: [${sectorInfo.unsupportedMetrics.join(', ')}]`);
  console.log(`Accounting Identity (Assets = Liab + Equity): ${assetsCheck ? 'PASS' : 'WARNING'}`);
  console.log(`Net Debt Output: ${netDebt === null ? 'NULL / Uygulanamaz (Banka Kuralı Başarılı)' : (netDebt / 1e6).toFixed(2) + ' M TL'}`);
  console.log(`Quarters Count: ${qIncome.length}`);
}

async function main() {
  const symbols = ['EREGL', 'KARSN', 'GARAN', 'AKBNK', 'YKBNK', 'TUPRS', 'AKSEN', 'SAHOL', 'KCHOL', 'TCELL'];
  for (const s of symbols) {
    await auditSymbol(s);
  }
}

main();
