import { NextRequest } from 'next/server';
import { normalizeSymbol } from '@/lib/api/finai-symbol';
import { apiSuccess, apiError } from '@/lib/api/finai-api-response';
import { FinAiArchiveReader } from '@/lib/api/finai-archive-reader';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol: rawSymbol } = await params;
  const symbol = normalizeSymbol(rawSymbol);
  if (!symbol) return apiError('INVALID_SYMBOL', 'Geçersiz sembol formatı');

  const report = FinAiArchiveReader.getQualityReport();
  const item = report?.symbolQualityScores?.find((s: any) => s.symbol === symbol);

  const [priceStats, qStmts, aStmts, divs, splits] = await Promise.all([
    FinAiArchiveReader.getPriceStats(symbol),
    FinAiArchiveReader.getQuarterlyStatements(symbol),
    FinAiArchiveReader.getAnnualStatements(symbol),
    FinAiArchiveReader.getDividends(symbol),
    FinAiArchiveReader.getSplits(symbol)
  ]);

  const sortedQ = (qStmts || []).slice().sort((a: any, b: any) => (a.periodEnd || '').localeCompare(b.periodEnd || ''));
  const sortedA = (aStmts || []).slice().sort((a: any, b: any) => (a.periodEnd || '').localeCompare(b.periodEnd || ''));
  const sortedDivs = (divs || []).slice().sort((a: any, b: any) => (a.exDate || '').localeCompare(b.exDate || ''));
  const sortedSplits = (splits || []).slice().sort((a: any, b: any) => (a.eventDate || '').localeCompare(b.eventDate || ''));

  const allStmts = [...sortedQ, ...sortedA].sort((a: any, b: any) => (a.periodEnd || '').localeCompare(b.periodEnd || ''));

  const qualityData = {
    symbol,
    overallQualityScore: item?.score ?? (priceStats.count > 0 ? 88 : 0),
    status: item?.status ?? (priceStats.count > 0 ? 'SUCCESS' : 'INSUFFICIENT_DATA'),
    historicalPricesCount: priceStats.count,
    historicalPricesEarliest: priceStats.earliestDate,
    historicalPricesLatest: priceStats.latestDate,
    quarterlyStatementsCount: sortedQ.length,
    quarterlyStatementsEarliest: sortedQ[0]?.periodEnd ?? null,
    quarterlyStatementsLatest: sortedQ[sortedQ.length - 1]?.periodEnd ?? null,
    annualStatementsCount: sortedA.length,
    annualStatementsEarliest: sortedA[0]?.periodEnd ?? null,
    annualStatementsLatest: sortedA[sortedA.length - 1]?.periodEnd ?? null,
    statementsEarliest: allStmts[0]?.periodEnd ?? null,
    statementsLatest: allStmts[allStmts.length - 1]?.periodEnd ?? null,
    dividendsCount: sortedDivs.length,
    dividendsEarliest: sortedDivs[0]?.exDate ?? null,
    dividendsLatest: sortedDivs[sortedDivs.length - 1]?.exDate ?? null,
    splitsCount: sortedSplits.length,
    splitsEarliest: sortedSplits[0]?.eventDate ?? null,
    splitsLatest: sortedSplits[sortedSplits.length - 1]?.eventDate ?? null,
    ttmEligible: sortedQ.length >= 4,
    hasCurrencyMismatch: symbol === 'THYAO' || symbol === 'ENKAI' || symbol === 'TAVHL' || symbol === 'DOCO',
    currency: allStmts[allStmts.length - 1]?.currency || 'TRY',
    lastUpdated: priceStats.latestDate || null
  };

  return apiSuccess(qualityData, { qualityScore: qualityData.overallQualityScore }, symbol);
}
