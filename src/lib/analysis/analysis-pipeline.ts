/**
 * FinAi Analysis Unified Pipeline
 * 
 * Central execution orchestrator connecting Phase 1 through Phase 6:
 * - Data Assembly & Validation (Phase 1)
 * - Deterministic Impact Engine (Phase 3)
 * - Snapshot & Deduplication Service (Phase 1/7)
 * - AI Analysis Engine & FinAi System Prompt (Phase 4)
 * - AI Guardrail & Quality Control (Phase 5)
 * - Clean UI Response Adapter (Phase 6)
 * 
 * Shared across:
 * 1. User manual requests (/api/finai/analysis)
 * 2. Event-driven triggers (AnalysisTriggerEngine)
 * 3. Scheduled periodic checks (AnalysisTriggerEngine / Cron)
 */

import {
  AssembledDataPackage,
  ImpactEngineResult,
  AIAnalysisResult,
  FinAiAnalysisResponse,
  AnalysisUpdateOptions
} from './types';
import { AnalysisOrchestrator } from './analysis-orchestrator';
import { FinancialImpactEngine } from './impact-engine';
import { AnalysisSnapshotService } from './analysis-snapshot-service';
import { AIAnalysisEngine } from './ai-analysis-engine';
import { AnalysisResponseAdapter } from './analysis-response-adapter';
import { AnalysisQualityEvaluator } from './analysis-quality-evaluator';

// In-flight concurrency locks to prevent race conditions & duplicate Gemini API calls
interface ConcurrencyLock {
  timestamp: number;
  promise: Promise<any>;
}

const inFlightLocks = new Map<string, ConcurrencyLock>();
const DEFAULT_LOCK_TIMEOUT_MS = 90_000; // 90 seconds lease to prevent deadlocks

export class AnalysisPipeline {
  /**
   * Checks whether an analysis update is currently running for the symbol
   */
  public static isLocked(symbol: string): boolean {
    const cleanSymbol = symbol.toUpperCase().trim();
    const lock = inFlightLocks.get(cleanSymbol);
    if (!lock) return false;

    // Check lease expiration
    if (Date.now() - lock.timestamp > DEFAULT_LOCK_TIMEOUT_MS) {
      inFlightLocks.delete(cleanSymbol);
      return false;
    }
    return true;
  }

  /**
   * Acquires a concurrency lock for a symbol
   */
  public static acquireLock(symbol: string, promise: Promise<any>): boolean {
    const cleanSymbol = symbol.toUpperCase().trim();
    if (this.isLocked(cleanSymbol)) {
      return false;
    }
    inFlightLocks.set(cleanSymbol, {
      timestamp: Date.now(),
      promise
    });
    return true;
  }

  /**
   * Releases a concurrency lock for a symbol
   */
  public static releaseLock(symbol: string): void {
    const cleanSymbol = symbol.toUpperCase().trim();
    inFlightLocks.delete(cleanSymbol);
  }

