const { fetchStockFundamentals } = require('../src/lib/fundamentals-service');

const TEST_SYMBOLS = [
  'EREGL', 'KARSN',  // SANAYİ
  'GARAN', 'AKBNK', 'YKBNK', // BANKA
  'TUPRS', 'AKSEN',  // ENERJİ
  'SAHOL', 'KCHOL',  // HOLDİNG
  'TCELL'            // TELEKOM
];

async function runMatrixTest() {
  console.log("=========================================================================================");
  console.log("FinAI Stage 2.1 - Test Matrix & Data Layer Audit");
  console.log("=========================================================================================");
  
  for (const sym of TEST_SYMBOLS) {
    try {
      const data = await fetchStockFundamentals(sym);
      const s = data.sectorInfo;
      const q = data.quality;
      const ttm = data.ttm;

      console.log(`\n-----------------------------------------------------------------------------------------`);
      console.log(`Symbol: ${data.symbol} (${data.companyName})`);
      console.log(`Sector Category: ${s.category} | Display: ${s.displayName}`);
      console.log(`Flags: FinancialInst=${s.isFinancialInstitution} | REIT=${s.isREIT} | Holding=${s.isHolding} | Industrial=${s.isIndustrial}`);
      console.log(`Unsupported Metrics: [${s.unsupportedMetrics.join(', ')}]`);
      console.log(`Quality Status: ${q.status.toUpperCase()} | Completeness: ${q.completenessScore}%`);
      console.log(`Balance Sheet Check: Asset=Liab+Eq? ${q.balanceSheetChecks.isAssetsEqualLiabilitiesAndEquity}`);
      console.log(`Quarters Count: ${data.quarters.length} | TTM Available: ${ttm != null} (Verified: ${ttm?.isVerified})`);
      
      // GARAN & Bank Specific Net Debt Verification
      if (data.quarters.length > 0) {
        const latestBs = data.quarters[0].balanceSheet;
        console.log(`Latest Net Debt: ${latestBs.netDebt === null ? 'NULL / Uygulanamaz (Banka Kuralı Geçerli)' : latestBs.netDebt + ' TL'}`);
      }

      if (q.warnings.length > 0) {
        console.log(`Warnings: ${q.warnings.join(' | ')}`);
      }
      if (q.errors.length > 0) {
        console.log(`Errors: ${q.errors.join(' | ')}`);
      }
    } catch (e) {
      console.error(`Error testing ${sym}:`, e.message);
    }
  }

  console.log("\n=========================================================================================");
  console.log("Test Matrix Complete.");
  console.log("=========================================================================================");
}

runMatrixTest();
