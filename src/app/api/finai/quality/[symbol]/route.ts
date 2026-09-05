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

  const [prices, qStmts, aStmts, divs, splits] = await Promise.all([
    FinAiArchiveReader.getPrices(symbol, 1),
    FinAiArchiveReader.getQuarterlyStatements(symbol),
    FinAiArchiveReader.getAnnualStatements(symbol),
    FinAiArchiveReader.getDividends(symbol),
    FinAiArchiveReader.getSplits(symbol)
  ]);

  const qualityData = {
    symbol,
    overallQualityScore: item?.score ?? 85,
    status: item?.status ?? 'SUCCESS',
    historicalPricesCount: prices?.length ?? 0,
    quarterlyStatementsCount: qStmts?.length ?? 0,
    annualStatementsCount: aStmts?.length ?? 0,
    dividendsCount: divs?.length ?? 0,
    splitsCount: splits?.length ?? 0,
    ttmEligible: (qStmts?.length ?? 0) >= 4,
    hasCurrencyMismatch: symbol === 'THYAO' || symbol === 'ENKAI' || symbol === 'TAVHL' || symbol === 'DOCO'
  };

  return apiSuccess(qualityData, { qualityScore: qualityData.overallQualityScore }, symbol);
}
