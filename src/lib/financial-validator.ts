/**
 * FinAI Financial Data Validator - Stage 2.1
 * Financial Statement Math Checks, Balance Sheet Verification & Quality Scorer
 */

import { 
  FinancialPeriodData, 
  QualityMetadata, 
  QualityStatus, 
  SectorInfo 
} from '@/types/financials';

/**
 * Validates a balance sheet statement for accounting identity (Total Assets = Liabilities + Equity)
 */
export function validateBalanceSheet(
  totalAssets: number | null,
  totalLiabilities: number | null,
  totalEquity: number | null
): { isValid: boolean; diff: number | null } {
  if (totalAssets == null || totalLiabilities == null || totalEquity == null) {
    return { isValid: true, diff: null }; // Cannot disprove if fields are missing
  }

  const expectedAssets = totalLiabilities + totalEquity;
  const diff = Math.abs(totalAssets - expectedAssets);

  // Tolerance: 2% of total assets or 100,000 TRY (whichever is larger, to account for rounding)
  const maxTolerance = Math.max(totalAssets * 0.02, 100000);
  const isValid = diff <= maxTolerance;

  return { isValid, diff };
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
  if (ps.paidInCapital != null) psCount++;
  if (ps.totalShares != null) psCount++;
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
  sourceName: string = 'FinAI Primary Data Provider'
): QualityMetadata {
  const warnings: string[] = [];
  const errors: string[] = [];

  if ((!quarters || quarters.length === 0) && (!annuals || annuals.length === 0)) {
    return {
      completenessScore: 0,
      status: 'unavailable',
      warnings: ['Finansal tablo verisi temin edilemedi.'],
      errors: ['No financial periods found for symbol.'],
      balanceSheetChecks: { isAssetsEqualLiabilitiesAndEquity: false, differenceAmount: null },
      sourceMetadata: {
        source: sourceName,
        fetchedAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString()
      }
    };
  }

  const allPeriods = [...(quarters || []), ...(annuals || [])];
  const latestPeriod = allPeriods[0];

  // 1. Balance Sheet Accounting Check
  const bs = latestPeriod.balanceSheet;
  const bsCheck = validateBalanceSheet(bs.totalAssets, bs.totalLiabilities, bs.totalEquity);

  if (!bsCheck.isValid && bsCheck.diff !== null) {
    errors.push(
      `Bilanço denkliği uyuşmazlığı: Varlıklar (${bs.totalAssets?.toLocaleString('tr-TR')} TL) ≠ Yükümlülükler + Özkaynaklar farkı ${bsCheck.diff.toLocaleString('tr-TR')} TL.`
    );
  }

  // 2. Bank / Sector Checks
  if (sectorInfo.isFinancialInstitution) {
    warnings.push(
      `Finansal Kurum / Banka Modeli: Net Borç, Borç/FAVÖK ve Cari Oran formülleri sanayi sektörü mantığıyla uygulanmaz.`
    );
  }

  // 3. Currency Consistency Check
  const currencies = new Set(allPeriods.map(p => p.period.currency).filter(Boolean));
  if (currencies.size > 1) {
    warnings.push(`Farklı para birimi tespit edildi (${Array.from(currencies).join(', ')}). Dönemler arası kur çevrimi yapılmamıştır.`);
  } else if (currencies.size === 0) {
    warnings.push('Finansal veride para birimi bilgisi belirtilmemiştir.');
  }

  // 4. Consolidated Scope Consistency Check
  const consolidatedScopes = new Set(allPeriods.map(p => p.period.consolidated));
  if (consolidatedScopes.size > 1) {
    warnings.push('Farklı finansal dönemlerde konsolide ve solo raporlama kapsamları karışıktır.');
  }

  // 5. Completeness Score
  const completenessScore = calculateCompletenessScore(quarters.length > 0 ? quarters : annuals);

  // 6. Final Quality Status Determination
  let status: QualityStatus = 'verified';

  if (!bsCheck.isValid && bsCheck.diff !== null) {
    status = 'invalid';
  } else if (errors.length > 0) {
    status = 'invalid';
  } else if (warnings.length > 2 || completenessScore < 50) {
    status = 'warning';
  } else if (completenessScore < 75) {
    status = 'partial';
  }

  return {
    completenessScore,
    status,
    warnings,
    errors,
    balanceSheetChecks: {
      isAssetsEqualLiabilitiesAndEquity: bsCheck.isValid,
      differenceAmount: bsCheck.diff
    },
    sourceMetadata: {
      source: sourceName,
      fetchedAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString()
    }
  };
}
