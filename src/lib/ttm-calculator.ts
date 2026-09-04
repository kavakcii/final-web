/**
 * FinAI TTM Calculator - Stage 5B
 * Trailing Twelve Months (TTM) Calculation Engine & Verification Rules
 * Flow items = Sum of 4 discrete quarters
 * Balance sheet = Latest quarter snapshot (NEVER SUMMED)
 */

import { 
  CalculatedTTM, 
  CashFlowStatement, 
  FinancialPeriodData, 
  IncomeStatement, 
  StatementPeriod 
} from '@/types/financials';

/**
 * Calculates TTM over the 4 most recent discrete quarters
 */
export function calculateTTM(quarters: FinancialPeriodData[]): CalculatedTTM | null {
  if (!quarters || quarters.length < 4) {
    return null; // TTM requires at least 4 discrete quarters
  }

  // Take the 4 most recent discrete quarters
  const ttmQuarters = quarters.slice(0, 4);
  const warnings: string[] = [];
  let isVerified = true;

  // Verification Check 1: Check for duplicate periods
  const periodKeys = new Set(ttmQuarters.map(q => `${q.period.year}-Q${q.period.quarter}`));
  if (periodKeys.size < 4) {
    isVerified = false;
    warnings.push('TTM hesaplamasında mükerrer dönem tespit edilmiştir.');
  }

  // Verification Check 2: Check currency consistency
  const currencies = new Set(ttmQuarters.map(q => q.period.currency).filter(Boolean));
  if (currencies.size > 1) {
    isVerified = false;
    warnings.push(`TTM hesaplanan çeyreklerde para birimi uyumsuzluğu var (${Array.from(currencies).join(', ')}).`);
  }

  // Verification Check 3: Check consolidation consistency
  const consolidations = new Set(ttmQuarters.map(q => q.period.consolidated));
  if (consolidations.size > 1) {
    warnings.push('TTM hesaplanan çeyreklerde konsolide/solo raporlama türü karışımı tespit edildi.');
  }

  // Verification Check 4: Check that the 4 quarters are strictly consecutive (unbroken chronological chain)
  for (let i = 0; i < 3; i++) {
    const curr = ttmQuarters[i].period;
    const prev = ttmQuarters[i + 1].period;
    const isConsecutive = (curr.year === prev.year && curr.quarter === prev.quarter + 1) ||
                          (curr.year === prev.year + 1 && curr.quarter === 1 && prev.quarter === 4);
    if (!isConsecutive) {
      isVerified = false;
      warnings.push(`Dönem sürekliliği kesintili: ${curr.year} Q${curr.quarter} ile ${prev.year} Q${prev.quarter} arasında eksik çeyrek var.`);
    }
  }

  // Helper to sum nullable numbers across the 4 quarters
  const sumNullable = (getter: (q: FinancialPeriodData) => number | null | undefined): number | null => {
    let sum = 0;
    let validCount = 0;
    for (const q of ttmQuarters) {
      const val = getter(q);
      if (val != null) {
        sum += val;
        validCount++;
      }
    }
    return validCount > 0 ? sum : null;
  };

  // 1. Sum Income Statement Flow Items
  const revenue = sumNullable(q => q.incomeStatement.revenue);
  const costOfRevenue = sumNullable(q => q.incomeStatement.costOfRevenue);
  const grossProfit = sumNullable(q => q.incomeStatement.grossProfit);
  const operatingIncome = sumNullable(q => q.incomeStatement.operatingIncome);
  const ebitda = sumNullable(q => q.incomeStatement.ebitda);
  const pretaxIncome = sumNullable(q => q.incomeStatement.pretaxIncome);
  const taxExpense = sumNullable(q => q.incomeStatement.taxExpense);
  const netIncome = sumNullable(q => q.incomeStatement.netIncome);
  const netIncomeToParent = sumNullable(q => q.incomeStatement.netIncomeToParent);
  const netInterestIncome = sumNullable(q => q.incomeStatement.netInterestIncome);

  const grossMargin = (revenue && grossProfit != null && revenue > 0) ? parseFloat(((grossProfit / revenue) * 100).toFixed(2)) : null;
  const operatingMargin = (revenue && operatingIncome != null && revenue > 0) ? parseFloat(((operatingIncome / revenue) * 100).toFixed(2)) : null;
  const ebitdaMargin = (revenue && ebitda != null && revenue > 0) ? parseFloat(((ebitda / revenue) * 100).toFixed(2)) : null;
  const netMargin = (revenue && netIncome != null && revenue > 0) ? parseFloat(((netIncome / revenue) * 100).toFixed(2)) : null;

  const incomeStatementTTM: IncomeStatement = {
    revenue,
    costOfRevenue,
    grossProfit,
    operatingIncome,
    ebitda,
    pretaxIncome,
    taxExpense,
    netIncome,
    netIncomeToParent,
    grossMargin,
    operatingMargin,
    ebitdaMargin,
    netMargin,
    netInterestIncome
  };

  // 2. Sum Cash Flow Flow Items
  const operatingCashFlow = sumNullable(q => q.cashFlowStatement.operatingCashFlow);
  const investingCashFlow = sumNullable(q => q.cashFlowStatement.investingCashFlow);
  const financingCashFlow = sumNullable(q => q.cashFlowStatement.financingCashFlow);
  const capitalExpenditures = sumNullable(q => q.cashFlowStatement.capitalExpenditures);
  let freeCashFlow = sumNullable(q => q.cashFlowStatement.freeCashFlow);
  
  if (freeCashFlow == null && operatingCashFlow != null && capitalExpenditures != null) {
    freeCashFlow = operatingCashFlow - capitalExpenditures;
  }
  const dividendsPaid = sumNullable(q => q.cashFlowStatement.dividendsPaid);
  const netChangeInCash = sumNullable(q => q.cashFlowStatement.netChangeInCash);

  const cashFlowTTM: CashFlowStatement = {
    operatingCashFlow,
    investingCashFlow,
    financingCashFlow,
    capitalExpenditures,
    freeCashFlow,
    dividendsPaid,
    netChangeInCash
  };

  // 3. Balance Sheet: POINT-IN-TIME SNAPSHOT of the most recent quarter (NEVER SUMMED)
  const latestQuarter = ttmQuarters[0];
  const latestBalanceSheetSnapshot = { ...latestQuarter.balanceSheet };

  return {
    isVerified,
    periodsUsed: ttmQuarters.map(q => q.period),
    incomeStatementTTM,
    cashFlowTTM,
    latestBalanceSheetSnapshot,
    warnings
  };
}
