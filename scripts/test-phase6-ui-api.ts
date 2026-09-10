import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { NextRequest } from "next/server";
import { POST as finaiAnalysisPOST, GET as finaiAnalysisGET } from "../src/app/api/finai/analysis/route";
import { POST as legacyAnalyzePOST } from "../src/app/api/analyze/route";
import { FinAiAnalysisResponse } from "../src/lib/analysis/types";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string, details?: any): void {
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    testsPassed++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    if (details) console.error('   Details:', details);
    testsFailed++;
  }
}

async function runPhase6Tests() {
  console.log('\n======================================================');
  console.log('   FINAI ANALYSIS SYSTEM - PHASE 6 TEST SUITE');
  console.log('   Production Analysis API & UI Pipeline Verification');
  console.log('======================================================\n');

  // ==========================================================================
  // MODULE 1: API Input Validation & Error Handling
  // ==========================================================================
  console.log('--- MODULE 1: Input Validation & Error Handling ---');

  // Test 1.1: Missing symbol in POST
  {
    const req = new NextRequest("http://localhost:3000/api/finai/analysis", {
      method: "POST",
      body: JSON.stringify({})
    });
    const res = await finaiAnalysisPOST(req);
    assert(res.status === 400, "Empty POST body returns 400 Bad Request");
    const json = await res.json();
    assert(json.success === false && Boolean(json.error), "Error message returned for empty body");
  }

  // Test 1.2: Invalid malformed symbol
  {
    const req = new NextRequest("http://localhost:3000/api/finai/analysis", {
      method: "POST",
      body: JSON.stringify({ symbol: "INVALID_SYMBOL_TOO_LONG_123" })
    });
    const res = await finaiAnalysisPOST(req);
    assert(res.status === 400, "Malformed symbol returns 400 Bad Request");
  }

  // Test 1.3: GET query parameter missing
  {
    const req = new NextRequest("http://localhost:3000/api/finai/analysis", {
      method: "GET"
    });
    const res = await finaiAnalysisGET(req);
    assert(res.status === 400, "Missing GET query returns 400 Bad Request");
  }

  // ==========================================================================
  // MODULE 2: Backward Compatibility - Legacy /api/analyze Untouched
  // ==========================================================================
  console.log('\n--- MODULE 2: Legacy /api/analyze Integrity ---');

  {
    const req = new NextRequest("http://localhost:3000/api/analyze", {
      method: "POST",
      body: JSON.stringify({ assetName: "ALTIN" })
    });
    const res = await legacyAnalyzePOST(req);
    assert(res.status === 200, "Legacy /api/analyze continues to respond with 200");
    const json = await res.json();
    assert(json.success === true, "Legacy /api/analyze returns success: true");
    assert(Boolean(json.data?.summary), "Legacy /api/analyze preserves expected data structure");
  }

  // ==========================================================================
  // MODULE 3: Real BIST Symbol End-to-End Execution: THYAO
  // ==========================================================================
  console.log('\n--- MODULE 3: Real BIST Execution - THYAO ---');

  {
    const req = new NextRequest("http://localhost:3000/api/finai/analysis?symbol=THYAO", {
      method: "GET"
    });
    const res = await finaiAnalysisGET(req);
    assert(res.status === 200, "THYAO analysis API returns 200 OK");
    const data: FinAiAnalysisResponse = await res.json();

    assert(data.success === true, "THYAO response success is true");
    assert(data.symbol === "THYAO", `THYAO symbol normalized correctly (${data.symbol})`);
    assert(data.currentPrice !== null && data.currentPrice > 0, `THYAO current price is valid (${data.currentPrice} ${data.currency})`);
    assert(Boolean(data.generalOverview), "THYAO general overview is populated");
    assert(
      data.impactBalance === "Pozitif" || data.impactBalance === "Negatif" || data.impactBalance === "Nötr",
      `THYAO impact balance is valid enum (${data.impactBalance})`
    );

    // 4 Narrative Dimensions
    assert(Boolean(data.narrativeSections?.whatIsHappening), "Narrative: 'Ne oluyor?' is present");
    assert(Boolean(data.narrativeSections?.whyItMatters), "Narrative: 'Neden önemli?' is present");
    assert(Boolean(data.narrativeSections?.factorsAtPlay), "Narrative: 'Şirketi hangi faktörler etkiliyor?' is present");
    assert(Boolean(data.narrativeSections?.whatCouldChange), "Narrative: 'Ne değişebilir?' is present");

    // Factors
    const totalFactors = data.positiveFactors.length + data.negativeFactors.length + data.neutralFactors.length;
    assert(totalFactors > 0, `THYAO factors categorized successfully (Total: ${totalFactors})`);

    // Scenarios
    assert(Boolean(data.scenarios?.baseline), "Scenarios: baseline scenario present");
    assert(Boolean(data.scenarios?.optimistic), "Scenarios: optimistic scenario present");
    assert(Boolean(data.scenarios?.cautious), "Scenarios: cautious scenario present");

    // Guardrail & Sources
    assert(data.guardrail?.isPublishable === true, "THYAO analysis passed guardrail and isPublishable = true");
    assert(data.sourceReferences.length > 0, `Source references preserved (${data.sourceReferences.length} sources)`);
    assert(Boolean(data.snapshot?.fingerprint), `Snapshot fingerprint created (${data.snapshot?.fingerprint?.slice(0, 16)}...)`);
  }

  // ==========================================================================
  // MODULE 4: Real BIST Symbol End-to-End Execution: ASELS
  // ==========================================================================
  console.log('\n--- MODULE 4: Real BIST Execution - ASELS ---');

  {
    const req = new NextRequest("http://localhost:3000/api/finai/analysis", {
      method: "POST",
      body: JSON.stringify({ symbol: "ASELS" })
    });
    const res = await finaiAnalysisPOST(req);
    assert(res.status === 200, "ASELS analysis API returns 200 OK via POST");
    const data: FinAiAnalysisResponse = await res.json();

    assert(data.success === true, "ASELS response success is true");
    assert(data.symbol === "ASELS", "ASELS symbol matches");
    assert(data.currentPrice !== null && data.currentPrice > 0, `ASELS current price valid (${data.currentPrice} ${data.currency})`);
    assert(data.guardrail?.isPublishable === true, "ASELS analysis passed guardrail without violations");
    assert(data.positiveFactors.length >= 0, "ASELS positive factors list accessible");
  }

  // ==========================================================================
  // MODULE 5: Real BIST Symbol End-to-End Execution: BIMAS
  // ==========================================================================
  console.log('\n--- MODULE 5: Real BIST Execution - BIMAS ---');

  {
    const req = new NextRequest("http://localhost:3000/api/finai/analysis", {
      method: "POST",
      body: JSON.stringify({ symbol: "BIMAS" })
    });
    const res = await finaiAnalysisPOST(req);
    assert(res.status === 200, "BIMAS analysis API returns 200 OK via POST");
    const data: FinAiAnalysisResponse = await res.json();

    assert(data.success === true, "BIMAS response success is true");
    assert(data.symbol === "BIMAS", "BIMAS symbol matches");
    assert(data.currentPrice !== null && data.currentPrice > 0, `BIMAS current price valid (${data.currentPrice} ${data.currency})`);
    assert(data.guardrail?.isPublishable === true, "BIMAS analysis passed guardrail without violations");
  }

  // ==========================================================================
  // SUMMARY
  // ==========================================================================
  console.log('\n======================================================');
  console.log(`TOTAL TESTS: ${testsPassed + testsFailed}`);
  console.log(`PASSED: ${testsPassed}`);
  console.log(`FAILED: ${testsFailed}`);
  console.log('======================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase6Tests().catch(err => {
  console.error("Unhandled Phase 6 test error:", err);
  process.exit(1);
});
