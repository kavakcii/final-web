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

  const divs = await FinAiArchiveReader.getDividends(symbol);
  if (!divs || divs.length === 0) {
    return apiSuccess({
      symbol,
      totalDividends: 0,
      events: []
    }, { dataStatus: 'DATA_UNAVAILABLE' }, symbol);
  }

  // Preserves Yahoo raw gross amount without applying auto 10% stopaj!
  const events = divs.map(d => ({
    exDate: d.exDate,
    grossAmount: d.grossAmount,
    netAmount: null, // Strictly NULL: No automatic stopaj applied!
    currency: d.currency || 'TRY'
  }));

  return apiSuccess({
    symbol,
    totalDividends: events.length,
    events
  }, { count: events.length }, symbol);
}
