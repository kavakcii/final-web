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

  const splits = FinAiArchiveReader.getSplits(symbol) || [];

  return apiSuccess({
    symbol,
    totalActions: splits.length,
    splits: splits.map(s => ({
      eventDate: s.eventDate,
      actionType: 'STOCK_SPLIT',
      splitRatio: s.splitRatio,
      numerator: s.numerator,
      denominator: s.denominator
    }))
  }, { count: splits.length }, symbol);
}
