import { FinancialPeriod, IncomeStatement, BalanceSheet, CashFlowStatement, PerShareMetrics } from "@/types/financials";

export function computeTtmPeriod(periods: FinancialPeriod[]): FinancialPeriod | null {
  if (!periods || periods.length === 0) return null;

  // Filter quarterly periods sorted chronologically by periodEnd date
  const quarterlyPeriods = periods
    .filter(p => p.periodType === "quarter" && p.periodEnd)
    .sort((a, b) => (a.periodEnd! > b.periodEnd! ? 1 : -1));

  if (quarterlyPeriods.length < 4) {
    return null; // Strict rule: requires 4 consecutive quarters
  }

  // Take latest 4 quarters
  const last4Quarters = quarterlyPeriods.slice(-4);
  const latestQ = last4Quarters[3];

  // Helper for summing flow metrics across 4 quarters
  const sumFlow = (getter: (p: FinancialPeriod) => number | null): number | null => {
    let sum = 0;
    let count = 0;
    for (const q of last4Quarters) {
      const val = getter(q);
      if (val !== null && val !== undefined && !isNaN(val)) {
        sum += val;
        count++;
      }
    }
    return count === 4 ? parseFloat(sum.toFixed(3)) : null;
  };

  const incomeStatement: IncomeStatement = {
    revenue: sumFlow(q => q.incomeStatement.revenue),
    costOfRevenue: sumFlow(q => q.incomeStatement.costOfRevenue),
    grossProfit: sumFlow(q => q.incomeStatement.grossProfit),
    operatingIncome: sumFlow(q => q.incomeStatement.operatingIncome),
    ebitda: sumFlow(q => q.incomeStatement.ebitda),
    financeIncomeExpense: sumFlow(q => q.incomeStatement.financeIncomeExpense),
    pretaxIncome: sumFlow(q => q.incomeStatement.pretaxIncome),
    taxExpense: sumFlow(q => q.incomeStatement.taxExpense),
    netIncome: sumFlow(q => q.incomeStatement.netIncome),
    netIncomeParent: sumFlow(q => q.incomeStatement.netIncomeParent),
    grossMargin: null,
    operatingMargin: null,
    ebitdaMargin: null,
    netMargin: null
  };

  // Calculate TTM margins
  if (incomeStatement.revenue && incomeStatement.revenue > 0) {
    if (incomeStatement.grossProfit !== null) {
      incomeStatement.grossMargin = parseFloat(((incomeStatement.grossProfit / incomeStatement.revenue) * 100).toFixed(2));
    }
    if (incomeStatement.operatingIncome !== null) {
      incomeStatement.operatingMargin = parseFloat(((incomeStatement.operatingIncome / incomeStatement.revenue) * 100).toFixed(2));
    }
    if (incomeStatement.ebitda !== null) {
      incomeStatement.ebitdaMargin = parseFloat(((incomeStatement.ebitda / incomeStatement.revenue) * 100).toFixed(2));
    }
    if (incomeStatement.netIncome !== null) {
      incomeStatement.netMargin = parseFloat(((incomeStatement.netIncome / incomeStatement.revenue) * 100).toFixed(2));
    }
  }

  // Balance sheet uses the latest quarter's values (point-in-time snapshot)
  const balanceSheet: BalanceSheet = { ...latestQ.balanceSheet };

  // Cash flow sums across 4 quarters
  const cashFlow: CashFlowStatement = {
    operatingCashFlow: sumFlow(q => q.cashFlow.operatingCashFlow),
    investingCashFlow: sumFlow(q => q.cashFlow.investingCashFlow),
    financingCashFlow: sumFlow(q => q.cashFlow.financingCashFlow),
    capex: sumFlow(q => q.cashFlow.capex),
    freeCashFlow: sumFlow(q => q.cashFlow.freeCashFlow),
    netChangeInCash: sumFlow(q => q.cashFlow.netChangeInCash)
  };

  // Per share metrics use latest snapshot
  const perShare: PerShareMetrics = { ...latestQ.perShare };

  return {
    periodType: "ttm",
    period: "TTM (Son 12 Ay)",
    periodStart: last4Quarters[0].periodStart,
    periodEnd: latestQ.periodEnd,
    announcementDate: latestQ.announcementDate,
    consolidated: latestQ.consolidated,
    reportingCurrency: latestQ.reportingCurrency || "TRY",
    incomeStatement,
    balanceSheet,
    cashFlow,
    perShare
  };
}
