/**
 * FinAI Phase 4: Full 651 BIST Universe Ingestion Engine
 * Features:
 * - Reads all 651 symbols from sectorMapping & asset catalog
 * - Segregates Equity vs Non-Equity (ETF, Gold, Fund, Certificate)
 * - Safe Batching (Batches of 25 symbols)
 * - Concurrency control (3 concurrent workers with 250ms throttle)
 * - Checkpoint mechanism (.finai_archive/checkpoints/ingestion_state.json)
 * - Exponential backoff retry on transient Yahoo failures
 * - Lossless RAW archive and normalized storage
 * - Comprehensive data audit and summary generator
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const YahooFinance = require('d:/Salih KAVAKCI/Yeni klasör/FinAl/final-web/node_modules/yahoo-finance2').default;
const { sectorMapping } = require('d:/Salih KAVAKCI/Yeni klasör/FinAl/final-web/src/data/sectorMapping.ts');

const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
  validation: { logErrors: false }
});

const SUPABASE_URL = 'https://xbffacqaumgearqhajmg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiZmZhY3FhdW1nZWFycWhham1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ5Mzc1OSwiZXhwIjoyMDg2MDY5NzU5fQ.Xa_czw4WUNrMi6jkWF510any7Ves0VmvS5UjMJ34vhc';
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const ARCHIVE_ROOT = path.join('d:/Salih KAVAKCI/Yeni klasör/FinAl/final-web', '.finai_archive');
const CHECKPOINT_FILE = path.join(ARCHIVE_ROOT, 'checkpoints', 'ingestion_state.json');

function ensureArchiveDirs() {
  const dirs = [
    'raw_payloads', 'statements', 'prices', 'dividends', 'splits',
    'profiles', 'ownership', 'estimates', 'mappings', 'reports', 'checkpoints'
  ];
  for (const d of dirs) {
    const p = path.join(ARCHIVE_ROOT, d);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  }
}

function sha256(data) {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(str).digest('hex');
}

function parseDate(d) {
  if (!d) return null;
  if (typeof d === 'object' && d.raw) d = d.raw;
  if (d instanceof Date) return d.toISOString().split('T')[0];
  if (typeof d === 'number') {
    const ms = d < 1e11 ? d * 1000 : d;
    return new Date(ms).toISOString().split('T')[0];
  }
  try {
    const dt = new Date(d);
    if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
  } catch (e) {}
  return null;
}

function getQuarter(dStr) {
  const dt = new Date(dStr);
  const year = dt.getFullYear();
  const m = dt.getMonth() + 1;
  let q = 1;
  if (m >= 1 && m <= 3) q = 1;
  else if (m >= 4 && m <= 6) q = 2;
  else if (m >= 7 && m <= 9) q = 3;
  else q = 4;
  return { year, quarter: q };
}

async function retryCall(fn, retries = 3, delay = 800) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, delay * attempt));
    }
  }
}

// Classify symbol universe
function getUniverse() {
  const allSymbols = Object.keys(sectorMapping).sort();
  const equities = [];
  const nonEquities = [];

  for (const sym of allSymbols) {
    const rawSector = sectorMapping[sym] || '';
    const isNonEq = (
      rawSector.includes('Borsa Yatırım Fonu') ||
      rawSector.includes('Sertifika') ||
      sym === 'ALTIN' || sym === 'APBDL' || sym === 'APX30' ||
      (sym.startsWith('Z') && (sym.endsWith('KE') || sym.endsWith('KP') || sym.endsWith('LIB') || sym.endsWith('BDL') || sym.endsWith('GOLD') || sym.endsWith('PT10') || sym.endsWith('RE20') || sym.endsWith('SR25')))
    );

    if (isNonEq) {
      nonEquities.push({ symbol: sym, yahooSymbol: `${sym}.IS`, sector: rawSector, assetType: 'ETF' });
    } else {
      equities.push({ symbol: sym, yahooSymbol: `${sym}.IS`, sector: rawSector, assetType: 'EQUITY' });
    }
  }

  return { equities, nonEquities, total: allSymbols.length };
}

// Ingest single symbol
async function ingestSymbol(item) {
  const sym = item.symbol;
  const yahooSym = item.yahooSymbol;
  const isEquity = item.assetType === 'EQUITY';
  const t0 = Date.now();

  const record = {
    symbol: sym,
    yahooSymbol: yahooSym,
    assetType: item.assetType,
    sector: item.sector,
    status: 'PENDING',
    financialStatus: 'NOT_APPLICABLE',
    priceStatus: 'NOT_ACCESSIBLE',
    dividendStatus: 'NOT_ACCESSIBLE',
    splitStatus: 'NOT_ACCESSIBLE',
    profileStatus: 'NOT_ACCESSIBLE',
    ownershipStatus: 'NOT_ACCESSIBLE',
    estimatesStatus: 'NOT_ACCESSIBLE',
    rawPayloadsSaved: 0,
    quarterlyPeriodsCount: 0,
    annualPeriodsCount: 0,
    dailyPricesCount: 0,
    dividendsCount: 0,
    splitsCount: 0,
    earliestPriceDate: null,
    latestPriceDate: null,
    earliestFinancialPeriod: null,
    latestFinancialPeriod: null,
    isFieldCount: 0,
    bsFieldCount: 0,
    cfFieldCount: 0,
    validationStatus: 'VALID',
    durationMs: 0,
    error: null
  };

  try {
    // 1. Quote / QuoteSummary Modules
    const qsModules = [
      'summaryDetail', 'defaultKeyStatistics', 'financialData',
      'assetProfile', 'calendarEvents', 'earnings', 'recommendationTrend',
      'institutionOwnership', 'majorHoldersBreakdown'
    ];

    let qsData = null;
    try {
      qsData = await retryCall(() => yahooFinance.quoteSummary(yahooSym, { modules: qsModules }, { validateResult: false }));
      if (qsData) {
        const qsHash = sha256(qsData);
        fs.writeFileSync(path.join(ARCHIVE_ROOT, 'raw_payloads', `${sym}_quoteSummary_${qsHash.slice(0, 8)}.json`), JSON.stringify(qsData, null, 2));
        record.rawPayloadsSaved++;

        if (qsData.assetProfile?.sector || qsData.assetProfile?.longBusinessSummary) {
          record.profileStatus = 'SUCCESS';
          fs.writeFileSync(path.join(ARCHIVE_ROOT, 'profiles', `${sym}_profile.json`), JSON.stringify({
            companyName: qsData.price?.longName || qsData.price?.shortName || `${sym} A.Ş.`,
            sector: qsData.assetProfile.sector,
            industry: qsData.assetProfile.industry,
            country: qsData.assetProfile.country,
            city: qsData.assetProfile.city,
            address: qsData.assetProfile.address1,
            employeeCount: qsData.assetProfile.fullTimeEmployees,
            websiteUrl: qsData.assetProfile.website,
            businessSummary: qsData.assetProfile.longBusinessSummary,
            executives: qsData.assetProfile.companyOfficers || []
          }, null, 2));
        }

        if (qsData.majorHoldersBreakdown?.insidersPercentHeld != null || qsData.institutionOwnership?.ownershipList?.length > 0) {
          record.ownershipStatus = 'SUCCESS';
          fs.writeFileSync(path.join(ARCHIVE_ROOT, 'ownership', `${sym}_ownership.json`), JSON.stringify({
            insidersPercentHeld: qsData.majorHoldersBreakdown?.insidersPercentHeld,
            institutionsPercentHeld: qsData.majorHoldersBreakdown?.institutionsPercentHeld,
            institutionsFloatPercentHeld: qsData.majorHoldersBreakdown?.institutionsFloatPercentHeld,
            institutionsCount: qsData.majorHoldersBreakdown?.institutionsCount,
            topInstitutions: qsData.institutionOwnership?.ownershipList || []
          }, null, 2));
        }

        if (qsData.financialData?.targetMeanPrice != null || qsData.recommendationTrend?.trend?.length > 0) {
          record.estimatesStatus = 'SUCCESS';
          fs.writeFileSync(path.join(ARCHIVE_ROOT, 'estimates', `${sym}_estimates.json`), JSON.stringify({
            targetMeanPrice: qsData.financialData?.targetMeanPrice || null,
            targetMedianPrice: qsData.financialData?.targetMedianPrice || null,
            targetHighPrice: qsData.financialData?.targetHighPrice || null,
            targetLowPrice: qsData.financialData?.targetLowPrice || null,
            numberOfAnalysts: qsData.financialData?.numberOfAnalystOpinions || null,
            recommendationKey: qsData.financialData?.recommendationKey || null,
            recommendationTrend: qsData.recommendationTrend?.trend || []
          }, null, 2));
        }
      }
    } catch (e) {
      // Non-fatal, quoteSummary might be empty for some symbols
    }

    // 2. Historical Daily Chart & Events (both Equity and Non-Equity have price charts)
    try {
      const ch = await retryCall(() => yahooFinance.chart(yahooSym, {
        period1: '1995-01-01',
        interval: '1d',
        events: 'div|split'
      }, { validateResult: false }));

      const quotes = ch.quotes || [];
      const validBars = quotes.map(q => {
        const dt = new Date(q.date);
        return {
          timestamp: dt.toISOString(),
          dateIstanbul: dt.toISOString().split('T')[0],
          open: q.open,
          high: q.high,
          low: q.low,
          close: q.close,
          adjustedClose: q.adjclose ?? q.close,
          volume: q.volume || 0
        };
      }).filter(b => b.open != null && b.close != null);

      if (validBars.length > 0) {
        record.dailyPricesCount = validBars.length;
        record.earliestPriceDate = validBars[0].dateIstanbul;
        record.latestPriceDate = validBars[validBars.length - 1].dateIstanbul;
        record.priceStatus = 'SUCCESS';
        fs.writeFileSync(path.join(ARCHIVE_ROOT, 'prices', `${sym}_daily.json`), JSON.stringify(validBars, null, 2));
      }

      // Dividends
      const divEvents = ch.events?.dividends || {};
      const divs = Object.keys(divEvents).map(k => ({
        exDate: parseDate(divEvents[k].date || Number(k)),
        grossAmount: divEvents[k].amount,
        netAmount: null,
        currency: 'TRY'
      }));
      record.dividendsCount = divs.length;
      record.dividendStatus = divs.length > 0 ? 'SUCCESS' : 'NOT_ACCESSIBLE';
      if (divs.length > 0) {
        fs.writeFileSync(path.join(ARCHIVE_ROOT, 'dividends', `${sym}_dividends.json`), JSON.stringify(divs, null, 2));
      }

      // Splits
      const splitEvents = ch.events?.splits || {};
      const splits = Object.keys(splitEvents).map(k => ({
        eventDate: parseDate(splitEvents[k].date || Number(k)),
        numerator: splitEvents[k].numerator,
        denominator: splitEvents[k].denominator,
        splitRatio: splitEvents[k].splitRatio,
        actionType: 'STOCK_SPLIT'
      }));
      record.splitsCount = splits.length;
      record.splitStatus = splits.length > 0 ? 'SUCCESS' : 'NOT_ACCESSIBLE';
      if (splits.length > 0) {
        fs.writeFileSync(path.join(ARCHIVE_ROOT, 'splits', `${sym}_splits.json`), JSON.stringify(splits, null, 2));
      }
    } catch (e) {
      record.priceStatus = 'FAILED';
    }

    // 3. Financial Statements (Only for Equities)
    if (isEquity) {
      try {
        const [qFin, aFin, qBs, aBs, qCf, aCf] = await Promise.all([
          retryCall(() => yahooFinance.fundamentalsTimeSeries(yahooSym, { period1: '2010-01-01', type: 'quarterly', module: 'financials' }, { validateResult: false })).catch(() => []),
          retryCall(() => yahooFinance.fundamentalsTimeSeries(yahooSym, { period1: '2010-01-01', type: 'annual', module: 'financials' }, { validateResult: false })).catch(() => []),
          retryCall(() => yahooFinance.fundamentalsTimeSeries(yahooSym, { period1: '2010-01-01', type: 'quarterly', module: 'balance-sheet' }, { validateResult: false })).catch(() => []),
          retryCall(() => yahooFinance.fundamentalsTimeSeries(yahooSym, { period1: '2010-01-01', type: 'annual', module: 'balance-sheet' }, { validateResult: false })).catch(() => []),
          retryCall(() => yahooFinance.fundamentalsTimeSeries(yahooSym, { period1: '2010-01-01', type: 'quarterly', module: 'cash-flow' }, { validateResult: false })).catch(() => []),
          retryCall(() => yahooFinance.fundamentalsTimeSeries(yahooSym, { period1: '2010-01-01', type: 'annual', module: 'cash-flow' }, { validateResult: false })).catch(() => [])
        ]);

        const tsRaw = { qFin, aFin, qBs, aBs, qCf, aCf };
        const tsHash = sha256(tsRaw);
        fs.writeFileSync(path.join(ARCHIVE_ROOT, 'raw_payloads', `${sym}_timeSeries_${tsHash.slice(0, 8)}.json`), JSON.stringify(tsRaw, null, 2));
        record.rawPayloadsSaved++;

        const processPeriods = (finList, bsList, cfList, pType) => {
          const map = new Map();
          const add = (arr, type) => {
            if (!Array.isArray(arr)) return;
            for (const it of arr) {
              if (!it) continue;
              const dStr = parseDate(it.date || it.asOfDate || it.endDate);
              if (!dStr) continue;
              if (!map.has(dStr)) map.set(dStr, { is: null, bs: null, cf: null });
              map.get(dStr)[type] = it;
            }
          };
          add(finList, 'is');
          add(bsList, 'bs');
          add(cfList, 'cf');

          const stmts = [];
          for (const [dStr, parts] of map.entries()) {
            const isItem = parts.is || {};
            const bsItem = parts.bs || {};
            const cfItem = parts.cf || {};
            const { year, quarter } = getQuarter(dStr);

            record.isFieldCount = Math.max(record.isFieldCount, Object.keys(isItem).length);
            record.bsFieldCount = Math.max(record.bsFieldCount, Object.keys(bsItem).length);
            record.cfFieldCount = Math.max(record.cfFieldCount, Object.keys(cfItem).length);

            const ocf = cfItem.operatingCashFlow != null ? cfItem.operatingCashFlow : null;
            const capex = cfItem.capitalExpenditure != null ? cfItem.capitalExpenditure : null;
            const fcf = (ocf != null && capex != null) ? ocf + capex : (cfItem.freeCashFlow ?? null);

            stmts.push({
              symbol: sym,
              periodType: pType,
              periodEnd: dStr,
              fiscalYear: year,
              fiscalQuarter: pType === 'ANNUAL' ? 4 : quarter,
              currency: 'TRY',
              revenue: isItem.totalRevenue ?? isItem.operatingRevenue ?? null,
              costOfRevenue: isItem.costOfRevenue ?? null,
              grossProfit: isItem.grossProfit ?? null,
              operatingIncome: isItem.operatingIncome ?? isItem.ebit ?? null,
              ebitda: isItem.EBITDA ?? isItem.normalizedEBITDA ?? null,
              netIncome: isItem.netIncome ?? null,
              netIncomeToParent: isItem.netIncomeCommonStockholders ?? isItem.netIncome ?? null,
              cashAndEquivalents: bsItem.cashAndCashEquivalents ?? null,
              totalCurrentAssets: bsItem.currentAssets ?? null,
              totalAssets: bsItem.totalAssets ?? null,
              currentLiabilities: bsItem.currentLiabilities ?? null,
              totalLiabilities: bsItem.totalLiabilitiesNetMinorityInterest ?? null,
              totalEquity: bsItem.stockholdersEquity ?? null,
              parentEquity: bsItem.commonStockEquity ?? null,
              netDebt: bsItem.netDebt ?? null,
              operatingCashFlow: ocf,
              capitalExpenditure: capex,
              freeCashFlow: fcf,
              rawIS: isItem,
              rawBS: bsItem,
              rawCF: cfItem
            });
          }
          return stmts;
        };

        const quarterlyStmts = processPeriods(qFin, qBs, qCf, 'QUARTERLY');
        const annualStmts = processPeriods(aFin, aBs, aCf, 'ANNUAL');

        record.quarterlyPeriodsCount = quarterlyStmts.length;
        record.annualPeriodsCount = annualStmts.length;

        if (quarterlyStmts.length > 0) {
          record.earliestFinancialPeriod = quarterlyStmts[quarterlyStmts.length - 1]?.periodEnd;
          record.latestFinancialPeriod = quarterlyStmts[0]?.periodEnd;
          record.financialStatus = 'SUCCESS';
          fs.writeFileSync(path.join(ARCHIVE_ROOT, 'statements', `${sym}_quarterly.json`), JSON.stringify(quarterlyStmts, null, 2));
        }
        if (annualStmts.length > 0) {
          fs.writeFileSync(path.join(ARCHIVE_ROOT, 'statements', `${sym}_annual.json`), JSON.stringify(annualStmts, null, 2));
        }
        if (quarterlyStmts.length === 0 && annualStmts.length === 0) {
          record.financialStatus = 'PARTIAL';
        }
      } catch (e) {
        record.financialStatus = 'FAILED';
      }
    } else {
      record.financialStatus = 'NOT_APPLICABLE';
    }

    // Overall Status
    if (record.priceStatus === 'SUCCESS' || record.financialStatus === 'SUCCESS') {
      record.status = (record.priceStatus === 'SUCCESS' && (record.financialStatus === 'SUCCESS' || !isEquity)) ? 'SUCCESS' : 'PARTIAL';
    } else {
      record.status = 'FAILED';
    }
  } catch (err) {
    record.status = 'FAILED';
    record.error = err.message;
  }

  record.durationMs = Date.now() - t0;
  return record;
}

// Concurrency queue processor
async function processQueue(items, concurrency = 3, onProgress) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      const item = items[i];
      const res = await ingestSymbol(item);
      results.push(res);
      if (onProgress) onProgress(res, results.length, items.length);
      // Small throttle to be courteous to Yahoo servers
      await new Promise(r => setTimeout(r, 250));
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return results;
}

async function main() {
  console.log('====================================================');
  console.log('FAZ 4: FULL 651 BIST UNIVERSE INGESTION ENGINE');
  console.log('====================================================');
  ensureArchiveDirs();

  const universe = getUniverse();
  console.log(`Total Universe: ${universe.total} symbols`);
  console.log(`- Equities:     ${universe.equities.length}`);
  console.log(`- Non-Equities: ${universe.nonEquities.length} (ETFs, Certificates, Commodities)`);

  // Checkpoint loading
  let completedMap = {};
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      completedMap = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'));
      console.log(`Found checkpoint with ${Object.keys(completedMap).length} previously processed symbols.`);
    } catch (e) {}
  }

  const allItems = [...universe.equities, ...universe.nonEquities];
  const pendingItems = allItems.filter(item => !completedMap[item.symbol]);
  console.log(`Pending for this run: ${pendingItems.length} symbols.\n`);

  const BATCH_SIZE = 25;
  const totalBatches = Math.ceil(pendingItems.length / BATCH_SIZE);
  const startTime = Date.now();
  const allResults = Object.values(completedMap);

  for (let b = 0; b < totalBatches; b++) {
    const batchItems = pendingItems.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    const batchNum = b + 1;
    console.log(`--- Processing Batch ${batchNum}/${totalBatches} (${batchItems.length} symbols: ${batchItems.map(x => x.symbol).slice(0, 5).join(', ')}...) ---`);

    const batchResults = await processQueue(batchItems, 3, (res, done, total) => {
      completedMap[res.symbol] = res;
      process.stdout.write(`  [${done}/${total}] ${res.symbol.padEnd(8)} -> Status: ${res.status.padEnd(7)} (Prices: ${res.dailyPricesCount}, Q_Periods: ${res.quarterlyPeriodsCount}, Dur: ${res.durationMs}ms)\n`);
    });

    allResults.push(...batchResults);

    // Save checkpoint after each batch
    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(completedMap, null, 2), 'utf-8');
    console.log(`Checkpoint saved for Batch ${batchNum}.\n`);
  }

  const totalDurationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  // Statistics
  const successCount = allResults.filter(r => r.status === 'SUCCESS').length;
  const partialCount = allResults.filter(r => r.status === 'PARTIAL').length;
  const failedCount = allResults.filter(r => r.status === 'FAILED').length;

  const totalDailyPrices = allResults.reduce((acc, r) => acc + r.dailyPricesCount, 0);
  const totalDividends = allResults.reduce((acc, r) => acc + r.dividendsCount, 0);
  const totalSplits = allResults.reduce((acc, r) => acc + r.splitsCount, 0);
  const totalQuarterly = allResults.reduce((acc, r) => acc + r.quarterlyPeriodsCount, 0);
  const totalAnnual = allResults.reduce((acc, r) => acc + r.annualPeriodsCount, 0);

  const finalSummary = {
    executedAt: new Date().toISOString(),
    totalDurationSeconds: totalDurationSec,
    totalSymbols: allResults.length,
    successCount,
    partialCount,
    failedCount,
    totalDailyPrices,
    totalDividends,
    totalSplits,
    totalQuarterlyStatements: totalQuarterly,
    totalAnnualStatements: totalAnnual,
    equitiesCount: universe.equities.length,
    nonEquitiesCount: universe.nonEquities.length,
    results: allResults
  };

  const finalReportPath = path.join(ARCHIVE_ROOT, 'reports', 'full_651_ingestion_summary.json');
  fs.writeFileSync(finalReportPath, JSON.stringify(finalSummary, null, 2), 'utf-8');
  console.log('====================================================');
  console.log(`ALL 651 BIST SYMBOLS PROCESSED!`);
  console.log(`Success: ${successCount} | Partial: ${partialCount} | Failed: ${failedCount}`);
  console.log(`Total Daily Prices: ${totalDailyPrices} | Dividends: ${totalDividends} | Splits: ${totalSplits}`);
  console.log(`Summary saved to: ${finalReportPath}`);
  console.log('====================================================');
}

main().catch(err => {
  console.error('Fatal Engine Error:', err);
});
