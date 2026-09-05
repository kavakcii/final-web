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

  const est = FinAiArchiveReader.getEstimates(symbol);
  if (!est) {
    return apiSuccess({
      symbol,
      targetMeanPrice: null,
      targetMedianPrice: null,
      targetHighPrice: null,
      targetLowPrice: null,
      numberOfAnalysts: null,
      recommendationKey: null,
      recommendationTrend: []
    }, { dataStatus: 'DATA_UNAVAILABLE' }, symbol);
  }

  return apiSuccess({
    symbol,
    targetMeanPrice: est.targetMeanPrice ?? null,
    targetMedianPrice: est.targetMedianPrice ?? null,
    targetHighPrice: est.targetHighPrice ?? null,
    targetLowPrice: est.targetLowPrice ?? null,
    numberOfAnalysts: est.numberOfAnalysts ?? null,
    recommendationKey: est.recommendationKey ?? null,
    recommendationTrend: est.recommendationTrend ?? []
  }, {}, symbol);
}
