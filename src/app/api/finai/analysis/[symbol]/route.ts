import { NextRequest } from 'next/server';
import { normalizeSymbol } from '@/lib/api/finai-symbol';
import { apiSuccess, apiError } from '@/lib/api/finai-api-response';
import { FinAiArchiveReader } from '@/lib/api/finai-archive-reader';
import { HistoricalAnalysisEngine } from '@/lib/historical-analysis-engine-v2';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol: rawSymbol } = await params;
  const symbol = normalizeSymbol(rawSymbol);
  if (!symbol) return apiError('INVALID_SYMBOL', 'Geçersiz sembol formatı');

  const [quarterly, annual, prices, dividends, splits, rawQuote] = await Promise.all([
    FinAiArchiveReader.getQuarterlyStatements(symbol),
    FinAiArchiveReader.getAnnualStatements(symbol),
    FinAiArchiveReader.getPrices(symbol),
    FinAiArchiveReader.getDividends(symbol),
    FinAiArchiveReader.getSplits(symbol),
    FinAiArchiveReader.getQuoteSummary(symbol)
  ]);

  const analysis = HistoricalAnalysisEngine.analyzeSymbol(symbol, {
    quarterlyStatements: quarterly || [],
    annualStatements: annual || [],
    priceBars: prices || [],
    dividends: dividends || [],
    splits: splits || [],
    rawQuoteSummary: rawQuote || {}
  });

  return apiSuccess(analysis, {
    totalAnnuals: analysis.totalAnnualsAvailable,
    totalQuarters: analysis.totalQuartersAvailable
  }, symbol);
}
