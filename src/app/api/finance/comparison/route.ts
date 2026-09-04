import { NextResponse } from 'next/server';
import { getSectorComparativeAnalysis } from '@/lib/sector-comparison-engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbolParam = searchParams.get('symbol');

    if (!symbolParam) {
      return NextResponse.json(
        { success: false, error: 'Symbol parameter is required (e.g. ?symbol=THYAO)' },
        { status: 400 }
      );
    }

    const cleanSymbol = symbolParam.toUpperCase().replace(/\.IS$/, '').trim();

    // Execute Sector Comparative Engine
    const comparisonResults = await getSectorComparativeAnalysis(cleanSymbol);

    return NextResponse.json({
      success: true,
      data: comparisonResults
    });
  } catch (error: any) {
    console.error('Error in /api/finance/comparison:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to calculate comparative analysis' },
      { status: 500 }
    );
  }
}
