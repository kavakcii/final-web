/**
 * FinAI TTM Calculator - Stage 2.1
 * Trailing Twelve Months (TTM) Calculation Engine & Verification Rules
 */

import { 
  CalculatedTTM, 
  CashFlowStatement, 
  FinancialPeriodData, 
  IncomeStatement, 
  StatementPeriod 
} from '@/types/financials';

/**
 * Derives discrete quarterly financial periods from YTD (Cumulative) reports
 * Example:
 * Q1 = 3M YTD
 * Q2 = 6M YTD - Q1
 * Q3 = 9M YTD - 6M YTD
 * Q4 = 12M Annual - 9M YTD
 */
export function deriveDiscreteQuarters(periods: FinancialPeriodData[]): FinancialPeriodData[] {
  if (!periods || periods.length === 0) return [];

  // Sort periods chronologically (newest first)
  const sorted = [...periods].sort((a, b) => {
    if (a.period.year !== b.period.year) return b.period.year - a.period.year;
    return b.period.quarter - a.period.quarter;
  });

  const discreteQuarters: FinancialPeriodData[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];

    // Q1 is already discrete
    if (current.period.quarter === 1 || current.period.isDiscreteQuarter) {
      discreteQuarters.push({ ...current, period: { ...current.period, isDiscreteQuarter: true } });
      continue;
    }

    // For Q2 (6M YTD), find Q1 of the same year
    if (current.period.quarter === 2) {
      const q1 = sorted.find(p => p.period.year === current.period.year && p.period.quarter === 1);
      if (q1 && q1.period.consolidated === current.period.consolidated && q1.period.currency === current.period.currency) {
        discreteQuarters.push(subtractPeriods(current, q1, 2));
      } else {
        // Cannot verify discrete Q2, keep current snapshot
        discreteQuarters.push({ ...current, period: { ...current.period, isDiscreteQuarter: false } });
      }
    }
    // For Q3 (9M YTD), find H1 (6M YTD) of the same year
    else if (current.period.quarter === 3) {
      const h1 = sorted.find(p => p.period.year === current.period.year && p.period.quarter === 2);
      if (h1 && h1.period.consolidated === current.period.consolidated && h1.period.currency === current.period.currency) {
        discreteQuarters.push(subtractPeriods(current, h1, 3));
      } else {
        discreteQuarters.push({ ...current, period: { ...current.period, isDiscreteQuarter: false } });
      }
    }
    // For Q4 (12M Annual), find 9M YTD of the same year
    else if (current.period.quarter === 4) {
      const q3Ytd = sorted.find(p => p.period.year === current.period.year && p.period.quarter === 3);
      if (q3Ytd && q3Ytd.period.consolidated === current.period.consolidated && q3Ytd.period.currency === current.period.currency) {
        discreteQuarters.push(subtractPeriods(current, q3Ytd, 4));
      } else {
        discreteQuarters.push({ ...current, period: { ...current.period, isDiscreteQuarter: false } });
      }
    }
  }

  return discreteQuarters;
}

/**
 * Helper to subtract cumulative period (e.g. 6M YTD - Q1) to get discrete quarter values
 */
function subtractPeriods(
  cumulative: FinancialPeriodData, 
  previous: FinancialPeriodData,
  targetQuarter: number
): FinancialPeriodData {
  const is = cumulative.incomeStatement;
  const prevIs = previous.incomeStatement;
  const cf = cumulative.cashFlowStatement;
  const prevCf = previous.cashFlowStatement;

  const subNum = (a?: number | null, b?: number | null) => {
    if (a == null || b == null) return null;
    return a - b;
  };

  return {
    period: {
      ...cumulative.period,
      quarter: targetQuarter,
      isDiscreteQuarter: true,
      periodType: 'Quarter'
    },
    incomeStatement: {
      revenue: subNum(is.revenue, prevIs.revenue),
      grossProfit: subNum(is.grossProfit, prevIs.grossProfit),
      operatingIncome: subNum(is.operatingIncome, prevIs.operatingIncome),
      ebitda: subNum(is.ebitda, prevIs.ebitda),
      netIncome: subNum(is.netIncome, prevIs.netIncome),
      interestExpense: subNum(is.interestExpense, prevIs.interestExpense),
      taxExpense: subNum(is.taxExpense, prevIs.taxExpense)
    },
    // Balance sheet is a snapshot at period end date, NOT subtracted!
    balanceSheet: { ...cumulative.balanceSheet },
    cashFlowStatement: {
      operatingCashFlow: subNum(cf.operatingCashFlow, prevCf.operatingCashFlow),
      capitalExpenditures: subNum(cf.capitalExpenditures, prevCf.capitalExpenditures),
      freeCashFlow: subNum(cf.freeCashFlow, prevCf.freeCashFlow)
    },
    perShare: { ...cumulative.perShare }
  };
}

