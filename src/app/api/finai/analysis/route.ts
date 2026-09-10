import { NextRequest, NextResponse } from "next/server";
import { AnalysisPipeline } from "@/lib/analysis/analysis-pipeline";

// BIST symbol validation regex: 2 to 8 alphanumeric characters
const BIST_SYMBOL_REGEX = /^[A-Z0-9]{2,8}$/;

/**
 * Handles analysis generation pipeline via POST
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawSymbol = body.symbol || body.assetName;
    const forceRefresh = Boolean(body.forceRefresh);

    return await executeAnalysisPipeline(rawSymbol, forceRefresh);
  } catch (err: any) {
    console.error("[/api/finai/analysis] Error handling request:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Analiz üretimi sırasında beklenmedik bir sunucu hatası oluştu. Lütfen tekrar deneyin.",
        technicalMessage: process.env.NODE_ENV === "development" ? err.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Handles analysis generation pipeline via GET (?symbol=THYAO&forceRefresh=false)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawSymbol = searchParams.get("symbol") || searchParams.get("q");
    const forceRefresh = searchParams.get("forceRefresh") === "true" || searchParams.get("refresh") === "true";

    return await executeAnalysisPipeline(rawSymbol, forceRefresh);
  } catch (err: any) {
    console.error("[/api/finai/analysis] Error handling GET request:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Analiz üretimi sırasında beklenmedik bir sunucu hatası oluştu. Lütfen tekrar deneyin.",
        technicalMessage: process.env.NODE_ENV === "development" ? err.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Executes the complete Phase 1 -> 6 unified pipeline and formats response
 */
async function executeAnalysisPipeline(rawSymbol: string | null | undefined, forceRefresh: boolean) {
  // 1. Validate symbol
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

  // 2. Execute through unified AnalysisPipeline
  const pipelineResult = await AnalysisPipeline.execute(cleanSymbol, {
    forceRefresh,
    triggerReason: 'MANUAL_REFRESH',
    triggerType: 'MANUAL_REQUEST'
  });

  if (!pipelineResult.success || !pipelineResult.data) {
    if (pipelineResult.status === 'LOCKED') {
      return NextResponse.json(
        { success: false, error: pipelineResult.error },
        { status: 429 }
      );
    }
    if (pipelineResult.status === 'REJECTED') {
      return NextResponse.json(
        { success: false, error: pipelineResult.error },
        { status: 422 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: pipelineResult.error || `${cleanSymbol} için doğrulanmış şirket veya piyasa verilerine ulaşılamadı. Sembolün Borsa İstanbul'da aktif işlem gördüğünden emin olun.`
      },
      { status: 404 }
    );
  }

  return NextResponse.json(pipelineResult.data, {
    status: 200,
    headers: {
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300"
    }
  });
}

