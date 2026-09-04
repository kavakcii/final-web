/**
 * FinAI Data Source Resolver & Reliability Engine - Stage 2.1B
 * Multi-Tier Fallback Resolver, Source Cross-Checker, Metadata Tagger & Null Safety Auditor
 */

import { SectorInfo, QualityStatus } from '@/types/financials';

export type CategoryType =
  | 'PRICE'
  | 'PROFILE'
  | 'INCOME'
  | 'BALANCE'
  | 'CASHFLOW'
  | 'PERSHARE'
  | 'DIVIDEND'
  | 'NEWS';

export interface SourceCandidate<T> {
  name: string;
  sourceUrl?: string;
  fetcher: () => Promise<T | null>;
  priority: number; // 1 = Primary, 2 = Fallback 1, 3 = Fallback 2
}

export interface DetailedSourceMetadata {
  source: string;
  sourceUrl?: string;
  fetchedAt: string;
  verifiedAt: string;
  status: QualityStatus;
  quality: 'high' | 'medium' | 'low' | 'unavailable';
  errorCode?: string;
  fallbackUsed: boolean;
  fallbackReason?: string;
  primarySourceFailed: boolean;
  crossCheckWarning?: string;
  candidateLogs: {
    source: string;
    success: boolean;
    error?: string;
    responseTimeMs: number;
  }[];
}

export interface ResolvedData<T> {
  data: T | null;
  metadata: DetailedSourceMetadata;
}

/**
 * Executes multi-tier source resolution with fallback logging and error handling
 */
export async function resolveDataSource<T>(
  category: CategoryType,
  symbol: string,
  candidates: SourceCandidate<T>[],
  validator?: (data: T) => { isValid: boolean; reason?: string }
): Promise<ResolvedData<T>> {
  const now = new Date().toISOString();
  const candidateLogs: DetailedSourceMetadata['candidateLogs'] = [];
  
  let selectedData: T | null = null;
  let selectedSource = 'Unavailable';
  let selectedUrl: string | undefined = undefined;
  let fallbackUsed = false;
  let fallbackReason: string | undefined = undefined;
  let primarySourceFailed = false;
  let errorCode: string | undefined = undefined;

  // Sort candidates by priority (1, 2, 3...)
  const sorted = [...candidates].sort((a, b) => a.priority - b.priority);

  for (let i = 0; i < sorted.length; i++) {
    const candidate = sorted[i];
    const startTime = Date.now();

    try {
      // Timeout promise (7 seconds max per candidate)
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout (7s)')), 7000)
      );

      const result = await Promise.race([candidate.fetcher(), timeoutPromise]);
      const duration = Date.now() - startTime;

      if (result !== null && result !== undefined) {
        // Run optional custom validator (symbol match, period match, etc.)
        if (validator) {
          const validation = validator(result);
          if (!validation.isValid) {
            candidateLogs.push({
              source: candidate.name,
              success: false,
              error: `Validation Failed: ${validation.reason || 'Invalid data structure'}`,
              responseTimeMs: duration
            });
            if (i === 0) primarySourceFailed = true;
            continue; // Try next fallback candidate
          }
        }

        // Successfully resolved
        selectedData = result;
        selectedSource = candidate.name;
        selectedUrl = candidate.sourceUrl;
        
        candidateLogs.push({
          source: candidate.name,
          success: true,
          responseTimeMs: duration
        });

        if (i > 0) {
          fallbackUsed = true;
          fallbackReason = `Primary source (${sorted[0].name}) failed or returned invalid payload. Switched to candidate ${i + 1} (${candidate.name}).`;
        }

        break; // Stop at first valid source
      } else {
        candidateLogs.push({
          source: candidate.name,
          success: false,
          error: 'Empty or null response payload',
          responseTimeMs: duration
        });
        if (i === 0) primarySourceFailed = true;
      }
    } catch (err: any) {
      const duration = Date.now() - startTime;
      candidateLogs.push({
        source: candidate.name,
        success: false,
        error: err.message || 'Unknown network error',
        responseTimeMs: duration
      });
      if (i === 0) {
        primarySourceFailed = true;
        errorCode = err.message || 'PRIMARY_FETCH_ERROR';
      }
    }
  }

  // Determine Quality & Status
  let status: QualityStatus = 'verified';
  let quality: DetailedSourceMetadata['quality'] = 'high';

  if (!selectedData) {
    status = 'unavailable';
    quality = 'unavailable';
    errorCode = errorCode || 'ALL_CANDIDATES_FAILED';
  } else if (fallbackUsed) {
    status = 'partial';
    quality = 'medium';
  }

  const metadata: DetailedSourceMetadata = {
    source: selectedSource,
    sourceUrl: selectedUrl,
    fetchedAt: now,
    verifiedAt: now,
    status,
    quality,
    errorCode,
    fallbackUsed,
    fallbackReason,
    primarySourceFailed,
    candidateLogs
  };

  return {
    data: selectedData,
    metadata
  };
}