/**
 * Calculates TTM from discrete quarters
 * FLOW ITEMS (Income Statement, Cash Flow): Sum of 4 consecutive discrete quarters
 * BALANCE SHEET ITEMS: Snapshot of the latest quarter (NOT SUMMED)
 */
export function calculateTTM(quarters: FinancialPeriodData[]): CalculatedTTM | null {
  if (!quarters || quarters.length < 4) {
    return null; // TTM requires at least 4 discrete quarters
  }

  // Take the 4 most recent discrete quarters
  const ttmQuarters = quarters.slice(0, 4);
  const warnings: string[] = [];
  let isVerified = true;

  // Verification Check 1: Must have 4 quarters
  if (ttmQuarters.length < 4) {
    isVerified = false;
    warnings.push('TTM hesaplaması için 4 çeyrek tamamlanmamıştır.');
  }

  // Verification Check 2: Check for duplicated quarters
  const periodKeys = new Set(ttmQuarters.map(q => `${q.period.year}-Q${q.period.quarter}`));
  if (periodKeys.size < 4) {
    isVerified = false;
    warnings.push('TTM hesaplamasında mükerrer dönem tespit edilmiştir.');
  }

  // Verification Check 3: Check currency consistency
  const currencies = new Set(ttmQuarters.map(q => q.period.currency).filter(Boolean));
  if (currencies.size > 1) {
    isVerified = false;
    warnings.push('TTM çeyreklerinde farklı para birimleri mevcuttur.');
  }

  // Verification Check 4: Check discrete quarter flag
  const nonDiscrete = ttmQuarters.filter(q => !q.period.isDiscreteQuarter);
  if (nonDiscrete.length > 0) {
    isVerified = false;
    warnings.push('Bazı çeyrekler Kümilatif (YTD) veriden ayrıştırılamamıştır.');
  }

  // Helper for summing flow metrics across 4 quarters
  const sumFlow = (getter: (q: FinancialPeriodData) => number | null | undefined): number | null => {
    let sum = 0;
    let count = 0;
    for (const q of ttmQuarters) {
      const val = getter(q);
      if (val != null) {
        sum += val;
        count++;
      }
    }
    return count === 4 ? sum : null;
  };

  const incomeStatementTTM: IncomeStatement = {
    revenue: sumFlow(q => q.incomeStatement.revenue),
    grossProfit: sumFlow(q => q.incomeStatement.grossProfit),
    operatingIncome: sumFlow(q => q.incomeStatement.operatingIncome),
    ebitda: sumFlow(q => q.incomeStatement.ebitda),
    netIncome: sumFlow(q => q.incomeStatement.netIncome),
    interestExpense: sumFlow(q => q.incomeStatement.interestExpense),
    taxExpense: sumFlow(q => q.incomeStatement.taxExpense),
    netInterestIncome: sumFlow(q => q.incomeStatement.netInterestIncome),
    provisionForCreditLosses: sumFlow(q => q.incomeStatement.provisionForCreditLosses),
    feeAndCommissionIncome: sumFlow(q => q.incomeStatement.feeAndCommissionIncome)
  };

  const cashFlowTTM: CashFlowStatement = {
    operatingCashFlow: sumFlow(q => q.cashFlowStatement.operatingCashFlow),
    capitalExpenditures: sumFlow(q => q.cashFlowStatement.capitalExpenditures),
    freeCashFlow: sumFlow(q => q.cashFlowStatement.freeCashFlow),
    financingCashFlow: sumFlow(q => q.cashFlowStatement.financingCashFlow),
    investingCashFlow: sumFlow(q => q.cashFlowStatement.investingCashFlow)
  };

  // Balance sheet is SNAPSHOT of latest period, NOT sum
  const latestBalanceSheetSnapshot = { ...ttmQuarters[0].balanceSheet };
  const periodsUsed = ttmQuarters.map(q => q.period);

  return {
    isVerified,
    periodsUsed,
    incomeStatementTTM,
    cashFlowTTM,
    latestBalanceSheetSnapshot,
    warnings
  };
}
