/**
 * FinAI FAZ 11: Production Data Refresh Engine CLI Runner
 * 
 * Usage:
 *   node scripts/run-production-refresh.js --pilot          # Run 12 pilot reference symbols
 *   node scripts/run-production-refresh.js --limit=50        # Run first 50 symbols
 *   node scripts/run-production-refresh.js --full            # Run entire 651 BIST universe
 *   node scripts/run-production-refresh.js --dry-run         # Simulate without DB writes
 *   node scripts/run-production-refresh.js --force           # Ignore checkpoint and refresh all
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const YahooFinance = require('yahoo-finance2').default;
const { sectorMapping } = require('../src/data/sectorMapping.ts');

// Load env from .env.local if not set
if (!process.env.SUPABASE_SERVICE_ROLE_KEY && fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xbffacqaumgearqhajmg.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
const yf = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
  validation: { logErrors: false }
});

const ARCHIVE_ROOT = path.join(__dirname, '..', '.finai_archive');
const CHECKPOINT_FILE = path.join(ARCHIVE_ROOT, 'checkpoints', 'refresh_state.json');

// Parse CLI flags
const args = process.argv.slice(2);
const isPilot = args.includes('--pilot');
const isFull = args.includes('--full');
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');
const limitArg = args.find(a => a.startsWith('--limit='));
const customLimit = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;

const PILOT_SYMBOLS = [
  'THYAO', 'EREGL', 'ASELS', 'TUPRS', 'GARAN',
  'KARSN', 'AKBNK', 'SAHOL', 'KCHOL', 'UFUK', 'EBEBK', 'OBAMS'
];

function getUniverse() {
  const allSymbols = Object.keys(sectorMapping).sort();
  const items = [];

  for (const sym of allSymbols) {
    const rawSector = sectorMapping[sym] || '';
    const isNonEq = (
      rawSector.includes('Borsa Yatırım Fonu') ||
      rawSector.includes('Sertifika') ||
      sym === 'ALTIN' || sym === 'APBDL' || sym === 'APX30' ||
      (sym.startsWith('Z') && (sym.endsWith('KE') || sym.endsWith('KP') || sym.endsWith('LIB') || sym.endsWith('BDL') || sym.endsWith('GOLD') || sym.endsWith('PT10') || sym.endsWith('RE20') || sym.endsWith('SR25')))
    );

    items.push({
      symbol: sym,
      yahooSymbol: `${sym}.IS`,
      assetType: isNonEq ? 'ETF' : 'EQUITY',
      sector: rawSector
    });
  }
  return items;
}

async function retryCall(fn, retries = 3, delay = 700) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, delay * attempt));
    }
  }
}

async function getLatestPriceDate(symbol) {
  try {
    const { data, error } = await sb
      .from('historical_prices')
      .select('date_istanbul')
      .eq('symbol', symbol)
      .order('date_istanbul', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return null;
    return data[0].date_istanbul;
  } catch (e) {
    return null;
  }
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

async function refreshSymbol(item) {
  const { symbol, yahooSymbol, assetType } = item;
  const isEquity = assetType === 'EQUITY';
  const t0 = Date.now();

  const report = {
    symbol,
    assetType,
    status: 'SUCCESS',
    pricesFetched: 0,
    pricesInserted: 0,
    latestDateBefore: null,
    latestDateAfter: null,
    dividendsFound: 0,
    splitsFound: 0,
    statementsFound: 0,
    durationMs: 0,
    error: null
  };

  try {
    // 1. Incremental Chart & Prices
    const latestDate = await getLatestPriceDate(symbol);
    report.latestDateBefore = latestDate;

    let period1 = '1995-01-01';
    if (latestDate && !isForce) {
      const dt = new Date(latestDate);
      dt.setDate(dt.getDate() - 7); // 7-day lookback window for adjustments
      period1 = dt.toISOString().split('T')[0];
    }

    try {
      const ch = await retryCall(() => yf.chart(yahooSymbol, {
        period1,
        interval: '1d',
        events: 'div|split'
      }, { validateResult: false }));

      const quotes = ch?.quotes || [];
      const validBars = quotes.map(q => {
        const dt = new Date(q.date);
        return {
          symbol,
          interval: '1d',
          timestamp: dt.toISOString(),
          date_istanbul: dt.toISOString().split('T')[0],
          open: q.open,
          high: q.high,
          low: q.low,
          close: q.close,
          adjusted_close: q.adjclose ?? q.close,
          volume: q.volume || 0,
          source: 'YAHOO_CHART'
        };
      }).filter(b => b.open != null && b.close != null);

      report.pricesFetched = validBars.length;
      if (validBars.length > 0) {
        report.latestDateAfter = validBars[validBars.length - 1].date_istanbul;
      }

      if (validBars.length > 0 && !isDryRun) {
        for (let i = 0; i < validBars.length; i += 500) {
          const chunk = validBars.slice(i, i + 500);
          const { error: upErr } = await sb
            .from('historical_prices')
            .upsert(chunk, { onConflict: 'symbol,interval,timestamp' });
          if (!upErr) report.pricesInserted += chunk.length;
        }
      }

      // Dividends
      const divEvents = ch?.events?.dividends || {};
      const divs = Object.keys(divEvents).map(k => ({
        symbol,
        ex_date: parseDate(divEvents[k].date || Number(k)),
        gross_amount: divEvents[k].amount,
        net_amount: null,
        currency: 'TRY',
        source: 'YAHOO_CHART_DIV',
        validation_status: 'VALID',
        is_current: true,
        version: 1
      })).filter(d => d.ex_date != null && d.gross_amount != null);

      report.dividendsFound = divs.length;
      if (divs.length > 0 && !isDryRun) {
        await sb.from('historical_dividends').upsert(divs, { onConflict: 'symbol,ex_date,source,version' });
      }

      // Splits
      const splitEvents = ch?.events?.splits || {};
      const splits = Object.keys(splitEvents).map(k => ({
        symbol,
        event_date: parseDate(splitEvents[k].date || Number(k)),
        numerator: splitEvents[k].numerator,
        denominator: splitEvents[k].denominator,
        split_ratio: splitEvents[k].splitRatio,
        action_type: 'STOCK_SPLIT',
        source: 'YAHOO_CHART_SPLIT'
      })).filter(s => s.event_date != null && s.numerator != null);

      report.splitsFound = splits.length;
      if (splits.length > 0 && !isDryRun) {
        await sb.from('split_events').upsert(splits, { onConflict: 'symbol,event_date,numerator,denominator' });
      }

    } catch (e) {
      report.status = 'PARTIAL';
    }

    // 2. Financial Statements (Equities only)
    if (isEquity) {
      try {
        const [qFin, aFin, qBs, aBs, qCf, aCf] = await Promise.all([
          retryCall(() => yf.fundamentalsTimeSeries(yahooSymbol, { period1: '2020-01-01', type: 'quarterly', module: 'financials' }, { validateResult: false })).catch(() => []),
          retryCall(() => yf.fundamentalsTimeSeries(yahooSymbol, { period1: '2020-01-01', type: 'annual', module: 'financials' }, { validateResult: false })).catch(() => []),
          retryCall(() => yf.fundamentalsTimeSeries(yahooSymbol, { period1: '2020-01-01', type: 'quarterly', module: 'balance-sheet' }, { validateResult: false })).catch(() => []),
          retryCall(() => yf.fundamentalsTimeSeries(yahooSymbol, { period1: '2020-01-01', type: 'annual', module: 'balance-sheet' }, { validateResult: false })).catch(() => []),
          retryCall(() => yf.fundamentalsTimeSeries(yahooSymbol, { period1: '2020-01-01', type: 'quarterly', module: 'cash-flow' }, { validateResult: false })).catch(() => []),
          retryCall(() => yf.fundamentalsTimeSeries(yahooSymbol, { period1: '2020-01-01', type: 'annual', module: 'cash-flow' }, { validateResult: false })).catch(() => [])
        ]);

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

            const ocf = cfItem.operatingCashFlow != null ? cfItem.operatingCashFlow : null;
            const capex = cfItem.capitalExpenditure != null ? cfItem.capitalExpenditure : null;
            const fcf = (ocf != null && capex != null) ? ocf + capex : (cfItem.freeCashFlow ?? null);

            stmts.push({
              symbol,
              period_type: pType,
              period_start: null,
              period_end: dStr,
              fiscal_year: year,
              fiscal_quarter: pType === 'ANNUAL' ? 4 : quarter,
              report_date: dStr,
              statement_type: 'CONSOLIDATED',
              currency: 'TRY',
              reported_currency: 'TRY',
              source: 'YAHOO_FINANCE_TIMESERIES',
              validation_status: 'VALID',
              version: 1,
              is_current: true,

              revenue: isItem.totalRevenue ?? isItem.operatingRevenue ?? null,
              cost_of_revenue: isItem.costOfRevenue ?? null,
              gross_profit: isItem.grossProfit ?? null,
              operating_income: isItem.operatingIncome ?? isItem.ebit ?? null,
              ebitda: isItem.EBITDA ?? isItem.normalizedEBITDA ?? null,
              net_income: isItem.netIncome ?? null,
              net_income_to_parent: isItem.netIncomeCommonStockholders ?? isItem.netIncome ?? null,

              cash_and_equivalents: bsItem.cashAndCashEquivalents ?? null,
              total_current_assets: bsItem.currentAssets ?? null,
              total_assets: bsItem.totalAssets ?? null,
              current_liabilities: bsItem.currentLiabilities ?? null,
              total_liabilities: bsItem.totalLiabilitiesNetMinorityInterest ?? null,
              total_equity: bsItem.stockholdersEquity ?? null,
              parent_equity: bsItem.commonStockEquity ?? null,
              net_debt: bsItem.netDebt ?? null,

              operating_cash_flow: ocf,
              capital_expenditures: capex,
              free_cash_flow: fcf,

              income_statement_details: isItem,
              balance_sheet_details: bsItem,
              cash_flow_details: cfItem
            });
          }
          return stmts;
        };

        const qStmts = processPeriods(qFin, qBs, qCf, 'QUARTERLY');
        const aStmts = processPeriods(aFin, aBs, aCf, 'ANNUAL');
        const allStmts = [...qStmts, ...aStmts];
        report.statementsFound = allStmts.length;

        if (allStmts.length > 0 && !isDryRun) {
          await sb.from('financial_statement_periods').upsert(allStmts, {
            onConflict: 'symbol,period_type,period_end,statement_type,version'
          });
        }
      } catch (e) {}
    }

  } catch (err) {
    report.status = 'FAILED';
    report.error = err.message;
  }

  report.durationMs = Date.now() - t0;
  return report;
}

async function runQueue(items, concurrency = 3) {
  let checkpoint = {};
  if (fs.existsSync(CHECKPOINT_FILE) && !isForce) {
    try {
      checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'));
    } catch (e) {}
  }

  const pendingItems = items.filter(it => !checkpoint[it.symbol]);
  const results = Object.values(checkpoint);
  let index = 0;

  console.log(`Resuming: ${Object.keys(checkpoint).length} already completed, ${pendingItems.length} pending.`);

  async function worker() {
    while (index < pendingItems.length) {
      const i = index++;
      const it = pendingItems[i];
      const res = await refreshSymbol(it);
      results.push(res);
      checkpoint[it.symbol] = res;

      try {
        fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2), 'utf-8');
      } catch (e) {}

      console.log(`[${results.length}/${items.length}] ${res.symbol.padEnd(6)} | Status: ${res.status.padEnd(7)} | Prices: ${res.pricesFetched} (new: ${res.pricesInserted}) | Latest: ${res.latestDateAfter || res.latestDateBefore} | ${res.durationMs}ms`);
      await new Promise(r => setTimeout(r, 150));
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return results;
}

async function main() {
  console.log('===============================================================');
  console.log('FAZ 11 — PRODUCTION DATA REFRESH ENGINE (INCREMENTAL)');
  console.log('===============================================================');
  console.log(`Mode:      ${isDryRun ? 'DRY-RUN (No DB write)' : 'LIVE SYNC (Supabase PostgreSQL)'}`);
  console.log(`ForceAll:  ${isForce ? 'YES (Full historical reload)' : 'NO (Incremental lookback)'}`);

  const universe = getUniverse();
  let targetItems = [];

  if (isPilot) {
    console.log(`Target:    PILOT (12 Reference Symbols)`);
    targetItems = universe.filter(u => PILOT_SYMBOLS.includes(u.symbol));
  } else if (customLimit) {
    console.log(`Target:    CUSTOM LIMIT (${customLimit} symbols)`);
    targetItems = universe.slice(0, customLimit);
  } else if (isFull) {
    console.log(`Target:    FULL 651 BIST UNIVERSE`);
    targetItems = universe;
  } else {
    console.log(`Target:    DEFAULT PILOT (Use --full for all 651 symbols)`);
    targetItems = universe.filter(u => PILOT_SYMBOLS.includes(u.symbol));
  }

  console.log(`Total Symbols Selected: ${targetItems.length}\n`);

  const tStart = Date.now();
  const results = await runQueue(targetItems, 3);
  const totalDuration = ((Date.now() - tStart) / 1000).toFixed(1);

  const successCount = results.filter(r => r.status === 'SUCCESS').length;
  const partialCount = results.filter(r => r.status === 'PARTIAL').length;
  const failedCount = results.filter(r => r.status === 'FAILED').length;
  const totalPricesFetched = results.reduce((a, b) => a + b.pricesFetched, 0);
  const totalPricesInserted = results.reduce((a, b) => a + b.pricesInserted, 0);

  console.log('\n===============================================================');
  console.log('FAZ 11 REFRESH SUMMARY');
  console.log('===============================================================');
  console.log(`Total Processed:    ${results.length}`);
  console.log(`- Success:          ${successCount}`);
  console.log(`- Partial:          ${partialCount}`);
  console.log(`- Failed:           ${failedCount}`);
  console.log(`Total Bars Fetched: ${totalPricesFetched}`);
  console.log(`Total Bars Upserted:${totalPricesInserted}`);
  console.log(`Elapsed Time:       ${totalDuration}s`);
  console.log('===============================================================\n');

  // Save execution report
  const reportPath = path.join(ARCHIVE_ROOT, 'reports', 'phase11_refresh_summary.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    dryRun: isDryRun,
    targetCount: targetItems.length,
    successCount,
    partialCount,
    failedCount,
    totalPricesFetched,
    totalPricesInserted,
    durationSeconds: totalDuration,
    results
  }, null, 2), 'utf-8');
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