/**
 * Cross-checks numeric metrics across two data sources (e.g., Primary vs Fallback)
 */
export function crossCheckNumericMetrics(
  primaryVal: number | null | undefined,
  secondaryVal: number | null | undefined,
  metricName: string,
  tolerancePercent: number = 10
): { isMatch: boolean; differencePercent: number | null; warning?: string } {
  if (primaryVal == null || secondaryVal == null) {
    return { isMatch: true, differencePercent: null };
  }

  if (primaryVal === 0 && secondaryVal === 0) {
    return { isMatch: true, differencePercent: 0 };
  }

  const base = Math.abs(primaryVal);
  if (base === 0) return { isMatch: true, differencePercent: null };

  const diff = Math.abs(primaryVal - secondaryVal);
  const diffPercent = (diff / base) * 100;

  if (diffPercent > tolerancePercent) {
    return {
      isMatch: false,
      differencePercent: parseFloat(diffPercent.toFixed(2)),
      warning: `Discrepancy detected in ${metricName}: Primary (${primaryVal}) vs Fallback (${secondaryVal}), difference: ${diffPercent.toFixed(1)}%.`
    };
  }

  return {
    isMatch: true,
    differencePercent: parseFloat(diffPercent.toFixed(2))
  };
}

/**
 * Validates Symbol & Company Name alignment between query and candidate response
 */
export function validateSymbolAndCompany(
  expectedSymbol: string,
  returnedSymbol: string | undefined | null,
  returnedCompanyName: string | undefined | null
): { isValid: boolean; reason?: string } {
  const cleanExpected = expectedSymbol.toUpperCase().replace(/\.IS$/, '').trim();
  
  if (returnedSymbol) {
    const cleanReturned = returnedSymbol.toUpperCase().replace(/\.IS$/, '').trim();
    if (cleanExpected !== cleanReturned) {
      return {
        isValid: false,
        reason: `Symbol Mismatch: Expected '${cleanExpected}' but received '${cleanReturned}'.`
      };
    }
  }

  if (returnedCompanyName && returnedCompanyName.trim().length > 0) {
    // Basic sanity check: Company name shouldn't be placeholder or error string
    const lower = returnedCompanyName.toLowerCase();
    if (lower.includes('error') || lower.includes('not found') || lower.includes('invalid')) {
      return {
        isValid: false,
        reason: `Company Name Error String: Received '${returnedCompanyName}'.`
      };
    }
  }

  return { isValid: true };
}

/**
 * Strictly verifies currency consistency (TRY, USD, EUR)
 */
export function validateCurrencyMatch(
  currency: string | null | undefined,
  allowedCurrencies: string[] = ['TRY', 'USD', 'EUR', '₺', '$', '€']
): { isValid: boolean; normalizedCurrency: string } {
  if (!currency) return { isValid: true, normalizedCurrency: 'TRY' };

  const upper = currency.toUpperCase().trim();
  if (upper === 'TRY' || upper === 'TL' || upper === '₺') return { isValid: true, normalizedCurrency: 'TRY' };
  if (upper === 'USD' || upper === '$') return { isValid: true, normalizedCurrency: 'USD' };
  if (upper === 'EUR' || upper === '€') return { isValid: true, normalizedCurrency: 'EUR' };

  if (allowedCurrencies.includes(upper)) return { isValid: true, normalizedCurrency: upper };

  return { isValid: false, normalizedCurrency: upper };
}
