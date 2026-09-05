import { NextResponse } from 'next/server';
import { apiSuccess } from '@/lib/api/finai-api-response';
import { sectorMapping } from '@/data/sectorMapping';
import { BIST_CATALOG } from '@/lib/asset-catalog';

export async function GET() {
  const catalogMap = new Map(BIST_CATALOG.map(item => [item.symbol.toUpperCase(), item]));
  const symbols = Object.keys(sectorMapping).map(sym => {
    const cat = catalogMap.get(sym);
    const sector = sectorMapping[sym] || 'Diğer';
    const isETF = sector.includes('Fon') || sector.includes('Sertifika');
    const isInactive = sym === 'BMEKS' || sym === 'ALTIN' || sym === 'DMLKT';

    return {
      symbol: sym,
      yahooSymbol: `${sym}.IS`,
      companyName: cat?.name || sym,
      assetType: isETF ? 'ETF' : 'EQUITY',
      sector,
      status: isInactive ? 'INACTIVE' : 'ACTIVE'
    };
  });

  return apiSuccess(symbols, { total: symbols.length });
}
