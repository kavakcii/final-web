-- Migration: 20260910_add_ai_analysis_to_snapshots.sql

ALTER TABLE public.analysis_snapshots 
ADD COLUMN IF NOT EXISTS ai_analysis JSONB,
ADD COLUMN IF NOT EXISTS impact_analysis JSONB;

