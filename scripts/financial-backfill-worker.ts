/**
 * FinAI 651 BIST Canonical Universe Historical Financial Backfill Worker - Stage 5D
 * Controlled Batching, Concurrency Limiting, Checkpoint / Resumption, Validation, & Complete Audit Engine
 */

import * as fs from 'fs';
import * as path from 'path';
import { sectorMapping } from '../src/data/sectorMapping';
import { fetchStockFundamentals } from '../src/lib/fundamentals-service';
import { getSectorCategory } from '../src/lib/sector-categorizer';

const PROGRESS_FILE = path.join(__dirname, '.backfill_progress.json');
const BATCH_SIZE = 25;
const CONCURRENCY_LIMIT = 3;
const DELAY_BETWEEN_REQUESTS_MS = 250;

export interface SymbolBackfillResult {
  symbol: string;
  companyName: string;
  sectorCategory: string;
  sectorDisplayName: string;
  isInstrumentOnly: boolean; // BYF / Sertifika / Altın
  status: 'SUCCESS' | 'PARTIAL' | 'NO_FINANCIAL_DATA' | 'PRICE_ONLY' | 'FAILED';
  quarterlyIncomeCount: number;
  annualIncomeCount: number;
  quarterlyBalanceCount: number;
  annualBalanceCount: number;
  quarterlyCashFlowCount: number;
  annualCashFlowCount: number;
  dividendCount: number;
  weightedAvgSharesPresent: boolean;
  epsStatus: string;
  currency: string;
  consolidation: string;
  validationStatus: string;
  completenessScore: number;
  ttmVerified: boolean;
  source: string;
  lastVerified: string;
  error?: string;
}

interface BackfillState {
  startedAt: string;
  lastUpdatedAt: string;
  completedSymbols: Record<string, SymbolBackfillResult>;
}

