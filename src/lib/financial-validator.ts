/**
 * FinAI Financial Data Validator - Stage 5B
 * Financial Statement Math Checks, Balance Sheet Verification, & Quality Engine
 */

import { 
  FinancialPeriodData, 
  QualityMetadata, 
  QualityStatus, 
  SectorInfo,
  ValidationStatus 
} from '@/types/financials';

/**
 * Validates a balance sheet statement for accounting identity (Total Assets = Liabilities + Equity)
 */
export function validateBalanceSheet(
  totalAssets: number | null,
  totalLiabilities: number | null,
  totalEquity: number | null,
  sectorInfo?: SectorInfo
): { isValid: boolean; diff: number | null; isWarningOnly?: boolean } {
  if (totalAssets == null || totalLiabilities == null || totalEquity == null) {
    return { isValid: true, diff: null }; // Cannot disprove if fields are missing
  }

  const expectedAssets = totalLiabilities + totalEquity;
  const diff = Math.abs(totalAssets - expectedAssets);

  // For holding companies with vast minority interests (e.g. SAHOL, KCHOL), tolerance is 10% of total assets
  const toleranceRatio = sectorInfo?.isHolding ? 0.10 : 0.03;
  const maxTolerance = Math.max(totalAssets * toleranceRatio, 500000);
  const isValid = diff <= maxTolerance;

  const isAcceptable = Boolean(isValid || (sectorInfo?.isHolding && diff <= totalAssets * 0.12));

  return { 
    isValid: isAcceptable, 
    diff,
    isWarningOnly: sectorInfo?.isHolding && !isValid
  };
}

/**
 * Calculates sector-aware Net Debt
 * For Industrial: Financial Debt - Cash & Cash Equivalents
 * For Banks / Insurance: MUST BE NULL (Not Applicable)
 */
export function calculateNetDebt(
  financialDebt: number | null,
  cashAndEquivalents: number | null,
  sectorInfo: SectorInfo
): number | null {
  // CRITICAL BANK/INSURANCE RULE: Net Debt formula is NOT applicable to Financial Institutions!
  if (sectorInfo.isFinancialInstitution) {
    return null;
  }

  if (financialDebt == null || cashAndEquivalents == null) {
    return null;
  }

  return financialDebt - cashAndEquivalents;
}

/**
 * Calculates financial statement completeness score (0-100%)
 */
export function calculateCompletenessScore(periods: FinancialPeriodData[]): number {
  if (!periods || periods.length === 0) return 0;

  const latest = periods[0];
  let score = 0;

  // 1. Income Statement (25% weight)
  const is = latest.incomeStatement;
  let isCount = 0;
  if (is.revenue != null) isCount++;
  if (is.grossProfit != null) isCount++;
  if (is.operatingIncome != null) isCount++;
  if (is.netIncome != null) isCount++;
  score += (isCount / 4) * 25;

  // 2. Balance Sheet (30% weight)
  const bs = latest.balanceSheet;
  let bsCount = 0;
  if (bs.totalAssets != null) bsCount++;
  if (bs.totalLiabilities != null) bsCount++;
  if (bs.totalEquity != null) bsCount++;
  if (bs.cashAndEquivalents != null) bsCount++;
  if (bs.financialDebt != null) bsCount++;
  score += (bsCount / 5) * 30;

  // 3. Cash Flow Statement (25% weight)
  const cf = latest.cashFlowStatement;
  let cfCount = 0;
  if (cf.operatingCashFlow != null) cfCount++;
  if (cf.freeCashFlow != null) cfCount++;
  if (cf.capitalExpenditures != null) cfCount++;
  score += (cfCount / 3) * 25;

  // 4. Per Share Data (20% weight)
  const ps = latest.perShare;
  let psCount = 0;
  if (ps.basicEPS != null) psCount++;
  if (ps.bookValuePerShare != null) psCount++;
  if (ps.totalShares != null) psCount++;
  if (ps.weightedAverageShares != null) psCount++;
  score += (psCount / 4) * 20;

  return Math.min(100, Math.round(score));
}

