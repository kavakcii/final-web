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

  const quarterly = FinAiArchiveReader.getQuarterlyStatements(symbol) || [];
  const annual = FinAiArchiveReader.getAnnualStatements(symbol) || [];
  const prices = FinAiArchiveReader.getPrices(symbol) || [];
  const rawQuote = FinAiArchiveReader.getQuoteSummary(symbol) || {};

  const analysis = HistoricalAnalysisEngine.analyzeSymbol(symbol, {
    quarterlyStatements: quarterly,
    annualStatements: annual,
    priceBars: prices,
    rawQuoteSummary: rawQuote
  });

  return apiSuccess({
    symbol,
    hasCurrencyMismatch: analysis.currency.hasCurrencyMismatch,
    reportingCurrency: analysis.currency.financialReportingCurrency,
    priceCurrency: analysis.currency.priceTradingCurrency,
    history: analysis.valuationHistory
  }, { count: analysis.valuationHistory.length }, symbol);
}