function loadProgress(): BackfillState {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const raw = fs.readFileSync(PROGRESS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {}
  return {
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    completedSymbols: {}
  };
}

function saveProgress(state: BackfillState) {
  try {
    state.lastUpdatedAt = new Date().toISOString();
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to write checkpoint file:', e);
  }
}

async function processSymbol(symbol: string): Promise<SymbolBackfillResult> {
  const rawSector = sectorMapping[symbol] || 'Diğer';
  const sectorInfo = getSectorCategory(symbol);
  const isInstrument = rawSector.includes('Borsa Yatırım Fonu') || rawSector.includes('Sertifika') || sectorInfo.displayName.includes('Sertifika');

  if (isInstrument) {
    return {
      symbol,
      companyName: `${symbol} Yatırım Enstrümanı / Fon`,
      sectorCategory: sectorInfo.category,
      sectorDisplayName: rawSector,
      isInstrumentOnly: true,
      status: 'PRICE_ONLY',
      quarterlyIncomeCount: 0,
      annualIncomeCount: 0,
      quarterlyBalanceCount: 0,
      annualBalanceCount: 0,
      quarterlyCashFlowCount: 0,
      annualCashFlowCount: 0,
      dividendCount: 0,
      weightedAvgSharesPresent: false,
      epsStatus: 'N/A (Fon/Sertifika)',
      currency: 'TRY',
      consolidation: 'STANDALONE',
      validationStatus: 'VALID',
      completenessScore: 0,
      ttmVerified: false,
      source: 'BIST Instrument Catalog',
      lastVerified: new Date().toISOString()
    };
  }

  try {
    const data = await fetchStockFundamentals(symbol);
    const quarters = data.quarters || [];
    const annuals = data.annuals || [];
    const dividends = data.dividends || [];
    const quality = data.quality;
    const latestQ = quarters[0];

    const qIncomeCount = quarters.filter(q => q.incomeStatement.revenue != null || q.incomeStatement.netIncome != null).length;
    const aIncomeCount = annuals.filter(a => a.incomeStatement.revenue != null || a.incomeStatement.netIncome != null).length;
    const qBalanceCount = quarters.filter(q => q.balanceSheet.totalAssets != null || q.balanceSheet.totalEquity != null).length;
    const aBalanceCount = annuals.filter(a => a.balanceSheet.totalAssets != null || a.balanceSheet.totalEquity != null).length;
    const qCashFlowCount = quarters.filter(q => q.cashFlowStatement.operatingCashFlow != null || q.cashFlowStatement.freeCashFlow != null).length;
    const aCashFlowCount = annuals.filter(a => a.cashFlowStatement.operatingCashFlow != null || a.cashFlowStatement.freeCashFlow != null).length;

    const hasShares = latestQ?.perShare?.weightedAverageShares != null || latestQ?.perShare?.totalShares != null;
    const epsVal = latestQ?.perShare?.basicEPS;
    const epsStatus = epsVal != null ? `VALID (${epsVal})` : 'NULL (Hesaplanamadı)';
    const currency = latestQ?.period?.currency || 'TRY';
    const consolidation = latestQ?.period?.consolidated ? 'CONSOLIDATED' : 'STANDALONE';

    let status: 'SUCCESS' | 'PARTIAL' | 'NO_FINANCIAL_DATA' = 'SUCCESS';
    if (qIncomeCount === 0 && aIncomeCount === 0) {
      status = 'NO_FINANCIAL_DATA';
    } else if (qIncomeCount < 4 || qCashFlowCount === 0) {
      status = 'PARTIAL';
    }

    return {
      symbol,
      companyName: data.companyName,
      sectorCategory: sectorInfo.category,
      sectorDisplayName: rawSector,
      isInstrumentOnly: false,
      status,
      quarterlyIncomeCount: qIncomeCount,
      annualIncomeCount: aIncomeCount,
      quarterlyBalanceCount: qBalanceCount,
      annualBalanceCount: aBalanceCount,
      quarterlyCashFlowCount: qCashFlowCount,
      annualCashFlowCount: aCashFlowCount,
      dividendCount: dividends.length,
      weightedAvgSharesPresent: hasShares,
      epsStatus,
      currency,
      consolidation,
      validationStatus: quality.validationStatus,
      completenessScore: quality.completenessScore,
      ttmVerified: data.ttm?.isVerified || false,
      source: quality.sourceMetadata.source,
      lastVerified: quality.sourceMetadata.verifiedAt
    };
  } catch (err: any) {
    return {
      symbol,
      companyName: `${symbol} Sanayi ve Ticaret A.Ş.`,
      sectorCategory: sectorInfo.category,
      sectorDisplayName: rawSector,
      isInstrumentOnly: false,
      status: 'FAILED',
      quarterlyIncomeCount: 0,
      annualIncomeCount: 0,
      quarterlyBalanceCount: 0,
      annualBalanceCount: 0,
      quarterlyCashFlowCount: 0,
      annualCashFlowCount: 0,
      dividendCount: 0,
      weightedAvgSharesPresent: false,
      epsStatus: 'NULL',
      currency: 'TRY',
      consolidation: 'CONSOLIDATED',
      validationStatus: 'INVALID',
      completenessScore: 0,
      ttmVerified: false,
      source: 'Failed Fetch',
      lastVerified: new Date().toISOString(),
      error: err?.message || String(err)
    };
  }
}

async function runBackfill() {
  const allSymbols = Object.keys(sectorMapping);
  console.log('==============================================================================');
  console.log('FİNAİ AŞAMA 5D — 651 BIST ŞİRKETİ TARİHSEL FİNANSAL VERİ BACKFILL ENGINE');
  console.log(`Toplam Canonical BIST Sembolü: ${allSymbols.length}`);
  console.log(`Başlangıç Zamanı: ${new Date().toISOString()}`);
  console.log('==============================================================================\n');

  const state = loadProgress();
  const alreadyCompleted = Object.keys(state.completedSymbols).length;
  console.log(`Mevcut Checkpoint Durumu: ${alreadyCompleted} / ${allSymbols.length} sembol önceden tamamlanmış.`);

  const pendingSymbols = allSymbols.filter(s => !state.completedSymbols[s]);
  console.log(`Kalan İşlenecek Sembol Sayısı: ${pendingSymbols.length}\n`);

  for (let i = 0; i < pendingSymbols.length; i += BATCH_SIZE) {
    const batch = pendingSymbols.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(pendingSymbols.length / BATCH_SIZE);
    const processedSoFar = Object.keys(state.completedSymbols).length + batch.length;

    console.log(`>>> [Batch ${batchNum}/${totalBatches}] İşleniyor (${batch.length} sembol) | Toplam İlerleme: [${processedSoFar}/${allSymbols.length}]...`);

    // Process batch with controlled concurrency
    for (let j = 0; j < batch.length; j += CONCURRENCY_LIMIT) {
      const chunk = batch.slice(j, j + CONCURRENCY_LIMIT);
      const chunkPromises = chunk.map(async (sym) => {
        const res = await processSymbol(sym);
        state.completedSymbols[sym] = res;
        const qInfo = res.isInstrumentOnly ? 'BYF/Sertifika' : `Q_IS:${res.quarterlyIncomeCount}, Q_BS:${res.quarterlyBalanceCount}, Q_CF:${res.quarterlyCashFlowCount}, DIV:${res.dividendCount}`;
        console.log(`   • ${sym.padEnd(6)} | Status: ${res.status.padEnd(17)} | Val: ${res.validationStatus.padEnd(7)} (%${res.completenessScore}) | ${qInfo}`);
      });

      await Promise.all(chunkPromises);
      await new Promise(res => setTimeout(res, DELAY_BETWEEN_REQUESTS_MS));
    }

    saveProgress(state);
    console.log(`✓ Batch ${batchNum} kaydedildi. Toplam arşivlenen: ${Object.keys(state.completedSymbols).length}\n`);
  }

  console.log('==============================================================================');
  console.log('TÜM 651 SEMBOLÜN BACKFILL VE DOĞRULAMA İŞLEMİ TAMAMLANDI. RAPORLANIYOR...');
  console.log('==============================================================================\n');

  // Aggregation & Reporting Engine
  generateComprehensiveReport(state.completedSymbols, allSymbols);
}

function generateComprehensiveReport(resultsMap: Record<string, SymbolBackfillResult>, allSymbols: string[]) {
  const results = allSymbols.map(s => resultsMap[s]).filter(Boolean);
  const total = results.length;

  const instrumentsOnly = results.filter(r => r.isInstrumentOnly);
  const equities = results.filter(r => !r.isInstrumentOnly);

  const availableFinancials = equities.filter(r => r.quarterlyIncomeCount > 0 || r.annualIncomeCount > 0);
  const unavailableFinancials = equities.filter(r => r.quarterlyIncomeCount === 0 && r.annualIncomeCount === 0);

  const qIncomeCov = results.filter(r => r.quarterlyIncomeCount > 0).length;
  const aIncomeCov = results.filter(r => r.annualIncomeCount > 0).length;
  const qBalanceCov = results.filter(r => r.quarterlyBalanceCount > 0).length;
  const aBalanceCov = results.filter(r => r.annualBalanceCount > 0).length;
  const qCashFlowCov = results.filter(r => r.quarterlyCashFlowCount > 0).length;
  const aCashFlowCov = results.filter(r => r.annualCashFlowCount > 0).length;
  const dividendCov = results.filter(r => r.dividendCount > 0).length;

  const validCount = results.filter(r => r.validationStatus === 'VALID').length;
  const warningCount = results.filter(r => r.validationStatus === 'WARNING').length;
  const invalidCount = results.filter(r => r.validationStatus === 'INVALID').length;
  const conflictCount = results.filter(r => r.validationStatus === 'CONFLICT').length;
  const failedCount = results.filter(r => r.status === 'FAILED').length;

  console.log(`A) CANONICAL UNIVERSE:             ${total}`);
  console.log(`B) AKTİF HİSSE SENETLERİ (EQUITY):  ${equities.length}`);
  console.log(`C) BYF / SERTİFİKA / FON (PRICE):  ${instrumentsOnly.length}`);
  console.log(`D) FİNANSAL TABLO MEVCUT:          ${availableFinancials.length} / ${equities.length} (%${((availableFinancials.length / equities.length) * 100).toFixed(1)})`);
  console.log(`E) FİNANSAL TABLO MEVCUT DEĞİL:    ${unavailableFinancials.length} / ${equities.length} (Safe Null)`);
  console.log(`F) QUARTERLY INCOME COVERAGE:      ${qIncomeCov} / ${total} (%${((qIncomeCov / total) * 100).toFixed(1)})`);
  console.log(`G) ANNUAL INCOME COVERAGE:         ${aIncomeCov} / ${total} (%${((aIncomeCov / total) * 100).toFixed(1)})`);
  console.log(`H) QUARTERLY BALANCE COVERAGE:     ${qBalanceCov} / ${total} (%${((qBalanceCov / total) * 100).toFixed(1)})`);
  console.log(`I) ANNUAL BALANCE COVERAGE:        ${aBalanceCov} / ${total} (%${((aBalanceCov / total) * 100).toFixed(1)})`);
  console.log(`J) QUARTERLY CASH FLOW COVERAGE:   ${qCashFlowCov} / ${total} (%${((qCashFlowCov / total) * 100).toFixed(1)})`);
  console.log(`K) ANNUAL CASH FLOW COVERAGE:      ${aCashFlowCov} / ${total} (%${((aCashFlowCov / total) * 100).toFixed(1)})`);
  console.log(`L) DIVIDEND COVERAGE:              ${dividendCov} / ${total} (%${((dividendCov / total) * 100).toFixed(1)})`);
  console.log(`M) DOĞRULAMA DURUMU:               VALID=${validCount}, WARNING=${warningCount}, INVALID=${invalidCount}, CONFLICT=${conflictCount}, FAILED=${failedCount}`);

  // Sector Breakdown
  console.log('\n==============================================================================');
  console.log('SEKTÖR BAZLI DETAYLI DAĞILIM');
  console.log('==============================================================================');
  const sectorGroups: Record<string, SymbolBackfillResult[]> = {};
  for (const r of results) {
    const cat = r.sectorCategory;
    if (!sectorGroups[cat]) sectorGroups[cat] = [];
    sectorGroups[cat].push(r);
  }

  console.log(`${'Sektör'.padEnd(18)} | ${'Şirket'.padEnd(6)} | ${'Fin. Veri Var'.padEnd(14)} | ${'Q Income'.padEnd(10)} | ${'Q CashFlow'.padEnd(10)} | ${'VALID Oranı'}`);
  console.log('------------------------------------------------------------------------------');
  for (const [cat, list] of Object.entries(sectorGroups)) {
    const count = list.length;
    const withFin = list.filter(r => r.quarterlyIncomeCount > 0).length;
    const withCf = list.filter(r => r.quarterlyCashFlowCount > 0).length;
    const valid = list.filter(r => r.validationStatus === 'VALID').length;
    console.log(`${cat.padEnd(18)} | ${String(count).padEnd(6)} | ${String(withFin).padEnd(14)} | ${String(withFin).padEnd(10)} | ${String(withCf).padEnd(10)} | %${((valid / count) * 100).toFixed(1)}`);
  }

  // 12 Regression Symbols Audit
  console.log('\n==============================================================================');
  console.log('12 REGRESYON TEST SEMBOLÜ DERİN AUDIT');
  console.log('==============================================================================');
  const regSymbols = ['THYAO', 'EREGL', 'ASELS', 'TUPRS', 'GARAN', 'AKBNK', 'KARSN', 'SAHOL', 'KCHOL', 'UFUK', 'EBEBK', 'OBAMS'];
  for (const sym of regSymbols) {
    const r = resultsMap[sym];
    if (r) {
      console.log(`• ${sym.padEnd(6)} | Q_IS:${r.quarterlyIncomeCount}, A_IS:${r.annualIncomeCount}, Q_BS:${r.quarterlyBalanceCount}, Q_CF:${r.quarterlyCashFlowCount}, DIV:${r.dividendCount} | Val:${r.validationStatus} (%${r.completenessScore}) | Cur:${r.currency} | EPS:${r.epsStatus}`);
    }
  }
  console.log('==============================================================================\n');
}

runBackfill();
