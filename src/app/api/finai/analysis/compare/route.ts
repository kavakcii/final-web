import { NextRequest, NextResponse } from "next/server";
import { AnalysisSnapshotService } from "@/lib/analysis/analysis-snapshot-service";
import { AnalysisChangeDiffEngine } from "@/lib/analysis/analysis-change-diff";

export const dynamic = "force-dynamic";

/**
 * Handles comparing two snapshots
 * GET /api/finai/analysis/compare?baseId=...&targetId=...
 * POST { baseId: "...", targetId: "..." }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const baseId = searchParams.get("baseId");
  const targetId = searchParams.get("targetId");

  return await executeComparison(baseId, targetId);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const baseId = body.baseId;
    const targetId = body.targetId;

    return await executeComparison(baseId, targetId);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Geçersiz istek gövdesi." },
      { status: 400 }
    );
  }
}

async function executeComparison(baseId: string | null | undefined, targetId: string | null | undefined) {
  if (!baseId || !targetId) {
    return NextResponse.json(
      {
        success: false,
        error: "Karşılaştırma için 'baseId' ve 'targetId' parametreleri zorunludur."
      },
      { status: 400 }
    );
  }

  const [baseSnapshot, targetSnapshot] = await Promise.all([
    AnalysisSnapshotService.getSnapshotById(baseId.trim()),
    AnalysisSnapshotService.getSnapshotById(targetId.trim())
  ]);

  if (!baseSnapshot) {
    return NextResponse.json(
      { success: false, error: `Referans (base) snapshot bulunamadı: ${baseId}` },
      { status: 404 }
    );
  }

  if (!targetSnapshot) {
    return NextResponse.json(
      { success: false, error: `Hedef (target) snapshot bulunamadı: ${targetId}` },
      { status: 404 }
    );
  }

  const comparison = AnalysisChangeDiffEngine.compareSnapshots(baseSnapshot, targetSnapshot);

  return NextResponse.json(
    {
      success: true,
      comparison
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600"
      }
    }
  );
}
