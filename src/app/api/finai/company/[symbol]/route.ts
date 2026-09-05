import { NextRequest } from 'next/server';
import { normalizeSymbol } from '@/lib/api/finai-symbol';
import { apiSuccess, apiError } from '@/lib/api/finai-api-response';
import { FinAiArchiveReader } from '@/lib/api/finai-archive-reader';
import { sectorMapping } from '@/data/sectorMapping';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol: rawSymbol } = await params;
  const symbol = normalizeSymbol(rawSymbol);
  if (!symbol) return apiError('INVALID_SYMBOL', 'Geçersiz sembol formatı');

  const profile = FinAiArchiveReader.getProfile(symbol);
  const rawQuote = FinAiArchiveReader.getQuoteSummary(symbol);
  const sector = sectorMapping[symbol] || 'Diğer';

  if (!profile && !rawQuote) {
    return apiError('NOT_FOUND', `${symbol} için şirket profil verisi arşivde bulunamadı`, symbol, 404);
  }

  const finCurrency = rawQuote?.financialData?.financialCurrency || 'TRY';

  const companyData = {
    symbol,
    yahooSymbol: `${symbol}.IS`,
    companyName: profile?.companyName || rawQuote?.quoteType?.longName || rawQuote?.price?.longName || symbol,
    exchange: 'BIST',
    sector: profile?.sector || sector,
    industry: profile?.industry || null,
    country: profile?.country || 'Turkey',
    city: profile?.city || null,
    address: profile?.address || null,
    website: profile?.websiteUrl || null,
    employees: profile?.employeeCount || null,
    businessSummary: profile?.businessSummary || null,
    executives: profile?.executives || [],
    financialCurrency: finCurrency,
    priceCurrency: 'TRY'
  };

  return apiSuccess(companyData, { financialCurrency: finCurrency, priceCurrency: 'TRY' }, symbol);
}
