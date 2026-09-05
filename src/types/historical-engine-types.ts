/**
 * FinAI Phase 6 Historical Analysis Engine Types
 * 
 * Formal data contracts for:
 * 1. Financial Growth (YoY, CAGR, Multi-period)
 * 2. Profitability Trends (Gross, Operating, EBITDA, Net Margins, ROE, ROA)
 * 3. Balance Sheet Trends (Assets, Liabilities, Debt, Equity, Working Capital)
 * 4. Cash Flow Evolution (OCF, CapEx, FCF = OCF + CapEx)
 * 5. Per-Share Trends (EPS, BVPS, share counts with basic/diluted average)
 * 6. Historical Valuation Series (P/E, P/B, Dividend Yield, EV/EBITDA, EV/Sales)
 * 7. Dividend History & Statistics (Payouts, yields, no automated stopaj)
 * 8. Corporate Actions & Splits Timeline
 * 9. Multi-Year Comparisons (1y, 3y, 5y, 10y)
 * 10. Metric Trajectory Direction (IMPROVING, DETERIORATING, STABLE, VOLATILE, INSUFFICIENT_HISTORY)
 * 11. Volatility Metrics (StdDev across multi-period series)
 * 12. Complete Data Provenance & Quality Flags
 */

export type TrendDirection =
  | 'IMPROVING'
  | 'DETERIORATING'
  | 'STABLE'
  | 'VOLATILE'
  | 'INSUFFICIENT_HISTORY';

export type MetricDataStatus =
  | 'AVAILABLE'
  | 'INSUFFICIENT_HISTORY'
  | 'NOT_APPLICABLE'
  | 'NEGATIVE_DENOMINATOR'
  | 'ZERO_DENOMINATOR'
  | 'CURRENCY_MISMATCH'
  | 'DATA_UNAVAILABLE';

export interface ProvenanceMetadata {
  source: string;
  sourceUrl?: string;
  retrievedAt: string;
  payloadHash?: string;
  methodology: string;
  qualityScore?: number;
  currency: string;
  reportingCurrency?: string;
  fxConversionApplied: boolean;
  fxRateUsed?: number | null;
  fxDate?: string | null;
}

export interface MetricValueWithMetadata<T = number> {
  value: T | null;
  periodEnd: string;
  periodType: 'QUARTERLY' | 'ANNUAL' | 'TTM';
  status: MetricDataStatus;
  statusReason?: string;
  metadata: ProvenanceMetadata;
}

export interface HistoricalGrowthMetric {
  metricKey: string;
  metricName: string;
  currentPeriodEnd: string;
  previousPeriodEnd: string;
  currentValue: number | null;
  previousValue: number | null;
  yoyGrowthRate: number | null; // e.g. 24.5 for 24.5%
  formattedYoY: string;
  specialTransitionLabel?: string; // e.g. "Zarardan Kâra Geçiş"
  status: MetricDataStatus;
  reason?: string;
}

export interface MultiYearComparisonPoint {
  timeframe: '1Y' | '3Y' | '5Y' | '10Y';
  basePeriodEnd: string;
  targetPeriodEnd: string;
  isExactPeriod: boolean;
  baseValue: number | null;
  targetValue: number | null;
  totalChangePercent: number | null;
  cagrPercent: number | null;
  status: MetricDataStatus;
  reason?: string;
}

export interface HistoricalGrowthAnalysis {
  metrics: Record<string, {
    yoySeries: HistoricalGrowthMetric[];
    latestYoY: HistoricalGrowthMetric | null;
    multiYearComparisons: MultiYearComparisonPoint[];
    cagr3Y: number | null;
    cagr5Y: number | null;
    trendDirection: TrendDirection;
    volatilityStdDev: number | null;
  }>;
}

export interface ProfitabilityTrendPeriod {
  periodEnd: string;
  periodType: 'QUARTERLY' | 'ANNUAL';
  grossMargin: number | null;
  operatingMargin: number | null;
  ebitdaMargin: number | null;
  netMargin: number | null;
  roe: number | null;
  roa: number | null;
  statuses: Record<string, MetricDataStatus>;
}

