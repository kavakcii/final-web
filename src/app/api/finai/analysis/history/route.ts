import { NextRequest, NextResponse } from "next/server";
import { AnalysisSnapshotService } from "@/lib/analysis/analysis-snapshot-service";
import { AnalysisHistoryItem, AnalysisHistoryResponse } from "@/lib/analysis/types";

export const dynamic = "force-dynamic";

const BIST_SYMBOL_REGEX = /^[A-Z0-9]{2,8}$/;

/**
 * Handles analysis history retrieval for a symbol
 * GET /api/finai/analysis/history?symbol=THYAO&limit=20&offset=0
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawSymbol = searchParams.get("symbol") || searchParams.get("q");

    if (!rawSymbol || typeof rawSymbol !== "string" || !rawSymbol.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Hisse sembolü zorunludur. Lütfen geçerli bir BIST hisse kodu girin (Örn: THYAO, ASELS, BIMAS)."
        },
        { status: 400 }
      );
    }

    const cleanSymbol = rawSymbol.toUpperCase().replace(/\.IS$/, "").trim();

    if (!BIST_SYMBOL_REGEX.test(cleanSymbol)) {
      return NextResponse.json(
        {
          success: false,
          error: `Geçersiz BIST hisse formatı: "${cleanSymbol}". Kod 2 ila 8 karakter arasında alfanümerik olmalıdır.`
        },
        { status: 400 }
      );
    }

    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "20", 10)), 100);
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

    const historyResult = await AnalysisSnapshotService.getSnapshotHistory(cleanSymbol, {
      limit,
      offset
    });

    const snapshots = historyResult.snapshots;
    const totalCount = historyResult.totalCount;

    if (snapshots.length === 0 && offset === 0) {
      // Check if any snapshot exists at all
      const latest = await AnalysisSnapshotService.getLatestSnapshot(cleanSymbol);
      if (!latest) {
        return NextResponse.json(
          {
            success: false,
            error: `${cleanSymbol} için kayıtlı analiz geçmişi bulunamadı. Lütfen önce analizi başlatın.`
          },
          { status: 404 }
        );
      }
    }

    const currentVersion = snapshots[0]?.version ?? 1;
    const companyName = snapshots[0]?.company_name || cleanSymbol;

    const safeItems: AnalysisHistoryItem[] = snapshots.map(s => ({
      id: s.id,
      version: s.version ?? 1,
      symbol: s.symbol,
      companyName: s.company_name,
      createdAt: s.created_at,
      dataTimestamp: s.data_timestamp,
      fingerprint: s.fingerprint,
      previousSnapshotId: s.previous_snapshot_id ?? null,
      status: s.status,
      triggerReason: s.update_reason,
      triggerType: s.trigger_type,
      impactBalance: s.ai_analysis?.impactBalance || (s.data_package?.impactAnalysis as any)?.synthesisSummary?.impactBalance,
      guardrailStatus: s.guardrail_status,
      changeSummary: s.change_summary ?? s.change_diff?.causalNarrative ?? null,
      price: s.data_package?.marketData?.currentPrice ?? null,
      periodEnd: s.data_package?.statements?.latestQuarter?.periodEnd ?? null
    }));

    const response: AnalysisHistoryResponse = {
      success: true,
      symbol: cleanSymbol,
      companyName,
      totalSnapshots: totalCount,
      currentVersion,
      snapshots: safeItems,
      limit,
      offset,
      hasMore: offset + safeItems.length < totalCount
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120"
      }
    });

  } catch (err: any) {
    console.error("[/api/finai/analysis/history] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Analiz geçmişi sorgulanırken bir hata oluştu."
      },
      { status: 500 }
    );
  }
}
