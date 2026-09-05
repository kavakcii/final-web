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
  const dividends = FinAiArchiveReader.getDividends(symbol) || [];
  const splits = FinAiArchiveReader.getSplits(symbol) || [];
  const rawQuote = FinAiArchiveReader.getQuoteSummary(symbol) || {};

  const analysis = HistoricalAnalysisEngine.analyzeSymbol(symbol, {
    quarterlyStatements: quarterly,
    annualStatements: annual,
    priceBars: prices,
    dividends,
    splits,
    rawQuoteSummary: rawQuote
  });

  const latestProf = analysis.profitabilityTrends[analysis.profitabilityTrends.length - 1] || null;
  const latestBs = analysis.balanceSheetTrends[analysis.balanceSheetTrends.length - 1] || null;
  const latestVal = analysis.valuationHistory[analysis.valuationHistory.length - 1] || null;
  const latestPs = analysis.perShareTrends[analysis.perShareTrends.length - 1] || null;

  const ratios = {
    symbol,
    periodEnd: latestProf?.periodEnd || null,
    valuation: {
      peRatio: latestVal?.peRatio ?? null,
      pbRatio: latestVal?.pbRatio ?? null,
      status: latestVal?.status ?? 'DATA_UNAVAILABLE',
      reason: latestVal?.statusReason ?? null
    },
    profitability: {
      grossMargin: latestProf?.grossMargin ?? null,
      operatingMargin: latestProf?.operatingMargin ?? null,
      ebitdaMargin: latestProf?.ebitdaMargin ?? null,
      netMargin: latestProf?.netMargin ?? null,
      roe: latestProf?.roe ?? null,
      roa: latestProf?.roa ?? null
    },
    leverageAndLiquidity: {
      debtToAssets: latestBs?.debtToAssets ?? null,
      debtToEquity: latestBs?.debtToEquity ?? null,
      netDebtToEBITDA: latestBs?.netDebtToEBITDA ?? null,
      currentRatio: latestBs?.currentRatio ?? null,
      quickRatio: latestBs?.quickRatio ?? null
    },
    perShare: {
      eps: latestPs?.eps ?? null,
      bvps: latestPs?.bvps ?? null,
      shareDenominatorUsed: latestPs?.shareDenominatorUsed ?? 'NONE'
    }
  };

  return apiSuccess(ratios, { asOfPeriod: latestProf?.periodEnd }, symbol);
}
