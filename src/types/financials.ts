export type PeriodType = "quarter" | "annual" | "ttm";
export type QualityStatus = "verified" | "partial" | "warning" | "unavailable";

export interface IncomeStatement {
  revenue: number | null;
  costOfRevenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  ebitda: number | null;
  financeIncomeExpense: number | null;
  pretaxIncome: number | null;
  taxExpense: number | null;
  netIncome: number | null;
  netIncomeParent: number | null;
  grossMargin: number | null; // % (0-100)
  operatingMargin: number | null; // % (0-100)
  ebitdaMargin: number | null; // % (0-100)
  netMargin: number | null; // % (0-100)
}

export interface BalanceSheet {
  currentAssets: number | null;
  nonCurrentAssets: number | null;
  totalAssets: number | null;
  currentLiabilities: number | null;
  nonCurrentLiabilities: number | null;
  totalLiabilities: number | null;
  financialDebt: number | null;
  cashAndEquivalents: number | null;
  netDebt: number | null;
  equity: number | null;
  tradeReceivables: number | null;
  inventory: number | null;
  propertyPlantEquipment: number | null;
}

export interface CashFlowStatement {
  operatingCashFlow: number | null;
  investingCashFlow: number | null;
  financingCashFlow: number | null;
  capex: number | null;
  freeCashFlow: number | null;
  netChangeInCash: number | null;
}

export interface PerShareMetrics {
  eps: number | null;
  dilutedEps: number | null;
  bookValuePerShare: number | null;
  dividendPerShare: number | null;
  paidInCapital: number | null;
  totalShares: number | null;
  circulatingShares: number | null;
  freeFloatRatio: number | null; // % (0-100)
}

export interface FinancialPeriod {
  periodType: PeriodType;
  period: string; // e.g. "2026-Q2", "2025", "TTM"
  periodStart: string | null; // ISO YYYY-MM-DD
  periodEnd: string | null; // ISO YYYY-MM-DD
  announcementDate: string | null; // ISO YYYY-MM-DD
  consolidated: boolean;
  reportingCurrency: string; // "TRY", "USD"
  incomeStatement: IncomeStatement;
  balanceSheet: BalanceSheet;
  cashFlow: CashFlowStatement;
  perShare: PerShareMetrics;
}

export interface FinancialQuality {
  status: QualityStatus;
  completeness: number; // Percentage 0-100
  warnings: string[];
}

export interface FinancialDataResponse {
  success: boolean;
  symbol: string;
  companyName: string;
  currency: string;
  source: string;
  sourceUrl: string;
  fetchedAt: string;
  verifiedAt: string;
  quality: FinancialQuality;
  periods: FinancialPeriod[];
}