  /**
   * Primary entry point: Executes the unified Phase 1 -> Phase 6 pipeline
   */
  public static async execute(
    rawSymbol: string,
    options: AnalysisUpdateOptions = {}
  ): Promise<{
    success: boolean;
    data?: FinAiAnalysisResponse;
    dataPackage?: AssembledDataPackage;
    impactResult?: ImpactEngineResult;
    aiResult?: AIAnalysisResult;
    isDuplicate?: boolean;
    version?: number;
    snapshotId?: string;
    richDiff?: any;
    status?: 'COMPLETED' | 'LOCKED' | 'FAILED' | 'REJECTED';
    error?: string;
  }> {
    const cleanSymbol = rawSymbol.toUpperCase().replace(/\.IS$/, '').trim();

    // 1. Concurrency Check: If an update is currently in-flight for this symbol,
    // wait for existing promise or report locked
    const existingLock = inFlightLocks.get(cleanSymbol);
    if (existingLock && Date.now() - existingLock.timestamp <= DEFAULT_LOCK_TIMEOUT_MS) {
      if (options.forceRefresh) {
        // Wait for the in-flight execution to finish rather than throwing
        try {
          const res = await existingLock.promise;
          return res;
        } catch {
          // If in-flight failed, proceed with new run
        }
      } else {
        return {
          success: false,
          status: 'LOCKED',
          error: cleanSymbol + ' icin su anda bir analiz guncellemesi calisiyor. Lutfen birkac saniye sonra tekrar deneyin.'
        };
      }
    }

    // 2. Wrap execution in lock
    let resolveLock!: (val: any) => void;
    let rejectLock!: (err: any) => void;
    const lockPromise = new Promise((resolve, reject) => {
      resolveLock = resolve;
      rejectLock = reject;
    });

    inFlightLocks.set(cleanSymbol, {
      timestamp: Date.now(),
      promise: lockPromise
    });

    try {
      // 3. Phase 1: Assemble Verified Data Package
      const assembly = await AnalysisOrchestrator.assembleSymbolData(cleanSymbol);
      if (!assembly.success || !assembly.dataPackage) {
        const failureResult = {
          success: false,
          status: 'FAILED' as const,
          error: assembly.error || (cleanSymbol + ' icin dogrulanmis sirket verilerine ulasilamadi.')
        };
        resolveLock(failureResult);
        return failureResult;
      }

      const dataPackage = assembly.dataPackage;
      const factors = assembly.factors || [];

      // 4. Phase 3: Evaluate Financial Impact Deterministically
      let impactResult = dataPackage.impactAnalysis;
      if (!impactResult) {
        impactResult = FinancialImpactEngine.evaluate(dataPackage, factors);
        dataPackage.impactAnalysis = impactResult;
      }

      // 5. Save/Check Snapshot with Trigger Metadata
      const previousSnapshot = await AnalysisSnapshotService.getLatestSnapshot(cleanSymbol);
      const snapshotSave = await AnalysisSnapshotService.saveSnapshot(
        dataPackage,
        impactResult.evaluatedFactors || factors,
        {
          updateReason: options.triggerReason as string | undefined,
          triggerType: options.triggerType as string | undefined,
          triggerEventId: options.triggerEventId,
          previousFingerprint: options.previousFingerprint || previousSnapshot?.fingerprint
        }
      );

      // 6. Phase 4 & Phase 5: AI Analysis Engine + Independent Guardrail
      let aiResult = await AIAnalysisEngine.analyze(dataPackage, {
        forceRefresh: options.forceRefresh ?? false
      });

      // 7. Phase 10: Analysis Quality, Calibration & Hardening Evaluator
      const qualityEvaluation = AnalysisQualityEvaluator.evaluateQuality(
        aiResult,
        dataPackage,
        impactResult
      );
      aiResult = qualityEvaluation.calibratedAnalysis;

      // Deduplicate and group factors on impactResult
      impactResult.evaluatedFactors = qualityEvaluation.deduplicatedFactors;

      // If Quality Evaluator rejects output, switch to deterministic fallback safely
      if (qualityEvaluation.qualityResult.decision === 'REJECT') {
        const rejectionReasons = qualityEvaluation.qualityResult.issues
          .filter(i => i.severity === 'CRITICAL')
          .map(i => `${i.code}: ${i.message}`)
          .join(' | ');
        console.warn(`[AnalysisPipeline] Analysis for ${cleanSymbol} rejected by Quality Evaluator: ${rejectionReasons}. Activating deterministic fallback.`);
        
        aiResult = AIAnalysisEngine.generateDeterministicFallback(
          dataPackage,
          impactResult,
          `QUALITY_REJECT: ${rejectionReasons}`
        );
        const fallbackQuality = AnalysisQualityEvaluator.evaluateQuality(
          aiResult,
          dataPackage,
          impactResult
        );
        aiResult = fallbackQuality.calibratedAnalysis;
      }

      // Check final Guardrail / Quality publication readiness
      if (aiResult.guardrailReport && !aiResult.guardrailReport.isPublishable) {
        // Fallback to deterministic synthesis if guardrail still rejected
        aiResult = AIAnalysisEngine.generateDeterministicFallback(
          dataPackage,
          impactResult,
          'GUARDRAIL_FAILSAFE'
        );
        aiResult.guardrailReport = {
          guardrailVersion: '1.0.0',
          checkedAt: new Date().toISOString(),
          decision: 'PASS',
          isPublishable: true,
          violations: [],
          warnings: ['Deterministik şelale sentezi devreye alındı.'],
          validatedClaims: [],
          unverifiedClaims: [],
          sourceMismatches: [],
          complianceViolations: [],
          dataConsistencyIssues: [],
          auditedSymbol: dataPackage.symbol,
          dataFingerprint: dataPackage.fingerprint
        };
      }

      // 8. Adapt to clean UI response
      const adaptedResponse = AnalysisResponseAdapter.adapt(dataPackage, impactResult, aiResult);

      const successResult = {
        success: true,
        status: 'COMPLETED' as const,
        data: adaptedResponse,
        dataPackage,
        impactResult,
        aiResult,
        isDuplicate: snapshotSave.isDuplicate,
        version: snapshotSave.snapshot.version ?? 1,
        snapshotId: snapshotSave.snapshot.id,
        richDiff: snapshotSave.richDiff
      };

      resolveLock(successResult);
      return successResult;
    } catch (err: any) {
      rejectLock(err);
      return {
        success: false,
        status: 'FAILED',
        error: 'Analiz uretim pipeline hatasi (' + cleanSymbol + '): ' + err.message
      };
    } finally {
      inFlightLocks.delete(cleanSymbol);
    }
  }
}
