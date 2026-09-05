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

  const quarterly = FinAiArchiveReader.getQuarterlyStatements(symbol) || [];

  if (quarterly.length < 4) {
    return apiSuccess({
      periodType: 'TTM',
      status: 'INSUFFICIENT_HISTORY',
      message: 'TTM hesaplaması için en az 4 kesintisiz çeyrek gereklidir',
      data: null
    }, { dataStatus: 'DATA_UNAVAILABLE' }, symbol);
  }

  // Most recent 4 quarters
  const sorted = quarterly.slice().sort((a, b) => b.periodEnd.localeCompare(a.periodEnd));
  const ttmQuarters = sorted.slice(0, 4);

  // Sum flow items
  const sumFlow = (key: string) => {
    let sum = 0;
    for (const q of ttmQuarters) {
      if (q[key] == null) return null;
      sum += q[key];
    }
    return sum;
  };

  // Balance sheet uses snapshot of the latest quarter
  const latestQuarter = ttmQuarters[0];

  const ttmData = {
    periodType: 'TTM',
    periodEnd: latestQuarter.periodEnd,
    status: 'AVAILABLE',
    quartersCovered: ttmQuarters.map(q => q.periodEnd),
    incomeStatementTTM: {
      revenue: sumFlow('revenue'),
      grossProfit: sumFlow('grossProfit'),
      operatingIncome: sumFlow('operatingIncome'),
      ebitda: sumFlow('ebitda'),
      netIncome: sumFlow('netIncome')
    },
    cashFlowTTM: {
      operatingCashFlow: sumFlow('operatingCashFlow'),
      capitalExpenditure: sumFlow('capitalExpenditure'),
      freeCashFlow: sumFlow('freeCashFlow')
    },
    latestBalanceSheetSnapshot: {
      totalAssets: latestQuarter.totalAssets,
      totalLiabilities: latestQuarter.totalLiabilities,
      totalEquity: latestQuarter.totalEquity,
      cashAndEquivalents: latestQuarter.cashAndEquivalents,
      netDebt: latestQuarter.netDebt
    }
  };

  return apiSuccess(ttmData, { periodEnd: latestQuarter.periodEnd }, symbol);
}
