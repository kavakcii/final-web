/**
 * FinAI Financial Data Layer - Stage 5B Types
 * Comprehensive TypeScript Interfaces for Stock Fundamentals, Multi-Period Archive, & Validation
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

export type ValidationStatus =
  | 'VALID'
  | 'WARNING'
  | 'INVALID'
  | 'CONFLICT';

export type RatioStatus =
  | 'available'
  | 'not_applicable'
  | 'insufficient_data'
  | 'source_unavailable'
  | 'validation_failed'
  | 'negative_input'
  | 'zero_denominator'
  | 'insufficient_history'
  | 'currency_mismatch'
  | 'consolidation_mismatch';

export type PeriodType = 'Quarter' | 'YTD' | 'Annual' | 'TTM' | 'QUARTERLY' | 'ANNUAL';

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
  periodType: 'Quarter' | 'Annual' | 'TTM' | 'QUARTERLY' | 'ANNUAL';
  startDate?: string;
  endDate: string; // ISO format e.g. "2025-12-31"
  consolidated: boolean;
  currency: string | null; // e.g. "TRY", "USD"
  sourceCurrency?: string | null;
  reportedCurrency?: string | null;
  isDiscreteQuarter: boolean; // true if Q1, or Yahoo 3M discrete quarter
  isRestated?: boolean;
  version?: number;
}

export interface IncomeStatement {
  revenue: number | null;
  costOfRevenue?: number | null;
  grossProfit: number | null;
  operatingExpenses?: number | null;
  operatingIncome: number | null;
  ebitda: number | null;
  pretaxIncome?: number | null;
  taxExpense?: number | null;
  netIncome: number | null;
  netIncomeToParent?: number | null;
  interestIncome?: number | null;
  interestExpense?: number | null;
  
  // Margins (Derived / Percentage 0-100%)
  grossMargin?: number | null;
  operatingMargin?: number | null;
  ebitdaMargin?: number | null;
  netMargin?: number | null;

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
  parentEquity?: number | null;
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
  investingCashFlow?: number | null;
  financingCashFlow?: number | null;
  capitalExpenditures: number | null;
  freeCashFlow: number | null; // operatingCashFlow - capEx or reported FCF
  dividendsPaid?: number | null;
  netChangeInCash?: number | null;
}

export interface PerShareData {
  basicEPS: number | null;
  dilutedEPS: number | null;
  bookValuePerShare: number | null;
  paidInCapital: number | null;       // Ödenmiş Sermaye (TL) - NEVER USED AS DENOMINATOR
  totalShares: number | null;         // Toplam Hisse Adedi
  circulatingShares: number | null;   // Dolaşımdaki Hisse Adedi
  freeFloatShares: number | null;     // Halka Açık Hisse Adedi
  freeFloatPercent: number | null;    // Halka Açıklık Oranı %
  weightedAverageShares: number | null; // Ağırlıklı Ortalama Hisse Adedi
}

export interface HistoricalDividendRecord {
  symbol: string;
  companyName?: string;
  exDate: string;           // ISO date e.g. "2024-04-18"
  recordDate?: string | null;
  paymentDate?: string | null;
  announcementDate?: string | null;
  grossAmount: number;      // TL per share
  netAmount?: number | null;// TL per share
  currency: string;
  source: string;
  sourceUrl?: string;
  validationStatus: ValidationStatus;
  isCurrent?: boolean;
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
  validationStatus: ValidationStatus;
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
  quarters: FinancialPeriodData[]; // Discrete quarterly financial statements (5-7 periods)
  annuals: FinancialPeriodData[];  // Annual financial statements (4-5 years)
  dividends?: HistoricalDividendRecord[]; // 10-year real cash dividend distribution history
  lastUpdated: string;
}
