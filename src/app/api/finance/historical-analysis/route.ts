import { NextResponse } from 'next/server';
import { fetchStockFundamentals } from '@/lib/fundamentals-service';
import { calculateHistoricalFinancialAnalysis } from '@/lib/historical-analysis-engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbolParam = searchParams.get('symbol');
    const periodTypeParam = searchParams.get('periodType') || 'quarterly';

    if (!symbolParam) {
      return NextResponse.json(
        { error: 'Symbol parameter is required (e.g. ?symbol=THYAO)' },
        { status: 400 }
      );
    }

    const cleanSymbol = symbolParam.toUpperCase().replace(/\.IS$/, '').trim();
    const periodType = (periodTypeParam.toLowerCase() === 'annual' || periodTypeParam.toLowerCase() === 'yillik')
      ? 'annual'
      : 'quarterly';

    // 1. Fetch Fundamentals Data Layer from Historical Archive
    const fundamentals = await fetchStockFundamentals(cleanSymbol);

    // 2. Compute Historical Multi-Period Financial Analysis
    const analysis = calculateHistoricalFinancialAnalysis(fundamentals, periodType);

    return NextResponse.json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    console.error('Error in /api/finance/historical-analysis:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to generate historical financial analysis' },
      { status: 500 }
    );
  }
}
