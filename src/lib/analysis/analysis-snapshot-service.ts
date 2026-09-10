/**
 * FinAi Analysis Snapshot Service
 * 
 * Manages point-in-time snapshots of assembled analytical data and qualitative factors.
 * 
 * Core Features:
 * 1. Deduplication Guard: Prevents redundant snapshot creation if data fingerprint has not changed.
 * 2. Change Difference Engine: Computes what changed between consecutive snapshots
 *    ("What was the prior analysis -> what data changed -> why did the analysis shift?").
 * 3. Resilient Persistence: Supabase PostgreSQL primary with safe fallback storage.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  AssembledDataPackage,
  AnalysisFactor,
  AnalysisSnapshotRecord,
  SnapshotDiffResult
} from './types';

// In-memory fallback repository for development/test environments
const inMemorySnapshotStore: AnalysisSnapshotRecord[] = [];

let _supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient | null {
  if (_supabaseAdmin) return _supabaseAdmin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  _supabaseAdmin = createClient(url, key, {
    auth: { persistSession: false }
  });
  return _supabaseAdmin;
}

export class AnalysisSnapshotService {
  /**
   * Saves a new analysis snapshot with deduplication protection and diff tracking
   */
  public static async saveSnapshot(
    dataPackage: AssembledDataPackage,
    factors: AnalysisFactor[],
    triggerMetadata?: {
      updateReason?: string;
      triggerType?: string;
      triggerEventId?: string;
      previousFingerprint?: string;
    }
  ): Promise<{
    success: boolean;
    snapshot: AnalysisSnapshotRecord;
    isDuplicate: boolean;
    diff?: SnapshotDiffResult;
    error?: string;
  }> {
    const symbol = dataPackage.symbol;
    const fingerprint = dataPackage.fingerprint;

    // 1. Check if an identical snapshot already exists for this symbol & fingerprint
    const existing = await this.findSnapshotByFingerprint(symbol, fingerprint);
    if (existing) {
      return {
        success: true,
        snapshot: existing,
        isDuplicate: true
      };
    }

    // 2. Fetch the latest previous snapshot to compute change diff
    const previousSnapshot = await this.getLatestSnapshot(symbol);
    const diff = previousSnapshot
      ? this.computeChangeDiff(dataPackage, factors, previousSnapshot)
      : undefined;

    const newSnapshot: AnalysisSnapshotRecord = {
      id: crypto.randomUUID(),
      symbol,
      company_name: dataPackage.companyName,
      created_at: new Date().toISOString(),
      data_timestamp: dataPackage.assembledAt,
      snapshot_version: 1,
      orchestrator_version: dataPackage.orchestratorVersion,
      fingerprint,
      data_package: dataPackage,
      factors,
      source_provenance: dataPackage.provenance,
      data_freshness: dataPackage.dataFreshness,
      data_quality: dataPackage.dataQuality,
      relevant_events: [
        ...dataPackage.relevantNews.map(n => ({ type: 'NEWS', id: n.id, title: n.title, date: n.pubDate })),
        ...dataPackage.relevantCalendarEvents.map(e => ({ type: 'CALENDAR', event: e.event, country: e.country, date: e.dateFormatted }))
      ],
      status: 'ASSEMBLED',
      update_reason: triggerMetadata?.updateReason,
      trigger_type: triggerMetadata?.triggerType,
      trigger_event_id: triggerMetadata?.triggerEventId,
      previous_fingerprint: triggerMetadata?.previousFingerprint || previousSnapshot?.fingerprint
    };

    // 3. Persist to Supabase or in-memory fallback
    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        const insertPayload: any = {
          id: newSnapshot.id,
          symbol: newSnapshot.symbol,
          company_name: newSnapshot.company_name,
          created_at: newSnapshot.created_at,
          data_timestamp: newSnapshot.data_timestamp,
          snapshot_version: newSnapshot.snapshot_version,
          orchestrator_version: newSnapshot.orchestrator_version,
          fingerprint: newSnapshot.fingerprint,
          data_package: newSnapshot.data_package,
          factors: newSnapshot.factors,
          source_provenance: newSnapshot.source_provenance,
          data_freshness: newSnapshot.data_freshness,
          data_quality: newSnapshot.data_quality,
          relevant_events: newSnapshot.relevant_events,
          status: newSnapshot.status
        };

        if (newSnapshot.update_reason) insertPayload.update_reason = newSnapshot.update_reason;
        if (newSnapshot.trigger_type) insertPayload.trigger_type = newSnapshot.trigger_type;
        if (newSnapshot.trigger_event_id) insertPayload.trigger_event_id = newSnapshot.trigger_event_id;
        if (newSnapshot.previous_fingerprint) insertPayload.previous_fingerprint = newSnapshot.previous_fingerprint;

        const { error } = await sb.from('analysis_snapshots').insert(insertPayload);

        if (error) {
          console.warn('[AnalysisSnapshotService] Supabase insert warning, falling back to memory store:', error.message);
          inMemorySnapshotStore.unshift(newSnapshot);
        }
      } catch (err: any) {
        console.warn('[AnalysisSnapshotService] Supabase error, falling back to memory store:', err.message);
        inMemorySnapshotStore.unshift(newSnapshot);
      }
    } else {
      inMemorySnapshotStore.unshift(newSnapshot);
    }

    return {
      success: true,
      snapshot: newSnapshot,
      isDuplicate: false,
      diff
    };
  }

  private static unpackRecord(rec: AnalysisSnapshotRecord): AnalysisSnapshotRecord {
    if (!rec.ai_analysis && (rec.data_package as any)?.aiAnalysis) {
      rec.ai_analysis = (rec.data_package as any).aiAnalysis;
    }
    if (!rec.guardrail_status && (rec.data_package as any)?.guardrailStatus) {
      rec.guardrail_status = (rec.data_package as any).guardrailStatus;
    }
    if (!rec.guardrail_report && (rec.data_package as any)?.guardrailReport) {
      rec.guardrail_report = (rec.data_package as any).guardrailReport;
    }
    if (!rec.update_reason && (rec.data_package as any)?.updateReason) {
      rec.update_reason = (rec.data_package as any).updateReason;
    }
    if (!rec.trigger_type && (rec.data_package as any)?.triggerType) {
      rec.trigger_type = (rec.data_package as any).triggerType;
    }
    return rec;
  }

  /**
   * Retrieves the latest snapshot for a symbol
   */
  public static async getLatestSnapshot(symbol: string): Promise<AnalysisSnapshotRecord | null> {
    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('analysis_snapshots')
          .select('*')
          .eq('symbol', symbol)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          return this.unpackRecord(data as AnalysisSnapshotRecord);
        }
      } catch {
        // Fall through to in-memory store
      }
    }

    const memMatch = inMemorySnapshotStore.find(s => s.symbol === symbol);
    return memMatch ? this.unpackRecord(memMatch) : null;
  }

  /**
   * Retrieves history of snapshots for a symbol
   */
  public static async getSnapshotHistory(symbol: string, limit: number = 10): Promise<AnalysisSnapshotRecord[]> {
    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('analysis_snapshots')
          .select('*')
          .eq('symbol', symbol)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && data && data.length > 0) {
          return (data as AnalysisSnapshotRecord[]).map(rec => this.unpackRecord(rec));
        }
      } catch {
        // Fall through
      }
    }

    return inMemorySnapshotStore.filter(s => s.symbol === symbol).slice(0, limit).map(rec => this.unpackRecord(rec));
  }

  /**
   * Finds snapshot by exact fingerprint
   */
  private static async findSnapshotByFingerprint(symbol: string, fingerprint: string): Promise<AnalysisSnapshotRecord | null> {
    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('analysis_snapshots')
          .select('*')
          .eq('symbol', symbol)
          .eq('fingerprint', fingerprint)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          return this.unpackRecord(data as AnalysisSnapshotRecord);
        }
      } catch {
        // Fall through
      }
    }

    const memMatch = inMemorySnapshotStore.find(s => s.symbol === symbol && s.fingerprint === fingerprint);
    return memMatch ? this.unpackRecord(memMatch) : null;
  }

  /**
   * Computes the exact differences between the current analytical package and a previous snapshot
   */
  public static computeChangeDiff(
    currentPackage: AssembledDataPackage,
    currentFactors: AnalysisFactor[],
    previousSnapshot: AnalysisSnapshotRecord
  ): SnapshotDiffResult {
    const changesSummary: string[] = [];
    const prevPackage = previousSnapshot.data_package;

    // 1. Price Change
    const prevPrice = prevPackage?.marketData?.currentPrice;
    const currPrice = currentPackage.marketData?.currentPrice;
    let priceDiffPercent: number | null = null;

    if (prevPrice != null && currPrice != null && prevPrice > 0) {
      priceDiffPercent = Number((((currPrice - prevPrice) / prevPrice) * 100).toFixed(2));
      if (Math.abs(priceDiffPercent) >= 1.0) {
        changesSummary.push(`Fiyat ${prevPrice} ₺ seviyesinden ${currPrice} ₺ seviyesine (%${priceDiffPercent >= 0 ? '+' : ''}${priceDiffPercent}) değişti.`);
      }
    }

    // 2. Financial Period Change
    const prevQuarter = prevPackage?.statements?.latestQuarter?.periodEnd;
    const currQuarter = currentPackage.statements?.latestQuarter?.periodEnd;
    const isNewStatementPeriod = Boolean(currQuarter && prevQuarter && currQuarter !== prevQuarter);

    if (isNewStatementPeriod) {
      changesSummary.push(`Yeni finansal tablo açıklandı: ${prevQuarter} -> ${currQuarter}.`);
    }

    // 3. Dividend Change
    const prevDivCount = prevPackage?.corporateActions?.historicalDividendsCount || 0;
    const currDivCount = currentPackage.corporateActions?.historicalDividendsCount || 0;
    if (currDivCount > prevDivCount) {
      changesSummary.push(`Yeni temettü kararı/dağıtımı eklendi (Toplam ${currDivCount} temettü).`);
    }

    // 4. Factor Direction Changes
    const prevFactors = previousSnapshot.factors || [];
    let factorChanges = 0;

    for (const factor of currentFactors) {
      const match = prevFactors.find(pf => pf.id === factor.id);
      if (!match) {
        factorChanges++;
      } else if (match.impactDirection !== factor.impactDirection) {
        factorChanges++;
        changesSummary.push(`Faktör yönü değişti: "${factor.title}" (${match.impactDirection} -> ${factor.impactDirection}).`);
      }
    }

    // 5. News Delta
    const prevNewsIds = new Set(prevPackage?.relevantNews?.map(n => n.id) || []);
    const newNewsItems = currentPackage.relevantNews?.filter(n => !prevNewsIds.has(n.id)) || [];
    if (newNewsItems.length > 0) {
      changesSummary.push(`${newNewsItems.length} yeni ilgili piyasa haberi dahil edildi.`);
    }

    const hasChanged = changesSummary.length > 0;

    return {
      hasChanged,
      previousSnapshotId: previousSnapshot.id,
      previousTimestamp: previousSnapshot.created_at,
      currentTimestamp: currentPackage.assembledAt,
      priceDiffPercent,
      isNewStatementPeriod,
      newFinancialPeriodEnd: isNewStatementPeriod ? currQuarter : undefined,
      newNewsCount: newNewsItems.length,
      newFactorsCount: factorChanges,
      changesSummary
    };
  }

  /**
   * Attaches AI analysis results to an existing snapshot identified by fingerprint
   */
  public static async attachAIAnalysis(
    fingerprint: string,
    aiAnalysis: any,
    guardrailStatus?: string,
    guardrailReport?: any
  ): Promise<boolean> {
    // 1. Update in-memory store
    const memMatch = inMemorySnapshotStore.find(s => s.fingerprint === fingerprint);
    if (memMatch) {
      memMatch.ai_analysis = aiAnalysis;
      memMatch.status = 'ANALYZED';
      if (guardrailStatus) memMatch.guardrail_status = guardrailStatus as any;
      if (guardrailReport) memMatch.guardrail_report = guardrailReport;
      if (memMatch.data_package) {
        (memMatch.data_package as any).aiAnalysis = aiAnalysis;
        (memMatch.data_package as any).guardrailReport = guardrailReport;
      }
    }

    // 2. Update Supabase if available
    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        // Attempt update with dedicated columns
        const updatePayload: any = {
          ai_analysis: aiAnalysis,
          status: 'ANALYZED'
        };
        if (guardrailStatus) updatePayload.guardrail_status = guardrailStatus;
        if (guardrailReport) updatePayload.guardrail_report = guardrailReport;

        const { error } = await sb
          .from('analysis_snapshots')
          .update(updatePayload)
          .eq('fingerprint', fingerprint);

        if (!error) {
          return true;
        }

        // Fallback: If dedicated columns are missing from PostgreSQL schema,
        // update status and pack aiAnalysis inside data_package JSONB
        const { data: currentRec } = await sb
          .from('analysis_snapshots')
          .select('data_package')
          .eq('fingerprint', fingerprint)
          .maybeSingle();

        if (currentRec?.data_package) {
          const updatedPkg = {
            ...currentRec.data_package,
            aiAnalysis,
            guardrailReport,
            guardrailStatus
          };
          const { error: fallbackErr } = await sb
            .from('analysis_snapshots')
            .update({
              data_package: updatedPkg,
              status: 'ANALYZED'
            })
            .eq('fingerprint', fingerprint);

          if (!fallbackErr) {
            return true;
          }
        }
      } catch (err: any) {
        console.warn('[AnalysisSnapshotService] Supabase update ai_analysis error:', err.message);
      }
    }

    return Boolean(memMatch);
  }
}



