-- Migration: 20260910_add_trigger_metadata_to_snapshots.sql
-- Description: Adds trigger and update metadata columns to public.analysis_snapshots table for Phase 7 Trigger Engine.

BEGIN;

ALTER TABLE public.analysis_snapshots 
ADD COLUMN IF NOT EXISTS update_reason VARCHAR(64),
ADD COLUMN IF NOT EXISTS trigger_type VARCHAR(64),
ADD COLUMN IF NOT EXISTS trigger_event_id VARCHAR(128),
ADD COLUMN IF NOT EXISTS previous_fingerprint VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_analysis_snapshots_trigger_type 
ON public.analysis_snapshots (symbol, trigger_type);

COMMIT;
