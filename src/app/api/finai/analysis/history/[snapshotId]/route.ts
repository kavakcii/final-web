import { NextRequest, NextResponse } from "next/server";
import { AnalysisSnapshotService } from "@/lib/analysis/analysis-snapshot-service";

export const dynamic = "force-dynamic";

/**
 * Handles retrieval of a specific snapshot by ID
 * GET /api/finai/analysis/history/[snapshotId]
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ snapshotId: string }> }
) {
  try {
    const { snapshotId } = await params;

    if (!snapshotId || typeof snapshotId !== "string" || !snapshotId.trim()) {
      return NextResponse.json(
        { success: false, error: "Snapshot ID zorunludur." },
        { status: 400 }
      );
    }

    const snapshot = await AnalysisSnapshotService.getSnapshotById(snapshotId.trim());

    if (!snapshot) {
      return NextResponse.json(
        { success: false, error: "İstenen analiz snapshot kaydı bulunamadı." },
        { status: 404 }
      );
    }

    // Sanitize and construct safe payload (no internal credentials or raw keys)
    const safePayload = {
      success: true,
      snapshot: {
        id: snapshot.id,
        version: snapshot.version ?? 1,
        symbol: snapshot.symbol,
        companyName: snapshot.company_name,
        createdAt: snapshot.created_at,
        dataTimestamp: snapshot.data_timestamp,
        fingerprint: snapshot.fingerprint,
        previousSnapshotId: snapshot.previous_snapshot_id ?? null,
        status: snapshot.status,
        triggerType: snapshot.trigger_type,
        triggerReason: snapshot.update_reason,
        triggerEventId: snapshot.trigger_event_id
      },
      changeDiff: snapshot.change_diff ?? null,
      changeSummary: snapshot.change_summary ?? null,
      impactBalance: snapshot.ai_analysis?.impactBalance || (snapshot.data_package?.impactAnalysis as any)?.synthesisSummary?.impactBalance || null,
      factors: snapshot.factors || [],
      aiAnalysis: snapshot.ai_analysis ? {
        impactBalance: snapshot.ai_analysis.impactBalance,
        generalOverview: snapshot.ai_analysis.generalOverview,
        detailedCommentary: snapshot.ai_analysis.detailedCommentary,
        keyFactors: snapshot.ai_analysis.keyFactors,
        scenarios: snapshot.ai_analysis.scenarios,
        watchItems: snapshot.ai_analysis.watchItems,
        educationalTakeaway: snapshot.ai_analysis.educationalTakeaway,
        generatedAt: snapshot.ai_analysis.generatedAt,
        modelUsed: snapshot.ai_analysis.modelUsed
      } : null,
      guardrail: {
        status: snapshot.guardrail_status || 'PASS',
        isPublishable: snapshot.guardrail_report?.isPublishable ?? true,
        violationsCount: snapshot.guardrail_report?.violations?.length ?? 0
      },
      dataFreshness: snapshot.data_freshness,
      dataQuality: snapshot.data_quality
    };

    return NextResponse.json(safePayload, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600"
      }
    });

  } catch (err: any) {
    console.error("[/api/finai/analysis/history/[snapshotId]] Error:", err);
    return NextResponse.json(
      { success: false, error: "Snapshot detayı sorgulanırken bir hata oluştu." },
      { status: 500 }
    );
  }
}
