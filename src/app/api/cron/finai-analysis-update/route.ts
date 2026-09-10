import { NextRequest, NextResponse } from "next/server";
import { AnalysisTriggerEngine } from "@/lib/analysis/analysis-trigger-engine";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // 2 minutes max for cron execution

/**
 * FinAi Analysis Scheduled Update Cron Route
 *
 * Periodically evaluates pilot symbols for data changes and triggers
 * analysis updates only when material fingerprint changes are detected.
 *
 * Security: Protected by CRON_SECRET or Vercel Cron header.
 * Cost Control: maxAiCalls caps Gemini invocations per cycle (default: 3).
 */
export async function GET(request: NextRequest) {
  // 1. Auth verification (same pattern as existing cron routes)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    const isVercelCron = request.headers.get("x-vercel-cron") === "1";
    if (!isVercelCron) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz istek" },
        { status: 401 }
      );
    }
  }

  // 2. Parse optional query parameters
  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get("dryRun") === "true";
  const maxAiCallsParam = searchParams.get("maxAiCalls");
  const maxAiCalls = maxAiCallsParam ? parseInt(maxAiCallsParam, 10) : 3;
  const symbolsParam = searchParams.get("symbols");
  const symbols = symbolsParam
    ? symbolsParam.split(",").map((s) => s.trim().toUpperCase())
    : undefined;

  try {
    const summary = await AnalysisTriggerEngine.runScheduledCheck({
      symbols,
      maxAiCalls,
      dryRun,
    });

    return NextResponse.json({
      success: true,
      dryRun,
      summary: {
        totalEvaluated: summary.totalEvaluated,
        triggeredCount: summary.triggeredCount,
        skippedUnchangedCount: summary.skippedUnchangedCount,
        skippedNotMaterialCount: summary.skippedNotMaterialCount,
        skippedDuplicateCount: summary.skippedDuplicateCount,
        skippedStaleCount: summary.skippedStaleCount,
        lockedCount: summary.lockedCount,
        failedCount: summary.failedCount,
        aiCallsCount: summary.aiCallsCount,
        startedAt: summary.startedAt,
        completedAt: summary.completedAt,
      },
      details: summary.results.map((r) => ({
        symbol: r.symbol,
        decision: r.decision,
        reason: r.primaryReason,
        isMaterial: r.isMaterial,
        materialityScore: r.materialityScore,
        explanation: r.materialityExplanation,
        fingerprintChanged: r.fingerprintChanged,
      })),
    });
  } catch (error: any) {
    console.error("[FINAI CRON ANALYSIS UPDATE ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
