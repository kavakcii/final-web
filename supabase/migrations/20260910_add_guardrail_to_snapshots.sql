-- Migration: 20260910_add_guardrail_to_snapshots.sql

BEGIN;

ALTER TABLE public.analysis_snapshots 
ADD COLUMN IF NOT EXISTS guardrail_status VARCHAR(16) DEFAULT 'PASS',
ADD COLUMN IF NOT EXISTS guardrail_report JSONB;

CREATE INDEX IF NOT EXISTS idx_analysis_snapshots_guardrail_status 
ON public.analysis_snapshots (symbol, guardrail_status);

COMMIT;

