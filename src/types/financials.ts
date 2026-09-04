/**
 * FinAI Financial Data Layer - Stage 2.1 Types
 * Comprehensive TypeScript Interfaces for Stock Fundamentals & Validation
 */

export type SectorCategory =
  | 'INDUSTRIAL'
  | 'BANK'
  | 'INSURANCE'
  | 'REIT'
  | 'HOLDING'
  | 'ENERGY'
  | 'TELECOM'
  | 'TRANSPORTATION'
  | 'RETAIL'
  | 'TECHNOLOGY'
  | 'HEALTHCARE'
  | 'CONSTRUCTION'
  | 'FOOD'
  | 'AUTOMOTIVE'
  | 'OTHER';

export type QualityStatus =
  | 'verified'
  | 'partial'
  | 'warning'
  | 'invalid'
  | 'unavailable';

export type PeriodType = 'Quarter' | 'YTD' | 'Annual' | 'TTM';

export interface SectorInfo {
  category: SectorCategory;
  displayName: string;
  isFinancialInstitution: boolean; // Bank or Insurance
  isREIT: boolean;                 // GYO
  isHolding: boolean;              // Holding
  isIndustrial: boolean;           // Sanayi / Üretim
  unsupportedMetrics: string[];    // e.g. ["netDebt", "netDebtToEBITDA", "currentRatio", "quickRatio"] for Banks
}

export interface StatementPeriod {
  year: number;
  quarter: number; // 1, 2, 3, 4
  periodType: PeriodType;
  endDate: string; // ISO format e.g. "2025-12-31"
  consolidated: boolean;
  currency: string | null; // e.g. "TRY", "USD"
  isDiscreteQuarter: boolean; // true if Q1, or derived discrete Q2=H1-Q1, Q3=9M-H1, Q4=Annual-9M
}

export interface IncomeStatement {
  revenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  ebitda: number | null;
  netIncome: number | null;
  interestExpense?: number | null;
  taxExpense?: number | null;
  // Bank specific fields
  netInterestIncome?: number | null;
  provisionForCreditLosses?: number | null;
  feeAndCommissionIncome?: number | null;
}

export interface BalanceSheet {
  cashAndEquivalents: number | null;
  financialDebt: number | null; // Short term + Long term financial borrowings
  shortTermDebt: number | null;
  longTermDebt: number | null;
  totalAssets: number | null;
  totalLiabilities: number | null;
  totalEquity: number | null;
  currentAssets: number | null;
  currentLiabilities: number | null;
  inventories: number | null;
  receivables: number | null;
  netDebt: number | null; // Null/NotApplicable for Banks!
  // Bank specific fields
  totalDeposits?: number | null;
  totalLoans?: number | null;
  securitiesPortfolio?: number | null;
}

export interface CashFlowStatement {
  operatingCashFlow: number | null;
  capitalExpenditures: number | null;
  freeCashFlow: number | null; // operatingCashFlow - capEx
  financingCashFlow?: number | null;
  investingCashFlow?: number | null;
}

export interface PerShareData {
  basicEPS: number | null;
  dilutedEPS: number | null;
  bookValuePerShare: number | null;
  paidInCapital: number | null;       // Ödenmiş Sermaye (TL)
  totalShares: number | null;         // Toplam Hisse Adedi
  circulatingShares: number | null;   // Dolaşımdaki Hisse Adedi
  freeFloatShares: number | null;     // Halka Açık Hisse Adedi
  freeFloatPercent: number | null;    // Halka Açıklık Oranı %
  weightedAverageShares: number | null; // Ağırlıklı Ortalama Hisse Adedi
}

export interface FinancialPeriodData {
  period: StatementPeriod;
  incomeStatement: IncomeStatement;
  balanceSheet: BalanceSheet;
  cashFlowStatement: CashFlowStatement;
  perShare: PerShareData;
}

export interface CalculatedTTM {
  isVerified: boolean;
  periodsUsed: StatementPeriod[];
  incomeStatementTTM: IncomeStatement;
  cashFlowTTM: CashFlowStatement;
  latestBalanceSheetSnapshot: BalanceSheet; // Balance sheet is snapshot of latest quarter, NOT sum!
  warnings: string[];
}

export interface QualityMetadata {
  completenessScore: number; // 0 - 100%
  status: QualityStatus;
  warnings: string[];
  errors: string[];
  balanceSheetChecks: {
    isAssetsEqualLiabilitiesAndEquity: boolean;
    differenceAmount: number | null;
  };
  sourceMetadata: {
    source: string;
    sourceUrl?: string;
    fetchedAt: string;
    verifiedAt: string;
    fallbackUsed?: boolean;
    fallbackReason?: string;
    primarySourceFailed?: boolean;
    quality?: 'high' | 'medium' | 'low' | 'unavailable';
    errorCode?: string;
  };
}

export interface ValidatedFinancialData {
  symbol: string;
  normalizedSymbol: string;
  companyName: string;
  sectorInfo: SectorInfo;
  quality: QualityMetadata;
  ttm: CalculatedTTM | null;
  quarters: FinancialPeriodData[]; // Discrete quarterly financial statements
  annuals: FinancialPeriodData[];  // Annual financial statements
  lastUpdated: string;
}
