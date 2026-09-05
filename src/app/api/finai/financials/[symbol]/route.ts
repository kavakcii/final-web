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
  const periodParam = searchParams.get('period') || 'all';

  const [quarterly, annual] = await Promise.all([
    FinAiArchiveReader.getQuarterlyStatements(symbol),
    FinAiArchiveReader.getAnnualStatements(symbol)
  ]);

  const qList = quarterly || [];
  const aList = annual || [];

  if (qList.length === 0 && aList.length === 0) {
    return apiError('NOT_FOUND', `${symbol} için mali tablo verisi bulunamadı`, symbol, 404);
  }

  const cleanPeriod = (p: any) => ({
    periodEnd: p.periodEnd,
    fiscalYear: p.fiscalYear,
    fiscalQuarter: p.fiscalQuarter,
    periodType: p.periodType,
    currency: p.currency || 'TRY',
    incomeStatement: {
      revenue: p.revenue,
      costOfRevenue: p.costOfRevenue,
      grossProfit: p.grossProfit,
      operatingIncome: p.operatingIncome,
      ebitda: p.ebitda,
      netIncome: p.netIncome,
      netIncomeToParent: p.netIncomeToParent
    },
    balanceSheet: {
      cashAndEquivalents: p.cashAndEquivalents,
      totalCurrentAssets: p.totalCurrentAssets,
      totalAssets: p.totalAssets,
      currentLiabilities: p.currentLiabilities,
      totalLiabilities: p.totalLiabilities,
      totalEquity: p.totalEquity,
      parentEquity: p.parentEquity,
      netDebt: p.netDebt
    },
    cashFlow: {
      operatingCashFlow: p.operatingCashFlow,
      capitalExpenditure: p.capitalExpenditure,
      freeCashFlow: p.freeCashFlow
    }
  });

  const responseData: Record<string, any> = {};
  if (periodParam === 'all' || periodParam === 'annual') {
    responseData.annual = aList.map(cleanPeriod);
  }
  if (periodParam === 'all' || periodParam === 'quarterly') {
    responseData.quarterly = qList.map(cleanPeriod);
  }

  return apiSuccess(responseData, {
    annualCount: aList.length,
    quarterlyCount: qList.length
  }, symbol);
}
