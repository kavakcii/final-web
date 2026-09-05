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

  const prices = FinAiArchiveReader.getPrices(symbol);
  const rawQuote = FinAiArchiveReader.getQuoteSummary(symbol);

  if (!prices || prices.length === 0) {
    return apiError('NOT_FOUND', `${symbol} için piyasa verisi arşivde bulunamadı`, symbol, 404);
  }

  const latestBar = prices[prices.length - 1];
  const prevBar = prices.length >= 2 ? prices[prices.length - 2] : null;

  const sDetail = rawQuote?.summaryDetail || {};
  const defStats = rawQuote?.defaultKeyStatistics || {};

  const marketData = {
    symbol,
    latestPrice: latestBar.close,
    adjustedClose: latestBar.adjustedClose,
    previousClose: prevBar ? prevBar.close : (sDetail.previousClose || null),
    open: latestBar.open,
    dayHigh: latestBar.high,
    dayLow: latestBar.low,
    volume: latestBar.volume,
    asOfDate: latestBar.dateIstanbul,
    marketCap: sDetail.marketCap || null,
    enterpriseValue: defStats.enterpriseValue || null,
    fiftyTwoWeekHigh: sDetail.fiftyTwoWeekHigh || null,
    fiftyTwoWeekLow: sDetail.fiftyTwoWeekLow || null,
    beta: sDetail.beta || defStats.beta || null,
    sharesOutstanding: defStats.sharesOutstanding || null,
    floatShares: defStats.floatShares || null
  };

  return apiSuccess(marketData, { asOf: latestBar.dateIstanbul }, symbol);
}