export interface BalanceSheetTrendPeriod {
  periodEnd: string;
  periodType: 'QUARTERLY' | 'ANNUAL';
  totalAssets: number | null;
  cashAndEquivalents: number | null;
  totalDebt: number | null;
  netDebt: number | null;
  totalEquity: number | null;
  parentEquity: number | null;
  receivables: number | null;
  inventory: number | null;
  currentAssets: number | null;
  currentLiabilities: number | null;
  workingCapital: number | null;
  // Sector-specific ratios
  debtToAssets: number | null;
  debtToEquity: number | null;
  netDebtToEBITDA: number | null;
  currentRatio: number | null;
  quickRatio: number | null;
  statuses: Record<string, MetricDataStatus>;
}

export interface CashFlowTrendPeriod {
  periodEnd: string;
  periodType: 'QUARTERLY' | 'ANNUAL';
  operatingCashFlow: number | null;
  investingCashFlow: number | null;
  financingCashFlow: number | null;
  capitalExpenditure: number | null; // Strictly negative
  freeCashFlow: number | null; // OCF + CapEx
  statuses: Record<string, MetricDataStatus>;
}

export interface PerShareTrendPeriod {
  periodEnd: string;
  periodType: 'QUARTERLY' | 'ANNUAL';
  eps: number | null;
  bvps: number | null;
  basicAverageShares: number | null;
  dilutedAverageShares: number | null;
  shareDenominatorUsed: 'basicAverageShares' | 'dilutedAverageShares' | 'totalShares' | 'NONE';
  statuses: Record<string, MetricDataStatus>;
}

export interface HistoricalValuationPoint {
  date: string;
  price: number | null;
  peRatio: number | null;
  pbRatio: number | null;
  dividendYield: number | null;
  evToEbitda: number | null;
  evToSales: number | null;
  referenceFinancialPeriod: string;
  currencyPrice: string;
  currencyFinancials: string;
  fxConversionRate?: number | null;
  status: MetricDataStatus;
  statusReason?: string;
}

export interface HistoricalDividendRecord {
  exDate: string;
  grossAmount: number;
  netAmount: number | null; // Always null unless official net exists; NO automatic %10 stopaj
  currency: string;
  dividendYield: number | null;
}

export interface DividendHistoryAnalysis {
  totalHistoricalDividends: number;
  earliestDividendDate: string | null;
  latestDividendDate: string | null;
  annualDividendTotals: Record<number, number>; // year -> sum of gross
  dividendGrowthYoY: Record<number, number | null>;
  fiveYearAverageYield: number | null;
  consecutiveYearsOfDividends: number;
  events: HistoricalDividendRecord[];
  status: MetricDataStatus;
}

export interface CorporateActionTimelineEvent {
  eventDate: string;
  actionType: 'STOCK_SPLIT' | 'CAPITAL_INCREASE' | 'DIVIDEND';
  splitRatio?: number;
  numerator?: number;
  denominator?: number;
  anomalyFlag?: boolean;
  anomalyNote?: string;
}

export interface CorporateActionsAnalysis {
  totalSplits: number;
  events: CorporateActionTimelineEvent[];
  timelineAnomalies: string[];
}

export interface HistoricalEngineResult {
  symbol: string;
  yahooSymbol: string;
  assetType: 'EQUITY' | 'ETF' | 'FUND' | 'CERTIFICATE';
  sector: string;
  companyName: string;
  currency: {
    financialReportingCurrency: string;
    priceTradingCurrency: string;
    hasCurrencyMismatch: boolean;
  };
  totalQuartersAvailable: number;
  totalAnnualsAvailable: number;
  totalPriceBarsAvailable: number;
  ttmEligibility: {
    isEligible: boolean;
    consecutiveQuartersCount: number;
    reason?: string;
  };
  growthAnalysis: HistoricalGrowthAnalysis;
  profitabilityTrends: ProfitabilityTrendPeriod[];
  balanceSheetTrends: BalanceSheetTrendPeriod[];
  cashFlowTrends: CashFlowTrendPeriod[];
  perShareTrends: PerShareTrendPeriod[];
  valuationHistory: HistoricalValuationPoint[];
  dividendAnalysis: DividendHistoryAnalysis;
  corporateActions: CorporateActionsAnalysis;
  multiYearSummary: {
    revenue5YGrowth: number | null;
    netIncome5YGrowth: number | null;
    equity5YGrowth: number | null;
    fcf5YGrowth: number | null;
    eps5YGrowth: number | null;
  };
  metricDirections: Record<string, TrendDirection>;
  volatilities: Record<string, number | null>;
  overallQuality: {
    score: number;
    status: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';
    warnings: string[];
  };
}
