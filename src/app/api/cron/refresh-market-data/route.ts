import { NextRequest, NextResponse } from 'next/server';
import { ProductionRefreshEngine } from '@/lib/services/production-refresh-engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for cron execution

export async function GET(req: NextRequest) {
  return handleRefresh(req);
}

export async function POST(req: NextRequest) {
  return handleRefresh(req);
}

async function handleRefresh(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Authorization check
  const providedToken = authHeader?.replace(/^Bearer\s+/i, '');
  if (!cronSecret || providedToken !== cronSecret) {
    return NextResponse.json(
      { error: 'Unauthorized: invalid or missing cron secret authorization token.' },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const pilot = url.searchParams.get('pilot') === 'true';
  const dryRun = url.searchParams.get('dryRun') === 'true';
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : (pilot ? 12 : 50);

  const engine = new ProductionRefreshEngine();

  // Pilot symbols or default subset
  const pilotSymbols = [
    'THYAO', 'EREGL', 'ASELS', 'TUPRS', 'GARAN',
    'KARSN', 'AKBNK', 'SAHOL', 'KCHOL', 'UFUK', 'EBEBK', 'OBAMS'
  ];

  const targets = pilot
    ? pilotSymbols.map(s => ({ symbol: s, assetType: 'EQUITY' as const }))
    : pilotSymbols.slice(0, limit).map(s => ({ symbol: s, assetType: 'EQUITY' as const }));

  const t0 = Date.now();
  const results = await engine.runBatchRefresh(targets, {
    dryRun,
    concurrency: 3,
    throttleMs: 200
  });

  const durationMs = Date.now() - t0;
  const successCount = results.filter(r => r.status === 'SUCCESS' || r.status === 'PARTIAL').length;

  return NextResponse.json({
    success: true,
    dryRun,
    totalTargeted: targets.length,
    processed: results.length,
    successCount,
    durationMs,
    results: results.map(r => ({
      symbol: r.symbol,
      status: r.status,
      prices: r.prices,
      dividends: r.dividends,
      splits: r.splits,
      statements: r.statements
    }))
  });
}
