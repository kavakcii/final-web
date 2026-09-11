-- ==============================================================================
-- FİNAİ ANALYSIS SYSTEM: PHASE 8 VERSIONING & HISTORY MIGRATION
-- Migration: 20260911_add_analysis_versioning.sql
--
-- Adds versioning, linked chain (previous_snapshot_id), structured diffs,
-- and causal summaries to public.analysis_snapshots table.
-- Also ensures Phase 7 trigger metadata columns exist and backfills existing records.
-- ==============================================================================

BEGIN;

-- 1. Phase 7 Trigger Metadata Columns (if not already applied)
ALTER TABLE public.analysis_snapshots 
ADD COLUMN IF NOT EXISTS update_reason VARCHAR(64),
ADD COLUMN IF NOT EXISTS trigger_type VARCHAR(64),
ADD COLUMN IF NOT EXISTS trigger_event_id VARCHAR(128),
ADD COLUMN IF NOT EXISTS previous_fingerprint VARCHAR(64);

-- 2. Phase 8 Versioning & History Columns
ALTER TABLE public.analysis_snapshots 
ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS previous_snapshot_id UUID REFERENCES public.analysis_snapshots(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS change_diff JSONB,
ADD COLUMN IF NOT EXISTS change_summary JSONB;

-- 3. High Performance Chronological & Versioned Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_analysis_snapshots_symbol_version 
ON public.analysis_snapshots (symbol, version DESC);

CREATE INDEX IF NOT EXISTS idx_analysis_snapshots_previous_id 
ON public.analysis_snapshots (previous_snapshot_id);

CREATE INDEX IF NOT EXISTS idx_analysis_snapshots_trigger_type 
ON public.analysis_snapshots (symbol, trigger_type);

-- 4. Safe Backfill for Existing Records (extracting metadata from fallback data_package)
UPDATE public.analysis_snapshots
SET 
  version = COALESCE((data_package->>'version')::int, 1),
  previous_snapshot_id = CASE 
    WHEN data_package->>'previousSnapshotId' IS NOT NULL AND data_package->>'previousSnapshotId' ~ '^[0-9a-fA-F-]{36}$'
    THEN (data_package->>'previousSnapshotId')::uuid 
    ELSE NULL 
  END,
  change_diff = COALESCE(change_diff, data_package->'changeDiff'),
  change_summary = COALESCE(change_summary, data_package->'changeSummary'),
  update_reason = COALESCE(update_reason, data_package->>'updateReason'),
  trigger_type = COALESCE(trigger_type, data_package->>'triggerType')
WHERE 
  data_package IS NOT NULL AND (
    data_package->>'version' IS NOT NULL OR 
    data_package->>'updateReason' IS NOT NULL
  );

COMMIT;
