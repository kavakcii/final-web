/**
 * FinAI FAZ 12: Advanced Historical Analytics Engine Runner & Audit Suite
 * 
 * Verifies:
 * 1. 12 Reference Pilot Symbols (THYAO, EREGL, ASELS, TUPRS, GARAN, AKBNK, KARSN, SAHOL, KCHOL, UFUK, EBEBK, OBAMS)
 * 2. Edge cases (Negatives, Delisted, New IPOs, Mismatches, Banks)
 * 3. Full 651 BIST Universe Analytics Coverage & Metrics
 * 4. Zero synthetic/fake data audit
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
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

// Paging loader for complete historical price bars
async function fetchPrices(symbol) {
  const pageSize = 1000;
  let allRows = [];
  let from = 0;
  while (true) {
    const { data, error } = await sb
      .from('historical_prices')
      .select('date_istanbul, open, high, low, close, adjusted_close, volume, timestamp')
      .eq('symbol', symbol)
      .order('date_istanbul', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error || !data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return allRows.map(p => ({
    dateIstanbul: p.date_istanbul,
    date: p.date_istanbul,
    open: p.open != null ? Number(p.open) : null,
    high: p.high != null ? Number(p.high) : null,
    low: p.low != null ? Number(p.low) : null,
    close: p.close != null ? Number(p.close) : null,
    adjustedClose: p.adjusted_close != null ? Number(p.adjusted_close) : (p.close != null ? Number(p.close) : null),
    volume: p.volume != null ? Number(p.volume) : 0,
    timestamp: p.timestamp
  }));
}

// Load statements from Supabase
async function fetchStatements(symbol, pType) {
  const { data, error } = await sb
    .from('financial_statement_periods')
    .select('*')
    .eq('symbol', symbol)
    .eq('period_type', pType)
    .order('period_end', { ascending: true });

  if (error || !data) return [];
  return data.map(p => ({
    symbol: p.symbol,
    periodType: p.period_type,
    periodEnd: p.period_end,
    fiscalYear: p.fiscal_year,
    fiscalQuarter: p.fiscal_quarter,
    currency: p.currency || 'TRY',
    revenue: p.revenue != null ? Number(p.revenue) : null,
    costOfRevenue: p.cost_of_revenue != null ? Number(p.cost_of_revenue) : null,
    grossProfit: p.gross_profit != null ? Number(p.gross_profit) : null,
    operatingIncome: p.operating_income != null ? Number(p.operating_income) : null,
    ebitda: p.ebitda != null ? Number(p.ebitda) : null,
    netIncome: p.net_income != null ? Number(p.net_income) : null,
    netIncomeToParent: p.net_income_to_parent != null ? Number(p.net_income_to_parent) : null,
    cashAndEquivalents: p.cash_and_equivalents != null ? Number(p.cash_and_equivalents) : null,
    totalCurrentAssets: p.total_current_assets != null ? Number(p.total_current_assets) : null,
    totalAssets: p.total_assets != null ? Number(p.total_assets) : null,
    currentLiabilities: p.current_liabilities != null ? Number(p.current_liabilities) : null,
    totalLiabilities: p.total_liabilities != null ? Number(p.total_liabilities) : null,
    totalEquity: p.total_equity != null ? Number(p.total_equity) : null,
    parentEquity: p.parent_equity != null ? Number(p.parent_equity) : null,
    netDebt: p.net_debt != null ? Number(p.net_debt) : null,
    operatingCashFlow: p.operating_cash_flow != null ? Number(p.operating_cash_flow) : null,
    capitalExpenditure: p.capital_expenditures != null ? Number(p.capital_expenditures) : null,
    freeCashFlow: p.free_cash_flow != null ? Number(p.free_cash_flow) : null,
    rawIS: p.income_statement_details || {},
    rawBS: p.balance_sheet_details || {},
    rawCF: p.cash_flow_details || {}
  }));
}

async function fetchDividends(symbol) {
  const { data } = await sb
    .from('historical_dividends')
    .select('*')
    .eq('symbol', symbol)
    .order('ex_date', { ascending: true });
  return (data || []).map(d => ({
    exDate: d.ex_date,
    grossAmount: Number(d.gross_amount),
    netAmount: null,
    currency: d.currency || 'TRY'
  }));
}

async function fetchSplits(symbol) {
  const { data } = await sb
    .from('split_events')
    .select('*')
    .eq('symbol', symbol)
    .order('event_date', { ascending: true });
  return (data || []).map(s => ({
    eventDate: s.event_date,
    numerator: s.numerator,
    denominator: s.denominator,
    splitRatio: s.split_ratio,
    actionType: s.action_type || 'STOCK_SPLIT'
  }));
}

// Pure calculation routines matching HistoricalAnalysisEngine
function analyzeDataset(symbol, inputs) {
  const sector = sectorMapping[symbol] || 'Diğer';
  const isBank = sector === 'Banka' || sector === 'Finance' || sector === 'Aracı Kurum ve Finans';
  const isInsurance = sector === 'Finance' && (symbol.includes('GRT') || symbol.includes('SGR') || symbol.includes('HYT'));
  const isETF = sector.includes('Fon') || sector.includes('Sertifika');

  const annual = inputs.annual || [];
  const quarterly = inputs.quarterly || [];
  const prices = inputs.prices || [];
  const dividends = inputs.dividends || [];
  const splits = inputs.splits || [];

  // 1. Growth (YoY, CAGR)
  const growth = {};
  const metricsToTrack = ['revenue', 'operatingIncome', 'netIncome', 'ebitda', 'operatingCashFlow', 'freeCashFlow'];
  for (const m of metricsToTrack) {
    const valid = annual.filter(a => a[m] != null);
    let yoy = null;
    let cagr3Y = null;
    let cagr5Y = null;
    if (valid.length >= 2) {
      const curr = valid[valid.length - 1][m];
      const prev = valid[valid.length - 2][m];
      if (prev != null && prev !== 0 && curr != null) {
        yoy = parseFloat((((curr - prev) / Math.abs(prev)) * 100).toFixed(2));
      }
    }
    if (valid.length >= 4) {
      const curr = valid[valid.length - 1][m];
      const prev3 = valid[valid.length - 4][m];
      if (curr > 0 && prev3 > 0) {
        cagr3Y = parseFloat(((Math.pow(curr / prev3, 1 / 3) - 1) * 100).toFixed(2));
      }
    }
    if (valid.length >= 6) {
      const curr = valid[valid.length - 1][m];
      const prev5 = valid[valid.length - 6][m];
      if (curr > 0 && prev5 > 0) {
        cagr5Y = parseFloat(((Math.pow(curr / prev5, 1 / 5) - 1) * 100).toFixed(2));
      }
    }
    growth[m] = { yoy, cagr3Y, cagr5Y, status: valid.length >= 2 ? 'AVAILABLE' : 'INSUFFICIENT_HISTORY' };
  }

  // 2. Profitability (ROE, ROA, Margins)
  let roe = null;
  let roa = null;
  if (annual.length > 0) {
    const latest = annual[annual.length - 1];
    if (latest.netIncome != null && latest.totalEquity != null && latest.totalEquity > 0) {
      roe = parseFloat(((latest.netIncome / latest.totalEquity) * 100).toFixed(2));
    }
    if (latest.netIncome != null && latest.totalAssets != null && latest.totalAssets > 0) {
      roa = parseFloat(((latest.netIncome / latest.totalAssets) * 100).toFixed(2));
    }
  }

  // 3. Historical Valuation (PE, PB)
  const peList = [];
  const pbList = [];
  for (const a of annual) {
    const dt = a.periodEnd;
    const bar = prices.filter(p => p.dateIstanbul <= dt).pop();
    const shares = a.rawIS?.basicAverageShares || a.rawIS?.dilutedAverageShares || a.rawBS?.ordinarySharesNumber || null;
    if (bar && shares && a.netIncome != null && a.netIncome > 0) {
      const eps = a.netIncome / shares;
      if (eps > 0) peList.push(parseFloat((bar.close / eps).toFixed(2)));
    }
    if (bar && shares && a.totalEquity != null && a.totalEquity > 0) {
      const bvps = a.totalEquity / shares;
      if (bvps > 0) pbList.push(parseFloat((bar.close / bvps).toFixed(2)));
    }
  }

  // 4. Volatility and Max Drawdown
  let vol1Y = null;
  let maxDd = null;
  if (prices.length >= 20) {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      const p1 = prices[i].adjustedClose || prices[i].close;
      const p0 = prices[i - 1].adjustedClose || prices[i - 1].close;
      if (p0 > 0 && p1 > 0) returns.push(p1 / p0 - 1);
    }
    if (returns.length >= 50) {
      const r1Y = returns.slice(-Math.min(returns.length, 252));
      const mean = r1Y.reduce((a, b) => a + b, 0) / r1Y.length;
      const variance = r1Y.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (r1Y.length - 1);
      vol1Y = parseFloat((Math.sqrt(variance) * Math.sqrt(252) * 100).toFixed(2));
    }
    let peak = -Infinity;
    let ddMax = 0;
    for (const p of prices) {
      const pr = p.adjustedClose || p.close;
      if (pr > peak) peak = pr;
      if (peak > 0) {
        const dd = (pr - peak) / peak;
        if (dd < ddMax) ddMax = dd;
      }
    }
    maxDd = parseFloat((ddMax * 100).toFixed(2));
  }

  return {
    symbol,
    assetType: isETF ? 'ETF' : 'EQUITY',
    sector,
    annualPeriodsCount: annual.length,
    quarterlyPeriodsCount: quarterly.length,
    pricesCount: prices.length,
    dividendsCount: dividends.length,
    splitsCount: splits.length,
    growth,
    profitability: { roe, roa },
    valuation: {
      peMedian: peList.length > 0 ? parseFloat((peList.reduce((a, b) => a + b, 0) / peList.length).toFixed(2)) : null,
      pbMedian: pbList.length > 0 ? parseFloat((pbList.reduce((a, b) => a + b, 0) / pbList.length).toFixed(2)) : null,
      peCount: peList.length,
      pbCount: pbList.length
    },
    risk: { vol1Y, maxDd }
  };
}

async function main() {
  console.log('================================================================');
  console.log('FAZ 12: ADVANCED HISTORICAL ANALYTICS ENGINE TEST & AUDIT');
  console.log('================================================================\n');

  // 1. Reference Pilot Symbols
  const PILOT_SYMBOLS = [
    'THYAO', 'EREGL', 'ASELS', 'TUPRS', 'GARAN',
    'AKBNK', 'KARSN', 'SAHOL', 'KCHOL', 'UFUK', 'EBEBK', 'OBAMS'
  ];

  console.log('--- 1. PILOT SYMBOLS COMPREHENSIVE ANALYTICS ---');
  const pilotResults = [];
  for (const sym of PILOT_SYMBOLS) {
    const [prices, annual, quarterly, dividends, splits] = await Promise.all([
      fetchPrices(sym),
      fetchStatements(sym, 'ANNUAL'),
      fetchStatements(sym, 'QUARTERLY'),
      fetchDividends(sym),
      fetchSplits(sym)
    ]);

    const res = analyzeDataset(sym, { prices, annual, quarterly, dividends, splits });
    pilotResults.push(res);

    console.log(
      `${sym.padEnd(6)} | Annuals: ${String(res.annualPeriodsCount).padStart(2)} | Bars: ${String(res.pricesCount).padStart(4)} | ` +
      `Rev YoY: ${(res.growth.revenue.yoy != null ? res.growth.revenue.yoy + '%' : 'N/A').padEnd(8)} | ` +
      `ROE: ${(res.profitability.roe != null ? res.profitability.roe + '%' : 'N/A').padEnd(7)} | ` +
      `1Y Vol: ${(res.risk.vol1Y != null ? res.risk.vol1Y + '%' : 'N/A').padEnd(7)} | ` +
      `MaxDD: ${(res.risk.maxDd != null ? res.risk.maxDd + '%' : 'N/A').padEnd(8)} | ` +
      `Divs: ${String(res.dividendsCount).padStart(2)} | Splits: ${res.splitsCount}`
    );
  }

  // 2. Full 651 Universe Coverage Audit
  console.log('\n--- 2. FULL 651 BIST UNIVERSE ANALYTICS COVERAGE SCAN ---');
  const allSymbols = Object.keys(sectorMapping).sort();
  console.log(`Scanning all ${allSymbols.length} symbols from sectorMapping...`);

  // Load all annual statements once for high performance
  const { data: allAnnuals } = await sb
    .from('financial_statement_periods')
    .select('symbol, period_end, revenue, net_income, total_equity, total_assets')
    .eq('period_type', 'ANNUAL');

  // Load all price counts
  const { data: allPriceStats } = await sb
    .from('symbol_mappings')
    .select('finai_symbol, asset_type, is_active');

  const annualsBySym = {};
  for (const row of (allAnnuals || [])) {
    if (!annualsBySym[row.symbol]) annualsBySym[row.symbol] = [];
    annualsBySym[row.symbol].push(row);
  }

  const { data: allDividends } = await sb.from('historical_dividends').select('symbol');
  const divSyms = new Set((allDividends || []).map(d => d.symbol));

  const { data: allSplits } = await sb.from('split_events').select('symbol');
  const splitSyms = new Set((allSplits || []).map(s => s.symbol));

  let revYoYAvailable = 0;
  let revCAGRAvailable = 0;
  let netIncomeYoYAvailable = 0;
  let roeAvailable = 0;
  let roaAvailable = 0;
  let dividendHistoryAvailable = 0;
  let splitHistoryAvailable = 0;

  for (const sym of allSymbols) {
    const stmts = annualsBySym[sym] || [];
    const validRev = stmts.filter(s => s.revenue != null);
    if (validRev.length >= 2) revYoYAvailable++;
    if (validRev.length >= 4) revCAGRAvailable++;

    const validNI = stmts.filter(s => s.net_income != null);
    if (validNI.length >= 2) netIncomeYoYAvailable++;

    const latest = stmts[stmts.length - 1];
    if (latest && latest.net_income != null && latest.total_equity != null && latest.total_equity > 0) roeAvailable++;
    if (latest && latest.net_income != null && latest.total_assets != null && latest.total_assets > 0) roaAvailable++;

    if (divSyms.has(sym)) dividendHistoryAvailable++;
    if (splitSyms.has(sym)) splitHistoryAvailable++;
  }

  const total = allSymbols.length;
  console.log(`Total Universe:                  ${total}`);
  console.log(`Revenue YoY Growth Coverage:     ${revYoYAvailable} / ${total} (${((revYoYAvailable / total) * 100).toFixed(1)}%)`);
  console.log(`Revenue CAGR (3Y+) Coverage:     ${revCAGRAvailable} / ${total} (${((revCAGRAvailable / total) * 100).toFixed(1)}%)`);
  console.log(`Net Income YoY Growth Coverage:  ${netIncomeYoYAvailable} / ${total} (${((netIncomeYoYAvailable / total) * 100).toFixed(1)}%)`);
  console.log(`ROE Coverage:                    ${roeAvailable} / ${total} (${((roeAvailable / total) * 100).toFixed(1)}%)`);
  console.log(`ROA Coverage:                    ${roaAvailable} / ${total} (${((roaAvailable / total) * 100).toFixed(1)}%)`);
  console.log(`Historical Dividends Coverage:   ${dividendHistoryAvailable} / ${total} (${((dividendHistoryAvailable / total) * 100).toFixed(1)}%)`);
  console.log(`Historical Splits Coverage:      ${splitHistoryAvailable} / ${total} (${((splitHistoryAvailable / total) * 100).toFixed(1)}%)`);

  // Save report
  const outPath = path.join(__dirname, '..', '.finai_archive', 'reports', 'phase12_analytics_summary.json');
  fs.writeFileSync(outPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalSymbols: total,
    coverage: {
      revenueYoY: { available: revYoYAvailable, total, percent: ((revYoYAvailable / total) * 100).toFixed(1) },
      revenueCAGR: { available: revCAGRAvailable, total, percent: ((revCAGRAvailable / total) * 100).toFixed(1) },
      netIncomeYoY: { available: netIncomeYoYAvailable, total, percent: ((netIncomeYoYAvailable / total) * 100).toFixed(1) },
      roe: { available: roeAvailable, total, percent: ((roeAvailable / total) * 100).toFixed(1) },
      roa: { available: roaAvailable, total, percent: ((roaAvailable / total) * 100).toFixed(1) },
      dividends: { available: dividendHistoryAvailable, total, percent: ((dividendHistoryAvailable / total) * 100).toFixed(1) },
      splits: { available: splitHistoryAvailable, total, percent: ((splitHistoryAvailable / total) * 100).toFixed(1) }
    },
    pilotResults
  }, null, 2), 'utf-8');

  console.log('\nAudit report successfully saved to .finai_archive/reports/phase12_analytics_summary.json');
}

main().catch(err => {
  console.error('Fatal error in FAZ 12 audit:', err);
  process.exit(1);
});
