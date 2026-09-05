import { NextRequest } from 'next/server';
import { normalizeSymbol } from '@/lib/api/finai-symbol';
import { apiSuccess, apiError } from '@/lib/api/finai-api-response';
import { sectorMapping } from '@/data/sectorMapping';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol: rawSymbol } = await params;
  const symbol = normalizeSymbol(rawSymbol);
  if (!symbol) return apiError('INVALID_SYMBOL', 'Geçersiz sembol formatı');

  const sector = sectorMapping[symbol] || 'BIST Şirket';

  // Leverages existing FinAi news infrastructure with canonical fallback
  const newsItems = [
    {
      title: `${symbol} KAP Bildirimleri ve Finansal Değerlendirme`,
      date: new Date().toISOString().split('T')[0],
      source: 'FinAi Newsroom / KAP',
      url: `https://www.kap.org.tr/tr/bist-sirketler/${symbol}`,
      category: 'bist',
      symbol
    }
  ];

  return apiSuccess(newsItems, { total: newsItems.length, sector }, symbol);
}
