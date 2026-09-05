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

  const own = FinAiArchiveReader.getOwnership(symbol);
  if (!own) {
    return apiSuccess({
      symbol,
      insidersPercentHeld: null,
      institutionsPercentHeld: null,
      institutionsCount: null,
      topInstitutions: []
    }, { dataStatus: 'DATA_UNAVAILABLE' }, symbol);
  }

  return apiSuccess({
    symbol,
    insidersPercentHeld: own.insidersPercentHeld ?? null,
    institutionsPercentHeld: own.institutionsPercentHeld ?? null,
    institutionsFloatPercentHeld: own.institutionsFloatPercentHeld ?? null,
    institutionsCount: own.institutionsCount ?? null,
    topInstitutions: own.topInstitutions ?? []
  }, {}, symbol);
}
