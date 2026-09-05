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

  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '1y';

  let limit: number | undefined = undefined;
  if (range === '1m') limit = 22;
  else if (range === '3m') limit = 65;
  else if (range === '6m') limit = 130;
  else if (range === '1y') limit = 252;
  else if (range === '3y') limit = 756;
  else if (range === '5y') limit = 1260;
  else if (range === '10y') limit = 2520;

  const prices = await FinAiArchiveReader.getPrices(symbol, limit);
  if (!prices || prices.length === 0) {
    return apiError('NOT_FOUND', `${symbol} için fiyat tarihçesi bulunamadı`, symbol, 404);
  }

  const effectiveLimit = limit ?? prices.length;
  const sliced = prices.slice(Math.max(0, prices.length - effectiveLimit));

  const result = {
    symbol,
    range,
    count: sliced.length,
    earliestDate: sliced[0]?.dateIstanbul || null,
    latestDate: sliced[sliced.length - 1]?.dateIstanbul || null,
    prices: sliced.map(p => ({
      date: p.dateIstanbul,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      adjClose: p.adjustedClose,
      volume: p.volume
    }))
  };

  return apiSuccess(result, { count: sliced.length, range }, symbol);
}
