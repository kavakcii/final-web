-- ==============================================================================
-- FİNAİ ANALYSIS SYSTEM: ANALYSIS SNAPSHOTS SCHEMA
-- Migration: 20260910_create_analysis_snapshots.sql
-- 
-- Stores immutable point-in-time state of an analyzed BIST asset.
-- Supports:
-- 1. Point-in-time review of exact data package and qualitative factors
-- 2. Deterministic fingerprinting to prevent redundant duplicate snapshots
-- 3. Change detection ("What was the prior analysis -> what data changed -> why did the analysis shift?")
-- ==============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.analysis_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(16) NOT NULL,
    company_name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    snapshot_version INT NOT NULL DEFAULT 1,
    orchestrator_version VARCHAR(32) NOT NULL DEFAULT '1.0.0',
    fingerprint VARCHAR(64) NOT NULL,
    
    -- Structured Payloads
    data_package JSONB NOT NULL,
    factors JSONB NOT NULL,
    source_provenance JSONB NOT NULL,
    data_freshness JSONB NOT NULL,
    data_quality JSONB NOT NULL,
    relevant_events JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    status VARCHAR(32) NOT NULL DEFAULT 'ASSEMBLED'
);

-- Fast lookup by symbol and creation date (Chronological history)
CREATE INDEX IF NOT EXISTS idx_analysis_snapshots_symbol_date 
ON public.analysis_snapshots (symbol, created_at DESC);

-- Fingerprint lookup for deduplication and unchanged state validation
CREATE INDEX IF NOT EXISTS idx_analysis_snapshots_fingerprint 
ON public.analysis_snapshots (symbol, fingerprint);

-- Row Level Security (RLS)
ALTER TABLE public.analysis_snapshots ENABLE ROW LEVEL SECURITY;

-- Read policy: Anyone can read analyzed snapshots
DROP POLICY IF EXISTS "Allow read access to analysis snapshots" ON public.analysis_snapshots;
CREATE POLICY "Allow read access to analysis snapshots"
ON public.analysis_snapshots
FOR SELECT
USING (true);

-- Insert/Update/Delete: Restricted to Service Role (Server-side Orchestrator)
DROP POLICY IF EXISTS "Allow service role management of analysis snapshots" ON public.analysis_snapshots;
CREATE POLICY "Allow service role management of analysis snapshots"
ON public.analysis_snapshots
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');

COMMIT;
