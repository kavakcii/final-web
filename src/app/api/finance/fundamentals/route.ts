import { NextResponse } from 'next/server';
import { fetchStockFundamentals } from '@/lib/fundamentals-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbolParam = searchParams.get('symbol');

    if (!symbolParam) {
      return NextResponse.json(
        { error: 'Symbol parameter is required (e.g. ?symbol=GARAN)' },
        { status: 400 }
      );
    }

    const data = await fetchStockFundamentals(symbolParam);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in /api/finance/fundamentals:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch financial fundamentals' },
      { status: 500 }
    );
  }
}