/**
 * Runs full validation pipeline across quarterly & annual financial statements
 */
export function validateFinancialData(
  symbol: string,
  sectorInfo: SectorInfo,
  quarters: FinancialPeriodData[],
  annuals: FinancialPeriodData[],
  sourceName: string = 'FinAI Primary Data Gateway',
  fallbackUsed: boolean = false,
  fallbackReason?: string,
  primarySourceFailed: boolean = false,
  errorCode?: string
): QualityMetadata {
  const warnings: string[] = [];
  const errors: string[] = [];

  if ((!quarters || quarters.length === 0) && (!annuals || annuals.length === 0)) {
    return {
      completenessScore: 0,
      status: 'unavailable',
      validationStatus: 'INVALID',
      warnings: ['Finansal tablo verisi temin edilemedi.'],
      errors: ['No financial periods found for symbol.'],
      balanceSheetChecks: { isAssetsEqualLiabilitiesAndEquity: false, differenceAmount: null },
      sourceMetadata: {
        source: sourceName,
        fetchedAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        fallbackUsed,
        fallbackReason,
        primarySourceFailed,
        quality: 'unavailable',
        errorCode: errorCode || (primarySourceFailed ? 'PRIMARY_FAILED' : 'NO_DATA')
      }
    };
  }

  const allPeriods = [...(quarters || []), ...(annuals || [])];
  const latestPeriod = allPeriods[0];

  // 1. Balance Sheet Accounting Check
  const bs = latestPeriod.balanceSheet;
  const bsCheck = validateBalanceSheet(bs.totalAssets, bs.totalLiabilities, bs.totalEquity, sectorInfo);

  if (!bsCheck.isValid && bsCheck.diff !== null) {
    if (sectorInfo.isHolding) {
      warnings.push(
        `Konsolide Holding Bilanço Azınlık Payı: Toplam Varlıklar (${bs.totalAssets?.toLocaleString('tr-TR')} TL) ile Borç + Özkaynak (${((bs.totalLiabilities || 0) + (bs.totalEquity || 0)).toLocaleString('tr-TR')} TL) arasında kontrol gücü olmayan paylardan kaynaklı ${bsCheck.diff.toLocaleString('tr-TR')} TL fark bulunmaktadır.`
      );
    } else {
      errors.push(
        `Bilanço denklik hatası: Toplam Varlıklar (${bs.totalAssets?.toLocaleString('tr-TR')} TL) ile Borç + Özkaynak (${((bs.totalLiabilities || 0) + (bs.totalEquity || 0)).toLocaleString('tr-TR')} TL) arasında ${bsCheck.diff.toLocaleString('tr-TR')} TL fark var.`
      );
    }
  }

  // 2. Negative Cash / Abnormal Items
  if (bs.cashAndEquivalents !== null && bs.cashAndEquivalents < 0) {
    errors.push('Bilanço nakit ve nakit benzerleri kalemi negatif olamaz.');
  }

  // 3. Completeness Score Calculation
  const score = calculateCompletenessScore(quarters.length > 0 ? quarters : annuals);

  // 4. Determine Validation Status
  let status: QualityStatus = 'verified';
  let validationStatus: ValidationStatus = 'VALID';

  if (errors.length > 0) {
    status = 'invalid';
    validationStatus = 'INVALID';
  } else if (warnings.length > 0 || fallbackUsed || score < 60) {
    status = 'warning';
    validationStatus = 'WARNING';
  } else if (score < 90) {
    status = 'partial';
    validationStatus = 'VALID';
  }

  return {
    completenessScore: score,
    status,
    validationStatus,
    warnings,
    errors,
    balanceSheetChecks: {
      isAssetsEqualLiabilitiesAndEquity: bsCheck.isValid,
      differenceAmount: bsCheck.diff
    },
    sourceMetadata: {
      source: sourceName,
      fetchedAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
      fallbackUsed,
      fallbackReason,
      primarySourceFailed,
      quality: score >= 80 ? 'high' : (score >= 50 ? 'medium' : 'low'),
      errorCode
    }
  };
}
